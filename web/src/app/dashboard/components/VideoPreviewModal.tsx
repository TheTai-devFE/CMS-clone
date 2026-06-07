import React from 'react';
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setPreviewVideoUrl(null)}>
      <Card className="w-full max-w-3xl bg-card border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/50">
          <div>
            <CardTitle className="text-base font-semibold">Xem trước video quảng cáo</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setPreviewVideoUrl(null)} className="h-8 w-8 rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-0 bg-black aspect-video flex items-center justify-center">
          <video src={previewVideoUrl} controls autoPlay className="w-full h-full object-contain" />
        </CardContent>
      </Card>
    </div>
  );
}
