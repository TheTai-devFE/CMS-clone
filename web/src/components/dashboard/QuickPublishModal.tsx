"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Check, Loader2, AlertCircle, Monitor } from "lucide-react";
import { api } from "@/utils/api";
import { Playlist, Device } from "@/types/dashboard";

interface QuickPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlist: Playlist | null;
  onSuccess: () => void;
}

export const QuickPublishModal = ({
  isOpen,
  onClose,
  playlist,
  onSuccess,
}: QuickPublishModalProps) => {
  const [deviceList, setDeviceList] = useState<Device[]>([]);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load danh sách thiết bị khi mở modal
  useEffect(() => {
    if (!isOpen || !playlist) return;

    const fetchDevices = async () => {
      setIsLoadingDevices(true);
      setErrorMsg(null);
      try {
        const devices = (await api.get("/api/devices")) as Device[];
        // Chỉ lấy những thiết bị đã được phê duyệt (approved)
        const approvedDevices = devices.filter((d) => d.approvalStatus === "approved");
        setDeviceList(approvedDevices);

        // Thiết lập thiết bị mặc định được chọn dựa trên syncLayout
        interface SyncLayoutConfig {
          targetDeviceId?: string;
          deviceMapping?: Record<string, string | string[]>;
          videoWall?: { rows: number; cols: number; sourceMediaId: string };
        }
        const syncLayout = (playlist as { syncLayout?: SyncLayoutConfig }).syncLayout;

        // Collect all device IDs from syncLayout (supports both single and Video Wall modes)
        const autoDeviceIds = new Set<string>();

        // Single device mode: targetDeviceId
        if (syncLayout?.targetDeviceId && typeof syncLayout.targetDeviceId === 'string') {
          autoDeviceIds.add(syncLayout.targetDeviceId);
        }

        // Video Wall / Sync Group mode: deviceMapping
        if (syncLayout?.deviceMapping && typeof syncLayout.deviceMapping === 'object') {
          for (const key in syncLayout.deviceMapping) {
            const value = syncLayout.deviceMapping[key];
            if (typeof value === 'string') {
              autoDeviceIds.add(value);
            } else if (Array.isArray(value)) {
              value.forEach((id) => {
                if (typeof id === 'string') autoDeviceIds.add(id);
              });
            }
          }
        }

        // Auto-select matched devices
        if (autoDeviceIds.size > 0) {
          const matchedIds = approvedDevices
            .filter((d) => autoDeviceIds.has(d.id))
            .map((d) => d.id);
          setSelectedDeviceIds(matchedIds.length > 0 ? matchedIds : []);
        } else {
          setSelectedDeviceIds([]);
        }
      } catch (err) {
        console.error("Lỗi khi tải danh sách thiết bị:", err);
        setErrorMsg("Không thể tải danh sách thiết bị. Vui lòng thử lại.");
      } finally {
        setIsLoadingDevices(false);
      }
    };

    fetchDevices();
  }, [isOpen, playlist]);

  if (!isOpen || !playlist) return null;

  const handleToggleDevice = (deviceId: string) => {
    setSelectedDeviceIds((prev) =>
      prev.includes(deviceId) ? prev.filter((id) => id !== deviceId) : [...prev, deviceId]
    );
  };

  const handleSelectAll = () => {
    if (selectedDeviceIds.length === deviceList.length) {
      setSelectedDeviceIds([]);
    } else {
      setSelectedDeviceIds(deviceList.map((d) => d.id));
    }
  };

  const handleConfirmPublish = async () => {
    if (selectedDeviceIds.length === 0) {
      setErrorMsg("Vui lòng chọn ít nhất một thiết bị để phát");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const now = new Date();
      // Định dạng ngày hôm nay YYYY-MM-DD theo múi giờ địa phương
      const offset = now.getTimezoneOffset();
      const localNow = new Date(now.getTime() - offset * 60 * 1000);
      const todayString = localNow.toISOString().split("T")[0];

      const payload = {
        scheduleName: `Publish Nhanh - ${playlist.playlistName}`,
        playlistId: playlist.id,
        deviceIds: selectedDeviceIds,
        startDate: todayString,
        endDate: "2036-12-31", // Hiệu lực 10 năm
        startTime: "00:00:00",
        endTime: "23:59:59",
        dayOfWeek: [1, 2, 3, 4, 5, 6, 0], // Cả tuần
      };

      await api.post("/api/schedules", payload);
      onSuccess();
      onClose();
    } catch (err) {
      const error = err as Error;
      console.error("Lỗi khi publish nhanh:", err);
      setErrorMsg(error.message || "Không thể thực hiện Publish nhanh");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-card border border-border/60 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in scale-in-95 duration-200">
        {/* Header Modal */}
        <div className="p-6 border-b border-border/40 flex items-center justify-between shrink-0">
          <div className="space-y-0.5">
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              Phát Ngay Lập Tức
            </h3>
            <p className="text-xs text-muted-foreground truncate max-w-[340px]">
              Publish playlist: <strong className="text-foreground">{playlist.playlistName}</strong>
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-muted"
          >
            <X className="h-4.5 w-4.5" />
          </Button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3.5 bg-red-500/5 border border-red-500/20 text-red-600 text-xs rounded-xl font-medium shrink-0 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Chọn thiết bị trình chiếu ({selectedDeviceIds.length}/{deviceList.length})
            </label>
            {deviceList.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                {selectedDeviceIds.length === deviceList.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
              </button>
            )}
          </div>

          {isLoadingDevices ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
              <p className="text-xs text-muted-foreground">Đang tải danh sách màn hình...</p>
            </div>
          ) : deviceList.length === 0 ? (
            <div className="py-12 border border-dashed border-border/60 rounded-2xl bg-muted/5 flex flex-col items-center justify-center gap-2 text-center px-4">
              <Monitor className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground font-medium">
                Chưa có thiết bị nào được gán hoặc chờ duyệt.
              </p>
              <p className="text-[10px] text-muted-foreground/80 max-w-[280px]">
                Vui lòng kết nối thiết bị từ Player App và duyệt thiết bị trên trang quản trị trước.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {deviceList.map((device) => {
                const isChecked = selectedDeviceIds.includes(device.id);
                return (
                  <div
                    key={device.id}
                    onClick={() => handleToggleDevice(device.id)}
                    className={`p-3.5 border rounded-2xl cursor-pointer transition-all duration-200 flex items-center justify-between ${
                      isChecked
                        ? "border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/50 shadow-sm"
                        : "border-border/60 bg-card/50 hover:border-border hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Monitor className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-foreground truncate max-w-[240px]">
                          {device.deviceName}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate max-w-[240px]">
                          IP: {device.ipAddress || "N/A"} | OS: {device.osVersion || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`h-5 w-5 rounded-full border flex items-center justify-center transition-all ${
                        isChecked
                          ? "border-emerald-500 bg-emerald-600 text-white"
                          : "border-border bg-background"
                      }`}
                    >
                      {isChecked && <Check className="h-3.5 w-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="p-5 border-t border-border/40 flex justify-end gap-2 bg-muted/10 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl border-border/80 text-xs"
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            onClick={handleConfirmPublish}
            disabled={isSubmitting || deviceList.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl px-4 text-xs"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Đang gửi lệnh...
              </>
            ) : (
              "Xác nhận Phát"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
