import { useState, useEffect } from "react";
import { Playlist } from "@/types/dashboard";
import { api } from "@/utils/api";
import { PlaylistItemData } from "./PlaylistSidebar";

interface UsePlaylistDraftProps {
  editingPlaylist: Playlist | null;
}

export function usePlaylistDraft({ editingPlaylist }: UsePlaylistDraftProps) {
  const [playlistName, setPlaylistName] = useState("");
  const [playlistDesc, setPlaylistDesc] = useState("");
  const [selectedResValue, setSelectedResValue] = useState("1920*1080");
  const [isSyncGroup, setIsSyncGroup] = useState(false);
  const [scaleMode, setScaleMode] = useState<"stretch" | "crop">("stretch");

  const [isVideoWallMode, setIsVideoWallMode] = useState(false);
  const [videoWallRows, setVideoWallRows] = useState(1);
  const [videoWallCols, setVideoWallCols] = useState(1);
  const [videoWallSourceMediaId, setVideoWallSourceMediaId] = useState("");
  const [videoWallMapping, setVideoWallMapping] = useState<Record<string, string>>({});

  const [slides, setSlides] = useState<PlaylistItemData[]>([]);
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<"idle" | "has_draft" | "restored" | "ignored">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const draftStr = localStorage.getItem("cms_playlist_draft");
      if (draftStr) {
        const draft = JSON.parse(draftStr);
        if (
          (!editingPlaylist && !draft.editingPlaylistId) ||
          (editingPlaylist && draft.editingPlaylistId === editingPlaylist.id)
        ) {
          setDraftStatus("has_draft");
        }
      }
    } catch (e) {
      console.error("Lỗi khi kiểm tra bản nháp:", e);
    }
  }, [editingPlaylist]);

  useEffect(() => {
    const loadPlaylistData = async () => {
      if (editingPlaylist) {
        setPlaylistName(editingPlaylist.playlistName);
        setPlaylistDesc(editingPlaylist.description || "");
        setIsSyncGroup(editingPlaylist.isSyncGroup || false);

        interface SyncLayoutConfig {
          width?: number;
          height?: number;
          scaleMode?: "stretch" | "crop";
          deviceMapping?: Record<string, string[]>;
          videoWall?: {
            rows: number;
            cols: number;
            sourceMediaId: string;
          };
        }
        const syncLayout = (editingPlaylist as { syncLayout?: SyncLayoutConfig }).syncLayout;
        if (syncLayout?.width && syncLayout?.height) {
          setSelectedResValue(`${syncLayout.width}*${syncLayout.height}`);
        } else {
          setSelectedResValue("1920*1080");
        }
        setScaleMode(syncLayout?.scaleMode || "stretch");

        if (syncLayout?.videoWall) {
          setIsVideoWallMode(true);
          setVideoWallRows(syncLayout.videoWall.rows || 1);
          setVideoWallCols(syncLayout.videoWall.cols || 1);
          setVideoWallSourceMediaId(syncLayout.videoWall.sourceMediaId || "");

          const rows = syncLayout.videoWall.rows || 1;
          const cols = syncLayout.videoWall.cols || 1;
          const mapping: Record<string, string> = {};
          const deviceMapping = syncLayout.deviceMapping || {};

          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const slotIdx = r * cols + c + 1;
              const mappedDevices = deviceMapping[slotIdx.toString()];
              if (mappedDevices && mappedDevices.length > 0) {
                mapping[`${r}-${c}`] = mappedDevices[0];
              }
            }
          }
          setVideoWallMapping(mapping);
        } else {
          setIsVideoWallMode(false);
          setVideoWallRows(1);
          setVideoWallCols(1);
          setVideoWallSourceMediaId("");
          setVideoWallMapping({});
        }

        try {
          interface BackendPlaylistItem {
            id: string;
            sortOrder: number;
            duration: number;
            transitionEffect: string;
            media: {
              id: string;
              fileName: string;
              fileUrl: string;
              mimeType: string;
            };
          }
          const items = (await api.get(
            `/api/playlists/${editingPlaylist.id}/items`,
          )) as BackendPlaylistItem[];

          if (items && items.length > 0) {
            const mappedSlides: PlaylistItemData[] = items.map((item) => ({
              id: item.id,
              mediaId: item.media.id,
              duration: item.duration,
              fileName: item.media.fileName,
              fileUrl: item.media.fileUrl,
              mimeType: item.media.mimeType,
              targetDeviceIds:
                syncLayout?.deviceMapping?.[item.sortOrder.toString()] || [],
            }));
            setSlides(mappedSlides);
            setActiveSlideId(mappedSlides[0].id);
          } else {
            const defaultId = `slide-${Date.now()}`;
            setSlides([{ id: defaultId, mediaId: null, duration: 15 }]);
            setActiveSlideId(defaultId);
          }
        } catch (err) {
          console.error("Lỗi khi tải playlist items:", err);
          setErrorMsg("Không thể tải danh sách slide của playlist.");
        }
      } else {
        setPlaylistName("Playlist mới");
        setPlaylistDesc("");
        setSelectedResValue("1920*1080");
        setIsSyncGroup(false);
        setIsVideoWallMode(false);
        setVideoWallRows(1);
        setVideoWallCols(1);
        setVideoWallSourceMediaId("");
        setVideoWallMapping({});
        const defaultId = `slide-${Date.now()}`;
        setSlides([{ id: defaultId, mediaId: null, duration: 15 }]);
        setActiveSlideId(defaultId);
      }
    };

    loadPlaylistData();
  }, [editingPlaylist]);

  useEffect(() => {
    if (
      slides.length > 0 &&
      (draftStatus === "restored" ||
        draftStatus === "ignored" ||
        (draftStatus === "idle" && !localStorage.getItem("cms_playlist_draft")))
    ) {
      const draftData = {
        playlistName,
        playlistDesc,
        selectedResValue,
        isSyncGroup,
        slides,
        editingPlaylistId: editingPlaylist?.id || null,
      };
      localStorage.setItem("cms_playlist_draft", JSON.stringify(draftData));
    }
  }, [
    playlistName,
    playlistDesc,
    selectedResValue,
    isSyncGroup,
    slides,
    draftStatus,
    editingPlaylist,
  ]);

  return {
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
  };
}
