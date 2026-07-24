'use client';

import React from 'react';
import { Tv, Database, Users, CreditCard, ArrowRight } from 'lucide-react';
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
  const offlineCount = devicesCount - onlineDevicesCount;
  const onlinePercentage = devicesCount > 0 ? Math.round((onlineDevicesCount / devicesCount) * 100) : 0;

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 select-none">
      {/* Ô 1: Màn hình quảng cáo (Asymmetric - Chiếm 2 cột trên màn hình lớn) */}
      <div className="lg:col-span-1 bg-card border border-border/60 rounded-xl p-4 flex flex-col justify-between shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-tight text-muted-foreground uppercase">
            Màn hình quảng cáo (Players)
          </span>
          <Tv className="h-4 w-4 text-muted-foreground" />
        </div>
        
        <div className="my-3 flex items-baseline gap-2.5">
          <span className="text-3xl font-bold tracking-tight text-foreground font-sans">
            {devicesCount}
          </span>
          <span className="text-xs text-muted-foreground">thiết bị liên kết</span>
        </div>

        {/* Visual progress track online/offline */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold">
            <span className="text-emerald-500">{onlineDevicesCount} Trực tuyến</span>
            <span className="text-muted-foreground">{offlineCount} Ngoại tuyến</span>
          </div>
          <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden flex">
            <div 
              className="bg-emerald-500 h-full transition-all duration-500" 
              style={{ width: `${onlinePercentage}%` }}
            />
          
          </div>
        </div>
      </div>

      {/* Ô 2: Tài nguyên Media (Chiếm 1 cột) */}
      <div className="bg-card border border-border/60 rounded-xl p-4 flex flex-col justify-between shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-tight text-muted-foreground uppercase">
            Thư viện Media
          </span>
          <Database className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="my-3">
          <span className="text-2xl font-bold tracking-tight text-foreground font-sans block">
            {mediaCount} files
          </span>
          <span className="text-xs text-muted-foreground mt-0.5 block">
            Dung lượng lưu trữ
          </span>
        </div>

        <div className="text-[11px] font-bold text-foreground bg-muted/20 px-2 py-1 rounded-md border border-border/40 w-fit font-mono">
          {formatBytes(totalMediaSize)}
        </div>
      </div>

      {/* Ô 3: Thiết bị chờ duyệt / Hoạt động (Chiếm 1 cột) */}
      <div className={`border rounded-xl p-4 flex flex-col justify-between shadow-xs transition-all duration-200 ${
        pendingCount > 0 
          ? 'bg-amber-500/5 border-amber-500/20' 
          : 'bg-card border-border/60'
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-tight text-muted-foreground uppercase">
            Chờ phê duyệt
          </span>
          <Users className={`h-4 w-4 ${pendingCount > 0 ? 'text-amber-500' : 'text-muted-foreground'}`} />
        </div>

        <div className="my-3">
          <span className={`text-2xl font-bold tracking-tight font-sans block ${
            pendingCount > 0 ? 'text-amber-500' : 'text-foreground'
          }`}>
            {pendingCount}
          </span>
          <span className="text-xs text-muted-foreground mt-0.5 block">
            thiết bị mới yêu cầu gán
          </span>
        </div>

        {pendingCount > 0 && currentUser.role === 'admin' ? (
          <button 
            onClick={() => setActiveTab('admin')}
            className="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer w-fit"
          >
            Duyệt yêu cầu ngay
            <ArrowRight className="h-3 w-3" />
          </button>
        ) : (
          <div className="text-[11px] font-bold text-emerald-500 bg-emerald-500/5 border border-emerald-500/10 px-2 py-1 rounded-md w-fit">
            Hệ thống ổn định
          </div>
        )}
      </div>

      {/* Ô 4: Hạn mức License (Chiếm 1 cột) */}
      <div className="bg-card border border-border/60 rounded-xl p-4 flex flex-col justify-between shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-tight text-muted-foreground uppercase">
            Hạn mức License
          </span>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="my-3 flex items-baseline justify-between">
          <div>
            <span className="text-2xl font-bold tracking-tight text-foreground font-sans block">
              {currentUser.role === 'admin' ? 'Không giới hạn' : `${currentUser.licenseLimit} máy`}
            </span>
            <span className="text-xs text-muted-foreground mt-0.5 block">
              Màn hình được cấp phép
            </span>
          </div>

          {currentUser.role !== 'admin' && (
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  const event = new CustomEvent('open-payment-modal');
                  window.dispatchEvent(event);
                }
              }}
              className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-md text-xs font-semibold tracking-tight transition-all cursor-pointer"
            >
              + Nạp Slot PayOS
            </button>
          )}
        </div>

        <div className="text-[11px] text-muted-foreground font-semibold flex justify-between items-center">
          <span>
            Đã sử dụng: <span className="text-foreground font-bold font-mono">{devicesCount}</span> slot
          </span>
          {currentUser.purchaseType && (
            <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              {currentUser.purchaseType}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
