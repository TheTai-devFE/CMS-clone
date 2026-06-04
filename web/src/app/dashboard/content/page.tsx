'use client';

import React, { useEffect, useState, useRef } from 'react';
import { api } from '../../../utils/api';

interface MediaItem {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: string;
  mimeType: string;
  checksum: string;
  createdAt: string;
}

export default function ContentPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const fetchMedia = async () => {
    setLoading(true);
    setError('');
    try {
      const mediaData = await api.get('/api/media');
      setMediaList(mediaData || []);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải thư viện nội dung.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const isValidType = file.type.startsWith('image/') || file.type === 'video/mp4';
    if (!isValidType) {
      setError('Chỉ cho phép tải lên file ảnh (.png, .jpg, .jpeg) hoặc video (.mp4)');
      return;
    }

    setUploading(true);
    setError('');
    setSuccessMsg('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/api/media/upload', formData, { useMultipart: true });
      setSuccessMsg(`Tải lên tệp thành công: ${file.name}`);
      await fetchMedia();
    } catch (err: any) {
      setError(err.message || 'Không thể upload file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteMedia = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa file: ${name}?`)) return;

    setError('');
    setSuccessMsg('');
    try {
      await api.delete(`/api/media/${id}`);
      setSuccessMsg('Đã xóa tệp tin thành công');
      await fetchMedia();
    } catch (err: any) {
      setError(err.message || 'Không thể xóa tệp');
    }
  };

  const formatBytes = (bytes: string | number, decimals = 2) => {
    const b = Number(bytes);
    if (b === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return parseFloat((b / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="tab-content">
      {(error || successMsg) && (
        <div className="dash-messages" style={{ marginBottom: '20px' }}>
          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
              <button className="alert-dismiss" onClick={() => setError('')}>x</button>
            </div>
          )}
          {successMsg && (
            <div className="alert alert-success">
              <span>{successMsg}</span>
              <button className="alert-dismiss" onClick={() => setSuccessMsg('')}>x</button>
            </div>
          )}
        </div>
      )}

      <div className="tab-header">
        <h2>Thư viện ảnh và video</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,video/mp4"
            style={{ display: 'none' }}
          />
          <button onClick={handleUploadClick} className="btn-primary" disabled={uploading}>
            {uploading ? (
              <>
                <span className="spinner spinner-dark"></span>
                Đang tải lên...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                Tải lên
              </>
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container" style={{ minHeight: '300px' }}>
          <span className="spinner"></span>
          <p>Đang tải thư viện nội dung...</p>
        </div>
      ) : mediaList.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          <h3>Thư viện trống</h3>
          <p>Click nút &quot;Tải lên&quot; để lưu trữ hình ảnh hoặc video quảng cáo.</p>
        </div>
      ) : (
        <div className="media-grid">
          {mediaList.map((media) => {
            const isVideo = media.mimeType.startsWith('video/');
            return (
              <div className="media-card" key={media.id}>
                <div
                  className="media-thumb"
                  onClick={() => {
                    if (isVideo) {
                      setPreviewVideoUrl(`${API_BASE_URL}${media.fileUrl}`);
                    }
                  }}
                >
                  {isVideo ? (
                    <div className="media-video-overlay">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--accent)' }}>
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                      <span className="media-video-label">Phát video</span>
                    </div>
                  ) : (
                    <img
                      src={`${API_BASE_URL}${media.fileUrl}`}
                      alt={media.fileName}
                    />
                  )}
                </div>
                <div className="media-info">
                  <h4 className="media-name" title={media.fileName}>
                    {media.fileName}
                  </h4>
                  <p className="media-meta">
                    {formatBytes(media.fileSize)} | {isVideo ? 'VIDEO' : 'IMAGE'}
                  </p>
                  <p className="media-meta text-mono" title={media.checksum}>
                    {media.checksum.substring(0, 16)}...
                  </p>
                </div>
                <div className="media-footer">
                  <button
                    onClick={() => handleDeleteMedia(media.id, media.fileName)}
                    className="btn-danger"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ====== VIDEO PREVIEW MODAL ====== */}
      {previewVideoUrl && (
        <div className="modal-overlay" onClick={() => setPreviewVideoUrl(null)}>
          <div
            className="modal-content modal-content-wide"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Xem trước video</h3>
              <button className="modal-close" onClick={() => setPreviewVideoUrl(null)}>x</button>
            </div>
            <div className="video-container">
              <video src={previewVideoUrl} controls autoPlay />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
