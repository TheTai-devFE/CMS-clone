import { useMemo } from "react";

interface UseVideoWallCropProps {
  isSyncGroup?: boolean;
  syncLayout?: unknown;
  deviceId?: string | null;
}

export function useVideoWallCrop({
  isSyncGroup,
  syncLayout,
  deviceId,
}: UseVideoWallCropProps) {
  const mySlotIndex = useMemo(() => {
    if (!isSyncGroup || !syncLayout || !deviceId) return null;

    let parsedLayout = syncLayout;
    if (typeof syncLayout === "string") {
      try {
        parsedLayout = JSON.parse(syncLayout);
      } catch (e) {
        return null;
      }
    }

    const deviceMapping = parsedLayout.deviceMapping;
    if (!deviceMapping || typeof deviceMapping !== "object") return null;

    for (const slotKey in deviceMapping) {
      const val = deviceMapping[slotKey];
      if (Array.isArray(val)) {
        if (val.includes(deviceId)) {
          return parseInt(slotKey, 10);
        }
      } else if (val === deviceId) {
        return parseInt(slotKey, 10);
      }
    }
    return null;
  }, [isSyncGroup, syncLayout, deviceId]);

  const videoWallCrop = useMemo(() => {
    if (!isSyncGroup || mySlotIndex === null || !syncLayout) return null;

    let parsedLayout = syncLayout;
    if (typeof syncLayout === "string") {
      try {
        parsedLayout = JSON.parse(syncLayout);
      } catch (e) {
        return null;
      }
    }

    const videoWall = parsedLayout.videoWall;
    if (!videoWall) return null;

    const { rows, cols } = videoWall;
    if (!rows || !cols) return null;

    const row = Math.floor((mySlotIndex - 1) / cols);
    const col = (mySlotIndex - 1) % cols;

    return {
      rows,
      cols,
      row,
      col,
      mediaWidth: `${cols * 100}%`,
      mediaHeight: `${rows * 100}%`,
      left: `${-col * 100}%`,
      top: `${-row * 100}%`,
    };
  }, [isSyncGroup, mySlotIndex, syncLayout]);

  return { mySlotIndex, videoWallCrop };
}
