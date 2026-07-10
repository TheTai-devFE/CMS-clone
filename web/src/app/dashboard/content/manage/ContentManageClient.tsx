"use client";
import {
  useMedia,
  usePlaylists,
  useSchedules,
  useTemplates,
} from "@/hooks/useApi";
import { Playlist, Schedule } from "@/types/dashboard";
import { api } from "@/utils/api";
import { useEffect, useMemo, useState } from "react";

import {
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";

// Modals
import PlaylistEditor from "@/components/dashboard/playlist-editor/PlaylistEditor";
import PlaylistPreviewModal from "@/components/dashboard/PlaylistPreviewModal";
import { QuickPublishModal } from "@/components/dashboard/QuickPublishModal";
import { ScheduleModal } from "@/components/dashboard/schedule/ScheduleModal";
import { ContentManageTable } from "./ContentManageTable";

export default function ContentManageClient() {
  // SWR Hooks
  const {
    playlists,
    mutate: mutatePlaylists,
    isLoading: isPlaylistsLoading,
  } = usePlaylists();
  const { mediaList } = useMedia();
  const { schedules, mutate: mutateSchedules } = useSchedules();
  const { templates } = useTemplates();

  // Playlist Editor state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);

  // Preview Modal state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewPlaylist, setPreviewPlaylist] = useState<Playlist | null>(null);

  // Quick Publish state
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [publishPlaylist, setPublishPlaylist] = useState<Playlist | null>(null);

  // Schedule Modal state
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [schedulePlaylist, setSchedulePlaylist] = useState<Playlist | null>(
    null
  );

  // Table pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter States
  const [appliedSearch] = useState("");
  const [filterType] = useState<"all" | "single" | "sync">("all");
  const [filterRatio] = useState<"all" | "16:9" | "9:16">("all");
  const [startDate] = useState("");
  const [endDate] = useState("");

  // Cache for playlist details (item count, total duration, and thumbnail preview info)
  const [playlistDetails, setPlaylistDetails] = useState<
    Record<
      string,
      {
        itemCount: number;
        totalDuration: number;
        fileUrl?: string;
        mimeType?: string;
      }
    >
  >({});
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);

  // Fetch playlist items details (length & duration) dynamically
  useEffect(() => {
    if (!playlists || playlists.length === 0) return;

    const fetchDetails = async () => {
      setIsDetailsLoading(true);
      const details: Record<
        string,
        {
          itemCount: number;
          totalDuration: number;
          fileUrl?: string;
          mimeType?: string;
        }
      > = {};
      try {
        await Promise.all(
          playlists.map(async (pl) => {
            try {
              const items = (await api.get(
                `/api/playlists/${pl.id}/items`
              )) as {
                id: string;
                sortOrder: number;
                duration: number;
                media: {
                  fileUrl: string;
                  mimeType: string;
                };
              }[];
              const itemCount = items.length;
              const totalDuration = items.reduce(
                (acc, item) => acc + (item.duration || 0),
                0
              );
              const sorted = [...items].sort(
                (a, b) => a.sortOrder - b.sortOrder
              );
              const fileUrl = sorted[0]?.media?.fileUrl;
              const mimeType = sorted[0]?.media?.mimeType;
              details[pl.id] = { itemCount, totalDuration, fileUrl, mimeType };
            } catch (err) {
              console.error(`Error loading items for playlist ${pl.id}:`, err);
              details[pl.id] = { itemCount: 0, totalDuration: 0 };
            }
          })
        );
        setPlaylistDetails(details);
      } catch (err) {
        console.error("Error fetching playlist details:", err);
      } finally {
        setIsDetailsLoading(false);
      }
    };

    fetchDetails();
  }, [playlists]);

  // Filter playlists
  const filteredPlaylists = useMemo(() => {
    if (!playlists) return [];
    return playlists.filter((pl) => {
      // 1. Search text filter
      const matchesSearch =
        pl.playlistName.toLowerCase().includes(appliedSearch.toLowerCase()) ||
        (pl.description &&
          pl.description.toLowerCase().includes(appliedSearch.toLowerCase()));

      // 2. Sync type filter
      const matchesType =
        filterType === "all" ||
        (filterType === "sync" && pl.isSyncGroup) ||
        (filterType === "single" && !pl.isSyncGroup);

      // 3. Screen ratio filter
      const syncLayout = pl.syncLayout;
      const plRatio = syncLayout?.aspectRatio || "16:9";
      const matchesRatio = filterRatio === "all" || plRatio === filterRatio;

      // 4. Creation date filter
      let matchesDate = true;
      if (startDate) {
        matchesDate =
          matchesDate && new Date(pl.createdAt) >= new Date(startDate);
      }
      if (endDate) {
        // Set end date to end of that day
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && new Date(pl.createdAt) <= endDateTime;
      }

      return matchesSearch && matchesType && matchesRatio && matchesDate;
    });
  }, [playlists, appliedSearch, filterType, filterRatio, startDate, endDate]);

  // Pagination logic
  const totalPages = Math.ceil(filteredPlaylists.length / itemsPerPage) || 1;
  const currentPlaylists = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredPlaylists.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredPlaylists, currentPage, itemsPerPage]);


  // Helper: Count devices playing this playlist
  const getDeviceCountForPlaylist = (playlistId: string) => {
    if (!schedules) return 0;
    const devices = new Set<string>();
    schedules.forEach((schedule: Schedule) => {
      if (schedule.playlistId === playlistId && schedule.devices) {
        schedule.devices.forEach((d) => {
          if (d.deviceId) {
            devices.add(d.deviceId);
          }
        });
      }
    });
    return devices.size;
  };

  // Helper: Get list of device names playing this playlist
  const getDeviceNamesForPlaylist = (playlistId: string) => {
    if (!schedules) return [];
    const deviceNames = new Set<string>();
    schedules.forEach((schedule: Schedule) => {
      if (schedule.playlistId === playlistId && schedule.devices) {
        schedule.devices.forEach((d) => {
          if (d.device?.deviceName) {
            deviceNames.add(d.device.deviceName);
          } else if (d.deviceId) {
            deviceNames.add(`Màn hình ${d.deviceId.substring(0, 4)}`);
          }
        });
      }
    });
    return Array.from(deviceNames);
  };

  // Open create playlist modal
  const handleOpenCreate = () => {
    setEditingPlaylist(null);
    setIsEditorOpen(true);
  };

  // Open edit playlist modal
  const handleOpenEdit = (playlist: Playlist) => {
    setEditingPlaylist(playlist);
    setIsEditorOpen(true);
  };

  // Render Editor Mode
  if (isEditorOpen) {
    return (
      <PlaylistEditor
        editingPlaylist={editingPlaylist}
        mediaList={mediaList}
        onClose={() => setIsEditorOpen(false)}
        onSave={() => {
          mutatePlaylists();
        }}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-300 relative pb-16 font-sans">
      {/* Header Title, Description & Action Button matching Image 1 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/10 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground font-sans">
            Danh sách phát
          </h1>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded-xl text-xs gap-1.5 px-4 h-9 shadow-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" /> Tạo Playlist
        </Button>
      </div>

      {/* Modern Table Toolbar (replaces generic buttons, aligns and groups beautifully) */}
      <div className="flex items-center justify-between py-1 text-xs select-none">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">
            Hiển thị:{" "}
            <strong className="font-mono bg-muted/60 border border-border/30 px-2 py-0.5 rounded text-foreground font-bold">
              {filteredPlaylists.length}
            </strong>{" "}
            Playlist
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              mutatePlaylists();
              mutateSchedules();
            }}
            className="h-8 text-xs font-semibold rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all gap-1"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Làm mới
          </Button>
        </div>
      </div>

      <ContentManageTable
        currentPlaylists={currentPlaylists}
        playlistDetails={playlistDetails}
        isDetailsLoading={isDetailsLoading}
        isPlaylistsLoading={isPlaylistsLoading}
        handleOpenEdit={handleOpenEdit}
        setPreviewPlaylist={setPreviewPlaylist}
        setIsPreviewOpen={setIsPreviewOpen}
        setPublishPlaylist={setPublishPlaylist}
        setIsPublishOpen={setIsPublishOpen}
        setSchedulePlaylist={setSchedulePlaylist}
        setIsScheduleOpen={setIsScheduleOpen}
        getDeviceCountForPlaylist={getDeviceCountForPlaylist}
        getDeviceNamesForPlaylist={getDeviceNamesForPlaylist}
        mutatePlaylists={mutatePlaylists}
        mutateSchedules={mutateSchedules}
      />

      {/* Pagination Controls */}
      {filteredPlaylists.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-foreground select-none pt-2">
          {/* Page buttons */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="h-8 w-8 rounded-xl border-border bg-card text-foreground transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="h-8 px-3.5 bg-primary text-primary-foreground border border-primary flex items-center justify-center rounded-xl font-bold shadow-xs">
              {currentPage}
            </span>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              className="h-8 w-8 rounded-xl border-border bg-card text-foreground transition-all"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="text-muted-foreground ml-2 font-normal">
              Trang {currentPage} trên {totalPages}
            </span>
          </div>

          {/* Size choices */}
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground font-normal mr-1.5">
              Bản ghi mỗi trang:
            </span>
            {[5, 10, 30, 50].map((num) => (
              <button
                key={num}
                onClick={() => {
                  setItemsPerPage(num);
                  setCurrentPage(1);
                }}
                className={`h-8 px-3 border transition-all duration-150 text-xs rounded-xl font-semibold ${
                  itemsPerPage === num
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-card border-border hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Playlist playback preview simulation modal */}
      <PlaylistPreviewModal
        playlist={previewPlaylist}
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setPreviewPlaylist(null);
        }}
      />

      {/* Quick publish modal */}
      <QuickPublishModal
        playlist={publishPlaylist}
        isOpen={isPublishOpen}
        onClose={() => {
          setIsPublishOpen(false);
          setPublishPlaylist(null);
        }}
        onSuccess={() => {
          alert(
            "Đã gửi lệnh phát lên thiết bị thành công! Thiết bị sẽ tự động tải file và trình chiếu."
          );
        }}
      />

      {/* Playlist Schedule Modal */}
      {isScheduleOpen && schedulePlaylist && (
        <ScheduleModal
          isOpen={isScheduleOpen}
          schedule={{
            id: "",
            scheduleName: `Lịch phát - ${schedulePlaylist.playlistName}`,
            startDate: "",
            endDate: "",
            startTime: "00:00:00",
            endTime: "23:59:59",
            dayOfWeek: [1, 2, 3, 4, 5, 6, 0],
            playlistId: schedulePlaylist.id,
          }}
          playlists={playlists || []}
          templates={templates || []}
          onClose={() => {
            setIsScheduleOpen(false);
            setSchedulePlaylist(null);
          }}
          onSuccess={() => {
            mutateSchedules();
            alert(
              "Lập lịch trình phát thành công! Thiết bị sẽ phát playlist này tự động theo khung giờ đã cấu hình."
            );
          }}
        />
      )}
    </div>
  );
}
