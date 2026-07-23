import React, { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Send,
  X,
  Tv,
  Wifi,
  WifiOff,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/utils/api';
import { Device } from '@/types/dashboard';

interface PublishModalProps {
  playlistId: string;
  playlistName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * T5: Modal "Publish to devices" — chọn device + on/off riêng cho từng device
 * + master "All on/off" switch. Gọi POST /api/playlists/:id/publish.
 *
 * Flow:
 * 1. Load danh sách device của user (useEffect)
 * 2. User toggle master switch hoặc từng device
 * 3. Click "Publish" → POST API
 * 4. Success → onSuccess() (parent sẽ close + show message)
 */
export default function PublishModal({
  playlistId,
  playlistName,
  onClose,
  onSuccess,
}: PublishModalProps) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load devices khi mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = (await api.get('/api/devices')) as { devices?: Device[] } | Device[];
        const list: Device[] = Array.isArray(data) ? data : (data.devices ?? []);
        if (!cancelled) {
          setDevices(list);
          // Mặc định enabled = true cho TẤT CẢ devices (khi mở modal lần đầu)
          const init: Record<string, boolean> = {};
          list.forEach((d) => {
            init[d.id] = true;
          });
          setEnabledMap(init);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Không thể tải danh sách thiết bị',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Master "all on/off" — tính toán từ enabledMap
  const allEnabled = useMemo(
    () => devices.length > 0 && devices.every((d) => enabledMap[d.id]),
    [devices, enabledMap],
  );
  const noneEnabled = useMemo(
    () => devices.every((d) => !enabledMap[d.id]),
    [devices, enabledMap],
  );
  const enabledCount = useMemo(
    () => Object.values(enabledMap).filter(Boolean).length,
    [enabledMap],
  );

  const handleToggleAll = (next: boolean) => {
    const updated: Record<string, boolean> = {};
    devices.forEach((d) => {
      updated[d.id] = next;
    });
    setEnabledMap(updated);
  };

  const handleToggle = (deviceId: string) => {
    setEnabledMap((prev) => ({ ...prev, [deviceId]: !prev[deviceId] }));
  };

  const handlePublish = async () => {
    if (noneEnabled) {
      setError('Vui lòng bật ít nhất 1 thiết bị để publish');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const result = (await api.post(
        `/api/playlists/${playlistId}/publish`,
        {
          devices: devices
            .filter((d) => enabledMap[d.id])
            .map((d) => ({ deviceId: d.id, enabled: true })),
        },
      )) as {
        scheduleName: string;
        deviceCount: number;
      };

      setSuccess(
        `Đã publish tới ${result.deviceCount} thiết bị. Player sẽ nhận trong vòng 30 giây.`,
      );
      // Đợi 1.5s cho user thấy message rồi close
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Không thể publish playlist',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-lg bg-card border-border shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-start justify-between shrink-0">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Send className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Publish Playlist</CardTitle>
              <CardDescription className="line-clamp-1">
                &ldquo;{playlistName}&rdquo; sẽ được gửi tới các thiết bị đã bật.
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={submitting}
            className="h-8 w-8 rounded-full"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-4 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-sm">Đang tải danh sách thiết bị...</p>
            </div>
          ) : devices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
              <Tv className="h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm">Bạn chưa có thiết bị nào được liên kết.</p>
              <p className="text-xs">Vào tab Player để liên kết thiết bị trước.</p>
            </div>
          ) : (
            <>
              {/* Master "All on/off" switch */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-primary/30 bg-primary/5">
                <div className="flex items-center gap-2">
                  {allEnabled ? (
                    <Wifi className="h-4 w-4 text-primary" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-semibold">
                    Bật tất cả ({enabledCount}/{devices.length})
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={allEnabled}
                  onClick={() => handleToggleAll(!allEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    allEnabled ? 'bg-primary' : 'bg-muted-foreground/30'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      allEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Per-device list */}
              <div className="space-y-2">
                {devices.map((device) => {
                  const isOn = enabledMap[device.id] ?? false;
                  return (
                    <div
                      key={device.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        isOn
                          ? 'border-border bg-background'
                          : 'border-border/40 bg-muted/20 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Tv
                          className={`h-4 w-4 shrink-0 ${
                            isOn ? 'text-primary' : 'text-muted-foreground'
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {device.deviceName}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono truncate">
                            {device.ipAddress || '—'} · {device.id.slice(0, 8)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isOn}
                        aria-label={`Toggle ${device.deviceName}`}
                        onClick={() => handleToggle(device.id)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${
                          isOn ? 'bg-primary' : 'bg-muted-foreground/30'
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                            isOn ? 'translate-x-4' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-red-500/10 border border-red-500/20 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
            className="w-full sm:w-auto"
          >
            Đóng
          </Button>
          <Button
            type="button"
            onClick={handlePublish}
            disabled={
              loading ||
              submitting ||
              devices.length === 0 ||
              noneEnabled ||
              !!success
            }
            className="w-full sm:flex-1 bg-primary text-primary-foreground"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang publish...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Publish ({enabledCount} thiết bị)
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
