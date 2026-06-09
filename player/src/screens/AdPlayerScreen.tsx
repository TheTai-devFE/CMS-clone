import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Image, ActivityIndicator } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme/colors';

interface AdPlayerScreenProps {
  isLandscape: boolean;
  onRelaunchRequest?: () => void;
  isSleeping?: boolean;
}

export type MediaItem = 
  | { type: 'image'; url: string; duration: number }
  | { type: 'video'; url: string; duration: number }; // fallback duration in ms

export const PLAYLIST: MediaItem[] = [];

export default function AdPlayerScreen({ isLandscape, isSleeping }: AdPlayerScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const [breakpointEnabled, setBreakpointEnabled] = useState(false);
  
  const currentItem = PLAYLIST.length > 0 ? PLAYLIST[currentIndex] : null;

  const imageSource = React.useMemo(() => {
    if (currentItem && currentItem.type === 'image') {
      return { uri: currentItem.url };
    }
    return null;
  }, [currentItem]);

  const slideTimer = useRef<any>(null);

  // Initialize Video Player for the video source
  const videoUrl = PLAYLIST.find(item => item.type === 'video')?.url || '';
  const player = useVideoPlayer(videoUrl, (playerInstance) => {
    playerInstance.loop = false;
    playerInstance.muted = true;
  });

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

  // Save playback progress periodically
  useEffect(() => {
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

    interval = setInterval(saveProgress, 2000); // Save every 2 seconds
    return () => clearInterval(interval);
  }, [currentItem, player, breakpointEnabled]);

  // Restore playback progress
  useEffect(() => {
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
            // Clear keys to prevent looping back to same point
            await AsyncStorage.removeItem('breakpoint_video_url');
            await AsyncStorage.removeItem('breakpoint_playback_position');
          }
        } catch (err) {
          console.error('Lỗi khi khôi phục tiến độ video:', err);
        }
      }
    };
    
    restoreProgress();
  }, [currentIndex, currentItem, breakpointEnabled, player]);

  const handleNext = () => {
    if (PLAYLIST.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex + 1) % PLAYLIST.length);
    setImageLoading(true);
  };

  // Handle slide switching logic
  useEffect(() => {
    if (!currentItem) return;
    // Clear any existing timer
    if (slideTimer.current) {
      clearTimeout(slideTimer.current);
    }

    if (currentItem.type === 'image') {
      // Pause video when showing image
      player.pause();
      
      // Set timer to change slide
      slideTimer.current = setTimeout(() => {
        handleNext();
      }, currentItem.duration);
    } else if (currentItem.type === 'video') {
      // Play video
      // If we are currently sleeping, do not start playing video
      if (!isSleeping) {
        player.currentTime = 0;
        player.play();
      }

      // Set fallback timer in case video end event doesn't fire
      slideTimer.current = setTimeout(() => {
        handleNext();
      }, currentItem.duration);
    }

    return () => {
      if (slideTimer.current) {
        clearTimeout(slideTimer.current);
      }
    };
  }, [currentIndex, currentItem, isSleeping]);

  // Listen to video completion event using expo-video listener
  useEffect(() => {
    if (!currentItem) return;
    const subscription = player.addListener('playToEnd', () => {
      if (currentItem.type === 'video') {
        handleNext();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [player, currentIndex, currentItem]);

  if (!currentItem || PLAYLIST.length === 0) {
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
