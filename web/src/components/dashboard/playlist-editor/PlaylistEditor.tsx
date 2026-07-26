import { Button } from "@/components/ui/button";
import { MediaItem, Playlist, Device } from "@/types/dashboard";
import { api } from "@/utils/api";
import { ChevronLeft, Layers, Loader2, Globe } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import PlaylistCanvas from "./PlaylistCanvas";
import PlaylistSidebar, { PlaylistItemData } from "./PlaylistSidebar";
import { PlaylistConfigHeader } from "./PlaylistConfigHeader";
import { VideoWallEditor } from "./VideoWallEditor";
import { PlaylistMediaLibrary } from "./PlaylistMediaLibrary";
import CreateWebUrlModal from "../CreateWebUrlModal";
import { usePlaylistDraft } from "./usePlaylistDraft";
import { useSavePlaylist } from "./useSavePlaylist";

interface PlaylistEditorProps {
  editingPlaylist: Playlist | null;
  mediaList: MediaItem[];
  onClose: () => void;
  onSave: () => void;
  onCreated?: (
    playlistId: string,
    playlistName: string,
    isSyncGroup: boolean,
    deviceIds: string[],
  ) => void;
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
  const {
    playlistName,
    setPlaylistName,
    playlistDesc,
    setPlaylistDesc,
    selectedResValue,
    setSelectedResValue,
    isSyncGroup,
    setIsSyncGroup,
    scaleMode,
    setScaleMode,
    isVideoWallMode,
    setIsVideoWallMode,
    videoWallRows,
    setVideoWallRows,
    videoWallCols,
    setVideoWallCols,
    videoWallSourceMediaId,
    setVideoWallSourceMediaId,
    videoWallMapping,
    setVideoWallMapping,
    slides,
    setSlides,
    activeSlideId,
    setActiveSlideId,
    draftStatus,
    setDraftStatus,
    errorMsg,
    setErrorMsg,
  } = usePlaylistDraft({ editingPlaylist });

  const [scaleFactor, setScaleFactor] = useState(0.4);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  // Media list filter/search state
  const [mediaSearchQuery, setMediaSearchQuery] = useState("");
  const [mediaFilterType, setMediaFilterType] = useState<"all" | "image" | "video">("all");

  // Web-embed media items created directly from the editor (via the standalone "Nhúng Web"
  // button, not through the Media library) — kept locally so a slide can reference them
  // immediately without waiting on the parent's media list to refetch.
  const [embeddedMediaList, setEmbeddedMediaList] = useState<MediaItem[]>([]);
  const [isWebEmbedModalOpen, setIsWebEmbedModalOpen] = useState(false);
  const allMedia = [
    ...mediaList,
    ...embeddedMediaList.filter((m) => !mediaList.some((x) => x.id === m.id)),
  ];

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

  // Update a slide's duration
  const handleUpdateSlideDuration = (slideId: string, duration: number) => {
    setSlides((prev) =>
      prev.map((s) => (s.id === slideId ? { ...s, duration } : s)),
    );
  };

  // Add a new slide for a web-embed Media item just created via the standalone "Nhúng Web" button
  const handleWebEmbedCreated = (media: MediaItem) => {
    setEmbeddedMediaList((prev) => [...prev, media]);
    const tempId = `temp-slide-${Date.now()}`;
    const newSlide: PlaylistItemData = {
      id: tempId,
      mediaId: media.id,
      duration: 15,
      fileName: media.fileName,
      fileUrl: media.fileUrl,
      mimeType: media.mimeType,
    };
    setSlides((prev) => [...prev, newSlide]);
    setActiveSlideId(tempId);
    setIsWebEmbedModalOpen(false);
  };

  // Assign media to active slide
  const handleAssignMediaToSlide = (mediaId: string) => {
    if (!activeSlideId) return;
    const media = allMedia.find((m) => m.id === mediaId);
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

  const { isSaving, handleSavePlaylist } = useSavePlaylist();

  const activeSlide = slides.find((s) => s.id === activeSlideId) || null;

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
            onClick={() =>
              handleSavePlaylist({
                editingPlaylist,
                playlistName,
                playlistDesc,
                selectedOption,
                isSyncGroup,
                scaleMode,
                isVideoWallMode,
                videoWallRows,
                videoWallCols,
                videoWallSourceMediaId,
                videoWallMapping,
                slides,
                setErrorMsg,
                onSave,
                onCreated,
              })
            }
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
      {draftStatus === "has_draft" && (
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

      {/* Config header — always visible so the user can switch back out of Video Wall mode */}
      <PlaylistConfigHeader
        playlistName={playlistName}
        setPlaylistName={setPlaylistName}
        selectedResValue={selectedResValue}
        setSelectedResValue={setSelectedResValue}
        resolutionOptions={RESOLUTION_OPTIONS}
        isSyncGroup={isSyncGroup}
        setIsSyncGroup={setIsSyncGroup}
        isVideoWallMode={isVideoWallMode}
        setIsVideoWallMode={setIsVideoWallMode}
        scaleMode={scaleMode}
        setScaleMode={setScaleMode}
      />

      {/* PPTX Editor Workspace */}
      {!isVideoWallMode && (
        <div className="space-y-4">
          {/* Bottom: Workspace (Sidebar + Canvas | Media List) */}
          <div className="flex gap-4 items-start bg-card border border-border p-3 rounded-2xl shadow-sm w-full">
            {/* Left: Slide Sidebar */}
            <PlaylistSidebar
              slides={slides}
              activeSlideId={activeSlideId}
              mediaList={allMedia}
              onSelectSlide={setActiveSlideId}
              onAddSlide={handleAddSlide}
              onDeleteSlide={handleDeleteSlide}
              onMoveSlide={handleMoveSlide}
              onUpdateSlideDuration={handleUpdateSlideDuration}
            />

            {/* Center: Slide Canvas Simulator */}
            <PlaylistCanvas
              activeSlide={activeSlide}
              mediaList={allMedia}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
              scaleFactor={scaleFactor}
              canvasRef={canvasRef}
              scaleMode={scaleMode}
            />

            <div className="w-72 shrink-0 flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsWebEmbedModalOpen(true)}
                className="w-full text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5"
              >
                <Globe className="h-4 w-4" /> Nhúng Web
              </Button>
              <PlaylistMediaLibrary
                mediaSearchQuery={mediaSearchQuery}
                setMediaSearchQuery={setMediaSearchQuery}
                mediaFilterType={mediaFilterType}
                setMediaFilterType={setMediaFilterType}
                filteredMedia={filteredMedia}
                activeSlideMediaId={activeSlide?.mediaId}
                handleAssignMediaToSlide={handleAssignMediaToSlide}
              />
            </div>
          </div>
        </div>
      )}

      <CreateWebUrlModal
        isOpen={isWebEmbedModalOpen}
        onClose={() => setIsWebEmbedModalOpen(false)}
        onSuccess={() => {}}
        onCreated={handleWebEmbedCreated}
        setError={setErrorMsg}
        setSuccessMsg={() => {}}
      />

      {/* Video Wall Mode */}
      {isVideoWallMode && (
        <VideoWallEditor
          videoWallRows={videoWallRows}
          setVideoWallRows={setVideoWallRows}
          videoWallCols={videoWallCols}
          setVideoWallCols={setVideoWallCols}
          videoWallMapping={videoWallMapping}
          setVideoWallMapping={setVideoWallMapping}
          deviceList={deviceList}
          mediaList={mediaList}
          videoWallSourceMediaId={videoWallSourceMediaId}
          setVideoWallSourceMediaId={setVideoWallSourceMediaId}
        />
      )}
    </div>
  );
}
