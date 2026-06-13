import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Layers,
  Plus,
  Type,
  Video,
  Clock,
  CloudSun,
  Globe,
  Image as ImageIcon
} from 'lucide-react';
import { useMedia, useTemplates } from '@/hooks/useApi';
import { api } from '@/utils/api';
import { Template } from '@/types/dashboard';
import TemplateEditor from './template-editor/TemplateEditor';
import { useDashboard } from '../context/DashboardContext';

interface TemplateTabProps {
  fetchTemplatesData: () => void;
}

export default function TemplateTab({ fetchTemplatesData }: TemplateTabProps) {
  const { templates, mutate: mutateTemplates } = useTemplates();
  const { mediaList } = useMedia();
  const { setError, setSuccessMsg } = useDashboard();

  // Editor mode state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (template: Template) => {
    setEditingTemplate(template);
    setIsEditorOpen(true);
  };

  const handleDeleteTemplate = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa Bố cục: ${name}?`)) return;

    try {
      await api.delete(`/api/templates/${id}`);
      setSuccessMsg('Xóa Bố cục thành công');
      mutateTemplates();
      fetchTemplatesData();
    } catch (error) {
      const err = error as Error;
      setError(err.message || 'Lỗi khi xóa Bố cục');
    }
  };


  // Icon mapping for zone types
  const getZoneIcon = (type: string) => {
    switch (type) {
      case 'media': return <Video className="h-4 w-4" />;
      case 'image': return <ImageIcon className="h-4 w-4" />;
      case 'text': return <Type className="h-4 w-4" />;
      case 'clock': return <Clock className="h-4 w-4" />;
      case 'weather': return <CloudSun className="h-4 w-4" />;
      case 'web': return <Globe className="h-4 w-4" />;
      default: return <Layers className="h-4 w-4" />;
    }
  };

  // Render PPTX Editor if open
  if (isEditorOpen) {
    return (
      <TemplateEditor
        editingTemplate={editingTemplate}
        mediaList={mediaList}
        onClose={() => setIsEditorOpen(false)}
        onSave={() => {
          mutateTemplates();
          fetchTemplatesData();
        }}
      />
    );
  }

  // Render list of layouts
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">Bố cục hiển thị (Layout Templates)</h3>
          <p className="text-xs text-muted-foreground">Thiết kế phân vùng màn hình đa chức năng</p>
        </div>
        <Button onClick={handleOpenCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
          <Plus className="mr-2 h-4 w-4" /> Thiết kế Layout
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {templates.map((tpl) => (
          <Card key={tpl.id} className="bg-card border-border hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden relative">
            <CardHeader className="pb-3 bg-muted/10">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <CardTitle className="text-sm font-bold text-foreground truncate max-w-[150px]">{tpl.name}</CardTitle>
                  <CardDescription className="text-[10px]">{tpl.width}x{tpl.height} ({tpl.orientation === 'landscape' ? 'Ngang' : 'Dọc'})</CardDescription>
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary text-[9px] border-none font-medium">
                  {tpl.zones?.length ?? 0} trang
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="py-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5 flex-wrap">
                {tpl.zones?.map((z, idx) => (
                  <span key={z.id ?? idx} className="bg-muted px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1">
                    {getZoneIcon(z.type)}
                    {z.name}
                  </span>
                ))}
                {(!tpl.zones || tpl.zones.length === 0) && (
                  <span className="italic text-muted-foreground/60 text-[10px]">Chưa thêm trang nào</span>
                )}
              </div>
            </CardContent>
            <CardFooter className="p-3 border-t border-border flex justify-end gap-2 bg-muted/5">
              <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(tpl)} className="text-primary text-xs">
                Sửa Layout
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDeleteTemplate(tpl.id, tpl.name)} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs">
                Xóa
              </Button>
            </CardFooter>
          </Card>
        ))}

        {templates.length === 0 && (
          <div className="col-span-full py-16 border border-dashed border-border rounded-xl flex flex-col items-center justify-center bg-muted/5 gap-3">
            <Layers className="h-10 w-10 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground italic">Chưa có thiết kế bố cục nào.</p>
            <Button onClick={handleOpenCreate} variant="link" className="text-primary p-0 h-auto font-medium">
              Tạo bản thiết kế đầu tiên ngay
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
