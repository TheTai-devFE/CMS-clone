import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  X,
  Check,
  Loader2,
  Clock,
  ArrowUp,
  ArrowDown,
  Video,
  Upload,
  AlertTriangle,
  Play
} from 'lucide-react';
import { useMedia } from '@/hooks/useApi';
import { api, API_BASE_URL } from '@/utils/api';
import { Playlist, MediaItem } from '@/types/dashboard';

interface PlaylistTabProps {
  playlists: Playlist[];
  fetchPlaylistsData: () => void;
}

interface SelectedMediaItem {
  mediaId: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  sortOrder: number;
  duration: number;
  transitionEffect: string;
}

const RESOLUTION_OPTIONS = [
  { label: 'FullHD Ngang - 1920 * 1080 (16:9)', value: '1920*1080', ratio: '16:9', width: 1920, height: 1080 },
  { label: 'FullHD Dọc - 1080 * 1920 (9:16)', value: '1080*1920', ratio: '9:16', width: 1080, height: 1920 },
  { label: '4K Ngang - 3840 * 2160 (16:9)', value: '3840*2160', ratio: '16:9', width: 3840, height: 2160 },
  { label: '4K Dọc - 2160 * 3840 (9:16)', value: '2160*3840', ratio: '9:16', width: 2160, height: 3840 }
];

