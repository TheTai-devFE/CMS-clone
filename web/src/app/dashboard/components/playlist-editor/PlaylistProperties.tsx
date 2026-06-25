import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Settings, Clock, Check, Search, Film, FileText, Globe, ImageIcon } from "lucide-react";
import { MediaItem, Device } from "@/types/dashboard";
import { PlaylistItemData } from "./PlaylistSidebar";
import { getFileUrl } from "@/utils/api";

const RESOLUTION_OPTIONS = [
  {
    label: "FullHD Ngang - 1920 * 1080 (16:9)",
    value: "1920*1080",
    ratio: "16:9",
    width: 1920,
    height: 1080,
  },
  {
    label: "FullHD Dọc - 1080 * 1920 (9:16)",
    value: "1080*1920",
    ratio: "9:16",
    width: 1080,
    height: 1920,
  },
  {
    label: "4K Ngang - 3840 * 2160 (16:9)",
    value: "3840*2160",
    ratio: "16:9",
    width: 3840,
    height: 2160,
  },
  {
    label: "4K Dọc - 2160 * 3840 (9:16)",
    value: "2160*3840",
    ratio: "9:16",
    width: 2160,
    height: 3840,
  },
];

interface PlaylistPropertiesProps {
  playlistName: string;
  onChangePlaylistName: (name: string) => void;
  playlistDesc: string;
  onChangePlaylistDesc: (desc: string) => void;
  selectedResValue: string;
  onChangeResolution: (res: string) => void;
  isSyncGroup: boolean;
  onChangeSyncGroup: (sync: boolean) => void;
  activeSlide: PlaylistItemData | null;
  activeSlideIndex: number;
  onChangeSlideDuration: (duration: number) => void;
  mediaList: MediaItem[];
  onAssignMediaToSlide: (mediaId: string) => void;
  deviceList: Device[];
  targetDeviceId: string;
  onChangeTargetDevice: (id: string) => void;
  onChangeSlideTargetDevices: (ids: string[]) => void;
  scaleMode: "stretch" | "crop";
  onChangeScaleMode: (mode: "stretch" | "crop") => void;

  // Video Wall Props
  isVideoWallMode: boolean;
  onChangeVideoWallMode: (mode: boolean) => void;
  videoWallRows: number;
  onChangeVideoWallRows: (rows: number) => void;
  videoWallCols: number;
  onChangeVideoWallCols: (cols: number) => void;
  videoWallSourceMediaId: string;
  onChangeVideoWallSourceMedia: (mediaId: string) => void;
}

