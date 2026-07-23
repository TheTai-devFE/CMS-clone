import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  RefreshCw,
  Image as ImageIcon,
  Play,
  Trash,
  Globe,
  FileText,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Filter,
} from 'lucide-react';
import { getFileUrl } from '@/utils/api';
import type { MediaTypeFilter } from '@/app/dashboard/content/ContentPageClient';

interface MediaItem {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: string;
  mimeType: string;
  checksum: string;
  createdAt: string;
}

interface MediaTypeCounts {
  all: number;
  image: number;
  video: number;
  pdf: number;
  url: number;
  slides: number;
}

interface ContentTabProps {
  mediaList: MediaItem[];
  // Server-side pagination props (controlled from ContentPageClient)
  total: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (size: number) => void;
  // Actions
  uploading: boolean;
  handleUploadClick: () => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDeleteMedia: (id: string, name: string) => void;
  setPreviewVideoUrl: (url: string | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  formatBytes: (bytes: string | number) => string;
  onOpenWebUrlModal: () => void;
  // T3: Media type filter
  mediaTypeFilter?: MediaTypeFilter;
  onMediaTypeFilterChange?: (filter: MediaTypeFilter) => void;
  mediaTypeCounts?: MediaTypeCounts;
}

const PAGE_SIZE_OPTIONS = [10, 20, 40];

// T3: Cấu hình filter chip
const FILTER_OPTIONS: Array<{
  value: MediaTypeFilter;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  activeClass: string;
}> = [
  {
    value: "all",
    label: "Tất cả",
    icon: LayoutGrid,
    colorClass: "text-muted-foreground",
    activeClass: "bg-primary text-primary-foreground border-primary",
  },
  {
    value: "image",
    label: "Hình ảnh",
    icon: ImageIcon,
    colorClass: "text-blue-500",
    activeClass: "bg-blue-500 text-white border-blue-500",
  },
  {
    value: "video",
    label: "Video",
    icon: Play,
    colorClass: "text-purple-500",
    activeClass: "bg-purple-500 text-white border-purple-500",
  },
  {
    value: "pdf",
    label: "PDF",
    icon: FileText,
    colorClass: "text-red-500",
    activeClass: "bg-red-500 text-white border-red-500",
  },
  {
    value: "url",
    label: "Trang web",
    icon: Globe,
    colorClass: "text-emerald-500",
    activeClass: "bg-emerald-500 text-white border-emerald-500",
  },
];

export default function ContentTab({
  mediaList,
  total,
  totalPages,
  currentPage,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  uploading,
  handleUploadClick,
  handleFileChange,
  handleDeleteMedia,
  setPreviewVideoUrl,
  fileInputRef,
  formatBytes,
  onOpenWebUrlModal,
  mediaTypeFilter = "all",
  onMediaTypeFilterChange,
  mediaTypeCounts,
}: ContentTabProps) {
  // mediaList is already the current page from server – no client-side slicing needed
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * itemsPerPage;
  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl">Thư viện Media</CardTitle>
          <CardDescription>Quản lý hình ảnh và video trình phát quảng cáo</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,video/mp4,application/pdf,.ppt,.pptx"
            multiple
            className="hidden"
          />
          <Button
            onClick={onOpenWebUrlModal}
            variant="outline"
            size="sm"
            className="h-9 text-xs border border-border/80 hover:bg-muted/50 rounded-lg font-semibold shrink-0"
          >
            <Globe className="mr-1.5 h-4 w-4 text-primary" /> Nhúng trang Web
          </Button>
          <Button onClick={handleUploadClick} disabled={uploading} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold rounded-lg h-9 shrink-0">
            {uploading ? (
              <>
                <RefreshCw className="mr-1.5 h-4 w-4 animate-spin" />
                Đang tải lên...
              </>
            ) : (
              <>
                <Plus className="mr-1.5 h-4 w-4" /> Tải tệp lên
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {mediaList.length === 0 ? (() => {
          const activeFilter = FILTER_OPTIONS.find((o) => o.value === mediaTypeFilter);
          const EmptyIcon = activeFilter?.icon ?? ImageIcon;
          const emptyTitle =
            mediaTypeFilter === "all"
              ? "Thư viện trống"
              : `Không có ${activeFilter?.label.toLowerCase() ?? ""} trong trang này`;
          const emptyDesc =
            mediaTypeFilter === "all"
              ? "Hãy tải tệp tin ảnh hoặc video MP4 đầu tiên lên hệ thống."
              : "Thử chuyển sang bộ lọc khác hoặc tải lên tệp mới.";
          return (
            <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-lg bg-muted/10 gap-3">
              <EmptyIcon
                className={`h-12 w-12 ${activeFilter?.colorClass ?? "text-muted-foreground/60"}`}
              />
              <div className="text-center">
                <h3 className="font-semibold text-lg">{emptyTitle}</h3>
                <p className="text-sm text-muted-foreground max-w-sm mt-1">{emptyDesc}</p>
                {mediaTypeFilter !== "all" && onMediaTypeFilterChange && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onMediaTypeFilterChange("all")}
                    className="mt-3"
                  >
                    <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
                    Xem tất cả
                  </Button>
                )}
              </div>
            </div>
          );
        })() : (
          <>
            {/* T3: Filter chips (Image / Video / PDF / Web) */}
            {onMediaTypeFilterChange && (
              <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1">
                <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0 mr-1" />
                {FILTER_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isActive = mediaTypeFilter === opt.value;
                  const count = mediaTypeCounts?.[opt.value] ?? 0;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => onMediaTypeFilterChange(opt.value)}
                      className={`h-8 px-3 border text-xs rounded-lg font-semibold transition-all duration-150 flex items-center gap-1.5 shrink-0 ${
                        isActive
                          ? opt.activeClass + " shadow-xs"
                          : `bg-card border-border hover:bg-muted/40 ${opt.colorClass}`
                      }`}
                      aria-pressed={isActive}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {opt.label}
                      <span
                        className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold leading-none ${
                          isActive
                            ? "bg-white/20"
                            : "bg-muted/60 text-muted-foreground"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Toolbar: tổng số + page size */}
            <div className="flex items-center justify-between mb-4 text-xs select-none">
              <span className="text-muted-foreground">
                Hiển thị{" "}
                <strong className="font-mono bg-muted/60 border border-border/30 px-1.5 py-0.5 rounded text-foreground font-bold">
                  {startIdx + 1}–{Math.min(startIdx + itemsPerPage, total)}
                </strong>{" "}
                trên{" "}
                <strong className="font-semibold text-foreground">{total}</strong>{" "}
                tệp
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground font-normal mr-1">Mỗi trang:</span>
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <button
                    key={n}
                    onClick={() => onItemsPerPageChange(n)}
                    className={`h-7 px-2.5 border text-xs rounded-lg font-semibold transition-all duration-150 ${
                      itemsPerPage === n
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-card border-border hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid */}
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-5">
              {mediaList.map((media) => {
                const isVideo = media.mimeType.startsWith('video/');
                const isUrl = media.mimeType === 'url';
                const isPdf = media.mimeType === 'application/pdf';
                const isSlides = media.mimeType.includes('presentation') || media.mimeType.includes('powerpoint');

                const getFileTypeLabel = () => {
                  if (isVideo) return 'Video MP4';
                  if (isUrl) return 'Trang Web';
                  if (isPdf) return 'Tài liệu PDF';
                  if (isSlides) return 'Slide PowerPoint';
                  return 'Hình ảnh';
                };

                const handlePreview = () => {
                  if (isVideo) {
                    setPreviewVideoUrl(getFileUrl(media.fileUrl));
                  } else if (isUrl) {
                    setPreviewVideoUrl(media.fileUrl);
                  } else if (isPdf) {
                    setPreviewVideoUrl(getFileUrl(media.fileUrl));
                  } else if (isSlides) {
                    setPreviewVideoUrl(`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(getFileUrl(media.fileUrl))}`);
                  }
                };

                return (
                  <Card key={media.id} className="overflow-hidden border-border bg-background shadow-xs group select-none">
                    <div
                      className="relative aspect-video bg-muted cursor-pointer overflow-hidden flex items-center justify-center"
                      onClick={handlePreview}
                    >
                      {isVideo ? (
                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity">
                          <Play className="h-9 w-9 text-primary bg-background/95 rounded-full p-2 shadow-lg" />
                          <span className="text-[11px] text-white font-semibold mt-1.5">Xem video</span>
                        </div>
                      ) : isUrl ? (
                        <div className="absolute inset-0 bg-primary/5 dark:bg-primary/10 flex flex-col items-center justify-center group-hover:bg-primary/10 transition-colors">
                          <Globe className="h-8 w-8 text-primary" />
                          <span className="text-[10px] text-primary font-bold tracking-wider uppercase mt-2">Web Page</span>
                        </div>
                      ) : isPdf ? (
                        <div className="absolute inset-0 bg-red-500/5 dark:bg-red-500/10 flex flex-col items-center justify-center group-hover:bg-red-500/10 transition-colors">
                          <FileText className="h-8 w-8 text-red-500" />
                          <span className="text-[10px] text-red-500 font-bold tracking-wider uppercase mt-2">Tài liệu PDF</span>
                        </div>
                      ) : isSlides ? (
                        <div className="absolute inset-0 bg-orange-500/5 dark:bg-orange-500/10 flex flex-col items-center justify-center group-hover:bg-orange-500/10 transition-colors">
                          <FileText className="h-8 w-8 text-orange-500" />
                          <span className="text-[10px] text-orange-500 font-bold tracking-wider uppercase mt-2">PowerPoint</span>
                        </div>
                      ) : (
                        <Image
                          src={getFileUrl(media.fileUrl)}
                          alt={media.fileName}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-200"
                          unoptimized
                        />
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h4 className="font-bold text-sm truncate" title={media.fileName}>
                        {media.fileName}
                      </h4>
                      <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                        <span className="font-medium">{getFileTypeLabel()}</span>
                        <span className="font-mono">{isUrl ? '—' : formatBytes(media.fileSize)}</span>
                      </div>
                      <div className="text-[10px] text-mono text-muted-foreground truncate mt-1 bg-muted/30 px-2 py-1 rounded">
                        MD5: {media.checksum}
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex justify-end border-t border-border/50 mt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMedia(media.id, media.fileName)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                      >
                        <Trash className="h-4 w-4 mr-1" /> Xóa
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 text-xs font-semibold select-none">
                <span className="text-muted-foreground font-normal">
                  Trang{" "}
                  <strong className="text-foreground">{safePage}</strong>{" "}
                  trên{" "}
                  <strong className="text-foreground">{totalPages}</strong>
                </span>

                <div className="flex items-center gap-1.5">
                  {/* Về trang đầu */}
                  <button
                    onClick={() => onPageChange(1)}
                    disabled={safePage === 1}
                    className="h-8 px-2.5 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-[11px]"
                  >
                    «
                  </button>

                  {/* Trang trước */}
                  <button
                    onClick={() => onPageChange(safePage - 1)}
                    disabled={safePage === 1}
                    className="h-8 w-8 flex items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-muted/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {/* Page numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                    .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                      if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, idx) =>
                      p === '...' ? (
                        <span key={`ellipsis-${idx}`} className="h-8 px-1 flex items-center text-muted-foreground">
                          …
                        </span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => onPageChange(p as number)}
                          className={`h-8 min-w-[32px] px-2 rounded-xl border text-xs font-semibold transition-all duration-150 ${
                            safePage === p
                              ? "bg-primary text-primary-foreground border-primary shadow-xs"
                              : "bg-card border-border hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}

                  {/* Trang sau */}
                  <button
                    onClick={() => onPageChange(safePage + 1)}
                    disabled={safePage === totalPages}
                    className="h-8 w-8 flex items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-muted/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>

                  {/* Về trang cuối */}
                  <button
                    onClick={() => onPageChange(totalPages)}
                    disabled={safePage === totalPages}
                    className="h-8 px-2.5 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-[11px]"
                  >
                    »
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
