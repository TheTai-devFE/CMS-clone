import React from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Clock, Check, Search, Film } from "lucide-react";
import { MediaItem } from "@/types/dashboard";
import { PlaylistItemData } from "./PlaylistSidebar";
import { getFileUrl } from "@/utils/api";

interface SlideMediaSectionProps {
  activeSlide: PlaylistItemData;
  activeSlideIndex: number;
  onChangeSlideDuration: (duration: number) => void;
  mediaList: MediaItem[];
  onAssignMediaToSlide: (mediaId: string) => void;
}

export const SlideMediaSection: React.FC<SlideMediaSectionProps> = ({
  activeSlide,
  activeSlideIndex,
  onChangeSlideDuration,
  mediaList,
  onAssignMediaToSlide,
}) => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterType, setFilterType] = React.useState<"all" | "image" | "video">("all");

  const filteredMedia = mediaList.filter((media) => {
    const matchesSearch = media.fileName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesType =
      filterType === "all" ||
      (filterType === "image" && media.mimeType.startsWith("image/")) ||
      (filterType === "video" && media.mimeType.startsWith("video/"));
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-3 pt-3 border-t border-border/60">
      <h4 className="text-xs font-bold text-foreground/80 border-b border-border/40 pb-1 uppercase tracking-wider flex items-center justify-between">
        <span>Trang hiện tại (Trang {activeSlideIndex + 1})</span>
        <Badge
          variant="secondary"
          className="text-[9px] font-bold bg-primary/10 text-primary border-none"
        >
          Đang sửa
        </Badge>
      </h4>

      {/* Slide Duration Input */}
      {!activeSlide.mimeType?.startsWith("video/") ? (
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            Thời gian trình chiếu (giây)
          </label>
          <Input
            type="number"
            value={activeSlide.duration}
            onChange={(e) =>
              onChangeSlideDuration(
                Math.max(1, parseInt(e.target.value) || 1),
              )
            }
            className="h-8 text-xs font-mono"
            min="1"
          />
        </div>
      ) : (
        <div className="bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-[11px] p-2.5 rounded-lg font-medium flex items-start gap-1.5 leading-relaxed">
          <Film className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
          <span>
            Video sẽ được phát hết thời lượng thực tế trước khi chuyển trang.
          </span>
        </div>
      )}

      {/* Media Library */}
      <div className="space-y-2 pt-1">
        <label className="text-[10px] font-bold text-muted-foreground uppercase">
          Chọn hình ảnh / video
        </label>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/60" />
          <Input
            placeholder="Tìm kiếm tài nguyên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>

        {/* Type Filter */}
        <div className="flex border border-border bg-muted/30 p-0.5 rounded-md text-[10px] font-semibold">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`flex-1 py-1 rounded text-center transition-all ${filterType === "all" ? "bg-background shadow-xs text-foreground font-bold" : "text-muted-foreground"}`}
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => setFilterType("image")}
            className={`flex-1 py-1 rounded text-center transition-all ${filterType === "image" ? "bg-background shadow-xs text-foreground font-bold" : "text-muted-foreground"}`}
          >
            Ảnh
          </button>
          <button
            type="button"
            onClick={() => setFilterType("video")}
            className={`flex-1 py-1 rounded text-center transition-all ${filterType === "video" ? "bg-background shadow-xs text-foreground font-bold" : "text-muted-foreground"}`}
          >
            Video
          </button>
        </div>

        {/* Media List */}
        <div className="border border-border rounded-lg max-h-[220px] overflow-y-auto divide-y divide-border/60 bg-muted/10 pr-1 scrollbar-thin">
          {filteredMedia.map((media) => {
            const isSelected = activeSlide.mediaId === media.id;
            const isVideo = media.mimeType.startsWith("video/");

            return (
              <div
                key={media.id}
                onClick={() => onAssignMediaToSlide(media.id)}
                className={`flex items-center justify-between p-2 cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-primary/10 font-bold border-l-2 border-primary"
                    : "hover:bg-muted/80 bg-background"
                }`}
              >
                <div className="flex items-center gap-2 max-w-[80%]">
                  <div className="h-7 w-7 rounded overflow-hidden shrink-0 border border-border/40 bg-zinc-100 flex items-center justify-center relative">
                    {isVideo ? (
                      <Film className="h-3.5 w-3.5 text-blue-500" />
                    ) : (
                      <Image
                        src={getFileUrl(media.fileUrl)}
                        alt={media.fileName}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    )}
                  </div>
                  <span className="truncate text-[11px] text-foreground">
                    {media.fileName}
                  </span>
                </div>

                <div
                  className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-border bg-background"
                  }`}
                >
                  {isSelected && <Check className="h-2.5 w-2.5" />}
                </div>
              </div>
            );
          })}

          {filteredMedia.length === 0 && (
            <div className="p-4 text-center text-[10px] text-muted-foreground italic">
              Không tìm thấy tệp phù hợp
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
