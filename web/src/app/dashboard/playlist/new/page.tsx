"use client";

import { useMedia } from "@/hooks/useApi";
import PlaylistEditor from "@/components/dashboard/playlist-editor/PlaylistEditor";
import PublishModal from "@/components/dashboard/PublishModal";
import PublishScheduleModal from "@/components/dashboard/PublishScheduleModal";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewPlaylistPage() {
  const router = useRouter();
  const { mediaList } = useMedia();

  // T5: Sau khi lưu playlist mới — "Đơn lẻ" mở PublishModal (chọn thiết bị),
  // "Đồng bộ" bỏ qua bước chọn thiết bị và chuyển thẳng sang bước lập lịch.
  const [publishTarget, setPublishTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [scheduleTarget, setScheduleTarget] = useState<{
    id: string;
    name: string;
    deviceIds: string[];
  } | null>(null);

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto animate-in fade-in duration-300 relative pb-16 font-sans">
      <PlaylistEditor
        editingPlaylist={null}
        mediaList={mediaList}
        onClose={() => router.push("/dashboard/playlist")}
        onSave={() => router.push("/dashboard/playlist")}
        onCreated={(playlistId, playlistName, isSyncGroup, deviceIds) => {
          const name = playlistName || "Playlist mới";
          if (isSyncGroup) {
            setScheduleTarget({ id: playlistId, name, deviceIds });
          } else {
            setPublishTarget({ id: playlistId, name });
          }
        }}
      />

      {publishTarget && (
        <PublishModal
          playlistId={publishTarget.id}
          playlistName={publishTarget.name}
          onClose={() => {
            setPublishTarget(null);
            router.push("/dashboard/playlist");
          }}
          onSuccess={() => {
            // Có thể thêm toast message ở đây nếu có context
          }}
        />
      )}

      {scheduleTarget && (
        <PublishScheduleModal
          playlistId={scheduleTarget.id}
          playlistName={scheduleTarget.name}
          deviceIds={scheduleTarget.deviceIds}
          onClose={() => {
            setScheduleTarget(null);
            router.push("/dashboard/playlist");
          }}
          onSuccess={() => {
            setScheduleTarget(null);
            router.push("/dashboard/playlist");
          }}
        />
      )}
    </div>
  );
}
