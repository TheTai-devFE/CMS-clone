import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tv,
  RefreshCw,
  Trash
} from 'lucide-react';

import { User, Device } from '@/types/dashboard';

interface PlayerTabProps {
  devices: Device[];
  currentUser: User;
  handleDeleteDevice: (id: string, name: string) => void;
  fetchData: () => void;
}

export default function PlayerTab({
  devices,
  currentUser,
  handleDeleteDevice,
  fetchData
}: PlayerTabProps) {
  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl">Danh sách thiết bị</CardTitle>
          <CardDescription>Theo dõi tình trạng hoạt động và xóa thiết bị màn hình</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="mr-2 h-4 w-4" /> Làm mới
        </Button>
      </CardHeader>
      <CardContent>
        {devices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-lg bg-muted/10 gap-3">
            <Tv className="h-12 w-12 text-muted-foreground/60" />
            <div className="text-center">
              <h3 className="font-semibold text-lg">Chưa có thiết bị</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">Thiết bị cần đăng ký mã kết nối từ App Player trước khi Admin duyệt.</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {devices.map((device) => (
              <Card key={device.id} className="border-border bg-background shadow-xs hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base font-semibold">{device.deviceName}</CardTitle>
                    <Badge className={device.status === 'online' ? 'bg-emerald-500/10 text-emerald-500 border-none' : 'bg-gray-500/10 text-gray-500 border-none'}>
                      {device.status === 'online' ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm pb-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kích hoạt:</span>
                    <Badge className={device.approvalStatus === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border-none' : 'bg-amber-500/10 text-amber-500 border-none'}>
                      {device.approvalStatus === 'approved' ? 'Đã duyệt' : 'Chờ duyệt'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IP Address:</span>
                    <span className="font-medium">{device.ipAddress || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Độ phân giải:</span>
                    <span className="font-medium">{device.screenResolution || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hệ điều hành:</span>
                    <span className="font-medium">{device.osVersion || '—'}</span>
                  </div>
                  {currentUser.role === 'admin' && device.userId && (
                    <div className="flex justify-between text-xs text-mono text-muted-foreground pt-1 border-t border-border/50">
                      <span>User ID:</span>
                      <span>{device.userId.substring(0, 16)}...</span>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-0 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteDevice(device.id, device.deviceName)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <Trash className="h-4 w-4 mr-1" /> Xóa màn hình
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
