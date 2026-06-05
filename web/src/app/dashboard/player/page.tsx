'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../utils/api';
import { cookieStorage } from '../../../utils/cookie';

interface Device {
  id: string;
  deviceName: string;
  apiKey: string;
  status: 'online' | 'offline';
  approvalStatus: 'approved' | 'pending';
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

  // Filter & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');

  // Selection States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Link Device States
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkPairingCode, setLinkPairingCode] = useState('');
  const [linkDeviceName, setLinkDeviceName] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState('');

  const fetchDevices = async () => {
    setLoading(true);
    setError('');
    try {
      const deviceData = await api.get('/api/devices');
      setDevices(deviceData || []);
      setSelectedIds([]); // Clear selection on reload
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
      setSuccessMsg(`Đã xóa thiết bị "${name}" thành công`);
      await fetchDevices();
    } catch (err: any) {
      setError(err.message || 'Không thể xóa thiết bị');
    }
  };

  const handleLinkDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkPairingCode || !linkDeviceName) {
      setLinkError('Vui lòng điền đầy đủ thông tin');
      return;
    }
    
    setLinkLoading(true);
    setLinkError('');
    try {
      await api.post('/api/devices/claim', {
        pairingCode: linkPairingCode.trim(),
        deviceName: linkDeviceName.trim(),
      });
      setSuccessMsg('Đã liên kết thiết bị thành công');
      setShowLinkModal(false);
      setLinkPairingCode('');
      setLinkDeviceName('');
      await fetchDevices();
    } catch (err: any) {
      setLinkError(err.message || 'Lỗi khi liên kết thiết bị. Vui lòng kiểm tra lại mã.');
    } finally {
      setLinkLoading(false);
    }
  };

  // Selection Helpers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const filteredIds = filteredDevices.map(d => d.id);
      setSelectedIds(filteredIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Mock batch actions
  const handleBatchAction = (action: string) => {
    alert(`Đã gửi yêu cầu [${action}] cho ${selectedIds.length} màn hình được chọn thành công!`);
    setSelectedIds([]);
  };

  const handleBatchDelete = async () => {
    if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} thiết bị đã chọn?`)) return;
    
    setLoading(true);
    setError('');
    setSuccessMsg('');
    let successCount = 0;
    
    for (const id of selectedIds) {
      try {
        await api.delete(`/api/devices/${id}`);
        successCount++;
      } catch (err) {
        console.error(`Không thể xóa thiết bị ID ${id}`);
      }
    }
    
    setSuccessMsg(`Đã xóa thành công ${successCount}/${selectedIds.length} thiết bị`);
    setSelectedIds([]);
    await fetchDevices();
  };

  // Filters calculation
  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          device.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (device.ipAddress && device.ipAddress.includes(searchTerm));
    
    const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'online' && device.status === 'online') ||
                          (statusFilter === 'offline' && device.status === 'offline');
    
    return matchesSearch && matchesStatus;
  });

  const totalDevices = devices.length;
  const onlineDevices = devices.filter(d => d.status === 'online').length;
  const offlineDevices = devices.filter(d => d.status === 'offline').length;

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="player-monitor-container">
      {/* Dynamic CSS Stylesheet injection */}
      <style>{`
        .player-monitor-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
          color: var(--text-color);
          width: 100%;
          max-width: 1600px;
          margin: 0 auto;
          position: relative;
        }

        /* 1. STATS WIDGETS */
        .stats-widgets-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
        }
        .stats-card-premium {
          background: var(--panel-bg);
          border: 1px solid var(--panel-border);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          position: relative;
          overflow: hidden;
        }
        .stats-card-premium::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background: var(--border-color);
        }
        .stats-card-premium.accent-emerald::before {
          background: var(--success);
        }
        .stats-card-premium.accent-amber::before {
          background: var(--warning);
        }
        .stats-icon-bg {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: var(--hover-bg);
          display: flex;
          align-items: center;
          justifyContent: center;
          font-size: 20px;
        }
        .stats-details {
          display: flex;
          flex-direction: column;
        }
        .stats-label {
          font-size: 11px;
          font-weight: 700;
          color: var(--ink-secondary);
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .stats-number {
          font-size: 28px;
          font-weight: 800;
          color: var(--text-color);
          line-height: 1.2;
          margin-top: 4px;
          font-family: var(--font-mono);
        }

        /* 2. FILTER & ACTION HEADER */
        .filter-actions-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
          background: var(--panel-bg);
          padding: 16px 20px;
          border-radius: 12px;
          border: 1px solid var(--panel-border);
        }
        .filter-group-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          flex: 1;
          min-width: 300px;
        }
        .search-input-wrapper {
          position: relative;
          flex: 1;
          max-width: 360px;
          min-width: 200px;
        }
        .search-icon-svg {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--ink-secondary);
          pointer-events: none;
        }
        .search-input-premium {
          width: 100%;
          height: 40px;
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 0 16px 0 40px;
          color: var(--text-color);
          font-size: 14px;
          outline: none;
          transition: all 0.2s;
        }
        .search-input-premium:focus {
          border-color: var(--accent);
        }
        .select-filter-premium {
          height: 40px;
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 0 16px;
          color: var(--text-color);
          font-size: 14px;
          outline: none;
          cursor: pointer;
          min-width: 160px;
          transition: all 0.2s;
        }
        .select-filter-premium:focus {
          border-color: var(--accent);
        }
        .action-group-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        /* 3. PREMIUM TABLE EXOTIC */
        .table-wrapper-premium {
          background: var(--workspace-bg);
          border-radius: 16px;
          border: 1px solid var(--border-color);
          overflow: hidden;
        }
        .event-log-table th {
          background: var(--panel-bg);
          color: var(--ink-secondary);
          border-bottom: 1.5px solid var(--border-color);
        }
        .event-log-table td {
          color: var(--text-color);
          border-bottom: 1px solid var(--border-color);
          vertical-align: middle;
        }
        .table-row-premium {
          transition: background 0.15s ease;
        }
        .table-row-premium:hover {
          background: var(--hover-bg);
        }
        .table-row-premium.selected {
          background: var(--accent-subtle);
        }

        /* 4. CUSTOM CHECKBOX */
        .custom-checkbox-container {
          display: inline-flex;
          align-items: center;
          cursor: pointer;
        }
        .custom-checkbox-premium {
          appearance: none;
          width: 18px;
          height: 18px;
          border: 1.5px solid var(--border-color);
          border-radius: 4px;
          outline: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justifyContent: center;
          transition: all 0.15s;
          background: var(--card-bg);
        }
        .custom-checkbox-premium:checked {
          background: var(--accent);
          border-color: var(--accent);
        }
        .custom-checkbox-premium:checked::after {
          content: '✓';
          color: var(--ink-inverse);
          font-size: 11px;
          font-weight: bold;
        }

        /* 5. USER DETAILS & BADGES */
        .player-info-cell {
          display: flex;
          flex-direction: column;
        }
        .player-primary-name {
          font-weight: 600;
          color: var(--text-color);
          font-size: 14px;
        }
        .player-secondary-id {
          font-size: 11px;
          color: var(--ink-secondary);
          font-family: var(--font-mono);
          margin-top: 2px;
        }
        .status-pill-premium {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 600;
        }
        .status-pill-premium.online {
          background: rgba(5, 150, 105, 0.08);
          border: 1px solid rgba(5, 150, 105, 0.2);
          color: var(--success);
        }
        .status-pill-premium.offline {
          background: rgba(234, 88, 12, 0.08);
          border: 1px solid rgba(234, 88, 12, 0.2);
          color: var(--warning);
        }
        .status-dot-pulse {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }
        .status-pill-premium.online .status-dot-pulse {
          animation: pulse-emerald 2s infinite;
        }
        .mono-cell {
          font-family: var(--font-mono);
          font-size: 13px;
          color: var(--text-color);
          opacity: 0.85;
        }

        /* 6. BATCH ACTIONS BAR */
        .batch-actions-floating-bar {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%) translateY(100px);
          background: var(--header-bg);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 14px 28px;
          display: flex;
          align-items: center;
          gap: 24px;
          box-shadow: var(--shadow-lg);
          z-index: 99;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          backdrop-filter: blur(20px);
        }
        .batch-actions-floating-bar.active {
          transform: translateX(-50%) translateY(0);
        }
        .batch-selected-count {
          font-size: 13px;
          font-weight: 700;
          color: var(--accent);
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .batch-btn-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .btn-batch-action {
          height: 36px;
          padding: 0 14px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          background: var(--card-bg);
          color: var(--text-color);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.15s;
        }
        .btn-batch-action:hover {
          background: var(--hover-bg);
        }
        .btn-batch-action.btn-batch-danger {
          background: rgba(225, 29, 72, 0.08);
          border-color: rgba(225, 29, 72, 0.2);
          color: var(--error);
        }
        .btn-batch-action.btn-batch-danger:hover {
          background: rgba(225, 29, 72, 0.15);
        }

        /* 7. QUICK ACTIONS */
        .btn-quick-delete {
          background: transparent;
          border: none;
          color: var(--ink-secondary);
          cursor: pointer;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justifyContent: center;
          transition: all 0.15s;
        }
        .table-row-premium:hover .btn-quick-delete {
          color: var(--error);
          background: rgba(225, 29, 72, 0.08);
        }
        .btn-quick-delete:hover {
          color: var(--ink-inverse) !important;
          background: var(--error) !important;
        }

        /* Animations */
        @keyframes pulse-emerald {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
      `}</style>

      {/* Message Notifications */}
      {(error || successMsg) && (
        <div className="dash-messages" style={{ marginBottom: '0px' }}>
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

      {/* Stats Widgets Layer */}
      <div className="stats-widgets-row">
        <div className="stats-card-premium">
          <div className="stats-icon-bg">🖥️</div>
          <div className="stats-details">
            <span className="stats-label">TỔNG MÀN HÌNH</span>
            <span className="stats-number">{totalDevices}</span>
          </div>
        </div>

        <div className="stats-card-premium accent-emerald">
          <div className="stats-icon-bg">🟢</div>
          <div className="stats-details">
            <span className="stats-label">ĐANG ONLINE</span>
            <span className="stats-number">{onlineDevices}</span>
          </div>
        </div>

        <div className="stats-card-premium accent-amber">
          <div className="stats-icon-bg">🟡</div>
          <div className="stats-details">
            <span className="stats-label">ĐANG OFFLINE</span>
            <span className="stats-number">{offlineDevices}</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="filter-actions-bar">
        <div className="filter-group-left">
          <div className="search-input-wrapper">
            <svg className="search-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              className="search-input-premium"
              placeholder="Tìm tên, ID hoặc IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="select-filter-premium"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>
        </div>

        <div className="action-group-right">
          <button 
            onClick={() => setShowLinkModal(true)} 
            className="btn-primary" 
            style={{ 
              height: '40px',
              padding: '0 20px', 
              borderRadius: '8px', 
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Liên kết thiết bị mới
          </button>
          <button 
            onClick={fetchDevices} 
            className="btn-secondary"
            style={{ height: '40px', padding: '0 16px', borderRadius: '8px' }}
          >
            Làm mới
          </button>
        </div>
      </div>

      {/* Main Table Workspace */}
      <div className="table-wrapper-premium">
        {loading ? (
          <div className="loading-container" style={{ minHeight: '300px' }}>
            <span className="spinner"></span>
            <p>Đang tải danh sách thiết bị...</p>
          </div>
        ) : filteredDevices.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px 20px' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
            <h3 style={{ marginTop: '16px', fontSize: '18px', color: 'var(--text-color)' }}>Không tìm thấy màn hình nào</h3>
            <p style={{ color: 'var(--ink-secondary)', marginTop: '8px' }}>Thử thay đổi bộ lọc hoặc liên kết màn hình mới bằng mã Pairing Code.</p>
          </div>
        ) : (
          <table className="event-log-table">
            <thead>
              <tr>
                <th style={{ width: '40px', paddingLeft: '18px' }}>
                  <label className="custom-checkbox-container">
                    <input
                      type="checkbox"
                      className="custom-checkbox-premium"
                      checked={selectedIds.length > 0 && selectedIds.length === filteredDevices.length}
                      onChange={handleSelectAll}
                    />
                  </label>
                </th>
                <th>Tên & ID Màn Hình</th>
                <th>Trạng Thái</th>
                <th>Địa Chỉ IP</th>
                <th>Độ Phân Giải</th>
                <th>Hệ Điều Hành</th>
                <th>Cập Nhật Lần Cuối</th>
                <th style={{ width: '60px', textAlign: 'center' }}>Tác Vụ</th>
              </tr>
            </thead>
            <tbody>
              {filteredDevices.map((device) => {
                const isSelected = selectedIds.includes(device.id);
                return (
                  <tr 
                    key={device.id} 
                    className={`table-row-premium ${isSelected ? 'selected' : ''}`}
                  >
                    <td style={{ paddingLeft: '18px' }}>
                      <label className="custom-checkbox-container">
                        <input
                          type="checkbox"
                          className="custom-checkbox-premium"
                          checked={isSelected}
                          onChange={() => handleSelectOne(device.id)}
                        />
                      </label>
                    </td>
                    <td>
                      <div className="player-info-cell">
                        <span className="player-primary-name">{device.deviceName}</span>
                        <span className="player-secondary-id">{device.id}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-pill-premium ${device.status === 'online' ? 'online' : 'offline'}`}>
                        <span className="status-dot-pulse" />
                        {device.status === 'online' ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td className="mono-cell">{device.ipAddress || '—'}</td>
                    <td className="mono-cell">{device.screenResolution || '—'}</td>
                    <td className="mono-cell">{device.osVersion || '—'}</td>
                    <td className="mono-cell">{formatDate(device.lastHeartbeat)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => handleDeleteDevice(device.id, device.deviceName)}
                        className="btn-quick-delete"
                        title="Xóa thiết bị"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Floating Action Bar for Batch Selection */}
      <div className={`batch-actions-floating-bar ${selectedIds.length > 0 ? 'active' : ''}`}>
        <span className="batch-selected-count">Đã chọn {selectedIds.length} thiết bị</span>
        <div className="batch-btn-group">
          <button onClick={() => handleBatchAction('Reboot')} className="btn-batch-action">
            ⚡ Reboot
          </button>
          <button onClick={() => handleBatchAction('Volume')} className="btn-batch-action">
            🔊 Volume
          </button>
          <button onClick={() => handleBatchAction('Install APK')} className="btn-batch-action">
            📥 Install APK
          </button>
          <button onClick={handleBatchDelete} className="btn-batch-action btn-batch-danger">
            🗑️ Xóa đã chọn
          </button>
        </div>
      </div>

      {/* Link Device Modal */}
      {showLinkModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'var(--card-bg)',
            borderRadius: '16px',
            padding: '32px',
            width: '100%',
            maxWidth: '440px',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--border-color)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-color)', margin: 0 }}>Liên kết thiết bị mới</h3>
              <button 
                onClick={() => { setShowLinkModal(false); setLinkError(''); }} 
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--ink-secondary)' }}
              >
                ✕
              </button>
            </div>

            {linkError && (
              <div className="alert alert-error" style={{ marginBottom: '16px', padding: '12px' }}>
                <span>{linkError}</span>
              </div>
            )}

            <form onSubmit={handleLinkDevice}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--ink-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Mã liên kết (6 chữ số)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={linkPairingCode}
                  onChange={(e) => setLinkPairingCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="VD: 182943"
                  style={{
                    width: '100%',
                    height: '48px',
                    padding: '0 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--canvas-bg)',
                    fontSize: '16px',
                    color: 'var(--text-color)',
                    fontFamily: 'var(--font-mono)',
                    outline: 'none',
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '28px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--ink-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Tên thiết bị
                </label>
                <input
                  type="text"
                  value={linkDeviceName}
                  onChange={(e) => setLinkDeviceName(e.target.value)}
                  placeholder="VD: Màn hình sảnh chính"
                  style={{
                    width: '100%',
                    height: '48px',
                    padding: '0 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--canvas-bg)',
                    fontSize: '15px',
                    color: 'var(--text-color)',
                    outline: 'none',
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => { setShowLinkModal(false); setLinkError(''); }}
                  className="btn-secondary"
                  style={{ height: '44px', padding: '0 20px', cursor: 'pointer', borderRadius: '8px' }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={linkLoading}
                  className="btn-primary"
                  style={{
                    height: '44px',
                    padding: '0 24px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {linkLoading ? <span className="spinner" style={{ width: '16px', height: '16px', margin: 0 }}></span> : 'Liên kết thiết bị'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

