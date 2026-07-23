import React, { useMemo, useState } from 'react';
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
  X,
  UserPlus,
  Filter,
  AlertTriangle,
  Check,
  XCircle,
  ShoppingBag,
  CalendarClock,
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
  // T6: server trả về deviceCount = số device approved
  deviceCount?: number;
  // T6: 'rent' | 'buy' | null
  purchaseType?: 'rent' | 'buy' | null;
}

/**
 * T6: Trạng thái license so với số device đang dùng.
 * - 'unlimited' : admin (không giới hạn)
 * - 'ok'       : deviceCount < licenseLimit (còn slot trống)
 * - 'full'     : deviceCount === licenseLimit (đầy)
 * - 'over'     : deviceCount > licenseLimit (VƯỢT — admin cần tăng limit hoặc xóa device)
 * - 'empty'    : deviceCount === 0 (chưa dùng)
 */
type LicenseStatus = 'unlimited' | 'ok' | 'full' | 'over' | 'empty';

function getLicenseStatus(u: User): LicenseStatus {
  if (u.role === 'admin') return 'unlimited';
  const count = u.deviceCount ?? 0;
  const limit = u.licenseLimit;
  if (count === 0) return 'empty';
  if (count > limit) return 'over';
  if (count === limit) return 'full';
  return 'ok';
}

const LICENSE_STATUS_CONFIG: Record<LicenseStatus, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
  unlimited: { label: 'Vô hạn', className: 'bg-purple-500/10 text-purple-500 border-purple-500/30', icon: Check },
  ok:        { label: 'Đủ',      className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30', icon: Check },
  empty:     { label: 'Trống',   className: 'bg-slate-500/10 text-slate-500 border-slate-500/30', icon: Check },
  full:      { label: 'Đầy',     className: 'bg-amber-500/10 text-amber-600 border-amber-500/30', icon: AlertTriangle },
  over:      { label: 'Vượt',    className: 'bg-red-500/10 text-red-600 border-red-500/30', icon: XCircle },
};

// T6: filter purchase type
type PurchaseFilter = 'all' | 'rent' | 'buy' | 'none';

interface AdminTabProps {
  pendingDevices: Device[];
  users: User[];
  handleOpenAssignModal: (deviceId: string) => void;
  onUsersChange?: () => void;
  onOpenCreateUser?: () => void;
}

