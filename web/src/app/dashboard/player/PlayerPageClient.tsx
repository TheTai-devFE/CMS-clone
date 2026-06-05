'use client';

import React from 'react';
import { useDashboard } from '../context/DashboardContext';
import { api } from '@/utils/api';
import PlayerTab from '../components/PlayerTab';
import { useDevices } from '@/hooks/useApi';

export default function PlayerPageClient() {
  const {
    currentUser,
    searchQuery,
    setError,
    setSuccessMsg
  } = useDashboard();

  // Use SWR hook for caching and automatic revalidation
  const { devices, mutate } = useDevices();

  if (!currentUser) return null;

  // Filter devices based on search query
  const filteredDevices = devices.filter(d => 
    d.deviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.ipAddress && d.ipAddress.includes(searchQuery)) ||
    (d.macAddress && d.macAddress.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleDeleteDevice = async (id: string, name: string) => {
    if (!confirm(`Ban co chac chan muon xoa thiet bi: ${name}?`)) return;

    setError('');
    setSuccessMsg('');
    try {
      await api.delete(`/api/devices/${id}`);
      setSuccessMsg('Da xoa thiet bi thanh cong');
      // Mutate SWR cache to reload devices list
      mutate();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Khong the xoa thiet bi');
    }
  };

  return (
    <PlayerTab
      devices={filteredDevices}
      currentUser={currentUser}
      handleDeleteDevice={handleDeleteDevice}
      fetchData={mutate}
    />
  );
}
