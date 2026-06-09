'use client';

import React from 'react';
import { useDashboard } from '../context/DashboardContext';
import ResourceTab from '../components/ResourceTab';
import { usePlaylists } from '@/hooks/useApi';

export default function ResourcePageClient() {
  const {
    searchQuery
  } = useDashboard();

  // Use SWR hooks for playlists with caching
  const { playlists, mutate: mutatePlaylists } = usePlaylists();

  const handleRefresh = () => {
    mutatePlaylists();
  };

  // Filter playlists based on search query
  const filteredPlaylists = playlists.filter(pl =>
    pl.playlistName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (pl.description && pl.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <ResourceTab
      playlists={filteredPlaylists}
      fetchData={handleRefresh}
    />
  );
}
