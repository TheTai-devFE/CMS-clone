import { useCallback, useRef } from "react";
import { Platform } from "react-native";
import { VideoPlayer } from "expo-video";

interface UseAdPlayerNavigationProps {
  playerRef: React.MutableRefObject<VideoPlayer>;
  playlistRef: React.MutableRefObject<any[]>;
  currentIndexRef: React.MutableRefObject<number>;
  setCurrentIndex: (idx: number) => void;
  currentLoadedUrlRef: React.MutableRefObject<string>;
  isTransitioningRef: React.MutableRefObject<boolean>;
  slideTimerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
  isSleepingRef: React.MutableRefObject<boolean>;
  hasInteractedRef: React.MutableRefObject<boolean>;
  isSyncGroup?: boolean;
  syncMode?: "ntp" | "websocket" | "none";
  clockOffset: number;
  clearSlideTimer: () => void;
  safePlay: (p: VideoPlayer) => void;
}

export function useAdPlayerNavigation({
  playerRef,
  playlistRef,
  currentIndexRef,
  setCurrentIndex,
  currentLoadedUrlRef,
  isTransitioningRef,
  slideTimerRef,
  isSleepingRef,
  hasInteractedRef,
  isSyncGroup,
  syncMode,
  clockOffset,
  clearSlideTimer,
  safePlay,
}: UseAdPlayerNavigationProps) {
  const goToNextRef = useRef<() => void>(() => {});

  const loadItem = useCallback(
    (index: number) => {
      const pl = playlistRef.current;
      const p = playerRef.current;
      if (pl.length === 0 || index < 0 || index >= pl.length) return;

      const item = pl[index];
      clearSlideTimer();

      if (item.type === "video") {
        let isSourceChanged = false;
        if (currentLoadedUrlRef.current !== item.url) {
          console.log(`[Playback] Loading video: ${item.url}`);
          currentLoadedUrlRef.current = item.url;
          isSourceChanged = true;
          try {
            p.replace(item.url);
          } catch (err) {
            console.warn("[Playback] player.replace() error:", err);
          }
        }

        if (isSyncGroup && syncMode === "ntp") {
          const durationMs = (item.duration || 10) * 1000;
          const nowServerTime = Date.now() + clockOffset;
          const targetPosMs = nowServerTime % durationMs;
          try {
            p.currentTime = targetPosMs / 1000;
          } catch (err) {
            console.warn("[Sync Playback] Lỗi tua khi load video:", err);
          }
        }

        if (!isSleepingRef.current && hasInteractedRef.current) {
          if (isSourceChanged && Platform.OS === "web") {
            setTimeout(() => {
              if (currentLoadedUrlRef.current === item.url) {
                safePlay(p);
              }
            }, 250);
          } else {
            safePlay(p);
          }
        }
      } else if (item.type === "image" || item.type === "pdf" || item.type === "url") {
        try {
          p.pause();
        } catch (_) {
          /* noop */
        }
        currentLoadedUrlRef.current = "";
      }

      if (item.type !== "video") {
        const durationMs = (item.duration || 10) * 1000;
        slideTimerRef.current = setTimeout(() => {
          goToNextRef.current();
        }, durationMs);
      } else {
        console.log(`[Playback] Video "${item.url}" — full duration playback via player playToEnd event`);
      }
    },
    [clearSlideTimer, isSyncGroup, clockOffset, syncMode, safePlay],
  );

  const goToNext = useCallback(() => {
    const pl = playlistRef.current;
    if (pl.length === 0) return;

    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    const prevIdx = currentIndexRef.current;
    const nextIdx = (prevIdx + 1) % pl.length;

    if (nextIdx === prevIdx) {
      const item = pl[0];
      clearSlideTimer();
      if (item.type === "video" && hasInteractedRef.current) {
        safePlay(playerRef.current);
        isTransitioningRef.current = false;
        return;
      }
      if (item.type !== "video") {
        const durationMs = (item.duration || 10) * 1000;
        slideTimerRef.current = setTimeout(() => {
          isTransitioningRef.current = false;
          goToNextRef.current();
        }, durationMs);
      } else {
        safePlay(playerRef.current);
      }
      isTransitioningRef.current = false;
      return;
    }

    currentIndexRef.current = nextIdx;
    setCurrentIndex(nextIdx);
    loadItem(nextIdx);

    setTimeout(() => {
      isTransitioningRef.current = false;
    }, 500);
  }, [loadItem, clearSlideTimer, safePlay, setCurrentIndex]);

  goToNextRef.current = goToNext;

  return { loadItem, goToNext, goToNextRef };
}
