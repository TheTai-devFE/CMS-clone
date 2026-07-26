import { useRef, useEffect } from "react";
import { Platform } from "react-native";
import { VideoPlayer } from "expo-video";
import { PlayerPlaylistItem } from "../utils/syncManager";

interface UseAdPlayerSyncProps {
  isSyncGroup?: boolean;
  currentItem: PlayerPlaylistItem | null;
  clockOffset: number;
  isSleeping?: boolean;
  syncMode?: "ntp" | "websocket" | "none";
  player: VideoPlayer;
}

export function useAdPlayerSync({
  isSyncGroup,
  currentItem,
  clockOffset,
  isSleeping,
  syncMode,
  player,
}: UseAdPlayerSyncProps) {
  const lastSeekTimeRef = useRef(0);

  // === Effect: Global unhandled rejection handler to silence harmless Web video AbortErrors ===
  useEffect(() => {
    if (Platform.OS !== "web") return;

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason as { name?: string; message?: string } | undefined;
      if (
        reason &&
        (reason.name === "AbortError" ||
          (reason.message && reason.message.includes("play() request was interrupted")) ||
          (reason.message && reason.message.includes("user didn't interact with the document first")))
      ) {
        event.preventDefault();
        console.log(
          `[Playback] Ignored harmless browser video error: ${reason.message || reason.name}`,
        );
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  // === Effect: Drift Correction (NTP Precision Sync) ===
  useEffect(() => {
    if (syncMode !== "ntp") return;
    if (!isSyncGroup || !currentItem || currentItem.type !== "video" || isSleeping) return;

    if (!player) return;

    const checkDrift = () => {
      if (Date.now() - lastSeekTimeRef.current < 5000) {
        return;
      }
      try {
        const actualDurationSec = player.duration;
        if (!actualDurationSec || actualDurationSec <= 0) return;
        const durationMs = actualDurationSec * 1000;

        const nowServerTime = Date.now() + clockOffset;
        const targetPosMs = nowServerTime % durationMs;
        const targetPosSec = targetPosMs / 1000;

        const currentPosSec = player.currentTime;
        const diff = Math.abs(currentPosSec - targetPosSec);

        if (diff > 0.5) {
          console.log(`[Drift Correction] Lệch pha phát hiện: thực tế=${currentPosSec.toFixed(3)}s, chuẩn=${targetPosSec.toFixed(3)}s, lệch=${diff.toFixed(3)}s. Tiến hành tua...`);
          lastSeekTimeRef.current = Date.now();
          player.currentTime = targetPosSec;
        }
      } catch (err) {
        console.warn("[Sync Playback] Lỗi kiểm tra lệch pha (Drift Correction):", err);
      }
    };

    checkDrift();
    const intervalId = setInterval(checkDrift, 1500);

    return () => clearInterval(intervalId);
  }, [isSyncGroup, currentItem, clockOffset, isSleeping, syncMode, player]);
}
