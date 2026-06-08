import { AddPlaylistItemsDto } from './dto/add-playlist-items.dto';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import { PlaylistService } from './playlist.service';
interface AuthUser {
    id: string;
    role: string;
    email?: string;
}
export declare class PlaylistController {
    private readonly playlistService;
    constructor(playlistService: PlaylistService);
    syncDevice(deviceId: string, apiKey: string): Promise<{
        status: string;
        message: string;
        items: never[];
        playlistId?: undefined;
        playlistName?: undefined;
        type?: undefined;
        isSyncGroup?: undefined;
        syncLayout?: undefined;
        templateId?: undefined;
        templateName?: undefined;
        width?: undefined;
        height?: undefined;
        orientation?: undefined;
        zones?: undefined;
    } | {
        status: string;
        playlistId: null;
        playlistName: string;
        items: never[];
        message?: undefined;
        type?: undefined;
        isSyncGroup?: undefined;
        syncLayout?: undefined;
        templateId?: undefined;
        templateName?: undefined;
        width?: undefined;
        height?: undefined;
        orientation?: undefined;
        zones?: undefined;
    } | {
        status: string;
        type: string;
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
        templateId?: undefined;
        templateName?: undefined;
        width?: undefined;
        height?: undefined;
        orientation?: undefined;
        zones?: undefined;
    } | {
        status: string;
        type: string;
        templateId: string;
        templateName: string;
        width: number;
        height: number;
        orientation: string;
        zones: {
            id: string;
            name: string;
            type: string;
            x: number;
            y: number;
            width: number;
            height: number;
            contentData: import("@prisma/client/runtime/client").JsonValue;
        }[];
        message?: undefined;
        items?: undefined;
        playlistId?: undefined;
        playlistName?: undefined;
        isSyncGroup?: undefined;
        syncLayout?: undefined;
    }>;
    createPlaylist(dto: CreatePlaylistDto, user: AuthUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        playlistName: string;
        description: string | null;
        isSyncGroup: boolean;
        syncLayout: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
    updatePlaylist(id: string, dto: UpdatePlaylistDto, user: AuthUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        playlistName: string;
        description: string | null;
        isSyncGroup: boolean;
        syncLayout: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
    getPlaylists(user: AuthUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        playlistName: string;
        description: string | null;
        isSyncGroup: boolean;
        syncLayout: import("@prisma/client/runtime/client").JsonValue | null;
    }[]>;
    getPlaylistItems(id: string, user: AuthUser): Promise<{
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
    addPlaylistItems(id: string, dto: AddPlaylistItemsDto, user: AuthUser): Promise<{
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
    deletePlaylist(id: string, user: AuthUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        playlistName: string;
        description: string | null;
        isSyncGroup: boolean;
        syncLayout: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
    createSchedule(dto: CreateScheduleDto, user: AuthUser): Promise<{
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
        playlistId: string | null;
        templateId: string | null;
        startDate: Date;
        endDate: Date;
        startTime: string;
        endTime: string;
        dayOfWeek: number[];
        priority: number;
    }>;
    getSchedules(user: AuthUser): Promise<({
        playlist: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            playlistName: string;
            description: string | null;
            isSyncGroup: boolean;
            syncLayout: import("@prisma/client/runtime/client").JsonValue | null;
        } | null;
        template: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            userId: string;
            width: number;
            height: number;
            orientation: string;
        } | null;
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
        playlistId: string | null;
        templateId: string | null;
        startDate: Date;
        endDate: Date;
        startTime: string;
        endTime: string;
        dayOfWeek: number[];
        priority: number;
    })[]>;
}
export {};
