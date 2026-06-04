'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cookieStorage } from '../../utils/cookie';
import { api } from '../../utils/api';
import Link from 'next/link';

interface Device {
  id: string;
  deviceName: string;
  approvalStatus: 'pending' | 'approved';
}

interface MediaItem {
  id: string;
  fileName: string;
}

export default function DashboardHomePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [pendingDevices, setPendingDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHomeData = async (user: any) => {
    setLoading(true);
    setError('');
    try {
      const deviceData = await api.get('/api/devices').catch(() => []);
      setDevices(deviceData || []);

      const mediaData = await api.get('/api/media').catch(() => []);
      setMediaList(mediaData || []);

      if (user.role === 'admin') {
        const pendingData = await api.get('/api/admin/devices/pending').catch(() => []);
        setPendingDevices(pendingData || []);
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải dữ liệu trang chủ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = cookieStorage.getUserInfo();
    const token = cookieStorage.getAccessToken();

    if (!token || !user) {
      router.push('/login');
      return;
    }

    setCurrentUser(user);
    fetchHomeData(user);
  }, [router]);

  if (loading || !currentUser) {
    return (
      <div className="loading-container" style={{ minHeight: '300px' }}>
        <span className="spinner"></span>
        <p>Đang tải dữ liệu trang chủ...</p>
      </div>
    );
  }

  return (
    <div className="homepage-layout">
      {error && (
        <div className="dash-messages" style={{ gridColumn: 'span 2', marginBottom: '10px' }}>
          <div className="alert alert-error">
            <span>{error}</span>
            <button className="alert-dismiss" onClick={() => setError('')}>x</button>
          </div>
        </div>
      )}

      {/* Cột trái: 3 nút lớn + 3 nút phụ */}
      <div className="homepage-main-col">
        <div className="homepage-main-panel">
          <div className="homepage-button-grid">
            <div className="homepage-button-large-wrapper">
              <button onClick={() => router.push('/dashboard/content')} className="btn-3d btn-3d-cyan">
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
              <button onClick={() => router.push('/dashboard/player')} className="btn-3d btn-3d-pink">
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
              <button onClick={() => router.push('/dashboard/player')} className="btn-3d btn-3d-green">
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
            <button onClick={() => router.push(currentUser.role === 'admin' ? '/dashboard/admin' : '/dashboard/profile')} className="btn-sub-tab tab-cyan">
              <div className="sub-tab-dot-arrow">&gt;</div>
              User
            </button>
            <button onClick={() => router.push('/dashboard/resource')} className="btn-sub-tab tab-green">
              <div className="sub-tab-dot-arrow">&gt;</div>
              Resource
            </button>
            <button onClick={() => router.push('/dashboard/resource')} className="btn-sub-tab tab-pink">
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
              <div className="info-item" style={{ cursor: 'pointer' }} onClick={() => router.push('/dashboard/player')}>
                <span className="info-item-icon">&gt;</span>
                <span>Players: </span>
                <span className="info-item-value">{devices.length}</span>
              </div>
              <div className="info-item" style={{ cursor: 'pointer' }} onClick={() => router.push('/dashboard/content')}>
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
                  <Link
                    key={media.id}
                    href="/dashboard/content"
                    className="side-panel-link"
                  >
                    &gt; {media.fileName.length > 20 ? `${media.fileName.substring(0, 20)}...` : media.fileName}
                  </Link>
                ))}
                {mediaList.length === 0 && (
                  <span style={{ color: '#6b7280', fontStyle: 'italic' }}>Chưa có nội dung nào</span>
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
                    <Link
                      key={device.id}
                      href="/dashboard/admin"
                      className="side-panel-link"
                    >
                      &gt; {device.deviceName} (Chờ duyệt)
                    </Link>
                  ))}
                  {pendingDevices.length === 0 && (
                    <span style={{ color: '#6b7280', fontStyle: 'italic' }}>Không có thiết bị chờ duyệt</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
