'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../utils/api';
import { cookieStorage } from '../../utils/cookie';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = cookieStorage.getAccessToken();
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.post('/api/auth/login', { email, password });

      cookieStorage.setAccessToken(data.accessToken);
      cookieStorage.setRefreshToken(data.refreshToken);
      cookieStorage.setUserInfo(data.user);

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Email hoac mat khau khong chinh xac');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-decorative">
        <div style={{ marginBottom: '28px' }}>
          <img src="/Logo-CDM-transparent.png" alt="CDM Logo" style={{ height: '70px', objectFit: 'contain' }} />
        </div>
        <h1 className="auth-brand-title">
          Control <span className="auth-brand-accent">Digital Media</span>
        </h1>
        <p className="auth-brand-subtitle">
          Quan ly noi dung man hinh quang cao tu xa. Dong bo thoi gian thuc, luu tru cuc bo va cap nhat thiet bi tuc thi.
        </p>
      </div>

      {/* Form Panel (Right) */}
      <div className="auth-form-side">
        <div className="auth-form-card">
          <div className="auth-form-header">
            <h2 className="auth-form-title">Dang nhap he thong</h2>
            <p className="auth-form-desc">
              Nhap thong tin tai khoan de truy cap Dashboard
            </p>
          </div>

          {error && (
            <div className="alert alert-error">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="nhap-email@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mat khau</label>
              <input
                type="password"
                className="form-input"
                placeholder="Nhap mat khau"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary auth-submit"
              disabled={loading}
            >
              {loading ? (
                <span className="spinner spinner-dark"></span>
              ) : (
                'Dang nhap'
              )}
            </button>
          </form>

          <div className="auth-footer">
            <span>Chua co tai khoan? </span>
            <Link href="/register">Dang ky ngay</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
