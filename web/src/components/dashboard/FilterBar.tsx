'use client';

import React from 'react';
import { Search, ChevronDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

/**
 * T4: Bỏ filter "phê duyệt" ở Player page.
 * Lý do: tất cả thiết bị hiển thị ở Player page đều đã được admin duyệt
 * (thiết bị pending được xử lý ở Admin Panel). Filter này không còn ý nghĩa
 * cho user thường — chỉ làm rối UI.
 *
 * Trước đây có dropdown "Phê duyệt: Tất cả / Đã duyệt / Chờ duyệt" — đã xoá.
 */
export default function FilterBar({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  onRefresh,
  isRefreshing = false
}: FilterBarProps) {
  return (
    <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-card p-3 rounded-xl border border-border/60 shadow-xs select-none">
      {/* Search Input on the Left */}
      <div className="relative w-full md:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Tìm Player ID, tên thiết bị hoặc địa chỉ IP..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs bg-muted/40 hover:bg-muted/65 border border-border/80 rounded-lg focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary/45 transition-all text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Dropdown filter + Refresh button on the Right */}
      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
        {/* Connection Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 text-xs bg-muted/40 hover:bg-muted/65 border border-border/80 rounded-lg text-foreground focus:outline-hidden focus:border-primary transition-all cursor-pointer font-medium"
          >
            <option value="all">Trạng thái: Tất cả</option>
            <option value="online">Trực tuyến (Online)</option>
            <option value="offline">Ngoại tuyến (Offline)</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        </div>

        {/* Refresh Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="h-8 text-xs border border-border/80 hover:bg-muted/50 rounded-lg font-medium"
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>
    </div>
  );
}
