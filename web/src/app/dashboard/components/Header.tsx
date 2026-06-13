import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Activity,
  Image as ImageIcon,
  Tv,
  Users,
  FileText,
  Database,
  Search,
  Sun,
  Moon,
  CircleUser,
  LogOut,
  Menu,
  Calendar
} from 'lucide-react';

import { User, DashboardTab } from '@/types/dashboard';

interface HeaderProps {
  activeTab?: DashboardTab;
  setActiveTab?: (tab: DashboardTab) => void;
  currentUser: User;
  isDarkMode: boolean;
  toggleTheme: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  handleLogout: () => void;
}

export default function Header({
  currentUser,
  isDarkMode,
  toggleTheme,
  searchQuery,
  setSearchQuery,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  handleLogout
}: HeaderProps) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border/30 bg-white backdrop-blur-md px-4 md:px-6 shrink-0 justify-between select-none">
      
      {/* Logo & Mobile Menu Trigger */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="shrink-0 md:hidden h-8 w-8 rounded-lg border-border/60"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <Menu className="h-4 w-4" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
        
        <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
          <img src="/Logo-CDM-transparent.png" alt="CDM Logo" className="h-6 w-auto object-contain" />
          <span className="font-bold tracking-tight text-foreground text-xs">CDM Signage</span>
        </Link>
      </div>

      {/* Mobile Navigation overlay menu (Apple themed) */}
      {isMobileMenuOpen && (
        <div className="absolute top-14 left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border/30 p-4 flex flex-col gap-1.5 shadow-lg z-50 md:hidden animate-in slide-in-from-top-5 duration-200">
          <Link
            href="/dashboard"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
              isActive('/dashboard') && pathname === '/dashboard'
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-muted-foreground hover:bg-muted/50'
            }`}
          >
            <Activity className="h-4 w-4 shrink-0" />
            <span>Tổng quan</span>
          </Link>
          <Link
            href="/dashboard/content"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
              isActive('/dashboard/content') ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted/50'
            }`}
          >
            <ImageIcon className="h-4 w-4 shrink-0" />
            <span>Media Library</span>
          </Link>
          <Link
            href="/dashboard/player"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
              isActive('/dashboard/player') ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted/50'
            }`}
          >
            <Tv className="h-4 w-4 shrink-0" />
            <span>Players</span>
          </Link>
          <Link
            href="/dashboard/schedule"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
              isActive('/dashboard/schedule') ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted/50'
            }`}
          >
            <Calendar className="h-4 w-4 shrink-0" />
            <span>Hẹn giờ phát</span>
          </Link>
          {currentUser.role === 'admin' && (
            <Link
              href="/dashboard/admin"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                isActive('/dashboard/admin') ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted/50'
              }`}
            >
              <Users className="h-4 w-4 shrink-0" />
              <span>Admin Panel</span>
            </Link>
          )}
          <Link
            href="/dashboard/eventlog"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
              isActive('/dashboard/eventlog') ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted/50'
            }`}
          >
            <FileText className="h-4 w-4 shrink-0" />
            <span>Event Log</span>
          </Link>
          <Link
            href="/dashboard/resource"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
              isActive('/dashboard/resource') ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted/50'
            }`}
          >
            <Database className="h-4 w-4 shrink-0" />
            <span>Resources</span>
          </Link>
        </div>
      )}

      {/* Control Tools - Apple Themed Search, Dark Mode, Profile */}
      <div className="flex items-center gap-3.5 w-full justify-end">
        
        {/* Apple Style Search Bar */}
        <div className="relative w-full max-w-[180px] md:max-w-[240px]">
          <Search className="absolute left-2.5 top-1.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Tìm kiếm..."
            className="pl-8 h-7 text-xs bg-muted/40 hover:bg-muted/65 border-none focus-visible:ring-1 focus-visible:ring-primary/50 rounded-lg transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Theme Toggle (minimalist icon button) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="rounded-lg h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/60"
        >
          {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* User profile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-7 w-7 border border-border/40 bg-muted/20 hover:bg-muted/60"
            >
              <CircleUser className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-card/95 backdrop-blur-xl border-border/50 rounded-xl shadow-lg">
            <DropdownMenuLabel className="font-normal p-3">
              <div className="flex flex-col space-y-1">
                <p className="text-xs font-semibold text-foreground">{currentUser.username}</p>
                <p className="text-[10px] text-muted-foreground">{currentUser.email}</p>
              </div>
            </DropdownMenuLabel>
            <DashboardMenuSeparator />
            <DropdownMenuItem className="p-2 text-xs focus:bg-muted/60 text-muted-foreground focus:text-foreground">
              Quyền hạn: <Badge variant="secondary" className="ml-2 font-semibold bg-primary/10 text-primary hover:bg-primary/20 border-none text-[9px] px-2 py-0">{currentUser.role === 'admin' ? 'Admin' : 'User'}</Badge>
            </DropdownMenuItem>
            <DashboardMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile" className="flex items-center w-full cursor-pointer text-muted-foreground focus:text-foreground">
                <CircleUser className="mr-2 h-4 w-4" /> Hồ sơ & PIN bảo mật
              </Link>
            </DropdownMenuItem>
            <DashboardMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-950/50 dark:focus:text-red-400 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function DashboardMenuSeparator() {
  return <DropdownMenuSeparator className="bg-border/20" />;
}
