"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaylistService = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
const prisma_service_1 = require("../prisma/prisma.service");
let PlaylistService = class PlaylistService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createPlaylist(dto, userId) {
        return this.prisma.playlist.create({
            data: {
                userId,
                playlistName: dto.playlistName,
                description: dto.description,
                isSyncGroup: dto.isSyncGroup || false,
                syncLayout: dto.syncLayout,
            },
        });
    }
    async getPlaylists(userId, role) {
        const where = role === 'admin' ? {} : { userId };
        return this.prisma.playlist.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
    }
    async getPlaylistItems(playlistId, userId, role) {
        const playlist = await this.prisma.playlist.findUnique({
            where: { id: playlistId },
        });
        if (!playlist) {
            throw new common_1.NotFoundException('Không tìm thấy danh sách phát');
        }
        if (role !== 'admin' && playlist.userId !== userId) {
            throw new common_1.ForbiddenException('Bạn không có quyền xem danh sách phát này');
        }
        const items = await this.prisma.playlistItem.findMany({
            where: { playlistId },
            include: {
                media: true,
            },
            orderBy: { sortOrder: 'asc' },
        });
        return items.map((item) => ({
            id: item.id,
            sortOrder: item.sortOrder,
            duration: item.duration,
            transitionEffect: item.transitionEffect,
            media: {
                ...item.media,
                fileSize: item.media.fileSize.toString(),
            },
        }));
    }
    async addPlaylistItems(playlistId, dto, userId, role) {
        const playlist = await this.prisma.playlist.findUnique({
            where: { id: playlistId },
        });
        if (!playlist) {
            throw new common_1.NotFoundException('Không tìm thấy danh sách phát');
        }
        if (role !== 'admin' && playlist.userId !== userId) {
            throw new common_1.ForbiddenException('Bạn không có quyền sửa danh sách phát này');
        }
        const mediaIds = dto.items.map((item) => item.mediaId);
        const uniqueMediaIds = Array.from(new Set(mediaIds));
        const existingMediaCount = await this.prisma.media.count({
            where: {
                id: { in: uniqueMediaIds },
            },
        });
        if (existingMediaCount !== uniqueMediaIds.length) {
            throw new common_1.BadRequestException('Một hoặc nhiều file phương tiện không tồn tại trong hệ thống');
        }
        return this.prisma.$transaction(async (tx) => {
            await tx.playlistItem.deleteMany({
                where: { playlistId },
            });
            const createData = dto.items.map((item) => ({
                id: crypto.randomUUID(),
                playlistId,
                mediaId: item.mediaId,
                sortOrder: item.sortOrder,
                duration: item.duration || 10,
                transitionEffect: item.transitionEffect || 'none',
            }));
            await tx.playlistItem.createMany({
                data: createData,
            });
            const items = await tx.playlistItem.findMany({
                where: { playlistId },
                include: { media: true },
                orderBy: { sortOrder: 'asc' },
            });
            return items.map((item) => ({
                id: item.id,
                sortOrder: item.sortOrder,
                duration: item.duration,
                transitionEffect: item.transitionEffect,
                media: {
                    ...item.media,
                    fileSize: item.media.fileSize.toString(),
                },
            }));
        });
    }
    async updatePlaylist(playlistId, dto, userId, role) {
        const playlist = await this.prisma.playlist.findUnique({
            where: { id: playlistId },
        });
        if (!playlist) {
            throw new common_1.NotFoundException('Không tìm thấy danh sách phát');
        }
        if (role !== 'admin' && playlist.userId !== userId) {
            throw new common_1.ForbiddenException('Bạn không có quyền sửa danh sách phát này');
        }
        return this.prisma.playlist.update({
            where: { id: playlistId },
            data: {
                playlistName: dto.playlistName,
                description: dto.description,
                isSyncGroup: dto.isSyncGroup,
                syncLayout: dto.syncLayout,
            },
        });
    }
    async deletePlaylist(playlistId, userId, role) {
        const playlist = await this.prisma.playlist.findUnique({
            where: { id: playlistId },
        });
        if (!playlist) {
            throw new common_1.NotFoundException('Không tìm thấy danh sách phát');
        }
        if (role !== 'admin' && playlist.userId !== userId) {
            throw new common_1.ForbiddenException('Bạn không có quyền xóa danh sách phát này');
        }
        return this.prisma.playlist.delete({
            where: { id: playlistId },
        });
    }
    getDeviceIdsFromSyncLayout(syncLayout) {
        if (!syncLayout)
            return [];
        const deviceIds = new Set();
        if (typeof syncLayout === 'object') {
            if (syncLayout.targetDeviceId &&
                typeof syncLayout.targetDeviceId === 'string') {
                deviceIds.add(syncLayout.targetDeviceId);
            }
            if (syncLayout.deviceMapping &&
                typeof syncLayout.deviceMapping === 'object') {
                for (const key in syncLayout.deviceMapping) {
                    const ids = syncLayout.deviceMapping[key];
                    if (Array.isArray(ids)) {
                        ids.forEach((id) => {
                            if (typeof id === 'string')
                                deviceIds.add(id);
                        });
                    }
                }
            }
        }
        return Array.from(deviceIds);
    }
    async createSchedule(dto, userId) {
        let deviceIds = [];
        if (dto.playlistId) {
            const playlist = await this.prisma.playlist.findUnique({
                where: { id: dto.playlistId },
            });
            if (!playlist) {
                throw new common_1.NotFoundException('Không tìm thấy danh sách phát để lập lịch');
            }
            deviceIds = this.getDeviceIdsFromSyncLayout(playlist.syncLayout);
        }
        else if (dto.templateId) {
            const template = await this.prisma.template.findUnique({
                where: { id: dto.templateId },
            });
            if (!template) {
                throw new common_1.NotFoundException('Không tìm thấy bố cục để lập lịch');
            }
            const userDevices = await this.prisma.device.findMany({
                where: { userId },
            });
            deviceIds = userDevices.map((d) => d.id);
        }
        else {
            throw new common_1.BadRequestException('Vui lòng chọn Playlist hoặc Bố cục hiển thị');
        }
        const startDate = new Date(dto.startDate);
        const endDate = new Date(dto.endDate);
        const schedule = await this.prisma.schedule.create({
            data: {
                userId,
                scheduleName: dto.scheduleName,
                playlistId: dto.playlistId ?? null,
                templateId: dto.templateId ?? null,
                startDate,
                endDate,
                startTime: dto.startTime || '00:00:00',
                endTime: dto.endTime || '23:59:59',
                dayOfWeek: dto.dayOfWeek || [1, 2, 3, 4, 5, 6, 0],
                devices: {
                    create: deviceIds.map((deviceId) => ({
                        deviceId,
                    })),
                },
            },
            include: {
                devices: true,
            },
        });
        return schedule;
    }
    async getSchedules(userId, role) {
        const where = role === 'admin' ? {} : { userId };
        return this.prisma.schedule.findMany({
            where,
            include: {
                playlist: true,
                template: true,
                devices: {
                    include: {
                        device: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async updateSchedule(scheduleId, dto, userId, role) {
        const schedule = await this.prisma.schedule.findUnique({
            where: { id: scheduleId },
            include: { devices: true },
        });
        if (!schedule) {
            throw new common_1.NotFoundException('Không tìm thấy lịch trình');
        }
        if (role !== 'admin' && schedule.userId !== userId) {
            throw new common_1.ForbiddenException('Bạn không có quyền chỉnh sửa lịch trình này');
        }
        let deviceIds = [];
        if (dto.playlistId) {
            const playlist = await this.prisma.playlist.findUnique({
                where: { id: dto.playlistId },
            });
            if (!playlist) {
                throw new common_1.NotFoundException('Không tìm thấy danh sách phát để lập lịch');
            }
            deviceIds = this.getDeviceIdsFromSyncLayout(playlist.syncLayout);
        }
        else if (dto.templateId) {
            const template = await this.prisma.template.findUnique({
                where: { id: dto.templateId },
            });
            if (!template) {
                throw new common_1.NotFoundException('Không tìm thấy bố cục để lập lịch');
            }
            const userDevices = await this.prisma.device.findMany({
                where: { userId },
            });
            deviceIds = userDevices.map((d) => d.id);
        }
        else {
            throw new common_1.BadRequestException('Vui lòng chọn Playlist hoặc Bố cục hiển thị');
        }
        const startDate = new Date(dto.startDate);
        const endDate = new Date(dto.endDate);
        return this.prisma.$transaction(async (tx) => {
            await tx.deviceSchedule.deleteMany({
                where: { scheduleId },
            });
            const updatedSchedule = await tx.schedule.update({
                where: { id: scheduleId },
                data: {
                    scheduleName: dto.scheduleName,
                    playlistId: dto.playlistId ?? null,
                    templateId: dto.templateId ?? null,
                    startDate,
                    endDate,
                    startTime: dto.startTime || '00:00:00',
                    endTime: dto.endTime || '23:59:59',
                    dayOfWeek: dto.dayOfWeek || [1, 2, 3, 4, 5, 6, 0],
                    devices: {
                        create: deviceIds.map((deviceId) => ({
                            deviceId,
                        })),
                    },
                },
                include: {
                    devices: true,
                },
            });
            return updatedSchedule;
        });
    }
    async deleteSchedule(scheduleId, userId, role) {
        const schedule = await this.prisma.schedule.findUnique({
            where: { id: scheduleId },
        });
        if (!schedule) {
            throw new common_1.NotFoundException('Không tìm thấy lịch trình');
        }
        if (role !== 'admin' && schedule.userId !== userId) {
            throw new common_1.ForbiddenException('Bạn không có quyền xóa lịch trình này');
        }
        return this.prisma.schedule.delete({
            where: { id: scheduleId },
        });
    }
    async getSyncPlaylistForDevice(deviceId, apiKey) {
        const device = await this.prisma.device.findUnique({
            where: { id: deviceId },
        });
        if (!device || device.apiKey !== apiKey) {
            throw new common_1.UnauthorizedException('Thiết bị không hợp lệ hoặc sai API Key');
        }
        if (device.approvalStatus !== 'approved') {
            return {
                status: 'pending',
                message: 'Thiết bị đang chờ Admin phê duyệt',
                items: [],
            };
        }
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const currentTimeString = `${hours}:${minutes}:${seconds}`;
        const currentDayOfWeek = now.getDay();
        const activeSchedules = await this.prisma.schedule.findMany({
            where: {
                devices: {
                    some: { deviceId },
                },
                startDate: { lte: today },
                endDate: { gte: today },
                startTime: { lte: currentTimeString },
                endTime: { gte: currentTimeString },
                dayOfWeek: { has: currentDayOfWeek },
            },
            include: {
                playlist: {
                    include: {
                        playlistItems: {
                            include: {
                                media: true,
                            },
                            orderBy: { sortOrder: 'asc' },
                        },
                    },
                },
                template: {
                    include: {
                        zones: true,
                    },
                },
            },
            orderBy: {
                priority: 'desc',
            },
        });
        if (activeSchedules.length === 0) {
            return {
                status: 'active',
                playlistId: null,
                playlistName: 'Default Playback',
                items: [],
            };
        }
        const activeSchedule = activeSchedules[0];
        if (activeSchedule.playlist) {
            const targetPlaylist = activeSchedule.playlist;
            return {
                status: 'active',
                type: 'playlist',
                playlistId: targetPlaylist.id,
                playlistName: targetPlaylist.playlistName,
                isSyncGroup: targetPlaylist.isSyncGroup,
                syncLayout: targetPlaylist.syncLayout,
                items: targetPlaylist.playlistItems.map((item) => ({
                    itemId: item.id,
                    mediaId: item.media.id,
                    fileName: item.media.fileName,
                    fileUrl: item.media.fileUrl,
                    fileSize: item.media.fileSize.toString(),
                    mimeType: item.media.mimeType,
                    checksum: item.media.checksum,
                    sortOrder: item.sortOrder,
                    duration: item.duration,
                    transitionEffect: item.transitionEffect,
                })),
            };
        }
        else if (activeSchedule.template) {
            const targetTemplate = activeSchedule.template;
            return {
                status: 'active',
                type: 'template',
                templateId: targetTemplate.id,
                templateName: targetTemplate.name,
                width: targetTemplate.width,
                height: targetTemplate.height,
                orientation: targetTemplate.orientation,
                zones: targetTemplate.zones.map((zone) => ({
                    id: zone.id,
                    name: zone.name,
                    type: zone.type,
                    x: zone.x,
                    y: zone.y,
                    width: zone.width,
                    height: zone.height,
                    contentData: zone.contentData,
                })),
            };
        }
        return {
            status: 'active',
            playlistId: null,
            playlistName: 'Default Playback',
            items: [],
        };
    }
};
exports.PlaylistService = PlaylistService;
exports.PlaylistService = PlaylistService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PlaylistService);
//# sourceMappingURL=playlist.service.js.map