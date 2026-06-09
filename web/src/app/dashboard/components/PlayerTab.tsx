import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tv,
  RefreshCw,
  Trash,
  Plus,
  Settings
} from 'lucide-react';

import { User, Device } from '@/types/dashboard';

interface PlayerTabProps {
  devices: Device[];
  currentUser: User;
  handleDeleteDevice: (id: string, name: string) => void;
  handleEditDevice: (device: Device) => void;
  fetchData: () => void;
  onOpenClaimModal: () => void;
}

export default function PlayerTab({
  devices,
  currentUser,
  handleDeleteDevice,
  handleEditDevice,
  fetchData,
  onOpenClaimModal
}: PlayerTabProps) {
  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl">Danh sách thiết bị</CardTitle>
          <CardDescription>Theo dõi tình trạng hoạt động và xóa thiết bị màn hình</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={onOpenClaimModal} className="bg-primary text-primary-foreground hover:bg-primary/95">
            <Plus className="mr-2 h-4 w-4" /> Liên kết thiết bị
          </Button>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="mr-2 h-4 w-4" /> Làm mới
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {devices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-lg bg-muted/10 gap-3">
            <Tv className="h-12 w-12 text-muted-foreground/60" />
            <div className="text-center flex flex-col items-center gap-2">
              <h3 className="font-semibold text-lg">Chưa có thiết bị</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-2">Nhập mã kết nối (Pairing Code) từ App Player để bắt đầu liên kết thiết bị.</p>
              <Button size="sm" onClick={onOpenClaimModal} className="bg-primary text-primary-foreground hover:bg-primary/95">
                <Plus className="mr-2 h-4 w-4" /> Liên kết thiết bị ngay
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-border bg-background overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-semibold w-[220px]">Thiết bị</TableHead>
                  <TableHead className="font-semibold w-[120px]">Trạng thái</TableHead>
                  <TableHead className="font-semibold w-[120px]">Kích hoạt</TableHead>
                  <TableHead className="font-semibold">IP Address</TableHead>
                  <TableHead className="font-semibold">Độ phân giải</TableHead>
                  <TableHead className="font-semibold">Hệ điều hành</TableHead>
                  {currentUser.role === 'admin' && (
                    <TableHead className="font-semibold w-[140px]">User ID</TableHead>
                  )}
                  <TableHead className="text-right font-semibold w-[100px]">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => (
                  <TableRow key={device.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Tv className={device.status === 'online' ? 'h-4 w-4 text-emerald-500' : 'h-4 w-4 text-muted-foreground'} />
                        <span className="truncate max-w-[180px]" title={device.deviceName}>
                          {device.deviceName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={device.status === 'online' ? 'bg-emerald-500/10 text-emerald-500 border-none hover:bg-emerald-500/10' : 'bg-gray-500/10 text-gray-500 border-none hover:bg-gray-500/10'}>
                        {device.status === 'online' ? 'Online' : 'Offline'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={device.approvalStatus === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border-none hover:bg-emerald-500/10' : 'bg-amber-500/10 text-amber-500 border-none hover:bg-amber-500/10'}>
                        {device.approvalStatus === 'approved' ? 'Đã duyệt' : 'Chờ duyệt'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{device.ipAddress || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{device.screenResolution || '—'}</TableCell>
                    <TableCell className="text-muted-foreground truncate max-w-[120px]" title={device.osVersion || ''}>
                      {device.osVersion || '—'}
                    </TableCell>
                    {currentUser.role === 'admin' && (
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {device.userId ? `${device.userId.substring(0, 8)}...` : '—'}
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditDevice(device)}
                          className="text-muted-foreground hover:text-foreground hover:bg-accent h-8 w-8 p-0 rounded-md"
                          title="Cấu hình màn hình"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDevice(device.id, device.deviceName)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 h-8 w-8 p-0 rounded-md"
                          title="Xóa màn hình"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
