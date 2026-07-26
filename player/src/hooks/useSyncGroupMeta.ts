import { useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchSyncTime, getLocalSyncMeta, SyncMeta } from "../utils/syncManager";

interface UseSyncGroupMetaProps {
  isSyncGroup?: boolean;
  deviceId?: string | null;
  clockOffsetRef: React.MutableRefObject<number>;
}

export function useSyncGroupMeta({
  isSyncGroup,
  deviceId,
  clockOffsetRef,
}: UseSyncGroupMetaProps) {
  const syncMetaRef = useRef<SyncMeta | null>(null);
  const syncStartedAtRef = useRef<number | null>(null);
  const periodicSyncTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isSyncGroup) return;

    let cancelled = false;
    (async () => {
      const meta = await getLocalSyncMeta();
      if (cancelled) return;
      syncMetaRef.current = meta;
      if (meta) {
        const adjustedDeadline = meta.syncPlayDeadline - clockOffsetRef.current;
        const delayMs = adjustedDeadline - Date.now();
        console.log(
          `[SyncGroup] Loaded meta: deadline in ${delayMs}ms (offset=${clockOffsetRef.current}ms)`,
        );
        syncStartedAtRef.current = adjustedDeadline;
      }
    })();

    periodicSyncTimerRef.current = setInterval(async () => {
      const meta = syncMetaRef.current;
      if (!meta) return;
      const [serverIp, serverPort, storedDeviceId, apiKey] = await Promise.all([
        AsyncStorage.getItem("serverIp"),
        AsyncStorage.getItem("serverPort"),
        AsyncStorage.getItem("deviceId"),
        AsyncStorage.getItem("apiKey"),
      ]);
      if (!serverIp || !serverPort || !storedDeviceId || !apiKey) return;

      const refreshed = await fetchSyncTime(
        serverIp,
        serverPort,
        storedDeviceId,
        apiKey,
        meta.playlistId,
      );
      if (refreshed && refreshed.syncPlayDeadline) {
        const newMeta: SyncMeta = {
          playlistId: meta.playlistId,
          serverTime: refreshed.serverTime,
          syncPlayDeadline: refreshed.syncPlayDeadline,
        };
        syncMetaRef.current = newMeta;
        clockOffsetRef.current = refreshed.serverTime - Date.now();
      }
    }, 60_000);

    return () => {
      cancelled = true;
      if (periodicSyncTimerRef.current) {
        clearInterval(periodicSyncTimerRef.current);
        periodicSyncTimerRef.current = null;
      }
    };
  }, [isSyncGroup, deviceId, clockOffsetRef]);

  return { syncMetaRef, syncStartedAtRef };
}
