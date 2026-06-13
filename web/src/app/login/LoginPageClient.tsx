'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../utils/api';
import { cookieStorage } from '../../utils/cookie';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';

interface ToastItem {
  id: string;
  type: 'success' | 'error';
  message: string;
}

export default function LoginPageClient() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = cookieStorage.getAccessToken();
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await api.post('/api/auth/login', { email, password });

      cookieStorage.setAccessToken(data.accessToken);
      cookieStorage.setRefreshToken(data.refreshToken);
      cookieStorage.setUserInfo(data.user);

      showToast('Đăng nhập thành công! Đang chuyển hướng...', 'success');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Email hoặc mật khẩu không chính xác', 'error');
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
          Quản lý nội dung màn hình quảng cáo từ xa. Đồng bộ thời gian thực, lưu trữ cục bộ và cập nhật thiết bị tức thì.
        </p>
      </div>

      {/* Form Panel (Right) */}
      <div className="auth-form-side">
        <div className="auth-form-card">
          <div className="auth-form-header">
            <h2 className="auth-form-title">Đăng nhập hệ thống</h2>
            <p className="auth-form-desc">
              Nhập thông tin tài khoản để truy cập Dashboard
            </p>
          </div>

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
              <label className="form-label">Mật khẩu</label>
              <input
                type="password"
                className="form-input"
                placeholder="Nhập mật khẩu"
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
                'Đăng nhập'
              )}
            </button>
          </form>

          <div className="auth-footer">
            <span>Chưa có tài khoản? </span>
            <Link href="/register">Đăng ký ngay</Link>
          </div>
        </div>
      </div>

      {/* Local Toaster Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none select-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 120, scale: 0.85, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 220, damping: 20 }}
              className="pointer-events-auto flex items-start gap-3 p-3.5 bg-card/95 backdrop-blur-md border border-border/80 rounded-xl shadow-lg w-full text-foreground"
            >
              <div className="shrink-0 mt-0.5">
                {toast.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div className="flex-1 text-xs font-semibold leading-normal pr-2">
                {toast.message}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="shrink-0 h-5 w-5 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/50 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
              <ToastTimer duration={4000} onDismiss={() => removeToast(toast.id)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ToastTimer({ duration, onDismiss }: { duration: number; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  return null;
}

