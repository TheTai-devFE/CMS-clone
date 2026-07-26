import React from "react";
import { Button } from "@/components/ui/button";
import { MediaItem, Device } from "@/types/dashboard";
import { Film, Settings } from "lucide-react";
import { PlaylistItemData } from "./PlaylistSidebar";

interface PlaylistConfigHeaderProps {
  playlistName: string;
  setPlaylistName: (name: string) => void;
  selectedResValue: string;
  setSelectedResValue: (val: string) => void;
  resolutionOptions: { label: string; value: string }[];
  isSyncGroup: boolean;
  setIsSyncGroup: (val: boolean) => void;
  isVideoWallMode: boolean;
  setIsVideoWallMode: (val: boolean) => void;
  scaleMode: "stretch" | "crop";
  setScaleMode: (mode: "stretch" | "crop") => void;
  playlistDesc: string;
  setPlaylistDesc: (desc: string) => void;
  activeSlide: PlaylistItemData | null;
  activeSlideIndex: number;
  handleUpdateSlideDuration: (dur: number) => void;
}

export const PlaylistConfigHeader: React.FC<PlaylistConfigHeaderProps> = ({
  playlistName,
  setPlaylistName,
  selectedResValue,
  setSelectedResValue,
  resolutionOptions,
  isSyncGroup,
  setIsSyncGroup,
  isVideoWallMode,
  setIsVideoWallMode,
  scaleMode,
  setScaleMode,
  playlistDesc,
  setPlaylistDesc,
  activeSlide,
  activeSlideIndex,
  handleUpdateSlideDuration,
}) => {
  return (
    <div className="bg-card border border-border p-4 rounded-2xl shadow-sm space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Playlist Name */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">
            Tên Playlist *
          </label>
          <input
            value={playlistName}
            onChange={(e) => setPlaylistName(e.target.value)}
            placeholder="Nhập tên playlist"
            className="w-full h-8 rounded-md border border-input px-2 py-1 bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>

        {/* Resolution */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">
            Tỷ lệ màn hình
          </label>
          <select
            value={selectedResValue}
            onChange={(e) => setSelectedResValue(e.target.value)}
            className="w-full h-8 rounded-md border border-input px-2 py-1 bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          >
            {resolutionOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Playlist Mode */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">
            Chế độ phát
          </label>
          <div className="flex border border-border bg-muted/30 p-0.5 rounded-md text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setIsSyncGroup(false);
                setIsVideoWallMode(false);
              }}
              className={`flex-1 py-1 rounded text-center transition-all ${!isSyncGroup ? "bg-background shadow-xs text-foreground font-bold" : "text-muted-foreground"}`}
            >
              Đơn lẻ
            </button>
            <button
              type="button"
              onClick={() => setIsSyncGroup(true)}
              className={`flex-1 py-1 rounded text-center transition-all ${isSyncGroup ? "bg-background shadow-xs text-foreground font-bold" : "text-muted-foreground"}`}
            >
              Đồng bộ
            </button>
          </div>
        </div>

        {/* Scale Mode */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">
            Tỷ lệ co giãn
          </label>
          <div className="flex border border-border bg-muted/30 p-0.5 rounded-md text-xs font-semibold">
            <button
              type="button"
              onClick={() => setScaleMode("stretch")}
              className={`flex-1 py-1 rounded text-center transition-all ${scaleMode === "stretch" ? "bg-background shadow-xs text-foreground font-bold" : "text-muted-foreground"}`}
            >
              Bóp hình (Stretch)
            </button>
            <button
              type="button"
              onClick={() => setScaleMode("crop")}
              className={`flex-1 py-1 rounded text-center transition-all ${scaleMode === "crop" ? "bg-background shadow-xs text-foreground font-bold" : "text-muted-foreground"}`}
            >
              Cắt hình (Crop)
            </button>
          </div>
        </div>
      </div>

      {/* Description row */}
      <div className="mt-3 pt-3 border-t border-border/40 flex items-center gap-4">
        <div className="flex-1 space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">
            Mô tả ngắn
          </label>
          <input
            value={playlistDesc}
            onChange={(e) => setPlaylistDesc(e.target.value)}
            placeholder="Mô tả danh sách phát"
            className="w-full h-8 rounded-md border border-input px-2 py-1 bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>
        {activeSlide && (
          <div className="w-48 space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">
              Thời gian slide {activeSlideIndex + 1} (giây)
            </label>
            {!activeSlide.mimeType?.startsWith("video/") ? (
              <input
                type="number"
                value={activeSlide.duration}
                onChange={(e) => handleUpdateSlideDuration(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full h-8 rounded-md border border-input px-2 py-1 bg-background text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                min="1"
              />
            ) : (
              <span className="text-[10px] text-blue-500 italic">Tự động theo video</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
