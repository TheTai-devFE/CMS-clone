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

export default function RegisterPageClient() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
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
      await api.post('/api/auth/register', {
        username,
        email,
        password,
        role,
        licenseLimit: role === 'admin' ? 999 : 5,
      });

      showToast('Tạo tài khoản thành công! Đang chuyển hướng...', 'success');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tạo tài khoản', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Decorative Panel (Left) */}
      <div className="auth-decorative">
        <h1 className="auth-brand-title">
          Tạo tài khoản <span className="auth-brand-accent">quản trị</span>
        </h1>
        <p className="auth-brand-subtitle">
          Đăng ký để bắt đầu quản lý hệ thống màn hình quảng cáo. Tài khoản đầu tiên sẽ tự động được cấp quyền Admin.
        </p>
      </div>

      {/* Form Panel (Right) */}
      <div className="auth-form-side">
        <div className="auth-form-card">
          <div className="auth-form-header">
            <h2 className="auth-form-title">Đăng ký tài khoản</h2>
            <p className="auth-form-desc">
              Điền đầy đủ thông tin để tạo tài khoản mới
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Tên đăng nhập</label>
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
              <label className="form-label">Email liên hệ</label>
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
              <label className="form-label">Mật khẩu</label>
              <input
                type="password"
                className="form-input"
                placeholder="Tối thiểu 6 ký tự"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Vai trò</label>
              <select
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="user">Khách hàng (User)</option>
                <option value="admin">Quản trị hệ thống (Admin)</option>
              </select>
              <span className="form-hint">
                Tài khoản đầu tiên đăng ký trên hệ thống sẽ tự động được gán quyền Admin mặc định.
              </span>
            </div>

            <button
              type="submit"
              className="btn-primary auth-submit"
              disabled={loading}
            >
              {loading ? <span className="spinner spinner-dark"></span> : 'Tạo tài khoản'}
            </button>
          </form>

          <div className="auth-footer">
            <span>Đã có tài khoản? </span>
            <Link href="/login">Đăng nhập</Link>
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

