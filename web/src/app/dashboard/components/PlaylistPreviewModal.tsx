import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { X, Play, Pause, ChevronLeft, ChevronRight, Loader2, Monitor } from 'lucide-react';
import { api } from '@/utils/api';
import { Playlist } from '@/types/dashboard';
import { getFileUrl } from '@/utils/api';

interface PlaylistPreviewModalProps {
  playlist: Playlist | null;
  isOpen: boolean;
  onClose: () => void;
}

interface PlaylistItem {
  id: string;
  sortOrder: number;
  duration: number; // in seconds
  media: {
    id: string;
    fileName: string;
    fileUrl: string;
    mimeType: string;
  };
}

export default function PlaylistPreviewModal({
  playlist,
  isOpen,
  onClose
}: PlaylistPreviewModalProps) {
  const [items, setItems] = useState<PlaylistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0); // 0 to 100

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const elapsedPausedRef = useRef<number>(0); // Time elapsed before pausing
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Fetch playlist items on load
  useEffect(() => {
    const fetchItems = async () => {
      if (!playlist || !isOpen) return;
      
      try {
        setIsLoading(true);
        setItems([]);
        setCurrentIndex(0);
        setProgress(0);
        setIsPlaying(true);
        elapsedPausedRef.current = 0;

        const data = await api.get(`/api/playlists/${playlist.id}/items`) as PlaylistItem[];
        setItems(data || []);
      } catch (err) {
        console.error('Lỗi khi tải playlist preview:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, [playlist, isOpen]);

  const currentItem = items[currentIndex] || null;
  const isVideo = currentItem?.media?.mimeType?.startsWith('video/');
  const slideDurationMs = (currentItem?.duration || 10) * 1000;

  // Handle slide transitions
  const handleNext = () => {
    if (items.length <= 1) {
      // Loop single slide
      setProgress(0);
      elapsedPausedRef.current = 0;
      startTimeRef.current = Date.now();
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
      return;
    }
    setCurrentIndex(prev => (prev + 1) % items.length);
    setProgress(0);
    elapsedPausedRef.current = 0;
  };

  const handlePrev = () => {
    if (items.length <= 1) {
      setProgress(0);
      elapsedPausedRef.current = 0;
      startTimeRef.current = Date.now();
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
      return;
    }
    setCurrentIndex(prev => (prev - 1 + items.length) % items.length);
    setProgress(0);
    elapsedPausedRef.current = 0;
  };

  // Playback timer & progress control
  useEffect(() => {
    if (!isOpen || items.length === 0 || !isPlaying || !currentItem) {
      // Clear timers if paused or closed
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    // NẾU LÀ VIDEO, CHÚNG TA KHÔNG ĐẶT TIMER HẸN GIỜ VÀ INTERVAL TĨNH
    if (isVideo) {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    // Capture starting timestamp
    startTimeRef.current = Date.now() - elapsedPausedRef.current;

    // Timer to auto trigger next slide (only for images)
    const remainingTime = slideDurationMs - elapsedPausedRef.current;
    
    // Set slider progress update interval (every 100ms)
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min((elapsed / slideDurationMs) * 100, 100);
      setProgress(pct);
    }, 100);

    // Slide transition timer
    timerRef.current = setTimeout(() => {
      handleNext();
    }, remainingTime);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, isPlaying, items, isOpen, isVideo]);

  // Pause / Play toggle handler
  const handleTogglePlay = () => {
    if (isPlaying) {
      // Capture elapsed time before pausing
      elapsedPausedRef.current = Date.now() - startTimeRef.current;
      setIsPlaying(false);
      if (videoRef.current) {
        videoRef.current.pause();
      }
    } else {
      setIsPlaying(true);
      if (videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
    }
  };

  // Get Aspect Ratio
  interface SyncLayoutConfig {
    aspectRatio?: string;
    scaleMode?: 'stretch' | 'crop';
  }

  const syncLayout = (playlist as { syncLayout?: SyncLayoutConfig })?.syncLayout;
  const scaleMode = syncLayout?.scaleMode || 'stretch';
  const objectFitClass = scaleMode === 'crop' ? 'object-cover' : 'object-fill';

  const getAspectRatioStyle = () => {
    if (syncLayout?.aspectRatio === '9:16') {
      return 'aspect-[9/16] max-h-[70vh]';
    }
    return 'aspect-[16/9] max-w-full';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl flex flex-col items-center gap-4">
        
        {/* Title & Close header */}
        <div className="w-full flex items-center justify-between text-white pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-primary" />
            <div>
              <h3 className="text-sm font-bold truncate max-w-[300px] sm:max-w-md">
                Xem trước: {playlist?.playlistName}
              </h3>
              <p className="text-[10px] text-muted-foreground">
                Đang mô phỏng phát Kiosk tuần tự & co giãn hình ảnh
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full text-white hover:bg-white/10 h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* TV Simulator Body */}
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2 text-white">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-xs text-muted-foreground">Đang nạp danh sách phát...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-white italic text-xs">
            Danh sách phát này chưa có trang nào để chạy thử.
          </div>
        ) : (
          <div className="w-full flex flex-col items-center">
            
            {/* TV Border Chassis */}
            <div className={`relative bg-zinc-950 p-3 rounded-3xl border-4 border-zinc-800 shadow-2xl flex flex-col items-center justify-center w-full max-w-2xl ${getAspectRatioStyle()} overflow-hidden`}>
              
              {/* Screen Content */}
              <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden rounded-xl">
                {currentItem && (
                  isVideo ? (
                    <video
                      ref={videoRef}
                      key={currentItem.id} // re-mount video when slide index changes
                      src={getFileUrl(currentItem.media.fileUrl)}
                      className={`w-full h-full ${objectFitClass}`}
                      autoPlay={isPlaying}
                      muted
                      loop={items.length === 1} // loop only if 1 item exists
                      onEnded={() => {
                        // When video ends, trigger next slide
                        if (isPlaying) handleNext();
                      }}
                      onTimeUpdate={(e) => {
                        const video = e.currentTarget;
                        if (video.duration) {
                          const pct = (video.currentTime / video.duration) * 100;
                          setProgress(pct);
                        }
                      }}
                      playsInline
                    />
                  ) : (
                    <img
                      src={getFileUrl(currentItem.media.fileUrl)}
                      alt=""
                      className={`w-full h-full ${objectFitClass}`}
                    />
                  )
                )}

                {/* Progress bar overlay (bottom of the screen) */}
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/40 z-20">
                  <div
                    style={{ width: `${progress}%` }}
                    className="h-full bg-primary transition-all duration-100 ease-linear"
                  />
                </div>

                {/* Slide index overlay indicator */}
                <div className="absolute top-3 left-3 bg-black/60 text-white rounded-md px-2 py-0.5 text-[10px] font-bold z-20 backdrop-blur-xs">
                  Trang {currentIndex + 1} / {items.length}
                </div>
              </div>

            </div>

            {/* Controls Row */}
            <div className="mt-4 flex items-center gap-3 bg-zinc-900/90 border border-zinc-800 rounded-full px-4 py-2 text-white shadow-xl">
              {/* Prev */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrev}
                className="h-8 w-8 text-white hover:bg-white/10 rounded-full"
                title="Quay lại"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Play/Pause */}
              <Button
                variant="default"
                size="icon"
                onClick={handleTogglePlay}
                className="h-9 w-9 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-md shrink-0"
                title={isPlaying ? 'Tạm dừng' : 'Phát'}
              >
                {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
              </Button>

              {/* Next */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                className="h-8 w-8 text-white hover:bg-white/10 rounded-full"
                title="Tiếp tục"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              <div className="border-l border-white/10 h-6 mx-1" />

              {/* Time indicator */}
              <span className="text-[10px] font-mono text-zinc-400 select-none">
                {isVideo ? 'Thời lượng: Theo Video' : `Thời lượng slide: ${currentItem?.duration}s`}
              </span>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
