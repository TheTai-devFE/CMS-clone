'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  RotateCw,
  Volume2,
  Download,
  Trash2,
  X,
  Sliders
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

interface BatchActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onMultiSchedule: () => void;
  onReboot: () => void;
  onVolume: () => void;
  onInstallApk: () => void;
  onUninstallApk: () => void;
  onRemoveContents: () => void;
}

export default function BatchActionsBar({
  selectedCount,
  onClearSelection,
  onMultiSchedule,
  onReboot,
  onVolume,
  onInstallApk,
  onUninstallApk,
  onRemoveContents
}: BatchActionsBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, x: '-50%', opacity: 0 }}
          animate={{ y: 0, x: '-50%', opacity: 1 }}
          exit={{ y: 100, x: '-50%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 22 }}
          className="fixed bottom-6 left-1/2 z-50 flex items-center gap-4 px-4 py-3 bg-card/95 backdrop-blur-md border border-border/80 rounded-2xl shadow-xl max-w-[90%] md:max-w-2xl select-none"
        >
          {/* Badge & Info */}
          <div className="flex items-center gap-2 border-r border-border/60 pr-3 shrink-0">
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary px-1.5 animate-pulse">
              {selectedCount}
            </span>
            <span className="text-xs font-semibold text-foreground hidden sm:inline">
              màn hình đã chọn
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClearSelection}
              className="h-6 w-6 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/50"
              title="Hủy chọn"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Group Actions */}
          <div className="flex items-center gap-1.5 flex-1 overflow-x-auto no-scrollbar py-0.5">
            {/* Primary Action: Multi Schedule */}
            <Button
              size="sm"
              onClick={onMultiSchedule}
              className="bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold h-8 rounded-lg shrink-0"
            >
              <Calendar className="mr-1.5 h-3.5 w-3.5" />
              Lịch phát hàng loạt
            </Button>

            {/* Quick Control Actions */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onReboot}
              className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 shrink-0"
              title="Khởi động lại (Reboot)"
            >
              <RotateCw className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onVolume}
              className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 shrink-0"
              title="Điều chỉnh âm lượng"
            >
              <Volume2 className="h-4 w-4" />
            </Button>

            {/* Dropdown Menu for Advanced Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 shrink-0"
                >
                  <Sliders className="mr-1.5 h-3.5 w-3.5" />
                  Tác vụ khác
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 bg-card/95 backdrop-blur-xl border-border/50 rounded-xl shadow-lg"
              >
                <DropdownMenuItem
                  onClick={onInstallApk}
                  className="text-xs p-2 text-muted-foreground focus:text-foreground focus:bg-muted/50 cursor-pointer"
                >
                  <Download className="mr-2 h-4 w-4" /> Cài đặt ứng dụng APK
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onUninstallApk}
                  className="text-xs p-2 text-muted-foreground focus:text-foreground focus:bg-muted/50 cursor-pointer"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Gỡ ứng dụng APK
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border/20" />
                <DropdownMenuItem
                  onClick={onRemoveContents}
                  className="text-xs p-2 text-red-500 focus:bg-red-50 dark:focus:bg-red-950/20 cursor-pointer"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Xóa sạch nội dung phát
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
