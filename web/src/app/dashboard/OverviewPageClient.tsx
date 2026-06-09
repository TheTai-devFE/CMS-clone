'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useDashboard } from './context/DashboardContext';
import HomeTab from './components/HomeTab';
import KpiCards from './components/KpiCards';
import { useDevices, useMedia, usePendingDevices, useDeviceLogs } from '@/hooks/useApi';
import { EventLog, DashboardTab } from '@/types/dashboard';

// Shadcn UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, RefreshCw } from 'lucide-react';

export default function OverviewPageClient() {
  const router = useRouter();
  const { currentUser, searchQuery, formatBytes } = useDashboard();

  // SWR hooks for loading data with caching
  const { devices, isLoading: devicesLoading } = useDevices();
  const { mediaList, isLoading: mediaLoading } = useMedia();
  const isAdmin = currentUser?.role === 'admin';
  const { pendingDevices, isLoading: pendingLoading } = usePendingDevices(isAdmin);
  const { logs: eventLogs, isLoading: logsLoading } = useDeviceLogs();

  const localLoading = devicesLoading || mediaLoading || (isAdmin && pendingLoading) || logsLoading;

  // Filter devices based on search query
  const filteredDevices = devices.filter(d => 
    d.deviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.ipAddress && d.ipAddress.includes(searchQuery)) ||
    (d.macAddress && d.macAddress.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSetActiveTab = (tab: DashboardTab) => {
    if (tab === 'home') {
      router.push('/dashboard');
    } else {
      router.push(`/dashboard/${tab}`);
    }
  };

  const onlineDevicesCount = devices.filter(d => d.status === 'online').length;

  if (localLoading || !currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw className="h-8 w-8 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium">Đang tải dữ liệu tổng quan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* KPI Cards Grid */}
      <KpiCards
        devicesCount={devices.length}
        onlineDevicesCount={onlineDevicesCount}
        mediaCount={mediaList.length}
        totalMediaSize={mediaList.reduce((acc, m) => acc + Number(m.fileSize), 0)}
        pendingCount={pendingDevices.length}
        currentUser={currentUser}
        setActiveTab={handleSetActiveTab}
        formatBytes={formatBytes}
      />

      {/* Main Content & Sidebar Event Log */}
      <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
        
        {/* Left Column (2/3 width) - HomeTab */}
        <div className="lg:col-span-2 space-y-6">
          <HomeTab
            devices={filteredDevices}
            mediaList={mediaList}
            setActiveTab={handleSetActiveTab}
          />
        </div>

        {/* Right Column (1/3 width) - Realtime activity log side panel */}
        <div className="lg:col-span-1">
          <Card className="bg-card border-border shadow-sm h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Nhật ký hệ thống</CardTitle>
                <CardDescription>Hoạt động realtime từ các màn hình</CardDescription>
              </div>
              <Activity className="h-5 w-5 text-primary shrink-0" />
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto max-h-[600px] pr-2 space-y-4">
              {eventLogs.slice(0, 10).map((log) => (
                <div key={log.id} className="flex items-start justify-between border-b border-border/50 pb-3 last:border-b-0 last:pb-0 gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">{log.deviceName}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{log.detail}</p>
                    <span className="text-[10px] text-muted-foreground block">
                      {new Date(log.time).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <Badge className={`shrink-0 text-[10px] ${
                    log.status === 'Playback Success' ? 'bg-emerald-500/10 text-emerald-500 border-none' :
                    log.status === 'Online' ? 'bg-emerald-500/10 text-emerald-500 border-none' :
                    log.status === 'Heartbeat' ? 'bg-sky-500/10 text-sky-500 border-none' : 'bg-amber-500/10 text-amber-500 border-none'
                  }`}>
                    {log.status}
                  </Badge>
                </div>
              ))}
              {eventLogs.length === 0 && (
                <p className="text-sm text-muted-foreground italic text-center py-10">Không có hoạt động nào</p>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
