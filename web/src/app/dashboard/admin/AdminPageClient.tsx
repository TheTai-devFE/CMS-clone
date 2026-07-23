'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/app/dashboard/context/DashboardContext';
import { api } from '@/utils/api';
import AssignDeviceModal from '@/components/dashboard/AssignDeviceModal';
import CreateUserModal from '@/components/dashboard/CreateUserModal';
import PasswordRevealModal from '@/components/dashboard/PasswordRevealModal';
import { usePendingDevices, useUsers } from '@/hooks/useApi';
import AdminTab from '@/components/dashboard/AdminTab';

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
  const { users, mutate: mutateUsers } = useUsers(isAdmin);

  // Local Modal States
  const [selectedDeviceForAssign, setSelectedDeviceForAssign] = useState<string | null>(null);
  const [targetUserIdForAssign, setTargetUserIdForAssign] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);

  // T2: Create user flow states
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [createdUser, setCreatedUser] = useState<{
    id: string;
    shortId: string;
    username: string;
    email: string;
    role: string;
    licenseLimit: number;
    tempPassword: string;
  } | null>(null);

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

  // T2: handle user created → show password reveal
  const handleUserCreated = (newUser: {
    id: string;
    shortId: string;
    username: string;
    email: string;
    role: string;
    licenseLimit: number;
    tempPassword: string;
  }) => {
    setShowCreateUserModal(false);
    setCreatedUser(newUser);
    setSuccessMsg(`Đã tạo user ${newUser.email} thành công`);
    // Refresh user list
    mutateUsers();
  };

  return (
    <>
      <AdminTab
        pendingDevices={filteredPendingDevices}
        users={users}
        handleOpenAssignModal={handleOpenAssignModal}
        onUsersChange={mutateUsers}
        onOpenCreateUser={() => setShowCreateUserModal(true)}
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

      {showCreateUserModal && (
        <CreateUserModal
          onClose={() => setShowCreateUserModal(false)}
          onCreated={handleUserCreated}
        />
      )}

      {createdUser && (
        <PasswordRevealModal
          email={createdUser.email}
          username={createdUser.username}
          shortId={createdUser.shortId}
          tempPassword={createdUser.tempPassword}
          onClose={() => setCreatedUser(null)}
        />
      )}
    </>
  );
}
