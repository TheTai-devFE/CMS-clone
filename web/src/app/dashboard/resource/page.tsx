'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../utils/api';

export default function ResourcePage() {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchResources = async () => {
    setLoading(true);
    setError('');
    try {
      const playlistData = await api.get('/api/playlists').catch(() => []);
      setPlaylists(playlistData || []);

      const scheduleData = await api.get('/api/schedules').catch(() => []);
      setSchedules(scheduleData || []);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải tài nguyên hệ thống.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
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
        <h2>Quản lý tài nguyên &amp; Lịch phát (Play Schema)</h2>
        <button onClick={fetchResources} className="btn-secondary">
          Làm mới tài nguyên
        </button>
      </div>

      {loading ? (
        <div className="loading-container" style={{ minHeight: '300px' }}>
          <span className="spinner"></span>
          <p>Đang tải tài nguyên...</p>
        </div>
      ) : (
        <>
          {/* Playlists List */}
          <div style={{ marginTop: '20px' }}>
            <h3 style={{ marginBottom: '12px', borderBottom: '2px solid #cbd5e1', paddingBottom: '8px' }}>
              Playlists ({playlists.length})
            </h3>
            {playlists.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px' }}>
                <h3>Chưa có Playlist nào</h3>
                <p>Tạo playlist phát sóng từ API backend để quản lý trình chiếu.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tên Playlist</th>
                      <th>Mô tả</th>
                      <th>Kiểu đồng bộ</th>
                      <th>Ngày tạo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {playlists.map((pl) => (
                      <tr className="table-row" key={pl.id}>
                        <td style={{ fontWeight: 600, color: '#0ea5e9' }}>{pl.playlistName}</td>
                        <td>{pl.description || '—'}</td>
                        <td>{pl.isSyncGroup ? 'Đồng bộ nhóm' : 'Đơn lẻ'}</td>
                        <td>{new Date(pl.createdAt).toLocaleString('vi-VN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Schedules List */}
          <div style={{ marginTop: '40px' }}>
            <h3 style={{ marginBottom: '12px', borderBottom: '2px solid #cbd5e1', paddingBottom: '8px' }}>
              Lịch trình phát sóng (Play Schema - {schedules.length})
            </h3>
            {schedules.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px' }}>
                <h3>Chưa có lịch phát nào</h3>
                <p>Lập lịch trình để tự động cập nhật playlist cho các màn hình quảng cáo.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tên lịch trình</th>
                      <th>Từ ngày</th>
                      <th>Đến ngày</th>
                      <th>Khung giờ</th>
                      <th>Ngày trong tuần</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.map((sc) => (
                      <tr className="table-row" key={sc.id}>
                        <td style={{ fontWeight: 600, color: '#ec4899' }}>{sc.scheduleName}</td>
                        <td>{new Date(sc.startDate).toLocaleDateString('vi-VN')}</td>
                        <td>{new Date(sc.endDate).toLocaleDateString('vi-VN')}</td>
                        <td>{sc.startTime} - {sc.endTime}</td>
                        <td>{sc.dayOfWeek && sc.dayOfWeek.length > 0 ? `Thứ ${sc.dayOfWeek.map((d: number) => d + 1).join(', ')}` : 'Cả tuần'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
