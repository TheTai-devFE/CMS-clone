import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

// Thư mục cục bộ để lưu trữ video và hình ảnh (chỉ áp dụng cho native iOS/Android)
const MEDIA_DIR = `${FileSystem.documentDirectory}media/`;

export interface SyncMediaItem {
  itemId: string;
  mediaId: string;
  fileName: string;
  fileUrl: string; // URL tải về từ Server
  localUrl?: string; // Đường dẫn file cục bộ sau khi download
  fileSize: string;
  mimeType: string;
  checksum: string;
  sortOrder: number;
  duration: number;
  transitionEffect: string;
}

export interface PlayerPlaylistItem {
  type: 'image' | 'video' | 'pdf' | 'url';
  url: string; // Trỏ tới file cục bộ file://... hoặc URL online (nếu chạy web)
  // LƯU Ý: duration từ backend lưu theo GIÂY (xem server/src/playlist/playlist.service.ts:148).
  // Code player phải * 1000 trước khi dùng cho setTimeout. Video KHÔNG dùng duration.
  duration: number; // Thời gian hiển thị (GIÂY — từ DB)
  checksum: string;
  sortOrder?: number; // Thứ tự trong playlist, dùng cho video wall slot matching
}

/**
 * Thông tin đồng bộ thời gian cho sync group (video wall).
 * - serverTime: epoch ms hiện tại của server, dùng để tính offset với local clock
 * - syncPlayDeadline: epoch ms mà tất cả device PHẢI bắt đầu phát item[0]
 *   (server cấp 2 giây buffer cho client chuẩn bị)
 */
export interface SyncMeta {
  playlistId: string;
  serverTime: number;
  syncPlayDeadline: number;
}

/**
 * Đảm bảo thư mục media cục bộ tồn tại
 */
export async function ensureMediaDirectory() {
  if (Platform.OS === 'web') return; // Không dùng FileSystem trên web

  const dirInfo = await FileSystem.getInfoAsync(MEDIA_DIR);
  if (!dirInfo.exists) {
    console.log('Tạo thư mục lưu trữ media cục bộ:', MEDIA_DIR);
    await FileSystem.makeDirectoryAsync(MEDIA_DIR, { intermediates: true });
  }
}

/**
 * Trích xuất phần mở rộng của tệp tin
 */
function getFileExtension(fileName: string, fileUrl: string): string {
  const nameParts = fileName.split('.');
  if (nameParts.length > 1) {
    const ext = nameParts.pop()?.toLowerCase();
    if (ext && ext.length <= 4) return ext;
  }
  
  const urlParts = fileUrl.split('?')[0].split('.');
  if (urlParts.length > 1) {
    const ext = urlParts.pop()?.toLowerCase();
    if (ext && ext.length <= 4) return ext;
  }
  
  return 'bin';
}

/**
 * Đồng bộ hóa danh sách phát và tải media từ CMS
 */
/**
 * Tạo một Promise có thời gian chờ (timeout) để tránh kẹt luồng xử lý vĩnh viễn
 */
function promiseWithTimeout<T>(
  promise: Promise<T>,
  ms: number,
  errorMsg = 'Thao tác quá thời gian chờ (timeout)'
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMsg));
    }, ms);
  });
  return Promise.race([
    promise.then((res) => {
      clearTimeout(timeoutId);
      return res;
    }),
    timeoutPromise,
  ]);
}

/**
/**
 * Đồng bộ hóa danh sách phát và tải media từ CMS
 *
 * Trả về cả `syncMeta` (serverTime, syncPlayDeadline) cho các playlist
 * thuộc sync group (video wall). Client dùng để đồng bộ thời điểm play
 * giữa nhiều thiết bị, tránh giật frame.
 */
