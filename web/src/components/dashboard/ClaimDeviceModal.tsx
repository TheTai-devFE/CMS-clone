import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, RefreshCw } from 'lucide-react';
import { api } from '@/utils/api';

interface ClaimDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  setError: (msg: string) => void;
  setSuccessMsg: (msg: string) => void;
}

export default function ClaimDeviceModal({
  isOpen,
  onClose,
  onSuccess,
  setError,
  setSuccessMsg
}: ClaimDeviceModalProps) {
  const [pairingCode, setPairingCode] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pairingCode || !deviceName) return;

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      await api.post('/api/devices/claim', {
        pairingCode,
        deviceName
      });
      setSuccessMsg('Liên kết thiết bị thành công');
      onSuccess();
      onClose();
      // Reset form
      setPairingCode('');
      setDeviceName('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể liên kết thiết bị. Vui lòng kiểm tra lại mã kết nối.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <Card className="w-full max-w-md bg-card border-border shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-lg">Liên kết thiết bị mới</CardTitle>
            <CardDescription>Nhập mã pairing code hiển thị trên App Player để liên kết.</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-wide">Mã liên kết (6 chữ số)</label>
              <Input
                type="text"
                placeholder="Ví dụ: 123456"
                maxLength={6}
                value={pairingCode}
                onChange={(e) => setPairingCode(e.target.value.replace(/\D/g, ''))}
                required
                className="bg-background border-input"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-wide">Tên màn hình thiết bị</label>
              <Input
                type="text"
                placeholder="Ví dụ: Màn hình Lobby"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                required
                className="bg-background border-input"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2 border-t border-border/50 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={loading || pairingCode.length !== 6 || !deviceName.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/95"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Liên kết ngay'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
