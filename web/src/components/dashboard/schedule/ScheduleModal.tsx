"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  X,
  Check,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Layers,
  Layout,
  Clock,
  AlertCircle,
  Calendar as CalendarIcon,
} from "lucide-react";
import { api } from "@/utils/api";
import { Playlist, Schedule, Template } from "@/types/dashboard";
import { ScheduleStep1Time } from "./ScheduleStep1Time";
import { ScheduleStep2Content } from "./ScheduleStep2Content";

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: Schedule | null;
  playlists: Playlist[];
  templates: Template[];
  onSuccess: () => void;
  deviceIds?: string[];
}

interface ScheduleFormValues {
  scheduleName: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  selectedDays: number[];
  scheduleType: "playlist" | "template";
  selectedPlaylistId: string;
  selectedTemplateId: string;
}

export const ScheduleModal = ({
  isOpen,
  onClose,
  schedule,
  playlists,
  templates,
  onSuccess,
  deviceIds,
}: ScheduleModalProps) => {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<ScheduleFormValues>({
    defaultValues: {
      scheduleName: schedule?.scheduleName || "",
      startDate: schedule?.startDate
        ? new Date(schedule.startDate).toISOString().split("T")[0]
        : "",
      endDate: schedule?.endDate
        ? new Date(schedule.endDate).toISOString().split("T")[0]
        : "",
      startTime: schedule?.startTime || "00:00:00",
      endTime: schedule?.endTime || "23:59:59",
      selectedDays: schedule?.dayOfWeek || [1, 2, 3, 4, 5, 6, 0],
      scheduleType: schedule?.templateId ? "template" : "playlist",
      selectedPlaylistId: schedule?.playlistId || "",
      selectedTemplateId: schedule?.templateId || "",
    },
  });

  const scheduleType = watch("scheduleType");
  const selectedPlaylistId = watch("selectedPlaylistId");
  const selectedTemplateId = watch("selectedTemplateId");
  const selectedDays = watch("selectedDays");

  if (!isOpen) return null;

  const handleToggleDay = (day: number) => {
    const newDays = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day];
    setValue("selectedDays", newDays);
  };

  const handleNextStep = async () => {
    setFormError(null);
    const isValid = await trigger(["scheduleName", "startDate", "endDate"]);
    if (!isValid) return;

    const start = getValues("startDate");
    const end = getValues("endDate");
    if (new Date(start) > new Date(end)) {
      setFormError("Ngày bắt đầu không được lớn hơn ngày kết thúc");
      return;
    }

    setCurrentStep(2);
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
    setFormError(null);
  };

  const onSubmit = async (data: ScheduleFormValues) => {
    if (data.scheduleType === "playlist" && !data.selectedPlaylistId) {
      setFormError("Vui lòng chọn Playlist để phát");
      return;
    }
    if (data.scheduleType === "template" && !data.selectedTemplateId) {
      setFormError("Vui lòng chọn Bố cục hiển thị để phát");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      const payload = {
        scheduleName: data.scheduleName.trim(),
        playlistId: data.scheduleType === "playlist" ? data.selectedPlaylistId : undefined,
        templateId: data.scheduleType === "template" ? data.selectedTemplateId : undefined,
        deviceIds: deviceIds || [],
        startDate: data.startDate,
        endDate: data.endDate,
        startTime:
          data.startTime.includes(":") && data.startTime.split(":").length === 2
            ? `${data.startTime}:00`
            : data.startTime,
        endTime:
          data.endTime.includes(":") && data.endTime.split(":").length === 2
            ? `${data.endTime}:59`
            : data.endTime,
        dayOfWeek: data.selectedDays,
      };

      if (schedule) {
        await api.put(`/api/schedules/${schedule.id}`, payload);
      } else {
        await api.post("/api/schedules", payload);
      }

      onSuccess();
      onClose();
    } catch (error) {
      const err = error as Error;
      setFormError(err.message || "Có lỗi xảy ra khi lưu Lịch trình");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-card border border-border/60 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in scale-in-95 duration-200">
        {/* Header Modal */}
        <div className="p-6 border-b border-border/40 flex items-center justify-between shrink-0">
          <div className="space-y-0.5">
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              {schedule ? "Cập Nhật Lịch Trình Phát" : "Lập Lịch Trình Phát Mới"}
            </h3>
            <p className="text-xs text-muted-foreground">
              Cấu hình khung giờ chạy phát tự động nội dung
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

        {/* Step Indicator - Tối giản kiểu Apple */}
        <div className="px-6 py-3 bg-muted/20 border-b border-border/40 flex items-center justify-center gap-6 shrink-0 text-xs font-medium text-muted-foreground select-none">
          <div
            className={`flex items-center gap-1.5 transition-all ${
              currentStep === 1 ? "text-emerald-600 font-semibold" : ""
            }`}
          >
            <span
              className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${
                currentStep === 1
                  ? "border-emerald-500 bg-emerald-600 text-white"
                  : "border-border bg-background"
              }`}
            >
              1
            </span>
            <span>Khung thời gian</span>
          </div>
          <div className="h-px bg-border/80 w-12" />
          <div
            className={`flex items-center gap-1.5 transition-all ${
              currentStep === 2 ? "text-emerald-600 font-semibold" : ""
            }`}
          >
            <span
              className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${
                currentStep === 2
                  ? "border-emerald-500 bg-emerald-600 text-white"
                  : "border-border bg-background"
              }`}
            >
              2
            </span>
            <span>Chọn Playlist</span>
          </div>
        </div>

        {/* Error Message */}
        {formError && (
          <div className="mx-6 mt-4 p-3.5 bg-red-500/5 border border-red-500/20 text-red-600 text-xs rounded-xl font-medium shrink-0 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span>{formError}</span>
          </div>
        )}

        {/* Wizard Forms Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* STEP 1: Thiết lập thời gian chạy */}
          {currentStep === 1 && (
            <ScheduleStep1Time
              register={register}
              errors={errors}
              selectedDays={selectedDays}
              handleToggleDay={handleToggleDay}
            />
          )}

          {/* STEP 2: Chọn Playlist phát */}
          {currentStep === 2 && (
            <ScheduleStep2Content
              scheduleType={scheduleType}
              selectedPlaylistId={selectedPlaylistId}
              selectedTemplateId={selectedTemplateId}
              playlists={playlists}
              templates={templates}
              setValue={setValue}
            />
          )}
        </div>

        {/* Footer Modal Buttons */}
        <div className="p-5 border-t border-border/40 flex justify-between bg-muted/10 shrink-0">
          <div>
            {currentStep === 2 && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                className="gap-1.5 rounded-xl border-border/80 text-xs"
              >
                <ArrowLeft className="h-4 w-4" /> Quay lại
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl border-border/80 text-xs"
            >
              Hủy bỏ
            </Button>

            {currentStep === 1 ? (
              <Button
                type="button"
                onClick={handleNextStep}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-1.5 rounded-xl px-4 text-xs"
              >
                Tiếp theo <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl px-4 text-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Đang lưu...
                  </>
                ) : schedule ? (
                  "Cập Nhật Lịch Phát"
                ) : (
                  "Lưu Lịch Trình"
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};