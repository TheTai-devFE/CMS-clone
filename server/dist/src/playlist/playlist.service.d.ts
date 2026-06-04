import { PrismaService } from '../prisma/prisma.service';
import { AddPlaylistItemsDto } from './dto/add-playlist-items.dto';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { CreateScheduleDto } from './dto/create-schedule.dto';
export declare class PlaylistService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createPlaylist(dto: CreatePlaylistDto, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        playlistName: string;
        description: string | null;
        isSyncGroup: boolean;
        syncLayout: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
    getPlaylists(userId: string, role: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        playlistName: string;
        description: string | null;
        isSyncGroup: boolean;
        syncLayout: import("@prisma/client/runtime/client").JsonValue | null;
    }[]>;
    getPlaylistItems(playlistId: string, userId: string, role: string): Promise<{
        id: string;
        sortOrder: number;
        duration: number;
        transitionEffect: string;
        media: {
            fileSize: string;
            id: string;
            createdAt: Date;
            userId: string;
            fileName: string;
            fileUrl: string;
            mimeType: string;
            checksum: string;
        };
    }[]>;
    addPlaylistItems(playlistId: string, dto: AddPlaylistItemsDto, userId: string, role: string): Promise<({
        media: {
            id: string;
            createdAt: Date;
            userId: string;
            fileName: string;
            fileUrl: string;
            fileSize: bigint;
            mimeType: string;
            checksum: string;
        };
    } & {
        id: string;
        createdAt: Date;
        mediaId: string;
        sortOrder: number;
        duration: number;
        transitionEffect: string;
        playlistId: string;
    })[]>;
    deletePlaylist(playlistId: string, userId: string, role: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        playlistName: string;
        description: string | null;
        isSyncGroup: boolean;
        syncLayout: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
    createSchedule(dto: CreateScheduleDto, userId: string): Promise<{
        devices: {
            deviceId: string;
            scheduleId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        scheduleName: string;
        playlistId: string;
        startDate: Date;
        endDate: Date;
        startTime: string;
        endTime: string;
        dayOfWeek: number[];
        priority: number;
    }>;
    getSchedules(userId: string, role: string): Promise<({
        playlist: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            playlistName: string;
            description: string | null;
            isSyncGroup: boolean;
            syncLayout: import("@prisma/client/runtime/client").JsonValue | null;
        };
        devices: ({
            device: {
                id: string;
                status: string;
                createdAt: Date;
                updatedAt: Date;
                apiKey: string;
                deviceName: string;
                macAddress: string | null;
                screenResolution: string | null;
                osVersion: string | null;
                appVersion: string | null;
                userId: string | null;
                approvalStatus: string;
                ipAddress: string | null;
                lastHeartbeat: Date | null;
            };
        } & {
            deviceId: string;
            scheduleId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        scheduleName: string;
        playlistId: string;
        startDate: Date;
        endDate: Date;
        startTime: string;
        endTime: string;
        dayOfWeek: number[];
        priority: number;
    })[]>;
    getSyncPlaylistForDevice(deviceId: string, apiKey: string): Promise<{
        status: string;
        message: string;
        items: never[];
        playlistId?: undefined;
        playlistName?: undefined;
        isSyncGroup?: undefined;
        syncLayout?: undefined;
    } | {
        status: string;
        playlistId: null;
        playlistName: string;
        items: never[];
        message?: undefined;
        isSyncGroup?: undefined;
        syncLayout?: undefined;
    } | {
        status: string;
        playlistId: string;
        playlistName: string;
        isSyncGroup: boolean;
        syncLayout: import("@prisma/client/runtime/client").JsonValue;
        items: {
            itemId: string;
            mediaId: string;
            fileName: string;
            fileUrl: string;
            fileSize: string;
            mimeType: string;
            checksum: string;
            sortOrder: number;
            duration: number;
            transitionEffect: string;
        }[];
        message?: undefined;
    }>;
}
