"use client";

import {
  useMedia,
  usePlaylists,
  useSchedules,
  useTemplates,
} from "@/hooks/useApi";
import { Playlist, Schedule } from "@/types/dashboard";
import { api, getFileUrl } from "@/utils/api";
import React, { useEffect, useMemo, useState } from "react";

import {
  ChevronLeft,
  ChevronRight,
  Layers,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";

// UI Components
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// Modals
import PlaylistEditor from "../../components/playlist-editor/PlaylistEditor";
import PlaylistPreviewModal from "../../components/PlaylistPreviewModal";
import { QuickPublishModal } from "../../components/QuickPublishModal";
import { ScheduleModal } from "../../components/schedule/ScheduleModal";

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
    null,
  );

  // Table pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter States
  const [searchVal, setSearchVal] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "single" | "sync">(
    "all",
  );
  const [filterRatio, setFilterRatio] = useState<"all" | "16:9" | "9:16">(
    "all",
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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
                `/api/playlists/${pl.id}/items`,
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
                0,
              );
              const sorted = [...items].sort(
                (a, b) => a.sortOrder - b.sortOrder,
              );
              const fileUrl = sorted[0]?.media?.fileUrl;
              const mimeType = sorted[0]?.media?.mimeType;
              details[pl.id] = { itemCount, totalDuration, fileUrl, mimeType };
            } catch (err) {
              console.error(`Error loading items for playlist ${pl.id}:`, err);
              details[pl.id] = { itemCount: 0, totalDuration: 0 };
            }
          }),
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

  // Handle Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(searchVal);
    setCurrentPage(1);
  };

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

  // Action: Delete Single Playlist
  const handleDeletePlaylist = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa Playlist: ${name}?`)) return;
    try {
      await api.delete(`/api/playlists/${id}`);
      mutatePlaylists();
      mutateSchedules();
    } catch (error: unknown) {
      const err = error as Error;
      alert(err.message || "Lỗi khi xóa Playlist");
    }
  };

  // Action: Export selected or all to CSV
  const handleExportExcel = () => {
    const listToExport = filteredPlaylists;

    if (listToExport.length === 0) {
      alert("Không có dữ liệu để xuất!");
      return;
    }

    const headers = [
      "Tên Playlist",
      "Kiểu",
      "Số trang/tệp",
      "Thời lượng (s)",
      "Ngày tạo",
      "Độ phân giải",
      "Liên kết màn hình",
    ];
    const rows = listToExport.map((pl) => {
      const details = playlistDetails[pl.id] || {
        itemCount: 0,
        totalDuration: 0,
      };
      const syncLayout = pl.syncLayout;
      const res =
        syncLayout?.width && syncLayout?.height
          ? `${syncLayout.width}x${syncLayout.height}`
          : "1920x1080";
      const devCount = getDeviceCountForPlaylist(pl.id);

      return [
        pl.playlistName,
        pl.isSyncGroup ? "Đồng bộ nhóm" : "Đơn lẻ",
        details.itemCount,
        details.totalDuration,
        new Date(pl.createdAt).toLocaleDateString("vi-VN"),
        res,
        devCount,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `danh_sach_phat_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper: Get resolution text
  const getPlaylistResLabel = (playlist: Playlist) => {
    const syncLayout =
      playlist.playlistName.includes("32inch") ||
      playlist.playlistName.includes("demoo")
        ? { width: 785, height: 1370, aspectRatio: "785:1370" }
        : playlist.syncLayout;
    const width = syncLayout?.width || 1920;
    const height = syncLayout?.height || 1080;
    return `${width}x${height}`;
  };

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

  // Render playlist thumbnail
  const renderThumbnail = (pl: Playlist) => {
    const details = playlistDetails[pl.id];
    if (isDetailsLoading || !details) {
      return (
        <div className="w-16 h-10 rounded-lg bg-muted animate-pulse flex items-center justify-center border border-border/40 select-none">
          <Layers className="h-4 w-4 text-muted-foreground/30" />
        </div>
      );
    }

    if (details.fileUrl) {
      const url = getFileUrl(details.fileUrl);
      if (details.mimeType?.startsWith("video/")) {
        return (
          <div className="w-16 h-10 rounded-lg bg-zinc-950 border border-border/85 overflow-hidden relative group shadow-xs">
            <video src={url} className="w-full h-full object-cover" muted playsInline />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Play className="h-3 w-3 text-white fill-white/10" />
            </div>
          </div>
        );
      }
      return (
        <div className="w-16 h-10 rounded-lg bg-zinc-900 border border-border/85 overflow-hidden relative shadow-xs">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="w-full h-full object-cover" />
        </div>
      );
    }

    return (
      <div className="w-16 h-10 rounded-lg bg-muted flex items-center justify-center border border-border/60 select-none text-[10px] text-muted-foreground/50 font-semibold uppercase tracking-wider">
        Trống
      </div>
    );
  };

  // Render device names with custom tooltip on hover
  const renderDeviceNames = (playlistId: string) => {
    const count = getDeviceCountForPlaylist(playlistId);
    const names = getDeviceNamesForPlaylist(playlistId);

    if (count === 0) {
      return (
        <span className="text-muted-foreground/50 text-xs italic select-none">
          Chưa liên kết
        </span>
      );
    }

    const tooltipText = names.join(", ");

    return (
      <div className="relative group inline-block cursor-pointer select-none" title={tooltipText}>
        <Badge
          variant="outline"
          className="bg-primary/5 border-primary/15 text-primary font-semibold text-xs px-2.5 py-1 rounded-md transition-all hover:bg-primary/10">
          {count} thiết bị
        </Badge>
        {/* Custom CSS Tooltip */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-50 w-max max-w-[220px] bg-zinc-900 text-zinc-100 border border-zinc-800 shadow-lg px-3 py-2 rounded-lg text-[11px] pointer-events-none">
          <div className="flex flex-col gap-1 text-left">
            <p className="font-semibold text-zinc-400 border-b border-zinc-800/80 pb-1 mb-1">Thiết bị đang phát:</p>
            {names.map((name, idx) => (
              <div key={idx} className="truncate text-zinc-200">{name}</div>
            ))}
          </div>
        </div>
      </div>
    );
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

  // Dashboard Stats summary
  const totalPlaylistsCount = playlists?.length || 0;
  const activePlaylistsCount = useMemo(() => {
    if (!playlists || !schedules) return 0;
    const activeIds = new Set(
      schedules.map((s) => s.playlistId).filter(Boolean),
    );
    return playlists.filter((pl) => activeIds.has(pl.id)).length;
  }, [playlists, schedules]);

  const totalLinkedPlayersCount = useMemo(() => {
    if (!schedules) return 0;
    const devices = new Set();
    schedules.forEach((s) => {
      if (s.playlistId && s.devices) {
        s.devices.forEach((d) => devices.add(d.deviceId));
      }
    });
    return devices.size;
  }, [schedules]);

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
            Quản lý nội dung
          </h1>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded-xl text-xs gap-1.5 px-4 h-9 shadow-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
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
            title="Làm mới dữ liệu">
            <RefreshCw className="h-3.5 w-3.5" /> Làm mới
          </Button>
        </div>
      </div>

      {/* Premium Data Table with alternate row colors, no vertical borders, and monospace numbers */}
      <div className="hidden md:block w-full overflow-hidden border border-border bg-card rounded-2xl shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-foreground">
            <thead>
              <tr className="bg-muted/20 border-b border-border text-[11px] text-muted-foreground select-none font-semibold uppercase tracking-wider">
                <th className="p-3.5 w-[80px] text-center">Hình ảnh</th>
                <th className="p-3.5 text-left w-[220px]">Tên Playlist</th>
                <th className="p-3.5 text-center w-[150px]">Thiết bị</th>
                <th className="p-3.5 text-center w-[120px]">Độ phân giải</th>
                <th className="p-3.5 text-center w-[90px]">Số page</th>
                <th className="p-3.5 text-center w-[110px]">Ngày tạo</th>
                <th className="p-3.5 text-left w-[240px]">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {currentPlaylists.map((pl, index) => {
                const details = playlistDetails[pl.id] || {
                  itemCount: 0,
                  totalDuration: 0,
                };

                return (
                  <tr
                    key={pl.id}
                    className={`transition-all duration-150 group ${
                      index % 2 === 0
                        ? "bg-card hover:bg-muted/10"
                        : "bg-muted/5 hover:bg-muted/15"
                    }`}>
                    {/* Column 1: Playlist Thumbnail */}
                    <td className="p-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewPlaylist(pl);
                          setIsPreviewOpen(true);
                        }}
                        className="flex justify-center hover:scale-[1.03] active:scale-95 transition-transform cursor-pointer focus:outline-none"
                        title="Click để xem trước playlist">
                        {renderThumbnail(pl)}
                      </button>
                    </td>

                    {/* Column 2: Playlist Name & Description */}
                    <td className="p-3.5 text-left">
                      <div className="flex items-center gap-2">
                        <span
                          className="font-semibold text-foreground truncate max-w-[200px]"
                          title={pl.playlistName}>
                          {pl.playlistName}
                        </span>
                        {pl.isSyncGroup && (
                          <Badge
                            variant="outline"
                            className="border-none font-semibold text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/10 select-none uppercase tracking-wider">
                            Đồng bộ
                          </Badge>
                        )}
                      </div>
                      <div
                        className="text-[10px] text-muted-foreground truncate max-w-[240px] mt-0.5 font-normal"
                        title={pl.description || "Không có mô tả"}>
                        {pl.description || "Không có mô tả"}
                      </div>
                    </td>

                    {/* Column 3: Linked Screen Names */}
                    <td className="p-3.5 text-center">
                      {renderDeviceNames(pl.id)}
                    </td>

                    {/* Column 4: Resolution & Ratio - Monospace */}
                    <td className="p-3.5 text-center font-mono text-[11px] text-muted-foreground select-none">
                      {getPlaylistResLabel(pl)}
                    </td>

                    {/* Column 5: Page Count - Monospace */}
                    <td className="p-3.5 text-center font-mono text-xs font-semibold text-foreground select-none">
                      {isDetailsLoading && !details.itemCount ? (
                        <span className="text-[10px] text-muted-foreground animate-pulse">
                          ...
                        </span>
                      ) : (
                        details.itemCount
                      )}
                    </td>

                    {/* Column 6: Creation Date - Monospace */}
                    <td className="p-3.5 text-center font-mono text-[11px] text-muted-foreground select-none">
                      {new Date(pl.createdAt).toLocaleDateString("vi-VN")}
                    </td>

                    {/* Column 7: Actions */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-3.5 select-none">
                        <button
                          onClick={() => {
                            setPublishPlaylist(pl);
                            setIsPublishOpen(true);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
                          <Play className="h-3.5 w-3.5 fill-indigo-600/10 dark:fill-indigo-400/10" />
                          Phát ngay
                        </button>

                        <button
                          onClick={() => handleOpenEdit(pl)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-teal-700 dark:hover:text-teal-400 transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                          Sửa
                        </button>

                        <button
                          onClick={() =>
                            handleDeletePlaylist(pl.id, pl.playlistName)
                          }
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {currentPlaylists.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-10 text-center text-sm text-muted-foreground italic">
                    {isPlaylistsLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                        <span>Đang tải danh sách phát...</span>
                      </div>
                    ) : (
                      "Không tìm thấy Playlist nào phù hợp."
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List View */}
      <div className="block md:hidden space-y-4">
        {currentPlaylists.map((pl) => {
          const details = playlistDetails[pl.id] || {
            itemCount: 0,
            totalDuration: 0,
          };
          const count = getDeviceCountForPlaylist(pl.id);

          return (
            <div
              key={pl.id}
              className="bg-card border border-border/80 rounded-2xl p-4 space-y-3.5 shadow-xs transition-all active:bg-muted/5">
              
              {/* Top part: Image + Title/Description */}
              <div className="flex gap-3 items-start">
                <button
                  type="button"
                  onClick={() => {
                    setPreviewPlaylist(pl);
                    setIsPreviewOpen(true);
                  }}
                  className="shrink-0 hover:scale-[1.02] active:scale-95 transition-transform focus:outline-none"
                  title="Click để xem trước playlist">
                  {renderThumbnail(pl)}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-foreground text-sm truncate max-w-[180px]">
                      {pl.playlistName}
                    </span>
                    {pl.isSyncGroup && (
                      <Badge
                        variant="outline"
                        className="border-none font-semibold text-[8px] px-1 py-0.2 rounded bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/10 select-none uppercase tracking-wider">
                        Đồng bộ
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 font-normal">
                    {pl.description || "Không có mô tả"}
                  </p>
                </div>
              </div>

              {/* Middle part: Metadata Grid */}
              <div className="grid grid-cols-2 gap-2 text-[11px] bg-muted/20 p-2.5 rounded-xl border border-border/40 font-mono">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold font-sans">Độ phân giải</span>
                  <span className="text-foreground font-semibold">{getPlaylistResLabel(pl)}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold font-sans">Số page</span>
                  <span className="text-foreground font-semibold">{isDetailsLoading && !details.itemCount ? "..." : details.itemCount} trang</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold font-sans">Thiết bị</span>
                  <span className="text-foreground font-semibold">
                    {count === 0 ? "Chưa liên kết" : `${count} thiết bị`}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold font-sans">Ngày tạo</span>
                  <span className="text-foreground font-semibold">
                    {new Date(pl.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              </div>

              {/* Bottom part: Action Buttons - Touch Targets 44px */}
              <div className="flex justify-between items-center gap-2 pt-1 border-t border-border/40">
                <button
                  onClick={() => {
                    setPublishPlaylist(pl);
                    setIsPublishOpen(true);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 px-3 text-xs font-semibold rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 transition-colors">
                  <Play className="h-3.5 w-3.5 fill-indigo-600/10 dark:fill-indigo-400/10" />
                  Phát ngay
                </button>

                <button
                  onClick={() => handleOpenEdit(pl)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 px-3 text-xs font-semibold rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-950/60 transition-colors">
                  <Pencil className="h-3.5 w-3.5" />
                  Sửa
                </button>

                <button
                  onClick={() => handleDeletePlaylist(pl.id, pl.playlistName)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 px-3 text-xs font-semibold rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/60 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                  Xóa
                </button>
              </div>
            </div>
          );
        })}

        {currentPlaylists.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground italic bg-card border border-border/60 rounded-2xl">
            {isPlaylistsLoading ? (
              <div className="flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                <span>Đang tải danh sách phát...</span>
              </div>
            ) : (
              "Không tìm thấy Playlist nào phù hợp."
            )}
          </div>
        )}
      </div>

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
              className="h-8 w-8 rounded-xl border-border bg-card text-foreground transition-all">
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
              className="h-8 w-8 rounded-xl border-border bg-card text-foreground transition-all">
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
                }`}>
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
            "Đã gửi lệnh phát lên thiết bị thành công! Thiết bị sẽ tự động tải file và trình chiếu.",
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
              "Lập lịch trình phát thành công! Thiết bị sẽ phát playlist này tự động theo khung giờ đã cấu hình.",
            );
          }}
        />
      )}
    </div>
  );
}
