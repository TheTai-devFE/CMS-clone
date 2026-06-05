'use client';

import React from 'react';
import { useDashboard } from '../context/DashboardContext';
import ResourceTab from '../components/ResourceTab';
import { usePlaylists, useSchedules } from '@/hooks/useApi';

export default function ResourcePageClient() {
  const {
    searchQuery
  } = useDashboard();

  // Use SWR hooks for playlists and schedules with caching
  const { playlists, mutate: mutatePlaylists } = usePlaylists();
  const { schedules, mutate: mutateSchedules } = useSchedules();

  const handleRefresh = () => {
    mutatePlaylists();
    mutateSchedules();
  };

  // Filter playlists based on search query
  const filteredPlaylists = playlists.filter(pl =>
    pl.playlistName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (pl.description && pl.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Filter schedules based on search query
  const filteredSchedules = schedules.filter(sc =>
    sc.scheduleName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ResourceTab
      playlists={filteredPlaylists}
      schedules={filteredSchedules}
      fetchData={handleRefresh}
    />
  );
}
