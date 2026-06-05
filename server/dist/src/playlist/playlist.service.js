"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaylistService = void 0;
const common_1 = require("@nestjs/common");
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
        return this.prisma.$transaction(async (tx) => {
            await tx.playlistItem.deleteMany({
                where: { playlistId },
            });
            const createData = dto.items.map((item) => ({
                playlistId,
                mediaId: item.mediaId,
                sortOrder: item.sortOrder,
                duration: item.duration || 10,
                transitionEffect: item.transitionEffect || 'none',
            }));
            await tx.playlistItem.createMany({
                data: createData,
            });
            return tx.playlistItem.findMany({
                where: { playlistId },
                include: { media: true },
                orderBy: { sortOrder: 'asc' },
            });
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
    async createSchedule(dto, userId) {
        if (dto.playlistId) {
            const playlist = await this.prisma.playlist.findUnique({
                where: { id: dto.playlistId },
            });
            if (!playlist) {
                throw new common_1.NotFoundException('Không tìm thấy danh sách phát để lập lịch');
            }
        }
        else if (dto.templateId) {
            const template = await this.prisma.template.findUnique({
                where: { id: dto.templateId },
            });
            if (!template) {
                throw new common_1.NotFoundException('Không tìm thấy bố cục để lập lịch');
            }
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
                    create: dto.deviceIds.map((deviceId) => ({
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