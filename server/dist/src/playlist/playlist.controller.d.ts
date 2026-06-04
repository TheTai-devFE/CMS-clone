import { AddPlaylistItemsDto } from './dto/add-playlist-items.dto';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { PlaylistService } from './playlist.service';
export declare class PlaylistController {
    private readonly playlistService;
    constructor(playlistService: PlaylistService);
    syncDevice(deviceId: string, apiKey: string): Promise<{
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
    createPlaylist(dto: CreatePlaylistDto, user: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        playlistName: string;
        description: string | null;
        isSyncGroup: boolean;
        syncLayout: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
    getPlaylists(user: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        playlistName: string;
        description: string | null;
        isSyncGroup: boolean;
        syncLayout: import("@prisma/client/runtime/client").JsonValue | null;
    }[]>;
    getPlaylistItems(id: string, user: any): Promise<{
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
    addPlaylistItems(id: string, dto: AddPlaylistItemsDto, user: any): Promise<({
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
    deletePlaylist(id: string, user: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        playlistName: string;
        description: string | null;
        isSyncGroup: boolean;
        syncLayout: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
    createSchedule(dto: CreateScheduleDto, user: any): Promise<{
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
    getSchedules(user: any): Promise<({
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
}
