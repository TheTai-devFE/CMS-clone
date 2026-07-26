import { useState } from "react";
import { Playlist, MediaItem } from "@/types/dashboard";
import { api } from "@/utils/api";
import { PlaylistItemData } from "./PlaylistSidebar";

interface SavePlaylistParams {
  editingPlaylist: Playlist | null;
  playlistName: string;
  playlistDesc: string;
  selectedOption: { width: number; height: number };
  isSyncGroup: boolean;
  scaleMode: "stretch" | "crop";
  isVideoWallMode: boolean;
  videoWallRows: number;
  videoWallCols: number;
  videoWallSourceMediaId: string;
  videoWallMapping: Record<string, string>;
  slides: PlaylistItemData[];
  mediaList: MediaItem[];
  setErrorMsg: (msg: string | null) => void;
  onSave: () => void;
  onCreated?: (id: string, name: string) => void;
}

export function useSavePlaylist() {
  const [isSaving, setIsSaving] = useState(false);

  const handleSavePlaylist = async ({
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
    mediaList,
    setErrorMsg,
    onSave,
    onCreated,
  }: SavePlaylistParams) => {
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

    setIsSaving(true);
    setErrorMsg(null);

    try {
      let savedPlaylistId = editingPlaylist?.id;

      if (isVideoWallMode) {
        const sourceMedia = mediaList.find((m) => m.id === videoWallSourceMediaId);

        const deviceMappingPayload: Record<string, string[]> = {};
        for (let r = 0; r < videoWallRows; r++) {
          for (let c = 0; c < videoWallCols; c++) {
            const slotIdx = r * videoWallCols + c + 1;
            const mappedDeviceId = videoWallMapping[`${r}-${c}`];
            if (mappedDeviceId) {
              deviceMappingPayload[slotIdx.toString()] = [mappedDeviceId];
            }
          }
        }

        const syncLayoutConfig = {
          width: selectedOption.width,
          height: selectedOption.height,
          scaleMode,
          deviceMapping: deviceMappingPayload,
          videoWall: {
            rows: videoWallRows,
            cols: videoWallCols,
            sourceMediaId: videoWallSourceMediaId,
          },
        };

        const playlistPayload = {
          playlistName: playlistName.trim(),
          description: playlistDesc.trim() || undefined,
          isSyncGroup: true,
          syncLayout: syncLayoutConfig,
        };

        if (editingPlaylist) {
          await api.put(`/api/playlists/${editingPlaylist.id}`, playlistPayload);
        } else {
          const res = (await api.post("/api/playlists", playlistPayload)) as {
            id: string;
          };
          savedPlaylistId = res.id;
        }

        if (savedPlaylistId && sourceMedia) {
          const videoWallItems = [];
          for (let r = 0; r < videoWallRows; r++) {
            for (let c = 0; c < videoWallCols; c++) {
              const slotIdx = r * videoWallCols + c + 1;
              videoWallItems.push({
                mediaId: sourceMedia.id,
                duration: 10,
                sortOrder: slotIdx,
                transitionEffect: "none",
              });
            }
          }

          await api.post(`/api/playlists/${savedPlaylistId}/video-wall-slice`, {
            sourceMediaId: sourceMedia.id,
            rows: videoWallRows,
            cols: videoWallCols,
          });

          await api.post(`/api/playlists/${savedPlaylistId}/items/batch`, {
            items: videoWallItems,
          });
        }
      } else {
        const deviceMappingPayload: Record<string, string[]> = {};
        if (isSyncGroup) {
          slides.forEach((slide, idx) => {
            const sortOrder = idx + 1;
            if (slide.targetDeviceIds && slide.targetDeviceIds.length > 0) {
              deviceMappingPayload[sortOrder.toString()] = slide.targetDeviceIds;
            }
          });
        }

        const syncLayoutConfig = {
          width: selectedOption.width,
          height: selectedOption.height,
          scaleMode,
          ...(isSyncGroup && Object.keys(deviceMappingPayload).length > 0
            ? { deviceMapping: deviceMappingPayload }
            : {}),
        };

        const playlistPayload = {
          playlistName: playlistName.trim(),
          description: playlistDesc.trim() || undefined,
          isSyncGroup,
          syncLayout: syncLayoutConfig,
        };

        if (editingPlaylist) {
          await api.put(`/api/playlists/${editingPlaylist.id}`, playlistPayload);
        } else {
          const res = (await api.post("/api/playlists", playlistPayload)) as {
            id: string;
          };
          savedPlaylistId = res.id;
        }

        if (savedPlaylistId) {
          const itemsPayload = slides.map((slide, idx) => ({
            mediaId: slide.mediaId!,
            duration: slide.duration,
            sortOrder: idx + 1,
            transitionEffect: "none",
          }));

          await api.post(`/api/playlists/${savedPlaylistId}/items/batch`, {
            items: itemsPayload,
          });
        }
      }

      localStorage.removeItem("cms_playlist_draft");

      if (!editingPlaylist && savedPlaylistId && onCreated) {
        onCreated(savedPlaylistId, playlistName);
      } else {
        onSave();
      }
    } catch (err: unknown) {
      console.error("Lỗi khi lưu playlist:", err);
      const errorObj = err as { response?: { data?: { message?: string } } };
      setErrorMsg(
        errorObj.response?.data?.message ||
          "Không thể lưu Playlist. Vui lòng thử lại.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return { isSaving, handleSavePlaylist };
}
