import React from "react";
import Image from "next/image";
import { MediaItem } from "@/types/dashboard";
import { getFileUrl } from "@/utils/api";
import { Film, Search, Check } from "lucide-react";

interface PlaylistMediaLibraryProps {
  mediaSearchQuery: string;
  setMediaSearchQuery: (query: string) => void;
  mediaFilterType: "all" | "image" | "video";
  setMediaFilterType: (type: "all" | "image" | "video") => void;
  filteredMedia: MediaItem[];
  activeSlideMediaId: string | null | undefined;
  handleAssignMediaToSlide: (mediaId: string) => void;
}

export const PlaylistMediaLibrary: React.FC<PlaylistMediaLibraryProps> = ({
  mediaSearchQuery,
  setMediaSearchQuery,
  mediaFilterType,
  setMediaFilterType,
  filteredMedia,
  activeSlideMediaId,
  handleAssignMediaToSlide,
}) => {
  return (
    <div className="w-72 shrink-0 border-l border-border bg-card flex flex-col h-[calc(100vh-20rem)] min-h-[400px] rounded-r-xl overflow-hidden">
      <div className="p-3 border-b border-border/60 bg-muted/20">
        <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Film className="h-4 w-4 text-primary shrink-0" />
          Thư viện Media
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/60" />
          <input
            placeholder="Tìm kiếm tài nguyên..."
            value={mediaSearchQuery}
            onChange={(e) => setMediaSearchQuery(e.target.value)}
            className="w-full h-8 rounded-md border border-input pl-8 pr-2 py-1 bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>

        {/* Type Filter */}
        <div className="flex border border-border bg-muted/30 p-0.5 rounded-md text-[10px] font-semibold">
          <button
            type="button"
            onClick={() => setMediaFilterType("all")}
            className={`flex-1 py-1 rounded text-center transition-all ${mediaFilterType === "all" ? "bg-background shadow-xs text-foreground font-bold" : "text-muted-foreground"}`}
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => setMediaFilterType("image")}
            className={`flex-1 py-1 rounded text-center transition-all ${mediaFilterType === "image" ? "bg-background shadow-xs text-foreground font-bold" : "text-muted-foreground"}`}
          >
            Ảnh
          </button>
          <button
            type="button"
            onClick={() => setMediaFilterType("video")}
            className={`flex-1 py-1 rounded text-center transition-all ${mediaFilterType === "video" ? "bg-background shadow-xs text-foreground font-bold" : "text-muted-foreground"}`}
          >
            Video
          </button>
        </div>

        {/* Media Items */}
        <div className="border border-border rounded-lg max-h-[300px] overflow-y-auto divide-y divide-border/60 bg-muted/10 pr-1 scrollbar-thin">
          {filteredMedia.map((media) => {
            const isSelected = activeSlideMediaId === media.id;
            const isMediaVideo = media.mimeType.startsWith("video/");

            return (
              <div
                key={media.id}
                onClick={() => handleAssignMediaToSlide(media.id)}
                className={`flex items-center justify-between p-2 cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-primary/10 font-bold border-l-2 border-primary"
                    : "hover:bg-muted/80 bg-background"
                }`}
              >
                <div className="flex items-center gap-2 max-w-[80%]">
                  <div className="h-6 w-6 rounded overflow-hidden shrink-0 border border-border/40 bg-zinc-100 flex items-center justify-center relative">
                    {isMediaVideo ? (
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
              Không tìm thấy tệp phù hợp trong thư viện
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
