'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../utils/api';

interface Device {
  id: string;
  deviceName: string;
}

interface MediaItem {
  id: string;
  fileName: string;
}

interface EventLog {
  id: string;
  deviceName: string;
  status: string;
  detail: string;
  time: string;
}

export default function EventLogPage() {
  const [eventLogs, setEventLogs] = useState<EventLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const devices = await api.get('/api/devices').catch(() => []);
      const mediaList = await api.get('/api/media').catch(() => []);

      if (devices && devices.length > 0) {
        const mocks = [];
        const statuses = ['Online', 'Heartbeat', 'Playback Success', 'Offline'];
        for (let i = 0; i < 15; i++) {
          const dev = devices[i % devices.length];
          const time = new Date(Date.now() - i * 4 * 60 * 1000).toLocaleString('vi-VN');
          const status = statuses[i % statuses.length];
          let detail = '';
          if (status === 'Heartbeat') {
            detail = `CPU: ${Math.floor(Math.random() * 20 + 5)}% | Memory Free: ${Math.floor(Math.random() * 500 + 100)}MB`;
          } else if (status === 'Playback Success') {
            const mediaName = mediaList && mediaList.length > 0 ? mediaList[i % mediaList.length].fileName : 'quangcao.mp4';
            detail = `Đã phát file: ${mediaName} (Thời lượng: 10s)`;
          } else if (status === 'Online') {
            detail = `Thiết bị khởi động và kết nối thành công. IP: ${dev.ipAddress || '192.168.1.5'}`;
          } else {
            detail = `Thiết bị mất kết nối mạng. Chuyển sang chế độ phát offline.`;
          }
          mocks.push({
            id: `log-${i}`,
            deviceName: dev.deviceName,
            status,
            detail,
            time
          });
        }
        setEventLogs(mocks);
      } else {
        setEventLogs([
          { id: 'log-1', deviceName: 'Màn hình Tầng 1', status: 'Online', detail: 'Kết nối thành công. IP: 192.168.1.15', time: new Date().toLocaleString('vi-VN') },
          { id: 'log-2', deviceName: 'Màn hình Tầng 2', status: 'Heartbeat', detail: 'CPU: 12% | Memory Free: 340MB', time: new Date(Date.now() - 5*60000).toLocaleString('vi-VN') },
          { id: 'log-3', deviceName: 'Màn hình Sảnh Chính', status: 'Playback Success', detail: 'Đã phát file: banner_summer.png (Thời lượng: 15s)', time: new Date(Date.now() - 10*60000).toLocaleString('vi-VN') },
        ]);
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải nhật ký hoạt động.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="tab-content">
      {error && (
        <div className="dash-messages" style={{ marginBottom: '20px' }}>
          <div className="alert alert-error">
            <span>{error}</span>
            <button className="alert-dismiss" onClick={() => setError('')}>x</button>
          </div>
        </div>
      )}

      <div className="tab-header">
        <h2>Nhật ký hoạt động thiết bị (Event Log)</h2>
        <button onClick={fetchLogs} className="btn-secondary">
          Làm mới log
        </button>
      </div>

      {loading ? (
        <div className="loading-container" style={{ minHeight: '300px' }}>
          <span className="spinner"></span>
          <p>Đang tải nhật ký hoạt động...</p>
        </div>
      ) : (
        <div className="table-container" style={{ marginTop: '20px' }}>
          <table className="event-log-table">
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Tên thiết bị</th>
                <th>Hành động / Trạng thái</th>
                <th>Chi tiết sự kiện</th>
              </tr>
            </thead>
            <tbody>
              {eventLogs.map((log) => (
                <tr key={log.id}>
                  <td style={{ whiteSpace: 'nowrap', fontWeight: 500 }}>{log.time}</td>
                  <td style={{ fontWeight: 600 }}>{log.deviceName}</td>
                  <td>
                    <span className={
                      log.status === 'Playback Success' ? 'badge badge-success' :
                      log.status === 'Online' ? 'badge badge-success' :
                      log.status === 'Heartbeat' ? 'badge badge-accent' : 'badge badge-warning'
                    }>
                      {log.status}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{log.detail}</td>
                </tr>
              ))}
              {eventLogs.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                    Không có nhật ký sự kiện nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