export async function syncPlaylist(
  serverIp: string,
  serverPort: string,
  deviceId: string,
  apiKey: string,
  targetSyncHash: string,
  onProgress?: (progress: number) => void
): Promise<{ playlist: PlayerPlaylistItem[]; syncMeta: SyncMeta | null } | null> {
  try {
    const url = `http://${serverIp}:${serverPort}/api/player/sync?deviceId=${deviceId}&apiKey=${apiKey}`;
    console.log(`Đang gọi API đồng bộ: ${url}`);
    
    const response = await promiseWithTimeout(
      fetch(url),
      15000,
      'Không thể kết nối đến server (timeout 15s)'
    );

    if (!response.ok) {
      throw new Error(`API sync trả về lỗi: ${response.status}`);
    }
    
    const syncData = await response.json();

    // Nếu thiết bị chưa được duyệt hoặc không có lịch phát
    if (syncData.status === 'pending' || !syncData.items || syncData.items.length === 0) {
      console.log('Không có lịch phát hoạt động hoặc thiết bị chưa được duyệt.');
      onProgress?.(100);
      if (Platform.OS !== 'web') {
        await cleanOrphanedFiles([]); // Xóa sạch file cục bộ nếu là native
      }
      await AsyncStorage.setItem('local_playlist', JSON.stringify([]));
      await AsyncStorage.setItem('local_sync_hash', targetSyncHash);
      // Xóa sync meta cũ vì playlist rỗng
      await AsyncStorage.removeItem('local_sync_meta');
      return { playlist: [], syncMeta: null };
    }

    // Parse sync meta cho video wall / sync group
    // Server chỉ trả các trường này khi isSyncGroup=true
    const syncMeta: SyncMeta | null =
      syncData.isSyncGroup &&
      syncData.syncPlayDeadline &&
      syncData.serverTime &&
      syncData.playlistId
        ? {
            playlistId: syncData.playlistId,
            serverTime: syncData.serverTime,
            syncPlayDeadline: syncData.syncPlayDeadline,
          }
        : null;

    if (syncMeta) {
      console.log(
        `[SyncGroup] serverTime=${syncMeta.serverTime} deadline=${syncMeta.syncPlayDeadline} (delay=${syncMeta.syncPlayDeadline - Date.now()}ms)`,
      );
      await AsyncStorage.setItem(
        'local_sync_meta',
        JSON.stringify(syncMeta),
      );
    } else {
      await AsyncStorage.removeItem('local_sync_meta');
    }

    const items: SyncMediaItem[] = syncData.items;
    const activeChecksums: string[] = [];
    const localPlaylist: PlayerPlaylistItem[] = [];

    // Chạy trên môi trường Web: Tiến hành prefetch/preload để trình duyệt lưu vào Cache giúp hiển thị loading %
    if (Platform.OS === 'web') {
      console.log('Đang chạy trên nền tảng Web: Sử dụng chế độ stream online trực tiếp từ server (kèm prefetch).');
      onProgress?.(0);
      let count = 0;
      for (const item of items) {
        let downloadUrl = item.fileUrl;
        if (!downloadUrl.startsWith('http://') && !downloadUrl.startsWith('https://')) {
          downloadUrl = `http://${serverIp}:${serverPort}${item.fileUrl}`;
        }
        
        // Tiến hành prefetch file trên trình duyệt
        try {
          if (item.mimeType.startsWith('image/')) {
            await promiseWithTimeout(
              new Promise<void>((resolve) => {
                const img = new globalThis.Image();
                img.src = downloadUrl;
                img.onload = () => resolve();
                img.onerror = () => resolve();
              }),
              15000,
              'Tải ảnh preview quá thời gian (15s)'
            );
          } else if (item.mimeType.startsWith('video/')) {
            // Không fetch toàn bộ file video lớn trên Web để tránh nghẽn băng thông và load lâu.
            // Thẻ <video> của trình duyệt sẽ tự động stream/buffer khi phát.
          }
        } catch (prefetchErr) {
          console.warn('Preload failed or timed out for item:', downloadUrl, prefetchErr);
        }

        let itemType: 'image' | 'video' | 'pdf' | 'url' = 'image';
        if (item.mimeType === 'url') {
          itemType = 'url';
        } else if (item.mimeType === 'application/pdf' || getFileExtension(item.fileName, item.fileUrl) === 'pdf') {
          itemType = 'pdf';
        } else if (item.mimeType.startsWith('video/')) {
          itemType = 'video';
        } else if (item.mimeType.startsWith('image/')) {
          itemType = 'image';
        }

        localPlaylist.push({
          type: itemType,
          url: downloadUrl, // Trỏ thẳng tới link http://... của server
          duration: (item.duration || 10) * 1000,
          checksum: item.checksum,
        });
        
        count++;
        onProgress?.(Math.round((count / items.length) * 100));
      }
      
      await AsyncStorage.setItem('local_playlist', JSON.stringify(localPlaylist));
      await AsyncStorage.setItem('local_sync_hash', targetSyncHash);
      return { playlist: localPlaylist, syncMeta };
    }

    // Chạy trên môi trường Native (Android/iOS): Tải file cục bộ phục vụ caching offline
    await ensureMediaDirectory();
    onProgress?.(0);
    let processedCount = 0;
    
    for (const item of items) {
      const ext = getFileExtension(item.fileName, item.fileUrl);
      const isUrl = item.mimeType === 'url';
      
      let itemType: 'image' | 'video' | 'pdf' | 'url' = 'image';
      if (isUrl) {
        itemType = 'url';
      } else if (item.mimeType === 'application/pdf' || ext === 'pdf') {
        itemType = 'pdf';
      } else if (item.mimeType.startsWith('video/')) {
        itemType = 'video';
      } else if (item.mimeType.startsWith('image/')) {
        itemType = 'image';
      }

      let playUrl = '';

      if (itemType === 'url') {
        // Đối với Web URL, không tải về máy, lưu URL online trực tiếp
        playUrl = item.fileUrl;
      } else {
        const localFileName = `${item.checksum}.${ext}`;
        const localFilePath = `${MEDIA_DIR}${localFileName}`;
        activeChecksums.push(item.checksum);

        // Xác định nguồn URL tải file
        let downloadUrl = item.fileUrl;
        if (!downloadUrl.startsWith('http://') && !downloadUrl.startsWith('https://')) {
          downloadUrl = `http://${serverIp}:${serverPort}${item.fileUrl}`;
        }

        // Kiểm tra file cục bộ đã tồn tại chưa
        const fileInfo = await FileSystem.getInfoAsync(localFilePath);
        if (!fileInfo.exists) {
          console.log(`Bắt đầu tải file: ${item.fileName} -> ${localFilePath}`);
          try {
            await promiseWithTimeout(
              FileSystem.downloadAsync(downloadUrl, localFilePath),
              45000,
              `Tải file ${item.fileName} quá thời gian (45s)`
            );
            console.log(`Tải thành công file: ${item.fileName}`);
          } catch (downloadErr) {
            console.error(`Lỗi khi tải file ${item.fileName}:`, downloadErr);
            processedCount++;
            onProgress?.(Math.round((processedCount / items.length) * 100));
            continue;
          }
        } else {
          console.log(`File đã tồn tại cục bộ (checksum match): ${item.fileName}`);
        }
        playUrl = localFilePath;
      }

      localPlaylist.push({
        type: itemType,
        url: playUrl,
        duration: (item.duration || 10) * 1000,
        checksum: item.checksum,
      });

      processedCount++;
      onProgress?.(Math.round((processedCount / items.length) * 100));
    }

    // Dọn dẹp các tệp tin không còn sử dụng
    await cleanOrphanedFiles(activeChecksums);

    // Lưu playlist cục bộ và syncHash vào AsyncStorage
    await AsyncStorage.setItem('local_playlist', JSON.stringify(localPlaylist));
    await AsyncStorage.setItem('local_sync_hash', targetSyncHash);

    console.log('Đồng bộ danh sách phát thành công. Số lượng items:', localPlaylist.length);
    return { playlist: localPlaylist, syncMeta };
  } catch (err) {
    console.error('Lỗi trong quá trình đồng bộ playlist:', err);
    return null;
  }
}

