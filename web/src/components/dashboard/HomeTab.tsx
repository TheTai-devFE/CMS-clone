import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardTab } from '@/types/dashboard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowUpRight,
  Tv,
  Image as ImageIcon
} from 'lucide-react';

interface Device {
  id: string;
  deviceName: string;
  ipAddress?: string;
  status: 'online' | 'offline';
}

interface MediaItem {
  id: string;
}

interface HomeTabProps {
  devices: Device[];
  mediaList: MediaItem[];
  setActiveTab: (tab: DashboardTab) => void;
}

export default function HomeTab({ devices, mediaList, setActiveTab }: HomeTabProps) {
  return (
    <div className="space-y-6">
      {/* Action Panel Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-card border-border shadow-sm hover:border-primary/50 transition-all cursor-pointer" onClick={() => setActiveTab('content')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-primary flex items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
              Tải lên quảng cáo
            </CardTitle>
            <CardDescription>Upload hình ảnh banner hoặc video MP4 trình phát</CardDescription>
          </CardHeader>
          <CardContent className="h-24 flex items-center justify-center bg-muted/20 border-t border-dashed mt-4 rounded-b-lg">
            <ImageIcon className="h-10 w-10 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm hover:border-primary/50 transition-all cursor-pointer" onClick={() => setActiveTab('player')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-primary flex items-center">
              <span className="w-2 h-2 rounded-full bg-pink-500 mr-2"></span>
              Quản lý thiết bị
            </CardTitle>
            <CardDescription>Xem chi tiết trạng thái, phân giải màn hình</CardDescription>
          </CardHeader>
          <CardContent className="h-24 flex items-center justify-center bg-muted/20 border-t border-dashed mt-4 rounded-b-lg">
            <Tv className="h-10 w-10 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      {/* Quick Devices Status List */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg text-foreground">Màn hình của bạn</CardTitle>
            <CardDescription>Xem nhanh danh sách thiết bị đang quản lý</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setActiveTab('player')}>
            Xem tất cả <ArrowUpRight className="ml-2 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Tên thiết bị</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.slice(0, 5).map((device) => (
                <TableRow key={device.id} className="border-border hover:bg-muted/30">
                  <TableCell className="font-semibold">{device.deviceName}</TableCell>
                  <TableCell>{device.ipAddress || '—'}</TableCell>
                  <TableCell>
                    <Badge className={device.status === 'online' ? 'bg-emerald-500/10 text-emerald-500 border-none' : 'bg-gray-500/10 text-gray-500 border-none'}>
                      {device.status === 'online' ? 'Online' : 'Offline'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {devices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-6 text-muted-foreground italic">
                    Chưa liên kết thiết bị nào
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
