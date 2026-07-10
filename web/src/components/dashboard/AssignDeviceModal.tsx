import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, RefreshCw } from 'lucide-react';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
}

interface AssignDeviceModalProps {
  selectedDeviceForAssign: string | null;
  setSelectedDeviceForAssign: (id: string | null) => void;
  targetUserIdForAssign: string;
  setTargetUserIdForAssign: (id: string) => void;
  users: User[];
  handleAssignDevice: (e: React.FormEvent) => void;
  actionLoading: boolean;
}

export default function AssignDeviceModal({
  selectedDeviceForAssign,
  setSelectedDeviceForAssign,
  targetUserIdForAssign,
  setTargetUserIdForAssign,
  users,
  handleAssignDevice,
  actionLoading
}: AssignDeviceModalProps) {
  if (!selectedDeviceForAssign) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-md bg-card border-border shadow-2xl animate-in zoom-in-95 duration-200">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-lg">Duyệt & Gán thiết bị</CardTitle>
            <CardDescription>Liên kết màn hình quảng cáo tới tài khoản khách hàng</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setSelectedDeviceForAssign(null)} className="h-8 w-8 rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <form onSubmit={handleAssignDevice}>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Vui lòng chọn tài khoản User tương ứng để cấp phép thiết bị này. Hệ thống sẽ tự động trừ hạn mức License của tài khoản đó.
            </p>
            <div className="space-y-1 flex flex-col">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-wide">Tài khoản User thường</label>
              <select
                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={targetUserIdForAssign}
                onChange={(e) => setTargetUserIdForAssign(e.target.value)}
                required
              >
                {users
                  .filter((u) => u.role !== 'admin')
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username} ({u.email})
                    </option>
                  ))}
                {users.filter((u) => u.role !== 'admin').length === 0 && (
                  <option disabled value="">Không có user thường nào</option>
                )}
              </select>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2 border-t border-border/50 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedDeviceForAssign(null)}
              disabled={actionLoading}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={actionLoading || users.filter((u) => u.role !== 'admin').length === 0}
              className="bg-primary text-primary-foreground hover:bg-primary/95"
            >
              {actionLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Xác nhận duyệt'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
