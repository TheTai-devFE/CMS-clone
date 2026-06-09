'use client';

import React, { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { api } from '@/utils/api';
import AdminTab from '../components/AdminTab';
import AssignDeviceModal from '../components/AssignDeviceModal';
import { usePendingDevices, useUsers } from '@/hooks/useApi';

export default function AdminPageClient() {
  const {
    currentUser,
    searchQuery,
    setError,
    setSuccessMsg
  } = useDashboard();

  const isAdmin = currentUser?.role === 'admin';

  // Use SWR hooks for admin data fetching with caching
  const { pendingDevices, mutate: mutatePending } = usePendingDevices(isAdmin);
  const { users } = useUsers(isAdmin);

  // Local Modal States
  const [selectedDeviceForAssign, setSelectedDeviceForAssign] = useState<string | null>(null);
  const [targetUserIdForAssign, setTargetUserIdForAssign] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);

  // Redirect non-admins if they accidentally access
  if (currentUser && currentUser.role !== 'admin') {
    return (
      <div className="p-6 text-center text-red-500 font-bold">
        Bạn không có quyền truy cập vào trang này.
      </div>
    );
  }

  // Filter pending devices based on search query
  const filteredPendingDevices = pendingDevices.filter(d =>
    d.deviceName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAssignModal = (deviceId: string) => {
    setSelectedDeviceForAssign(deviceId);
    const nonAdmins = users.filter((u) => u.role !== 'admin');
    if (nonAdmins.length > 0) {
      setTargetUserIdForAssign(nonAdmins[0].id);
    }
  };

  const handleAssignDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeviceForAssign || !targetUserIdForAssign) return;

    setActionLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      await api.put(`/api/admin/devices/${selectedDeviceForAssign}/assign`, {
        userId: targetUserIdForAssign,
      });

      setSuccessMsg('Da duyet va gan thiet bi thanh cong');
      setSelectedDeviceForAssign(null);
      setTargetUserIdForAssign('');

      // Mutate SWR pending devices cache to refresh the list
      mutatePending();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Co loi xay ra khi gan thiet bi');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <AdminTab
        pendingDevices={filteredPendingDevices}
        users={users}
        handleOpenAssignModal={handleOpenAssignModal}
      />

      <AssignDeviceModal
        selectedDeviceForAssign={selectedDeviceForAssign}
        setSelectedDeviceForAssign={setSelectedDeviceForAssign}
        targetUserIdForAssign={targetUserIdForAssign}
        setTargetUserIdForAssign={setTargetUserIdForAssign}
        users={users}
        handleAssignDevice={handleAssignDevice}
        actionLoading={actionLoading}
      />
    </>
  );
}
