"use client";

import { useMedia } from "@/hooks/useApi";
import PlaylistEditor from "@/components/dashboard/playlist-editor/PlaylistEditor";
import { useRouter } from "next/navigation";

export default function NewPlaylistPage() {
  const router = useRouter();
  const { mediaList } = useMedia();

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto animate-in fade-in duration-300 relative pb-16 font-sans">
      <PlaylistEditor
        editingPlaylist={null}
        mediaList={mediaList}
        onClose={() => router.push("/dashboard/playlist")}
        onSave={() => router.push("/dashboard/playlist")}
      />
    </div>
  );
}
