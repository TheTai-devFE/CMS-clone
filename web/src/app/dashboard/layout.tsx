'use client';

import React, { useState } from 'react';
import { DashboardProvider, useDashboard } from './context/DashboardContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { DashboardTab } from '@/types/dashboard';

const getActiveTab = (pathname: string): DashboardTab => {
  const segment = pathname.split('/').pop();
  if (segment === 'dashboard') return 'home';
  if (['home', 'content', 'player', 'admin', 'eventlog', 'resource'].includes(segment || '')) {
    return segment as DashboardTab;
  }
  return 'home';
};

// Shadcn UI Components
import { Button } from "@/components/ui/button";

// Lucide Icons
import {
  X,
  AlertCircle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const {
    currentUser,
    isDarkMode,
    toggleTheme,
    loading,
    error,
    setError,
    successMsg,
    setSuccessMsg,
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
    <div className={`flex min-h-screen w-full bg-background text-foreground ${isDarkMode ? 'dark' : ''}`}>
      
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
      <div className="flex-1 flex flex-col min-w-0">
        
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
          <main className="p-4 md:p-8 w-full mx-auto space-y-6">
            
            {/* Global Alerts */}
            {(error || successMsg) && (
              <div className="space-y-3">
                {error && (
                  <div className="flex items-center justify-between p-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-red-950/20 dark:text-red-400 border border-red-200 dark:border-red-900/50 animate-in fade-in slide-in-from-top-1 duration-200" role="alert">
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2 shrink-0" />
                      <span>{error}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setError('')} className="h-6 w-6 rounded-full text-red-800 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {successMsg && (
                  <div className="flex items-center justify-between p-4 text-sm text-green-800 rounded-lg bg-green-50 dark:bg-green-950/20 dark:text-green-400 border border-green-200 dark:border-green-900/50 animate-in fade-in slide-in-from-top-1 duration-200" role="alert">
                    <div className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 shrink-0" />
                      <span>{successMsg}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setSuccessMsg('')} className="h-6 w-6 rounded-full text-green-800 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}

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
