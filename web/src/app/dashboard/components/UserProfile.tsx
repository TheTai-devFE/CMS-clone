'use client';

import React, { useState } from 'react';
import { api } from '../../../utils/api';

interface UserProfileProps {
  currentUser: {
    id: string;
    username: string;
    email: string;
    role: string;
    licenseLimit: number;
  };
  onBack: () => void;
}

export default function UserProfile({ currentUser, onBack }: UserProfileProps) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (newPassword.length < 6) {
      setPwdError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdError('Xác nhận mật khẩu mới không khớp');
      return;
    }

    setPwdLoading(true);
    try {
      await api.post('/api/auth/change-password', {
        oldPassword,
        newPassword,
      });
      setPwdSuccess('Đổi mật khẩu thành công!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwdError(err.message || 'Có lỗi xảy ra khi đổi mật khẩu');
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
                <span className="profile-detail-label">User ID (UUID)</span>
                <span className="profile-detail-value mono">{currentUser.id}</span>
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
            {pwdError && (
              <div className="alert alert-error" style={{ marginBottom: '16px', padding: '8px 12px' }}>
                <span>{pwdError}</span>
              </div>
            )}
            {pwdSuccess && (
              <div className="alert alert-success" style={{ marginBottom: '16px', padding: '8px 12px' }}>
                <span>{pwdSuccess}</span>
              </div>
            )}

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
      </div>
    </div>
  );
}
