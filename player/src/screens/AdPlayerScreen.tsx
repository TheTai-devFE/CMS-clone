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
import io from "socket.io-client";
import { colors } from "../theme/colors";
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
  // Tìm slot index của thiết bị này trong ma trận Video Wall
  const mySlotIndex = React.useMemo(() => {
    console.log("[Video Wall Debug] deviceId:", deviceId);
    console.log("[Video Wall Debug] isSyncGroup:", isSyncGroup);
    console.log("[Video Wall Debug] syncLayout (type):", typeof syncLayout);
    console.log("[Video Wall Debug] syncLayout:", syncLayout);

    if (!isSyncGroup || !syncLayout || !deviceId) return null;

    let parsedLayout = syncLayout;
    if (typeof syncLayout === "string") {
      try {
        parsedLayout = JSON.parse(syncLayout);
      } catch (e) {
        console.error("[Video Wall Debug] Không thể parse syncLayout:", e);
        return null;
      }
    }

    const deviceMapping = parsedLayout.deviceMapping;
    if (!deviceMapping || typeof deviceMapping !== "object") {
      console.log("[Video Wall Debug] deviceMapping không hợp lệ");
      return null;
    }

    for (const slotKey in deviceMapping) {
      const val = deviceMapping[slotKey];
      if (Array.isArray(val)) {
        if (val.includes(deviceId)) {
          const slot = parseInt(slotKey, 10);
          console.log("[Video Wall Debug] Thiết bị được gán ô số:", slot);
          return slot;
        }
      } else if (val === deviceId) {
        const slot = parseInt(slotKey, 10);
        console.log("[Video Wall Debug] Thiết bị được gán ô số:", slot);
        return slot;
      }
    }
    console.log("[Video Wall Debug] Không tìm thấy deviceId này trong deviceMapping");
    return null;
  }, [isSyncGroup, syncLayout, deviceId]);

  // CSS Viewport Crop: Calculate row/col position for this device's slot
  const videoWallCrop = React.useMemo(() => {
    if (!isSyncGroup || mySlotIndex === null || !syncLayout) return null;

    let parsedLayout = syncLayout;
    if (typeof syncLayout === "string") {
      try {
        parsedLayout = JSON.parse(syncLayout);
      } catch (e) {
        return null;
      }
    }

    const videoWall = parsedLayout.videoWall;
    if (!videoWall) return null;

    const { rows, cols } = videoWall;
    if (!rows || !cols) return null;

    const row = Math.floor((mySlotIndex - 1) / cols);
    const col = (mySlotIndex - 1) % cols;

    const cropObj = {
      rows,
      cols,
      row,
      col,
      mediaWidth: `${cols * 100}%`,
      mediaHeight: `${rows * 100}%`,
      left: `${-col * 100}%`,
      top: `${-row * 100}%`,
    };
    console.log("[Video Wall Debug] Tính toán CSS crop thành công:", cropObj);
    return cropObj;
  }, [isSyncGroup, mySlotIndex, syncLayout]);

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
  const syncStartedAtRef = useRef<number | null>(null);
  const syncMetaRef = useRef<SyncMeta | null>(null);
  const periodicSyncTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const clockOffsetRef = useRef(clockOffset);
  const lastSeekTimeRef = useRef(0);
  const socketRef = useRef<any>(null);
  const checkDurationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep refs in sync with latest props (cheap assignment, no re-render)
  playlistRef.current = filteredPlaylist;
  isSleepingRef.current = isSleeping;
  clockOffsetRef.current = clockOffset;

  // === SYNC GROUP: load meta từ AsyncStorage + periodic re-sync mỗi 60s ===
  useEffect(() => {
    if (!isSyncGroup) return;

    let cancelled = false;
    (async () => {
      const meta = await getLocalSyncMeta();
      if (cancelled) return;
      syncMetaRef.current = meta;
      if (meta) {
        // Cộng clockOffset để ra "server time" tương ứng tại local
        const adjustedDeadline = meta.syncPlayDeadline - clockOffsetRef.current;
        const delayMs = adjustedDeadline - Date.now();
        console.log(
          `[SyncGroup] Loaded meta: deadline in ${delayMs}ms (offset=${clockOffsetRef.current}ms)`,
        );
        // Lưu thời điểm bắt đầu sync (server time) để tính offset drift sau này
        syncStartedAtRef.current = adjustedDeadline;
      }
    })();

    // Periodic re-sync mỗi 60s
    periodicSyncTimerRef.current = setInterval(async () => {
      const meta = syncMetaRef.current;
      if (!meta) return;
      // Đọc thông tin server + device từ AsyncStorage
      const [serverIp, serverPort, storedDeviceId, apiKey] = await Promise.all([
        AsyncStorage.getItem("serverIp"),
        AsyncStorage.getItem("serverPort"),
        AsyncStorage.getItem("deviceId"),
        AsyncStorage.getItem("apiKey"),
      ]);
      if (!serverIp || !serverPort || !storedDeviceId || !apiKey) return;

      const refreshed = await fetchSyncTime(
        serverIp,
        serverPort,
        storedDeviceId,
        apiKey,
        meta.playlistId,
      );
      if (refreshed && refreshed.syncPlayDeadline) {
        const newMeta: SyncMeta = {
          playlistId: meta.playlistId,
          serverTime: refreshed.serverTime,
          syncPlayDeadline: refreshed.syncPlayDeadline,
        };
        syncMetaRef.current = newMeta;
        // Cập nhật clock offset
        clockOffsetRef.current = refreshed.serverTime - Date.now();
      }
    }, 60_000);

    return () => {
      cancelled = true;
      if (periodicSyncTimerRef.current) {
        clearInterval(periodicSyncTimerRef.current);
        periodicSyncTimerRef.current = null;
      }
    };
  }, [isSyncGroup, deviceId]);

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

  // Safe helper to play video and catch browser autoplay blocking rejections
  const safePlay = useCallback((p: any) => {
    const doPlay = () => {
      try {
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
    };

    // SYNC GROUP: nếu là item[0] và có deadline, đợi đến deadline rồi play
    // (chỉ áp dụng cho item đầu tiên — sau đó mỗi device tự theo duration)
    const meta = syncMetaRef.current;
    const isFirstItem = currentIndexRef.current === 0;
    if (meta && isFirstItem) {
      const adjustedDeadline = meta.syncPlayDeadline - clockOffsetRef.current;
      const delay = adjustedDeadline - Date.now();
      if (delay > 0) {
        console.log(
          `[SyncGroup] Waiting ${delay}ms for sync deadline (item 0)`,
        );
        // Seek về 0 trước, rồi đợi
        try {
          p.currentTime = 0;
        } catch (_) {
          /* noop */
        }
        setTimeout(doPlay, delay);
        return;
      } else {
        // Đã quá deadline — tính elapsed time để seek bù
        const elapsedSec = Math.abs(delay) / 1000;
        if (elapsedSec < 5) {
          // Chỉ bù nếu lệch ít, tránh seek giữa chừng gây giật
          try {
            p.currentTime = elapsedSec;
            console.log(
              `[SyncGroup] Late by ${delay}ms, seeking to ${elapsedSec}s`,
            );
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
    if (checkDurationIntervalRef.current) {
      clearInterval(checkDurationIntervalRef.current);
      checkDurationIntervalRef.current = null;
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

        // Tự động tua đến vị trí chuẩn tuyệt đối ngay lập tức khi bắt đầu load (chỉ với NTP)
        if (isSyncGroup && syncMode === "ntp") {
          // T12 FIX: item.duration từ backend là GIÂY, cần * 1000 để ra ms
          const durationMs = (item.duration || 10) * 1000;
          const nowServerTime = Date.now() + clockOffset;
          const targetPosMs = nowServerTime % durationMs;
          try {
            p.currentTime = targetPosMs / 1000;
            console.log(`[Sync Playback] Tua ngay lập tức khi load video đến vị trí: ${(targetPosMs / 1000).toFixed(3)}s`);
          } catch (err) {
            console.warn("[Sync Playback] Lỗi tua khi load video:", err);
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

      // ============================================================
      // T12 FIX: Bỏ duration polling phức tạp. Dùng player events
      // (playToEnd + timeUpdate) làm primary để advance slide.
      // Chỉ set slide timer cho non-video (image/PDF/url).
      // ============================================================
      if (item.type !== "video") {
        // Backend lưu duration theo GIÂY (xem playlist.service.ts:148).
        // Item.duration = 10 nghĩa là 10 giây, không phải 10ms.
        // Nhân 1000 để chuyển sang milliseconds cho setTimeout.
        const durationMs = (item.duration || 10) * 1000;
        slideTimerRef.current = setTimeout(() => {
          goToNextRef.current();
        }, durationMs);
      } else {
        // Video: KHÔNG dùng item.duration (đơn vị không đáng tin).
        // Dùng playToEnd event + timeUpdate listener (xem useEffect bên dưới).
        console.log(`[Playback] Video "${item.url}" — using player events for end detection`);
      }
    },
    [clearSlideTimer, isSyncGroup, clockOffset],
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
        // Video có loop = true native nên ta không cần đặt lại slideTimer nữa
        safePlay(playerRef.current);
        isTransitioningRef.current = false;
        return;
      }
      // T12 FIX: Restart timer chỉ dành cho ảnh/pdf/url.
      // Backend lưu duration theo GIÂY, cần * 1000 cho setTimeout.
      // Video single-item thì dùng player.loop (đã set ở useEffect loop mode).
      if (item.type !== "video") {
        const durationMs = (item.duration || 10) * 1000;
        slideTimerRef.current = setTimeout(() => {
          isTransitioningRef.current = false;
          goToNextRef.current();
        }, durationMs);
      } else {
        // Video đơn lẻ: replay bằng safePlay (player.loop = true cũng đảm bảo loop)
        safePlay(playerRef.current);
      }
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

  // === T12 FIX: timeUpdate fallback — phát hiện video gần hết qua currentTime ===
  // playToEnd event đôi khi không fire trên một số nền tảng (đặc biệt Web).
  // timeUpdate polling mỗi 0.5s sẽ so sánh currentTime với duration,
  // nếu trong vòng 0.5s cuối thì advance (backup detection).
  useEffect(() => {
    const p = playerRef.current;
    const subscription = p.addListener("timeUpdate", ({ currentTime }) => {
      try {
        // Chỉ act nếu: video có duration, đang phát thật (currentTime > 0.5s),
        // và còn cách cuối ≤ 0.5s
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
      // Resume playback for current item
      const pl = playlistRef.current;
      const idx = currentIndexRef.current;
      if (pl.length > 0 && idx < pl.length) {
        const item = pl[idx];
        if (item.type === "video" && hasInteractedRef.current) {
          safePlay(p);
        }
        // T12 FIX: chỉ set timer cho non-video. Video dùng player events.
        // Backend lưu duration theo GIÂY, cần * 1000 cho setTimeout.
        if (item.type !== "video") {
          clearSlideTimer();
          const durationMs = (item.duration || 10) * 1000;
          slideTimerRef.current = setTimeout(() => {
            goToNextRef.current();
          }, durationMs);
        }
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
    if (filteredPlaylist.length > 0 && currentIndex >= filteredPlaylist.length) {
      const safeIdx = 0;
      currentIndexRef.current = safeIdx;
      setCurrentIndex(safeIdx);
    }
  }, [filteredPlaylist.length, currentIndex]);

  // === Derive current item for rendering (computation only, no state) ===
  const safeIdx =
    filteredPlaylist.length > 0 ? Math.min(currentIndex, filteredPlaylist.length - 1) : -1;
  const currentItem = safeIdx >= 0 ? filteredPlaylist[safeIdx] : null;

  // === Effect: Drift Correction (Sửa lệch pha đồng bộ theo thời gian tuyệt đối của Server) ===
  useEffect(() => {
    if (syncMode !== "ntp") return; // Chỉ chạy NTP Drift Correction khi chế độ đồng bộ là ntp
    if (!isSyncGroup || !currentItem || currentItem.type !== "video" || isSleeping) return;

    const p = playerRef.current;
    if (!p) return;

    const checkDrift = () => {
      // Bỏ qua kiểm tra lệch pha nếu vừa thực hiện tua video trong vòng 5 giây trước để video kịp buffer mạng
      if (Date.now() - lastSeekTimeRef.current < 5000) {
        return;
      }
      try {
        // Chỉ thực hiện đồng bộ lệch pha khi thời lượng video thực tế đã sẵn sàng
        const actualDurationSec = p.duration;
        if (!actualDurationSec || actualDurationSec <= 0) return;
        const durationMs = actualDurationSec * 1000;

        // Tính toán vị trí phát chuẩn tuyệt đối (server time modulo video duration)
        const nowServerTime = Date.now() + clockOffset;
        const targetPosMs = nowServerTime % durationMs;
        const targetPosSec = targetPosMs / 1000;

        const currentPosSec = p.currentTime;
        const diff = Math.abs(currentPosSec - targetPosSec);

        // Nếu lệch pha quá 0.5s, tự động tua (seek) video về vị trí chuẩn
        if (diff > 0.5) {
          console.log(`[Drift Correction] Lệch pha phát hiện: thực tế=${currentPosSec.toFixed(3)}s, chuẩn=${targetPosSec.toFixed(3)}s, lệch=${diff.toFixed(3)}s. Tiến hành tua...`);
          lastSeekTimeRef.current = Date.now();
          p.currentTime = targetPosSec;
        }
      } catch (err) {
        console.warn("[Sync Playback] Lỗi kiểm tra lệch pha (Drift Correction):", err);
      }
    };

    // Chạy kiểm tra tức thì và lặp lại định kỳ mỗi 1.5 giây
    checkDrift();
    const intervalId = setInterval(checkDrift, 1500);

    return () => clearInterval(intervalId);
  }, [isSyncGroup, currentItem, clockOffset, isSleeping, syncMode]);

  // === Effect: WebSocket Connection ===
  useEffect(() => {
    if (syncMode !== "websocket" || !isSyncGroup || !roomId || !deviceId) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socketUrl = `http://${serverIp}:${serverPort}`;
    console.log(`[WebSocket Sync] Kết nối tới socket server: ${socketUrl} (Room: ${roomId})`);
    const socket = io(socketUrl, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[WebSocket Sync] Kết nối thành công. Gửi join_room.");
      socket.emit("join_room", { playlistId: roomId, deviceId });
    });

    socket.on("disconnect", () => {
      console.log("[WebSocket Sync] Mất kết nối tới server.");
    });

    socket.on("connect_error", (err) => {
      console.warn("[WebSocket Sync] Lỗi kết nối socket:", err.message);
    });

    return () => {
      console.log("[WebSocket Sync] Component unmount. Ngắt kết nối socket.");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [syncMode, isSyncGroup, roomId, deviceId, serverIp, serverPort]);

  // === Effect: WebSocket Master Broadcast Time (Chỉ Master ô số 1 gửi tín hiệu) ===
  useEffect(() => {
    if (syncMode !== "websocket" || !isSyncGroup || mySlotIndex !== 1 || !currentItem || currentItem.type !== "video" || isSleeping) {
      return;
    }

    const p = playerRef.current;
    if (!p) return;

    const intervalId = setInterval(() => {
      const socket = socketRef.current;
      if (socket && socket.connected) {
        const payload = {
          playlistId: roomId,
          deviceId,
          mediaId: currentItem.checksum || currentItem.url,
          currentTime: p.currentTime,
          timestamp: Date.now(),
        };
        socket.emit("master_time_update", payload);
      }
    }, 100); // 100ms gửi tín hiệu 1 lần để đảm bảo độ trễ thấp và bám đuổi nhanh

    return () => clearInterval(intervalId);
  }, [syncMode, isSyncGroup, mySlotIndex, currentItem, roomId, deviceId, isSleeping]);

  // === Effect: WebSocket Slave Follow Master (Các Slave ô 2, 3, 4 bám đuổi) ===
  useEffect(() => {
    if (syncMode !== "websocket" || !isSyncGroup || mySlotIndex === 1 || !roomId) {
      return;
    }

    const socket = socketRef.current;
    if (!socket) return;

    const handleSlaveSync = (data: { mediaId: string; currentTime: number; timestamp: number }) => {
      const p = playerRef.current;
      if (!p) return;

      // 1. Kiểm tra xem Master có đổi video khác hay không
      const targetIdx = filteredPlaylist.findIndex(
        (item) => (item.checksum && item.checksum === data.mediaId) || item.url === data.mediaId
      );
      if (targetIdx !== -1 && targetIdx !== currentIndexRef.current) {
        console.log(`[WebSocket Sync] Master chuyển video mới: ${data.mediaId}. Chuyển sang index ${targetIdx}`);
        currentIndexRef.current = targetIdx;
        setCurrentIndex(targetIdx);
        loadItem(targetIdx);
        return; // Đợi load video mới xong thì vòng sync sau sẽ tự động tua thời gian
      }

      // 2. Tính toán độ trễ mạng mạng và tua đuổi theo Master
      const latencySec = (Date.now() - data.timestamp) / 1000;
      const targetPosSec = data.currentTime + latencySec;

      // Tránh tua liên tục nếu Slave vừa thực hiện tua video trong vòng 5 giây trước đó
      if (Date.now() - lastSeekTimeRef.current < 5000) {
        return;
      }

      try {
        const actualDurationSec = p.duration;
        if (!actualDurationSec || actualDurationSec <= 0) return;

        // Chỉ tua nếu vị trí Master nhỏ hơn thời lượng video của Slave
        if (targetPosSec < actualDurationSec) {
          const currentPosSec = p.currentTime;
          const diff = Math.abs(currentPosSec - targetPosSec);

          if (diff > 0.5) {
            console.log(`[WebSocket Sync] Lệch pha với Master: slave=${currentPosSec.toFixed(3)}s, master=${targetPosSec.toFixed(3)}s (lệch ${diff.toFixed(3)}s). Tiến hành bám đuổi...`);
            lastSeekTimeRef.current = Date.now();
            p.currentTime = targetPosSec;
          }
        }
      } catch (err) {
        console.warn("[WebSocket Sync] Lỗi khi xử lý tua video Slave:", err);
      }
    };

    socket.on("slave_sync", handleSlaveSync);

    return () => {
      socket.off("slave_sync", handleSlaveSync);
    };
  }, [syncMode, isSyncGroup, mySlotIndex, filteredPlaylist, roomId, loadItem]);

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

  if (!currentItem || filteredPlaylist.length === 0) {
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
          <View
            style={
              videoWallCrop
                ? {
                    position: "absolute",
                    width: videoWallCrop.mediaWidth as any,
                    height: videoWallCrop.mediaHeight as any,
                    left: videoWallCrop.left as any,
                    top: videoWallCrop.top as any,
                  }
                : { width: "100%", height: "100%" }
            }
          >
            <Image
              source={{ uri: currentItem.url }}
              style={styles.media}
              resizeMode={videoWallCrop ? "cover" : "contain"}
            />
          </View>
        </View>
      )}

      {/* Video layer — only mounted when current item is video */}
      {currentItem.type === "video" && (
        <View style={styles.mediaContainer}>
          <View
            style={
              videoWallCrop
                ? {
                    position: "absolute",
                    width: videoWallCrop.mediaWidth as any,
                    height: videoWallCrop.mediaHeight as any,
                    left: videoWallCrop.left as any,
                    top: videoWallCrop.top as any,
                  }
                : { width: "100%", height: "100%" }
            }
          >
            <VideoView
              player={player}
              style={styles.media}
              nativeControls={false}
              contentFit={videoWallCrop ? "cover" : "contain"}
            />
          </View>
        </View>
      )}

      {/* PDF layer — mounted when current item is PDF */}
      {currentItem.type === "pdf" && (
        <View style={styles.mediaContainer}>
          {Platform.OS === "web" ? (
            <View
              style={
                videoWallCrop
                  ? {
                      position: "absolute",
                      width: videoWallCrop.mediaWidth as any,
                      height: videoWallCrop.mediaHeight as any,
                      left: videoWallCrop.left as any,
                      top: videoWallCrop.top as any,
                    }
                  : { width: "100%", height: "100%" }
              }
            >
              <iframe
                src={currentItem.url.includes("#") ? currentItem.url : `${currentItem.url}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                  backgroundColor: "#000000",
                }}
                title="PDF Viewer"
              />
            </View>
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
            <View
              style={
                videoWallCrop
                  ? {
                      position: "absolute",
                      width: videoWallCrop.mediaWidth as any,
                      height: videoWallCrop.mediaHeight as any,
                      left: videoWallCrop.left as any,
                      top: videoWallCrop.top as any,
                    }
                  : { width: "100%", height: "100%" }
              }
            >
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
            </View>
          ) : (
            // T5: Native platform dùng react-native-webview
            <WebView
              source={{ uri: currentItem.url }}
              style={
                videoWallCrop
                  ? {
                      position: "absolute",
                      width: videoWallCrop.mediaWidth as any,
                      height: videoWallCrop.mediaHeight as any,
                      left: videoWallCrop.left as any,
                      top: videoWallCrop.top as any,
                    }
                  : { width: "100%", height: "100%", backgroundColor: "#000000" }
              }
              allowsFullscreenVideo
              javaScriptEnabled
              domStorageEnabled
              // Không cho user navigate ra ngoài URL (giữ focus playlist)
              originWhitelist={["*"]}
              // Cache + offline: nếu đã load trước thì hiển thị ngay
              cacheEnabled
              // Ngăn zoom không mong muốn trên mobile
              scalesPageToFit={false}
            />
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
    position: "relative",
    overflow: "hidden",
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
