"use client";

import React, { useRef, useState } from "react";
import { useDashboard } from "@/app/dashboard/context/DashboardContext";
import { api } from "@/utils/api";
import ContentTab from "@/components/dashboard/ContentTab";
import VideoPreviewModal from "@/components/dashboard/VideoPreviewModal";
import CreateWebUrlModal from "@/components/dashboard/CreateWebUrlModal";
import { useMedia } from "@/hooks/useApi";

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

  // Use SWR hook for caching and automatic revalidation
  const { mediaList, total, totalPages, mutate } = useMedia(currentPage, itemsPerPage);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [isWebUrlModalOpen, setIsWebUrlModalOpen] = useState(false);

  // Filter media on current page based on search query
  const filteredMedia = mediaList.filter((m) =>
    m.fileName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
