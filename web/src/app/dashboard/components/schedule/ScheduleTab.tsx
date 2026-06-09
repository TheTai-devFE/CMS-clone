import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { useTemplates } from "@/hooks/useApi";
import { api } from "@/utils/api";
import { Playlist, Schedule } from "@/types/dashboard";
import { ScheduleItem } from "./ScheduleItem";
import { ScheduleModal } from "./ScheduleModal";

interface ScheduleTabProps {
  playlists: Playlist[];
  schedules: Schedule[];
  fetchData: () => void;
}

export default function ScheduleTab({
  playlists,
  schedules,
  fetchData,
}: ScheduleTabProps) {
  const { templates } = useTemplates();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedScheduleForEdit, setSelectedScheduleForEdit] = useState<Schedule | null>(null);

  // Realtime clock for schedule status indicator
  const [currentTimeTick, setCurrentTimeTick] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeTick(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const isScheduleActive = (sc: Schedule) => {
    try {
      const today = new Date(
        currentTimeTick.getFullYear(),
        currentTimeTick.getMonth(),
        currentTimeTick.getDate()
      );
      const sDate = new Date(sc.startDate);
      const eDate = new Date(sc.endDate);

      const sDateZero = new Date(
        sDate.getFullYear(),
        sDate.getMonth(),
        sDate.getDate()
      );
      const eDateZero = new Date(
        eDate.getFullYear(),
        eDate.getMonth(),
        eDate.getDate()
      );

      if (today < sDateZero || today > eDateZero) return false;

      const currentDay = currentTimeTick.getDay();
      if (
        sc.dayOfWeek &&
        sc.dayOfWeek.length > 0 &&
        !sc.dayOfWeek.includes(currentDay)
      ) {
        return false;
      }

      const hours = String(currentTimeTick.getHours()).padStart(2, "0");
      const minutes = String(currentTimeTick.getMinutes()).padStart(2, "0");
      const seconds = String(currentTimeTick.getSeconds()).padStart(2, "0");
      const currentTimeStr = `${hours}:${minutes}:${seconds}`;

      if (sc.startTime && currentTimeStr < sc.startTime) return false;
      if (sc.endTime && currentTimeStr > sc.endTime) return false;

      return true;
    } catch {
      return false;
    }
  };

  const isScheduleExpired = (sc: Schedule) => {
    try {
      const today = new Date(
        currentTimeTick.getFullYear(),
        currentTimeTick.getMonth(),
        currentTimeTick.getDate()
      );
      const eDate = new Date(sc.endDate);
      const eDateZero = new Date(
        eDate.getFullYear(),
        eDate.getMonth(),
        eDate.getDate()
      );
      return today > eDateZero;
    } catch {
      return false;
    }
  };

  const handleOpenCreate = () => {
    setSelectedScheduleForEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (schedule: Schedule) => {
    setSelectedScheduleForEdit(schedule);
    setIsModalOpen(true);
  };

  const handleDeleteSchedule = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa Lịch trình phát: ${name}?`)) return;

    try {
      await api.delete(`/api/schedules/${id}`);
      fetchData();
    } catch (error) {
      const err = error as Error;
      alert(err.message || "Lỗi khi xóa lịch trình");
    }
  };

  return (
    <div className="space-y-6 mx-auto font-sans antialiased text-foreground">
      {/* Header section - Phong cách Apple tối giản, sang trọng */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/40">
        <div className="space-y-1">
          <h3 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            Hẹn giờ phát
          </h3>
          <p className="text-xs text-muted-foreground font-medium">
            Lập lịch trình phát tự động trên các thiết bị hiển thị
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-[0_2px_8px_rgba(16,185,129,0.15)] transition-all duration-200 rounded-xl px-4 py-2.5 text-xs"
        >
          <Plus className="mr-1.5 h-4 w-4" /> Lập lịch phát
        </Button>
      </div>

      {/* Grid Cards của Schedules - Apple Style */}
      <div className="space-y-4">
        {schedules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 border border-border/30 rounded-2xl bg-card/20 backdrop-blur-md gap-4">
            <div className="h-12 w-12 rounded-full bg-emerald-500/5 flex items-center justify-center border border-emerald-500/10">
              <CalendarIcon className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-foreground">
                Không có lịch phát
              </p>
              <p className="text-xs text-muted-foreground max-w-[280px]">
                Bắt đầu lập lịch phát đầu tiên cho playlist của bạn.
              </p>
            </div>
            <Button
              onClick={handleOpenCreate}
              variant="outline"
              className="mt-2 border-border/80 hover:bg-muted text-foreground text-xs font-semibold rounded-xl"
            >
              Lập lịch phát đầu tiên
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {schedules.map((sc) => (
              <ScheduleItem
                key={sc.id}
                schedule={sc}
                isScheduleActive={isScheduleActive}
                isScheduleExpired={isScheduleExpired}
                onEdit={handleOpenEdit}
                onDelete={handleDeleteSchedule}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal Wizard Lập/Sửa lịch phát */}
      {isModalOpen && (
        <ScheduleModal
          key={selectedScheduleForEdit ? selectedScheduleForEdit.id : "new-schedule"}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          schedule={selectedScheduleForEdit}
          playlists={playlists}
          templates={templates}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
