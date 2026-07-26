"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Image as ImageIcon, Save, RefreshCw, Upload, Sparkles, Layout } from "lucide-react";
import { api, getFileUrl } from "@/utils/api";
import Image from "next/image";

export default function SystemConfigPage() {
  const [brandName, setBrandName] = useState("CDM Signage");
  const [logoUrl, setLogoUrl] = useState("");
  const [splashUrl, setSplashUrl] = useState("");
  const [backgroundUrl, setBackgroundUrl] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const data = (await api.get("/api/config")) as Record<string, string>;
      if (data) {
        setBrandName(data.brandName || "CDM Signage");
        setLogoUrl(data.logoUrl || "");
        setSplashUrl(data.splashUrl || "");
        setBackgroundUrl(data.backgroundUrl || "");
      }
    } catch (err: unknown) {
      console.error("Lỗi khi tải cấu hình:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await api.post("/api/config", {
        brandName,
        logoUrl,
        splashUrl,
        backgroundUrl,
      });
      setMsg({ type: "success", text: "Đã lưu cấu hình hệ thống thành công!" });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Không thể lưu cấu hình";
      setMsg({ type: "error", text: errorMsg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto animate-in fade-in duration-300 font-sans pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Settings className="size-6 text-primary" />
            Cấu Hình Hệ Thống & Thương Hiệu
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tùy chỉnh tên thương hiệu, Logo và các hình ảnh chờ (Splash screen) khi ứng dụng App Player khởi động.
          </p>
        </div>
      </div>

      {msg && (
        <div
          className={`p-4 rounded-lg text-sm font-medium flex items-center justify-between ${
            msg.type === "success" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-600 border border-red-500/20"
          }`}
        >
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} className="text-xs underline">Đóng</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <RefreshCw className="size-5 animate-spin text-primary" />
          <span>Đang tải cài đặt hệ thống...</span>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Brand Name Settings */}
          <Card className="bg-card border-border/40 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="size-5 text-amber-500" /> Tên Thương Hiệu Hệ Thống
              </CardTitle>
              <CardDescription>Hiển thị ở trang Đăng nhập, Sidebar và App Player màn hình TV</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Tên thương hiệu (Brand Name)</label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="Ví dụ: CDM Signage"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Splash Image & Background Settings */}
          <Card className="bg-card border-border/40 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ImageIcon className="size-5 text-blue-500" /> Màn Hình Chờ App Player (Splash Image)
              </CardTitle>
              <CardDescription>Đường dẫn hình ảnh hiển thị khi ứng dụng App Player đang khởi động hoặc chưa có lịch phát</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">URL Hình Ảnh Chờ (Splash Image URL)</label>
                <input
                  type="url"
                  value={splashUrl}
                  onChange={(e) => setSplashUrl(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="https://domain.com/uploads/splash.png"
                />
                {splashUrl && (
                  <div className="mt-3 p-3 border border-border rounded-lg bg-muted/20">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Xem trước Splash Image:</p>
                    <div className="relative aspect-video max-w-sm rounded-md overflow-hidden border border-border/50 bg-black flex items-center justify-center">
                      <img src={splashUrl} alt="Splash Preview" className="w-full h-full object-contain" />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">URL Background Mặc Định (Background Image URL)</label>
                <input
                  type="url"
                  value={backgroundUrl}
                  onChange={(e) => setBackgroundUrl(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="https://domain.com/uploads/bg.jpg"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={saving} className="bg-primary text-primary-foreground font-semibold px-6 h-10 rounded-lg shadow-sm gap-2">
              {saving ? <RefreshCw className="size-4 animate-spin" /> : <Save className="size-4" />}
              {saving ? "Đang lưu..." : "Lưu Cấu Hình"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
