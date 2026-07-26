import { useCallback, useRef } from "react";
import { Platform } from "react-native";
import { VideoPlayer } from "expo-video";
import { SyncMeta } from "../utils/syncManager";

interface UseAdPlayerHandlersProps {
  player: VideoPlayer;
  playerRef: React.MutableRefObject<VideoPlayer>;
  playlistRef: React.MutableRefObject<any[]>;
  currentIndexRef: React.MutableRefObject<number>;
  syncMetaRef: React.MutableRefObject<SyncMeta | null>;
  clockOffsetRef: React.MutableRefObject<number>;
  slideTimerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
  checkDurationIntervalRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>;
  hasInteractedRef: React.MutableRefObject<boolean>;
  setHasInteracted: (val: boolean) => void;
}

export function useAdPlayerHandlers({
  player,
  playerRef,
  playlistRef,
  currentIndexRef,
  syncMetaRef,
  clockOffsetRef,
  slideTimerRef,
  checkDurationIntervalRef,
  hasInteractedRef,
  setHasInteracted,
}: UseAdPlayerHandlersProps) {
  const safePlay = useCallback((p: typeof player) => {
    const doPlay = () => {
      try {
        const playPromise = p.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch((err: unknown) => {
            const errorObj = err as { name?: string; message?: string };
            if (errorObj?.name === "AbortError") {
              console.log(
                "[Playback] Playback interrupted (AbortError) - safe to ignore.",
              );
            } else {
              console.warn(
                "[Playback] Autoplay block caught:",
                errorObj?.message || String(err),
              );
            }
          });
        }
      } catch (err) {
        console.warn("[Playback] safePlay error:", err);
      }
    };

    const meta = syncMetaRef.current;
    const isFirstItem = currentIndexRef.current === 0;
    if (meta && isFirstItem) {
      const adjustedDeadline = meta.syncPlayDeadline - clockOffsetRef.current;
      const delay = adjustedDeadline - Date.now();
      if (delay > 0) {
        try {
          p.currentTime = 0;
        } catch (_) {
          /* noop */
        }
        setTimeout(doPlay, delay);
        return;
      } else {
        const elapsedSec = Math.abs(delay) / 1000;
        if (elapsedSec < 5) {
          try {
            p.currentTime = elapsedSec;
          } catch (_) {
            /* noop */
          }
        }
      }
    }

    try {
      p.currentTime = 0;
    } catch (_) {
      /* noop */
    }
    doPlay();
  }, [player, syncMetaRef, currentIndexRef, clockOffsetRef]);

  const handleInteraction = useCallback(() => {
    setHasInteracted(true);
    hasInteractedRef.current = true;
    const p = playerRef.current;
    if (p) {
      p.muted = false;
    }
    const pl = playlistRef.current;
    const idx = currentIndexRef.current;
    if (pl.length > 0 && idx < pl.length) {
      const item = pl[idx];
      if (item.type === "video") {
        safePlay(playerRef.current);
      }
    }
  }, [safePlay, setHasInteracted, hasInteractedRef, playerRef, playlistRef, currentIndexRef]);

  const clearSlideTimer = useCallback(() => {
    if (slideTimerRef.current) {
      clearTimeout(slideTimerRef.current);
      slideTimerRef.current = null;
    }
    if (checkDurationIntervalRef.current) {
      clearInterval(checkDurationIntervalRef.current);
      checkDurationIntervalRef.current = null;
    }
  }, [slideTimerRef, checkDurationIntervalRef]);

  return { safePlay, handleInteraction, clearSlideTimer };
}
