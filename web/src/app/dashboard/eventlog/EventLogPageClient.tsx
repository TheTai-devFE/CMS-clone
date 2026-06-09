'use client';

import React from 'react';
import { useDashboard } from '../context/DashboardContext';
import EventLogTab from '../components/EventLogTab';
import { useDeviceLogs } from '@/hooks/useApi';

export default function EventLogPageClient() {
  const {
    searchQuery
  } = useDashboard();

  // Use SWR hooks for event log page to fetch system logs with caching
  const { logs: eventLogs, mutate: mutateLogs } = useDeviceLogs();

  const handleRefresh = () => {
    mutateLogs();
  };

  // Filter event logs based on search query
  const filteredLogs = eventLogs.filter(log =>
    log.deviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.detail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <EventLogTab
      eventLogs={filteredLogs}
      fetchData={handleRefresh}
    />
  );
}
