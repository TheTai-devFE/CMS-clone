import React from "react";
import { Settings } from "lucide-react";

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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsSyncGroup(false);
                setIsVideoWallMode(false);
              }}
              className={`h-8 flex-1 rounded-md border text-xs font-semibold transition-all ${
                !isSyncGroup
                  ? "border-primary bg-primary text-primary-foreground shadow-xs"
                  : "border-input bg-background text-muted-foreground"
              }`}
            >
              Đơn lẻ
            </button>
            <button
              type="button"
              onClick={() => setIsSyncGroup(true)}
              className={`h-8 flex items-center gap-1 px-2 rounded-md border text-[11px] font-medium transition-all whitespace-nowrap ${
                isSyncGroup
                  ? "border-primary text-primary bg-primary/10"
                  : "border-input text-muted-foreground hover:text-foreground"
              }`}
              title="Đồng bộ nhiều màn hình"
            >
              <Settings className="w-3.5 h-3.5" />
              Đồng bộ
            </button>
          </div>
          {isSyncGroup && (
            <div className="flex border border-border bg-muted/30 p-0.5 rounded-md text-[11px] font-semibold mt-1">
              <button
                type="button"
                onClick={() => setIsVideoWallMode(false)}
                className={`flex-1 py-1 rounded text-center transition-all ${!isVideoWallMode ? "bg-background shadow-xs text-foreground font-bold" : "text-muted-foreground"}`}
              >
                Tiêu chuẩn
              </button>
              <button
                type="button"
                onClick={() => setIsVideoWallMode(true)}
                className={`flex-1 py-1 rounded text-center transition-all ${isVideoWallMode ? "bg-background shadow-xs text-foreground font-bold" : "text-muted-foreground"}`}
              >
                Video Wall
              </button>
            </div>
          )}
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
    </div>
  );
};
