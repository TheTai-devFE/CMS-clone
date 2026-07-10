import { Button } from "@/components/ui/button";
import Image from "next/image";
import { MediaItem } from "@/types/dashboard";
import { getFileUrl } from "@/utils/api";
import {
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Plus,
  Trash2,
  Video,
} from "lucide-react";

export interface PlaylistItemData {
  id: string; // temp slide ID or backend item ID
  mediaId: string | null;
  duration: number; // in seconds
  fileName?: string;
  fileUrl?: string;
  mimeType?: string;
  targetDeviceIds?: string[];
}

interface PlaylistSidebarProps {
  slides: PlaylistItemData[];
  activeSlideId: string | null;
  mediaList: MediaItem[];
  onSelectSlide: (id: string) => void;
  onAddSlide: () => void;
  onDeleteSlide: (id: string) => void;
  onMoveSlide: (index: number, direction: "up" | "down") => void;
}

export default function PlaylistSidebar({
  slides,
  activeSlideId,
  mediaList,
  onSelectSlide,
  onAddSlide,
  onDeleteSlide,
  onMoveSlide,
}: PlaylistSidebarProps) {
  // Find media object by id
  const getMediaForSlide = (mediaId: string | null) => {
    if (!mediaId) return null;
    return mediaList.find((m) => m.id === mediaId) || null;
  };

  return (
    <div className="w-64 border-r border-border bg-card flex flex-col h-[calc(100vh-12rem)] min-h-[500px] shrink-0 rounded-l-xl overflow-hidden">
      {/* Sidebar Header */}
      <div className="p-3 border-b border-border/60 bg-muted/20 flex items-center justify-between">
        <span className="text-xs font-bold text-foreground uppercase tracking-wider">
          Danh sách trang ({slides.length})
        </span>
      </div>

      {/* Slide Thumbnails List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
        {slides.map((slide, index) => {
          const isActive = activeSlideId === slide.id;
          const media = getMediaForSlide(slide.mediaId);
          const isVideo = media?.mimeType?.startsWith("video/");

          return (
            <div
              key={slide.id}
              onClick={() => onSelectSlide(slide.id)}
              className={`group relative border rounded-lg overflow-hidden cursor-pointer transition-all duration-200 aspect-video flex flex-col bg-muted/40 shadow-xs ${
                isActive
                  ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                  : "border-border hover:border-muted-foreground/50 hover:bg-muted/60"
              }`}>
              {/* Slide Thumbnail Preview */}
              <div className="flex-1 relative w-full h-full overflow-hidden flex items-center justify-center bg-zinc-950/5 dark:bg-zinc-950/20">
                {media ? (
                  isVideo ? (
                    <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                      <video
                        src={getFileUrl(media.fileUrl)}
                        className="w-full h-full object-cover pointer-events-none"
                        muted
                        playsInline
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <Video className="h-5 w-5 text-white drop-shadow-md" />
                      </div>
                    </div>
                  ) : (
                    <Image
                      src={getFileUrl(media.fileUrl)}
                      alt={media.fileName}
                      fill
                      className="object-cover pointer-events-none"
                      unoptimized
                    />
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center p-2 text-muted-foreground/50">
                    <ImageIcon className="h-6 w-6 stroke-[1.5]" />
                    <span className="text-[10px] mt-1 font-medium italic">
                      Trang trống
                    </span>
                  </div>
                )}

                {/* Slide Index Badge (Top-left) */}
                <div className="absolute top-1.5 left-1.5 bg-black/60 text-white rounded-md h-5 px-1.5 flex items-center justify-center text-[10px] font-bold z-10 backdrop-blur-xs">
                  {index + 1}
                </div>

                {/* Duration Badge (Bottom-right) */}
                <div className="absolute bottom-1.5 right-1.5 bg-black/60 text-white rounded-md h-5 px-1.5 flex items-center justify-center text-[10px] font-mono z-10 backdrop-blur-xs">
                  {slide.duration}s
                </div>

                {/* Hover Quick Action Panel */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center gap-1.5 z-20">
                  {/* Move Up */}
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveSlide(index, "up");
                    }}
                    className={`h-7 w-7 rounded bg-white/95 dark:bg-zinc-900/95 text-foreground hover:bg-primary hover:text-white transition-colors flex items-center justify-center shadow-xs ${
                      index === 0 ? "opacity-40 cursor-not-allowed" : ""
                    }`}
                    title="Di chuyển lên">
                    <ChevronUp className="h-4 w-4" />
                  </button>

                  {/* Move Down */}
                  <button
                    type="button"
                    disabled={index === slides.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveSlide(index, "down");
                    }}
                    className={`h-7 w-7 rounded bg-white/95 dark:bg-zinc-900/95 text-foreground hover:bg-primary hover:text-white transition-colors flex items-center justify-center shadow-xs ${
                      index === slides.length - 1
                        ? "opacity-40 cursor-not-allowed"
                        : ""
                    }`}
                    title="Di chuyển xuống">
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {/* Delete Slide */}
                  <button
                    type="button"
                    disabled={slides.length <= 1} // At least one slide is required
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSlide(slide.id);
                    }}
                    className={`h-7 w-7 rounded bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center justify-center shadow-xs ${
                      slides.length <= 1 ? "opacity-40 cursor-not-allowed" : ""
                    }`}
                    title="Xóa trang">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {slides.length === 0 && (
          <div className="text-center py-6 text-xs text-muted-foreground italic border border-dashed border-border rounded-lg bg-muted/10">
            Chưa có trang hiển thị nào
          </div>
        )}
      </div>

      {/* Sidebar Footer - Add Slide Button */}
      <div className="p-3 border-t border-border/60 bg-muted/10">
        <Button
          type="button"
          onClick={onAddSlide}
          className="w-full text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5"
          variant="outline">
          <Plus className="h-4 w-4" /> Thêm trang mới
        </Button>
      </div>
    </div>
  );
}
