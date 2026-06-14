import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Image, ActivityIndicator } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme/colors';

interface AdPlayerScreenProps {
  isLandscape: boolean;
  onRelaunchRequest?: () => void;
  isSleeping?: boolean;
  playlist?: MediaItem[];
  deviceId?: string | null;
  isSyncGroup?: boolean;
  syncLayout?: any;
  clockOffset?: number;
}

export type MediaItem = 
  | { type: 'image'; url: string; duration: number }
  | { type: 'video'; url: string; duration: number }; // fallback duration in ms

export const PLAYLIST: MediaItem[] = [];

export default function AdPlayerScreen({
  isLandscape,
  isSleeping,
  playlist = [],
  deviceId = null,
  isSyncGroup = false,
  syncLayout = null,
  clockOffset = 0,
}: AdPlayerScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const [breakpointEnabled, setBreakpointEnabled] = useState(false);

  // 1. Filtered playlist
  const filteredPlaylist = React.useMemo(() => {
    if (!isSyncGroup || !syncLayout || !deviceId) {
      return playlist;
    }
    
    const mapping = syncLayout.deviceMapping;
    if (!mapping || typeof mapping !== 'object') {
      return playlist;
    }

    return playlist.filter((item: any) => {
      const targetDevices = mapping[item.sortOrder?.toString()];
      return Array.isArray(targetDevices) && targetDevices.includes(deviceId);
    });
  }, [playlist, isSyncGroup, syncLayout, deviceId]);

  const totalDuration = React.useMemo(() => {
    return filteredPlaylist.reduce((acc, item) => acc + item.duration, 0);
  }, [filteredPlaylist]);

  const currentItem = filteredPlaylist.length > 0 ? filteredPlaylist[currentIndex] : null;

  const imageSource = React.useMemo(() => {
    if (currentItem && currentItem.type === 'image') {
      return { uri: currentItem.url };
    }
    return null;
  }, [currentItem]);

  // Initialize Video Player for the initial video source found in the playlist
  const initialVideoUrl = React.useMemo(() => {
    return filteredPlaylist.find(item => item.type === 'video')?.url || '';
  }, [filteredPlaylist]);

  const player = useVideoPlayer(initialVideoUrl, (playerInstance) => {
    playerInstance.loop = false;
    playerInstance.muted = true;
  });

  // Dynamic Video source replacement
  useEffect(() => {
    if (currentItem && currentItem.type === 'video') {
      try {
        console.log(`[AdPlayer] Cập nhật source video: ${currentItem.url}`);
        player.replace(currentItem.url);
      } catch (err) {
        console.error('Lỗi khi thay thế nguồn video:', err);
      }
    }
  }, [currentItem?.url]);

  // Load breakpoint settings
  useEffect(() => {
    const loadEnabled = async () => {
      try {
        const stored = await AsyncStorage.getItem('breakpointContinuationEnabled') === 'true';
        setBreakpointEnabled(stored);
      } catch (e) {
        console.error(e);
      }
    };
    loadEnabled();
  }, []);

  // Handle sleep pause
  useEffect(() => {
    if (isSleeping) {
      player.pause();
    }
  }, [isSleeping, player]);

  // Save playback progress periodically (Normal mode only)
  useEffect(() => {
    if (isSyncGroup) return; // Disable in sync group mode
    let interval: any = null;
    
    const saveProgress = async () => {
      if (breakpointEnabled && currentItem && currentItem.type === 'video' && player.playing) {
        try {
          await AsyncStorage.setItem('breakpoint_video_url', currentItem.url);
          await AsyncStorage.setItem('breakpoint_playback_position', player.currentTime.toString());
        } catch (err) {
          console.error('Lỗi khi lưu tiến độ video:', err);
        }
      }
    };

    interval = setInterval(saveProgress, 2000);
    return () => clearInterval(interval);
  }, [isSyncGroup, currentItem, player, breakpointEnabled]);

  // Restore playback progress (Normal mode only)
  useEffect(() => {
    if (isSyncGroup) return; // Disable in sync group mode
    const restoreProgress = async () => {
      if (breakpointEnabled && currentItem && currentItem.type === 'video') {
        try {
          const savedUrl = await AsyncStorage.getItem('breakpoint_video_url');
          const savedPosStr = await AsyncStorage.getItem('breakpoint_playback_position');
          
          if (savedUrl === currentItem.url && savedPosStr) {
            const savedPos = parseFloat(savedPosStr);
            if (savedPos > 0 && player.duration - savedPos > 2) {
              player.currentTime = savedPos;
              console.log('Khôi phục tiến độ phát video tại:', savedPos);
            }
            await AsyncStorage.removeItem('breakpoint_video_url');
            await AsyncStorage.removeItem('breakpoint_playback_position');
          }
        } catch (err) {
          console.error('Lỗi khi khôi phục tiến độ video:', err);
        }
      }
    };
    
    restoreProgress();
  }, [isSyncGroup, currentIndex, currentItem, breakpointEnabled, player]);

  // --- Playback logic for Synchronized Group Mode ---

  // NTP sync tick
  useEffect(() => {
    if (!isSyncGroup || filteredPlaylist.length === 0 || totalDuration === 0) return;

    const getActiveItemAndOffset = () => {
      const synchronizedTime = Date.now() + clockOffset;
      const playbackTime = synchronizedTime % totalDuration;

      let accumulatedTime = 0;
      for (let i = 0; i < filteredPlaylist.length; i++) {
        const item = filteredPlaylist[i];
        if (playbackTime >= accumulatedTime && playbackTime < accumulatedTime + item.duration) {
          return {
            item,
            index: i,
            offsetMs: playbackTime - accumulatedTime
          };
        }
        accumulatedTime += item.duration;
      }
      return { item: filteredPlaylist[0], index: 0, offsetMs: 0 };
    };

    const tick = () => {
      const { index } = getActiveItemAndOffset();
      if (index !== currentIndex) {
        setCurrentIndex(index);
        setImageLoading(true);
      }
    };

    tick();
    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
  }, [isSyncGroup, filteredPlaylist, totalDuration, clockOffset, currentIndex]);

  // Video Seek & Drift Correction for Sync Group Mode
  useEffect(() => {
    if (!isSyncGroup || !currentItem || currentItem.type !== 'video' || isSleeping || totalDuration === 0) return;

    const getActiveItemAndOffset = () => {
      const synchronizedTime = Date.now() + clockOffset;
      const playbackTime = synchronizedTime % totalDuration;

      let accumulatedTime = 0;
      for (let i = 0; i < filteredPlaylist.length; i++) {
        const item = filteredPlaylist[i];
        if (playbackTime >= accumulatedTime && playbackTime < accumulatedTime + item.duration) {
          return {
            item,
            index: i,
            offsetMs: playbackTime - accumulatedTime
          };
        }
        accumulatedTime += item.duration;
      }
      return { item: filteredPlaylist[0], index: 0, offsetMs: 0 };
    };

    const { offsetMs } = getActiveItemAndOffset();
    const initialPosition = offsetMs / 1000;
    player.currentTime = initialPosition;
    player.play();

    const checkDrift = () => {
      if (!player.playing) return;
      const { item, offsetMs: expectedOffsetMs } = getActiveItemAndOffset();
      if (item && item.url === currentItem.url) {
        const expectedPosition = expectedOffsetMs / 1000;
        const currentPosition = player.currentTime;
        const drift = Math.abs(currentPosition - expectedPosition);
        if (drift > 0.5) {
          console.log(`[Playback Engine] Lệch đồng bộ video: ${drift}s. Đang seek về: ${expectedPosition}s`);
          player.currentTime = expectedPosition;
        }
      }
    };

    const driftInterval = setInterval(checkDrift, 1500);
    return () => clearInterval(driftInterval);
  }, [isSyncGroup, currentIndex, currentItem?.url, isSleeping, clockOffset, totalDuration]);


  // --- Playback logic for Normal Mode (driven by timers & events) ---

  const slideTimer = useRef<any>(null);

  const handleNext = () => {
    if (filteredPlaylist.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex + 1) % filteredPlaylist.length);
    setImageLoading(true);
  };

  useEffect(() => {
    if (isSyncGroup) return; // Ignore in sync group mode
    if (!currentItem) return;

    if (slideTimer.current) {
      clearTimeout(slideTimer.current);
    }

    if (currentItem.type === 'image') {
      player.pause();
      slideTimer.current = setTimeout(() => {
        handleNext();
      }, currentItem.duration);
    } else if (currentItem.type === 'video') {
      if (!isSleeping) {
        player.currentTime = 0;
        player.play();
      }
      slideTimer.current = setTimeout(() => {
        handleNext();
      }, currentItem.duration);
    }

    return () => {
      if (slideTimer.current) {
        clearTimeout(slideTimer.current);
      }
    };
  }, [isSyncGroup, currentIndex, currentItem, isSleeping]);

  useEffect(() => {
    if (isSyncGroup || !currentItem) return;

    const subscription = player.addListener('playToEnd', () => {
      if (currentItem.type === 'video') {
        handleNext();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isSyncGroup, player, currentIndex, currentItem]);

  if (!currentItem || filteredPlaylist.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Text style={styles.emptyIconText}>📺</Text>
        </View>
        <Text style={styles.emptyTitle}>Chưa có nội dung trình chiếu</Text>
        <Text style={styles.emptySubtitle}>
          Thiết bị hiện đang ở chế độ chờ. Vui lòng liên kết thiết bị với CMS và gán lịch phát để cập nhật nội dung.
        </Text>
        <Text style={styles.emptyHint}>Chạm vào màn hình để mở bảng cấu hình</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Image container */}
      <View style={[styles.mediaContainer, { display: currentItem.type === 'image' ? 'flex' : 'none' }]}>
        {currentItem.type === 'image' && imageSource && (
          <Image
            source={imageSource}
            style={styles.media}
            resizeMode="cover"
            onLoadStart={() => setImageLoading(true)}
            onLoadEnd={() => setImageLoading(false)}
          />
        )}
        {currentItem.type === 'image' && imageLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.secondary} />
          </View>
        )}
      </View>

      {/* Video container - Keep mounted to prevent expo-video player release issues */}
      <View style={[styles.mediaContainer, { display: currentItem.type === 'video' ? 'flex' : 'none' }]}>
        <VideoView
          player={player}
          style={styles.media}
          nativeControls={false}
          contentFit="cover"
        />
      </View>

      {/* Floating Kiosk Status Tag (Top Right) */}
      <View style={[styles.kioskBadge, { top: isLandscape ? 12 : 36 }]}>
        <View style={styles.badgeDot} />
        <Text style={styles.badgeText}>KIOSK PLAYBACK</Text>
      </View>

      {/* Touch Screen Overlay Indicator (Subtle bottom text) */}
      <View style={styles.overlayContainer}>
        <Text style={styles.overlayText}>Chạm màn hình để mở Bảng cấu hình</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    backgroundColor: '#0a0f1d', // Ultra dark background matching premium signage style
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyIconText: {
    fontSize: 40,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  emptySubtitle: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 420,
    lineHeight: 22,
    marginBottom: 32,
  },
  emptyHint: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.15)',
    textTransform: 'uppercase',
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative',
  },
  mediaContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  kioskBadge: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    zIndex: 10,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: 6,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  overlayContainer: {
    position: 'absolute',
    bottom: 96,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  overlayText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 100,
    letterSpacing: 0.5,
  },
});
