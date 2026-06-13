'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useDashboard } from './context/DashboardContext';
import HomeTab from './components/HomeTab';
import KpiCards from './components/KpiCards';
import { useDevices, useMedia, usePendingDevices, useDeviceLogs } from '@/hooks/useApi';
import { DashboardTab } from '@/types/dashboard';

// Shadcn UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity } from 'lucide-react';

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

  // Render modern skeleton loading matching the final layout shape
  if (localLoading || !currentUser) {
    return (
      <div className="space-y-6 w-full animate-pulse select-none">
        {/* KPI Skeleton (Bento Grid) */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2 h-32 bg-muted/40 rounded-xl border border-border/60" />
          <div className="h-32 bg-muted/40 rounded-xl border border-border/60" />
          <div className="h-32 bg-muted/40 rounded-xl border border-border/60" />
          <div className="h-32 bg-muted/40 rounded-xl border border-border/60" />
        </div>

        {/* Content Skeleton */}
        <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 h-96 bg-muted/30 rounded-xl border border-border/60" />
          <div className="lg:col-span-1 h-96 bg-muted/30 rounded-xl border border-border/60" />
        </div>
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
          <Card className="bg-card border-border/60 shadow-xs h-full flex flex-col select-none">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-4 shrink-0">
              <div>
                <CardTitle className="text-base font-bold text-foreground">Nhật ký hệ thống</CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">Hoạt động realtime từ các màn hình</CardDescription>
              </div>
              <Activity className="h-4 w-4 text-primary shrink-0" />
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto max-h-[600px] p-4 pr-3 space-y-4 scrollbar-thin">
              {eventLogs.slice(0, 10).map((log) => (
                <div key={log.id} className="flex items-start justify-between border-b border-border/40 pb-3 last:border-b-0 last:pb-0 gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{log.deviceName}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{log.detail}</p>
                    <span className="text-[10px] text-muted-foreground/85 block font-mono font-medium">
                      {new Date(log.time).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <Badge className={`shrink-0 text-[9px] font-semibold tracking-wide border-none px-2 py-0.5 rounded-full ${
                    log.status === 'Playback Success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                    log.status === 'Online' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                    log.status === 'Heartbeat' ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  }`}>
                    {log.status}
                  </Badge>
                </div>
              ))}
              {eventLogs.length === 0 && (
                <p className="text-xs text-muted-foreground italic text-center py-12">Không có hoạt động nào được ghi nhận</p>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
