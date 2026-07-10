"use client";

import { useDevices } from "@/hooks/useApi";
import { DashboardTab } from "@/types/dashboard";
import React, { useState } from "react";
import Header from "@/components/dashboard/Header";
import Sidebar from "@/components/dashboard/Sidebar";
import Toaster from "@/components/dashboard/Toaster";
import { DashboardProvider, useDashboard } from "./context/DashboardContext";

const getActiveTab = (pathname: string): DashboardTab => {
  const segment = pathname.split("/").pop();
  if (segment === "dashboard") return "home";
  if (
    [
      "home",
      "content",
      "player",
      "admin",
      "eventlog",
      "resource",
      "schedule",
    ].includes(segment || "")
  ) {
    return segment as DashboardTab;
  }
  return "home";
};

// Lucide Icons
import { RefreshCw } from "lucide-react";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const {
    currentUser,
    isDarkMode,
    toggleTheme,
    loading,
    searchQuery,
    setSearchQuery,
    handleLogout,
  } = useDashboard();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { devices } = useDevices();

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground gap-3">
        <RefreshCw className="h-8 w-8 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium">
          Đang khởi động hệ thống...
        </p>
      </div>
    );
  }

  const syncingDevices = devices.filter(
    (d) => d.status === "online" && d.syncStatus === "syncing",
  );

  return (
    <div
      className={`flex min-h-screen w-full bg-[#f6f6f6] dark:bg-[#1e1e1e] text-foreground ${isDarkMode ? "dark" : ""}`}>
      {/* Sidebar navigation */}
      {currentUser && (
        <Sidebar
          activeTab={
            typeof window !== "undefined"
              ? getActiveTab(window.location.pathname)
              : "home"
          }
          setActiveTab={() => {}} // Next.js links inside Sidebar will handle route changes
          currentUser={currentUser}
        />
      )}

      {/* Main Workspace wrapper */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f6f6f6] dark:bg-[#1e1e1e]">
        {/* Header bar */}
        {currentUser && (
          <Header
            activeTab={
              typeof window !== "undefined"
                ? getActiveTab(window.location.pathname)
                : "home"
            }
            setActiveTab={() => {}} // Next.js links inside Header will handle route changes
            currentUser={currentUser}
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
            handleLogout={handleLogout}
          />
        )}

        {/* Workspace scrollable view */}
        <div className="flex-1 overflow-y-auto">
          <main className="p-6 md:p-8 w-full mx-auto space-y-6">
            {/* Toaster notifications */}
            <Toaster />

            {loading ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                <p className="text-muted-foreground font-medium">
                  Đang tải dữ liệu...
                </p>
              </div>
            ) : (
              <div className="w-full">{children}</div>
            )}
          </main>
        </div>
      </div>

      {/* Global Realtime Syncing Indicator (Bottom Right) */}
      {syncingDevices.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-80 bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl p-4 flex flex-col gap-3 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500"></span>
              </span>
              <span className="text-xs font-semibold tracking-wide uppercase text-sky-400">
                Đang đồng bộ thiết bị
              </span>
            </div>
            <RefreshCw className="h-3.5 w-3.5 text-slate-400 animate-spin" />
          </div>
          <div className="space-y-3 max-h-40 overflow-y-auto pr-0.5">
            {syncingDevices.map((device) => (
              <div
                key={device.id}
                className="space-y-1.5 border-b border-slate-800/80 pb-2.5 last:border-0 last:pb-0">
                <div className="flex justify-between items-center text-xs">
                  <span
                    className="font-semibold text-slate-200 truncate max-w-[170px]"
                    title={device.deviceName}>
                    📺 {device.deviceName}
                  </span>
                  <span className="font-mono text-sky-400 font-bold">
                    {device.syncProgress || 0}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${device.syncProgress || 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </DashboardProvider>
  );
}
