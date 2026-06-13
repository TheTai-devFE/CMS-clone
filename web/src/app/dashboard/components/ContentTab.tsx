import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  RefreshCw,
  Image as ImageIcon,
  Play,
  Trash,
  Globe,
  FileText
} from 'lucide-react';
import { getFileUrl } from '@/utils/api';

interface MediaItem {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: string;
  mimeType: string;
  checksum: string;
  createdAt: string;
}

interface ContentTabProps {
  mediaList: MediaItem[];
  uploading: boolean;
  handleUploadClick: () => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDeleteMedia: (id: string, name: string) => void;
  setPreviewVideoUrl: (url: string | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  API_BASE_URL: string;
  formatBytes: (bytes: string | number) => string;
  onOpenWebUrlModal: () => void;
}

export default function ContentTab({
  mediaList,
  uploading,
  handleUploadClick,
  handleFileChange,
  handleDeleteMedia,
  setPreviewVideoUrl,
  fileInputRef,
  API_BASE_URL,
  formatBytes,
  onOpenWebUrlModal
}: ContentTabProps) {
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
        {mediaList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-lg bg-muted/10 gap-3">
            <ImageIcon className="h-12 w-12 text-muted-foreground/60" />
            <div className="text-center">
              <h3 className="font-semibold text-lg">Thư viện trống</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">Hãy tải tệp tin ảnh hoặc video MP4 đầu tiên lên hệ thống.</p>
            </div>
          </div>
        ) : (
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
                  setPreviewVideoUrl(media.fileUrl); // Web URL can be rendered directly via iframe
                } else if (isPdf) {
                  setPreviewVideoUrl(getFileUrl(media.fileUrl)); // PDF preview via iframe
                } else if (isSlides) {
                  // Preview Office slides using Microsoft Office Web Viewer (or local if available)
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
                      <img
                        src={getFileUrl(media.fileUrl)}
                        alt={media.fileName}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
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
        )}
      </CardContent>
    </Card>
  );
}
