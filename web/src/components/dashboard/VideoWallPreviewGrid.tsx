import React from "react";
import { getFileUrl } from "@/utils/api";

interface PlaylistItemPreview {
  id: string;
  media: {
    fileUrl: string;
  };
}

interface VideoWallPreviewGridProps {
  items: PlaylistItemPreview[];
  videoWallRows: number;
  videoWallCols: number;
  canvasRefs: React.MutableRefObject<Record<number, HTMLCanvasElement | null>>;
  masterVideoRef: React.RefObject<HTMLVideoElement | null>;
  isPlaying: boolean;
}

export const VideoWallPreviewGrid: React.FC<VideoWallPreviewGridProps> = ({
  items,
  videoWallRows,
  videoWallCols,
  canvasRefs,
  masterVideoRef,
  isPlaying,
}) => {
  return (
    <div
      className="grid w-full gap-px p-4 bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl max-w-4xl"
      style={{
        gridTemplateRows: `repeat(${videoWallRows}, minmax(0, 1fr))`,
        gridTemplateColumns: `repeat(${videoWallCols}, minmax(0, 1fr))`,
      }}
    >
      {Array.from({ length: videoWallRows }).map((_, rIdx) =>
        Array.from({ length: videoWallCols }).map((_, cIdx) => {
          const slotIndex = rIdx * videoWallCols + cIdx;
          const item = items[slotIndex];
          if (!item) return null;

          return (
            <div
              key={slotIndex}
              className="relative bg-black border border-zinc-800 aspect-video overflow-hidden"
            >
              <canvas
                ref={(el) => {
                  canvasRefs.current[slotIndex] = el;
                }}
                className="w-full h-full block"
              />
              <div className="absolute top-1 left-1 bg-black/60 text-white rounded px-1.5 py-0.5 text-[9px] font-bold z-20 backdrop-blur-xs select-none">
                Màn hình {rIdx + 1}x{cIdx + 1}
              </div>
            </div>
          );
        }),
      )}
      {/* Hidden master video feeds all canvas tiles */}
      {(() => {
        const firstItem = items[0];
        if (!firstItem) return null;
        return (
          <video
            ref={masterVideoRef}
            src={getFileUrl(firstItem.media.fileUrl)}
            muted
            loop
            autoPlay={isPlaying}
            playsInline
            style={{ display: "none" }}
          />
        );
      })()}
    </div>
  );
};
