import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Plus, Eye, Edit, Trash2, ListVideo } from "lucide-react";
import { useMedia } from "@/hooks/useApi";
import { api } from "@/utils/api";
import { Playlist } from "@/types/dashboard";
import PlaylistEditor from "./playlist-editor/PlaylistEditor";
import PlaylistPreviewModal from "./PlaylistPreviewModal";
import { useDashboard } from "../context/DashboardContext";

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
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-foreground">
            Danh sách phát (Layout Playlists)
          </h3>
          <p className="text-xs text-muted-foreground">
            Tạo danh sách phát toàn màn hình hoặc ma trận Video Wall ghép đồng
            bộ
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
        >
          <Plus className="mr-2 h-4 w-4" /> Tạo Playlist
        </Button>
      </div>

      {/* Playlists Table */}
      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-[30%] px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tên Playlist
                </TableHead>
                <TableHead className="w-[20%] px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Chế độ phát
                </TableHead>
                <TableHead className="w-[20%] px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tỉ lệ co giãn
                </TableHead>
                <TableHead className="w-[15%] px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Ngày tạo
                </TableHead>
                <TableHead className="text-right w-[15%] px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Thao tác
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {playlists.map((pl) => {
                const isVideoWall = !!(pl as any).syncLayout?.videoWall;
                const isSyncGroup = pl.isSyncGroup;

                return (
                  <TableRow
                    key={pl.id}
                    className="border-border hover:bg-muted/30 group transition-colors"
                  >
                    <TableCell className="align-middle px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                          <ListVideo className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <span
                            className="font-bold text-foreground text-sm block truncate max-w-[250px]"
                            title={pl.playlistName}
                          >
                            {pl.playlistName}
                          </span>
                          <span
                            className="text-xs text-muted-foreground block truncate max-w-[250px]"
                            title={pl.description || ""}
                          >
                            {pl.description || "Không có mô tả"}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="align-middle px-6 py-4">
                      {isVideoWall ? (
                        <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 border-none font-semibold text-[10px] px-2 py-0.5">
                          Video Wall ({(pl as any).syncLayout?.videoWall?.rows}x
                          {(pl as any).syncLayout?.videoWall?.cols})
                        </Badge>
                      ) : isSyncGroup ? (
                        <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 border-none font-semibold text-[10px] px-2 py-0.5">
                          Đồng bộ nhóm
                        </Badge>
                      ) : (
                        <Badge className="bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-500/20 border-none font-semibold text-[10px] px-2 py-0.5">
                          Đơn lẻ
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="align-middle px-6 py-4 font-semibold text-xs text-foreground">
                      {getPlaylistResLabel(pl)}
                    </TableCell>
                    <TableCell className="align-middle px-6 py-4 text-xs text-muted-foreground">
                      {new Date(pl.createdAt).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell className="align-middle px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Review / Preview Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setPreviewPlaylist(pl);
                            setIsPreviewOpen(true);
                          }}
                          className="h-8 w-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-lg"
                          title="Xem trước"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {/* Edit Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(pl)}
                          className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10 rounded-lg"
                          title="Chỉnh sửa"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        {/* Delete Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleDeletePlaylist(pl.id, pl.playlistName)
                          }
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg"
                          title="Xóa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}

              {playlists.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-16 text-muted-foreground bg-muted/5"
                  >
                    <div className="flex flex-col items-center justify-center gap-3">
                      <ListVideo className="h-10 w-10 text-muted-foreground/60 animate-pulse" />
                      <p className="text-sm font-medium italic">
                        Chưa có danh sách phát nào được tạo.
                      </p>
                      <Button
                        onClick={handleOpenCreate}
                        variant="link"
                        className="text-primary p-0 h-auto font-semibold"
                      >
                        Tạo danh sách phát đầu tiên ngay
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Playlist playback preview simulation modal */}
      <PlaylistPreviewModal
        playlist={previewPlaylist}
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setPreviewPlaylist(null);
        }}
      />
    </div>
  );
}