export default function AdminTab({
  pendingDevices,
  users,
  handleOpenAssignModal,
  onUsersChange,
  onOpenCreateUser,
}: AdminTabProps) {
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editLicenseValue, setEditLicenseValue] = useState<number>(0);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState<string>('');
  // T6: purchase type filter
  const [purchaseFilter, setPurchaseFilter] = useState<PurchaseFilter>('all');

  const handleStartEdit = (user: User) => {
    setEditingUserId(user.id);
    setEditLicenseValue(user.licenseLimit);
    setEditNote('');
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditLicenseValue(0);
    setEditNote('');
  };

  const handleSaveLicense = async (userId: string) => {
    setSavingUserId(userId);
    try {
      await api.put(`/api/auth/users/${userId}/license`, {
        licenseLimit: editLicenseValue,
        note: editNote.trim() || undefined,
      });
      onUsersChange?.();
      handleCancelEdit();
    } catch (err) {
      console.error('Lỗi khi cập nhật license:', err instanceof Error ? err.message : err);
    } finally {
      setSavingUserId(null);
    }
  };

  // T6: filter users theo purchase type
  const filteredUsers = useMemo(() => {
    if (purchaseFilter === 'all') return users;
    return users.filter((u) => {
      if (purchaseFilter === 'none') return !u.purchaseType;
      return u.purchaseType === purchaseFilter;
    });
  }, [users, purchaseFilter]);

  // T6: count cho filter chips
  const purchaseCounts = useMemo(() => {
    const c = { all: users.length, rent: 0, buy: 0, none: 0 };
    for (const u of users) {
      if (!u.purchaseType) c.none++;
      else if (u.purchaseType === 'rent') c.rent++;
      else if (u.purchaseType === 'buy') c.buy++;
    }
    return c;
  }, [users]);

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
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <div>
            <CardTitle className="text-xl">Quản lý hạn mức License của Users</CardTitle>
            <CardDescription>Theo dõi danh sách khách hàng và giới hạn thiết bị</CardDescription>
          </div>
          {onOpenCreateUser && (
            <Button
              onClick={onOpenCreateUser}
              className="bg-primary text-primary-foreground hover:bg-primary/95 shrink-0"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Tạo User
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {/* T6: Filter theo purchase type */}
          <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1">
            <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0 mr-1" />
            {([
              { value: 'all' as PurchaseFilter, label: 'Tất cả', icon: Filter, count: purchaseCounts.all },
              { value: 'rent' as PurchaseFilter, label: 'Thuê bao', icon: CalendarClock, count: purchaseCounts.rent },
              { value: 'buy' as PurchaseFilter, label: 'Mua đứt', icon: ShoppingBag, count: purchaseCounts.buy },
              { value: 'none' as PurchaseFilter, label: 'Chưa xác định', icon: XCircle, count: purchaseCounts.none },
            ]).map((opt) => {
              const Icon = opt.icon;
              const isActive = purchaseFilter === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setPurchaseFilter(opt.value)}
                  className={`h-8 px-3 border text-xs rounded-lg font-semibold transition-all duration-150 flex items-center gap-1.5 shrink-0 ${
                    isActive
                      ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                      : 'bg-card border-border hover:bg-muted/40 text-muted-foreground'
                  }`}
                  aria-pressed={isActive}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {opt.label}
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold leading-none ${
                    isActive ? 'bg-white/20' : 'bg-muted/60 text-muted-foreground'
                  }`}>
                    {opt.count}
                  </span>
                </button>
              );
            })}
          </div>

          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Mã User</TableHead>
                <TableHead>Tên tài khoản</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Quyền</TableHead>
                <TableHead>Loại mua</TableHead>
                <TableHead>License (đang dùng / tối đa)</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Trạng thái TK</TableHead>
                <TableHead className="w-[100px]">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((u) => {
                const status = getLicenseStatus(u);
                const StatusIcon = LICENSE_STATUS_CONFIG[status].icon;
                const statusCfg = LICENSE_STATUS_CONFIG[status];
                const count = u.deviceCount ?? 0;
                return (
                  <TableRow key={u.id} className="border-border hover:bg-muted/30">
                    <TableCell className="font-mono text-xs text-muted-foreground">{u.shortId}</TableCell>
                    <TableCell className="font-semibold">{u.username}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge className={u.role === 'admin' ? 'bg-purple-500/10 text-purple-500 border-none' : 'bg-blue-500/10 text-blue-500 border-none'}>
                        {u.role === 'admin' ? 'Admin' : 'User'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {u.purchaseType === 'rent' && (
                        <Badge variant="outline" className="border-blue-500/30 text-blue-600 text-[10px]">
                          <CalendarClock className="h-2.5 w-2.5 mr-1" />
                          Thuê
                        </Badge>
                      )}
                      {u.purchaseType === 'buy' && (
                        <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 text-[10px]">
                          <ShoppingBag className="h-2.5 w-2.5 mr-1" />
                          Mua
                        </Badge>
                      )}
                      {!u.purchaseType && (
                        <span className="text-[10px] text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {editingUserId === u.id ? (
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={editLicenseValue}
                              onChange={(e) => setEditLicenseValue(parseInt(e.target.value) || 0)}
                              className="w-20 h-7 text-xs"
                              min={0}
                              max={999}
                            />
                            <span className="text-[10px] text-muted-foreground">
                              {count} → {editLicenseValue}
                            </span>
                          </div>
                          <Input
                            type="text"
                            value={editNote}
                            onChange={(e) => setEditNote(e.target.value)}
                            placeholder="Lý do thay đổi (audit log)..."
                            className="h-7 text-[10px] w-48"
                            maxLength={500}
                          />
                        </div>
                      ) : (
                        <span className="font-mono text-xs">
                          <strong className={status === 'over' ? 'text-red-600' : 'text-foreground'}>
                            {count}
                          </strong>
                          <span className="text-muted-foreground"> / </span>
                          {u.role === 'admin' ? (
                            <span className="text-muted-foreground">∞</span>
                          ) : (
                            <span className="text-foreground">{u.licenseLimit}</span>
                          )}
                          <span className="text-[10px] text-muted-foreground ml-1">thiết bị</span>
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statusCfg.className} gap-1`} variant="outline">
                        <StatusIcon className="h-3 w-3" />
                        {statusCfg.label}
                      </Badge>
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
                              title="Lưu"
                            >
                              <Save className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleCancelEdit}
                              className="h-7 w-7 p-0 text-muted-foreground"
                              title="Hủy"
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
                            title="Sửa license"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                        )
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
