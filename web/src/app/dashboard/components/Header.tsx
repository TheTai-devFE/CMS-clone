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
  Menu
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
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6 shadow-sm shrink-0 justify-between">
      
      {/* Logo & Mobile Menu Trigger */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="shrink-0 md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
        
        <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
          <img src="/Logo-CDM-transparent.png" alt="CDM Logo" className="h-7 w-auto object-contain" />
          <span className="font-bold tracking-tight text-primary text-sm">CDM CMS</span>
        </Link>
      </div>

      {/* Mobile Navigation overlay menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-card border-b p-4 flex flex-col gap-3 shadow-lg z-50 md:hidden animate-in slide-in-from-top-5 duration-200">
          <Link
            href="/dashboard"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive('/dashboard') && pathname === '/dashboard' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground'}`}
          >
            <Activity className="h-4 w-4 shrink-0" />
            <span>Tổng quan</span>
          </Link>
          <Link
            href="/dashboard/content"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive('/dashboard/content') ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground'}`}
          >
            <ImageIcon className="h-4 w-4 shrink-0" />
            <span>Media Library</span>
          </Link>
          <Link
            href="/dashboard/player"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive('/dashboard/player') ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground'}`}
          >
            <Tv className="h-4 w-4 shrink-0" />
            <span>Players</span>
          </Link>
          {currentUser.role === 'admin' && (
            <Link
              href="/dashboard/admin"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive('/dashboard/admin') ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground'}`}
            >
              <Users className="h-4 w-4 shrink-0" />
              <span>Admin Panel</span>
            </Link>
          )}
          <Link
            href="/dashboard/eventlog"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive('/dashboard/eventlog') ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground'}`}
          >
            <FileText className="h-4 w-4 shrink-0" />
            <span>Event Log</span>
          </Link>
          <Link
            href="/dashboard/resource"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive('/dashboard/resource') ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground'}`}
          >
            <Database className="h-4 w-4 shrink-0" />
            <span>Resources</span>
          </Link>
        </div>
      )}

      {/* Search Input, Theme Toggle, User Profile dropdown */}
      <div className="flex items-center gap-4 w-full justify-end">
        
        {/* Search Bar */}
        <div className="relative w-full max-w-[200px] md:max-w-[300px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Tìm kiếm..."
            className="pl-8 bg-background border-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Theme Toggle */}
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full h-9 w-9 text-muted-foreground hover:text-primary">
          {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        {/* User profile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full border border-border bg-background">
              <CircleUser className="h-5 w-5" />
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-card border-border">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold text-foreground">{currentUser.username}</p>
                <p className="text-xs text-muted-foreground">{currentUser.email}</p>
              </div>
            </DropdownMenuLabel>
            <DashboardMenuSeparator />
            <DropdownMenuItem className="focus:bg-muted text-muted-foreground focus:text-foreground">
              Quyền hạn: <Badge variant="secondary" className="ml-2 font-bold bg-primary/10 text-primary hover:bg-primary/20 border-none">{currentUser.role === 'admin' ? 'System Admin' : 'User'}</Badge>
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

// Subcomponent to wrap Separator to avoid export conflict/custom names
function DashboardMenuSeparator() {
  return <DropdownMenuSeparator className="bg-border" />;
}
