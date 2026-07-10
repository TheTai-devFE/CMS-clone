import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Server,
  Key,
  CheckCircle2,
  Edit2,
  Save,
  X
} from 'lucide-react';
import { api } from '@/utils/api';

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
  shortId: string;
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
  onUsersChange?: () => void;
}

export default function AdminTab({
  pendingDevices,
  users,
  handleOpenAssignModal,
  onUsersChange
}: AdminTabProps) {
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editLicenseValue, setEditLicenseValue] = useState<number>(0);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  const handleStartEdit = (user: User) => {
    setEditingUserId(user.id);
    setEditLicenseValue(user.licenseLimit);
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditLicenseValue(0);
  };

  const handleSaveLicense = async (userId: string) => {
    setSavingUserId(userId);
    try {
      await api.put(`/api/auth/users/${userId}/license`, { licenseLimit: editLicenseValue });
      onUsersChange?.();
      handleCancelEdit();
    } catch (err: any) {
      console.error('Lỗi khi cập nhật license:', err);
    } finally {
      setSavingUserId(null);
    }
  };

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
                <TableHead>Mã User</TableHead>
                <TableHead>Tên tài khoản</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Quyền hạn</TableHead>
                <TableHead>Hạn mức License</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="w-[100px]">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} className="border-border hover:bg-muted/30">
                  <TableCell className="font-mono text-xs text-muted-foreground">{u.shortId}</TableCell>
                  <TableCell className="font-semibold">{u.username}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge className={u.role === 'admin' ? 'bg-purple-500/10 text-purple-500 border-none' : 'bg-blue-500/10 text-blue-500 border-none'}>
                      {u.role === 'admin' ? 'Admin' : 'User'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {editingUserId === u.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={editLicenseValue}
                          onChange={(e) => setEditLicenseValue(parseInt(e.target.value) || 0)}
                          className="w-20 h-7 text-xs"
                          min={0}
                          max={999}
                        />
                      </div>
                    ) : (
                      u.role === 'admin' ? 'Vô hạn' : `${u.licenseLimit} thiết bị`
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={u.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-none' : 'bg-red-500/10 text-red-500 border-none'}>
                      {u.status === 'active' ? 'Active' : u.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {u.role !== 'admin' && (
                      editingUserId === u.id ? (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSaveLicense(u.id)}
                            disabled={savingUserId === u.id}
                            className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700"
                          >
                            <Save className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelEdit}
                            className="h-7 w-7 p-0 text-muted-foreground"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStartEdit(u)}
                          className="h-7 w-7 p-0 text-primary hover:text-primary/80"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                      )
                    )}
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
