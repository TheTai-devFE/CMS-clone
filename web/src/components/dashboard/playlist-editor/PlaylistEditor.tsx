import { Button } from "@/components/ui/button";
import Image from "next/image";
import { MediaItem, Playlist, Device } from "@/types/dashboard";
import { api, getFileUrl } from "@/utils/api";
import { ChevronLeft, Clock, Film, Layers, Loader2, Search, Check, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import PlaylistCanvas from "./PlaylistCanvas";
import PlaylistSidebar, { PlaylistItemData } from "./PlaylistSidebar";

interface PlaylistEditorProps {
  editingPlaylist: Playlist | null;
  mediaList: MediaItem[];
  onClose: () => void;
  onSave: () => void;
  onCreated?: (playlistId: string) => void;
}

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

export default function PlaylistEditor({
  editingPlaylist,
  mediaList,
  onClose,
  onSave,
  onCreated,
}: PlaylistEditorProps) {
  // Playlist States
  const [playlistName, setPlaylistName] = useState("");
  const [playlistDesc, setPlaylistDesc] = useState("");
  const [selectedResValue, setSelectedResValue] = useState("1920*1080");
  const [isSyncGroup, setIsSyncGroup] = useState(false);

  // Video Wall States
  const [isVideoWallMode, setIsVideoWallMode] = useState(false);
  const [videoWallRows, setVideoWallRows] = useState(1);
  const [videoWallCols, setVideoWallCols] = useState(1);
  const [videoWallSourceMediaId, setVideoWallSourceMediaId] = useState("");
  const [videoWallMapping, setVideoWallMapping] = useState<
    Record<string, string>
  >({});

  // Slides State
  const [slides, setSlides] = useState<PlaylistItemData[]>([]);
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);

  const [scaleFactor, setScaleFactor] = useState(0.4);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  const [scaleMode, setScaleMode] = useState<"stretch" | "crop">("stretch");

  // Media list filter/search state
  const [mediaSearchQuery, setMediaSearchQuery] = useState("");
  const [mediaFilterType, setMediaFilterType] = useState<"all" | "image" | "video">("all");

  const filteredMedia = mediaList.filter((media) => {
    const matchesSearch = media.fileName.toLowerCase().includes(mediaSearchQuery.toLowerCase());
    const isImg = media.mimeType.startsWith("image/");
    const isVid = media.mimeType.startsWith("video/");
    if (mediaFilterType === "image") return matchesSearch && isImg;
    if (mediaFilterType === "video") return matchesSearch && isVid;
    return matchesSearch && (isImg || isVid);
  });

  // Players list state (for Video Wall only)
  const [deviceList, setDeviceList] = useState<Device[]>([]);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const data = (await api.get("/api/devices")) as Device[];
        setDeviceList(data || []);
      } catch (err) {
        console.error("Lỗi khi tải danh sách thiết bị:", err);
      }
    };
    fetchDevices();
  }, []);

  // Draft States
  const [draftStatus, setDraftStatus] = useState<
    "idle" | "detected" | "restored" | "ignored"
  >(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("cms_playlist_draft") ? "detected" : "idle";
    }
    return "idle";
  });

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
      label: `Thiết bị - ${w} * ${h} (${ratio})`,
      value,
      ratio: `${w}:${h}`,
      width: w,
      height: h,
    };
  };

  const selectedOption = getResolutionDetails(selectedResValue);
  const canvasWidth = selectedOption.width;
  const canvasHeight = selectedOption.height;

  // Initialize playlist and items
  useEffect(() => {
    const loadPlaylistData = async () => {
      if (editingPlaylist) {
        setPlaylistName(editingPlaylist.playlistName);
        setPlaylistDesc(editingPlaylist.description || "");
        setIsSyncGroup(editingPlaylist.isSyncGroup || false);

        interface SyncLayoutConfig {
          width?: number;
          height?: number;
          scaleMode?: "stretch" | "crop";
          deviceMapping?: Record<string, string[]>;
          videoWall?: {
            rows: number;
            cols: number;
            sourceMediaId: string;
          };
        }
        const syncLayout = (
          editingPlaylist as { syncLayout?: SyncLayoutConfig }
        ).syncLayout;
        if (syncLayout?.width && syncLayout?.height) {
          setSelectedResValue(`${syncLayout.width}*${syncLayout.height}`);
        } else {
          setSelectedResValue("1920*1080");
        }
        setScaleMode(syncLayout?.scaleMode || "stretch");

        if (syncLayout?.videoWall) {
          setIsVideoWallMode(true);
          setVideoWallRows(syncLayout.videoWall.rows || 1);
          setVideoWallCols(syncLayout.videoWall.cols || 1);
          setVideoWallSourceMediaId(syncLayout.videoWall.sourceMediaId || "");

          const rows = syncLayout.videoWall.rows || 1;
          const cols = syncLayout.videoWall.cols || 1;
          const mapping: Record<string, string> = {};
          const deviceMapping = syncLayout.deviceMapping || {};

          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const slotIdx = r * cols + c + 1;
              const mappedDevices = deviceMapping[slotIdx.toString()];
              if (mappedDevices && mappedDevices.length > 0) {
                mapping[`${r}-${c}`] = mappedDevices[0];
              }
            }
          }
          setVideoWallMapping(mapping);
        } else {
          setIsVideoWallMode(false);
          setVideoWallRows(1);
          setVideoWallCols(1);
          setVideoWallSourceMediaId("");
          setVideoWallMapping({});
        }

        try {
          interface BackendPlaylistItem {
            id: string;
            sortOrder: number;
            duration: number;
            transitionEffect: string;
            media: {
              id: string;
              fileName: string;
              fileUrl: string;
              mimeType: string;
            };
          }
          const items = (await api.get(
            `/api/playlists/${editingPlaylist.id}/items`,
          )) as BackendPlaylistItem[];

          if (items && items.length > 0) {
            const mappedSlides: PlaylistItemData[] = items.map((item) => ({
              id: item.id,
              mediaId: item.media.id,
              duration: item.duration,
              fileName: item.media.fileName,
              fileUrl: item.media.fileUrl,
              mimeType: item.media.mimeType,
              targetDeviceIds:
                syncLayout?.deviceMapping?.[item.sortOrder.toString()] || [],
            }));
            setSlides(mappedSlides);
            setActiveSlideId(mappedSlides[0].id);
          } else {
            const defaultId = `slide-${Date.now()}`;
            setSlides([{ id: defaultId, mediaId: null, duration: 15 }]);
            setActiveSlideId(defaultId);
          }
        } catch (err) {
          console.error("Lỗi khi tải playlist items:", err);
          setErrorMsg("Không thể tải danh sách slide của playlist.");
        }
      } else {
        // Create Mode
        setPlaylistName("Playlist mới");
        setPlaylistDesc("");
        setSelectedResValue("1920*1080");
        setIsSyncGroup(false);
        setIsVideoWallMode(false);
        setVideoWallRows(1);
        setVideoWallCols(1);
        setVideoWallSourceMediaId("");
        setVideoWallMapping({});
        const defaultId = `slide-${Date.now()}`;
        setSlides([{ id: defaultId, mediaId: null, duration: 15 }]);
        setActiveSlideId(defaultId);
      }
    };

    loadPlaylistData();
  }, [editingPlaylist]);

  // Autosave trigger
  useEffect(() => {
    if (
      slides.length > 0 &&
      (draftStatus === "restored" ||
        draftStatus === "ignored" ||
        (draftStatus === "idle" && !localStorage.getItem("cms_playlist_draft")))
    ) {
      const draftData = {
        playlistName,
        playlistDesc,
        selectedResValue,
        isSyncGroup,
        slides,
        editingPlaylistId: editingPlaylist?.id || null,
      };
      localStorage.setItem("cms_playlist_draft", JSON.stringify(draftData));
    }
  }, [
    playlistName,
    playlistDesc,
    selectedResValue,
    isSyncGroup,
    slides,
    draftStatus,
    editingPlaylist,
  ]);

  // Recalculate scale factor
  useEffect(() => {
    if (!canvasRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const containerWidth = entry.contentRect.width;
        const maxDisplayHeight = 500;

        const scaleByWidth = (containerWidth - 40) / canvasWidth;
        const scaleByHeight = maxDisplayHeight / canvasHeight;
        const calculatedScale = Math.min(scaleByWidth, scaleByHeight);
        setScaleFactor(calculatedScale);
      }
    });

    const parent = canvasRef.current.parentElement;
    if (parent) {
      resizeObserver.observe(parent);
    }

    return () => resizeObserver.disconnect();
  }, [canvasWidth, canvasHeight]);

  const handleRestoreDraft = () => {
    try {
      const draftStr = localStorage.getItem("cms_playlist_draft");
      if (draftStr) {
        const draft = JSON.parse(draftStr);
        setPlaylistName(draft.playlistName || "Playlist mới");
        setPlaylistDesc(draft.playlistDesc || "");
        setSelectedResValue(draft.selectedResValue || "1920*1080");
        setIsSyncGroup(draft.isSyncGroup || false);
        setSlides(draft.slides || []);
        if (draft.slides && draft.slides.length > 0) {
          setActiveSlideId(draft.slides[0].id);
        }
        setDraftStatus("restored");
      }
    } catch (e) {
      console.error("Lỗi khi khôi phục bản nháp playlist:", e);
    }
  };

  const handleClearDraft = () => {
    localStorage.removeItem("cms_playlist_draft");
    setDraftStatus("ignored");
  };

  const handleCloseEditor = () => {
    if (draftStatus === "restored" || draftStatus === "ignored") {
      localStorage.removeItem("cms_playlist_draft");
    }
    onClose();
  };

  // Add slide
  const handleAddSlide = () => {
    const tempId = `temp-slide-${Date.now()}`;
    const newSlide: PlaylistItemData = {
      id: tempId,
      mediaId: null,
      duration: 15,
    };
    setSlides((prev) => [...prev, newSlide]);
    setActiveSlideId(tempId);
  };

  // Delete slide
  const handleDeleteSlide = (id: string) => {
    if (slides.length <= 1) return; // Keep at least 1 slide

    const itemIndex = slides.findIndex((s) => s.id === id);
    const updatedSlides = slides.filter((s) => s.id !== id);

    setSlides(updatedSlides);

    if (activeSlideId === id) {
      const nextActiveIndex = Math.min(itemIndex, updatedSlides.length - 1);
      setActiveSlideId(updatedSlides[nextActiveIndex]?.id || null);
    }
  };

  // Move slide
  const handleMoveSlide = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === slides.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const updatedSlides = [...slides];

    // Swap
    const temp = updatedSlides[index];
    updatedSlides[index] = updatedSlides[targetIndex];
    updatedSlides[targetIndex] = temp;

    setSlides(updatedSlides);
  };

  // Update active slide duration
  const handleUpdateSlideDuration = (duration: number) => {
    if (!activeSlideId) return;
    setSlides((prev) =>
      prev.map((s) => (s.id === activeSlideId ? { ...s, duration } : s)),
    );
  };

  // Assign media to active slide
  const handleAssignMediaToSlide = (mediaId: string) => {
    if (!activeSlideId) return;
    const media = mediaList.find((m) => m.id === mediaId);
    if (!media) return;

    setSlides((prev) =>
      prev.map((s) =>
        s.id === activeSlideId
          ? {
              ...s,
              mediaId,
              fileName: media.fileName,
              fileUrl: media.fileUrl,
              mimeType: media.mimeType,
            }
          : s,
      ),
    );
  };

  // Save Playlist
  const handleSavePlaylist = async () => {
    if (!playlistName.trim()) {
      setErrorMsg("Vui lòng nhập tên Playlist");
      return;
    }

    if (isVideoWallMode) {
      if (!videoWallSourceMediaId) {
        setErrorMsg("Vui lòng chọn Video nguồn cho Video Wall");
        return;
      }
      const totalCells = videoWallRows * videoWallCols;
      const mappedCellsCount = Object.keys(videoWallMapping).filter((key) => {
        const [r, c] = key.split("-").map(Number);
        return r < videoWallRows && c < videoWallCols && videoWallMapping[key];
      }).length;
      if (mappedCellsCount < totalCells) {
        setErrorMsg(
          `Vui lòng gán thiết bị hiển thị cho tất cả ${totalCells} ô trong lưới Video Wall`,
        );
        return;
      }
    } else {
      const hasEmptySlides = slides.some((s) => !s.mediaId);
      if (hasEmptySlides) {
        setErrorMsg(
          "Vui lòng gán hình ảnh hoặc video cho tất cả các trang trước khi lưu.",
        );
        return;
      }
    }

    try {
      setIsSaving(true);
      setErrorMsg(null);

      const deviceMapping: Record<string, string[]> = {};
      if (isVideoWallMode) {
        for (let r = 0; r < videoWallRows; r++) {
          for (let c = 0; c < videoWallCols; c++) {
            const slotIdx = r * videoWallCols + c + 1;
            const devId = videoWallMapping[`${r}-${c}`];
            if (devId) {
              deviceMapping[slotIdx.toString()] = [devId];
            }
          }
        }
      } else {
        slides.forEach((slide, idx) => {
          if (slide.targetDeviceIds && slide.targetDeviceIds.length > 0) {
            deviceMapping[(idx + 1).toString()] = slide.targetDeviceIds;
          }
        });
      }

      const playlistPayload = {
        playlistName: playlistName.trim(),
        description: playlistDesc.trim(),
        isSyncGroup,
        syncLayout: {
          width: selectedOption.width,
          height: selectedOption.height,
          aspectRatio: selectedOption.ratio,
          scaleMode,
          deviceMapping: isSyncGroup ? deviceMapping : undefined,
          videoWall: isVideoWallMode
            ? {
                rows: videoWallRows,
                cols: videoWallCols,
                sourceMediaId: videoWallSourceMediaId,
              }
            : undefined,
        },
      };

      let playlistId = "";
      const isNew = !editingPlaylist?.id;
      if (editingPlaylist?.id) {
        playlistId = editingPlaylist.id;
        await api.put(`/api/playlists/${playlistId}`, playlistPayload);
      } else {
        interface CreatedPlaylist {
          id: string;
        }
        const created = (await api.post(
          "/api/playlists",
          playlistPayload,
        )) as CreatedPlaylist;
        playlistId = created.id;
      }

      // Save playlist items (slides) ONLY when NOT in Video Wall mode
      if (!isVideoWallMode) {
        await api.post(`/api/playlists/${playlistId}/items`, {
          items: slides.map((slide, idx) => ({
            mediaId: slide.mediaId,
            sortOrder: idx + 1,
            duration: slide.duration,
            transitionEffect: "none",
          })),
        });
      }

      localStorage.removeItem("cms_playlist_draft");
      onSave();
      if (isNew && onCreated) {
        onCreated(playlistId);
      } else {
        onClose();
      }
    } catch (err) {
      const error = err as Error;
      setErrorMsg(error.message || "Lỗi khi lưu Playlist");
    } finally {
      setIsSaving(false);
    }
  };

  const activeSlide = slides.find((s) => s.id === activeSlideId) || null;
  const activeSlideIndex = slides.findIndex((s) => s.id === activeSlideId);

  return (
    <div className="space-y-4">
      {/* Editor Header Banner */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCloseEditor}
            className="rounded-full h-8 w-8 p-0"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h3 className="text-lg font-bold text-foreground">
              {editingPlaylist
                ? "Chỉnh sửa Playlist (PPTX)"
                : "Thiết kế Playlist Mới (PPTX)"}
            </h3>
            <p className="text-xs text-muted-foreground">
              Thiết kế danh sách phát quảng cáo dạng các slide chạy tuần tự
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleSavePlaylist}
            disabled={isSaving}
            className="bg-primary text-primary-foreground font-semibold"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang lưu...
              </>
            ) : (
              "Lưu Playlist"
            )}
          </Button>
        </div>
      </div>

      {/* Draft Notification Banner */}
      {draftStatus === "detected" && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-500 text-xs p-3 rounded-lg flex items-center justify-between gap-4 font-medium animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 shrink-0 text-amber-500 animate-pulse" />
            <span>
              Phát hiện bản nháp chưa lưu của Playlist. Bạn có muốn khôi phục
              không?
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRestoreDraft}
              className="h-7 text-[10px] bg-amber-500 hover:bg-amber-600 text-white border-none font-semibold px-3">
              Khôi phục
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearDraft}
              className="h-7 text-[10px] text-muted-foreground hover:text-foreground font-semibold px-3">
              Xóa nháp
            </Button>
          </div>
        </div>
      )}

      {/* Error Message Box */}
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm px-4 py-3 rounded-lg font-medium animate-in fade-in duration-150">
          {errorMsg}
        </div>
      )}

      {/* PPTX Editor Workspace */}
      {!isVideoWallMode && (
        <div className="space-y-4">
          {/* Top: Config Panel */}
          <div className="bg-card border border-border p-4 rounded-2xl shadow-sm">
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
                  {RESOLUTION_OPTIONS.map((opt) => (
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
            <div className="mt-3 pt-3 border-t border-border/40">
              <div className="flex items-center gap-4">
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
                    <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                      <Clock className="h-3 w-3" />
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
          </div>

          {/* Bottom: Workspace (Sidebar + Canvas | Media List) */}
          <div className="flex gap-4 items-start bg-card border border-border p-3 rounded-2xl shadow-sm w-full">
            {/* Left: Slide Sidebar */}
            <PlaylistSidebar
              slides={slides}
              activeSlideId={activeSlideId}
              mediaList={mediaList}
              onSelectSlide={setActiveSlideId}
              onAddSlide={handleAddSlide}
              onDeleteSlide={handleDeleteSlide}
              onMoveSlide={handleMoveSlide}
            />

            {/* Center: Slide Canvas Simulator */}
            <PlaylistCanvas
              activeSlide={activeSlide}
              mediaList={mediaList}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
              scaleFactor={scaleFactor}
              canvasRef={canvasRef}
              scaleMode={scaleMode}
            />

            {/* Right: Media List Only */}
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
                    const isSelected = activeSlide?.mediaId === media.id;
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
                          <div className="h-6 w-6 rounded overflow-hidden shrink-0 border border-border/40 bg-zinc-100 flex items-center justify-center">
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
          </div>
        </div>
      )}

      {/* Video Wall Mode */}
      {isVideoWallMode && (
        <div className="flex gap-4 items-start bg-card border border-border p-3 rounded-2xl shadow-sm w-full">
          <div className="flex-1 min-h-[500px] bg-muted/20 border border-border/40 rounded-xl p-6 flex flex-col justify-between space-y-4">
            <div>
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2 mb-1">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                Sơ đồ lắp ráp màn hình (Video Wall Simulator)
              </h4>
              <p className="text-xs text-muted-foreground">
                Gán từng Player (màn hình hiển thị) vật lý vào đúng vị trí tương
                ứng trong lưới để đồng bộ phát hình ảnh đã cắt.
              </p>
            </div>

            {/* Grid Container */}
            <div className="flex-1 flex items-center justify-center p-4">
              <div
                className="grid gap-3 w-full max-w-4xl transition-all duration-300"
                style={{
                  gridTemplateRows: `repeat(${videoWallRows}, minmax(0, 1fr))`,
                  gridTemplateColumns: `repeat(${videoWallCols}, minmax(0, 1fr))`,
                }}
              >
                {Array.from({ length: videoWallRows }).map((_, rIdx) =>
                  Array.from({ length: videoWallCols }).map((_, cIdx) => {
                    const cellKey = `${rIdx}-${cIdx}`;
                    const selectedDevId = videoWallMapping[cellKey] || "";
                    const cellNumber = rIdx * videoWallCols + cIdx + 1;

                    return (
                      <div
                        key={cellKey}
                        className={`border rounded-xl p-4 bg-card/60 backdrop-blur-md flex flex-col justify-between gap-3 shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary/50 relative overflow-hidden group ${
                          selectedDevId
                            ? "border-primary/40 bg-primary/5"
                            : "border-border/80"
                        }`}
                      >
                        <div className="absolute top-0 right-0 w-12 h-12 bg-primary/5 rounded-bl-full transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform" />

                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground/80 flex items-center gap-1.5">
                            <span className="h-5 w-5 rounded-md bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                              {cellNumber}
                            </span>
                            Ô {rIdx + 1}x{cIdx + 1}
                          </span>
                        </div>

                        <div className="space-y-1 z-10">
                          <select
                            value={selectedDevId}
                            onChange={(e) => {
                              const devId = e.target.value;
                              setVideoWallMapping((prev) => ({
                                ...prev,
                                [cellKey]: devId,
                              }));
                            }}
                            className="w-full h-8 rounded-md border border-input px-2 py-1 bg-background text-[11px] font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                          >
                            <option value="">-- Chọn Player --</option>
                            {deviceList.map((dev) => (
                              <option key={dev.id} value={dev.id}>
                                {dev.deviceName}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  }),
                )}
              </div>
            </div>

            <div className="text-[11px] text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border/40 leading-relaxed">
              💡 **Hướng dẫn:** Video wall sẽ cắt video nguồn ra làm **
              {videoWallRows * videoWallCols}** phần theo lưới trên. Khi phát,
              mỗi thiết bị ở ô tương ứng sẽ tự động tải phần video của mình về
              và chạy đồng bộ tuyệt đối với các ô còn lại qua cơ chế NTP Clock.
            </div>
          </div>

          {/* Video Wall Right Panel: Video Source + Device List */}
          <div className="w-72 shrink-0 border-l border-border bg-card flex flex-col h-[calc(100vh-20rem)] min-h-[400px] rounded-r-xl overflow-hidden">
            <div className="p-3 border-b border-border/60 bg-muted/20">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Settings className="h-4 w-4 text-primary shrink-0" />
                Cấu hình Video Wall
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
              {/* Rows & Cols */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">
                    Số hàng
                  </label>
                  <input
                    type="number"
                    value={videoWallRows}
                    onChange={(e) => setVideoWallRows(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-full h-8 rounded-md border border-input px-2 py-1 bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    min="1"
                    max="10"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">
                    Số cột
                  </label>
                  <input
                    type="number"
                    value={videoWallCols}
                    onChange={(e) => setVideoWallCols(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-full h-8 rounded-md border border-input px-2 py-1 bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    min="1"
                    max="10"
                  />
                </div>
              </div>

              {/* Video Source */}
              <div className="space-y-2 pt-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">
                  Chọn Video nguồn *
                </label>
                <div className="border border-border rounded-lg max-h-[200px] overflow-y-auto divide-y divide-border/60 bg-muted/10 pr-1 scrollbar-thin">
                  {mediaList
                    .filter((media) => media.mimeType.startsWith("video/"))
                    .map((media) => {
                      const isSelected = videoWallSourceMediaId === media.id;
                      return (
                        <div
                          key={media.id}
                          onClick={() => setVideoWallSourceMediaId(media.id)}
                          className={`flex items-center justify-between p-2 cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-primary/10 font-bold border-l-2 border-primary"
                              : "hover:bg-muted/80 bg-background"
                          }`}
                        >
                          <div className="flex items-center gap-2 max-w-[80%]">
                            <div className="h-6 w-6 rounded overflow-hidden shrink-0 border border-border/40 bg-zinc-100 flex items-center justify-center">
                              <Film className="h-3.5 w-3.5 text-blue-500" />
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
                  {mediaList.filter((media) => media.mimeType.startsWith("video/")).length === 0 && (
                    <div className="p-4 text-center text-[10px] text-muted-foreground italic">
                      Không tìm thấy tệp video nào trong thư viện
                    </div>
                  )}
                </div>
              </div>

              {/* Device List for Video Wall */}
              <div className="space-y-2 border-t border-border/40 pt-3">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">
                  Danh sách thiết bị
                </label>
                <div className="max-h-[200px] overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                  {deviceList.map((dev) => (
                    <div key={dev.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/20 text-[11px]">
                      <span className={`h-2 w-2 rounded-full shrink-0 ${dev.status === 'online' ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                      <span className="truncate text-foreground">{dev.deviceName}</span>
                    </div>
                  ))}
                  {deviceList.length === 0 && (
                    <div className="text-[10px] text-muted-foreground italic text-center py-2">
                      Không có thiết bị khả dụng
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
