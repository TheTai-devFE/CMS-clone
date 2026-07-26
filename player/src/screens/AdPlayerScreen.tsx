import { useVideoPlayer, VideoView } from "expo-video";
import { WebView } from "react-native-webview";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { colors } from "../theme/colors";
import { MediaRenderLayers } from "../components/MediaRenderLayers";
import { useAdPlayerSync } from "../hooks/useAdPlayerSync";
import { useVideoWallCrop } from "../hooks/useVideoWallCrop";
import { useSyncGroupMeta } from "../hooks/useSyncGroupMeta";
import { useAdPlayerHandlers } from "../hooks/useAdPlayerHandlers";
import { useAdPlayerNavigation } from "../hooks/useAdPlayerNavigation";
import {
  fetchSyncTime,
  getLocalSyncMeta,
  PlayerPlaylistItem,
  SyncMeta,
} from "../utils/syncManager";

interface AdPlayerScreenProps {
  isLandscape: boolean;
  onRelaunchRequest?: () => void;
  isSleeping?: boolean;
  playlist: PlayerPlaylistItem[];
  // Sync group (video wall) — optional, chỉ dùng khi playlist là sync group
  deviceId?: string | null;
  isSyncGroup?: boolean;
  syncLayout?: { videoWall?: { rows: number; cols: number } } | null;
  clockOffset?: number;
  syncMode?: "ntp" | "websocket" | "none";
  serverIp?: string;
  serverPort?: string;
}

/**
 * AdPlayerScreen — Ref-based playback architecture
 *
 * Design principle: ZERO state-driven effects for playback logic.
 * Only `currentIndex` exists as React state (for rendering the correct media).
 * All transitions, timers, and player commands go through refs + imperative calls.
 * This prevents the infinite loop caused by:
 *   - expo-video's internal setState triggering re-renders
 *   - Image onLoadStart/onLoadEnd setState cascades
 *   - Object-reference churn in useEffect dependency arrays
 */
