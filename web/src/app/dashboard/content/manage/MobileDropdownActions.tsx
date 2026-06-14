import { Playlist } from "@/types/dashboard";
import { Calendar, Eye, MoreHorizontal, Pencil, Play, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// ─── Mobile Dropdown Actions (defined BEFORE ContentManageTable so const is in scope) ───
interface MobileDropdownProps {
  pl: Playlist;
  handleOpenEdit: (pl: Playlist) => void;
  handleDeletePlaylist: (id: string, name: string) => void;
  setPreviewPlaylist: (pl: Playlist) => void;
  setIsPreviewOpen: (open: boolean) => void;
  setPublishPlaylist: (pl: Playlist) => void;
  setIsPublishOpen: (open: boolean) => void;
  setSchedulePlaylist: (pl: Playlist) => void;
  setIsScheduleOpen: (open: boolean) => void;
}

export const MobileDropdownActions = ({
  pl,
  handleOpenEdit,
  handleDeletePlaylist,
  setPreviewPlaylist,
  setIsPreviewOpen,
  setPublishPlaylist,
  setIsPublishOpen,
  setSchedulePlaylist,
  setIsScheduleOpen,
}: MobileDropdownProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="pt-1 border-t border-border/40 relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full inline-flex items-center justify-center gap-2 h-10 px-3 text-xs font-semibold rounded-xl border border-border bg-card text-foreground hover:bg-muted/60 transition-colors"
      >
        <MoreHorizontal className="h-4 w-4" />
        Hành động
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-2 z-50 bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-1 duration-150">
          <button
            onClick={() => { setPreviewPlaylist(pl); setIsPreviewOpen(true); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/60 transition-colors text-left"
          >
            <Eye className="h-4 w-4 text-emerald-500" /> Xem trước
          </button>
          <button
            onClick={() => { setPublishPlaylist(pl); setIsPublishOpen(true); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/60 transition-colors text-left"
          >
            <Play className="h-4 w-4 text-indigo-500 fill-indigo-500/10" /> Phát ngay
          </button>
          <button
            onClick={() => { setSchedulePlaylist(pl); setIsScheduleOpen(true); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/60 transition-colors text-left"
          >
            <Calendar className="h-4 w-4 text-amber-500" /> Hẹn giờ phát
          </button>
          <div className="border-t border-border/60 mx-3" />
          <button
            onClick={() => { handleOpenEdit(pl); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/60 transition-colors text-left"
          >
            <Pencil className="h-4 w-4 text-primary" /> Chỉnh sửa
          </button>
          <button
            onClick={() => { handleDeletePlaylist(pl.id, pl.playlistName); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left"
          >
            <Trash2 className="h-4 w-4" /> Xóa playlist
          </button>
        </div>
      )}
    </div>
  );
};
