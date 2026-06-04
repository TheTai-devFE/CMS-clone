'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { cookieStorage } from '../../utils/cookie';
import { api } from '../../utils/api';

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

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  licenseLimit: number;
  status: string;
}

interface MediaItem {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: string;
  mimeType: string;
  checksum: string;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [pendingDevices, setPendingDevices] = useState<Device[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);

  const [activeTab, setActiveTab] = useState<'home' | 'content' | 'player' | 'admin' | 'eventlog' | 'resource'>('home');
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [eventLogs, setEventLogs] = useState<any[]>([]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [selectedDeviceForAssign, setSelectedDeviceForAssign] = useState<string | null>(null);
  const [targetUserIdForAssign, setTargetUserIdForAssign] = useState<string>('');
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  useEffect(() => {
    const savedTheme = localStorage.getItem('dashboard-theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = !isDarkMode;
    setIsDarkMode(nextTheme);
    localStorage.setItem('dashboard-theme', nextTheme ? 'dark' : 'light');
  };

  useEffect(() => {
    const user = cookieStorage.getUserInfo();
    const token = cookieStorage.getAccessToken();

    if (!token || !user) {
      router.push('/login');
      return;
    }

    setCurrentUser(user);
    fetchData(user);
  }, [router]);

  useEffect(() => {
    if (devices.length > 0) {
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
          const mediaName = mediaList.length > 0 ? mediaList[i % mediaList.length].fileName : 'quangcao.mp4';
          detail = `Da phat file: ${mediaName} (Thoi luong: 10s)`;
        } else if (status === 'Online') {
          detail = `Thiet bi khoi dong va ket noi thanh cong. IP: ${dev.ipAddress || '192.168.1.5'}`;
        } else {
          detail = `Thiet bi mat ket noi mang. Chuyen sang che do phat offline.`;
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
        { id: 'log-1', deviceName: 'Man hinh Tang 1', status: 'Online', detail: 'Ket noi thanh cong. IP: 192.168.1.15', time: new Date().toLocaleString('vi-VN') },
        { id: 'log-2', deviceName: 'Man hinh Tang 2', status: 'Heartbeat', detail: 'CPU: 12% | Memory Free: 340MB', time: new Date(Date.now() - 5*60000).toLocaleString('vi-VN') },
        { id: 'log-3', deviceName: 'Man hinh Sanh Chinh', status: 'Playback Success', detail: 'Da phat file: banner_summer.png (Thoi luong: 15s)', time: new Date(Date.now() - 10*60000).toLocaleString('vi-VN') },
      ]);
    }
  }, [devices, mediaList]);

  const fetchData = async (user: any) => {
    setLoading(true);
    setError('');
    try {
      const deviceData = await api.get('/api/devices');
      setDevices(deviceData);

      const mediaData = await api.get('/api/media');
      setMediaList(mediaData);

      try {
        const playlistData = await api.get('/api/playlists');
        setPlaylists(playlistData || []);
      } catch (err) {
        console.warn('Loi tai playlist:', err);
      }

      try {
        const scheduleData = await api.get('/api/schedules');
        setSchedules(scheduleData || []);
      } catch (err) {
        console.warn('Loi tai schedule:', err);
      }

      if (user.role === 'admin') {
        const pendingData = await api.get('/api/admin/devices/pending');
        setPendingDevices(pendingData);

        const usersData = await api.get('/api/auth/users');
        setUsers(usersData);
      }
    } catch (err: any) {
      setError(err.message || 'Loi khi tai du lieu he thong');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    cookieStorage.clearAll();
    router.push('/login');
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const isValidType = file.type.startsWith('image/') || file.type === 'video/mp4';
    if (!isValidType) {
      setError('Chi cho phep tai len file anh (.png, .jpg, .jpeg) hoac video (.mp4)');
      return;
    }

    setUploading(true);
    setError('');
    setSuccessMsg('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/api/media/upload', formData, { useMultipart: true });
      setSuccessMsg(`Tai len tep thanh cong: ${file.name}`);

      const mediaData = await api.get('/api/media');
      setMediaList(mediaData);
    } catch (err: any) {
      setError(err.message || 'Khong the upload file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteMedia = async (id: string, name: string) => {
    if (!confirm(`Ban co chac chan muon xoa file: ${name}?`)) return;

    setError('');
    setSuccessMsg('');
    try {
      await api.delete(`/api/media/${id}`);
      setSuccessMsg('Da xoa tep tin thanh cong');

      const mediaData = await api.get('/api/media');
      setMediaList(mediaData);
    } catch (err: any) {
      setError(err.message || 'Khong the xoa tep');
    }
  };

  const handleDeleteDevice = async (id: string, name: string) => {
    if (!confirm(`Ban co chac chan muon xoa thiet bi: ${name}?`)) return;

    setError('');
    setSuccessMsg('');
    try {
      await api.delete(`/api/devices/${id}`);
      setSuccessMsg('Da xoa thiet bi thanh cong');

      if (currentUser) fetchData(currentUser);
    } catch (err: any) {
      setError(err.message || 'Khong the xoa thiet bi');
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

      if (currentUser) fetchData(currentUser);
    } catch (err: any) {
      setError(err.message || 'Co loi xay ra khi gan thiet bi');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenAssignModal = (deviceId: string) => {
    setSelectedDeviceForAssign(deviceId);
    if (users.length > 0) {
      setTargetUserIdForAssign(users[0].id);
    }
  };

  const formatBytes = (bytes: string | number, decimals = 2) => {
    const b = Number(bytes);
    if (b === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return parseFloat((b / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  if (!currentUser) return null;

  return (
    <div className={`dashboard ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>
      {/* ====== HEADER VINTAGE ====== */}
      <header className="dash-header-vintage">
        <div className="vintage-logo" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/Logo-CDM-transparent.png" alt="CDM Logo" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} />
          <span>Control Digital Media</span>
        </div>
        <div className="vintage-user-info">
          <span>Welcome: <span className="vintage-welcome-link">{currentUser.username}</span></span>
          <span className="badge badge-admin" style={isDarkMode ? { background: 'linear-gradient(180deg, #ec4899 0%, #db2777 100%)', color: 'white', border: 'none', fontWeight: 'bold' } : { background: '#ede9fe', color: '#7c3aed', border: '1px solid #ddd6fe', fontWeight: 'bold' }}>
            {currentUser.role === 'admin' ? 'SYSTEM ADMIN' : 'USER'}
          </span>
          <button onClick={toggleTheme} className="theme-toggle-btn" aria-label="Toggle Theme" style={{ padding: '6px 8px' }}>
            {isDarkMode ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
          <button onClick={handleLogout} className="btn-secondary dash-logout" style={isDarkMode ? { padding: '6px 12px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'rgba(255,255,255,0.2)' } : { padding: '6px 12px', fontSize: '0.8rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Dang xuat
          </button>
        </div>
      </header>

      {/* ====== HORIZONTAL NAV BAR ====== */}
      <div className="dash-nav-horizontal">
        <button
          onClick={() => setActiveTab('home')}
          className={`nav-item-horiz ${activeTab === 'home' ? 'active' : ''}`}
        >
          Home
        </button>
        <button
          onClick={() => setActiveTab('content')}
          className={`nav-item-horiz ${activeTab === 'content' ? 'active' : ''}`}
        >
          Content
        </button>
        <button
          onClick={() => setActiveTab('player')}
          className={`nav-item-horiz ${activeTab === 'player' ? 'active' : ''}`}
        >
          Player
        </button>
        {currentUser.role === 'admin' && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`nav-item-horiz ${activeTab === 'admin' ? 'active' : ''}`}
          >
            Admin
          </button>
        )}
        <button
          onClick={() => setActiveTab('eventlog')}
          className={`nav-item-horiz ${activeTab === 'eventlog' ? 'active' : ''}`}
        >
          Event Log
        </button>
        <button
          onClick={() => setActiveTab('resource')}
          className={`nav-item-horiz ${activeTab === 'resource' ? 'active' : ''}`}
        >
          Resource
        </button>
      </div>

      {/* ====== MAIN WORKSPACE ====== */}
      <div className="homepage-container">
        <div className="homepage-workspace">
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

          {loading ? (
            <div className="loading-container" style={{ minHeight: '400px' }}>
              <span className="spinner"></span>
              <p>Dang tai du lieu he thong...</p>
            </div>
          ) : (
            <>
              {/* ====== TAB: HOME ====== */}
              {activeTab === 'home' && (
                <div className="homepage-layout">
                  {/* Cột trái: 3 nút lớn + 3 nút phụ */}
                  <div className="homepage-main-col">
                    <div className="homepage-main-panel">
                      <div className="homepage-button-grid">
                        <div className="homepage-button-large-wrapper">
                          <button onClick={() => setActiveTab('content')} className="btn-3d btn-3d-cyan">
                            <div className="btn-3d-title-group">
                              <div className="btn-3d-dot">
                                <div className="btn-3d-dot-arrow"></div>
                              </div>
                              <span className="btn-3d-text">New Content</span>
                            </div>
                            <div className="btn-3d-icon-container">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%' }}>
                                <circle cx="12" cy="12" r="10" />
                                <circle cx="12" cy="12" r="3" />
                                <path d="M12 2a10 10 0 0 1 10 10" />
                              </svg>
                            </div>
                          </button>
                        </div>

                        <div className="homepage-button-large-wrapper">
                          <button onClick={() => setActiveTab('player')} className="btn-3d btn-3d-pink">
                            <div className="btn-3d-title-group">
                              <div className="btn-3d-dot">
                                <div className="btn-3d-dot-arrow"></div>
                              </div>
                              <span className="btn-3d-text">Player Information</span>
                            </div>
                            <div className="btn-3d-icon-container">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%' }}>
                                <circle cx="12" cy="12" r="10" />
                                <line x1="2" y1="12" x2="22" y2="12" />
                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                              </svg>
                            </div>
                          </button>
                        </div>

                        <div className="homepage-button-large-wrapper full-width">
                          <button onClick={() => setActiveTab('player')} className="btn-3d btn-3d-green">
                            <div className="btn-3d-title-group">
                              <div className="btn-3d-dot">
                                <div className="btn-3d-dot-arrow"></div>
                              </div>
                              <span className="btn-3d-text">Player Monitoring</span>
                            </div>
                            <div className="btn-3d-icon-container">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%' }}>
                                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                                <line x1="8" y1="21" x2="16" y2="21" />
                                <line x1="12" y1="17" x2="12" y2="21" />
                                <circle cx="12" cy="9" r="3" />
                                <line x1="14.2" y1="11.2" x2="17" y2="14" />
                              </svg>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Hàng nút phụ phía dưới */}
                      <div className="homepage-sub-tabs">
                        <button onClick={() => setActiveTab('admin')} className="btn-sub-tab tab-cyan">
                          <div className="sub-tab-dot-arrow">&gt;</div>
                          User
                        </button>
                        <button onClick={() => setActiveTab('resource')} className="btn-sub-tab tab-green">
                          <div className="sub-tab-dot-arrow">&gt;</div>
                          Resource
                        </button>
                        <button onClick={() => setActiveTab('resource')} className="btn-sub-tab tab-pink">
                          <div className="sub-tab-dot-arrow">&gt;</div>
                          Play Schema
                        </button>
                        <div className="btn-sub-tab tab-orange" style={{ cursor: 'default', background: 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)', opacity: 0.7 }}>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cột phải: Basic Info, New Content, To Be Reviewed */}
                  <div className="homepage-side-col">
                    <div className="homepage-side-panel">
                      {/* Section: Basic Info */}
                      <div className="side-panel-section">
                        <div className="side-panel-header">Basic Info</div>
                        <div className="side-panel-body">
                          <div className="info-item">
                            <span className="info-item-icon">&gt;</span>
                            <span>Players: </span>
                            <span className="info-item-value">{devices.length}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-item-icon">&gt;</span>
                            <span>Contents: </span>
                            <span className="info-item-value">{mediaList.length}</span>
                          </div>
                        </div>
                      </div>

                      {/* Section: New Content */}
                      <div className="side-panel-section">
                        <div className="side-panel-header">New Content</div>
                        <div className="side-panel-body">
                          <div className="side-panel-link-list">
                            {mediaList.slice(0, 5).map((media) => (
                              <a
                                key={media.id}
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setActiveTab('content');
                                }}
                                className="side-panel-link"
                              >
                                &gt; {media.fileName.length > 20 ? `${media.fileName.substring(0, 20)}...` : media.fileName}
                              </a>
                            ))}
                            {mediaList.length === 0 && (
                              <span style={{ color: '#6b7280', fontStyle: 'italic' }}>Chua co noi dung nao</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Section: To Be Reviewed */}
                      {currentUser.role === 'admin' && (
                        <div className="side-panel-section">
                          <div className="side-panel-header">To Be Reviewed</div>
                          <div className="side-panel-body">
                            <div className="side-panel-link-list">
                              {pendingDevices.slice(0, 5).map((device) => (
                                <a
                                  key={device.id}
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setActiveTab('admin');
                                  }}
                                  className="side-panel-link"
                                >
                                  &gt; {device.deviceName} (Cho duyet)
                                </a>
                              ))}
                              {pendingDevices.length === 0 && (
                                <span style={{ color: '#6b7280', fontStyle: 'italic' }}>Khong co thiet bi cho duyet</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ====== TAB: CONTENT (MEDIA) ====== */}
              {activeTab === 'content' && (
                <div className="tab-content">
                  <div className="tab-header">
                    <h2>Thu vien anh va video</h2>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*,video/mp4"
                        style={{ display: 'none' }}
                      />
                      <button onClick={handleUploadClick} className="btn-primary" disabled={uploading}>
                        {uploading ? (
                          <>
                            <span className="spinner spinner-dark"></span>
                            Dang tai len...
                          </>
                        ) : (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                              <polyline points="17 8 12 3 7 8"></polyline>
                              <line x1="12" y1="3" x2="12" y2="15"></line>
                            </svg>
                            Tai len
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {mediaList.length === 0 ? (
                    <div className="empty-state">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                      </svg>
                      <h3>Thu vien trong</h3>
                      <p>Click nut &quot;Tai len&quot; de luu tru hinh anh hoac video quang cao.</p>
                    </div>
                  ) : (
                    <div className="media-grid">
                      {mediaList.map((media) => {
                        const isVideo = media.mimeType.startsWith('video/');
                        return (
                          <div className="media-card" key={media.id}>
                            <div
                              className="media-thumb"
                              onClick={() => {
                                  if (isVideo) {
                                    setPreviewVideoUrl(`${API_BASE_URL}${media.fileUrl}`);
                                  }
                                }}
                            >
                              {isVideo ? (
                                <div className="media-video-overlay">
                                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--accent)' }}>
                                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                  </svg>
                                  <span className="media-video-label">Phat video</span>
                                </div>
                              ) : (
                                <img
                                  src={`${API_BASE_URL}${media.fileUrl}`}
                                  alt={media.fileName}
                                />
                              )}
                            </div>
                            <div className="media-info">
                              <h4 className="media-name" title={media.fileName}>
                                {media.fileName}
                              </h4>
                              <p className="media-meta">
                                {formatBytes(media.fileSize)} | {isVideo ? 'VIDEO' : 'IMAGE'}
                              </p>
                              <p className="media-meta text-mono" title={media.checksum}>
                                {media.checksum.substring(0, 16)}...
                              </p>
                            </div>
                            <div className="media-footer">
                              <button
                                onClick={() => handleDeleteMedia(media.id, media.fileName)}
                                className="btn-danger"
                              >
                                Xoa
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ====== TAB: PLAYER (DEVICES) ====== */}
              {activeTab === 'player' && (
                <div className="tab-content">
                  <div className="tab-header">
                    <h2>Danh sach man hinh quang cao</h2>
                    <button onClick={() => fetchData(currentUser)} className="btn-secondary">
                      Lam moi
                    </button>
                  </div>

                  {devices.length === 0 ? (
                    <div className="empty-state">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                        <line x1="8" y1="21" x2="16" y2="21"></line>
                        <line x1="12" y1="17" x2="12" y2="21"></line>
                      </svg>
                      <h3>Chua co thiet bi nao</h3>
                      <p>Dang ky thiet bi moi tu ung dung Android Player. Admin se duyet va gan thiet bi cho ban.</p>
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
                              <span className="device-info-label">Trang thai</span>
                              <span className={device.approvalStatus === 'approved' ? 'badge badge-success' : 'badge badge-warning'}>
                                {device.approvalStatus === 'approved' ? 'Da duyet' : 'Cho duyet'}
                              </span>
                            </div>
                            <div className="device-info-row">
                              <span className="device-info-label">IP</span>
                              <span className="device-info-value">{device.ipAddress || '—'}</span>
                            </div>
                            <div className="device-info-row">
                              <span className="device-info-label">Do phan giai</span>
                              <span className="device-info-value">{device.screenResolution || '—'}</span>
                            </div>
                            <div className="device-info-row">
                              <span className="device-info-label">He dieu hanh</span>
                              <span className="device-info-value">{device.osVersion || '—'}</span>
                            </div>
                            {currentUser.role === 'admin' && device.userId && (
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
                              Xoa thiet bi
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ====== TAB: ADMIN ====== */}
              {activeTab === 'admin' && currentUser.role === 'admin' && (
                <div className="tab-content">
                  <div className="tab-header">
                    <h2>Duyet thiet bi cho lien ket</h2>
                  </div>

                  {pendingDevices.length === 0 ? (
                    <div className="empty-state">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                      <h3>Khong co thiet bi cho duyet</h3>
                      <p>Tat ca thiet bi da duoc gan hoac chua co man hinh nao dang ky moi.</p>
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
                            Phe duyet
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* User License Table */}
                  <div style={{ marginTop: '40px' }}>
                    <div className="tab-header">
                      <h2>Han muc License cua cac User</h2>
                    </div>
                    <div className="table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Quyen han</th>
                            <th>Han muc</th>
                            <th>Trang thai</th>
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
                              <td>{u.role === 'admin' ? 'Khong gioi han' : `${u.licenseLimit} thiet bi`}</td>
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
                </div>
              )}

              {/* ====== TAB: EVENT LOG ====== */}
              {activeTab === 'eventlog' && (
                <div className="tab-content">
                  <div className="tab-header">
                    <h2>Nhat ky hoat dong thiet bi (Event Log)</h2>
                    <button onClick={() => fetchData(currentUser)} className="btn-secondary">
                      Lam moi log
                    </button>
                  </div>

                  <div className="table-container" style={{ marginTop: '20px' }}>
                    <table className="event-log-table">
                      <thead>
                        <tr>
                          <th>Thoi gian</th>
                          <th>Ten thiet bi</th>
                          <th>Hanh dong / Trang thai</th>
                          <th>Chi tiet su kien</th>
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
                              Khong co nhat ky su kien nao
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ====== TAB: RESOURCE ====== */}
              {activeTab === 'resource' && (
                <div className="tab-content">
                  <div className="tab-header">
                    <h2>Quan ly tai nguyen & Lich phat (Play Schema)</h2>
                    <button onClick={() => fetchData(currentUser)} className="btn-secondary">
                      Lam moi tai nguyen
                    </button>
                  </div>

                  {/* Playlists List */}
                  <div style={{ marginTop: '20px' }}>
                    <h3 style={{ marginBottom: '12px', borderBottom: '2px solid #cbd5e1', paddingBottom: '8px' }}>Playlists ({playlists.length})</h3>
                    {playlists.length === 0 ? (
                      <div className="empty-state" style={{ padding: '30px' }}>
                        <h3>Chua co Playlist nao</h3>
                        <p>Tao playlist phat song tu API backend de quan ly trinh chieu.</p>
                      </div>
                    ) : (
                      <div className="table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Ten Playlist</th>
                              <th>Mo ta</th>
                              <th>Kieu dong bo</th>
                              <th>Ngay tao</th>
                            </tr>
                          </thead>
                          <tbody>
                            {playlists.map((pl) => (
                              <tr className="table-row" key={pl.id}>
                                <td style={{ fontWeight: 600, color: '#0ea5e9' }}>{pl.playlistName}</td>
                                <td>{pl.description || '—'}</td>
                                <td>{pl.isSyncGroup ? 'Dong bo nhom' : 'Don le'}</td>
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
                    <h3 style={{ marginBottom: '12px', borderBottom: '2px solid #cbd5e1', paddingBottom: '8px' }}>Lich trinh phat song (Play Schema - {schedules.length})</h3>
                    {schedules.length === 0 ? (
                      <div className="empty-state" style={{ padding: '30px' }}>
                        <h3>Chua co lich phat nao</h3>
                        <p>Lap lich trinh de tu dong cap nhat playlist cho cac man hinh quang cao.</p>
                      </div>
                    ) : (
                      <div className="table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Ten lich trinh</th>
                              <th>Tu ngay</th>
                              <th>Den ngay</th>
                              <th>Khung gio</th>
                              <th>Ngay trong tuan</th>
                            </tr>
                          </thead>
                          <tbody>
                            {schedules.map((sc) => (
                              <tr className="table-row" key={sc.id}>
                                <td style={{ fontWeight: 600, color: '#ec4899' }}>{sc.scheduleName}</td>
                                <td>{new Date(sc.startDate).toLocaleDateString('vi-VN')}</td>
                                <td>{new Date(sc.endDate).toLocaleDateString('vi-VN')}</td>
                                <td>{sc.startTime} - {sc.endTime}</td>
                                <td>{sc.dayOfWeek && sc.dayOfWeek.length > 0 ? `Thu ${sc.dayOfWeek.map((d: number) => d + 1).join(', ')}` : 'Ca tuan'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ====== ASSIGN DEVICE MODAL ====== */}
      {selectedDeviceForAssign && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Duyet va gan thiet bi</h3>
              <button className="modal-close" onClick={() => setSelectedDeviceForAssign(null)}>x</button>
            </div>
            <p className="modal-desc">
              Chon tai khoan khach hang de lien ket thiet bi. He thong se tu dong doi chieu voi han muc license con lai.
            </p>

            <form onSubmit={handleAssignDevice} className="modal-form">
              <div className="form-group">
                <label className="form-label">Chon tai khoan User</label>
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
                    <option disabled value="">Khong co user thuong nao</option>
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
                  Huy
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={actionLoading || users.filter((u) => u.role !== 'admin').length === 0}
                >
                  {actionLoading ? <span className="spinner spinner-dark"></span> : 'Xac nhan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====== VIDEO PREVIEW MODAL ====== */}
      {previewVideoUrl && (
        <div className="modal-overlay" onClick={() => setPreviewVideoUrl(null)}>
          <div
            className="modal-content modal-content-wide"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Xem truoc video</h3>
              <button className="modal-close" onClick={() => setPreviewVideoUrl(null)}>x</button>
            </div>
            <div className="video-container">
              <video src={previewVideoUrl} controls autoPlay />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