export default function PlaylistProperties({
  playlistName,
  onChangePlaylistName,
  playlistDesc,
  onChangePlaylistDesc,
  selectedResValue,
  onChangeResolution,
  isSyncGroup,
  onChangeSyncGroup,
  activeSlide,
  activeSlideIndex,
  onChangeSlideDuration,
  mediaList,
  onAssignMediaToSlide,
  deviceList,
  targetDeviceId,
  onChangeTargetDevice,
  onChangeSlideTargetDevices,
  scaleMode,
  onChangeScaleMode,
  isVideoWallMode,
  onChangeVideoWallMode,
  videoWallRows,
  onChangeVideoWallRows,
  videoWallCols,
  onChangeVideoWallCols,
  videoWallSourceMediaId,
  onChangeVideoWallSourceMedia,
}: PlaylistPropertiesProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "image" | "video" | "pdf" | "url">(
    "all",
  );

  const getResolutionDetails = (value: string) => {
    const standard = RESOLUTION_OPTIONS.find((opt) => opt.value === value);
    if (standard) return standard;
    const parts = value.split("*").map(Number);
    const w = parts[0] || 1920;
    const h = parts[1] || 1080;
    const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
    const divisor = gcd(w, h);
    const ratio = divisor > 1 ? `${w / divisor}:${h / divisor}` : "custom";
    return {
      label: `Tùy chỉnh - ${w} * ${h} (${ratio})`,
      value,
      ratio: `${w}:${h}`,
      width: w,
      height: h,
    };
  };

  const selectedOption = getResolutionDetails(selectedResValue);

  const currentResolutionOptions = RESOLUTION_OPTIONS.find(
    (opt) => opt.value === selectedResValue,
  )
    ? RESOLUTION_OPTIONS
    : [...RESOLUTION_OPTIONS, selectedOption];

  // Filter media list by search query and tab selection
  const filteredMedia = mediaList.filter((media) => {
    const matchesSearch = media.fileName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const isImg = media.mimeType.startsWith("image/");
    const isVid = media.mimeType.startsWith("video/");
    const isPdf = media.mimeType === "application/pdf";
    const isUrl = media.mimeType === "url";

    if (filterType === "image") return matchesSearch && isImg;
    if (filterType === "video") return matchesSearch && isVid;
    if (filterType === "pdf") return matchesSearch && isPdf;
    if (filterType === "url") return matchesSearch && isUrl;
    return matchesSearch && (isImg || isVid || isPdf || isUrl);
  });

  return (
    <div className="w-80 shrink-0 border-l border-border bg-card flex flex-col h-[calc(100vh-12rem)] min-h-[500px] rounded-r-xl overflow-hidden">
      {/* Sidebar Header */}
      <div className="p-3 border-b border-border/60 bg-muted/20">
        <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Settings className="h-4 w-4 text-primary shrink-0" />
          Bảng cấu hình
        </span>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
        {/* 1. PLAYLIST GENERAL CONFIG */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-foreground/80 border-b border-border/40 pb-1 uppercase tracking-wider">
            Thông tin chung
          </h4>

          {/* Playlist Name */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">
              Tên Playlist *
            </label>
            <Input
              value={playlistName}
              onChange={(e) => onChangePlaylistName(e.target.value)}
              placeholder="Nhập tên playlist"
              className="h-8 text-xs font-semibold"
            />
          </div>

          {/* Playlist Desc */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">
              Mô tả ngắn
            </label>
            <Input
              value={playlistDesc}
              onChange={(e) => onChangePlaylistDesc(e.target.value)}
              placeholder="Mô tả danh sách phát"
              className="h-8 text-xs font-semibold"
            />
          </div>

          {/* Resolution Ratio */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">
              Tỷ lệ màn hình
            </label>
            <select
              value={selectedResValue}
              onChange={(e) => onChangeResolution(e.target.value)}
              className="w-full h-8 rounded-md border border-input px-2 py-1 bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            >
              {currentResolutionOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Playlist Mode Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">
              Chế độ phát
            </label>
            <div className="flex border border-border bg-muted/30 p-0.5 rounded-md text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  onChangeSyncGroup(false);
                  onChangeVideoWallMode(false);
                }}
                className={`flex-1 py-1 rounded text-center transition-all ${!isSyncGroup ? "bg-background shadow-xs text-foreground font-bold" : "text-muted-foreground"}`}
              >
                Đơn lẻ
              </button>
              <button
                type="button"
                onClick={() => onChangeSyncGroup(true)}
                className={`flex-1 py-1 rounded text-center transition-all ${isSyncGroup ? "bg-background shadow-xs text-foreground font-bold" : "text-muted-foreground"}`}
              >
                Đồng bộ
              </button>
            </div>
          </div>

          {/* Sync Mode Type Selector */}
          {isSyncGroup && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">
                Loại đồng bộ
              </label>
              <div className="flex border border-border bg-muted/30 p-0.5 rounded-md text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => onChangeVideoWallMode(false)}
                  className={`flex-1 py-1 rounded text-center transition-all ${!isVideoWallMode ? "bg-background shadow-xs text-foreground font-bold" : "text-muted-foreground"}`}
                >
                  Tiêu chuẩn
                </button>
                <button
                  type="button"
                  onClick={() => onChangeVideoWallMode(true)}
                  className={`flex-1 py-1 rounded text-center transition-all ${isVideoWallMode ? "bg-background shadow-xs text-foreground font-bold" : "text-muted-foreground"}`}
                >
                  Video Wall
                </button>
              </div>
            </div>
          )}

          {/* Single Mode: Device Selector & Auto Resolution */}
          {!isSyncGroup && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">
                Thiết bị hiển thị (Player)
              </label>
              <select
                value={targetDeviceId}
                onChange={(e) => {
                  const devId = e.target.value;
                  onChangeTargetDevice(devId);

                  const selectedDevice = deviceList.find((d) => d.id === devId);
                  if (selectedDevice?.screenResolution) {
                    // Chuẩn hóa chuỗi độ phân giải (ví dụ "1920x1080" hoặc "1920 * 1080" thành "1920*1080")
                    const normalizedRes = selectedDevice.screenResolution
                      .toLowerCase()
                      .replace(/\s+/g, "")
                      .replace("x", "*");

                    if (normalizedRes.includes("*")) {
                      onChangeResolution(normalizedRes);
                    }
                  }
                }}
                className="w-full h-8 rounded-md border border-input px-2 py-1 bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="">-- Chọn thiết bị phát --</option>
                {deviceList.map((dev) => (
                  <option key={dev.id} value={dev.id}>
                    {dev.deviceName} (
                    {dev.screenResolution || "Chưa cấu hình tỷ lệ"})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Scale Mode Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">
              Tỷ lệ co giãn
            </label>
            <div className="flex border border-border bg-muted/30 p-0.5 rounded-md text-xs font-semibold">
              <button
                type="button"
                onClick={() => onChangeScaleMode("stretch")}
                className={`flex-1 py-1 rounded text-center transition-all ${scaleMode === "stretch" ? "bg-background shadow-xs text-foreground font-bold" : "text-muted-foreground"}`}
              >
                Bóp hình (Stretch)
              </button>
              <button
                type="button"
                onClick={() => onChangeScaleMode("crop")}
                className={`flex-1 py-1 rounded text-center transition-all ${scaleMode === "crop" ? "bg-background shadow-xs text-foreground font-bold" : "text-muted-foreground"}`}
              >
                Cắt hình (Crop)
              </button>
            </div>
          </div>
        </div>

        {/* 3. VIDEO WALL CONFIG */}
        {isSyncGroup && isVideoWallMode && (
          <div className="space-y-3 pt-3 border-t border-border/60">
            <h4 className="text-xs font-bold text-foreground/80 border-b border-border/40 pb-1 uppercase tracking-wider flex items-center justify-between">
              <span>Cấu hình Video Wall</span>
              <Badge
                variant="secondary"
                className="text-[9px] font-bold bg-primary/10 text-primary border-none"
              >
                CSS Crop
              </Badge>
            </h4>

            {/* Rows & Cols Inputs */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">
                  Số hàng
                </label>
                <Input
                  type="number"
                  value={videoWallRows}
                  onChange={(e) =>
                    onChangeVideoWallRows(
                      Math.min(10, Math.max(1, parseInt(e.target.value) || 1)),
                    )
                  }
                  className="h-8 text-xs font-semibold"
                  min="1"
                  max="10"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">
                  Số cột
                </label>
                <Input
                  type="number"
                  value={videoWallCols}
                  onChange={(e) =>
                    onChangeVideoWallCols(
                      Math.min(10, Math.max(1, parseInt(e.target.value) || 1)),
                    )
                  }
                  className="h-8 text-xs font-semibold"
                  min="1"
                  max="10"
                />
              </div>
            </div>

            {/* Source Media Picker — Video + Image, excluding Wall_* auto-generated files */}
            <div className="space-y-2 pt-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">
                Chọn nội dung nguồn (Video / Ảnh) *
              </label>

              {/* Media List - Videos + Images, filtered */}
              <div className="border border-border rounded-lg max-h-[200px] overflow-y-auto divide-y divide-border/60 bg-muted/10 pr-1 scrollbar-thin">
                {mediaList
                  .filter((media) => {
                    // Include videos and images, exclude auto-generated Wall_* slices
                    const isVideoOrImage = media.mimeType.startsWith("video/") || media.mimeType.startsWith("image/");
                    const isAutoGenerated = media.fileName.startsWith("Wall_");
                    return isVideoOrImage && !isAutoGenerated;
                  })
                  .map((media) => {
                    const isSelected = videoWallSourceMediaId === media.id;
                    const isVideo = media.mimeType.startsWith("video/");

                    return (
                      <div
                        key={media.id}
                        onClick={() => onChangeVideoWallSourceMedia(media.id)}
                        className={`flex items-center justify-between p-2 cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-primary/10 font-bold border-l-2 border-primary"
                            : "hover:bg-muted/80 bg-background"
                        }`}
                      >
                        <div className="flex items-center gap-2 max-w-[80%]">
                          <div className="h-6 w-6 rounded overflow-hidden shrink-0 border border-border/40 bg-zinc-100 flex items-center justify-center">
                            {isVideo ? (
                              <Film className="h-3.5 w-3.5 text-blue-500" />
                            ) : (
                              <ImageIcon className="h-3.5 w-3.5 text-emerald-500" />
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

                {mediaList.filter((media) => {
                  const isVideoOrImage = media.mimeType.startsWith("video/") || media.mimeType.startsWith("image/");
                  const isAutoGenerated = media.fileName.startsWith("Wall_");
                  return isVideoOrImage && !isAutoGenerated;
                }).length === 0 && (
                  <div className="p-4 text-center text-[10px] text-muted-foreground italic">
                    Không tìm thấy tệp video hoặc hình ảnh nào trong thư viện
                  </div>
                )}
              </div>

              {/* Guidance note */}
              <div className="bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] p-2 rounded-lg font-medium leading-relaxed">
                💡 Chọn bất kỳ video hoặc ảnh nào. Player sẽ tự động hiển thị phần crop tương ứng vị trí trên lưới, không cần video siêu rộng.
              </div>
            </div>
          </div>
        )}

        {/* 2. ACTIVE SLIDE CONFIG */}
        {activeSlide && !isVideoWallMode && (
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
                  Video sẽ được phát hết thời lượng thực tế trước khi chuyển
                  trang.
                </span>
              </div>
            )}

            {/* Sync Mode: Slide-level Multiple Player Selector */}
            {isSyncGroup && (
              <div className="space-y-1.5 border border-border/60 bg-muted/10 p-2.5 rounded-lg">
                <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                  Thiết bị phát (Chọn nhiều)
                </label>
                <div className="max-h-[120px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                  {deviceList.map((dev) => {
                    const isChecked = (
                      activeSlide.targetDeviceIds || []
                    ).includes(dev.id);
                    return (
                      <div key={dev.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`slide-dev-${dev.id}`}
                          checked={isChecked}
                          onChange={(e) => {
                            const newIds = e.target.checked
                              ? [...(activeSlide.targetDeviceIds || []), dev.id]
                              : (activeSlide.targetDeviceIds || []).filter(
                                  (id) => id !== dev.id,
                                );
                            onChangeSlideTargetDevices(newIds);
                          }}
                          className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer shrink-0"
                        />
                        <label
                          htmlFor={`slide-dev-${dev.id}`}
                          className="text-[11px] font-medium text-foreground select-none cursor-pointer truncate"
                          title={dev.deviceName}>
                          {dev.deviceName}
                        </label>
                      </div>
                    );
                  })}
                  {deviceList.length === 0 && (
                    <div className="text-[10px] text-muted-foreground italic text-center py-2">
                      Không có thiết bị khả dụng
                    </div>
                  )}
                </div>
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
              <div className="flex border border-border bg-muted/30 p-0.5 rounded-md text-[9px] font-semibold overflow-x-auto no-scrollbar gap-0.5">
                <button
                  type="button"
                  onClick={() => setFilterType("all")}
                  className={`flex-grow min-w-[42px] py-1 rounded text-center transition-all ${filterType === "all" ? "bg-background shadow-xs text-foreground font-bold" : "text-muted-foreground"}`}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType("image")}
                  className={`flex-grow min-w-[32px] py-1 rounded text-center transition-all ${filterType === "image" ? "bg-background shadow-xs text-foreground font-bold" : "text-muted-foreground"}`}
                >
                  Ảnh
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType("video")}
                  className={`flex-grow min-w-[36px] py-1 rounded text-center transition-all ${filterType === "video" ? "bg-background shadow-xs text-foreground font-bold" : "text-muted-foreground"}`}
                >
                  Video
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType("pdf")}
                  className={`flex-grow min-w-[32px] py-1 rounded text-center transition-all ${filterType === "pdf" ? "bg-background shadow-xs text-foreground font-bold" : "text-muted-foreground"}`}
                >
                  PDF
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType("url")}
                  className={`flex-grow min-w-[32px] py-1 rounded text-center transition-all ${filterType === "url" ? "bg-background shadow-xs text-foreground font-bold" : "text-muted-foreground"}`}
                >
                  Web
                </button>
              </div>

              {/* Media List */}
              <div className="border border-border rounded-lg max-h-[200px] overflow-y-auto divide-y divide-border/60 bg-muted/10 pr-1 scrollbar-thin">
                {filteredMedia.map((media) => {
                  const isSelected = activeSlide.mediaId === media.id;
                  const isMediaVideo = media.mimeType.startsWith("video/");

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
                        <div className="h-6 w-6 rounded overflow-hidden shrink-0 border border-border/40 bg-zinc-100 flex items-center justify-center">
                          {isMediaVideo ? (
                            <Film className="h-3.5 w-3.5 text-blue-500" />
                          ) : media.mimeType === "application/pdf" ? (
                            <FileText className="h-3.5 w-3.5 text-red-500" />
                          ) : media.mimeType === "url" ? (
                            <Globe className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <img
                              src={getFileUrl(media.fileUrl)}
                              alt={media.fileName}
                              className="h-full w-full object-cover"
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
        )}
      </div>
    </div>
  );
}
