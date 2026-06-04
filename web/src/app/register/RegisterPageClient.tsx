'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../utils/api';
import { cookieStorage } from '../../utils/cookie';

export default function RegisterPageClient() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [success, setSuccess] = useState(false);
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
      await api.post('/api/auth/register', {
        username,
        email,
        password,
        role,
        licenseLimit: role === 'admin' ? 999 : 5,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Co loi xay ra khi tao tai khoan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Decorative Panel (Left) */}
      <div className="auth-decorative">
        <h1 className="auth-brand-title">
          Tao tai khoan <span className="auth-brand-accent">quan tri</span>
        </h1>
        <p className="auth-brand-subtitle">
          Dang ky de bat dau quan ly he thong man hinh quang cao. Tai khoan dau tien se tu dong duoc cap quyen Admin.
        </p>
      </div>

      {/* Form Panel (Right) */}
      <div className="auth-form-side">
        <div className="auth-form-card">
          <div className="auth-form-header">
            <h2 className="auth-form-title">Dang ky tai khoan</h2>
            <p className="auth-form-desc">
              Dien day du thong tin de tao tai khoan moi
            </p>
          </div>

          {success && (
            <div className="alert alert-success">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <span>Tao tai khoan thanh cong! Dang chuyen huong...</span>
            </div>
          )}

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
              <label className="form-label">Ten dang nhap</label>
              <input
                type="text"
                className="form-input"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email lien he</label>
              <input
                type="email"
                className="form-input"
                placeholder="name@domain.com"
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
                placeholder="Toi thieu 6 ky tu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Vai tro</label>
              <select
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="user">Khach hang (User)</option>
                <option value="admin">Quan tri he thong (Admin)</option>
              </select>
              <span className="form-hint">
                Tai khoan dau tien dang ky tren he thong se tu dong duoc gan quyen Admin mac dinh.
              </span>
            </div>

            <button
              type="submit"
              className="btn-primary auth-submit"
              disabled={loading || success}
            >
              {loading ? <span className="spinner spinner-dark"></span> : 'Tao tai khoan'}
            </button>
          </form>

          <div className="auth-footer">
            <span>Da co tai khoan? </span>
            <Link href="/login">Dang nhap</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
