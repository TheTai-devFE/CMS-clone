"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarClock, X, Loader2, AlertCircle, Tv } from "lucide-react";
import { api } from "@/utils/api";
import { useDevices } from "@/hooks/useApi";
import { ScheduleStep1Time, ScheduleTimeMode } from "./schedule/ScheduleStep1Time";

interface PublishScheduleModalProps {
  playlistId: string;
  playlistName: string;
  // Devices already selected during editing (e.g. Video Wall Simulator device mapping) —
  // pre-filled here so the user doesn't have to pick them again.
  deviceIds: string[];
  onClose: () => void;
  onSuccess?: () => void;
}

interface ScheduleFormValues {
  scheduleName: string;
  scheduleMode: ScheduleTimeMode;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  selectedDays: number[];
}

function formatDate(date: Date) {
  return date.toISOString().split("T")[0];
}

/**
 * Popup lập lịch phát dành riêng cho việc publish playlist "Đồng bộ" ngay sau khi lưu.
 * Khác với ScheduleModal (wizard 2 bước chọn Playlist/Bố cục), popup này không cần bước
 * chọn playlist vì playlist đã được xác định — chỉ cấu hình thời gian và hiển thị lại
 * danh sách thiết bị đã gán trong bước thiết kế (Video Wall Simulator).
 */
export default function PublishScheduleModal({
  playlistId,
  playlistName,
  deviceIds,
  onClose,
  onSuccess,
}: PublishScheduleModalProps) {
  const { devices } = useDevices();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const today = new Date();
  const twoYearsLater = new Date(today);
  twoYearsLater.setFullYear(today.getFullYear() + 2);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ScheduleFormValues>({
    defaultValues: {
      scheduleName: `Lịch phát - ${playlistName}`,
      scheduleMode: "dateRange",
      startDate: formatDate(today),
      endDate: formatDate(twoYearsLater),
      startTime: "00:00:00",
      endTime: "23:59:59",
      selectedDays: [1, 2, 3, 4, 5, 6, 0],
    },
  });

  const selectedDays = watch("selectedDays");
  const scheduleMode = watch("scheduleMode");

  const handleToggleDay = (day: number) => {
    const newDays = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day];
    setValue("selectedDays", newDays);
  };

  const handleChangeScheduleMode = (mode: ScheduleTimeMode) => {
    setValue("scheduleMode", mode);
    if (mode === "dateRange") {
      setValue("selectedDays", [0, 1, 2, 3, 4, 5, 6]);
    } else {
      // "Ngày trong tuần": không giới hạn ngày kết thúc — mở khoảng ngày hoạt động
      // ra rất xa (ẩn khỏi UI) để lịch trình lặp lại vô thời hạn theo các ngày đã chọn.
      const farFuture = new Date(today);
      farFuture.setFullYear(today.getFullYear() + 10);
      setValue("startDate", formatDate(today));
      setValue("endDate", formatDate(farFuture));
    }
  };

  const linkedDevices = devices.filter((d) => deviceIds.includes(d.id));

  const onSubmit = async (data: ScheduleFormValues) => {
    if (new Date(data.startDate) > new Date(data.endDate)) {
      setFormError("Ngày bắt đầu không được lớn hơn ngày kết thúc");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      await api.post("/api/schedules", {
        scheduleName: data.scheduleName.trim(),
        playlistId,
        deviceIds,
        startDate: data.startDate,
        endDate: data.endDate,
        startTime:
          data.startTime.split(":").length === 2 ? `${data.startTime}:00` : data.startTime,
        // Không có giờ kết thúc trong ngày — phát liên tục tới hết ngày cuối cùng của
        // khoảng thời gian đã chọn ở trên.
        endTime: "23:59:59",
        dayOfWeek: data.selectedDays,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Không thể lập lịch phát");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-xl bg-card border-border shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-start justify-between shrink-0">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <CalendarClock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Lập Lịch Phát</CardTitle>
              <CardDescription className="line-clamp-1">
                &ldquo;{playlistName}&rdquo; — chế độ Đồng bộ, chuyển thẳng sang bước lập lịch.
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-8 w-8 rounded-full"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-4 overflow-y-auto flex-1">
          <ScheduleStep1Time
            register={register}
            errors={errors}
            selectedDays={selectedDays}
            handleToggleDay={handleToggleDay}
            scheduleMode={scheduleMode}
            onChangeScheduleMode={handleChangeScheduleMode}
          />

          {/* Thiết bị liên kết — lấy từ mapping đã chọn ở Sơ đồ lắp ráp Video Wall */}
          <div className="space-y-2 p-4 border border-border/60 rounded-2xl bg-muted/10">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Tv className="h-4 w-4 text-muted-foreground" />
              Thiết bị liên kết ({linkedDevices.length})
            </h4>
            {linkedDevices.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {linkedDevices.map((d) => (
                  <span
                    key={d.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-background text-[11px] font-medium text-foreground"
                  >
                    <Tv className="h-3 w-3 text-primary" />
                    {d.deviceName}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground italic">
                Chưa có thiết bị nào được gán ở bước thiết kế — lịch trình sẽ tự động áp dụng
                theo cấu hình đồng bộ của playlist.
              </p>
            )}
          </div>

          {formError && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-red-500/10 border border-red-500/20 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Đóng
          </Button>
          <Button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="w-full sm:flex-1 bg-primary text-primary-foreground"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang lưu lịch trình...
              </>
            ) : (
              "Lưu Lịch Trình"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
