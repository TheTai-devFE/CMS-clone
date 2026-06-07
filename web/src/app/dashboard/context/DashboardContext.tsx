import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cookieStorage } from '@/utils/cookie';

import { User } from '@/types/dashboard';

interface DashboardContextType {
  currentUser: User | null;
  isDarkMode: boolean;
  toggleTheme: () => void;
  loading: boolean;
  uploading: boolean;
  setUploading: (uploading: boolean) => void;
  error: string;
  setError: (error: string) => void;
  successMsg: string;
  setSuccessMsg: (msg: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleLogout: () => void;
  formatBytes: (bytes: string | number, decimals?: number) => string;
  API_BASE_URL: string;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  useEffect(() => {
    const savedTheme = localStorage.getItem('dashboard-theme');
    if (savedTheme === 'dark') {
      setTimeout(() => {
        setIsDarkMode(true);
      }, 0);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = !isDarkMode;
    setIsDarkMode(nextTheme);
    localStorage.setItem('dashboard-theme', nextTheme ? 'dark' : 'light');
  };

  useEffect(() => {
    const user = cookieStorage.getUserInfo();
    const token = cookieStorage.getAccessToken();

    if (!token || !user) {
      router.push('/login');
      return;
    }

    const timer = setTimeout(() => {
      setCurrentUser(user);
      setLoading(false);
    }, 0);

    return () => clearTimeout(timer);
  }, [router]);

  const handleLogout = () => {
    cookieStorage.clearAll();
    router.push('/login');
  };

  const formatBytes = (bytes: string | number, decimals = 2) => {
    const b = Number(bytes);
    if (b === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return parseFloat((b / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <DashboardContext.Provider value={{
      currentUser,
      isDarkMode,
      toggleTheme,
      loading,
      uploading,
      setUploading,
      error,
      setError,
      successMsg,
      setSuccessMsg,
      searchQuery,
      setSearchQuery,
      handleLogout,
      formatBytes,
      API_BASE_URL
    }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
