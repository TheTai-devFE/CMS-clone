import React from 'react';
import Image from 'next/image';
import { ImageIcon, Tv } from 'lucide-react';
import { MediaItem } from '@/types/dashboard';
import { PlaylistItemData } from './PlaylistSidebar';
import { getFileUrl } from '@/utils/api';

interface PlaylistCanvasProps {
  activeSlide: PlaylistItemData | null;
  mediaList: MediaItem[];
  canvasWidth: number;
  canvasHeight: number;
  scaleFactor: number;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  scaleMode: 'stretch' | 'crop';
}

export default function PlaylistCanvas({
  activeSlide,
  mediaList,
  canvasWidth,
  canvasHeight,
  scaleFactor,
  canvasRef,
  scaleMode
}: PlaylistCanvasProps) {

  // Find media object by id
  const getMediaForSlide = (mediaId: string | null) => {
    if (!mediaId) return null;
    return mediaList.find(m => m.id === mediaId) || null;
  };

  const media = activeSlide ? getMediaForSlide(activeSlide.mediaId) : null;
  const isVideo = media?.mimeType?.startsWith('video/');
  const objectFitClass = scaleMode === 'crop' ? 'object-cover' : 'object-fill';

  return (
    <div className="flex-1 bg-muted/30 border border-border rounded-xl p-6 flex flex-col items-center justify-center overflow-auto min-h-[500px]">
      
      {/* Simulation Info */}
      <div className="mb-4 text-center">
        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground bg-muted px-2 py-1 rounded-full border border-border/40">
          Chế độ mô phỏng trình phát ({canvasWidth}x{canvasHeight}px - Fillscreen)
        </span>
      </div>

      {/* Simulator Frame (Canvas) */}
      <div
        ref={canvasRef}
        style={{
          width: `${canvasWidth * scaleFactor}px`,
          height: `${canvasHeight * scaleFactor}px`,
          position: 'relative',
        }}
        className="bg-white border border-zinc-300 dark:border-zinc-800 shadow-2xl overflow-hidden select-none transition-all duration-300 rounded-lg"
      >
        {/* Background Grid simulation */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0"></div>

        {/* Media Preview Layer */}
        {activeSlide ? (
          media ? (
            <div className="absolute inset-0 w-full h-full z-10 flex items-center justify-center bg-black">
              {isVideo ? (
                <video
                  key={media.id} // Re-mount video when switching slides or media
                  src={getFileUrl(media.fileUrl)}
                  className={`w-full h-full ${objectFitClass}`}
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                <Image
                  src={getFileUrl(media.fileUrl)}
                  alt={media.fileName}
                  fill
                  className={objectFitClass}
                  unoptimized
                />
              )}
            </div>
          ) : (
            // Placeholder when no media is assigned to slide
            <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-6 text-center bg-muted/20 dark:bg-muted/5 gap-3 z-10">
              <div className="h-16 w-16 rounded-full border border-dashed border-muted-foreground/30 flex items-center justify-center bg-background/50 text-muted-foreground/40 animate-pulse">
                <ImageIcon className="h-7 w-7" />
              </div>
              <p className="text-sm font-bold text-foreground">Trang này chưa có nội dung</p>
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                Vui lòng nhấp chọn một hình ảnh hoặc video từ **Thư viện phương tiện** ở bảng cấu hình bên phải để gán vào trang này.
              </p>
            </div>
          )
        ) : (
          // Placeholder when no slide is selected (should not happen)
          <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-6 text-center bg-muted/20 gap-2 z-10">
            <Tv className="h-10 w-10 text-muted-foreground/40 animate-pulse" />
            <p className="text-sm text-muted-foreground italic">Vui lòng chọn hoặc thêm trang mới ở menu bên trái</p>
          </div>
        )}
      </div>
    </div>
  );
}
