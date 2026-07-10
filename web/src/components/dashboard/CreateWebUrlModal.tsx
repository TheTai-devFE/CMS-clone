'use client';

import React, { useState } from 'react';
import { X, Globe, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/utils/api';

interface CreateWebUrlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  setError: (msg: string) => void;
  setSuccessMsg: (msg: string) => void;
}

export default function CreateWebUrlModal({
  isOpen,
  onClose,
  onSuccess,
  setError,
  setSuccessMsg
}: CreateWebUrlModalProps) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [localError, setLocalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setError('');
    setSuccessMsg('');

    // Client-side validations
    if (!name.trim()) {
      setLocalError('Vui lòng nhập tên hiển thị.');
      return;
    }

    if (!url.trim()) {
      setLocalError('Vui lòng nhập đường dẫn Web URL.');
      return;
    }

    // Validate URL format
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/i;
    if (!urlPattern.test(url)) {
      setLocalError('Đường dẫn URL không hợp lệ (ví dụ hợp lệ: https://thoitiet.vn).');
      return;
    }

    // Auto prepend https:// if missing protocol
    let formattedUrl = url.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    setSubmitting(true);
    try {
      await api.post('/api/media/url', {
        name: name.trim(),
        url: formattedUrl
      });
      setSuccessMsg(`Đã liên kết trang web "${name}" thành công.`);
      onSuccess();
      handleClose();
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : 'Không thể liên kết trang web');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setName('');
    setUrl('');
    setLocalError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs select-none">
      <div className="w-full max-w-md bg-card/95 backdrop-blur-xl border border-border/60 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 bg-muted/10">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-sm text-foreground">Nhúng trang Web (Web URL)</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-6 w-6 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/50"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {localError && (
            <div className="flex items-start gap-2 bg-red-500/10 text-red-500 border border-red-500/10 p-3 rounded-lg text-xs leading-relaxed font-medium">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{localError}</span>
            </div>
          )}

          {/* Display Name input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">
              Tên hiển thị
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Bảng giá vàng, Dự báo thời tiết..."
              className="w-full px-3 py-2 text-xs bg-muted/40 hover:bg-muted/65 border border-border rounded-lg focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary/45 transition-all text-foreground"
            />
          </div>

          {/* Web URL input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">
              Đường dẫn Web URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Ví dụ: https://ti-gia.vn hoặc weather.io"
              className="w-full px-3 py-2 text-xs bg-muted/40 hover:bg-muted/65 border border-border rounded-lg focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary/45 transition-all text-foreground"
            />
            <p className="text-[10px] text-muted-foreground leading-relaxed italic">
              * Lưu ý: Đường dẫn web phải hỗ trợ hiển thị trong thẻ iframe (không bị chặn X-Frame-Options bởi chính trang web đó).
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40 mt-5">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="h-8 text-xs font-semibold rounded-lg px-4 border border-border/80 hover:bg-muted/50"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="h-8 text-xs font-semibold rounded-lg px-4 bg-primary text-primary-foreground hover:bg-primary/95"
            >
              {submitting ? 'Đang liên kết...' : 'Liên kết ngay'}
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
}
