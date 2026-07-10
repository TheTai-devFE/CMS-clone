import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2, Layers } from 'lucide-react';
import { api, API_BASE_URL } from '@/utils/api';
import { Template, MediaItem } from '@/types/dashboard';

import SlideSidebar, { SlideData } from './SlideSidebar';
import SlideCanvas from './SlideCanvas';
import PropertiesPanel from './PropertiesPanel';

interface TemplateEditorProps {
  editingTemplate: Template | null;
  mediaList: MediaItem[];
  onClose: () => void;
  onSave: () => void;
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

export default function TemplateEditor({
  editingTemplate,
  mediaList,
  onClose,
  onSave
}: TemplateEditorProps) {
  // Layout States
  const [templateName, setTemplateName] = useState('');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [selectedResolution, setSelectedResolution] = useState('1920*1080');
  const [canvasWidth, setCanvasWidth] = useState(1920);
  const [canvasHeight, setCanvasHeight] = useState(1080);

  // Slides State
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);

  // UI States
  const [scaleFactor, setScaleFactor] = useState(0.4);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  // Draft (Local Storage) States
  const [draftStatus, setDraftStatus] = useState<'idle' | 'detected' | 'restored' | 'ignored'>('idle');

  // Load layout data or initialize default slide on mount
  useEffect(() => {
    if (editingTemplate) {
      setTemplateName(editingTemplate.name);
      setOrientation(editingTemplate.orientation);
      setCanvasWidth(editingTemplate.width);
      setCanvasHeight(editingTemplate.height);
      
      const resString = `${editingTemplate.width}*${editingTemplate.height}`;
      const isStandard = RESOLUTION_OPTIONS.some(opt => opt.value === resString);
      setSelectedResolution(isStandard ? resString : 'custom');

      if (editingTemplate.zones && editingTemplate.zones.length > 0) {
        // Map zones to slides
        const initialSlides: SlideData[] = editingTemplate.zones
          .map((z) => {
            const mediaIds = (z.contentData?.mediaIds as string[]) ?? [];
            const duration = (z.contentData?.duration as number) ?? 10;
            const order = (z.contentData?.order as number) ?? 1;
            return {
              id: z.id || `temp-slide-${Date.now()}-${Math.random()}`,
              mediaId: mediaIds[0] || null,
              duration,
              type: (z.type as 'image' | 'media') || 'image',
              order
            };
          })
          .sort((a, b) => a.order - b.order);
        setSlides(initialSlides);
        setActiveSlideId(initialSlides[0]?.id || null);
      } else {
        const defaultId = `slide-${Date.now()}`;
        setSlides([{ id: defaultId, mediaId: null, duration: 10, type: 'image' }]);
        setActiveSlideId(defaultId);
      }
    } else {
      // Create new template default
      setTemplateName('Bố cục mới');
      setOrientation('landscape');
      setSelectedResolution('1920*1080');
      setCanvasWidth(1920);
      setCanvasHeight(1080);
      const defaultId = `slide-${Date.now()}`;
      setSlides([{ id: defaultId, mediaId: null, duration: 10, type: 'image' }]);
      setActiveSlideId(defaultId);
    }
  }, [editingTemplate]);

  // Check draft existence on load
  useEffect(() => {
    const draft = localStorage.getItem('cms_template_draft');
    if (draft) {
      setDraftStatus('detected');
    } else {
      setDraftStatus('idle');
    }
  }, []);

  // Autosave draft trigger
  useEffect(() => {
    if (
      slides.length > 0 &&
      (draftStatus === 'restored' ||
        draftStatus === 'ignored' ||
        (draftStatus === 'idle' && !localStorage.getItem('cms_template_draft')))
    ) {
      const draftData = {
        name: templateName,
        orientation,
        selectedResolution,
        width: canvasWidth,
        height: canvasHeight,
        slides,
        editingTemplateId: editingTemplate?.id || null
      };
      localStorage.setItem('cms_template_draft', JSON.stringify(draftData));
    }
  }, [templateName, orientation, selectedResolution, canvasWidth, canvasHeight, slides, draftStatus, editingTemplate]);

  // Recalculate scale factor on window resize or when dimensions change
  useEffect(() => {
    if (!canvasRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const containerWidth = entry.contentRect.width;
        const maxDisplayHeight = 500;
        
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
  }, [canvasWidth, canvasHeight]);

  // Resolution selection change handler
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

  // Custom dimensions change handler
  const handleCustomSizeChange = (dimension: 'width' | 'height', val: number) => {
    if (dimension === 'width') {
      setCanvasWidth(val);
      setOrientation(val >= canvasHeight ? 'landscape' : 'portrait');
    } else {
      setCanvasHeight(val);
      setOrientation(canvasWidth >= val ? 'landscape' : 'portrait');
    }
  };

  // Restoration and clearing of drafts
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
        setSlides(draft.slides || []);
        if (draft.slides && draft.slides.length > 0) {
          setActiveSlideId(draft.slides[0].id);
        }
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
    onClose();
  };

  // Add slide action
  const handleAddSlide = () => {
    const tempId = `temp-slide-${Date.now()}`;
    const newSlide: SlideData = {
      id: tempId,
      mediaId: null,
      duration: 10,
      type: 'image'
    };
    setSlides(prev => [...prev, newSlide]);
    setActiveSlideId(tempId);
  };

