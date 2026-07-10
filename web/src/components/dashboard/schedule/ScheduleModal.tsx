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
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Tên lịch trình */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-foreground">
                    Tên Lịch Trình Phát *
                  </label>
                  <Input
                    placeholder="Nhập tên lịch trình phát..."
                    {...register("scheduleName", { required: "Vui lòng nhập tên lịch trình" })}
                    className="rounded-xl border-border/80 focus:border-emerald-500/50 focus:ring-emerald-500/5 py-4 transition-all text-xs font-medium"
                  />
                  {errors.scheduleName && (
                    <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.scheduleName.message}</p>
                  )}
                </div>

                {/* Khoảng ngày chạy */}
                <div className="space-y-3 p-4 border border-border/60 rounded-2xl bg-muted/10">
                  <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    Khoảng ngày hoạt động
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                        Từ ngày *
                      </label>
                      <input
                        type="date"
                        {...register("startDate", { required: "Vui lòng chọn ngày bắt đầu" })}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium"
                      />
                      {errors.startDate && (
                        <p className="text-red-500 text-[9px] mt-1 font-medium">{errors.startDate.message}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                        Đến ngày *
                      </label>
                      <input
                        type="date"
                        {...register("endDate", { required: "Vui lòng chọn ngày kết thúc" })}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium"
                      />
                      {errors.endDate && (
                        <p className="text-red-500 text-[9px] mt-1 font-medium">{errors.endDate.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Khung giờ chạy */}
                <div className="space-y-3 p-4 border border-border/60 rounded-2xl bg-muted/10">
                  <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Khung giờ phát trong ngày
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                        Giờ bắt đầu
                      </label>
                      <input
                        type="time"
                        step="1"
                        {...register("startTime")}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                        Giờ kết thúc
                      </label>
                      <input
                        type="time"
                        step="1"
                        {...register("endTime")}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Ngày trong tuần */}
                <div className="space-y-2 md:col-span-2 p-4 border border-border/60 rounded-2xl bg-muted/10">
                  <label className="text-xs font-semibold text-foreground block">
                    Các ngày áp dụng trong tuần
                  </label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {[
                      { label: "Thứ 2", val: 1 },
                      { label: "Thứ 3", val: 2 },
                      { label: "Thứ 4", val: 3 },
                      { label: "Thứ 5", val: 4 },
                      { label: "Thứ 6", val: 5 },
                      { label: "Thứ 7", val: 6 },
                      { label: "Chủ Nhật", val: 0 },
                    ].map((day) => {
                      const isSelected = selectedDays.includes(day.val);
                      return (
                        <button
                          type="button"
                          key={day.val}
                          onClick={() => handleToggleDay(day.val)}
                          className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all duration-150 ${
                            isSelected
                              ? "bg-emerald-600 border-emerald-600 text-white shadow-sm font-semibold"
                              : "bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Chọn Playlist phát */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Loại nội dung */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground block">
                  Kiểu nội dung phát
                </label>
                <div className="flex border border-border/80 p-1 bg-muted/30 rounded-xl w-fit gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setValue("scheduleType", "playlist");
                      setValue("selectedTemplateId", "");
                    }}
                    className={`text-xs px-4 py-2 rounded-lg font-medium transition-all ${
                      scheduleType === "playlist"
                        ? "bg-white text-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    Danh sách phát (Playlist)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setValue("scheduleType", "template");
                      setValue("selectedPlaylistId", "");
                    }}
                    className={`text-xs px-4 py-2 rounded-lg font-medium transition-all ${
                      scheduleType === "template"
                        ? "bg-white text-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    Bố cục hiển thị (Template)
                  </button>
                </div>
              </div>

              {/* Danh sách Playlist Card Grid */}
              {scheduleType === "playlist" ? (
                <div className="space-y-2.5">
                  <label className="text-xs font-semibold text-foreground block">
                    Chọn Playlist muốn gán lịch phát *
                  </label>
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-h-[350px] overflow-y-auto pr-1">
                    {playlists.map((pl) => {
                      const isSelected = selectedPlaylistId === pl.id;
                      return (
                        <div
                          key={pl.id}
                          onClick={() => setValue("selectedPlaylistId", pl.id)}
                          className={`p-4.5 border rounded-2xl cursor-pointer transition-all duration-200 flex flex-col justify-between h-[130px] relative overflow-hidden group ${
                            isSelected
                              ? "border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/50 shadow-sm"
                              : "border-border/60 bg-card/50 hover:border-border hover:bg-muted/30"
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex justify-between items-start">
                              <h5 className="text-xs font-semibold text-foreground truncate max-w-[85%]">
                                {pl.playlistName}
                              </h5>
                              {isSelected && (
                                <span className="h-4.5 w-4.5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                                  <Check className="h-3 w-3" />
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                              {pl.description || "Không có mô tả"}
                            </p>
                          </div>
                          <div className="flex items-center justify-between text-[9px] text-muted-foreground border-t border-border/30 pt-2 shrink-0">
                            <span className="bg-muted px-1.5 py-0.5 rounded text-[8px] font-semibold uppercase text-muted-foreground">
                              {pl.isSyncGroup ? "Đồng bộ" : "Đơn lẻ"}
                            </span>
                            <span>
                              {new Date(pl.createdAt).toLocaleDateString("vi-VN")}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {playlists.length === 0 && (
                      <div className="col-span-full py-16 border border-dashed border-border/60 rounded-2xl bg-muted/5 flex flex-col items-center justify-center gap-2">
                        <Layers className="h-6 w-6 text-muted-foreground/30" />
                        <p className="text-xs text-muted-foreground italic">
                          Chưa có Playlist nào.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Danh sách Bố cục layout Card Grid */
                <div className="space-y-2.5">
                  <label className="text-xs font-semibold text-foreground block">
                    Chọn Bố cục hiển thị muốn gán lịch phát *
                  </label>
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-h-[350px] overflow-y-auto pr-1">
                    {templates.map((tpl) => {
                      const isSelected = selectedTemplateId === tpl.id;
                      return (
                        <div
                          key={tpl.id}
                          onClick={() => setValue("selectedTemplateId", tpl.id)}
                          className={`p-4.5 border rounded-2xl cursor-pointer transition-all duration-200 flex flex-col justify-between h-[130px] relative overflow-hidden group ${
                            isSelected
                              ? "border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/50 shadow-sm"
                              : "border-border/60 bg-card/50 hover:border-border hover:bg-muted/30"
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex justify-between items-start">
                              <h5 className="text-xs font-semibold text-foreground truncate max-w-[85%]">
                                {tpl.name}
                              </h5>
                              {isSelected && (
                                <span className="h-4.5 w-4.5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                                  <Check className="h-3 w-3" />
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              Kích thước: {tpl.width}x{tpl.height}
                            </p>
                          </div>
                          <div className="flex items-center justify-between text-[9px] text-muted-foreground border-t border-border/30 pt-2 shrink-0">
                            <span className="bg-muted px-1.5 py-0.5 rounded text-[8px] font-semibold text-muted-foreground">
                              {tpl.zones?.length ?? 0} Vùng
                            </span>
                            <span className="capitalize">{tpl.orientation}</span>
                          </div>
                        </div>
                      );
                    })}
                    {templates.length === 0 && (
                      <div className="col-span-full py-16 border border-dashed border-border/60 rounded-2xl bg-muted/5 flex flex-col items-center justify-center gap-2">
                        <Layout className="h-6 w-6 text-muted-foreground/30" />
                        <p className="text-xs text-muted-foreground italic">
                          Chưa có Bố cục hiển thị nào.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
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