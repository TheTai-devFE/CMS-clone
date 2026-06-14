import { Button } from "@/components/ui/button";
import { Device, MediaItem, Playlist } from "@/types/dashboard";
import { api } from "@/utils/api";
import { ChevronLeft, Layers, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import PlaylistCanvas from "./PlaylistCanvas";
import PlaylistProperties from "./PlaylistProperties";
import PlaylistSidebar, { PlaylistItemData } from "./PlaylistSidebar";

interface PlaylistEditorProps {
  editingPlaylist: Playlist | null;
  mediaList: MediaItem[];
  onClose: () => void;
  onSave: () => void;
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

  // Players list state
  const [deviceList, setDeviceList] = useState<Device[]>([]);
  const [targetDeviceId, setTargetDeviceId] = useState<string>("");
  const [scaleMode, setScaleMode] = useState<"stretch" | "crop">("stretch");

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
          targetDeviceId?: string;
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
        setTargetDeviceId(syncLayout?.targetDeviceId || "");
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

  // Update active slide target devices (for sync group mode)
  const handleUpdateSlideTargetDevices = (deviceIds: string[]) => {
    if (!activeSlideId) return;
    setSlides((prev) =>
      prev.map((s) =>
        s.id === activeSlideId ? { ...s, targetDeviceIds: deviceIds } : s,
      ),
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
          targetDeviceId: !isSyncGroup ? targetDeviceId : undefined,
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
      onClose();
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
          <Button type="button" variant="outline" onClick={handleCloseEditor}>
            Hủy
          </Button>
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
      <div className="flex gap-4 items-start bg-card border border-border p-3 rounded-2xl shadow-sm w-full">
        {isVideoWallMode ? (
          /* Video Wall Grid Simulator Workspace */
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
                    const selectedDevice = deviceList.find(
                      (d) => d.id === selectedDevId,
                    );

                    return (
                      <div
                        key={cellKey}
                        className={`border rounded-xl p-4 bg-card/60 backdrop-blur-md flex flex-col justify-between gap-3 shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary/50 relative overflow-hidden group ${
                          selectedDevId
                            ? "border-primary/40 bg-primary/5"
                            : "border-border/80"
                        }`}
                      >
                        {/* Corner Decorative Accent */}
                        <div className="absolute top-0 right-0 w-12 h-12 bg-primary/5 rounded-bl-full transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform" />

                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground/80 flex items-center gap-1.5">
                            <span className="h-5 w-5 rounded-md bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                              {cellNumber}
                            </span>
                            Ô {rIdx + 1}x{cIdx + 1}
                          </span>
                          {selectedDevice && (
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                                selectedDevice.status === "online"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400"
                              }`}
                            >
                              {selectedDevice.status === "online"
                                ? "Online"
                                : "Offline"}
                            </span>
                          )}
                        </div>

                        {/* Device Selector */}
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

            {/* Quick Status / Guide */}
            <div className="text-[11px] text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border/40 leading-relaxed">
              💡 **Hướng dẫn:** Video wall sẽ cắt video nguồn ra làm **
              {videoWallRows * videoWallCols}** phần theo lưới trên. Khi phát,
              mỗi thiết bị ở ô tương ứng sẽ tự động tải phần video của mình về
              và chạy đồng bộ tuyệt đối với các ô còn lại qua cơ chế NTP Clock.
            </div>
          </div>
        ) : (
          <>
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
          </>
        )}

        {/* Right: Properties Settings Panel */}
        <PlaylistProperties
          playlistName={playlistName}
          onChangePlaylistName={setPlaylistName}
          playlistDesc={playlistDesc}
          onChangePlaylistDesc={setPlaylistDesc}
          selectedResValue={selectedResValue}
          onChangeResolution={setSelectedResValue}
          isSyncGroup={isSyncGroup}
          onChangeSyncGroup={setIsSyncGroup}
          activeSlide={activeSlide}
          activeSlideIndex={activeSlideIndex}
          onChangeSlideDuration={handleUpdateSlideDuration}
          mediaList={mediaList}
          onAssignMediaToSlide={handleAssignMediaToSlide}
          deviceList={deviceList}
          targetDeviceId={targetDeviceId}
          onChangeTargetDevice={setTargetDeviceId}
          onChangeSlideTargetDevices={handleUpdateSlideTargetDevices}
          scaleMode={scaleMode}
          onChangeScaleMode={setScaleMode}
          // Video Wall Props
          isVideoWallMode={isVideoWallMode}
          onChangeVideoWallMode={setIsVideoWallMode}
          videoWallRows={videoWallRows}
          onChangeVideoWallRows={setVideoWallRows}
          videoWallCols={videoWallCols}
          onChangeVideoWallCols={setVideoWallCols}
          videoWallSourceMediaId={videoWallSourceMediaId}
          onChangeVideoWallSourceMedia={setVideoWallSourceMediaId}
        />
      </div>
    </div>
  );
}
