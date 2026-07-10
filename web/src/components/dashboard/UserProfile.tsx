'use client';

import { useDashboard } from '@/app/dashboard/context/DashboardContext';
import { api } from '@/utils/api';
import React, { useState } from 'react';

interface UserProfileProps {
  currentUser: {
    id: string;
    shortId: string;
    username: string;
    email: string;
    role: string;
    licenseLimit: number;
    securityPassword?: string;
  };
  onBack: () => void;
}

export default function UserProfile({ currentUser, onBack }: UserProfileProps) {
  const { setError, setSuccessMsg } = useDashboard();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  const [securityPin, setSecurityPin] = useState(currentUser.securityPassword || '');
  const [pinLoading, setPinLoading] = useState(false);

  const handleUpdateSecurityPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (securityPin && !/^\d{4}$/.test(securityPin)) {
      setError('Mã PIN bảo mật phải chứa đúng 4 chữ số');
      return;
    }

    setPinLoading(true);
    try {
      await api.post('/api/auth/security-password', {
        securityPassword: securityPin || null,
      });
      setSuccessMsg('Cập nhật mã bảo mật thiết bị thành công!');
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi cập nhật mã PIN');
    } finally {
      setPinLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Xác nhận mật khẩu mới không khớp');
      return;
    }

    setPwdLoading(true);
    try {
      await api.post('/api/auth/change-password', {
        oldPassword,
        newPassword,
      });
      setSuccessMsg('Đổi mật khẩu thành công!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi đổi mật khẩu');
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2>Thông tin cá nhân (User Profile)</h2>
        <button onClick={onBack} className="btn-secondary">
          &lt; Quay lại Trang chủ
        </button>
      </div>

      <div className="profile-layout">
        {/* Left Column: User Profile Info */}
        <div className="profile-card">
          <div className="profile-card-header accent-cyan">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            Thông tin tài khoản
          </div>

          <div className="profile-card-body">
            <div className="profile-detail-grid">
              <div className="profile-detail-item">
                <span className="profile-detail-label">Mã User</span>
                <span className="profile-detail-value mono">{currentUser.shortId}</span>
              </div>

              <div className="profile-detail-item">
                <span className="profile-detail-label">User ID (Internal)</span>
                <span className="profile-detail-value mono text-xs">{currentUser.id}</span>
              </div>

              <div className="profile-detail-item">
                <span className="profile-detail-label">Tên đăng nhập</span>
                <span className="profile-detail-value">{currentUser.username}</span>
              </div>

              <div className="profile-detail-item">
                <span className="profile-detail-label">Địa chỉ Email</span>
                <span className="profile-detail-value">{currentUser.email}</span>
              </div>

              <div className="profile-detail-item">
                <span className="profile-detail-label">Quyền hạn hệ thống</span>
                <span className="profile-detail-value" style={{ fontWeight: 'bold', color: 'var(--accent)' }}>
                  {currentUser.role === 'admin' ? 'Administrator' : 'Normal User'}
                </span>
              </div>

              <div className="profile-detail-item">
                <span className="profile-detail-label">Trạng thái hoạt động</span>
                <span className="profile-detail-value">
                  <span className="badge badge-success">Active</span>
                </span>
              </div>

              <div className="profile-detail-item">
                <span className="profile-detail-label">Thời hạn tài khoản</span>
                <span className="profile-detail-value">Vô thời hạn (Lifetime)</span>
              </div>

              <div className="profile-detail-item">
                <span className="profile-detail-label">Giới hạn License</span>
                <span className="profile-detail-value">
                  {currentUser.role === 'admin' ? 'Không giới hạn thiết bị' : `${currentUser.licenseLimit} thiết bị`}
                </span>
              </div>

              <div className="profile-detail-item">
                <span className="profile-detail-label">Tổ chức / Công ty</span>
                <span className="profile-detail-value">Control Digital Media Group</span>
              </div>

              <div className="profile-detail-item">
                <span className="profile-detail-label">Điện thoại</span>
                <span className="profile-detail-value">—</span>
              </div>

              <div className="profile-detail-item">
                <span className="profile-detail-label">Địa chỉ liên hệ</span>
                <span className="profile-detail-value">—</span>
              </div>
            </div>

            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--card-border)' }}>
              <h4 style={{ marginBottom: '8px', fontSize: '0.95rem', fontWeight: 600 }}>Phân quyền &amp; Tổ chức</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--ink-secondary)' }}>
                Tài khoản của bạn được cấp quyền {currentUser.role === 'admin' ? 'SYSTEM ADMIN' : 'USER'} để truy cập và quản lý màn hình thuộc tổ chức Control Digital Media.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Change Password Card */}
        <div className="profile-card">
          <div className="profile-card-header accent-pink">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            Bảo mật &amp; Đổi mật khẩu
          </div>

          <div className="profile-card-body">
            <form onSubmit={handleChangePassword} className="password-form">
              <div className="form-group">
                <label className="form-label">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  className="form-input"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Nhập mật khẩu đang dùng"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mật khẩu mới</label>
                <input
                  type="password"
                  className="form-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  className="form-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-primary password-btn"
                disabled={pwdLoading}
              >
                {pwdLoading ? (
                  <>
                    <span className="spinner spinner-dark"></span>
                    Đang cập nhật...
                  </>
                ) : 'Cập nhật mật khẩu'}
              </button>
            </form>
          </div>
        </div>

        {/* Third Column/Row Card: Device Security PIN Configuration */}
        <div className="profile-card">
          <div className="profile-card-header accent-cyan" style={{ background: 'linear-gradient(135deg, #00b894, #00cec9)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            Mật khẩu bảo mật thiết bị (Security PIN)
          </div>

          <div className="profile-card-body">
            <form onSubmit={handleUpdateSecurityPin} className="password-form">
              <div className="form-group">
                <label className="form-label">Mã PIN bảo mật thiết bị</label>
                <input
                  type="text"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  maxLength={4}
                  className="form-input"
                  value={securityPin}
                  onChange={(e) => setSecurityPin(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Nhập mã PIN 4 chữ số (ví dụ: 8888)"
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--ink-secondary)', marginTop: '6px' }}>
                  Mã PIN này được dùng để bảo vệ mục Cài đặt (Settings) và Mạng (Network) trên các thiết bị Player mà bạn chỉ định.
                </p>
              </div>

              <button
                type="submit"
                className="btn-primary password-btn"
                disabled={pinLoading}
                style={{ backgroundColor: '#00b894' }}
              >
                {pinLoading ? (
                  <>
                    <span className="spinner spinner-dark"></span>
                    Đang lưu...
                  </>
                ) : 'Lưu mã PIN thiết bị'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
