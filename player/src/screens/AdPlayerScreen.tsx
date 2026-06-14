import { useVideoPlayer, VideoView } from "expo-video";
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
import { PlayerPlaylistItem } from "../utils/syncManager";

interface AdPlayerScreenProps {
  isLandscape: boolean;
  onRelaunchRequest?: () => void;
  isSleeping?: boolean;
  playlist: PlayerPlaylistItem[];
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
}: AdPlayerScreenProps) {
  // === SINGLE render state — only updated when slide index changes ===
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(Platform.OS !== "web");

  // === Refs — mutable state that does NOT trigger re-renders ===
  const currentIndexRef = useRef(0);
  const playlistRef = useRef(playlist);
  const isSleepingRef = useRef(isSleeping);
  const slideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTransitioningRef = useRef(false);
  const currentLoadedUrlRef = useRef("");
  const hasInitializedRef = useRef(false);
  const hasInteractedRef = useRef(Platform.OS !== "web");

  // Keep refs in sync with latest props (cheap assignment, no re-render)
  playlistRef.current = playlist;
  isSleepingRef.current = isSleeping;

  // === Video player — stable instance from expo-video ===
  const player = useVideoPlayer(null as any, (p) => {
    p.loop = false;
    // Mute on Web by default to prevent autoplay blocking during initialization
    p.muted = Platform.OS === "web";
  });
  const playerRef = useRef(player);
  playerRef.current = player;

  // Safe helper to play video and catch browser autoplay blocking rejections
  const safePlay = useCallback((p: any) => {
    try {
      p.currentTime = 0;
      const playPromise = p.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch((err: any) => {
          if (err.name === "AbortError") {
            console.log(
              "[Playback] Playback interrupted (AbortError) - safe to ignore.",
            );
          } else {
            console.warn("[Playback] Autoplay block caught:", err.message);
          }
        });
      }
    } catch (err) {
      console.warn("[Playback] safePlay error:", err);
    }
  }, []);

  const handleInteraction = useCallback(() => {
    setHasInteracted(true);
    hasInteractedRef.current = true;
    const p = playerRef.current;
    if (p) {
      p.muted = false;
    }
    // Play video immediately if the current slide is a video
    const pl = playlistRef.current;
    const idx = currentIndexRef.current;
    if (pl.length > 0 && idx < pl.length) {
      const item = pl[idx];
      if (item.type === "video") {
        safePlay(playerRef.current);
      }
    }
  }, [safePlay]);

  // === Utility: clear the slide timer ===
  const clearSlideTimer = useCallback(() => {
    if (slideTimerRef.current) {
      clearTimeout(slideTimerRef.current);
      slideTimerRef.current = null;
    }
  }, []);

  // === Core: advance to next item (forward declaration via ref) ===
  const goToNextRef = useRef<() => void>(() => {});

  // === Core: load media at a given index (purely imperative) ===
  const loadItem = useCallback(
    (index: number) => {
      const pl = playlistRef.current;
      const p = playerRef.current;
      if (pl.length === 0 || index < 0 || index >= pl.length) return;

      const item = pl[index];
      clearSlideTimer();

      if (item.type === "video") {
        let isSourceChanged = false;
        // Only call replace() when URL genuinely changed — prevents spurious playToEnd
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
        if (!isSleepingRef.current && hasInteractedRef.current) {
          if (isSourceChanged && Platform.OS === "web") {
            // Delay play call on Web to allow source initialization and prevent AbortError
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

      // Duration-based timer to advance to next slide
      const duration = item.duration || 10000;
      slideTimerRef.current = setTimeout(() => {
        goToNextRef.current();
      }, duration);
    },
    [clearSlideTimer],
  );

  // === Core: transition to next slide ===
  const goToNext = useCallback(() => {
    const pl = playlistRef.current;
    if (pl.length === 0) return;

    // Transition gate — prevent re-entry
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    const prevIdx = currentIndexRef.current;
    const nextIdx = (prevIdx + 1) % pl.length;

    if (nextIdx === prevIdx) {
      // Single-item playlist — replay without state change
      const item = pl[0];
      clearSlideTimer();
      if (item.type === "video" && hasInteractedRef.current) {
        safePlay(playerRef.current);
      }
      // Restart timer
      slideTimerRef.current = setTimeout(() => {
        isTransitioningRef.current = false;
        goToNextRef.current();
      }, item.duration || 10000);
      isTransitioningRef.current = false;
      return;
    }

    // Multi-item playlist — update index and load new item
    currentIndexRef.current = nextIdx;
    setCurrentIndex(nextIdx); // Single state update → re-render with new slide
    loadItem(nextIdx);

    // Release gate after settling
    setTimeout(() => {
      isTransitioningRef.current = false;
    }, 500);
  }, [loadItem, clearSlideTimer]);

  // Wire up the ref so loadItem's timer can call goToNext
  goToNextRef.current = goToNext;

  // === Effect: initial load when playlist first becomes available ===
  useEffect(() => {
    if (playlist.length > 0 && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      currentIndexRef.current = 0;
      setCurrentIndex(0);
      // Tiny delay to let mount settle before loading media
      const t = setTimeout(() => loadItem(0), 150);
      return () => clearTimeout(t);
    }
    // Reset initialization when playlist goes empty
    if (playlist.length === 0) {
      hasInitializedRef.current = false;
      clearSlideTimer();
    }
  }, [playlist.length, loadItem, clearSlideTimer]);

  // === Effect: detect playlist content change (not just length) ===
  const playlistHashRef = useRef("");
  useEffect(() => {
    const hash = playlist.map((item) => item.url).join("|");
    if (hash !== playlistHashRef.current && playlistHashRef.current !== "") {
      // Playlist content changed — reload from beginning
      playlistHashRef.current = hash;
      currentIndexRef.current = 0;
      setCurrentIndex(0);
      if (playlist.length > 0) {
        currentLoadedUrlRef.current = ""; // Force reload
        const t = setTimeout(() => loadItem(0), 150);
        return () => clearTimeout(t);
      }
    } else {
      playlistHashRef.current = hash;
    }
  }, [playlist, loadItem]);

  // === Effect: Global unhandled rejection handler to silence harmless Web video AbortErrors ===
  useEffect(() => {
    if (Platform.OS !== "web") return;

    const handleUnhandledRejection = (event: any) => {
      const reason = event.reason;
      if (
        reason &&
        (reason.name === "AbortError" ||
          (reason.message && reason.message.includes("play() request was interrupted")) ||
          (reason.message && reason.message.includes("user didn't interact with the document first")))
      ) {
        event.preventDefault(); // Prevent red warning in browser console
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

  // === Effect: video playToEnd listener (empty deps — player instance is stable) ===
  useEffect(() => {
    const p = playerRef.current;
    const subscription = p.addListener("playToEnd", () => {
      // Only advance if video actually played (filter spurious events from replace())
      if (p.currentTime > 0.5) {
        console.log("[Playback] Video ended naturally, advancing");
        clearSlideTimer(); // Cancel fallback timer
        goToNextRef.current();
      }
    });

    return () => {
      subscription.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty — player is stable, goToNextRef is a ref

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
      // Resume playback for current item
      const pl = playlistRef.current;
      const idx = currentIndexRef.current;
      if (pl.length > 0 && idx < pl.length) {
        const item = pl[idx];
        if (item.type === "video" && hasInteractedRef.current) {
          safePlay(p);
        }
        // Restart duration timer
        clearSlideTimer();
        slideTimerRef.current = setTimeout(() => {
          goToNextRef.current();
        }, item.duration || 10000);
      }
    }
  }, [isSleeping, clearSlideTimer]);

  // === Cleanup on unmount ===
  useEffect(() => {
    return () => {
      clearSlideTimer();
    };
  }, [clearSlideTimer]);

  // === Ensure index stays in bounds when playlist shrinks ===
  useEffect(() => {
    if (playlist.length > 0 && currentIndex >= playlist.length) {
      const safeIdx = 0;
      currentIndexRef.current = safeIdx;
      setCurrentIndex(safeIdx);
    }
  }, [playlist.length, currentIndex]);

  // === Derive current item for rendering (computation only, no state) ===
  const safeIdx =
    playlist.length > 0 ? Math.min(currentIndex, playlist.length - 1) : -1;
  const currentItem = safeIdx >= 0 ? playlist[safeIdx] : null;

  // ===== RENDER =====



  if (Platform.OS === "web" && !hasInteracted) {
    return (
      <TouchableWithoutFeedback onPress={handleInteraction}>
        <View style={styles.interactionOverlay}>
          <View style={styles.interactionIconCircle}>
            <Text style={styles.interactionIconText}>🔊</Text>
          </View>
          <Text style={styles.interactionTitle}>Nhấp để kích hoạt âm thanh</Text>
          <Text style={styles.interactionSubtitle}>
            Trình duyệt yêu cầu tương tác của người dùng để phát video có âm thanh. Nhấp vào bất kỳ đâu để bắt đầu trình chiếu.
          </Text>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  if (!currentItem || playlist.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Text style={styles.emptyIconText}>📺</Text>
        </View>
        <Text style={styles.emptyTitle}>Chưa có nội dung trình chiếu</Text>
        <Text style={styles.emptySubtitle}>
          Thiết bị hiện đang ở chế độ chờ. Vui lòng liên kết thiết bị với CMS và
          gán lịch phát để cập nhật nội dung.
        </Text>
        <Text style={styles.emptyHint}>
          Chạm vào màn hình để mở bảng cấu hình
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Image layer — only mounted when current item is image */}
      {currentItem.type === "image" && (
        <View style={styles.mediaContainer}>
          <Image
            source={{ uri: currentItem.url }}
            style={styles.media}
            resizeMode="contain"
            // No onLoadStart/onLoadEnd — these cause setState loops on Web
          />
        </View>
      )}

      {/* Video layer — only mounted when current item is video */}
      {currentItem.type === "video" && (
        <View style={styles.mediaContainer}>
          <VideoView
            player={player}
            style={styles.media}
            nativeControls={false}
            contentFit="contain"
          />
        </View>
      )}

      {/* PDF layer — mounted when current item is PDF */}
      {currentItem.type === "pdf" && (
        <View style={styles.mediaContainer}>
          {Platform.OS === "web" ? (
            <iframe
              src={currentItem.url}
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                backgroundColor: "#000000",
              }}
              title="PDF Viewer"
            />
          ) : (
            <View style={styles.fallbackContainer}>
              <Text style={styles.fallbackText}>📄 Đang hiển thị tài liệu PDF</Text>
              <Text style={styles.fallbackSub}>{currentItem.url}</Text>
            </View>
          )}
        </View>
      )}

      {/* Web URL layer — mounted when current item is Web URL */}
      {currentItem.type === "url" && (
        <View style={styles.mediaContainer}>
          {Platform.OS === "web" ? (
            <iframe
              src={currentItem.url}
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                backgroundColor: "#000000",
              }}
              title="Web URL Viewer"
            />
          ) : (
            <View style={styles.fallbackContainer}>
              <Text style={styles.fallbackText}>🌐 Đang hiển thị trang Web</Text>
              <Text style={styles.fallbackSub}>{currentItem.url}</Text>
            </View>
          )}
        </View>
      )}
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
  if (prev.playlist.length !== next.playlist.length) return false;
  for (let i = 0; i < prev.playlist.length; i++) {
    if (prev.playlist[i]?.url !== next.playlist[i]?.url) return false;
    if (prev.playlist[i]?.type !== next.playlist[i]?.type) return false;
  }
  return true;
}

export default React.memo(AdPlayerScreen, arePropsEqual);

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    backgroundColor: "#0a0f1d",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyIconText: {
    fontSize: 40,
  },
  emptyTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  emptySubtitle: {
    color: "rgba(255, 255, 255, 0.45)",
    fontSize: 14,
    textAlign: "center",
    maxWidth: 420,
    lineHeight: 22,
    marginBottom: 32,
  },
  emptyHint: {
    color: colors.success,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.15)",
    textTransform: "uppercase",
  },
  container: {
    flex: 1,
    backgroundColor: "#000000",
    position: "relative",
  },
  mediaContainer: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  media: {
    width: "100%",
    height: "100%",
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#0d1117",
    width: "100%",
    height: "100%",
  },
  fallbackText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  fallbackSub: {
    color: "rgba(255, 255, 255, 0.45)",
    fontSize: 12,
    textAlign: "center",
    maxWidth: "80%",
  },
  interactionOverlay: {
    flex: 1,
    backgroundColor: "#0a0f1d",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  interactionIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(59, 130, 246, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  interactionIconText: {
    fontSize: 40,
  },
  interactionTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  interactionSubtitle: {
    color: "rgba(255, 255, 255, 0.45)",
    fontSize: 14,
    textAlign: "center",
    maxWidth: 420,
    lineHeight: 22,
  },
});
