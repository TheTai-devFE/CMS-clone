import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  Layers,
  Layout
} from 'lucide-react';
import { useTemplates } from '@/hooks/useApi';
import { Playlist } from '@/types/dashboard';

interface ResourceTabProps {
  playlists: Playlist[];
  fetchData: () => void;
}

export default function ResourceTab({ playlists, fetchData }: ResourceTabProps) {
  const { templates } = useTemplates();

  return (
    <div className="space-y-6">
      {/* Playlists Card */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary shrink-0" />
              Danh sách Playlist ({playlists.length})
            </CardTitle>
            <CardDescription>Cấu hình nhóm phát và trình chiếu đồng bộ</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={fetchData} className="border-border">
              <RefreshCw className="mr-2 h-4 w-4 animate-hover" /> Làm mới
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {playlists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 border border-dashed border-border rounded-xl bg-muted/5 gap-3">
              <Layers className="h-10 w-10 text-muted-foreground/60" />
              <p className="text-sm text-muted-foreground italic">Chưa tạo Playlist nào trên hệ thống.</p>
              <p className="text-xs text-muted-foreground">Vui lòng chuyển sang tab <strong>Nội dung &gt; Danh sách phát</strong> để thiết kế.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>Tên Playlist</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Kiểu đồng bộ</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {playlists.map((pl) => (
                  <TableRow key={pl.id} className="border-border hover:bg-muted/30">
                    <TableCell className="font-semibold text-primary">{pl.playlistName}</TableCell>
                    <TableCell className="max-w-[300px] truncate text-muted-foreground">{pl.description || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`border-none font-medium ${
                        pl.isSyncGroup ? 'bg-indigo-500/10 text-indigo-500' : 'bg-emerald-500/10 text-emerald-500'
                      }`}>
                        {pl.isSyncGroup ? 'Đồng bộ nhóm' : 'Đơn lẻ'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{new Date(pl.createdAt).toLocaleString('vi-VN')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Templates Card */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Layout className="h-5 w-5 text-indigo-500 shrink-0" />
              Bố cục hiển thị ({templates.length})
            </CardTitle>
            <CardDescription>Các layout nhiều vùng chia màn hình</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 border border-dashed border-border rounded-xl bg-muted/5 gap-3">
              <Layout className="h-10 w-10 text-muted-foreground/60" />
              <p className="text-sm text-muted-foreground italic">Chưa tạo Bố cục hiển thị nào.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>Tên bố cục</TableHead>
                  <TableHead>Kích thước</TableHead>
                  <TableHead>Hướng hiển thị</TableHead>
                  <TableHead>Số vùng phát</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((tpl) => (
                  <TableRow key={tpl.id} className="border-border hover:bg-muted/30">
                    <TableCell className="font-semibold text-indigo-500">{tpl.name}</TableCell>
                    <TableCell className="text-muted-foreground">{tpl.width} x {tpl.height}</TableCell>
                    <TableCell className="capitalize text-muted-foreground">{tpl.orientation}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-500 border-none font-semibold">
                        {tpl.zones?.length ?? 0} vùng phát
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
