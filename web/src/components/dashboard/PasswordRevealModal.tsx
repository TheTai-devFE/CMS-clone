import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check, KeyRound, Mail, AlertTriangle, X } from 'lucide-react';

interface PasswordRevealModalProps {
  email: string;
  username?: string;
  shortId?: string;
  tempPassword: string;
  onClose: () => void;
  onSendEmail?: () => void;
  sendingEmail?: boolean;
}

/**
 * T2: Modal hiển thị email + mật khẩu tạm thời sau khi admin tạo user.
 * CHỈ hiển thị 1 LẦN — sau khi user đóng modal, password không thể xem lại
 * (chỉ admin reset qua flow change-password).
 *
 * UX:
 * - Email (readonly, copy được)
 * - Password (readonly, copy được) + nút copy riêng
 * - Cảnh báo quan trọng: phải lưu password ngay
 * - Nút "Gửi email cho user" (nếu có onSendEmail) — optional
 */
export default function PasswordRevealModal({
  email,
  username,
  shortId,
  tempPassword,
  onClose,
  onSendEmail,
  sendingEmail = false,
}: PasswordRevealModalProps) {
  const [copiedField, setCopiedField] = useState<'email' | 'password' | null>(null);

  const handleCopy = async (text: string, field: 'email' | 'password') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-md bg-card border-border shadow-2xl animate-in zoom-in-95 duration-200">
        <CardHeader className="flex flex-row items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
              <KeyRound className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Tạo tài khoản thành công</CardTitle>
              <CardDescription>
                {username ? `User: ${username}` : 'Tài khoản đã được tạo trên hệ thống.'}
                {shortId ? ` (${shortId})` : ''}
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Warning */}
          <div className="flex items-start gap-2 p-3 rounded-md bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Mật khẩu chỉ hiển thị <strong>một lần duy nhất</strong>. Vui lòng copy
              và gửi cho user qua email ngay. Sau khi đóng modal, không thể xem lại.
            </p>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              Email đăng nhập
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={email}
                className="flex-1 px-3 py-2 text-sm font-mono rounded-md border border-input bg-muted/30 text-foreground"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCopy(email, 'email')}
                className="h-9 w-9 shrink-0"
                aria-label="Copy email"
              >
                {copiedField === 'email' ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5" />
              Mật khẩu tạm thời
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={tempPassword}
                className="flex-1 px-3 py-2 text-sm font-mono font-bold rounded-md border border-amber-500/30 bg-amber-500/5 text-foreground"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCopy(tempPassword, 'password')}
                className="h-9 w-9 shrink-0 border-amber-500/30"
                aria-label="Copy password"
              >
                {copiedField === 'password' ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              User nên đổi mật khẩu ngay sau lần đăng nhập đầu tiên.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-2">
          {onSendEmail && (
            <Button
              variant="outline"
              onClick={onSendEmail}
              disabled={sendingEmail}
              className="w-full sm:w-auto"
            >
              <Mail className="h-4 w-4 mr-2" />
              {sendingEmail ? 'Đang gửi...' : 'Gửi email cho user'}
            </Button>
          )}
          <Button onClick={onClose} className="w-full sm:flex-1 bg-primary text-primary-foreground">
            Đã lưu mật khẩu
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