  // Delete slide action
  const handleDeleteSlide = (id: string) => {
    if (slides.length <= 1) return; // Must keep at least 1 slide

    const itemIndex = slides.findIndex(s => s.id === id);
    const updatedSlides = slides.filter(s => s.id !== id);

    setSlides(updatedSlides);

    // If deleted slide was active, switch to an adjacent slide
    if (activeSlideId === id) {
      const nextActiveIndex = Math.min(itemIndex, updatedSlides.length - 1);
      setActiveSlideId(updatedSlides[nextActiveIndex]?.id || null);
    }
  };

  // Re-order slides action (move slide up or down)
  const handleMoveSlide = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === slides.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updatedSlides = [...slides];
    
    // Swap items
    const temp = updatedSlides[index];
    updatedSlides[index] = updatedSlides[targetIndex];
    updatedSlides[targetIndex] = temp;

    setSlides(updatedSlides);
  };

  // Update duration for active slide
  const handleUpdateSlideDuration = (duration: number) => {
    if (!activeSlideId) return;
    setSlides(prev => prev.map(s => s.id === activeSlideId ? { ...s, duration } : s));
  };

  // Assign media library item to active slide
  const handleAssignMediaToSlide = (mediaId: string, type: 'image' | 'media') => {
    if (!activeSlideId) return;
    setSlides(prev => prev.map(s => s.id === activeSlideId ? { ...s, mediaId, type } : s));
  };

  // Save template submit handler
  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      setErrorMsg('Vui lòng nhập tên Bố cục');
      return;
    }

    const hasEmptySlides = slides.some(s => !s.mediaId);
    if (hasEmptySlides) {
      setErrorMsg('Vui lòng gán hình ảnh hoặc video cho tất cả các trang trước khi lưu.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMsg(null);

      // Package slide data into DB format (zones)
      const payload = {
        name: templateName.trim(),
        width: canvasWidth,
        height: canvasHeight,
        orientation,
        zones: slides.map((slide, idx) => ({
          name: `Slide ${idx + 1}`,
          type: slide.type,
          x: 0,
          y: 0,
          width: canvasWidth,
          height: canvasHeight,
          contentData: {
            mediaIds: slide.mediaId ? [slide.mediaId] : [],
            duration: slide.duration,
            order: idx + 1
          }
        }))
      };

      if (editingTemplate?.id) {
        await api.put(`/api/templates/${editingTemplate.id}`, payload);
      } else {
        await api.post('/api/templates', payload);
      }

      localStorage.removeItem('cms_template_draft');
      onSave();
      onClose();
    } catch (err) {
      const error = err as Error;
      setErrorMsg(error.message || 'Lỗi khi lưu Bố cục');
    } finally {
      setIsSaving(false);
    }
  };

  const activeSlide = slides.find(s => s.id === activeSlideId) || null;
  const activeSlideIndex = slides.findIndex(s => s.id === activeSlideId);

  return (
    <div className="space-y-4">
      {/* Editor Header Banner */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleCloseEditor} className="rounded-full h-8 w-8 p-0">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h3 className="text-lg font-bold text-foreground">
              {editingTemplate ? 'Chỉnh sửa Bố cục (PPTX)' : 'Thiết kế Bố cục Mới (PPTX)'}
            </h3>
            <p className="text-xs text-muted-foreground">Tạo và quản lý các slide trình chiếu toàn màn hình tuần tự</p>
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

      {/* Local Storage Draft Warning */}
      {draftStatus === 'detected' && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-500 text-xs p-3 rounded-lg flex items-center justify-between gap-4 font-medium animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 shrink-0 text-amber-500 animate-pulse" />
            <span>Phát hiện bản nháp trình thiết kế chưa lưu từ phiên làm việc trước. Bạn có muốn khôi phục không?</span>
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

      {/* Error Message Box */}
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm px-4 py-3 rounded-lg font-medium animate-in fade-in duration-150">
          {errorMsg}
        </div>
      )}

      {/* Editor Grid Area (PPTX Interface) */}
      <div className="flex gap-4 items-start bg-card border border-border p-3 rounded-2xl shadow-sm">
        
        {/* Left Side: Slide Thumbnails List */}
        <SlideSidebar
          slides={slides}
          activeSlideId={activeSlideId}
          mediaList={mediaList}
          apiBaseUrl={API_BASE_URL}
          onSelectSlide={setActiveSlideId}
          onAddSlide={handleAddSlide}
          onDeleteSlide={handleDeleteSlide}
          onMoveSlide={handleMoveSlide}
        />

        {/* Center: Slide Live Simulator */}
        <SlideCanvas
          activeSlide={activeSlide}
          mediaList={mediaList}
          apiBaseUrl={API_BASE_URL}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          scaleFactor={scaleFactor}
          canvasRef={canvasRef}
        />

        {/* Right Side: Properties Panel & Media Picker */}
        <PropertiesPanel
          templateName={templateName}
          onChangeTemplateName={setTemplateName}
          selectedResolution={selectedResolution}
          onChangeResolution={handleResolutionChange}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          onChangeCustomSize={handleCustomSizeChange}
          orientation={orientation}
          activeSlide={activeSlide}
          activeSlideIndex={activeSlideIndex}
          onChangeSlideDuration={handleUpdateSlideDuration}
          mediaList={mediaList}
          onAssignMediaToSlide={handleAssignMediaToSlide}
          apiBaseUrl={API_BASE_URL}
        />

      </div>
    </div>
  );
}
