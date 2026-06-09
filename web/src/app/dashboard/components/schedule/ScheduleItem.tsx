"use client";

import { Button } from "@/components/ui/button";
import { Schedule } from "@/types/dashboard";
import {
  CalendarIcon,
  Clock,
  Edit,
  Layers,
  Layout,
  Trash2,
} from "lucide-react";

interface IScheduleItemProps {
  schedule: Schedule;
  isScheduleActive: (schedule: Schedule) => boolean;
  isScheduleExpired: (schedule: Schedule) => boolean;
  onEdit: (schedule: Schedule) => void;
  onDelete: (id: string, name: string) => void;
}

export const ScheduleItem = ({
  schedule,
  isScheduleActive,
  isScheduleExpired,
  onEdit,
  onDelete,
}: IScheduleItemProps) => {
  const active = isScheduleActive(schedule);
  const expired = isScheduleExpired(schedule);
  const devNames =
    (
      schedule as { devices?: Array<{ device: { deviceName: string } }> }
    ).devices?.map((d) => d.device.deviceName) || [];

  return (
    <div
      className={`group overflow-hidden rounded-2xl border transition-all duration-300 p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 ${
        active
          ? "bg-white border-emerald-500/30 shadow-[0_4px_20px_rgba(16,185,129,0.04)]"
          : expired
          ? "bg-card/30 border-border/20 opacity-60"
          : "bg-white border-border/40 hover:bg-card hover:border-border transition-all shadow-[0_2px_8px_rgba(0,0,0,0.01)]"
      }`}
    >
      {/* Cột 1: Trạng thái & Tên lịch trình */}
      <div className="space-y-2 min-w-[220px] max-w-[320px]">
        <div className="flex items-center gap-2">
          {active ? (
            <span className="bg-emerald-500/10 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-1 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              Đang hoạt động
            </span>
          ) : expired ? (
            <span className="bg-muted text-muted-foreground text-[10px] px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-1 border border-border/40">
              Hết hiệu lực
            </span>
          ) : (
            <span className="bg-secondary text-muted-foreground text-[10px] px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-1 border border-border/30">
              Chờ kích hoạt
            </span>
          )}
        </div>
        <h5
          className="font-semibold text-sm tracking-tight text-foreground transition-colors truncate"
          title={schedule.scheduleName}
        >
          {schedule.scheduleName}
        </h5>
      </div>

      {/* Cột 2: Nội dung phát (Playlist/Template) */}
      <div className="space-y-1">
        <span className="text-[10px] font-medium text-muted-foreground tracking-tight block">
          Nội dung phát
        </span>
        <div>
          {schedule.playlist ? (
            <div className="inline-flex items-center gap-1.5 text-xs text-foreground font-medium">
              <Layers className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span>{schedule.playlist.playlistName}</span>
            </div>
          ) : schedule.template ? (
            <div className="inline-flex items-center gap-1.5 text-xs text-foreground font-medium">
              <Layout className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span>{schedule.template.name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground italic text-xs">
              Không có nội dung
            </span>
          )}
        </div>
      </div>

      {/* Cột 3: Khung giờ chạy */}
      <div className="space-y-1">
        <span className="text-[10px] font-medium text-muted-foreground tracking-tight block">
          Khung giờ phát
        </span>
        <div className="space-y-0.5 text-xs font-medium text-foreground">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span>
              {new Date(schedule.startDate).toLocaleDateString("vi-VN")} &rarr;{" "}
              {new Date(schedule.endDate).toLocaleDateString("vi-VN")}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span>
              {schedule.startTime} - {schedule.endTime}
            </span>
          </div>
        </div>
      </div>

      {/* Cột 4: Ngày trong tuần */}
      <div className="space-y-1">
        <span className="text-[10px] font-medium text-muted-foreground tracking-tight block">
          Ngày áp dụng
        </span>
        <div className="flex gap-1.5">
          {[
            { label: "T2", val: 1 },
            { label: "T3", val: 2 },
            { label: "T4", val: 3 },
            { label: "T5", val: 4 },
            { label: "T6", val: 5 },
            { label: "T7", val: 6 },
            { label: "CN", val: 0 },
          ].map((day) => {
            const isSelected = schedule.dayOfWeek?.includes(day.val);
            if(!isSelected) return null;
            return (
              <span
                key={day.val}
                className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-semibold transition-all ${
                  isSelected
                    ? "bg-emerald-500/10 text-emerald-700 font-bold border border-emerald-500/20"
                    : "bg-transparent text-muted-foreground/30 border border-transparent"
                }`}
              >
                {day.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Cột 5: Thiết bị phát */}
      <div className="space-y-1 min-w-[120px] max-w-[160px]">
        <span className="text-[10px] font-medium text-muted-foreground tracking-tight block">
          Thiết bị ({devNames.length})
        </span>
        {devNames.length > 0 ? (
          <div className="flex flex-wrap gap-1 max-h-[36px] overflow-y-auto pr-1">
            {devNames.map((dName, idx) => (
              <span
                key={idx}
                className="text-[9px] px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border/20 font-medium"
              >
                {dName}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-red-500/80 italic text-[11px] font-medium flex items-center gap-1">
            Chưa có thiết bị
          </span>
        )}
      </div>

      {/* Cột 6: Nút hành động */}
      <div className="flex items-center gap-1 self-end md:self-center border-t border-border/20 pt-3 md:pt-0 md:border-none">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(schedule)}
          className="h-8 w-8 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/5 rounded-lg transition-colors"
          title="Sửa"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(schedule.id, schedule.scheduleName)}
          className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-500/5 rounded-lg transition-colors"
          title="Xóa"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
