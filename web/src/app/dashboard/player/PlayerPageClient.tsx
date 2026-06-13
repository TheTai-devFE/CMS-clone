'use client';

import React, { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { api } from '@/utils/api';
import PlayerTab from '../components/PlayerTab';
import ClaimDeviceModal from '../components/ClaimDeviceModal';
import EditDeviceModal from '../components/EditDeviceModal';
import { useDevices } from '@/hooks/useApi';
import { Device } from '@/types/dashboard';

export default function PlayerPageClient() {
  const {
    currentUser,
    searchQuery,
    setError,
    setSuccessMsg
  } = useDashboard();

  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

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

  const handleEditDevice = (device: Device) => {
    setSelectedDevice(device);
    setIsEditModalOpen(true);
  };

  return (
    <>
      <PlayerTab
        devices={filteredDevices}
        currentUser={currentUser}
        handleDeleteDevice={handleDeleteDevice}
        handleEditDevice={handleEditDevice}
        fetchData={mutate}
        onOpenClaimModal={() => setIsClaimModalOpen(true)}
      />
      <ClaimDeviceModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        onSuccess={mutate}
        setError={setError}
        setSuccessMsg={setSuccessMsg}
      />
      <EditDeviceModal
        isOpen={isEditModalOpen}
        device={selectedDevice}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedDevice(null);
        }}
        onSuccess={mutate}
        setError={setError}
        setSuccessMsg={setSuccessMsg}
      />
    </>
  );
}
