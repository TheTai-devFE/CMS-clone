import { useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { syncPlaylist, PlayerPlaylistItem } from "../utils/syncManager";

interface UsePlayerHeartbeatSyncProps {
  deviceId: string | null;
  apiKey: string | null;
  formIp: string;
  formPort: string;
  handleLogout: () => Promise<void>;
  setRegisteredDeviceName: (name: string) => void;
  setFormName: (name: string) => void;
  setSleepScheduleEnabled: (val: boolean) => void;
  setSleepStartTime: (val: string) => void;
  setSleepEndTime: (val: string) => void;
  setPlaylist: (pl: PlayerPlaylistItem[]) => void;
  setClockOffset: (offset: number) => void;
  setSyncProgress: (progress: number | null) => void;
  reportSyncProgress: (progress: number, status: string) => Promise<void>;
}

export function usePlayerHeartbeatSync({
  deviceId,
  apiKey,
  formIp,
  formPort,
  handleLogout,
  setRegisteredDeviceName,
  setFormName,
  setSleepScheduleEnabled,
  setSleepStartTime,
  setSleepEndTime,
  setPlaylist,
  setClockOffset,
  setSyncProgress,
  reportSyncProgress,
}: UsePlayerHeartbeatSyncProps) {
  const isSyncingRef = useRef(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    const sendHeartbeat = async () => {
      if (!deviceId || !apiKey) return;

      try {
        const response = await fetch(
          `http://${formIp}:${formPort}/api/player/heartbeat`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              deviceId,
              apiKey,
              cpuUsage: Math.floor(Math.random() * 15) + 5,
              freeMemoryMb: Math.floor(Math.random() * 200) + 400,
            }),
          },
        );

        if (!response.ok) {
          if (response.status === 401) {
            await handleLogout();
          }
        } else {
          const data = await response.json();
          if (data) {
            if (data.deviceName) {
              setRegisteredDeviceName(data.deviceName);
              setFormName(data.deviceName);
              await AsyncStorage.setItem("deviceName", data.deviceName);
            }

            await AsyncStorage.setItem(
              "security_use_pass",
              data.useSecurityPassword ? "true" : "false",
            );
            if (data.securityPassword) {
              await AsyncStorage.setItem(
                "security_pass_val",
                data.securityPassword,
              );
            } else if (data.useSecurityPassword) {
              await AsyncStorage.setItem("security_pass_val", "0000");
            } else {
              await AsyncStorage.removeItem("security_pass_val");
            }

            const serverSleepEnabled = !!data.sleepScheduleEnabled;
            const serverSleepStart = data.sleepStartTime || "22:00";
            const serverSleepEnd = data.sleepEndTime || "06:00";

            setSleepScheduleEnabled(serverSleepEnabled);
            setSleepStartTime(serverSleepStart);
            setSleepEndTime(serverSleepEnd);

            await AsyncStorage.setItem(
              "sleep_schedule_enabled",
              serverSleepEnabled ? "true" : "false",
            );
            await AsyncStorage.setItem("sleep_start_time", serverSleepStart);
            await AsyncStorage.setItem("sleep_end_time", serverSleepEnd);

            const serverHash = data.syncHash || "empty";
            const localHash =
              (await AsyncStorage.getItem("local_sync_hash")) || "empty";
            const ignoredHash =
              (await AsyncStorage.getItem("ignored_sync_hash")) || "";

            if (
              serverHash !== "empty" &&
              serverHash !== ignoredHash &&
              ignoredHash !== ""
            ) {
              await AsyncStorage.removeItem("ignored_sync_hash");
            }

            const activeIgnoredHash =
              (await AsyncStorage.getItem("ignored_sync_hash")) || "";

            if (
              serverHash !== localHash &&
              serverHash !== activeIgnoredHash &&
              !isSyncingRef.current
            ) {
              isSyncingRef.current = true;
              setSyncProgress(0);
              reportSyncProgress(0, "syncing");

              const watchdogTimer = setTimeout(() => {
                if (isSyncingRef.current) {
                  isSyncingRef.current = false;
                  setSyncProgress(null);
                  reportSyncProgress(0, "error");
                }
              }, 180000);

              try {
                const updatedPl = await syncPlaylist(
                  formIp,
                  formPort,
                  deviceId,
                  apiKey,
                  serverHash,
                  (progress) => {
                    setSyncProgress(progress);
                    if (progress < 100) {
                      reportSyncProgress(progress, "syncing");
                    }
                  },
                );
                if (updatedPl !== null) {
                  setPlaylist(updatedPl.playlist);
                  if (updatedPl.syncMeta) {
                    const offset = updatedPl.syncMeta.serverTime - Date.now();
                    setClockOffset(offset);
                  }
                  reportSyncProgress(100, "playing");
                } else {
                  reportSyncProgress(0, "error");
                }
              } catch (syncErr) {
                console.error("[Sync] Lỗi khi tải và lưu cache playlist:", syncErr);
                reportSyncProgress(0, "error");
              } finally {
                clearTimeout(watchdogTimer);
                isSyncingRef.current = false;
                setTimeout(() => {
                  setSyncProgress(null);
                }, 1000);
              }
            }
          }
        }
      } catch (err) {
        console.warn("Lỗi gửi Heartbeat:", err);
      }
    };

    if (deviceId && apiKey) {
      sendHeartbeat();
      interval = setInterval(sendHeartbeat, 10_000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    deviceId,
    apiKey,
    formIp,
    formPort,
    handleLogout,
    setRegisteredDeviceName,
    setFormName,
    setSleepScheduleEnabled,
    setSleepStartTime,
    setSleepEndTime,
    setPlaylist,
    setClockOffset,
    setSyncProgress,
    reportSyncProgress,
  ]);
}
