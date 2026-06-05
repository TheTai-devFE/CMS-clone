import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Layers,
  Plus,
  X,
  Check,
  Loader2,
  Move,
  Type,
  Video,
  Clock,
  CloudSun,
  Globe,
  Settings,
  ChevronLeft,
  Maximize2,
  Image as ImageIcon
} from 'lucide-react';
import { useMedia, useTemplates } from '@/hooks/useApi';
import { api, API_BASE_URL } from '@/utils/api';
import { Template, Zone } from '@/types/dashboard';

interface TemplateTabProps {
  fetchTemplatesData: () => void;
}

interface DragState {
  zoneId: string;
  startX: number;
  startY: number;
  initialX: number;
  initialY: number;
  action: 'move' | 'resize-br'; // di chuyển hoặc resize góc dưới phải
}

const RESOLUTION_OPTIONS = [
  { label: '1920 * 1080 (16:9 Ngang)', value: '1920*1080' },
  { label: '1080 * 1920 (9:16 Dọc)', value: '1080*1920' },
  { label: '1024 * 768 (4:3)', value: '1024*768' },
  { label: '1280 * 720 (16:9)', value: '1280*720' },
  { label: '1280 * 800 (16:10)', value: '1280*800' },
  { label: '1440 * 2560', value: '1440*2560' },
  { label: '2560 * 1440', value: '2560*1440' },
  { label: '3840 * 2160 (4K)', value: '3840*2160' },
  { label: '540 * 1920 (Dọc dài)', value: '540*1920' },
  { label: '720 * 1280', value: '720*1280' },
  { label: '768 * 1024', value: '768*1024' },
  { label: '800 * 480', value: '800*480' },
  { label: 'Tùy chỉnh (Custom)', value: 'custom' }
];

