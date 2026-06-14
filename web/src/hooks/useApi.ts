import useSWR from 'swr';
import { api } from '@/utils/api';
import { User, Device, MediaItem, Playlist, Schedule, EventLog, Template } from '@/types/dashboard';

// Fetcher wrapper utilizing our api utility
const fetcher = (url: string) => api.get(url);

export function useDevices() {
  const { data, error, isLoading, mutate } = useSWR<Device[]>(
    '/api/devices',
    fetcher,
    { refreshInterval: 10000 }
  );

  return {
    devices: data || [],
    error,
    isLoading,
    mutate
  };
}

interface PaginatedMedia {
  data: MediaItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useMedia(page = 1, limit = 20) {
  const { data, error, isLoading, mutate } = useSWR<PaginatedMedia>(
    `/api/media?page=${page}&limit=${limit}`,
    fetcher
  );

  return {
    mediaList: data?.data || [],
    total: data?.total || 0,
    totalPages: data?.totalPages || 1,
    error,
    isLoading,
    mutate,
  };
}


export function usePlaylists() {
  const { data, error, isLoading, mutate } = useSWR<Playlist[]>(
    '/api/playlists',
    fetcher
  );

  return {
    playlists: data || [],
    error,
    isLoading,
    mutate
  };
}

export function useSchedules() {
  const { data, error, isLoading, mutate } = useSWR<Schedule[]>(
    '/api/schedules',
    fetcher
  );

  return {
    schedules: data || [],
    error,
    isLoading,
    mutate
  };
}

export function usePendingDevices(isAdmin: boolean) {
  const { data, error, isLoading, mutate } = useSWR<Device[]>(
    isAdmin ? '/api/admin/devices/pending' : null,
    fetcher
  );

  return {
    pendingDevices: data || [],
    error,
    isLoading,
    mutate
  };
}

export function useUsers(isAdmin: boolean) {
  const { data, error, isLoading, mutate } = useSWR<User[]>(
    isAdmin ? '/api/auth/users' : null,
    fetcher
  );

  return {
    users: data || [],
    error,
    isLoading,
    mutate
  };
}

export function useDeviceLogs() {
  const { data, error, isLoading, mutate } = useSWR<EventLog[]>(
    '/api/devices/logs',
    fetcher
  );

  return {
    logs: data || [],
    error,
    isLoading,
    mutate
  };
}

export function useTemplates() {
  const { data, error, isLoading, mutate } = useSWR<Template[]>(
    '/api/templates',
    fetcher
  );

  return {
    templates: data || [],
    error,
    isLoading,
    mutate
  };
}
