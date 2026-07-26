import { useState } from "react";
import { Playlist } from "@/types/dashboard";
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
  setErrorMsg: (msg: string | null) => void;
  onSave: () => void;
  onCreated?: (
    id: string,
    name: string,
    isSyncGroup: boolean,
    deviceIds: string[],
  ) => void;
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
      // Devices already assigned during editing (Video Wall Simulator mapping, or per-slide
      // device targeting for a regular sync group) — surfaced back to the caller so the
      // post-save schedule step can pre-fill "Thiết bị liên kết" instead of asking again.
      let syncDeviceIds: string[] = [];

      if (isVideoWallMode) {
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

        syncDeviceIds = Array.from(new Set(Object.values(deviceMappingPayload).flat()));

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

        // No further API call needed here: the backend already slices the source video
        // and creates the sliced PlaylistItems itself, inside createPlaylist/updatePlaylist,
        // whenever isSyncGroup + syncLayout.videoWall are present in the payload above.
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

        if (isSyncGroup) {
          syncDeviceIds = Array.from(new Set(Object.values(deviceMappingPayload).flat()));
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

          await api.post(`/api/playlists/${savedPlaylistId}/items`, {
            items: itemsPayload,
          });
        }
      }

      localStorage.removeItem("cms_playlist_draft");

      // Always route to the publish step after a successful save (new or edit) when the
      // caller wants it; callers that don't care about publishing just pass onSave only.
      if (savedPlaylistId && onCreated) {
        onCreated(savedPlaylistId, playlistName, isVideoWallMode || isSyncGroup, syncDeviceIds);
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
