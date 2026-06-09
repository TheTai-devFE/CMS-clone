import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Activity,
  Image as ImageIcon,
  Tv,
  Users,
  FileText,
  Database,
  Calendar
} from 'lucide-react';

import { User, DashboardTab } from '@/types/dashboard';

interface SidebarProps {
  activeTab?: DashboardTab;
  setActiveTab?: (tab: DashboardTab) => void;
  currentUser: User;
}

export default function Sidebar({ currentUser }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(path);
  };

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border/40 bg-card shrink-0 h-screen sticky top-0">
      
      {/* App Logo & Title - Clean original layout */}
      <div className="flex h-14 items-center gap-2 border-b border-border/10 px-6 shrink-0">
        <img src="/Logo-CDM-transparent.png" alt="CDM Logo" className="h-8 w-auto object-contain" />
        <span className="font-bold tracking-tight text-primary text-base">CDM Signage</span>
      </div>
      
      {/* Navigation Menu with increased gap */}
      <nav className="flex-1 flex flex-col gap-3 p-4 overflow-y-auto">
        <Link
          href="/dashboard"
          className={`flex items-center gap-3 px-3 py-2.5 transition-all duration-150 text-sm rounded-lg ${
            isActive('/dashboard') && pathname === '/dashboard'
              ? 'bg-primary text-primary-foreground font-semibold shadow-sm shadow-primary/10'
              : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
          }`}
        >
          <Activity className="size-5 shrink-0" />
          <span>Tổng quan</span>
        </Link>
        
        <Link
          href="/dashboard/content"
          className={`flex items-center gap-3 px-3 py-2.5 transition-all duration-150 text-sm rounded-lg ${
            isActive('/dashboard/content')
              ? 'bg-primary text-primary-foreground font-semibold shadow-sm shadow-primary/10'
              : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
          }`}
        >
          <ImageIcon className="size-5 shrink-0" />
          <span>Media Library</span>
        </Link>
        
        <Link
          href="/dashboard/player"
          className={`flex items-center gap-3 px-3 py-2.5 transition-all duration-150 text-sm rounded-lg ${
            isActive('/dashboard/player')
              ? 'bg-primary text-primary-foreground font-semibold shadow-sm shadow-primary/10'
              : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
          }`}
        >
          <Tv className="size-5 shrink-0" />
          <span>Players</span>
        </Link>

        <Link
          href="/dashboard/schedule"
          className={`flex items-center gap-3 px-3 py-2.5 transition-all duration-150 text-sm rounded-lg ${
            isActive('/dashboard/schedule')
              ? 'bg-primary text-primary-foreground font-semibold shadow-sm shadow-primary/10'
              : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
          }`}
        >
          <Calendar className="size-5 shrink-0" />
          <span>Hẹn giờ phát</span>
        </Link>
        
        {currentUser.role === 'admin' && (
          <Link
            href="/dashboard/admin"
            className={`flex items-center gap-3 px-3 py-2.5 transition-all duration-150 text-sm rounded-lg ${
              isActive('/dashboard/admin')
                ? 'bg-primary text-primary-foreground font-semibold shadow-sm shadow-primary/10'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            }`}
          >
            <Users className="size-5 shrink-0" />
            <span>Admin Panel</span>
          </Link>
        )}
        
        <Link
          href="/dashboard/eventlog"
          className={`flex items-center gap-3 px-3 py-2.5 transition-all duration-150 text-sm rounded-lg ${
            isActive('/dashboard/eventlog')
              ? 'bg-primary text-primary-foreground font-semibold shadow-sm shadow-primary/10'
              : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
          }`}
        >
          <FileText className="size-5 shrink-0" />
          <span>Event Log</span>
        </Link>
        
        <Link
          href="/dashboard/resource"
          className={`flex items-center gap-3 px-3 py-2.5 transition-all duration-150 text-sm rounded-lg ${
            isActive('/dashboard/resource')
              ? 'bg-primary text-primary-foreground font-semibold shadow-sm shadow-primary/10'
              : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
          }`}
        >
          <Database className="size-5 shrink-0" />
          <span>Resources</span>
        </Link>
      </nav>
      
      {/* Sidebar Footer User Info */}
      <div className="p-4 border-t border-border/20 bg-muted/10 shrink-0">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 border border-border/40">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs uppercase">
              {currentUser.username.substring(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{currentUser.username}</p>
            <p className="text-[10px] text-muted-foreground truncate">{currentUser.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
