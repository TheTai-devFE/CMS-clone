import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, RefreshCw } from 'lucide-react';
import { api } from '@/utils/api';
import { Device } from '@/types/dashboard';

interface EditDeviceModalProps {
  isOpen: boolean;
  device: Device | null;
  onClose: () => void;
  onSuccess: () => void;
  setError: (msg: string) => void;
  setSuccessMsg: (msg: string) => void;
}

export default function EditDeviceModal({
  isOpen,
  device,
  onClose,
  onSuccess,
  setError,
  setSuccessMsg
}: EditDeviceModalProps) {
  const [deviceName, setDeviceName] = useState('');
  const [useSecurityPassword, setUseSecurityPassword] = useState(false);
  const [sleepScheduleEnabled, setSleepScheduleEnabled] = useState(false);
  const [sleepStartTime, setSleepStartTime] = useState('22:00');
  const [sleepEndTime, setSleepEndTime] = useState('06:00');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (device) {
      setDeviceName(device.deviceName || '');
      setUseSecurityPassword(!!device.useSecurityPassword);
      setSleepScheduleEnabled(!!device.sleepScheduleEnabled);
      setSleepStartTime(device.sleepStartTime || '22:00');
      setSleepEndTime(device.sleepEndTime || '06:00');
    }
  }, [device, isOpen]);

  if (!isOpen || !device) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceName.trim()) return;

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      await api.put(`/api/devices/${device.id}`, {
        deviceName,
        useSecurityPassword,
        sleepScheduleEnabled,
        sleepStartTime,
        sleepEndTime
      });
      setSuccessMsg('Cập nhật cấu hình thiết bị thành công');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Không thể cập nhật cấu hình thiết bị.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <Card className="w-full max-w-md bg-card border-border shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-lg">Cấu hình màn hình</CardTitle>
            <CardDescription>Chỉnh sửa các thông số của thiết bị phát.</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
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
            
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/85 bg-muted/20">
              <div className="space-y-0.5" style={{ marginRight: '16px' }}>
                <label className="text-sm font-semibold text-foreground">Yêu cầu mã PIN bảo mật</label>
                <p className="text-xs text-muted-foreground">
                  Chặn nút Settings và Network trên thiết bị, yêu cầu nhập mã PIN bảo mật của tài khoản.
                </p>
              </div>
              <input
                type="checkbox"
                checked={useSecurityPassword}
                onChange={(e) => setUseSecurityPassword(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-3 p-3 rounded-lg border border-border/85 bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5" style={{ marginRight: '16px' }}>
                  <label className="text-sm font-semibold text-foreground">Lịch nghỉ màn hình (Sleep Schedule)</label>
                  <p className="text-xs text-muted-foreground">
                    Tự động tắt/mở màn hình Player theo khung giờ để tiết kiệm điện.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={sleepScheduleEnabled}
                  onChange={(e) => setSleepScheduleEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
              </div>

              {sleepScheduleEnabled && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/40">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Giờ nghỉ (Sleep)</label>
                    <Input
                      type="time"
                      value={sleepStartTime}
                      onChange={(e) => setSleepStartTime(e.target.value)}
                      required
                      className="bg-background border-input"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Giờ hoạt động (Wake)</label>
                    <Input
                      type="time"
                      value={sleepEndTime}
                      onChange={(e) => setSleepEndTime(e.target.value)}
                      required
                      className="bg-background border-input"
                    />
                  </div>
                </div>
              )}
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
              disabled={loading || !deviceName.trim()}
              className="bg-emerald-600 text-white hover:bg-emerald-500"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Lưu thay đổi'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
