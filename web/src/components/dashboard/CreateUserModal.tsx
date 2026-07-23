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
import { Input } from '@/components/ui/input';
import { UserPlus, X } from 'lucide-react';

interface CreateUserModalProps {
  onClose: () => void;
  onCreated: (user: {
    id: string;
    shortId: string;
    username: string;
    email: string;
    role: string;
    licenseLimit: number;
    tempPassword: string;
  }) => void;
}

export default function CreateUserModal({
  onClose,
  onCreated,
}: CreateUserModalProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [licenseLimit, setLicenseLimit] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !email.trim()) {
      setError('Vui lòng nhập đầy đủ tên tài khoản và email.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/auth/users`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            username: username.trim(),
            email: email.trim().toLowerCase(),
            licenseLimit: Number(licenseLimit) || 1,
          }),
        },
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      // data shape: { user: {...}, tempPassword: "..." }
      onCreated({
        id: data.user.id,
        shortId: data.user.shortId,
        username: data.user.username,
        email: data.user.email,
        role: data.user.role,
        licenseLimit: data.user.licenseLimit,
        tempPassword: data.tempPassword,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-md bg-card border-border shadow-2xl animate-in zoom-in-95 duration-200">
        <CardHeader className="flex flex-row items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Tạo tài khoản User</CardTitle>
              <CardDescription>
                Mật khẩu sẽ được hệ thống tự sinh và hiển thị một lần duy nhất.
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

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="cu-username" className="text-xs font-semibold text-muted-foreground">
                Tên tài khoản <span className="text-red-500">*</span>
              </label>
              <Input
                id="cu-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="vd: nguyenvana"
                autoFocus
                required
                minLength={3}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="cu-email" className="text-xs font-semibold text-muted-foreground">
                Email <span className="text-red-500">*</span>
              </label>
              <Input
                id="cu-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vd: user@example.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="cu-license" className="text-xs font-semibold text-muted-foreground">
                Hạn mức License (số thiết bị)
              </label>
              <Input
                id="cu-license"
                type="number"
                value={licenseLimit}
                onChange={(e) => setLicenseLimit(Number(e.target.value))}
                min={1}
                max={999}
              />
              <p className="text-[10px] text-muted-foreground">
                Số thiết bị tối đa user này có thể liên kết.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="w-full sm:flex-1 bg-primary text-primary-foreground"
            >
              {loading ? 'Đang tạo...' : 'Tạo tài khoản'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
