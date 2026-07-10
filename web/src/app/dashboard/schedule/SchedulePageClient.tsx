'use client';
import ScheduleTab from '@/components/dashboard/schedule/ScheduleTab';
import { useDashboard } from '@/app/dashboard/context/DashboardContext';
import { usePlaylists, useSchedules } from '@/hooks/useApi';

export default function SchedulePageClient() {
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

  // Filter schedules based on search query
  const filteredSchedules = schedules.filter(sc =>
    sc.scheduleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (sc.playlist && sc.playlist.playlistName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (sc.template && sc.template.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <ScheduleTab
      playlists={playlists}
      schedules={filteredSchedules}
      fetchData={handleRefresh}
    />
  );
}
