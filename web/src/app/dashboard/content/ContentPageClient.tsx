'use client';

import React, { useRef, useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { api } from '@/utils/api';
import { Button } from "@/components/ui/button";
import ContentTab from '../components/ContentTab';
import PlaylistTab from '../components/PlaylistTab';
import TemplateTab from '../components/TemplateTab';
import VideoPreviewModal from '../components/VideoPreviewModal';
import { useMedia, useTemplates, usePlaylists } from '@/hooks/useApi';

export default function ContentPageClient() {
  const {
    searchQuery,
    uploading,
    setUploading,
    setError,
    setSuccessMsg,
    formatBytes,
    API_BASE_URL
  } = useDashboard();

  // Use SWR hook for caching and automatic revalidation
  const { mediaList, mutate } = useMedia();
  const { mutate: mutateTemplates } = useTemplates();
  const { playlists, mutate: mutatePlaylists } = usePlaylists();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'media' | 'playlists' | 'templates'>('media');

  // Filter media based on search query
  const filteredMedia = mediaList.filter(m => 
    m.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const isValidType = file.type.startsWith('image/') || file.type === 'video/mp4';
    if (!isValidType) {
      setError('Chi cho phep tai len file anh (.png, .jpg, .jpeg) hoac video (.mp4)');
      return;
    }

    setUploading(true);
    setError('');
    setSuccessMsg('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/api/media/upload', formData, { useMultipart: true });
      setSuccessMsg(`Tai len tep thanh cong: ${file.name}`);
      // Mutate SWR cache to reload media library
      mutate();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Khong the upload file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteMedia = async (id: string, name: string) => {
    if (!confirm(`Ban co chac chan muon xoa file: ${name}?`)) return;

    setError('');
    setSuccessMsg('');
    try {
      await api.delete(`/api/media/${id}`);
      setSuccessMsg('Da xoa tep tin thanh cong');
      // Mutate SWR cache to reload media library
      mutate();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Khong the xoa tep');
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Sub-tab navigation header */}
      <div className="flex border-b border-border bg-card/30 p-1.5 rounded-lg w-fit gap-1">
        <Button
          type="button"
          variant={activeSubTab === 'media' ? 'default' : 'ghost'}
          onClick={() => setActiveSubTab('media')}
          className="text-xs h-8 font-semibold shadow-none"
        >
          Thư viện phương tiện
        </Button>
        <Button
          type="button"
          variant={activeSubTab === 'playlists' ? 'default' : 'ghost'}
          onClick={() => setActiveSubTab('playlists')}
          className="text-xs h-8 font-semibold shadow-none"
        >
          Danh sách phát (Playlists)
        </Button>
        <Button
          type="button"
          variant={activeSubTab === 'templates' ? 'default' : 'ghost'}
          onClick={() => setActiveSubTab('templates')}
          className="text-xs h-8 font-semibold shadow-none"
        >
          Mẫu bố cục (Layouts)
        </Button>
      </div>

      {activeSubTab === 'media' ? (
        <ContentTab
          mediaList={filteredMedia}
          uploading={uploading}
          handleUploadClick={handleUploadClick}
          handleFileChange={handleFileChange}
          handleDeleteMedia={handleDeleteMedia}
          setPreviewVideoUrl={setPreviewVideoUrl}
          fileInputRef={fileInputRef}
          API_BASE_URL={API_BASE_URL}
          formatBytes={formatBytes}
        />
      ) : activeSubTab === 'playlists' ? (
        <PlaylistTab
          playlists={playlists || []}
          fetchPlaylistsData={mutatePlaylists}
        />
      ) : (
        <TemplateTab
          fetchTemplatesData={mutateTemplates}
        />
      )}

      <VideoPreviewModal
        previewVideoUrl={previewVideoUrl}
        setPreviewVideoUrl={setPreviewVideoUrl}
      />
    </div>
  );
}
