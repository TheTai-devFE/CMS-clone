"use client"
import { Badge } from "@/components/ui/badge";
import { Playlist } from "@/types/dashboard";
import {
  Layers,
  Play,
  RefreshCw,
} from "lucide-react";
import { Fragment } from "react";
import { ContentManageItem } from "./ContentManageItem";
import { api, getFileUrl } from "@/utils/api";
import { MobileDropdownActions } from "./MobileDropdownActions";
import Image from "next/image";

interface ContentManageTableProps {
  currentPlaylists: Playlist[];
  playlistDetails: Record<
    string,
    {
      itemCount: number;
      totalDuration: number;
      fileUrl?: string;
      mimeType?: string;
    }
  >;
  isDetailsLoading: boolean;
  isPlaylistsLoading: boolean;
  handleOpenEdit: (pl: Playlist) => void;
  setPreviewPlaylist: (pl: Playlist) => void;
  setIsPreviewOpen: (open: boolean) => void;
  setPublishPlaylist: (pl: Playlist) => void;
  setIsPublishOpen: (open: boolean) => void;
  setSchedulePlaylist: (pl: Playlist) => void;
  setIsScheduleOpen: (open: boolean) => void;
  getDeviceCountForPlaylist: (id: string) => number;
  getDeviceNamesForPlaylist: (playlistId: string) => string[];
  mutatePlaylists: () => void;
  mutateSchedules: () => void;
}

export const ContentManageTable = (props: ContentManageTableProps) => {
  const {
    currentPlaylists,
    playlistDetails,
    isDetailsLoading,
    isPlaylistsLoading,
    handleOpenEdit,
    setPreviewPlaylist,
    setIsPreviewOpen,
    setPublishPlaylist,
    setIsPublishOpen,
    setSchedulePlaylist,
    setIsScheduleOpen,
    getDeviceCountForPlaylist,
    getDeviceNamesForPlaylist,
    mutatePlaylists,
    mutateSchedules,
  } = props;

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
            <video
              src={url}
              className="w-full h-full object-cover"
              muted
              playsInline
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Play className="h-3 w-3 text-white fill-white/10" />
            </div>
          </div>
        );
      }
      return (
        <div className="w-16 h-10 rounded-lg bg-zinc-900 border border-border/85 overflow-hidden relative shadow-xs">
          <Image width={64} height={40} src={url} alt="" className="w-full h-full object-cover" />
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
      <div
        className="relative group inline-block cursor-pointer select-none"
        title={tooltipText}
      >
        <Badge
          variant="outline"
          className="bg-primary/5 border-primary/15 text-primary font-semibold text-xs px-2.5 py-1 rounded-md transition-all hover:bg-primary/10"
        >
          {count} thiết bị
        </Badge>
        {/* Custom CSS Tooltip */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-50 w-max max-w-[220px] bg-zinc-900 text-zinc-100 border border-zinc-800 shadow-lg px-3 py-2 rounded-lg text-[11px] pointer-events-none">
          <div className="flex flex-col gap-1 text-left">
            <p className="font-semibold text-zinc-400 border-b border-zinc-800/80 pb-1 mb-1">
              Thiết bị đang phát:
            </p>
            {names.map((name, idx) => (
              <div key={idx} className="truncate text-zinc-200">
                {name}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Fragment>
      {/* Desktop View */}
      <div className="hidden md:block w-full overflow-hidden border border-border bg-card rounded-2xl shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed border-collapse text-left text-sm text-foreground">
            <colgroup>
              <col className="w-[85px]" />
              <col />
              <col className="w-[140px]" />
              <col className="w-[110px]" />
              <col className="w-[90px]" />
              <col className="w-[100px]" />
              <col className="w-[80px]" />
            </colgroup>
            <thead>
              <tr className="bg-muted/20 border-b border-border text-[11px] text-muted-foreground select-none font-normal uppercase tracking-wider">
                <th className="p-3 text-center">Hình ảnh</th>
                <th className="p-3 text-left">Tên Playlist</th>
                <th className="p-3 text-center">Thiết bị</th>
                <th className="p-3 text-center">Độ phân giải</th>
                <th className="p-3 text-center">Số page</th>
                <th className="p-3 text-center">Ngày tạo</th>
                <th className="p-3 text-left"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {currentPlaylists.map((pl, index) => {
                const details = playlistDetails[pl.id] || {
                  itemCount: 0,
                  totalDuration: 0,
                };
                return (
                  <ContentManageItem
                    key={pl.id}
                    pl={pl}
                    index={index}
                    details={details}
                    handleOpenEdit={handleOpenEdit}
                    handleDeletePlaylist={handleDeletePlaylist}
                    renderThumbnail={renderThumbnail}
                    renderDeviceNames={renderDeviceNames}
                    getPlaylistResLabel={getPlaylistResLabel}
                    setPreviewPlaylist={setPreviewPlaylist}
                    setIsPreviewOpen={setIsPreviewOpen}
                    setPublishPlaylist={setPublishPlaylist}
                    setIsPublishOpen={setIsPublishOpen}
                    setSchedulePlaylist={setSchedulePlaylist}
                    setIsScheduleOpen={setIsScheduleOpen}
                    isDetailsLoading={isDetailsLoading}
                  />
                );
              })}

              {currentPlaylists.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-10 text-center text-sm text-muted-foreground italic"
                  >
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
      {/* Mobile View */}
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
              className="bg-card border border-border/80 rounded-2xl p-4 space-y-3.5 shadow-xs transition-all active:bg-muted/5"
            >
              {/* Top part: Image + Title/Description */}
              <div className="flex gap-3 items-start">
                <button
                  type="button"
                  onClick={() => {
                    setPreviewPlaylist(pl);
                    setIsPreviewOpen(true);
                  }}
                  className="shrink-0 hover:scale-[1.02] active:scale-95 transition-transform focus:outline-none"
                  title="Click để xem trước playlist"
                >
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
                        className="border-none font-semibold text-[8px] px-1 py-0.2 rounded bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/10 select-none uppercase tracking-wider"
                      >
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
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold font-sans">
                    Độ phân giải
                  </span>
                  <span className="text-foreground font-semibold">
                    {getPlaylistResLabel(pl)}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold font-sans">
                    Số page
                  </span>
                  <span className="text-foreground font-semibold">
                    {isDetailsLoading && !details.itemCount
                      ? "..."
                      : details.itemCount}{" "}
                    trang
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold font-sans">
                    Thiết bị
                  </span>
                  <span className="text-foreground font-semibold">
                    {count === 0 ? "Chưa liên kết" : `${count} thiết bị`}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold font-sans">
                    Ngày tạo
                  </span>
                  <span className="text-foreground font-semibold">
                    {new Date(pl.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              </div>

              {/* Bottom part: Dropdown action */}
              <MobileDropdownActions
                pl={pl}
                handleOpenEdit={handleOpenEdit}
                handleDeletePlaylist={handleDeletePlaylist}
                setPreviewPlaylist={setPreviewPlaylist}
                setIsPreviewOpen={setIsPreviewOpen}
                setPublishPlaylist={setPublishPlaylist}
                setIsPublishOpen={setIsPublishOpen}
                setSchedulePlaylist={setSchedulePlaylist}
                setIsScheduleOpen={setIsScheduleOpen}
              />
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
    </Fragment>
  );
};
