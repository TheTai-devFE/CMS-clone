import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from 'lucide-react';

interface EventLog {
  id: string;
  time: string;
  deviceName: string;
  status: string;
  detail: string;
}

interface EventLogTabProps {
  eventLogs: EventLog[];
  fetchData: () => void;
}

export default function EventLogTab({ eventLogs, fetchData }: EventLogTabProps) {
  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl">Nhật ký hoạt động chi tiết</CardTitle>
          <CardDescription>Toàn bộ sự kiện hệ thống ghi nhận từ Redis & Database</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="mr-2 h-4 w-4" /> Làm mới log
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Thời gian</TableHead>
              <TableHead>Thiết bị</TableHead>
              <TableHead>Sự kiện</TableHead>
              <TableHead>Chi tiết sự kiện</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {eventLogs.map((log) => (
              <TableRow key={log.id} className="border-border hover:bg-muted/30">
                <TableCell className="font-medium whitespace-nowrap">{new Date(log.time).toLocaleString('vi-VN')}</TableCell>
                <TableCell className="font-semibold">{log.deviceName}</TableCell>
                <TableCell>
                  <Badge className={
                    log.status === 'Playback Success' ? 'bg-emerald-500/10 text-emerald-500 border-none' :
                    log.status === 'Online' ? 'bg-emerald-500/10 text-emerald-500 border-none' :
                    log.status === 'Heartbeat' ? 'bg-sky-500/10 text-sky-500 border-none' : 'bg-amber-500/10 text-amber-500 border-none'
                  }>
                    {log.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-mono text-xs text-muted-foreground">{log.detail}</TableCell>
              </TableRow>
            ))}
            {eventLogs.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                  Không có nhật ký sự kiện nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
