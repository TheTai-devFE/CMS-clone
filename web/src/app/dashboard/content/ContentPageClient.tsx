"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDashboard } from "@/app/dashboard/context/DashboardContext";
import { api } from "@/utils/api";
import ContentTab from "@/components/dashboard/ContentTab";
import VideoPreviewModal from "@/components/dashboard/VideoPreviewModal";
import CreateWebUrlModal from "@/components/dashboard/CreateWebUrlModal";
import { useMedia } from "@/hooks/useApi";

// T3: Loại filter media. 'all' = không filter.
export type MediaTypeFilter = "all" | "image" | "video" | "pdf" | "url";

const VALID_FILTERS: MediaTypeFilter[] = ["all", "image", "video", "pdf", "url"];

function isValidFilter(s: string | null): s is MediaTypeFilter {
  return !!s && (VALID_FILTERS as string[]).includes(s);
}

/**
 * Phân loại 1 media item theo mimeType.
 * Phải khớp với logic ở ContentTab.tsx (isVideo/isUrl/isPdf/isSlides).
 */
export function getMediaType(mimeType: string): "image" | "video" | "pdf" | "url" | "slides" {
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType === "url") return "url";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "slides";
  return "image";
}

export default function ContentPageClient() {
  const {
    searchQuery,
    uploading,
    setUploading,
    setError,
    setSuccessMsg,
    formatBytes,
  } = useDashboard();

  // Pagination state – controlled here so SWR key changes trigger refetch
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // T3: Media type filter (Image / Video / PDF / Web) + URL sync
  const [mediaTypeFilter, setMediaTypeFilter] = useState<MediaTypeFilter>("all");

  // Sync filter với URL query param ?type=...
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const t = params.get("type");
    if (isValidFilter(t) && t !== mediaTypeFilter) {
      setMediaTypeFilter(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateFilter = useCallback((next: MediaTypeFilter) => {
    setMediaTypeFilter(next);
    setCurrentPage(1); // Reset về trang 1 khi đổi filter
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (next === "all") {
        url.searchParams.delete("type");
      } else {
        url.searchParams.set("type", next);
      }
      // Dùng replace để không tạo history entry mỗi lần click
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  // Use SWR hook for caching and automatic revalidation
  const { mediaList, total, totalPages, mutate } = useMedia(currentPage, itemsPerPage);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [isWebUrlModalOpen, setIsWebUrlModalOpen] = useState(false);

  // T3: Filter theo type TRƯỚC (giảm false positive từ search),
  //      rồi search theo tên trên kết quả đã filter.
  const filteredMedia = useMemo(() => {
    let list = mediaList;
    if (mediaTypeFilter !== "all") {
      list = list.filter((m) => getMediaType(m.mimeType) === mediaTypeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((m) => m.fileName.toLowerCase().includes(q));
    }
    return list;
  }, [mediaList, mediaTypeFilter, searchQuery]);

  // T3: Count từng loại trong mediaList hiện tại (chính xác trong trang này).
  // Note: đây là count trong 1 page, không phải total. Đủ dùng cho UX MVP.
  const counts = useMemo(() => {
    const c = { all: mediaList.length, image: 0, video: 0, pdf: 0, url: 0, slides: 0 };
    for (const m of mediaList) {
      const t = getMediaType(m.mimeType);
      c[t]++;
    }
    return c;
  }, [mediaList]);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleItemsPerPageChange = (size: number) => {
    setItemsPerPage(size);
    setCurrentPage(1);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);

    // Check if any selected files are invalid (accepting images, mp4, pdf, ppt, pptx)
    const invalidFiles = fileList.filter((file) => {
      const type = file.type;
      const name = file.name.toLowerCase();
      const isImageOrVideo = type.startsWith("image/") || type === "video/mp4";
      const isPdf = type === "application/pdf" || name.endsWith(".pdf");
      const isSlides =
        type.includes("presentation") ||
        type.includes("powerpoint") ||
        name.endsWith(".pptx") ||
        name.endsWith(".ppt");
      return !(isImageOrVideo || isPdf || isSlides);
    });

    if (invalidFiles.length > 0) {
      setError(
        `Chỉ cho phép tải lên ảnh, video (.mp4), PDF (.pdf) hoặc Slide thuyết trình (.pptx, .ppt). Phát hiện ${invalidFiles.length} tệp không hợp lệ.`,
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    setError("");
    setSuccessMsg("Đang tải lên các tệp...");

    try {
      // Upload all files in parallel
      const uploadResults = await Promise.allSettled(
        fileList.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          await api.post("/api/media/upload", formData, { useMultipart: true });
          return file.name;
        }),
      );

      const succeeded = uploadResults
        .filter((r) => r.status === "fulfilled")
        .map((r) => (r as PromiseFulfilledResult<string>).value);
      const failed = uploadResults
        .filter((r) => r.status === "rejected")
        .map((r) => (r as PromiseRejectedResult).reason);

      if (failed.length === 0) {
        setSuccessMsg(`Tải lên thành công ${succeeded.length} tệp.`);
      } else {
        const errorDetails = failed
          .map((err) =>
            err instanceof Error ? err.message : "Lỗi không xác định",
          )
          .join(", ");
        setError(
          `Tải lên hoàn thành: ${succeeded.length} thành công, ${failed.length} thất bại. Chi tiết lỗi: ${errorDetails}`,
        );
        if (succeeded.length > 0) {
          setSuccessMsg(`Đã tải lên thành công: ${succeeded.join(", ")}`);
        }
      }

      // Mutate SWR cache to reload media library
      mutate();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể upload file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteMedia = async (id: string, name: string) => {
    if (!confirm(`Ban co chac chan muon xoa file: ${name}?`)) return;

    setError("");
    setSuccessMsg("");
    try {
      await api.delete(`/api/media/${id}`);
      setSuccessMsg("Da xoa tep tin thanh cong");
      // Mutate SWR cache to reload media library
      mutate();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Khong the xoa tep");
    }
  };

  return (
    <div className="space-y-6 w-full">
      <ContentTab
        mediaList={filteredMedia}
        total={total}
        totalPages={totalPages}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
        uploading={uploading}
        handleUploadClick={handleUploadClick}
        handleFileChange={handleFileChange}
        handleDeleteMedia={handleDeleteMedia}
        setPreviewVideoUrl={setPreviewVideoUrl}
        fileInputRef={fileInputRef}
        formatBytes={formatBytes}
        onOpenWebUrlModal={() => setIsWebUrlModalOpen(true)}
        // T3 props
        mediaTypeFilter={mediaTypeFilter}
        onMediaTypeFilterChange={updateFilter}
        mediaTypeCounts={counts}
      />

      <VideoPreviewModal
        previewVideoUrl={previewVideoUrl}
        setPreviewVideoUrl={setPreviewVideoUrl}
      />

      <CreateWebUrlModal
        isOpen={isWebUrlModalOpen}
        onClose={() => setIsWebUrlModalOpen(false)}
        onSuccess={mutate}
        setError={setError}
        setSuccessMsg={setSuccessMsg}
      />
    </div>
  );
}