export default function TemplateTab({ fetchTemplatesData }: TemplateTabProps) {
  const { templates, mutate: mutateTemplates } = useTemplates();
  const { mediaList } = useMedia();

  // Editor mode state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  // Form states in Editor
  const [templateName, setTemplateName] = useState('');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [selectedResolution, setSelectedResolution] = useState('1920*1080');
  const [canvasWidth, setCanvasWidth] = useState(1920);
  const [canvasHeight, setCanvasHeight] = useState(1080);
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  // UI dragging states
  const [dragState, setDragState] = useState<DragState | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [scaleFactor, setScaleFactor] = useState(0.4);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState('');

  // Draft (Local Storage) State & Effects for Template Layout
  const [draftStatus, setDraftStatus] = useState<'idle' | 'detected' | 'restored' | 'ignored'>('idle');

  useEffect(() => {
    if (isEditorOpen) {
      const draft = localStorage.getItem('cms_template_draft');
      if (draft) {
        setDraftStatus('detected');
      } else {
        setDraftStatus('idle');
      }
    } else {
      setDraftStatus('idle');
    }
  }, [isEditorOpen]);

  useEffect(() => {
    // Chỉ auto-save khi đang mở editor và không ở trạng thái phát hiện draft chưa giải quyết
    if (isEditorOpen && (draftStatus === 'restored' || draftStatus === 'ignored' || (draftStatus === 'idle' && !localStorage.getItem('cms_template_draft')))) {
      const draftData = {
        name: templateName,
        orientation,
        selectedResolution,
        width: canvasWidth,
        height: canvasHeight,
        zones,
        editingTemplateId: editingTemplate?.id || null
      };
      localStorage.setItem('cms_template_draft', JSON.stringify(draftData));
    }
  }, [templateName, orientation, selectedResolution, canvasWidth, canvasHeight, zones, isEditorOpen, draftStatus, editingTemplate]);

  const handleRestoreDraft = () => {
    try {
      const draftStr = localStorage.getItem('cms_template_draft');
      if (draftStr) {
        const draft = JSON.parse(draftStr);
        setTemplateName(draft.name || 'Bố cục mới');
        setOrientation(draft.orientation || 'landscape');
        setSelectedResolution(draft.selectedResolution || '1920*1080');
        setCanvasWidth(draft.width || 1920);
        setCanvasHeight(draft.height || 1080);
        setZones(draft.zones || []);
        setDraftStatus('restored');
      }
    } catch (e) {
      console.error('Lỗi khi khôi phục bản nháp template:', e);
    }
  };

  const handleClearDraft = () => {
    localStorage.removeItem('cms_template_draft');
    setDraftStatus('ignored');
  };

  const handleCloseEditor = () => {
    if (draftStatus === 'restored' || draftStatus === 'ignored') {
      localStorage.removeItem('cms_template_draft');
    }
    setIsEditorOpen(false);
  };

  // Cập nhật thời gian thực cho Widget Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toTimeString().split(' ')[0]);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Recalculate scale factor on window resize or when canvas changes
  useEffect(() => {
    if (!isEditorOpen || !canvasRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const containerWidth = entry.contentRect.width;
        // Chiều cao hiển thị giả lập tối đa mong muốn
        const maxDisplayHeight = 500;
        // Tính toán tỉ lệ co giãn theo cả 2 hướng để tránh tràn màn hình
        const scaleByWidth = (containerWidth - 40) / canvasWidth;
        const scaleByHeight = maxDisplayHeight / canvasHeight;
        const calculatedScale = Math.min(scaleByWidth, scaleByHeight);
        setScaleFactor(calculatedScale);
      }
    });

    const parent = canvasRef.current.parentElement;
    if (parent) {
      resizeObserver.observe(parent);
    }

    return () => resizeObserver.disconnect();
  }, [isEditorOpen, canvasWidth, canvasHeight]);

  // Adjust canvas parameters on resolution select
  const handleResolutionChange = (val: string) => {
    setSelectedResolution(val);
    if (val !== 'custom') {
      const [wStr, hStr] = val.split('*');
      const w = parseInt(wStr);
      const h = parseInt(hStr);
      setCanvasWidth(w);
      setCanvasHeight(h);
      setOrientation(w >= h ? 'landscape' : 'portrait');
    }
  };

  const handleCustomSizeChange = (dimension: 'width' | 'height', val: number) => {
    if (dimension === 'width') {
      setCanvasWidth(val);
      setOrientation(val >= canvasHeight ? 'landscape' : 'portrait');
    } else {
      setCanvasHeight(val);
      setOrientation(canvasWidth >= val ? 'landscape' : 'portrait');
    }
  };

  // ==========================================
  // ZONE LOGIC
  // ==========================================
  const handleAddZone = (type: 'media' | 'image' | 'text' | 'clock' | 'weather' | 'web') => {
    const zoneCount = zones.filter(z => z.type === type).length + 1;
    const tempId = `temp-zone-${Date.now()}`;

    // Thiết lập kích thước mặc định dựa trên loại zone
    let w = 400;
    let h = 300;
    if (type === 'text') {
      w = canvasWidth;
      h = 80;
    }

    const newZone: Zone = {
      id: tempId,
      name: `${type.toUpperCase()} Zone ${zoneCount}`,
      type,
      x: 50,
      y: 50,
      width: Math.min(w, canvasWidth - 100),
      height: Math.min(h, canvasHeight - 100),
      contentData: type === 'text' 
        ? { text: 'Chào mừng quý khách', speed: 'normal', color: '#000000', bgColor: '#ffffff' } 
        : type === 'image'
        ? { mediaIds: [], duration: 10 }
        : {}
    };

    setZones(prev => [...prev, newZone]);
    setSelectedZoneId(tempId);
  };

  const handleDeleteZone = (zoneId: string) => {
    setZones(prev => prev.filter(z => z.id !== zoneId));
    if (selectedZoneId === zoneId) {
      setSelectedZoneId(null);
    }
  };

  const handleUpdateZoneProp = (zoneId: string, prop: keyof Zone, value: unknown) => {
    setZones(prev => prev.map(z => z.id === zoneId ? { ...z, [prop]: value } : z));
  };

  const handleUpdateZoneContent = (zoneId: string, key: string, value: unknown) => {
    setZones(prev => prev.map(z => {
      if (z.id === zoneId) {
        const prevContent = z.contentData ?? {};
        return {
          ...z,
          contentData: {
            ...prevContent,
            [key]: value
          }
        };
      }
      return z;
    }));
  };

  // Media selection inside media zone
  const handleToggleMediaInZone = (zoneId: string, mediaId: string) => {
    setZones(prev => prev.map(z => {
      if (z.id === zoneId) {
        const content = z.contentData ?? {};
        const mediaIds = (content.mediaIds as string[]) ?? [];
        const exists = mediaIds.includes(mediaId);
        
        let newMediaIds: string[];
        if (exists) {
          newMediaIds = mediaIds.filter(id => id !== mediaId);
        } else {
          newMediaIds = [...mediaIds, mediaId];
        }

        return {
          ...z,
          contentData: {
            ...content,
            mediaIds: newMediaIds
          }
        };
      }
      return z;
    }));
  };

  // ==========================================
  // DRAG & DROP & RESIZE MOUSE EVENTS
  // ==========================================
  const handleMouseDown = (e: React.MouseEvent, zoneId: string, action: 'move' | 'resize-br') => {
    e.preventDefault();
    e.stopPropagation();
    
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return;

    setSelectedZoneId(zoneId);
    setDragState({
      zoneId,
      startX: e.clientX,
      startY: e.clientY,
      initialX: zone.x,
      initialY: zone.y,
      action
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState) return;

    const zone = zones.find(z => z.id === dragState.zoneId);
    if (!zone) return;

    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;

    // Quy đổi tọa độ chuột (pixel màn hình) sang pixel của Canvas thật
    const realDeltaX = Math.round(deltaX / scaleFactor);
    const realDeltaY = Math.round(deltaY / scaleFactor);

    if (dragState.action === 'move') {
      // Giới hạn trong Canvas
      const newX = Math.max(0, Math.min(dragState.initialX + realDeltaX, canvasWidth - zone.width));
      const newY = Math.max(0, Math.min(dragState.initialY + realDeltaY, canvasHeight - zone.height));

      setZones(prev => prev.map(z => z.id === dragState.zoneId ? { ...z, x: newX, y: newY } : z));
    } else if (dragState.action === 'resize-br') {
      // Resize góc dưới bên phải
      const newW = Math.max(50, Math.min(zone.width + realDeltaX, canvasWidth - zone.x));
      const newH = Math.max(20, Math.min(zone.height + realDeltaY, canvasHeight - zone.y));

      // Cập nhật tọa độ ban đầu để tracking liên tục
      setDragState(prev => prev ? { ...prev, startX: e.clientX, startY: e.clientY } : null);
      setZones(prev => prev.map(z => z.id === dragState.zoneId ? { ...z, width: newW, height: newH } : z));
    }
  };

  const handleMouseUp = () => {
    setDragState(null);
  };

  // ==========================================
  // SAVE TEMPLATE
  // ==========================================
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) {
      setErrorMsg('Vui lòng nhập tên Bố cục');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMsg(null);

      const payload = {
        name: templateName.trim(),
        width: canvasWidth,
        height: canvasHeight,
        orientation,
        // Dọn dẹp temp ID trước khi gửi lên server
        zones: zones.map(z => ({
          name: z.name,
          type: z.type,
          x: z.x,
          y: z.y,
          width: z.width,
          height: z.height,
          contentData: z.contentData ?? {}
        }))
      };

      if (editingTemplate?.id) {
        // Cập nhật template đã có
        await api.put(`/api/templates/${editingTemplate.id}`, payload);
      } else {
        // Tạo template mới
        await api.post('/api/templates', payload);
      }

      localStorage.removeItem('cms_template_draft');
      mutateTemplates();
      fetchTemplatesData();
      setIsEditorOpen(false);
      setEditingTemplate(null);
    } catch (error) {
      const err = error as Error;
      setErrorMsg(err.message || 'Lỗi khi lưu Bố cục');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setTemplateName('Bố cục mới');
    setOrientation('landscape');
    setSelectedResolution('1920*1080');
    setCanvasWidth(1920);
    setCanvasHeight(1080);
    setZones([]);
    setSelectedZoneId(null);
    setErrorMsg(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (template: Template) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setOrientation(template.orientation);
    setCanvasWidth(template.width);
    setCanvasHeight(template.height);

    // Xác định độ phân giải tương ứng trong danh sách chuẩn
    const resString = `${template.width}*${template.height}`;
    const isStandard = RESOLUTION_OPTIONS.some(opt => opt.value === resString);
    setSelectedResolution(isStandard ? resString : 'custom');

    setZones(template.zones ?? []);
    setSelectedZoneId(null);
    setErrorMsg(null);
    setIsEditorOpen(true);
  };

  const handleDeleteTemplate = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa Bố cục: ${name}?`)) return;

    try {
      await api.delete(`/api/templates/${id}`);
      mutateTemplates();
      fetchTemplatesData();
    } catch (error) {
      const err = error as Error;
      alert(err.message || 'Lỗi khi xóa Bố cục');
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

  // Render list of layouts
  if (!isEditorOpen) {
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
                    {tpl.zones?.length ?? 0} vùng
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
                    <span className="italic text-muted-foreground/60 text-[10px]">Chưa vẽ phân vùng nào</span>
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

  // ==========================================
  // RENDER WYSIWYG TEMPLATE DESIGNER
  // ==========================================
  const selectedZone = zones.find(z => z.id === selectedZoneId);

  return (
    <div className="space-y-4" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      {/* Editor Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleCloseEditor} className="rounded-full h-8 w-8 p-0">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h3 className="text-lg font-bold text-foreground">{editingTemplate ? 'Chỉnh sửa Bố cục' : 'Thiết kế Bố cục Mới'}</h3>
            <p className="text-xs text-muted-foreground">Kéo thả phân vùng và cấu hình tài nguyên trực quan</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" onClick={handleCloseEditor}>
            Hủy
          </Button>
          <Button onClick={handleSaveTemplate} disabled={isSaving} className="bg-primary text-primary-foreground font-semibold">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang lưu...
              </>
            ) : (
              'Lưu Layout'
            )}
          </Button>
        </div>
      </div>

      {draftStatus === 'detected' && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-500 text-xs p-4 rounded-lg flex items-center justify-between gap-4 font-medium animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 shrink-0 text-amber-500 animate-pulse" />
            <span>Phát hiện bản nháp bố cục chưa lưu từ phiên làm việc trước. Bạn có muốn khôi phục không?</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRestoreDraft}
              className="h-7 text-[10px] bg-amber-500 hover:bg-amber-600 text-white border-none font-semibold px-3 shadow-xs"
            >
              Khôi phục
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearDraft}
              className="h-7 text-[10px] text-muted-foreground hover:text-foreground font-semibold px-3"
            >
              Xóa nháp
            </Button>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm px-4 py-3 rounded-lg font-medium">
          {errorMsg}
        </div>
      )}

      {/* Editor Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left Side (3/4 width): Workspace/Canvas designer */}
        <div className="lg:col-span-3 space-y-4">
          {/* Controls to add zones */}
          <div className="bg-card border border-border p-3 rounded-lg flex flex-wrap items-center gap-2 shadow-xs">
            <span className="text-xs font-bold text-muted-foreground mr-2">Thêm Widget:</span>
            <Button type="button" variant="outline" size="sm" onClick={() => handleAddZone('media')} className="text-xs h-8 border-border">
              <Video className="h-3.5 w-3.5 mr-1 text-primary" /> Media Zone
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => handleAddZone('image')} className="text-xs h-8 border-border">
              <ImageIcon className="h-3.5 w-3.5 mr-1 text-blue-500" /> Hình ảnh
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => handleAddZone('text')} className="text-xs h-8 border-border">
              <Type className="h-3.5 w-3.5 mr-1 text-pink-500" /> Chữ chạy
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => handleAddZone('clock')} className="text-xs h-8 border-border">
              <Clock className="h-3.5 w-3.5 mr-1 text-emerald-500" /> Đồng hồ
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => handleAddZone('weather')} className="text-xs h-8 border-border">
              <CloudSun className="h-3.5 w-3.5 mr-1 text-amber-500" /> Thời tiết
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => handleAddZone('web')} className="text-xs h-8 border-border">
              <Globe className="h-3.5 w-3.5 mr-1 text-sky-500" /> Trang Web
            </Button>
          </div>

          {/* Canvas Wrapper */}
          <div className="bg-muted/30 border border-border rounded-xl p-6 flex items-center justify-center overflow-auto min-h-[500px]">
            <div
              ref={canvasRef}
              style={{
                width: `${canvasWidth * scaleFactor}px`,
                height: `${canvasHeight * scaleFactor}px`,
                position: 'relative'
              }}
              className="bg-white border-2 border-zinc-300 shadow-2xl overflow-hidden select-none transition-all duration-300"
            >
              {/* Grid background simulation */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:24px_24px]"></div>

              {/* Render Zones */}
              {zones.map((zone) => {
                const isSelected = selectedZoneId === zone.id;
                const mediaIds = (zone.contentData?.mediaIds as string[]) ?? [];
                const firstMediaId = mediaIds[0];
                const selectedMedia = firstMediaId ? mediaList.find(m => m.id === firstMediaId) : null;

                return (
                  <div
                    key={zone.id}
                    style={{
                      left: `${zone.x * scaleFactor}px`,
                      top: `${zone.y * scaleFactor}px`,
                      width: `${zone.width * scaleFactor}px`,
                      height: `${zone.height * scaleFactor}px`,
                      position: 'absolute'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedZoneId(zone.id!);
                    }}
                    onMouseDown={(e) => handleMouseDown(e, zone.id!, 'move')}
                    className={`rounded border flex flex-col justify-between p-2 cursor-move select-none transition-all relative overflow-hidden ${
                      isSelected
                        ? 'bg-primary/10 border-primary shadow-lg ring-1 ring-primary z-20 text-primary'
                        : 'bg-slate-50/90 border-slate-300 hover:bg-slate-100/90 hover:border-slate-400 z-10 text-slate-800'
                    }`}
                  >
                    {/* Widget Content Preview Layer (Absolute -z-10) */}
                    
                    {/* 1. Widget Hình ảnh Preview */}
                    {zone.type === 'image' && (
                      selectedMedia ? (
                        <div className="absolute inset-0 w-full h-full opacity-80 rounded overflow-hidden pointer-events-none -z-10">
                          <img
                            src={`${API_BASE_URL}${selectedMedia.fileUrl}`}
                            alt={selectedMedia.fileName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="absolute inset-0 w-full h-full bg-slate-100/80 flex items-center justify-center pointer-events-none -z-10">
                          <ImageIcon className="h-8 w-8 text-slate-300" />
                        </div>
                      )
                    )}

                    {/* 2. Widget Media Preview */}
                    {zone.type === 'media' && (
                      selectedMedia ? (
                        <div className="absolute inset-0 w-full h-full opacity-80 rounded overflow-hidden pointer-events-none -z-10">
                          {selectedMedia.mimeType.startsWith('video/') ? (
                            <video
                              src={`${API_BASE_URL}${selectedMedia.fileUrl}`}
                              className="w-full h-full object-cover"
                              autoPlay
                              muted
                              loop
                              playsInline
                            />
                          ) : (
                            <img
                              src={`${API_BASE_URL}${selectedMedia.fileUrl}`}
                              alt={selectedMedia.fileName}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      ) : (
                        <div className="absolute inset-0 w-full h-full bg-slate-100/80 flex items-center justify-center pointer-events-none -z-10">
                          <Video className="h-8 w-8 text-slate-300" />
                        </div>
                      )
                    )}

                    {/* 3. Widget Chữ chạy Preview */}
                    {zone.type === 'text' && (
                      <div
                        style={{
                          color: (zone.contentData?.color as string) || '#000000',
                          backgroundColor: (zone.contentData?.bgColor as string) || '#ffffff',
                        }}
                        className="absolute inset-0 w-full h-full flex items-center overflow-hidden pointer-events-none rounded border border-slate-200/50 -z-10"
                      >
                        {React.createElement(
                          'marquee',
                          { className: 'text-xs w-full font-bold' },
                          (zone.contentData?.text as string) || 'Chưa nhập nội dung chữ chạy...'
                        )}
                      </div>
                    )}

                    {/* 4. Widget Đồng hồ Preview */}
                    {zone.type === 'clock' && (
                      <div className="absolute inset-0 w-full h-full bg-emerald-500/10 text-emerald-600 flex flex-col items-center justify-center font-mono font-bold border border-emerald-200/30 rounded pointer-events-none -z-10">
                        <span className="text-xs md:text-sm tracking-widest">{currentTime || '12:00:00'}</span>
                        <span className="text-[8px] uppercase tracking-wider text-emerald-500/80">Đồng hồ</span>
                      </div>
                    )}

                    {/* 5. Widget Thời tiết Preview */}
                    {zone.type === 'weather' && (
                      <div className="absolute inset-0 w-full h-full bg-amber-500/10 text-amber-600 flex flex-col items-center justify-center font-bold border border-amber-200/30 rounded pointer-events-none -z-10 gap-0.5">
                        <CloudSun className="h-5 w-5 animate-pulse text-amber-500" />
                        <span className="text-xs">32°C</span>
                        <span className="text-[7px] uppercase tracking-wider text-amber-500/80">
                          {(zone.contentData?.city as string) === 'HaNoi' ? 'Hà Nội' : (zone.contentData?.city as string) === 'DaNang' ? 'Đà Nẵng' : 'Hồ Chí Minh'}
                        </span>
                      </div>
                    )}

                    {/* 6. Widget Trang Web Preview */}
                    {zone.type === 'web' && (
                      <div className="absolute inset-0 w-full h-full bg-sky-500/10 text-sky-600 flex flex-col items-center justify-center font-bold border border-sky-200/30 rounded pointer-events-none -z-10 p-1 text-center">
                        <Globe className="h-5 w-5 mb-0.5 text-sky-500" />
                        <span className="text-[8px] truncate w-full font-mono text-sky-500/80">
                          {(zone.contentData?.url as string) || 'https://smartretail.vn'}
                        </span>
                      </div>
                    )}

                    {/* Zone Header info */}
                    <div className="flex items-center justify-between gap-1 z-10 bg-background/80 backdrop-blur-[1px] px-1 py-0.5 rounded border border-border/20 w-full">
                      <span className="text-[9px] font-bold truncate max-w-[80%] flex items-center gap-1">
                        {getZoneIcon(zone.type)}
                        {zone.name}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteZone(zone.id!);
                        }}
                        className="h-4 w-4 text-muted-foreground hover:text-red-500 transition-colors flex items-center justify-center"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Zone Footer info */}
                    <div className="flex items-center justify-between mt-auto gap-2 z-10 bg-background/80 backdrop-blur-[1px] px-1 py-0.5 rounded border border-border/20 w-full">
                      <span className="text-[9px] text-slate-700 truncate max-w-[60%] font-medium">
                        {(zone.type === 'image' || zone.type === 'media') 
                          ? (selectedMedia ? selectedMedia.fileName : 'Chưa chọn tệp')
                          : zone.type.toUpperCase()
                        }
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono">
                        {zone.width}x{zone.height}
                      </span>
                    </div>

                    {/* Resize handle (bottom right corner) */}
                    {isSelected && (
                      <div
                        onMouseDown={(e) => handleMouseDown(e, zone.id!, 'resize-br')}
                        className="absolute bottom-0 right-0 h-3.5 w-3.5 cursor-se-resize bg-primary rounded-tl flex items-center justify-center text-primary-foreground z-30"
                      >
                        <Maximize2 className="h-2 w-2" />
                      </div>
                    )}
                  </div>
                );
              })}

              {zones.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center gap-2">
                  <Move className="h-8 w-8 text-muted-foreground/40 animate-pulse" />
                  <p className="text-xs text-muted-foreground italic">Canvas trống. Nhấp các nút thêm widget ở trên để vẽ phân vùng.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side (1/4 width): Properties panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-border bg-card shadow-sm h-full flex flex-col">
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Settings className="h-4 w-4 text-primary shrink-0" />
                {selectedZone ? 'Bảng thuộc tính Vùng' : 'Thông số chung Bố cục'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 flex-1 overflow-y-auto max-h-[500px]">
              
              {/* RENDER TEMPLATE LEVEL PROPERTIES */}
              {!selectedZone ? (
                <div key="template-props-panel" className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Tên Bố cục *</label>
                    <Input
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="Nhập tên bố cục"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Tỷ lệ / Độ phân giải màn hình</label>
                    <select
                      value={selectedResolution}
                      onChange={(e) => handleResolutionChange(e.target.value)}
                      className="w-full rounded border border-border p-2 bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {RESOLUTION_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {selectedResolution === 'custom' ? (
                    <div className="grid grid-cols-2 gap-2 border-t border-border pt-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground block font-bold">Rộng Custom (px)</label>
                        <Input
                          type="number"
                          value={canvasWidth}
                          onChange={(e) => handleCustomSizeChange('width', parseInt(e.target.value) || 100)}
                          className="h-8 text-xs"
                          min="100"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground block font-bold">Cao Custom (px)</label>
                        <Input
                          type="number"
                          value={canvasHeight}
                          onChange={(e) => handleCustomSizeChange('height', parseInt(e.target.value) || 100)}
                          className="h-8 text-xs"
                          min="100"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 border-t border-border pt-3">
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground block font-bold">Chiều rộng (px)</span>
                        <span className="font-semibold text-xs text-foreground bg-muted/40 px-2 py-1 rounded inline-block">{canvasWidth}px</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground block font-bold">Chiều cao (px)</span>
                        <span className="font-semibold text-xs text-foreground bg-muted/40 px-2 py-1 rounded inline-block">{canvasHeight}px</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1 pt-1 border-t border-border/50">
                    <span className="text-[10px] text-muted-foreground block font-bold">Hướng hiển thị</span>
                    <Badge variant="outline" className={`border-none text-[10px] ${
                      orientation === 'landscape' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-pink-500/10 text-pink-500'
                    }`}>
                      {orientation === 'landscape' ? 'Ngang (Landscape)' : 'Dọc (Portrait)'}
                    </Badge>
                  </div>

                  <div className="bg-muted/10 p-3 rounded-lg border border-border/50 space-y-2">
                    <span className="text-xs font-bold text-foreground block">Danh sách vùng ({zones.length})</span>
                    <div className="space-y-1 max-h-[150px] overflow-y-auto pr-1">
                      {zones.map(z => (
                        <div
                          key={z.id}
                          onClick={() => setSelectedZoneId(z.id!)}
                          className="flex items-center justify-between p-1.5 hover:bg-muted/50 rounded cursor-pointer text-xs"
                        >
                          <span className="truncate flex items-center gap-1 font-semibold">
                            {getZoneIcon(z.type)}
                            {z.name}
                          </span>
                          <span className="text-[9px] text-muted-foreground font-mono">{z.width}x{z.height}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* RENDER ZONE LEVEL PROPERTIES */
                <div key={`zone-props-panel-${selectedZone.id}`} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Tên phân vùng</label>
                    <Input
                      key={`zone-name-input-${selectedZone.id}`}
                      value={selectedZone.name}
                      onChange={(e) => handleUpdateZoneProp(selectedZone.id!, 'name', e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground block font-bold">Loại phân vùng</span>
                    <Badge variant="outline" className="border-border bg-muted/20 text-xs font-semibold py-1 gap-1">
                      {getZoneIcon(selectedZone.type)}
                      {selectedZone.type.toUpperCase()} Zone
                    </Badge>
                  </div>

                  {/* Positioning inputs */}
                  <div className="space-y-2 border-t border-border pt-4">
                    <span className="text-xs font-bold text-foreground block">Vị trí & Kích thước (px)</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground font-semibold">Tọa độ X</label>
                        <input
                          type="number"
                          value={selectedZone.x}
                          onChange={(e) => handleUpdateZoneProp(selectedZone.id!, 'x', Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full text-xs border border-border rounded p-1.5 bg-background text-foreground"
                          min="0"
                          max={canvasWidth}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground font-semibold">Tọa độ Y</label>
                        <input
                          type="number"
                          value={selectedZone.y}
                          onChange={(e) => handleUpdateZoneProp(selectedZone.id!, 'y', Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full text-xs border border-border rounded p-1.5 bg-background text-foreground"
                          min="0"
                          max={canvasHeight}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground font-semibold">Chiều rộng W</label>
                        <input
                          type="number"
                          value={selectedZone.width}
                          onChange={(e) => handleUpdateZoneProp(selectedZone.id!, 'width', Math.max(10, parseInt(e.target.value) || 10))}
                          className="w-full text-xs border border-border rounded p-1.5 bg-background text-foreground"
                          min="10"
                          max={canvasWidth}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground font-semibold">Chiều cao H</label>
                        <input
                          type="number"
                          value={selectedZone.height}
                          onChange={(e) => handleUpdateZoneProp(selectedZone.id!, 'height', Math.max(10, parseInt(e.target.value) || 10))}
                          className="w-full text-xs border border-border rounded p-1.5 bg-background text-foreground"
                          min="10"
                          max={canvasHeight}
                        />
                      </div>
                    </div>
                  </div>

                  {/* RENDER ZONE CONFIG DATA BASED ON TYPE */}
                  <div className="border-t border-border pt-4 space-y-3">
                    <span className="text-xs font-bold text-foreground block">Cấu hình Nội Dung</span>

                    {/* 1. MEDIA ZONE CONFIG */}
                    {selectedZone.type === 'media' && (
                      <div className="space-y-2">
                        <span className="text-[10px] text-muted-foreground block font-bold">Chọn tệp phát ({mediaList.length})</span>
                        <div className="border border-border rounded-md max-h-[160px] overflow-y-auto divide-y divide-border bg-background pr-1">
                          {mediaList.map(media => {
                            const mediaIds = (selectedZone.contentData?.mediaIds as string[]) ?? [];
                            const isSelected = mediaIds.includes(media.id);
                            return (
                              <div
                                key={media.id}
                                onClick={() => handleToggleMediaInZone(selectedZone.id!, media.id)}
                                className={`flex items-center justify-between p-2 cursor-pointer text-xs transition-colors ${
                                  isSelected ? 'bg-primary/5 font-semibold' : 'hover:bg-muted/30'
                                }`}
                              >
                                <span className="truncate max-w-[80%] text-foreground">{media.fileName}</span>
                                <div className={`h-4.5 w-4.5 rounded border flex items-center justify-center ${
                                  isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-border'
                                }`}>
                                  {isSelected && <Check className="h-2.5 w-2.5" />}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 2. IMAGE ZONE CONFIG */}
                    {selectedZone.type === 'image' && (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          {(() => {
                            const imageMediaList = mediaList.filter(media => media.mimeType.startsWith('image/'));
                            return (
                              <>
                                <span className="text-[10px] text-muted-foreground block font-bold">Chọn hình ảnh ({imageMediaList.length})</span>
                                <div className="border border-border rounded-md max-h-[160px] overflow-y-auto divide-y divide-border bg-background pr-1">
                                  {imageMediaList.map(media => {
                                    const mediaIds = (selectedZone.contentData?.mediaIds as string[]) ?? [];
                                    const isSelected = mediaIds.includes(media.id);
                                    return (
                                      <div
                                        key={media.id}
                                        onClick={() => handleToggleMediaInZone(selectedZone.id!, media.id)}
                                        className={`flex items-center justify-between p-2 cursor-pointer text-xs transition-colors ${
                                          isSelected ? 'bg-primary/5 font-semibold' : 'hover:bg-muted/30'
                                        }`}
                                      >
                                        <span className="truncate max-w-[80%] text-foreground">{media.fileName}</span>
                                        <div className={`h-4.5 w-4.5 rounded border flex items-center justify-center ${
                                          isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-border'
                                        }`}>
                                          {isSelected && <Check className="h-2.5 w-2.5" />}
                                        </div>
                                      </div>
                                    );
                                  })}
                                  {imageMediaList.length === 0 && (
                                    <div className="p-4 text-center text-xs text-muted-foreground italic">
                                      Không tìm thấy hình ảnh nào trong thư viện phương tiện.
                                    </div>
                                  )}
                                </div>
                              </>
                            );
                          })()}
                        </div>

                        {((selectedZone.contentData?.mediaIds as string[]) ?? []).length > 1 && (
                          <div className="space-y-1">
                            <label className="text-[10px] text-muted-foreground block font-bold">Thời gian chuyển ảnh (giây)</label>
                            <Input
                              type="number"
                              value={(selectedZone.contentData?.duration as number) ?? 10}
                              onChange={(e) => handleUpdateZoneContent(selectedZone.id!, 'duration', Math.max(1, parseInt(e.target.value) || 10))}
                              className="h-8 text-xs"
                              min="1"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* 2. TEXT MARQUEE ZONE CONFIG */}
                    {selectedZone.type === 'text' && (
                      <div className="space-y-2.5">
                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground font-semibold">Nội dung văn bản</label>
                          <Input
                            key={`text-content-input-${selectedZone.id}`}
                            value={(selectedZone.contentData?.text as string) ?? ''}
                            onChange={(e) => handleUpdateZoneContent(selectedZone.id!, 'text', e.target.value)}
                            placeholder="Chào mừng quý khách..."
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] text-muted-foreground font-semibold">Màu chữ</label>
                            <Input
                              type="color"
                              value={(selectedZone.contentData?.color as string) ?? '#000000'}
                              onChange={(e) => handleUpdateZoneContent(selectedZone.id!, 'color', e.target.value)}
                              className="h-8 p-0 cursor-pointer"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-muted-foreground font-semibold">Màu nền</label>
                            <Input
                              type="color"
                              value={(selectedZone.contentData?.bgColor as string) ?? '#ffffff'}
                              onChange={(e) => handleUpdateZoneContent(selectedZone.id!, 'bgColor', e.target.value)}
                              className="h-8 p-0 cursor-pointer"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground font-semibold">Tốc độ chạy chữ</label>
                          <select
                            value={(selectedZone.contentData?.speed as string) ?? 'normal'}
                            onChange={(e) => handleUpdateZoneContent(selectedZone.id!, 'speed', e.target.value)}
                            className="w-full rounded border border-border p-1 bg-background text-xs text-foreground focus:outline-none"
                          >
                            <option value="slow">Chậm</option>
                            <option value="normal">Bình thường</option>
                            <option value="fast">Nhanh</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* 3. WEB EMBED CONFIG */}
                    {selectedZone.type === 'web' && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-muted-foreground font-semibold">Liên kết trang Web (URL)</label>
                        <Input
                          key={`web-url-input-${selectedZone.id}`}
                          value={(selectedZone.contentData?.url as string) ?? ''}
                          onChange={(e) => handleUpdateZoneContent(selectedZone.id!, 'url', e.target.value)}
                          placeholder="https://example.com"
                        />
                      </div>
                    )}

                    {/* 4. WEATHER CONFIG */}
                    {selectedZone.type === 'weather' && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-muted-foreground font-semibold">Chọn thành phố</label>
                        <select
                          value={(selectedZone.contentData?.city as string) ?? 'HoChiMinh'}
                          onChange={(e) => handleUpdateZoneContent(selectedZone.id!, 'city', e.target.value)}
                          className="w-full rounded border border-border p-1 bg-background text-xs text-foreground focus:outline-none"
                        >
                          <option value="HoChiMinh">Thành phố Hồ Chí Minh</option>
                          <option value="HaNoi">Thủ đô Hà Nội</option>
                          <option value="DaNang">Thành phố Đà Nẵng</option>
                        </select>
                      </div>
                    )}

                    {/* 5. CLOCK CONFIG */}
                    {selectedZone.type === 'clock' && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-muted-foreground font-semibold">Kiểu đồng hồ</label>
                        <select
                          value={(selectedZone.contentData?.clockType as string) ?? 'digital'}
                          onChange={(e) => handleUpdateZoneContent(selectedZone.id!, 'clockType', e.target.value)}
                          className="w-full rounded border border-border p-1 bg-background text-xs text-foreground focus:outline-none"
                        >
                          <option value="digital">Đồng hồ số (Digital)</option>
                          <option value="analog">Đồng hồ kim (Analog)</option>
                        </select>
                      </div>
                    )}

                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedZoneId(null)}
                    className="w-full text-xs mt-4"
                  >
                    Bỏ chọn Vùng
                  </Button>
                </div>
              )}

            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
