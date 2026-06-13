'use client';

import React, { useState } from 'react';
import { DashboardProvider, useDashboard } from './context/DashboardContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Toaster from './components/Toaster';
import { DashboardTab } from '@/types/dashboard';

const getActiveTab = (pathname: string): DashboardTab => {
  const segment = pathname.split('/').pop();
  if (segment === 'dashboard') return 'home';
  if (['home', 'content', 'player', 'admin', 'eventlog', 'resource', 'schedule'].includes(segment || '')) {
    return segment as DashboardTab;
  }
  return 'home';
};

// Lucide Icons
import {
  RefreshCw
} from 'lucide-react';

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const {
    currentUser,
    isDarkMode,
    toggleTheme,
    loading,
    searchQuery,
    setSearchQuery,
    handleLogout
  } = useDashboard();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground gap-3">
        <RefreshCw className="h-8 w-8 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium">Đang khởi động hệ thống...</p>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen w-full bg-[#f6f6f6] dark:bg-[#1e1e1e] text-foreground ${isDarkMode ? 'dark' : ''}`}>

      {/* Sidebar navigation */}
      {currentUser && (
        <Sidebar
          activeTab={
            typeof window !== 'undefined'
              ? getActiveTab(window.location.pathname)
              : 'home'
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
              typeof window !== 'undefined'
                ? getActiveTab(window.location.pathname)
                : 'home'
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
                <p className="text-muted-foreground font-medium">Đang tải dữ liệu...</p>
              </div>
            ) : (
              <div className="w-full">
                {children}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </DashboardProvider>
  );
}
