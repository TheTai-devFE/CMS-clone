import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Image, ActivityIndicator } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { colors } from '../theme/colors';

interface AdPlayerScreenProps {
  isLandscape: boolean;
  onRelaunchRequest?: () => void;
}

type MediaItem = 
  | { type: 'image'; url: string; duration: number }
  | { type: 'video'; url: string; duration: number }; // fallback duration in ms

const PLAYLIST: MediaItem[] = [
  {
    type: 'image',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200',
    duration: 8000, // 8 seconds
  },
  {
    type: 'video',
    url: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c022f733f3d3621478541c888d3e2307&profile_id=139&oauth2_token_id=57447761',
    duration: 15000, // 15 seconds fallback
  },
  {
    type: 'image',
    url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1200',
    duration: 8000, // 8 seconds
  },
];

export default function AdPlayerScreen({ isLandscape }: AdPlayerScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const currentItem = PLAYLIST[currentIndex];

  const slideTimer = useRef<any>(null);

  // Initialize Video Player for the video source
  const videoUrl = PLAYLIST.find(item => item.type === 'video')?.url || '';
  const player = useVideoPlayer(videoUrl, (playerInstance) => {
    playerInstance.loop = false;
    playerInstance.muted = true;
  });

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % PLAYLIST.length);
    setImageLoading(true);
  };

  // Handle slide switching logic
  useEffect(() => {
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
      player.currentTime = 0;
      player.play();

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
  }, [currentIndex]);

  // Listen to video completion event using expo-video listener
  useEffect(() => {
    const subscription = player.addListener('playToEnd', () => {
      if (currentItem.type === 'video') {
        handleNext();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [player, currentIndex]);

  return (
    <View style={styles.container}>
      {/* Image container */}
      <View style={[styles.mediaContainer, { display: currentItem.type === 'image' ? 'flex' : 'none' }]}>
        {currentItem.type === 'image' && (
          <Image
            source={{ uri: currentItem.url }}
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
