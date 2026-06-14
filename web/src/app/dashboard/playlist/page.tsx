"use client";

import React from "react";
import PlaylistTab from "../components/PlaylistTab";
import { usePlaylists } from "@/hooks/useApi";
import { useDashboard } from "../context/DashboardContext";
import { RefreshCw } from "lucide-react";

export default function PlaylistPage() {
  const { playlists, mutate: mutatePlaylists, isLoading } = usePlaylists();
  const { searchQuery } = useDashboard();

  // Lọc danh sách phát dựa trên thanh tìm kiếm chung
  const filteredPlaylists = (playlists || []).filter(
    (pl) =>
      pl.playlistName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pl.description || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw className="h-8 w-8 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium">
          Đang tải danh sách phát...
        </p>
      </div>
    );
  }

  return (
    <PlaylistTab
      playlists={filteredPlaylists}
      fetchPlaylistsData={mutatePlaylists}
    />
  );
}
