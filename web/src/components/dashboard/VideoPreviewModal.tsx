import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';

interface VideoPreviewModalProps {
  previewVideoUrl: string | null;
  setPreviewVideoUrl: (url: string | null) => void;
}

export default function VideoPreviewModal({
  previewVideoUrl,
  setPreviewVideoUrl
}: VideoPreviewModalProps) {
  if (!previewVideoUrl) return null;

  // Detect file type from URL
  const isVideo = previewVideoUrl.toLowerCase().endsWith('.mp4') ||
                  (previewVideoUrl.includes('/uploads/') && !previewVideoUrl.toLowerCase().endsWith('.pdf') && !previewVideoUrl.toLowerCase().endsWith('.pptx') && !previewVideoUrl.toLowerCase().endsWith('.ppt'));
  const isPdf = previewVideoUrl.toLowerCase().endsWith('.pdf') || previewVideoUrl.toLowerCase().includes('.pdf');
  const isOffice = previewVideoUrl.includes('officeapps.live.com');

  const getTitle = () => {
    if (isVideo) return 'Xem trước video quảng cáo';
    if (isPdf) return 'Xem trước tài liệu PDF';
    if (isOffice) return 'Xem trước Slide thuyết trình';
    return 'Xem trước trang Web';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150" onClick={() => setPreviewVideoUrl(null)}>
      <Card className="w-full max-w-4xl bg-card border-border/80 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40 bg-muted/10">
          <div>
            <CardTitle className="text-sm font-bold text-foreground">{getTitle()}</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setPreviewVideoUrl(null)} className="h-7 w-7 rounded-md hover:bg-muted/50">
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </Button>
        </CardHeader>
        <CardContent className="p-0 bg-black flex items-center justify-center h-[60vh] md:h-[65vh] w-full relative">
          {isVideo ? (
            <video src={previewVideoUrl} controls autoPlay className="w-full h-full object-contain" />
          ) : (
            <iframe
              src={previewVideoUrl}
              className="w-full h-full border-none bg-white"
              title="Media Preview"
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