export default function PlaylistTab({ playlists, fetchPlaylistsData }: PlaylistTabProps) {
  const { mediaList, mutate: mutateMedia } = useMedia();

  // Modal & Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);

  // Form States
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDesc, setPlaylistDesc] = useState('');
  const [selectedResValue, setSelectedResValue] = useState('1920*1080');
  const [selectedMedia, setSelectedMedia] = useState<SelectedMediaItem[]>([]);
  const [isSyncGroup, setIsSyncGroup] = useState(false);

  // Preview State
  const [previewItem, setPreviewItem] = useState<SelectedMediaItem | null>(null);

  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Draft (Local Storage) State & Effects
  const [draftStatus, setDraftStatus] = useState<'idle' | 'detected' | 'restored' | 'ignored'>('idle');



  useEffect(() => {
    // Chỉ auto-save khi đang mở modal và không ở trạng thái phát hiện draft chưa giải quyết
    if (isModalOpen && (draftStatus === 'restored' || draftStatus === 'ignored' || (draftStatus === 'idle' && !localStorage.getItem('cms_playlist_draft')))) {
      const draftData = {
        playlistName,
        playlistDesc,
        selectedResValue,
        selectedMedia,
        isSyncGroup,
        editingPlaylistId: editingPlaylist?.id || null
      };
      localStorage.setItem('cms_playlist_draft', JSON.stringify(draftData));
    }
  }, [playlistName, playlistDesc, selectedResValue, selectedMedia, isSyncGroup, isModalOpen, draftStatus, editingPlaylist]);

  const handleRestoreDraft = () => {
    try {
      const draftStr = localStorage.getItem('cms_playlist_draft');
      if (draftStr) {
        const draft = JSON.parse(draftStr);
        setPlaylistName(draft.playlistName || '');
        setPlaylistDesc(draft.playlistDesc || '');
        setSelectedResValue(draft.selectedResValue || '1920*1080');
        setSelectedMedia(draft.selectedMedia || []);
        setIsSyncGroup(draft.isSyncGroup || false);
        setDraftStatus('restored');
      }
    } catch (e) {
      console.error('Lỗi khi khôi phục bản nháp:', e);
    }
  };

  const handleClearDraft = () => {
    localStorage.removeItem('cms_playlist_draft');
    setDraftStatus('ignored');
  };

  const handleCloseModal = () => {
    if (draftStatus === 'restored' || draftStatus === 'ignored') {
      localStorage.removeItem('cms_playlist_draft');
    }
    setIsModalOpen(false);
  };

  // Set default preview item when selectedMedia changes
  useEffect(() => {
    if (selectedMedia.length > 0) {
      if (!previewItem || !selectedMedia.some(m => m.mediaId === previewItem.mediaId)) {
        const timer = setTimeout(() => {
          setPreviewItem(selectedMedia[0]);
        }, 0);
        return () => clearTimeout(timer);
      }
    } else {
      if (previewItem !== null) {
        const timer = setTimeout(() => {
          setPreviewItem(null);
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [selectedMedia, previewItem]);

  const handleOpenCreate = () => {
    setEditingPlaylist(null);
    setPlaylistName('');
    setPlaylistDesc('');
    setSelectedResValue('1920*1080');
    setSelectedMedia([]);
    setIsSyncGroup(false);
    setPreviewItem(null);
    setErrorMsg(null);

    const draft = localStorage.getItem('cms_playlist_draft');
    if (draft) {
      setDraftStatus('detected');
    } else {
      setDraftStatus('idle');
    }

    setIsModalOpen(true);
  };

  const handleOpenEdit = async (playlist: Playlist) => {
    try {
      setEditingPlaylist(playlist);
      setPlaylistName(playlist.playlistName);
      setPlaylistDesc(playlist.description || '');
      setIsSyncGroup(playlist.isSyncGroup || false);
      setErrorMsg(null);

      // Parse resolution from syncLayout
      interface SyncLayoutConfig {
        width?: number;
        height?: number;
      }
      const syncLayout = (playlist as { syncLayout?: SyncLayoutConfig }).syncLayout;
      if (syncLayout?.width && syncLayout?.height) {
        const resVal = `${syncLayout.width}*${syncLayout.height}`;
        setSelectedResValue(resVal);
      } else {
        setSelectedResValue('1920*1080');
      }

      // Fetch playlist items
      interface BackendPlaylistItem {
        id: string;
        sortOrder: number;
        duration: number;
        transitionEffect: string;
        media: {
          id: string;
          fileName: string;
          fileUrl: string;
          mimeType: string;
        };
      }
      const items = await api.get(`/api/playlists/${playlist.id}/items`) as BackendPlaylistItem[];
      
      const mappedItems: SelectedMediaItem[] = items.map(item => ({
        mediaId: item.media.id,
        fileName: item.media.fileName,
        fileUrl: item.media.fileUrl,
        mimeType: item.media.mimeType,
        sortOrder: item.sortOrder,
        duration: item.duration,
        transitionEffect: item.transitionEffect
      }));

      setSelectedMedia(mappedItems);
      if (mappedItems.length > 0) {
        setPreviewItem(mappedItems[0]);
      }
      setIsModalOpen(true);
    } catch (error) {
      const err = error as Error;
      alert(err.message || 'Lỗi khi tải chi tiết Playlist');
    }
  };

  const handleDeletePlaylist = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa Playlist: ${name}?`)) return;

    try {
      await api.delete(`/api/playlists/${id}`);
      fetchPlaylistsData();
    } catch (error) {
      const err = error as Error;
      alert(err.message || 'Lỗi khi xóa Playlist');
    }
  };

  const handleToggleMedia = (media: MediaItem) => {
    const exists = selectedMedia.some(m => m.mediaId === media.id);
    if (exists) {
      setSelectedMedia(prev => prev.filter(m => m.mediaId !== media.id).map((m, idx) => ({ ...m, sortOrder: idx + 1 })));
    } else {
      const newItem: SelectedMediaItem = {
        mediaId: media.id,
        fileName: media.fileName,
        fileUrl: media.fileUrl,
        mimeType: media.mimeType,
        sortOrder: selectedMedia.length + 1,
        duration: 15, // Mặc định chạy 15 giây
        transitionEffect: 'none'
      };
      setSelectedMedia(prev => [...prev, newItem]);
    }
  };

  const handleUpdateDuration = (mediaId: string, duration: number) => {
    setSelectedMedia(prev =>
      prev.map(m => (m.mediaId === mediaId ? { ...m, duration: Math.max(1, duration) } : m))
    );
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === selectedMedia.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...selectedMedia];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    const reordered = updated.map((m, idx) => ({ ...m, sortOrder: idx + 1 }));
    setSelectedMedia(reordered);
  };

  const handleUploadFilesClick = () => {
    fileInputRef.current?.click();
  };

  const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingFiles(true);
    setErrorMsg(null);

    const uploadPromises = Array.from(files).map(async (file) => {
      const isValidType = file.type.startsWith('image/') || file.type === 'video/mp4';
      if (!isValidType) {
        throw new Error(`File không hợp lệ: ${file.name}. Chỉ cho phép (.png, .jpg, .jpeg, .mp4)`);
      }

      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/api/media/upload', formData, { useMultipart: true }) as MediaItem;
      
      return {
        mediaId: res.id,
        fileName: res.fileName,
        fileUrl: res.fileUrl,
        mimeType: res.mimeType,
        sortOrder: 0, // Sẽ gán sau
        duration: 15,
        transitionEffect: 'none'
      };
    });

    try {
      const results = await Promise.all(uploadPromises);
      mutateMedia(); // Cập nhật cache thư viện phương tiện

      setSelectedMedia(prev => {
        const startIdx = prev.length;
        const mappedResults = results.map((item, idx) => ({
          ...item,
          sortOrder: startIdx + idx + 1
        }));
        const newMediaList = [...prev, ...mappedResults];
        if (newMediaList.length > 0 && !previewItem) {
          setPreviewItem(mappedResults[0]);
        }
        return newMediaList;
      });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi khi tải tệp lên');
    } finally {
      setUploadingFiles(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSavePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistName.trim()) {
      setErrorMsg('Vui lòng nhập tên Playlist');
      return;
    }

    const selectedOption = RESOLUTION_OPTIONS.find(opt => opt.value === selectedResValue);
    if (!selectedOption) return;

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const playlistPayload = {
        playlistName: playlistName.trim(),
        description: playlistDesc.trim(),
        isSyncGroup,
        syncLayout: {
          width: selectedOption.width,
          height: selectedOption.height,
          aspectRatio: selectedOption.ratio,
          scaleMode: 'stretch' // Tự động kéo dãn bóp hình theo tỉ lệ gốc chọn ban đầu
        }
      };

      let playlistId = '';
      if (editingPlaylist) {
        playlistId = editingPlaylist.id;
        await api.put(`/api/playlists/${playlistId}`, playlistPayload);
      } else {
        const created = await api.post('/api/playlists', playlistPayload) as Playlist;
        playlistId = created.id;
      }

      // Lưu danh sách items
      await api.post(`/api/playlists/${playlistId}/items`, {
        items: selectedMedia.map(m => ({
          mediaId: m.mediaId,
          sortOrder: m.sortOrder,
          duration: m.duration,
          transitionEffect: m.transitionEffect
        }))
      });

      localStorage.removeItem('cms_playlist_draft');
      fetchPlaylistsData();
      setIsModalOpen(false);
    } catch (error) {
      const err = error as Error;
      setErrorMsg(err.message || 'Lỗi khi lưu Playlist');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter media list in library
  const filteredMedia = mediaList.filter(media =>
    media.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPlaylistResLabel = (playlist: Playlist) => {
    interface SyncLayoutConfig {
      width?: number;
      height?: number;
      aspectRatio?: string;
    }
    const syncLayout = (playlist as { syncLayout?: SyncLayoutConfig }).syncLayout;
    if (syncLayout?.width && syncLayout?.height) {
      return `${syncLayout.width}x${syncLayout.height} (${syncLayout.aspectRatio || '16:9'})`;
    }
    return 'Chưa cấu hình (16:9)';
  };

  const getSelectedResRatio = () => {
    const selectedOption = RESOLUTION_OPTIONS.find(opt => opt.value === selectedResValue);
    return selectedOption?.ratio || '16:9';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">Bố cục đơn vùng (Layout Playlists)</h3>
          <p className="text-xs text-muted-foreground">Tạo danh sách phát toàn màn hình có tỉ lệ FullHD/4K và co dãn hình ảnh</p>
        </div>
        <Button onClick={handleOpenCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
          <Plus className="mr-2 h-4 w-4" /> Tạo Playlist
        </Button>
      </div>

      {/* Grid of Playlists */}
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {playlists.map((pl) => (
          <Card key={pl.id} className="bg-card border-border hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden relative">
            <CardHeader className="pb-3 bg-muted/10">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <CardTitle className="text-sm font-bold text-foreground truncate max-w-[155px]" title={pl.playlistName}>
                    {pl.playlistName}
                  </CardTitle>
                  <CardDescription className="text-[10px] truncate max-w-[155px]">
                    {pl.description || 'Không có mô tả'}
                  </CardDescription>
                </div>
                {pl.isSyncGroup && (
                  <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-500 text-[8px] border-none font-semibold">
                    Đồng bộ
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="py-4 text-xs text-muted-foreground space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span>Tỉ lệ:</span>
                <span className="font-semibold text-foreground">{getPlaylistResLabel(pl)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Ngày tạo:</span>
                <span className="font-semibold text-foreground">
                  {new Date(pl.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </CardContent>
            <CardFooter className="p-3 border-t border-border flex justify-end gap-2 bg-muted/5">
              <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(pl)} className="text-primary hover:text-primary/90 text-xs">
                Sửa Playlist
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDeletePlaylist(pl.id, pl.playlistName)} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs">
                Xóa
              </Button>
            </CardFooter>
          </Card>
        ))}

        {playlists.length === 0 && (
          <div className="col-span-full py-16 border border-dashed border-border rounded-xl flex flex-col items-center justify-center bg-muted/5 gap-3">
            <Video className="h-10 w-10 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground italic">Chưa có Layout Playlist nào.</p>
            <Button onClick={handleOpenCreate} variant="link" className="text-primary p-0 h-auto font-medium">
              Tạo Playlist đầu tiên ngay
            </Button>
          </div>
        )}
      </div>

      {/* ==========================================
          MODAL THIẾT KẾ PLAYLIST (3-Column layout)
          ========================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-6xl rounded-xl shadow-2xl overflow-hidden flex flex-col h-[90vh] animate-in scale-in duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-muted/20">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {editingPlaylist ? 'Chỉnh sửa Layout Playlist' : 'Tạo Layout Playlist Mới'}
                </h3>
                <p className="text-xs text-muted-foreground">Chọn kích thước chuẩn, upload hoặc chọn ảnh/video và preview co giãn</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleCloseModal} className="rounded-full h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Modal Body: Scrollable */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {draftStatus === 'detected' && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-500 text-xs p-4 rounded-lg flex items-center justify-between gap-4 font-medium animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                    <span>Phát hiện bản nháp chưa lưu từ phiên làm việc trước. Bạn có muốn khôi phục không?</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRestoreDraft}
                      className="h-7 text-[10px] bg-amber-500 hover:bg-amber-600 text-white border-none font-semibold px-3"
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
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs px-4 py-2.5 rounded-lg font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Form Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-muted/5 p-4 rounded-lg border border-border/50">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Tên Playlist *</label>
                  <Input
                    placeholder="VD: Quảng cáo FullHD Ngang hè"
                    value={playlistName}
                    onChange={(e) => setPlaylistName(e.target.value)}
                    required
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Kích thước & Tỉ lệ màn hình</label>
                  <select
                    value={selectedResValue}
                    onChange={(e) => setSelectedResValue(e.target.value)}
                    className="w-full rounded border border-border h-9 px-3 bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {RESOLUTION_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Mô tả ngắn</label>
                  <Input
                    placeholder="VD: Trình chiếu sảnh tầng 1"
                    value={playlistDesc}
                    onChange={(e) => setPlaylistDesc(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* 3-Column Workspace */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start h-[calc(90vh-270px)] min-h-[350px]">
                
                {/* COLUMN 1 (2/5 width): Media Library & Upload */}
                <div className="lg:col-span-2 border border-border rounded-lg flex flex-col h-full bg-card overflow-hidden">
                  <div className="p-3 border-b border-border bg-muted/10 flex items-center justify-between gap-2 shrink-0">
                    <span className="text-xs font-bold text-foreground">Thư viện phương tiện</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFilesChange}
                        multiple
                        accept="image/*,video/mp4"
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleUploadFilesClick}
                        disabled={uploadingFiles}
                        className="text-[10px] h-7 border-border"
                      >
                        {uploadingFiles ? (
                          <>
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Đang tải...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-1 h-3 w-3 text-primary" /> Tải tệp mới
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Search box */}
                  <div className="p-2 border-b border-border shrink-0">
                    <Input
                      placeholder="Tìm kiếm file..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>

                  {/* Media List */}
                  <div className="flex-1 overflow-y-auto divide-y divide-border pr-1">
                    {filteredMedia.map((media) => {
                      const isSelected = selectedMedia.some(m => m.mediaId === media.id);
                      return (
                        <div
                          key={media.id}
                          onClick={() => handleToggleMedia(media)}
                          className={`flex items-center justify-between p-2.5 cursor-pointer text-xs transition-colors ${
                            isSelected ? 'bg-primary/5 border-l-4 border-primary' : 'hover:bg-muted/30'
                          }`}
                        >
                          <div className="flex items-center gap-2 max-w-[80%]">
                            <div className="h-8 w-8 bg-muted flex items-center justify-center rounded shrink-0 border border-border">
                              {media.mimeType.startsWith('video/') ? (
                                <Video className="h-4 w-4 text-slate-500" />
                              ) : (
                                <img
                                  src={`${API_BASE_URL}${media.fileUrl}`}
                                  alt=""
                                  className="h-full w-full object-cover rounded"
                                />
                              )}
                            </div>
                            <span className="truncate text-foreground font-medium" title={media.fileName}>
                              {media.fileName}
                            </span>
                          </div>
                          <div className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center ${
                            isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-border'
                          }`}>
                            {isSelected && <Check className="h-2.5 w-2.5" />}
                          </div>
                        </div>
                      );
                    })}
                    {filteredMedia.length === 0 && (
                      <div className="p-8 text-center text-xs text-muted-foreground italic">
                        Thư viện phương tiện trống hoặc không tìm thấy file.
                      </div>
                    )}
                  </div>
                </div>

                {/* COLUMN 2 (2/5 width): Selected Playlist Items */}
                <div className="lg:col-span-2 border border-border rounded-lg flex flex-col h-full bg-card overflow-hidden">
                  <div className="p-3 border-b border-border bg-muted/10 flex items-center justify-between shrink-0">
                    <span className="text-xs font-bold text-foreground">Thứ tự phát ({selectedMedia.length})</span>
                    <Badge variant="outline" className="text-[9px] border-none bg-primary/10 text-primary">
                      Kéo dãn hình
                    </Badge>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-muted/5">
                    {selectedMedia.map((item, idx) => {
                      const isActive = previewItem?.mediaId === item.mediaId;
                      return (
                        <div
                          key={item.mediaId}
                          onClick={() => setPreviewItem(item)}
                          className={`bg-card border rounded-lg p-2.5 space-y-2 relative shadow-xs cursor-pointer transition-all ${
                            isActive ? 'ring-2 ring-primary border-primary bg-primary/5' : 'border-border hover:border-border-hover'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[9px] font-bold text-primary bg-primary/10 h-4.5 w-4.5 rounded-full flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <p className="text-[11px] font-bold truncate flex-1 text-foreground" title={item.fileName}>
                              {item.fileName}
                            </p>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMedia(prev => prev.filter(m => m.mediaId !== item.mediaId).map((m, i) => ({ ...m, sortOrder: i + 1 })));
                              }}
                              className="text-muted-foreground hover:text-red-500"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50">
                            {/* Duration input */}
                            <div className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <input
                                type="number"
                                value={item.duration}
                                onChange={(e) => handleUpdateDuration(item.mediaId, parseInt(e.target.value) || 1)}
                                className="w-12 text-center text-xs border border-border rounded py-0.5 bg-card text-foreground focus:outline-none"
                                min="1"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span className="text-[10px] text-muted-foreground">giây</span>
                            </div>

                            {/* Sorting buttons */}
                            <div className="flex items-center gap-0.5">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); handleMoveItem(idx, 'up'); }}
                                disabled={idx === 0}
                                className="h-6 w-6 rounded"
                              >
                                <ArrowUp className="h-3 w-3" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); handleMoveItem(idx, 'down'); }}
                                disabled={idx === selectedMedia.length - 1}
                                className="h-6 w-6 rounded"
                              >
                                <ArrowDown className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {selectedMedia.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-48 text-center gap-2">
                        <Play className="h-8 w-8 text-muted-foreground/40" />
                        <p className="text-xs text-muted-foreground italic">
                          Chọn các file phương tiện bên trái hoặc tải file mới lên để tạo danh sách phát.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* COLUMN 3 (1/5 width): Scale Preview (Mô phỏng bóp/vỡ hình) */}
                <div className="lg:col-span-1 border border-border rounded-lg flex flex-col h-full bg-card overflow-hidden">
                  <div className="p-3 border-b border-border bg-muted/10 shrink-0">
                    <span className="text-xs font-bold text-foreground">Giả lập Co giãn (Preview)</span>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center p-3 gap-3 bg-muted/20 animate-in fade-in duration-150">
                    {previewItem ? (
                      <>
                        {/* Simulated screen with specific aspect ratio */}
                        <div
                          style={{
                            aspectRatio: getSelectedResRatio() === '16:9' ? '16/9' : '9/16'
                          }}
                          className={`w-full max-h-[220px] bg-zinc-950 rounded border-2 border-primary/50 shadow-md overflow-hidden relative`}
                        >
                          {/* Force image stretch using object-fill to simulate actual screen playback */}
                          {previewItem.mimeType.startsWith('video/') ? (
                            <video
                              src={`${API_BASE_URL}${previewItem.fileUrl}`}
                              className="w-full h-full object-fill"
                              autoPlay
                              muted
                              loop
                              playsInline
                              key={previewItem.mediaId}
                            />
                          ) : (
                            <img
                              src={`${API_BASE_URL}${previewItem.fileUrl}`}
                              alt=""
                              className="w-full h-full object-fill"
                              key={previewItem.mediaId}
                            />
                          )}
                        </div>

                        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-lg p-2 flex gap-1.5 items-start">
                          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                          <p className="text-[10px] leading-relaxed">
                            <strong>Mô phỏng kéo giãn (Stretch)</strong>: Tệp đang được kéo dãn lấp đầy tỉ lệ <strong>{getSelectedResRatio()}</strong>. Nếu tệp gốc sai kích thước, hình ảnh sẽ bị bóp hoặc vỡ hình.
                          </p>
                        </div>

                        <div className="w-full text-center space-y-0.5 border-t border-border/50 pt-2 shrink-0">
                          <p className="text-[10px] font-bold text-foreground truncate max-w-full">
                            {previewItem.fileName}
                          </p>
                          <span className="text-[9px] text-muted-foreground">
                            {previewItem.mimeType.startsWith('video/') ? 'Video' : 'Hình ảnh'} &bull; {previewItem.duration}s
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center text-xs text-muted-foreground italic py-10">
                        Nhấp một tệp đã chọn ở cột giữa để xem preview co giãn
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border flex justify-end gap-3 bg-muted/20 shrink-0">
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Hủy
              </Button>
              <Button
                type="button"
                onClick={handleSavePlaylist}
                disabled={isSubmitting || selectedMedia.length === 0}
                className="bg-primary text-primary-foreground font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang lưu...
                  </>
                ) : (
                  'Lưu Playlist'
                )}
              </Button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
