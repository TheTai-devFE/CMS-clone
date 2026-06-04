'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { cookieStorage } from '../../utils/cookie';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('dashboard-theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
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

    setCurrentUser(user);
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    cookieStorage.clearAll();
    router.push('/login');
  };

  if (loading || !currentUser) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '15px' }}>
        <span className="spinner"></span>
        <p>Đang kiểm tra quyền truy cập...</p>
      </div>
    );
  }

  const getActiveTab = () => {
    if (pathname === '/dashboard') return 'home';
    if (pathname.startsWith('/dashboard/content')) return 'content';
    if (pathname.startsWith('/dashboard/player')) return 'player';
    if (pathname.startsWith('/dashboard/admin')) return 'admin';
    if (pathname.startsWith('/dashboard/eventlog')) return 'eventlog';
    if (pathname.startsWith('/dashboard/resource')) return 'resource';
    if (pathname.startsWith('/dashboard/profile')) return 'profile';
    return 'home';
  };

  const activeTab = getActiveTab();

  return (
    <div className={`dashboard ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>
      {/* ====== HEADER VINTAGE ====== */}
      <header className="dash-header-vintage">
        <div className="vintage-logo" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/Logo-CDM-transparent.png" alt="CDM Logo" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} />
          <span>Control Digital Media</span>
        </div>
        <div className="header-profile-wrapper" ref={profileMenuRef}>
          <button className="profile-trigger-btn" onClick={() => setShowUserDropdown(!showUserDropdown)}>
            <div className="profile-avatar-circle">
              {currentUser.username.substring(0, 1).toUpperCase()}
            </div>
            <span className="profile-trigger-name">{currentUser.username}</span>
            <svg className={`profile-trigger-arrow ${showUserDropdown ? 'open' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          {showUserDropdown && (
            <div className="profile-dropdown-menu">
              <div className="dropdown-user-header">
                <div className="dropdown-user-name">{currentUser.username}</div>
                <div className="dropdown-user-email">{currentUser.email}</div>
                <div className="dropdown-user-role-badge">
                  {currentUser.role === 'admin' ? 'SYSTEM ADMIN' : 'USER'}
                </div>
              </div>

              <div className="dropdown-divider"></div>

              <Link href="/dashboard/profile" className="dropdown-item" onClick={() => setShowUserDropdown(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Trang cá nhân (Profile)
              </Link>

              <button className="dropdown-item" onClick={toggleTheme}>
                {isDarkMode ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="5" />
                      <line x1="12" y1="1" x2="12" y2="3" />
                      <line x1="12" y1="21" x2="12" y2="23" />
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                      <line x1="1" y1="12" x2="3" y2="12" />
                      <line x1="21" y1="12" x2="23" y2="12" />
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                    Chế độ sáng (Light Mode)
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                    Chế độ tối (Dark Mode)
                  </>
                )}
              </button>

              <div className="dropdown-divider"></div>

              <button className="dropdown-item logout" onClick={handleLogout}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ====== HORIZONTAL NAV BAR ====== */}
      <div className="dash-nav-horizontal">
        <Link href="/dashboard" className={`nav-item-horiz ${activeTab === 'home' ? 'active' : ''}`}>
          Home
        </Link>
        <Link href="/dashboard/content" className={`nav-item-horiz ${activeTab === 'content' ? 'active' : ''}`}>
          Content
        </Link>
        <Link href="/dashboard/player" className={`nav-item-horiz ${activeTab === 'player' ? 'active' : ''}`}>
          Player
        </Link>
        {currentUser.role === 'admin' && (
          <Link href="/dashboard/admin" className={`nav-item-horiz ${activeTab === 'admin' ? 'active' : ''}`}>
            Admin
          </Link>
        )}
        <Link href="/dashboard/eventlog" className={`nav-item-horiz ${activeTab === 'eventlog' ? 'active' : ''}`}>
          Event Log
        </Link>
        <Link href="/dashboard/resource" className={`nav-item-horiz ${activeTab === 'resource' ? 'active' : ''}`}>
          Resource
        </Link>
      </div>

      {/* ====== MAIN WORKSPACE ====== */}
      <div className="dash-content">
        <div className="homepage-container">
          <div className="homepage-workspace">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
