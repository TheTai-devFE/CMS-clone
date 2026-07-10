import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Server,
  Key,
  CheckCircle2
} from 'lucide-react';

interface Device {
  id: string;
  deviceName: string;
  apiKey: string;
  ipAddress?: string;
  screenResolution?: string;
  osVersion?: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  licenseLimit: number;
  status: string;
}

interface AdminTabProps {
  pendingDevices: Device[];
  users: User[];
  handleOpenAssignModal: (deviceId: string) => void;
}

export default function AdminTab({
  pendingDevices,
  users,
  handleOpenAssignModal
}: AdminTabProps) {
  return (
    <div className="space-y-6">
      {/* Pending Approvals Card */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Duyệt thiết bị kết nối</CardTitle>
          <CardDescription>Cấp phép thiết bị vô chủ và phân phối cho tài khoản của User</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingDevices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-lg bg-muted/10 gap-3">
              <CheckCircle2 className="h-12 w-12 text-emerald-500/80" />
              <div className="text-center">
                <h3 className="font-semibold text-lg">Không có yêu cầu chờ duyệt</h3>
                <p className="text-sm text-muted-foreground max-w-sm mt-1">Mọi thiết bị hiện tại đã được liên kết hoặc chưa đăng ký mới.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingDevices.map((device) => (
                <div key={device.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border border-border rounded-lg bg-background gap-3">
                  <div className="space-y-1">
                    <h4 className="font-bold text-foreground flex items-center">
                      <Server className="h-4 w-4 mr-2 text-primary" />
                      {device.deviceName}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      IP: {device.ipAddress || '—'} | Phân giải: {device.screenResolution || '—'} | OS: {device.osVersion || '—'}
                    </p>
                    <p className="text-[10px] text-mono text-muted-foreground flex items-center">
                      <Key className="h-3 w-3 mr-1" />
                      API Key: {device.apiKey}
                    </p>
                  </div>
                  <Button onClick={() => handleOpenAssignModal(device.id)} className="bg-primary text-primary-foreground hover:bg-primary/95 shrink-0">
                    Phê duyệt & Gán User
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users & License Limit Card */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Quản lý hạn mức License của Users</CardTitle>
          <CardDescription>Theo dõi danh sách khách hàng và giới hạn thiết bị</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Tên tài khoản</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Quyền hạn</TableHead>
                <TableHead>Hạn mức License</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} className="border-border hover:bg-muted/30">
                  <TableCell className="font-semibold">{u.username}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge className={u.role === 'admin' ? 'bg-purple-500/10 text-purple-500 border-none' : 'bg-blue-500/10 text-blue-500 border-none'}>
                      {u.role === 'admin' ? 'Admin' : 'User'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {u.role === 'admin' ? 'Vô hạn' : `${u.licenseLimit} thiết bị`}
                  </TableCell>
                  <TableCell>
                    <Badge className={u.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-none' : 'bg-red-500/10 text-red-500 border-none'}>
                      {u.status === 'active' ? 'Active' : u.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