/**
 * Lấy danh sách phát cục bộ đã được cache
 */
export async function getLocalPlaylist(): Promise<PlayerPlaylistItem[]> {
  try {
    const cached = await AsyncStorage.getItem('local_playlist');
    if (!cached) return [];
    
    const playlist: PlayerPlaylistItem[] = JSON.parse(cached);
    
    // Nếu là Web, không cần kiểm tra file vật lý trên FileSystem
    if (Platform.OS === 'web') {
      return playlist;
    }
    
    await ensureMediaDirectory();
    // Xác thực nhanh xem các file vật lý của playlist còn tồn tại hay không
    const verifiedPlaylist: PlayerPlaylistItem[] = [];
    for (const item of playlist) {
      const fileInfo = await FileSystem.getInfoAsync(item.url);
      if (fileInfo.exists) {
        verifiedPlaylist.push(item);
      } else {
        console.warn(`File cục bộ bị mất, sẽ được tải lại ở chu kỳ sync tiếp theo: ${item.url}`);
      }
    }
    
    return verifiedPlaylist;
  } catch (e) {
    console.error('Lỗi khi đọc playlist cục bộ:', e);
    return [];
  }
}

/**
 * Xóa các file cũ không còn nằm trong playlist hoạt động
 */
async function cleanOrphanedFiles(activeChecksums: string[]) {
  if (Platform.OS === 'web') return; // Không dùng FileSystem trên web

  try {
    const files = await FileSystem.readDirectoryAsync(MEDIA_DIR);
    for (const file of files) {
      const checksum = file.split('.')[0];
      if (checksum && !activeChecksums.includes(checksum)) {
        const filePath = `${MEDIA_DIR}${file}`;
        console.log('Xóa tệp tin mồ côi (không còn trong playlist):', filePath);
        await FileSystem.deleteAsync(filePath, { idempotent: true });
      }
    }
  } catch (err) {
    console.error('Lỗi khi dọn dẹp thư mục media cục bộ:', err);
  }
}

/**
 * Lấy sync meta đã cache cho sync group.
 * Trả về null nếu playlist không thuộc sync group hoặc chưa sync.
 */
export async function getLocalSyncMeta(): Promise<SyncMeta | null> {
  try {
    const cached = await AsyncStorage.getItem('local_sync_meta');
    if (!cached) return null;
    return JSON.parse(cached) as SyncMeta;
  } catch {
    return null;
  }
}

/**
 * Re-sync thời gian từ server (dùng cho periodic re-sync mỗi 30-60s).
 * Trả về null nếu server không có mốc cho playlist này (chưa sync hoặc không phải sync group).
 */
export async function fetchSyncTime(
  serverIp: string,
  serverPort: string,
  deviceId: string,
  apiKey: string,
  playlistId: string,
): Promise<{ serverTime: number; syncPlayDeadline: number | null } | null> {
  try {
    const url = `http://${serverIp}:${serverPort}/api/player/sync-time?deviceId=${deviceId}&apiKey=${apiKey}&playlistId=${playlistId}`;
    const response = await promiseWithTimeout(fetch(url), 5000, 'Sync-time timeout');
    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    console.warn('[SyncTime] Không thể lấy mốc sync:', err);
    return null;
  }
}
