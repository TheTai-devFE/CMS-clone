"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreditCard, DollarSign, RefreshCw, CheckCircle2, Clock, XCircle, ShoppingBag } from "lucide-react";
import { api } from "@/utils/api";

interface Order {
  id: string;
  orderCode: string;
  amount: number;
  licenseQuantity: number;
  purchaseType: string;
  status: "PENDING" | "PAID" | "FAILED" | "CANCELLED";
  createdAt: string;
  user?: {
    shortId: string;
    username: string;
    email: string;
  };
}

export default function PaymentManagementPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = (await api.get("/api/payment/orders")) as Order[];
      setOrders(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Không thể tải danh sách giao dịch";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const totalRevenue = orders
    .filter((o) => o.status === "PAID")
    .reduce((sum, o) => sum + o.amount, 0);

  const totalLicensesSold = orders
    .filter((o) => o.status === "PAID")
    .reduce((sum, o) => sum + o.licenseQuantity, 0);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-300 font-sans pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CreditCard className="size-6 text-primary" />
            Quản Lý Thanh Toán & Đơn Hàng
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Theo dõi danh sách giao dịch PayOS, doanh thu và các lượt đăng ký gói từ người dùng.
          </p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 text-sm font-medium transition-colors"
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card/50 border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng Doanh Thu (Đã thanh toán)</CardTitle>
            <DollarSign className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(totalRevenue)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Số License Đã Bán</CardTitle>
            <ShoppingBag className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalLicensesSold} slot</div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng Đơn Hàng</CardTitle>
            <CreditCard className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{orders.length} đơn</div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card className="bg-card border-border/40 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Lịch Sử Giao Dịch</CardTitle>
          <CardDescription>Chi tiết các đơn hàng thanh toán gói dịch vụ</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <RefreshCw className="size-5 animate-spin text-primary" />
              <span>Đang tải dữ liệu đơn hàng...</span>
            </div>
          ) : error ? (
            <div className="py-8 text-center text-destructive text-sm font-medium">{error}</div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">Chưa có giao dịch nào phát sinh.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã Đơn</TableHead>
                    <TableHead>Khách Hàng</TableHead>
                    <TableHead>Gói / Loại</TableHead>
                    <TableHead className="text-center">Số Slot</TableHead>
                    <TableHead className="text-right">Số Tiền</TableHead>
                    <TableHead className="text-center">Trạng Thái</TableHead>
                    <TableHead className="text-right">Thời Gian</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs font-semibold">#{order.orderCode}</TableCell>
                      <TableCell>
                        {order.user ? (
                          <div>
                            <div className="font-medium text-sm text-foreground">{order.user.username}</div>
                            <div className="text-xs text-muted-foreground">{order.user.email}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic text-xs">Vô danh / Khách vãng lai</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-xs">
                          {order.purchaseType === "rent" ? "Thuê bao" : "Mua đứt"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-medium">{order.licenseQuantity}</TableCell>
                      <TableCell className="text-right font-bold text-foreground">
                        {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(order.amount)}
                      </TableCell>
                      <TableCell className="text-center">
                        {order.status === "PAID" && (
                          <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400 gap-1 inline-flex items-center">
                            <CheckCircle2 className="size-3" /> Thành công
                          </Badge>
                        )}
                        {order.status === "PENDING" && (
                          <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-400 gap-1 inline-flex items-center">
                            <Clock className="size-3" /> Chờ thanh toán
                          </Badge>
                        )}
                        {(order.status === "FAILED" || order.status === "CANCELLED") && (
                          <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-400 gap-1 inline-flex items-center">
                            <XCircle className="size-3" /> {order.status === "CANCELLED" ? "Đã hủy" : "Thất bại"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground font-mono">
                        {new Date(order.createdAt).toLocaleString("vi-VN")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