function AdPlayerScreen({
  isLandscape,
  isSleeping,
  playlist,
  deviceId,
  isSyncGroup,
  syncLayout,
  clockOffset = 0,
  syncMode = "ntp",
  serverIp = "localhost",
  serverPort = "3000",
}: AdPlayerScreenProps) {
  // === SINGLE render state — only updated when slide index changes ===
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(Platform.OS !== "web");

  // === Video Wall & Group Sync Logic ===
  const { mySlotIndex, videoWallCrop } = useVideoWallCrop({
    isSyncGroup,
    syncLayout,
    deviceId,
  });

  // Lọc playlist: Chỉ phát phần video cắt của chính thiết bị này trên Video Wall
  const filteredPlaylist = React.useMemo(() => {
    if (isSyncGroup && mySlotIndex !== null && playlist.length > 0) {
      const matched = playlist.filter((item) => item.sortOrder === mySlotIndex);
      if (matched.length > 0) {
        console.log(`[Video Wall] Player slot ${mySlotIndex}: Đã lọc playlist còn ${matched.length} phần cắt.`);
        return matched;
      }
    }
    return playlist;
  }, [playlist, mySlotIndex, isSyncGroup]);

  // Tạo roomId duy nhất cho nhóm bằng cách ghép và sort tất cả deviceId trong syncLayout
  const roomId = React.useMemo(() => {
    if (!isSyncGroup || !syncLayout) return null;
    let parsedLayout = syncLayout;
    if (typeof syncLayout === "string") {
      try {
        parsedLayout = JSON.parse(syncLayout);
      } catch (e) {
        return null;
      }
    }
    const deviceMapping = parsedLayout.deviceMapping;
    if (!deviceMapping || typeof deviceMapping !== "object") return null;

    const deviceIds: string[] = [];
    for (const slotKey in deviceMapping) {
      const val = deviceMapping[slotKey];
      if (Array.isArray(val)) {
        deviceIds.push(...val);
      } else if (typeof val === "string") {
        deviceIds.push(val);
      }
    }
    const id = "room_" + deviceIds.sort().join("_");
    console.log("[WebSocket Sync] roomId được tạo từ syncLayout:", id);
    return id;
  }, [isSyncGroup, syncLayout]);

  // === Refs — mutable state that does NOT trigger re-renders ===
  const currentIndexRef = useRef(0);
  const playlistRef = useRef(filteredPlaylist);
  const isSleepingRef = useRef(isSleeping);
  const slideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTransitioningRef = useRef(false);
  const currentLoadedUrlRef = useRef("");
  const hasInitializedRef = useRef(false);
  const hasInteractedRef = useRef(Platform.OS !== "web");
  const clockOffsetRef = useRef(clockOffset);

  // Keep refs in sync with latest props (cheap assignment, no re-render)
  playlistRef.current = filteredPlaylist;
  isSleepingRef.current = isSleeping;
  clockOffsetRef.current = clockOffset;

  // === SYNC GROUP: load meta từ AsyncStorage + periodic re-sync mỗi 60s ===
  const { syncMetaRef, syncStartedAtRef } = useSyncGroupMeta({
    isSyncGroup,
    deviceId,
    clockOffsetRef,
  });

  // === Video player — stable instance from expo-video ===
  const player = useVideoPlayer(null as any, (p) => {
    p.loop = false;
    // Mute on Web by default to prevent autoplay blocking during initialization
    p.muted = Platform.OS === "web";
    // Emit timeUpdate mỗi 0.5s — dùng làm fallback detect video end (T12 fix)
    p.timeUpdateEventInterval = 0.5;
  });
  const playerRef = useRef(player);
  playerRef.current = player;

  // Enable loop mode for Video Wall sync or single-item video playlists
  useEffect(() => {
    const pl = playlistRef.current;
    const isSingleVideo = pl.length === 1 && pl[0].type === "video";
    if ((isSyncGroup && videoWallCrop) || isSingleVideo) {
      player.loop = true;
    } else {
      player.loop = false;
    }
  }, [isSyncGroup, videoWallCrop, player, filteredPlaylist]);

  const checkDurationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // === Safe play / clear timer / interaction handlers hook ===
  const { safePlay, handleInteraction, clearSlideTimer } = useAdPlayerHandlers({
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
  });

  // === Core: load item & advance slide navigation hook ===
  const { loadItem, goToNext, goToNextRef } = useAdPlayerNavigation({
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
  });

  // === Effect: initial load when playlist first becomes available ===
  useEffect(() => {
    if (filteredPlaylist.length > 0 && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      currentIndexRef.current = 0;
      setCurrentIndex(0);
      // Tiny delay to let mount settle before loading media
      const t = setTimeout(() => loadItem(0), 150);
      return () => clearTimeout(t);
    }
    // Reset initialization when playlist goes empty
    if (filteredPlaylist.length === 0) {
      hasInitializedRef.current = false;
      clearSlideTimer();
    }
  }, [filteredPlaylist.length, loadItem, clearSlideTimer]);

  // === Effect: detect playlist content change (not just length) ===
  const playlistHashRef = useRef("");
  useEffect(() => {
    const hash = filteredPlaylist.map((item) => item.url).join("|");
    if (hash !== playlistHashRef.current && playlistHashRef.current !== "") {
      // Playlist content changed — reload from beginning
      playlistHashRef.current = hash;
      currentIndexRef.current = 0;
      setCurrentIndex(0);
      if (filteredPlaylist.length > 0) {
        currentLoadedUrlRef.current = ""; // Force reload
        const t = setTimeout(() => loadItem(0), 150);
        return () => clearTimeout(t);
      }
    } else {
      playlistHashRef.current = hash;
    }
  }, [filteredPlaylist, loadItem]);

  // === Effect: video playToEnd listener (empty deps — player instance is stable) ===
  useEffect(() => {
    const p = playerRef.current;
    const subscription = p.addListener("playToEnd", () => {
      if (p.currentTime > 0.5) {
        console.log("[Playback] Video ended naturally, advancing");
        clearSlideTimer();
        goToNextRef.current();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // === timeUpdate fallback ===
  useEffect(() => {
    const p = playerRef.current;
    const subscription = p.addListener("timeUpdate", ({ currentTime }) => {
      try {
        if (
          p.duration > 0 &&
          currentTime > 0.5 &&
          currentTime >= p.duration - 0.5 &&
          !isTransitioningRef.current
        ) {
          console.log(
            `[Playback] timeUpdate detected end: ${currentTime.toFixed(2)}s / ${p.duration.toFixed(2)}s`,
          );
          clearSlideTimer();
          goToNextRef.current();
        }
      } catch (err) {
        console.warn("[Playback] timeUpdate error:", err);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // === Effect: sleep state changes ===
  useEffect(() => {
    const p = playerRef.current;
    if (isSleeping) {
      try {
        p.pause();
      } catch (_) {
        /* noop */
      }
      clearSlideTimer();
    } else {
      const pl = playlistRef.current;
      const idx = currentIndexRef.current;
      if (pl.length > 0 && idx < pl.length) {
        const item = pl[idx];
        if (item.type === "video" && hasInteractedRef.current) {
          safePlay(p);
        }
        if (item.type !== "video") {
          clearSlideTimer();
          const durationMs = (item.duration || 10) * 1000;
          slideTimerRef.current = setTimeout(() => {
            goToNextRef.current();
          }, durationMs);
        }
      }
    }
  }, [isSleeping, clearSlideTimer, safePlay]);

  // === Cleanup on unmount ===
  useEffect(() => {
    return () => {
      clearSlideTimer();
    };
  }, [clearSlideTimer]);

  // === Ensure index stays in bounds when playlist shrinks ===
  useEffect(() => {
    if (filteredPlaylist.length > 0 && currentIndex >= filteredPlaylist.length) {
      const safeIdx = 0;
      currentIndexRef.current = safeIdx;
      setCurrentIndex(safeIdx);
    }
  }, [filteredPlaylist.length, currentIndex]);

  const safeIdx =
    filteredPlaylist.length > 0 ? Math.min(currentIndex, filteredPlaylist.length - 1) : -1;
  const currentItem = safeIdx >= 0 ? filteredPlaylist[safeIdx] : null;

  // === Custom Sync Hook (NTP drift correction + rejection handling) ===
  useAdPlayerSync({
    isSyncGroup,
    currentItem,
    clockOffset,
    isSleeping,
    syncMode,
    player,
  });

  // ===== RENDER =====

  if (Platform.OS === "web" && !hasInteracted) {
    return (
      <EmptyPlayerOverlay
        isWebInteractionRequired
        onPressInteraction={handleInteraction}
      />
    );
  }

  if (!currentItem || filteredPlaylist.length === 0) {
    return <EmptyPlayerOverlay />;
  }

  return (
    <View style={styles.container}>

      <MediaRenderLayers
        currentItem={currentItem}
        player={player}
        videoWallCrop={videoWallCrop}
      />
    </View>
  );
}

// === React.memo with deep comparison on playlist URLs ===
function arePropsEqual(
  prev: AdPlayerScreenProps,
  next: AdPlayerScreenProps,
): boolean {
  if (prev.isLandscape !== next.isLandscape) return false;
  if (prev.isSleeping !== next.isSleeping) return false;
  if (prev.deviceId !== next.deviceId) return false;
  if (prev.isSyncGroup !== next.isSyncGroup) return false;
  if (prev.clockOffset !== next.clockOffset) return false;
  if (prev.syncMode !== next.syncMode) return false;
  if (prev.serverIp !== next.serverIp) return false;
  if (prev.serverPort !== next.serverPort) return false;
  if (JSON.stringify(prev.syncLayout) !== JSON.stringify(next.syncLayout)) return false;
  if (prev.playlist.length !== next.playlist.length) return false;
  for (let i = 0; i < prev.playlist.length; i++) {
    if (prev.playlist[i]?.url !== next.playlist[i]?.url) return false;
    if (prev.playlist[i]?.type !== next.playlist[i]?.type) return false;
  }
  return true;
}

export default React.memo(AdPlayerScreen, arePropsEqual);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    position: "relative",
  },
});
