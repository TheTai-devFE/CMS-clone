'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../utils/api';
import { cookieStorage } from '../../../utils/cookie';

interface Device {
  id: string;
  deviceName: string;
  apiKey: string;
  status: 'online' | 'offline';
  approvalStatus: 'pending' | 'approved';
  userId?: string;
  macAddress?: string;
  ipAddress?: string;
  screenResolution?: string;
  osVersion?: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  licenseLimit: number;
  status: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [pendingDevices, setPendingDevices] = useState<Device[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedDeviceForAssign, setSelectedDeviceForAssign] = useState<string | null>(null);
  const [targetUserIdForAssign, setTargetUserIdForAssign] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const pendingData = await api.get('/api/admin/devices/pending');
      setPendingDevices(pendingData || []);

      const usersData = await api.get('/api/auth/users');
      setUsers(usersData || []);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải dữ liệu quản trị.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = cookieStorage.getUserInfo();
    if (!user || user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    setCurrentUser(user);
    fetchData();
  }, [router]);

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

      setSuccessMsg('Đã duyệt và gán thiết bị thành công');
      setSelectedDeviceForAssign(null);
      setTargetUserIdForAssign('');
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi gán thiết bị');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenAssignModal = (deviceId: string) => {
    setSelectedDeviceForAssign(deviceId);
    const nonAdminUsers = users.filter((u) => u.role !== 'admin');
    if (nonAdminUsers.length > 0) {
      setTargetUserIdForAssign(nonAdminUsers[0].id);
    }
  };

  if (!currentUser || currentUser.role !== 'admin') return null;

  return (
    <div className="tab-content">
      {(error || successMsg) && (
        <div className="dash-messages" style={{ marginBottom: '20px' }}>
          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
              <button className="alert-dismiss" onClick={() => setError('')}>x</button>
            </div>
          )}
          {successMsg && (
            <div className="alert alert-success">
              <span>{successMsg}</span>
              <button className="alert-dismiss" onClick={() => setSuccessMsg('')}>x</button>
            </div>
          )}
        </div>
      )}

      <div className="tab-header">
        <h2>Duyệt thiết bị chờ liên kết</h2>
        <button onClick={fetchData} className="btn-secondary">
          Làm mới
        </button>
      </div>

      {loading ? (
        <div className="loading-container" style={{ minHeight: '200px' }}>
          <span className="spinner"></span>
          <p>Đang tải dữ liệu quản trị...</p>
        </div>
      ) : pendingDevices.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <h3>Không có thiết bị chờ duyệt</h3>
          <p>Tất cả thiết bị đã được gán hoặc chưa có màn hình nào đăng ký mới.</p>
        </div>
      ) : (
        <div className="pending-list">
          {pendingDevices.map((device) => (
            <div className="pending-item" key={device.id}>
              <div className="pending-item-info">
                <h3 className="pending-device-name">{device.deviceName}</h3>
                <div className="pending-meta">
                  IP: {device.ipAddress} | Res: {device.screenResolution} | OS: {device.osVersion}
                </div>
                <div className="pending-api-key">
                  API Key: {device.apiKey}
                </div>
              </div>
              <button onClick={() => handleOpenAssignModal(device.id)} className="btn-primary">
                Phê duyệt
              </button>
            </div>
          ))}
        </div>
      )}

      {/* User License Table */}
      <div style={{ marginTop: '40px' }}>
        <div className="tab-header">
          <h2>Hạn mức License của các User</h2>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Quyền hạn</th>
                <th>Hạn mức</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr className="table-row" key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.username}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={u.role === 'admin' ? 'badge badge-admin' : 'badge badge-accent'}>
                      {u.role === 'admin' ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td>{u.role === 'admin' ? 'Không giới hạn' : `${u.licenseLimit} thiết bị`}</td>
                  <td>
                    <span className={u.status === 'active' ? 'badge badge-success' : 'badge badge-offline'}>
                      {u.status === 'active' ? 'Active' : u.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ====== ASSIGN DEVICE MODAL ====== */}
      {selectedDeviceForAssign && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Duyệt và gán thiết bị</h3>
              <button className="modal-close" onClick={() => setSelectedDeviceForAssign(null)}>x</button>
            </div>
            <p className="modal-desc">
              Chọn tài khoản khách hàng để liên kết thiết bị. Hệ thống sẽ tự động đối chiếu với hạn mức license còn lại.
            </p>

            <form onSubmit={handleAssignDevice} className="modal-form">
              <div className="form-group">
                <label className="form-label">Chọn tài khoản User</label>
                <select
                  className="form-select"
                  value={targetUserIdForAssign}
                  onChange={(e) => setTargetUserIdForAssign(e.target.value)}
                  required
                >
                  {users
                    .filter((u) => u.role !== 'admin')
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.username} ({u.email})
                      </option>
                    ))}
                  {users.filter((u) => u.role !== 'admin').length === 0 && (
                    <option disabled value="">Không có user thường nào</option>
                  )}
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setSelectedDeviceForAssign(null)}
                  className="btn-secondary"
                  disabled={actionLoading}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={actionLoading || users.filter((u) => u.role !== 'admin').length === 0}
                >
                  {actionLoading ? <span className="spinner spinner-dark"></span> : 'Xác nhận'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
