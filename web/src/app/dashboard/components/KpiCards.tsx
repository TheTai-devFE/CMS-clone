import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tv, Database, Users, CreditCard } from 'lucide-react';

import { User, DashboardTab } from '@/types/dashboard';

interface KpiCardsProps {
  devicesCount: number;
  onlineDevicesCount: number;
  mediaCount: number;
  totalMediaSize: number;
  pendingCount: number;
  currentUser: User;
  setActiveTab: (tab: DashboardTab) => void;
  formatBytes: (bytes: string | number) => string;
}

export default function KpiCards({
  devicesCount,
  onlineDevicesCount,
  mediaCount,
  totalMediaSize,
  pendingCount,
  currentUser,
  setActiveTab,
  formatBytes
}: KpiCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Card 1: Devices */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold tracking-tight text-muted-foreground">Màn hình quảng cáo</CardTitle>
          <Tv className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{devicesCount}</div>
          <p className="text-xs text-muted-foreground mt-1">
            <span className="text-emerald-500 font-semibold">{onlineDevicesCount} trực tuyến</span> / {devicesCount - onlineDevicesCount} ngoại tuyến
          </p>
        </CardContent>
      </Card>

      {/* Card 2: Media */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold tracking-tight text-muted-foreground">Tài nguyên Media</CardTitle>
          <Database className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{mediaCount} files</div>
          <p className="text-xs text-muted-foreground mt-1">
            Tổng dung lượng: {formatBytes(totalMediaSize)}
          </p>
        </CardContent>
      </Card>

      {/* Card 3: Pending Devices */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold tracking-tight text-muted-foreground">Thiết bị chờ duyệt</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{pendingCount}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {pendingCount > 0 && currentUser.role === 'admin' ? (
              <span className="text-amber-500 font-semibold cursor-pointer" onClick={() => setActiveTab('admin')}>Cần duyệt ngay &rarr;</span>
            ) : (
              "Hệ thống ổn định"
            )}
          </p>
        </CardContent>
      </Card>

      {/* Card 4: License Limit */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold tracking-tight text-muted-foreground">Hạn mức License</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {currentUser.role === 'admin' ? "Vô hạn" : `${currentUser.licenseLimit} máy`}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Đã cấp phép gán: {devicesCount} màn hình
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
