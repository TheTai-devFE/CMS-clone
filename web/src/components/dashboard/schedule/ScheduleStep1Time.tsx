import React from "react";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon, Clock } from "lucide-react";

export type ScheduleTimeMode = "dateRange" | "daysOfWeek";

interface ScheduleStep1TimeProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  selectedDays: number[];
  handleToggleDay: (day: number) => void;
  scheduleMode: ScheduleTimeMode;
  onChangeScheduleMode: (mode: ScheduleTimeMode) => void;
}

export const ScheduleStep1Time: React.FC<ScheduleStep1TimeProps> = ({
  register,
  errors,
  selectedDays,
  handleToggleDay,
  scheduleMode,
  onChangeScheduleMode,
}) => {
  return (
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
            <p className="text-red-500 text-[10px] mt-1 font-medium">{String(errors.scheduleName.message)}</p>
          )}
        </div>

        {/* Chế độ chọn thời gian hoạt động */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-semibold text-foreground">
            Chế độ chọn thời gian hoạt động
          </label>
          <div className="flex border border-border bg-muted/30 p-0.5 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => onChangeScheduleMode("dateRange")}
              className={`flex-1 py-2 rounded-lg text-center transition-all ${
                scheduleMode === "dateRange"
                  ? "bg-background shadow-xs text-foreground font-bold"
                  : "text-muted-foreground"
              }`}
            >
              Khoảng ngày hoạt động
            </button>
            <button
              type="button"
              onClick={() => onChangeScheduleMode("daysOfWeek")}
              className={`flex-1 py-2 rounded-lg text-center transition-all ${
                scheduleMode === "daysOfWeek"
                  ? "bg-background shadow-xs text-foreground font-bold"
                  : "text-muted-foreground"
              }`}
            >
              Ngày trong tuần
            </button>
          </div>
        </div>

        {/* Chế độ 1: Khoảng ngày chạy */}
        {scheduleMode === "dateRange" && (
          <div className="space-y-3 p-4 border border-border/60 rounded-2xl bg-muted/10 md:col-span-2">
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
                  <p className="text-red-500 text-[9px] mt-1 font-medium">{String(errors.startDate.message)}</p>
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
                  <p className="text-red-500 text-[9px] mt-1 font-medium">{String(errors.endDate.message)}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Chế độ 2: Ngày trong tuần */}
        {scheduleMode === "daysOfWeek" && (
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
            <p className="text-[10px] text-muted-foreground italic pt-1">
              Lịch trình sẽ tự động lặp lại hàng tuần vào các ngày đã chọn, không giới hạn ngày kết thúc.
            </p>
          </div>
        )}

        {/* Khung giờ phát — chỉ có giờ bắt đầu, không có giờ kết thúc (phát liên tục tới hết
            ngày cuối cùng của khoảng thời gian đã chọn ở trên) */}
        <div className="space-y-3 p-4 border border-border/60 rounded-2xl bg-muted/10 md:col-span-2">
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
          </div>
        </div>
      </div>
    </div>
  );
};
