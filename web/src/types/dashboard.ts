export type DashboardTab =
  | "home"
  | "content"
  | "playlist"
  | "player"
  | "admin"
  | "eventlog"
  | "resource"
  | "schedule";

export interface User {
  id: string;
  username: string;
  email: string;
  role: "admin" | "user";
  licenseLimit: number;
  status: string;
  securityPassword?: string;
}

export interface Device {
  id: string;
  deviceName: string;
  apiKey: string;
  status: "online" | "offline";
  approvalStatus: "pending" | "approved";
  useSecurityPassword?: boolean;
  sleepScheduleEnabled?: boolean;
  sleepStartTime?: string;
  sleepEndTime?: string;
  userId?: string;
  macAddress?: string;
  ipAddress?: string;
  screenResolution?: string;
  osVersion?: string;
  appVersion?: string;
  lastHeartbeat?: string;
}

export interface MediaItem {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: string;
  mimeType: string;
  checksum: string;
  createdAt: string;
}

export interface Playlist {
  id: string;
  playlistName: string;
  description?: string;
  isSyncGroup: boolean;
  createdAt: string;
}

export interface Schedule {
  id: string;
  scheduleName: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  dayOfWeek?: number[];
  playlistId?: string;
  templateId?: string;
  playlist?: { playlistName: string };
  template?: { name: string };
}

export interface EventLog {
  id: string;
  time: string;
  deviceName: string;
  status: string;
  detail: string;
}

export interface Zone {
  id?: string;
  name: string;
  type: string; // 'media' | 'text' | 'clock' | 'weather' | 'web'
  x: number;
  y: number;
  width: number;
  height: number;
  contentData?: Record<string, unknown>;
}

export interface Template {
  id: string;
  name: string;
  width: number;
  height: number;
  orientation: "landscape" | "portrait";
  createdAt: string;
  zones?: Zone[];
}
