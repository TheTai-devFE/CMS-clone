'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Tv, Settings, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User, Device } from '@/types/dashboard';

interface PlayerTableProps {
  devices: Device[];
  selectedDeviceIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  currentUser: User;
  handleEditDevice: (device: Device) => void;
  handleDeleteDevice: (id: string, name: string) => void;
}

export default function PlayerTable({
  devices,
  selectedDeviceIds,
  onToggleSelect,
  onToggleSelectAll,
  currentUser,
  handleEditDevice,
  handleDeleteDevice
}: PlayerTableProps) {
  const isAllSelected = devices.length > 0 && selectedDeviceIds.length === devices.length;

  // Variants for staggered entrance animation
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 180, damping: 20 } }
  };

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border/60 bg-card select-none">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-border/50 bg-muted/20 text-xs font-semibold text-muted-foreground">
            {/* Checkbox Column */}
            <th className="p-3 w-10 text-center">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={onToggleSelectAll}
                className="h-3.5 w-3.5 rounded-sm border-border text-primary focus:ring-primary/45 cursor-pointer accent-teal-600 dark:accent-teal-500"
              />
            </th>
            <th className="p-3 font-semibold w-[220px]">Thiết bị</th>
            <th className="p-3 font-semibold w-[120px]">Trạng thái</th>
            <th className="p-3 font-semibold">IP Address</th>
            <th className="p-3 font-semibold">Độ phân giải</th>
            <th className="p-3 font-semibold">Hệ điều hành</th>
            {currentUser.role === 'admin' && (
              <th className="p-3 font-semibold w-[140px]">User ID</th>
            )}
            <th className="p-3 text-right font-semibold w-[100px] pr-4">Thao tác</th>
          </tr>
        </thead>
        <motion.tbody
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="divide-y divide-border/40"
        >
          {devices.map((device) => {
            const isSelected = selectedDeviceIds.includes(device.id);
            const isOnline = device.status === 'online';

            return (
              <motion.tr
                key={device.id}
                variants={itemVariants}
                className={`group hover:bg-muted/15 transition-colors duration-150 ${
                  isSelected ? 'bg-primary/5 hover:bg-primary/10' : ''
                }`}
              >
                {/* Checkbox Row */}
                <td className="p-3 text-center">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(device.id)}
                    className="h-3.5 w-3.5 rounded-sm border-border text-primary focus:ring-primary/45 cursor-pointer accent-teal-600 dark:accent-teal-500"
                  />
                </td>

                {/* Device Name */}
                <td className="p-3 font-medium">
                  <div className="flex items-center gap-2.5">
                    <Tv className={`h-4 w-4 shrink-0 ${isOnline ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="truncate max-w-[180px] text-foreground text-xs font-semibold" title={device.deviceName}>
                      {device.deviceName}
                    </span>
                  </div>
                </td>

                {/* Connection Status */}
                <td className="p-3">
                  <div className="flex items-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border ${
                      isOnline 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                        : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
                    }`}>
                      {isOnline && (
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                      )}
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </td>

                {/* IP Address */}
                <td className="p-3 font-mono text-[11px] text-muted-foreground">
                  {device.ipAddress || '—'}
                </td>

                {/* Screen Resolution */}
                <td className="p-3 text-muted-foreground text-xs font-medium">
                  {device.screenResolution || '—'}
                </td>

                {/* OS Version */}
                <td className="p-3 text-muted-foreground text-xs font-medium truncate max-w-[120px]" title={device.osVersion || ''}>
                  {device.osVersion || '—'}
                </td>

                {/* User ID (Admin only) */}
                {currentUser.role === 'admin' && (
                  <td className="p-3 font-mono text-[11px] text-muted-foreground">
                    {device.userId ? `${device.userId.substring(0, 8)}...` : '—'}
                  </td>
                )}

                {/* Actions */}
                <td className="p-3 text-right pr-4">
                  <div className="flex justify-end gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditDevice(device)}
                      className="text-muted-foreground hover:text-foreground hover:bg-muted h-7 w-7 p-0 rounded-lg"
                      title="Cấu hình màn hình"
                    >
                      <Settings className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDevice(device.id, device.deviceName)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 h-7 w-7 p-0 rounded-lg"
                      title="Xóa màn hình"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </motion.tr>
            );
          })}
        </motion.tbody>
      </table>
    </div>
  );
}
