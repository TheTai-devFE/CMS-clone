import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Eye, Edit, Trash2, ListVideo, Video, Play } from "lucide-react";
import { useMedia } from "@/hooks/useApi";
import { api } from "@/utils/api";
import { Playlist } from "@/types/dashboard";
import PlaylistEditor from "./playlist-editor/PlaylistEditor";
import PlaylistPreviewModal from "./PlaylistPreviewModal";
import { useDashboard } from "@/app/dashboard/context/DashboardContext";
import { QuickPublishModal } from "./QuickPublishModal";

interface PlaylistTabProps {
  playlists: Playlist[];
  fetchPlaylistsData: () => void;
}

export default function PlaylistTab({
  playlists,
  fetchPlaylistsData,
}: PlaylistTabProps) {
  const { mediaList } = useMedia();
  const { setError, setSuccessMsg } = useDashboard();

  // Editor modal/view states
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);

  // Preview modal states
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewPlaylist, setPreviewPlaylist] = useState<Playlist | null>(null);

  // Quick Publish modal states
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [publishPlaylist, setPublishPlaylist] = useState<Playlist | null>(null);

  const handleOpenCreate = () => {
    setEditingPlaylist(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (playlist: Playlist) => {
    setEditingPlaylist(playlist);
    setIsEditorOpen(true);
  };

  const handleDeletePlaylist = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa Playlist: ${name}?`)) return;

    try {
      await api.delete(`/api/playlists/${id}`);
      setSuccessMsg("Xóa Playlist thành công");
      fetchPlaylistsData();
    } catch (error) {
      const err = error as Error;
      setError(err.message || "Lỗi khi xóa Playlist");
    }
  };

  const getPlaylistResLabel = (playlist: Playlist) => {
    interface SyncLayoutConfig {
      width?: number;
      height?: number;
      aspectRatio?: string;
    }
    const syncLayout = (playlist as { syncLayout?: SyncLayoutConfig })
      .syncLayout;
    if (syncLayout?.width && syncLayout?.height) {
      return `${syncLayout.width}x${syncLayout.height} (${syncLayout.aspectRatio || "16:9"})`;
    }
    return "Chưa cấu hình (16:9)";
  };

  // Render PPTX Slide Playlist Editor
  if (isEditorOpen) {
    return (
      <PlaylistEditor
        editingPlaylist={editingPlaylist}
        mediaList={mediaList}
        onClose={() => setIsEditorOpen(false)}
        onSave={() => {
          fetchPlaylistsData();
        }}
        onCreated={(playlistId) => {
          fetchPlaylistsData();
          const created = playlists.find((p) => p.id === playlistId) || { id: playlistId, playlistName: "Playlist mới" } as Playlist;
          setPublishPlaylist(created);
          setIsPublishOpen(true);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">
            Bố cục đơn vùng (Layout Playlists)
          </h3>
          <p className="text-xs text-muted-foreground">
            Tạo danh sách phát toàn màn hình có tỉ lệ FullHD/4K và co dãn hình
            ảnh
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
          <Plus className="mr-2 h-4 w-4" /> Tạo Playlist
        </Button>
      </div>

      {/* Grid of Playlists */}
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {playlists.map((pl) => (
          <Card
            key={pl.id}
            className="bg-card border-border hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden relative">
            <CardHeader className="pb-3 bg-muted/10">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <CardTitle
                    className="text-sm font-bold text-foreground truncate max-w-[155px]"
                    title={pl.playlistName}>
                    {pl.playlistName}
                  </CardTitle>
                  <CardDescription className="text-[10px] truncate max-w-[155px]">
                    {pl.description || "Không có mô tả"}
                  </CardDescription>
                </div>
                {pl.isSyncGroup && (
                  <Badge
                    variant="secondary"
                    className="bg-indigo-500/10 text-indigo-500 text-[8px] border-none font-semibold">
                    Đồng bộ
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="py-4 text-xs text-muted-foreground space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span>Tỉ lệ:</span>
                <span className="font-semibold text-foreground">
                  {getPlaylistResLabel(pl)}
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Ngày tạo:</span>
                <span className="font-semibold text-foreground">
                  {new Date(pl.createdAt).toLocaleDateString("vi-VN")}
                </span>
              </div>
            </CardContent>
            <CardFooter className="p-3 border-t border-border flex justify-between gap-1 bg-muted/5">
              <div className="flex items-center gap-1">
                {/* Review / Preview Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPreviewPlaylist(pl);
                    setIsPreviewOpen(true);
                  }}
                  className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-xs gap-1 px-2">
                  <Eye className="h-3.5 w-3.5" /> Xem trước
                </Button>

                {/* Quick Publish Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPublishPlaylist(pl);
                    setIsPublishOpen(true);
                  }}
                  className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-xs gap-1 px-2">
                  <Play className="h-3.5 w-3.5" /> Phát ngay
                </Button>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenEdit(pl)}
                  className="text-primary hover:text-primary/90 text-xs px-2">
                  Sửa
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeletePlaylist(pl.id, pl.playlistName)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs px-2">
                  Xóa
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}

        {playlists.length === 0 && (
          <div className="col-span-full py-16 border border-dashed border-border rounded-xl flex flex-col items-center justify-center bg-muted/5 gap-3">
            <Video className="h-10 w-10 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground italic">
              Chưa có Layout Playlist nào.
            </p>
            <Button
              onClick={handleOpenCreate}
              variant="link"
              className="text-primary p-0 h-auto font-medium">
              Tạo Playlist đầu tiên ngay
            </Button>
          </div>
        )}
      </div>

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
    </div>
  );
}
