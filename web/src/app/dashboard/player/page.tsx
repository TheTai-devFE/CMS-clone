'use client';

import React, { useEffect, useState } from 'react';
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
  appVersion?: string;
  lastHeartbeat?: string;
}

export default function PlayerPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  const fetchDevices = async () => {
    setLoading(true);
    setError('');
    try {
      const deviceData = await api.get('/api/devices');
      setDevices(deviceData || []);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải danh sách thiết bị.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = cookieStorage.getUserInfo();
    setCurrentUser(user);
    fetchDevices();
  }, []);

  const handleDeleteDevice = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa thiết bị: ${name}?`)) return;

    setError('');
    setSuccessMsg('');
    try {
      await api.delete(`/api/devices/${id}`);
      setSuccessMsg('Đã xóa thiết bị thành công');
      await fetchDevices();
    } catch (err: any) {
      setError(err.message || 'Không thể xóa thiết bị');
    }
  };

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
        <h2>Danh sách màn hình quảng cáo</h2>
        <button onClick={fetchDevices} className="btn-secondary">
          Làm mới
        </button>
      </div>

      {loading ? (
        <div className="loading-container" style={{ minHeight: '300px' }}>
          <span className="spinner"></span>
          <p>Đang tải danh sách thiết bị...</p>
        </div>
      ) : devices.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
          <h3>Chưa có thiết bị nào</h3>
          <p>Đăng ký thiết bị mới từ ứng dụng Android Player. Admin sẽ duyệt và gán thiết bị cho bạn.</p>
        </div>
      ) : (
        <div className="device-grid">
          {devices.map((device) => (
            <div className="device-card" key={device.id}>
              <div className="device-card-header">
                <h3 className="device-card-name">{device.deviceName}</h3>
                <span className={device.status === 'online' ? 'badge badge-success' : 'badge badge-offline'}>
                  {device.status === 'online' ? 'Online' : 'Offline'}
                </span>
              </div>

              <div className="device-card-body">
                <div className="device-info-row">
                  <span className="device-info-label">Trạng thái</span>
                  <span className={device.approvalStatus === 'approved' ? 'badge badge-success' : 'badge badge-warning'}>
                    {device.approvalStatus === 'approved' ? 'Đã duyệt' : 'Chờ duyệt'}
                  </span>
                </div>
                <div className="device-info-row">
                  <span className="device-info-label">IP</span>
                  <span className="device-info-value">{device.ipAddress || '—'}</span>
                </div>
                <div className="device-info-row">
                  <span className="device-info-label">Độ phân giải</span>
                  <span className="device-info-value">{device.screenResolution || '—'}</span>
                </div>
                <div className="device-info-row">
                  <span className="device-info-label">Hệ điều hành</span>
                  <span className="device-info-value">{device.osVersion || '—'}</span>
                </div>
                {currentUser?.role === 'admin' && device.userId && (
                  <div className="device-info-row">
                    <span className="device-info-label">User ID</span>
                    <span className="device-info-value text-mono">{device.userId.substring(0, 8)}...</span>
                  </div>
                )}
              </div>

              <div className="device-card-footer">
                <button
                  onClick={() => handleDeleteDevice(device.id, device.deviceName)}
                  className="btn-danger"
                >
                  Xóa thiết bị
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
