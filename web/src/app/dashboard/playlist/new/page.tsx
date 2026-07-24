"use client";

import { useMedia } from "@/hooks/useApi";
import PlaylistEditor from "@/components/dashboard/playlist-editor/PlaylistEditor";
import PublishModal from "@/components/dashboard/PublishModal";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewPlaylistPage() {
  const router = useRouter();
  const { mediaList } = useMedia();

  // T5: Mở PublishModal sau khi save playlist mới
  const [publishTarget, setPublishTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto animate-in fade-in duration-300 relative pb-16 font-sans">
      <PlaylistEditor
        editingPlaylist={null}
        mediaList={mediaList}
        onClose={() => router.push("/dashboard/playlist")}
        onSave={() => router.push("/dashboard/playlist")}
        onCreated={(playlistId, playlistName) => {
          setPublishTarget({ id: playlistId, name: playlistName || "Playlist mới" });
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
    </div>
  );
}
