import { Badge } from "@/components/ui/badge";
import { Playlist } from "@/types/dashboard";
import {
  Calendar,
  Eye,
  MoreHorizontal,
  Pencil,
  Play,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface IContentManageItemProps {
  pl: Playlist;
  index: number;
  details: {
    itemCount: number;
    totalDuration: number;
    fileUrl?: string | undefined;
    mimeType?: string | undefined;
  };
  handleOpenEdit: (playlist: Playlist) => void;
  handleDeletePlaylist: (playlistId: string, playlistName: string) => void;
  renderThumbnail: (pl: Playlist) => React.ReactNode;
  renderDeviceNames: (playlistId: string) => React.ReactNode;
  getPlaylistResLabel: (pl: Playlist) => string;
  setPreviewPlaylist: (playlist: Playlist) => void;
  setIsPreviewOpen: (open: boolean) => void;
  setPublishPlaylist: (playlist: Playlist) => void;
  setIsPublishOpen: (open: boolean) => void;
  setSchedulePlaylist: (playlist: Playlist) => void;
  setIsScheduleOpen: (open: boolean) => void;
  isDetailsLoading: boolean;
}

export const ContentManageItem = ({
  pl,
  index,
  details,
  handleOpenEdit,
  handleDeletePlaylist,
  renderThumbnail,
  renderDeviceNames,
  getPlaylistResLabel,
  setPreviewPlaylist,
  setIsPreviewOpen,
  setPublishPlaylist,
  setIsPublishOpen,
  setSchedulePlaylist,
  setIsScheduleOpen,
  isDetailsLoading,
}: IContentManageItemProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  return (
    <tr
      key={pl.id}
      className={`transition-all duration-150 group ${
        index % 2 === 0
          ? "bg-card hover:bg-muted/10"
          : "bg-muted/5 hover:bg-muted/15"
      }`}
    >
      {/* Column 1: Playlist Thumbnail */}
      <td className="p-3 text-center">
        <button
          type="button"
          onClick={() => {
            setPreviewPlaylist(pl);
            setIsPreviewOpen(true);
          }}
          className="flex justify-center hover:scale-[1.03] active:scale-95 transition-transform cursor-pointer focus:outline-none"
          title="Click để xem trước playlist"
        >
          {renderThumbnail(pl)}
        </button>
      </td>

      {/* Column 2: Playlist Name & Description */}
      <td className="p-3 text-left min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="font-semibold text-foreground truncate block max-w-full"
            title={pl.playlistName}
          >
            {pl.playlistName}
          </span>
          {pl.isSyncGroup && (
            <Badge
              variant="outline"
              className="shrink-0 border-none font-semibold text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/10 select-none uppercase tracking-wider"
            >
              Sync
            </Badge>
          )}
        </div>
        <div
          className="text-[10px] text-muted-foreground truncate mt-0.5 font-normal"
          title={pl.description || "Không có mô tả"}
        >
          {pl.description || "Không có mô tả"}
        </div>
      </td>

      {/* Column 3: Linked Screen Names */}
      <td className="p-3 text-center">{renderDeviceNames(pl.id)}</td>

      {/* Column 4: Resolution & Ratio - Monospace */}
      <td className="p-3 text-center font-mono text-[11px] text-muted-foreground select-none">
        {getPlaylistResLabel(pl)}
      </td>

      {/* Column 5: Page Count - Monospace */}
      <td className="p-3 text-center font-mono text-xs font-semibold text-foreground select-none">
        {isDetailsLoading && !details.itemCount ? (
          <span className="text-[10px] text-muted-foreground animate-pulse">
            ...
          </span>
        ) : (
          details.itemCount
        )}
      </td>

      {/* Column 6: Creation Date - Monospace */}
      <td className="p-3 text-center font-mono text-[11px] text-muted-foreground select-none">
        {new Date(pl.createdAt).toLocaleDateString("vi-VN")}
      </td>

      {/* Column 7: Actions Dropdown */}
      <td className="p-3">
        <div className="relative inline-block" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="inline-flex items-center gap-1 h-7 px-2.5 text-[11px] font-semibold rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all select-none"
            title="Hành động"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 z-50 min-w-[180px] bg-card border border-border rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
              {/* Xem trước */}
              <button
                onClick={() => {
                  setPreviewPlaylist(pl);
                  setIsPreviewOpen(true);
                  setIsDropdownOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12px] font-medium text-foreground hover:bg-muted/60 transition-colors text-left"
              >
                <Eye className="h-3.5 w-3.5 text-emerald-500" />
                Xem trước
              </button>

              {/* Phát ngay */}
              <button
                onClick={() => {
                  setPublishPlaylist(pl);
                  setIsPublishOpen(true);
                  setIsDropdownOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12px] font-medium text-foreground hover:bg-muted/60 transition-colors text-left"
              >
                <Play className="h-3.5 w-3.5 text-indigo-500 fill-indigo-500/10" />
                Phát ngay
              </button>

              {/* Hẹn giờ phát */}
              <button
                onClick={() => {
                  setSchedulePlaylist(pl);
                  setIsScheduleOpen(true);
                  setIsDropdownOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12px] font-medium text-foreground hover:bg-muted/60 transition-colors text-left"
              >
                <Calendar className="h-3.5 w-3.5 text-amber-500" />
                Hẹn giờ phát
              </button>

              {/* Divider */}
              <div className="border-t border-border/60 mx-2 my-1" />

              {/* Sửa */}
              <button
                onClick={() => {
                  handleOpenEdit(pl);
                  setIsDropdownOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12px] font-medium text-foreground hover:bg-muted/60 transition-colors text-left"
              >
                <Pencil className="h-3.5 w-3.5 text-primary" />
                Chỉnh sửa
              </button>

              {/* Xóa */}
              <button
                onClick={() => {
                  handleDeletePlaylist(pl.id, pl.playlistName);
                  setIsDropdownOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Xóa playlist
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
};
