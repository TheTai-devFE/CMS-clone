import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  RefreshCw,
  Layers,
  Calendar,
  Plus,
  X,
  Check,
  Loader2
} from 'lucide-react';
import { useDevices, useTemplates } from '@/hooks/useApi';
import { api } from '@/utils/api';
import { Playlist, Schedule } from '@/types/dashboard';

interface ResourceTabProps {
  playlists: Playlist[];
  schedules: Schedule[];
  fetchData: () => void;
}

export default function ResourceTab({ playlists, schedules, fetchData }: ResourceTabProps) {
  // SWR hooks for dropdowns/checkboxes selection
  const { devices } = useDevices();
  const { templates } = useTemplates();

  // Modal State for Schedule
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleName, setScheduleName] = useState('');
  const [scheduleType, setScheduleType] = useState<'playlist' | 'template'>('playlist');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('00:00:00');
  const [endTime, setEndTime] = useState('23:59:59');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 0]); // Mặc định cả tuần
  const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  // ==========================================
  // SCHEDULE LOGIC
  // ==========================================
  const handleToggleDevice = (deviceId: string) => {
    setSelectedDeviceIds(prev =>
      prev.includes(deviceId) ? prev.filter(id => id !== deviceId) : [...prev, deviceId]
    );
  };

  const handleToggleDay = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleName.trim()) {
      setScheduleError('Vui lòng nhập tên lịch trình');
      return;
    }
    if (scheduleType === 'playlist' && !selectedPlaylistId) {
      setScheduleError('Vui lòng chọn Playlist phát');
      return;
    }
    if (scheduleType === 'template' && !selectedTemplateId) {
      setScheduleError('Vui lòng chọn Bố cục phát');
      return;
    }
    if (selectedDeviceIds.length === 0) {
      setScheduleError('Vui lòng chọn ít nhất một thiết bị');
      return;
    }
    if (!startDate || !endDate) {
      setScheduleError('Vui lòng nhập đầy đủ ngày chạy lịch');
      return;
    }

    try {
      setIsSubmittingSchedule(true);
      setScheduleError(null);

      await api.post('/api/schedules', {
        scheduleName: scheduleName.trim(),
        playlistId: scheduleType === 'playlist' ? selectedPlaylistId : undefined,
        templateId: scheduleType === 'template' ? selectedTemplateId : undefined,
        deviceIds: selectedDeviceIds,
        startDate,
        endDate,
        startTime: startTime.includes(':') && startTime.split(':').length === 2 ? `${startTime}:00` : startTime,
        endTime: endTime.includes(':') && endTime.split(':').length === 2 ? `${endTime}:59` : endTime,
        dayOfWeek: selectedDays
      });

      fetchData();
      setIsScheduleModalOpen(false);
      // Reset form
      setScheduleName('');
      setScheduleType('playlist');
      setSelectedPlaylistId('');
      setSelectedTemplateId('');
      setSelectedDeviceIds([]);
      setStartDate('');
      setEndDate('');
      setStartTime('00:00:00');
      setEndTime('23:59:59');
      setSelectedDays([1, 2, 3, 4, 5, 6, 0]);
    } catch (error) {
      const err = error as Error;
      setScheduleError(err.message || 'Có lỗi xảy ra khi tạo Lịch trình');
    } finally {
      setIsSubmittingSchedule(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Playlists Card */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary shrink-0" />
              Danh sách Playlist ({playlists.length})
            </CardTitle>
            <CardDescription>Cấu hình nhóm phát và trình chiếu đồng bộ</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={fetchData} className="border-border">
              <RefreshCw className="mr-2 h-4 w-4 animate-hover" /> Làm mới
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {playlists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 border border-dashed border-border rounded-xl bg-muted/5 gap-3">
              <Layers className="h-10 w-10 text-muted-foreground/60" />
              <p className="text-sm text-muted-foreground italic">Chưa tạo Playlist nào trên hệ thống.</p>
              <p className="text-xs text-muted-foreground">Vui lòng chuyển sang tab <strong>Nội dung &gt; Danh sách phát</strong> để thiết kế.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>Tên Playlist</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Kiểu đồng bộ</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {playlists.map((pl) => (
                  <TableRow key={pl.id} className="border-border hover:bg-muted/30">
                    <TableCell className="font-semibold text-primary">{pl.playlistName}</TableCell>
                    <TableCell className="max-w-[300px] truncate text-muted-foreground">{pl.description || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`border-none font-medium ${
                        pl.isSyncGroup ? 'bg-indigo-500/10 text-indigo-500' : 'bg-emerald-500/10 text-emerald-500'
                      }`}>
                        {pl.isSyncGroup ? 'Đồng bộ nhóm' : 'Đơn lẻ'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{new Date(pl.createdAt).toLocaleString('vi-VN')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Schedules Card */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Calendar className="h-5 w-5 text-pink-500 shrink-0" />
              Lịch trình phát sóng (Play Schema - {schedules.length})
            </CardTitle>
            <CardDescription>Lập lịch thời gian phát playlist tự động trên các thiết bị</CardDescription>
          </div>
          <Button
            onClick={() => setIsScheduleModalOpen(true)}
            className="bg-pink-500 hover:bg-pink-600 text-white font-medium shadow-sm transition-all duration-200"
          >
            <Plus className="mr-2 h-4 w-4" /> Lập lịch phát
          </Button>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 border border-dashed border-border rounded-xl bg-muted/5 gap-3">
              <Calendar className="h-10 w-10 text-muted-foreground/60" />
              <p className="text-sm text-muted-foreground italic">Chưa lập lịch phát nào.</p>
              <Button onClick={() => setIsScheduleModalOpen(true)} variant="link" className="text-pink-500 p-0 h-auto font-medium">
                Tạo lịch trình phát đầu tiên ngay
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>Tên lịch trình</TableHead>
                  <TableHead>Nội dung phát</TableHead>
                  <TableHead>Thời gian chạy</TableHead>
                  <TableHead>Khung giờ</TableHead>
                  <TableHead>Ngày trong tuần</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((sc) => (
                  <TableRow key={sc.id} className="border-border hover:bg-muted/30">
                    <TableCell className="font-semibold text-pink-500">{sc.scheduleName}</TableCell>
                    <TableCell className="text-xs">
                      {sc.playlist ? (
                        <span className="bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded font-medium">
                          Playlist: {sc.playlist.playlistName}
                        </span>
                      ) : sc.template ? (
                        <span className="bg-indigo-500/10 text-indigo-500 px-2 py-1 rounded font-medium">
                          Bố cục: {sc.template.name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(sc.startDate).toLocaleDateString('vi-VN')} &rarr; {new Date(sc.endDate).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell className="font-medium text-xs text-foreground bg-muted/30 px-2 py-1 rounded w-fit inline-block mt-2">
                      {sc.startTime} - {sc.endTime}
                    </TableCell>
                    <TableCell>
                      {sc.dayOfWeek && sc.dayOfWeek.length > 0 ? (
                        <Badge variant="secondary" className="bg-muted text-muted-foreground border-none font-normal">
                          Thứ {sc.dayOfWeek.map((d: number) => d === 0 ? 'CN' : d + 1).join(', ')}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-none">Cả tuần</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ==========================================
          MODAL LẬP LỊCH TRÌNH MỚI (Glassmorphism UI)
          ========================================== */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in scale-in duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between bg-muted/20">
              <div>
                <h3 className="text-lg font-bold text-foreground">Lập Lịch Trình Phát</h3>
                <p className="text-xs text-muted-foreground">Cấu hình lịch chạy tự động Playlist trên các màn hình</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsScheduleModalOpen(false)} className="rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleCreateSchedule} className="flex-1 overflow-y-auto p-6 space-y-6">
              {scheduleError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm px-4 py-3 rounded-lg font-medium">
                  {scheduleError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Schedule name */}
                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-semibold text-foreground">Tên Lịch Trình *</label>
                  <Input
                    placeholder="VD: Lịch phát sáng thứ 2-6"
                    value={scheduleName}
                    onChange={(e) => setScheduleName(e.target.value)}
                    required
                  />
                </div>

                {/* Schedule Type Selection */}
                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-semibold text-foreground block">Nội dung phát áp dụng</label>
                  <div className="flex border border-border p-1 bg-muted/20 rounded-md w-fit gap-1">
                    <button
                      type="button"
                      onClick={() => setScheduleType('playlist')}
                      className={`text-xs px-3 py-1.5 rounded font-semibold transition-all ${
                        scheduleType === 'playlist' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted/40'
                      }`}
                    >
                      Danh sách phát (Playlist)
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleType('template')}
                      className={`text-xs px-3 py-1.5 rounded font-semibold transition-all ${
                        scheduleType === 'template' ? 'bg-indigo-600 text-white shadow-sm' : 'text-muted-foreground hover:bg-muted/40'
                      }`}
                    >
                      Bố cục hiển thị (Layout Template)
                    </button>
                  </div>
                </div>

                {/* Playlist or Template selection dropdown */}
                {scheduleType === 'playlist' ? (
                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-semibold text-foreground">Chọn Playlist Phát *</label>
                    <select
                      value={selectedPlaylistId}
                      onChange={(e) => setSelectedPlaylistId(e.target.value)}
                      required
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="">-- Chọn Playlist --</option>
                      {playlists.map(pl => (
                        <option key={pl.id} value={pl.id}>{pl.playlistName} {pl.isSyncGroup ? '(Đồng bộ)' : '(Đơn lẻ)'}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-semibold text-foreground">Chọn Bố cục phát *</label>
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => setSelectedTemplateId(e.target.value)}
                      required
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="">-- Chọn Bố cục layout --</option>
                      {templates.map(tpl => (
                        <option key={tpl.id} value={tpl.id}>{tpl.name} ({tpl.width}x{tpl.height} - {tpl.zones?.length ?? 0} vùng)</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-border pt-6">
                {/* Date range picker */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-foreground">Thời gian chạy lịch</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Từ ngày *</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Đến ngày *</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Giờ bắt đầu</label>
                      <input
                        type="time"
                        step="1"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Giờ kết thúc</label>
                      <input
                        type="time"
                        step="1"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>
                  </div>

                  {/* Day of Week */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground block">Các ngày áp dụng trong tuần</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: 'T2', val: 1 },
                        { label: 'T3', val: 2 },
                        { label: 'T4', val: 3 },
                        { label: 'T5', val: 4 },
                        { label: 'T6', val: 5 },
                        { label: 'T7', val: 6 },
                        { label: 'CN', val: 0 }
                      ].map((day) => {
                        const isSelected = selectedDays.includes(day.val);
                        return (
                          <button
                            type="button"
                            key={day.val}
                            onClick={() => handleToggleDay(day.val)}
                            className={`h-8 w-8 rounded-full border text-xs font-semibold flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-pink-500 border-pink-500 text-white shadow-sm'
                                : 'bg-background border-border text-muted-foreground hover:bg-muted/30'
                            }`}
                          >
                            {day.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Device selection checkboxes */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-foreground">Chọn Thiết Bị Phát ({devices.length})</h4>
                    {devices.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedDeviceIds.length === devices.length) {
                            setSelectedDeviceIds([]);
                          } else {
                            setSelectedDeviceIds(devices.map(d => d.id));
                          }
                        }}
                        className="text-xs font-medium text-pink-500 hover:text-pink-600 focus:outline-none"
                      >
                        {selectedDeviceIds.length === devices.length ? 'Bỏ chọn hết' : 'Chọn tất cả'}
                      </button>
                    )}
                  </div>
                  <div className="border border-border rounded-lg overflow-y-auto max-h-[220px] divide-y divide-border bg-card pr-1">
                    {devices.map((device) => {
                      const isSelected = selectedDeviceIds.includes(device.id);
                      return (
                        <div
                          key={device.id}
                          onClick={() => handleToggleDevice(device.id)}
                          className={`flex items-center justify-between p-3 cursor-pointer transition-all duration-150 ${
                            isSelected ? 'bg-pink-500/5 border-l-4 border-pink-500' : 'hover:bg-muted/30'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <p className="text-xs font-semibold text-foreground">{device.deviceName}</p>
                            <span className="text-[10px] text-muted-foreground block">
                              IP: {device.ipAddress || '—'} &bull; OS: {device.osVersion || '—'}
                            </span>
                          </div>
                          <div className={`h-5 w-5 rounded border flex items-center justify-center transition-all ${
                            isSelected ? 'bg-pink-500 border-pink-500 text-white' : 'border-border'
                          }`}>
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                        </div>
                      );
                    })}
                    {devices.length === 0 && (
                      <p className="text-xs text-muted-foreground italic text-center py-8">Chưa có thiết bị nào</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="border-t border-border pt-6 flex justify-end gap-3 bg-card sticky bottom-0">
                <Button type="button" variant="outline" onClick={() => setIsScheduleModalOpen(false)}>
                  Hủy bỏ
                </Button>
                <Button type="submit" disabled={isSubmittingSchedule} className="bg-pink-500 hover:bg-pink-600 text-white font-semibold">
                  {isSubmittingSchedule ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang lưu...
                    </>
                  ) : (
                    'Lưu Lịch Trình'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
