import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Settings, Clock, Check, Search, Film } from 'lucide-react';
import { MediaItem } from '@/types/dashboard';
import { SlideData } from './SlideSidebar';
import { getFileUrl } from '@/utils/api';


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

interface PropertiesPanelProps {
  templateName: string;
  onChangeTemplateName: (name: string) => void;
  selectedResolution: string;
  onChangeResolution: (res: string) => void;
  canvasWidth: number;
  canvasHeight: number;
  onChangeCustomSize: (dimension: 'width' | 'height', value: number) => void;
  orientation: 'landscape' | 'portrait';
  activeSlide: SlideData | null;
  activeSlideIndex: number;
  onChangeSlideDuration: (duration: number) => void;
  mediaList: MediaItem[];
  onAssignMediaToSlide: (mediaId: string, type: 'image' | 'media') => void;
  apiBaseUrl: string;
}

export default function PropertiesPanel({
  templateName,
  onChangeTemplateName,
  selectedResolution,
  onChangeResolution,
  canvasWidth,
  canvasHeight,
  onChangeCustomSize,
  orientation,
  activeSlide,
  activeSlideIndex,
  onChangeSlideDuration,
  mediaList,
  onAssignMediaToSlide,
  apiBaseUrl
}: PropertiesPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');

  // Filter media list by search query and type tab selection
  const filteredMedia = mediaList.filter(media => {
    const matchesSearch = media.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    const isImg = media.mimeType.startsWith('image/');
    const isVid = media.mimeType.startsWith('video/');

    if (filterType === 'image') return matchesSearch && isImg;
    if (filterType === 'video') return matchesSearch && isVid;
    return matchesSearch && (isImg || isVid); // show only compatible files
  });

  return (
    <div className="w-80 shrink-0 border-l border-border bg-card flex flex-col h-[calc(100vh-12rem)] min-h-[500px] rounded-r-xl overflow-hidden">
      
      {/* Tab Control: Slide Config vs Template Config */}
      <div className="p-3 border-b border-border/60 bg-muted/20">
        <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Settings className="h-4 w-4 text-primary shrink-0" />
          Bảng cấu hình
        </span>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
        
        {/* 1. LAYOUT SETTINGS SECTION */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-foreground/80 border-b border-border/40 pb-1 uppercase tracking-wider">
            Bố cục chung
          </h4>
          
          {/* Layout Name */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Tên Bố cục *</label>
            <Input
              value={templateName}
              onChange={(e) => onChangeTemplateName(e.target.value)}
              placeholder="Nhập tên bố cục"
              className="h-8 text-xs font-semibold"
            />
          </div>

          {/* Resolution Options */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Tỷ lệ màn hình</label>
            <select
              value={selectedResolution}
              onChange={(e) => onChangeResolution(e.target.value)}
              className="w-full h-8 rounded-md border border-input px-2 py-1 bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            >
              {RESOLUTION_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Custom Size Fields */}
          {selectedResolution === 'custom' ? (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="space-y-1">
                <label className="text-[9px] font-semibold text-muted-foreground block uppercase">Rộng (px)</label>
                <Input
                  type="number"
                  value={canvasWidth}
                  onChange={(e) => onChangeCustomSize('width', Math.max(100, parseInt(e.target.value) || 100))}
                  className="h-8 text-xs font-mono"
                  min="100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-semibold text-muted-foreground block uppercase">Cao (px)</label>
                <Input
                  type="number"
                  value={canvasHeight}
                  onChange={(e) => onChangeCustomSize('height', Math.max(100, parseInt(e.target.value) || 100))}
                  className="h-8 text-xs font-mono"
                  min="100"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between text-[11px] bg-muted/40 p-2 rounded-md border border-border/40">
              <span className="font-semibold text-muted-foreground">Kích thước chuẩn:</span>
              <span className="font-bold font-mono text-foreground">{canvasWidth}x{canvasHeight} px</span>
            </div>
          )}

          {/* Orientation Indicator */}
          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className="font-semibold text-muted-foreground">Hướng màn hình:</span>
            <Badge variant="outline" className={`border-none text-[9px] font-bold px-2 py-0.5 rounded-full ${
              orientation === 'landscape' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-pink-500/10 text-pink-500'
            }`}>
              {orientation === 'landscape' ? 'Ngang (Landscape)' : 'Dọc (Portrait)'}
            </Badge>
          </div>
        </div>

        {/* 2. ACTIVE SLIDE SETTINGS SECTION */}
        {activeSlide && (
          <div className="space-y-3 pt-3 border-t border-border/60">
            <h4 className="text-xs font-bold text-foreground/80 border-b border-border/40 pb-1 uppercase tracking-wider flex items-center justify-between">
              <span>Trang hiện tại (Trang {activeSlideIndex + 1})</span>
              <Badge variant="secondary" className="text-[9px] font-bold bg-primary/10 text-primary border-none">
                Đang sửa
              </Badge>
            </h4>

            {/* Slide Duration Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                Thời gian trình chiếu (giây)
              </label>
              <Input
                type="number"
                value={activeSlide.duration}
                onChange={(e) => onChangeSlideDuration(Math.max(1, parseInt(e.target.value) || 1))}
                className="h-8 text-xs font-mono"
                min="1"
              />
            </div>

            {/* Media Selector (Library Grid) */}
            <div className="space-y-2 pt-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Gán hình ảnh / video</label>
              
              {/* Search input inside panel */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/60" />
                <Input
                  placeholder="Tìm kiếm tài nguyên..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>

              {/* Type Filter Buttons */}
              <div className="flex border border-border bg-muted/30 p-0.5 rounded-md text-[10px] font-semibold">
                <button
                  type="button"
                  onClick={() => setFilterType('all')}
                  className={`flex-1 py-1 rounded text-center transition-all ${filterType === 'all' ? 'bg-background shadow-xs text-foreground font-bold' : 'text-muted-foreground'}`}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('image')}
                  className={`flex-1 py-1 rounded text-center transition-all ${filterType === 'image' ? 'bg-background shadow-xs text-foreground font-bold' : 'text-muted-foreground'}`}
                >
                  Ảnh
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('video')}
                  className={`flex-1 py-1 rounded text-center transition-all ${filterType === 'video' ? 'bg-background shadow-xs text-foreground font-bold' : 'text-muted-foreground'}`}
                >
                  Video
                </button>
              </div>

              {/* Media List Grid */}
              <div className="border border-border rounded-lg max-h-[200px] overflow-y-auto divide-y divide-border/60 bg-muted/10 pr-1 scrollbar-thin">
                {filteredMedia.map((media) => {
                  const isSelected = activeSlide.mediaId === media.id;
                  const isMediaVideo = media.mimeType.startsWith('video/');

                  return (
                    <div
                      key={media.id}
                      onClick={() => onAssignMediaToSlide(media.id, isMediaVideo ? 'media' : 'image')}
                      className={`flex items-center justify-between p-2 cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary/10 font-bold border-l-2 border-primary' : 'hover:bg-muted/80 bg-background'
                      }`}
                    >
                      <div className="flex items-center gap-2 max-w-[80%]">
                        {/* Little media preview icon */}
                        <div className="h-6 w-6 rounded overflow-hidden shrink-0 border border-border/40 bg-zinc-100 flex items-center justify-center">
                          {isMediaVideo ? (
                            <Film className="h-3.5 w-3.5 text-blue-500" />
                          ) : (
                            <img
                              src={getFileUrl(media.fileUrl)}
                              alt={media.fileName}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <span className="truncate text-[11px] text-foreground">{media.fileName}</span>
                      </div>
                      
                      {/* Select indicator */}
                      <div className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-border bg-background'
                      }`}>
                        {isSelected && <Check className="h-2.5 w-2.5" />}
                      </div>
                    </div>
                  );
                })}

                {filteredMedia.length === 0 && (
                  <div className="p-4 text-center text-[10px] text-muted-foreground italic">
                    Không tìm thấy tệp phù hợp trong thư viện
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
