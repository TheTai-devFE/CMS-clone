"use client";

import { Button } from "@/components/ui/button";
import { usePlaylists, useTemplates } from "@/hooks/useApi";
import { Device, User } from "@/types/dashboard";
import { Plus, Tv } from "lucide-react";
import { useState } from "react";
import { useDashboard } from "@/app/dashboard/context/DashboardContext";
import BatchActionsBar from "./BatchActionsBar";
import FilterBar from "./FilterBar";
import PlayerTable from "./PlayerTable";
import { ScheduleModal } from "./schedule/ScheduleModal";

interface PlayerTabProps {
  devices: Device[];
  currentUser: User;
  handleDeleteDevice: (id: string, name: string) => void;
  handleEditDevice: (device: Device) => void;
  fetchData: () => void;
  onOpenClaimModal: () => void;
}

export default function PlayerTab({
  devices,
  currentUser,
  handleDeleteDevice,
  handleEditDevice,
  fetchData,
  onOpenClaimModal,
}: PlayerTabProps) {
  const { setError, setSuccessMsg, searchQuery, setSearchQuery } =
    useDashboard();
  const { playlists } = usePlaylists();
  const { templates } = useTemplates();

  // Local state for table filter dropdowns
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [approvalFilter, setApprovalFilter] = useState<string>("all");

  // Local state for batch selection
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Filter devices based on status and approval selections
  const filteredDevices = devices.filter((device) => {
    const matchesStatus =
      statusFilter === "all" || device.status === statusFilter;
    const matchesApproval =
      approvalFilter === "all" || device.approvalStatus === approvalFilter;
    return matchesStatus && matchesApproval;
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError("");
    setSuccessMsg("");
    try {
      await fetchData();
      setSuccessMsg("Đã làm mới danh sách thiết bị phát");
    } catch {
      setError("Không thể làm mới danh sách thiết bị phát");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedDeviceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedDeviceIds.length === filteredDevices.length) {
      setSelectedDeviceIds([]);
    } else {
      setSelectedDeviceIds(filteredDevices.map((d) => d.id));
    }
  };

  const handleClearSelection = () => {
    setSelectedDeviceIds([]);
  };

  // Batch Actions handlers
  const handleMultiSchedule = () => {
    setIsScheduleModalOpen(true);
  };

  const handleRebootDevices = () => {
    if (
      !confirm(
        `Bạn có chắc chắn muốn khởi động lại ${selectedDeviceIds.length} thiết bị đã chọn?`,
      )
    )
      return;
    setError("");
    setSuccessMsg(
      `Đã gửi lệnh khởi động lại (Reboot) tới ${selectedDeviceIds.length} thiết bị.`,
    );
    setSelectedDeviceIds([]);
  };

  const handleVolumeDevices = () => {
    const volume = prompt("Nhập mức âm lượng mong muốn (0 - 100):", "50");
    if (volume === null) return;
    const volNum = parseInt(volume);
    if (isNaN(volNum) || volNum < 0 || volNum > 100) {
      setError("Mức âm lượng không hợp lệ (phải từ 0 đến 100).");
      return;
    }
    setError("");
    setSuccessMsg(
      `Đã gửi lệnh điều chỉnh âm lượng (${volNum}%) tới ${selectedDeviceIds.length} thiết bị.`,
    );
    setSelectedDeviceIds([]);
  };

  const handleInstallApk = () => {
    setError("");
    setSuccessMsg(
      `Đang tiến hành đẩy gói ứng dụng APK mới xuống ${selectedDeviceIds.length} thiết bị.`,
    );
    setSelectedDeviceIds([]);
  };

  const handleUninstallApk = () => {
    if (
      !confirm(
        `Bạn có chắc chắn muốn gỡ cài đặt ứng dụng APK trên ${selectedDeviceIds.length} thiết bị đã chọn?`,
      )
    )
      return;
    setError("");
    setSuccessMsg(
      `Đã gửi lệnh gỡ cài đặt ứng dụng APK tới ${selectedDeviceIds.length} thiết bị.`,
    );
    setSelectedDeviceIds([]);
  };

  const handleRemoveContents = () => {
    if (
      !confirm(
        `CẢNH BÁO: Bạn có chắc chắn muốn xóa TOÀN BỘ nội dung phát trên ${selectedDeviceIds.length} thiết bị đã chọn?`,
      )
    )
      return;
    setError("");
    setSuccessMsg(
      `Đã xóa sạch nội dung phát trên ${selectedDeviceIds.length} thiết bị.`,
    );
    setSelectedDeviceIds([]);
  };

  return (
    <div className="space-y-4">
      {/* Top Header Row with dynamic titles */}
      <div className="flex flex-row items-center justify-between select-none py-1">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Giám sát Players
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Theo dõi tình trạng hoạt động, cấu hình và gửi lệnh tới các màn hình
            quảng cáo.
          </p>
        </div>
        <Button
          onClick={onOpenClaimModal}
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold rounded-lg h-9">
          <Plus className="mr-1.5 h-4 w-4" /> Liên kết thiết bị
        </Button>
      </div>

      {/* Single Row Filter Bar Component */}
      <FilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        approvalFilter={approvalFilter}
        setApprovalFilter={setApprovalFilter}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Main Table or Empty State Component */}
      {filteredDevices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed rounded-xl bg-card border-border/80 gap-3.5 select-none">
          <Tv className="h-10 w-10 text-muted-foreground/50" />
          <div className="text-center flex flex-col items-center gap-1.5">
            <h3 className="font-semibold text-sm text-foreground">
              Không tìm thấy thiết bị phát nào
            </h3>
            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
              Nhập mã kết nối (Pairing Code) từ App Player để bắt đầu liên kết
              thiết bị mới.
            </p>
            <Button
              size="sm"
              onClick={onOpenClaimModal}
              className="bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold rounded-lg mt-2 h-8">
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Liên kết thiết bị ngay
            </Button>
          </div>
        </div>
      ) : (
        <PlayerTable
          devices={filteredDevices}
          selectedDeviceIds={selectedDeviceIds}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          currentUser={currentUser}
          handleEditDevice={handleEditDevice}
          handleDeleteDevice={handleDeleteDevice}
        />
      )}

      {/* Floating Action Toolbar */}
      <BatchActionsBar
        selectedCount={selectedDeviceIds.length}
        onClearSelection={handleClearSelection}
        onMultiSchedule={handleMultiSchedule}
        onReboot={handleRebootDevices}
        onVolume={handleVolumeDevices}
        onInstallApk={handleInstallApk}
        onUninstallApk={handleUninstallApk}
        onRemoveContents={handleRemoveContents}
      />

      {isScheduleModalOpen && (
        <ScheduleModal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          schedule={null}
          playlists={playlists}
          templates={templates}
          deviceIds={selectedDeviceIds}
          onSuccess={() => {
            setSuccessMsg(
              `Đã lập lịch phát hàng loạt cho ${selectedDeviceIds.length} thiết bị thành công.`,
            );
            setSelectedDeviceIds([]);
            setIsScheduleModalOpen(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
