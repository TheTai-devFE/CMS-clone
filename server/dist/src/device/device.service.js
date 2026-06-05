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
exports.DeviceService = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
const prisma_service_1 = require("../prisma/prisma.service");
const redis_service_1 = require("../redis/redis.service");
let DeviceService = class DeviceService {
    prisma;
    redis;
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
    }
    async generatePairingCode(dto) {
        const pairingCode = Math.floor(100000 + Math.random() * 900000).toString();
        const tempDeviceId = crypto.randomUUID();
        const tempInfo = {
            macAddress: dto.macAddress,
            screenResolution: dto.screenResolution,
            osVersion: dto.osVersion,
            appVersion: dto.appVersion,
            tempDeviceId,
        };
        await this.redis.set(`pairing_code:${pairingCode}`, JSON.stringify(tempInfo), 600);
        await this.redis.set(`pairing_status:${tempDeviceId}`, JSON.stringify({ status: 'pending' }), 600);
        return {
            pairingCode,
            tempDeviceId,
            expireAt: Date.now() + 600000,
        };
    }
    async getPairingStatus(tempDeviceId) {
        const statusStr = await this.redis.get(`pairing_status:${tempDeviceId}`);
        if (!statusStr) {
            return { status: 'expired' };
        }
        return JSON.parse(statusStr);
    }
    async claimDevice(userId, dto) {
        const pairingCode = dto.pairingCode.trim();
        const tempInfoStr = await this.redis.get(`pairing_code:${pairingCode}`);
        if (!tempInfoStr) {
            throw new common_1.BadRequestException('Mã liên kết không tồn tại hoặc đã hết hạn');
        }
        const tempInfo = JSON.parse(tempInfoStr);
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('Không tìm thấy người dùng');
        }
        const assignedCount = await this.prisma.device.count({
            where: { userId },
        });
        if (assignedCount >= user.licenseLimit) {
            throw new common_1.BadRequestException(`Vượt quá giới hạn bản quyền (Hạn mức: ${user.licenseLimit} thiết bị. Hiện tại đã gán: ${assignedCount} thiết bị)`);
        }
        const apiKey = 'dev_' + crypto.randomBytes(24).toString('hex');
        const device = await this.prisma.device.create({
            data: {
                userId,
                deviceName: dto.deviceName,
                apiKey,
                macAddress: tempInfo.macAddress,
                screenResolution: tempInfo.screenResolution,
                osVersion: tempInfo.osVersion,
                appVersion: tempInfo.appVersion,
                status: 'offline',
                approvalStatus: 'approved',
            },
        });
        await this.redis.set(`pairing_status:${tempInfo.tempDeviceId}`, JSON.stringify({
            status: 'linked',
            apiKey,
            deviceId: device.id,
        }), 120);
        await this.redis.del(`pairing_code:${pairingCode}`);
        return {
            success: true,
            deviceId: device.id,
            deviceName: device.deviceName,
        };
    }
    async register(dto, ipAddress) {
        if (dto.deviceId) {
            try {
                const existingDevice = await this.prisma.device.findUnique({
                    where: { id: dto.deviceId },
                });
                if (existingDevice) {
                    const updatedDevice = await this.prisma.device.update({
                        where: { id: dto.deviceId },
                        data: {
                            deviceName: dto.deviceName,
                            macAddress: dto.macAddress || existingDevice.macAddress,
                            ipAddress: ipAddress || existingDevice.ipAddress,
                            screenResolution: dto.screenResolution || existingDevice.screenResolution,
                            osVersion: dto.osVersion || existingDevice.osVersion,
                            appVersion: dto.appVersion || existingDevice.appVersion,
                            approvalStatus: 'approved',
                        },
                        select: {
                            id: true,
                            deviceName: true,
                            apiKey: true,
                            approvalStatus: true,
                        },
                    });
                    return updatedDevice;
                }
            }
            catch (err) {
                console.error('Lỗi khi kiểm tra/cập nhật thiết bị hiện có:', err);
            }
        }
        const apiKey = 'dev_' + crypto.randomBytes(24).toString('hex');
        const device = await this.prisma.device.create({
            data: {
                deviceName: dto.deviceName,
                apiKey,
                macAddress: dto.macAddress,
                ipAddress,
                screenResolution: dto.screenResolution,
                osVersion: dto.osVersion,
                appVersion: dto.appVersion,
                status: 'offline',
                approvalStatus: 'approved',
            },
            select: {
                id: true,
                deviceName: true,
                apiKey: true,
                approvalStatus: true,
            },
        });
        return device;
    }
    async heartbeat(dto) {
        const device = await this.prisma.device.findUnique({
            where: { id: dto.deviceId },
        });
        if (!device || device.apiKey !== dto.apiKey) {
            throw new common_1.UnauthorizedException('Thiết bị không hợp lệ hoặc sai API Key');
        }
        const now = new Date();
        await this.prisma.device.update({
            where: { id: dto.deviceId },
            data: {
                lastHeartbeat: now,
                status: 'online',
            },
        });
        const redisKey = `device:status:${dto.deviceId}`;
        await this.redis.set(redisKey, 'online', 75);
        await this.prisma.heartbeatLog.create({
            data: {
                deviceId: dto.deviceId,
                status: 'online',
                currentMediaId: dto.currentMediaId,
                cpuUsage: dto.cpuUsage,
                freeMemoryMb: dto.freeMemoryMb,
            },
        });
        return {
            deviceId: device.id,
            deviceName: device.deviceName,
            approvalStatus: device.approvalStatus,
            status: 'online',
        };
    }
    async assignDevice(deviceId, userId) {
        const device = await this.prisma.device.findUnique({
            where: { id: deviceId },
        });
        if (!device) {
            throw new common_1.NotFoundException('Không tìm thấy thiết bị');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('Không tìm thấy người dùng');
        }
        return this.prisma.$transaction(async (tx) => {
            const assignedCount = await tx.device.count({
                where: { userId },
            });
            if (assignedCount >= user.licenseLimit) {
                throw new common_1.BadRequestException(`Vượt quá giới hạn bản quyền (Hạn mức: ${user.licenseLimit} thiết bị. Hiện tại đã gán: ${assignedCount} thiết bị)`);
            }
            const updatedDevice = await tx.device.update({
                where: { id: deviceId },
                data: {
                    userId,
                    approvalStatus: 'approved',
                },
            });
            return updatedDevice;
        });
    }
    async getPendingDevices() {
        const devices = await this.prisma.device.findMany({
            where: { approvalStatus: 'pending' },
            orderBy: { createdAt: 'desc' },
        });
        return this.enrichDevicesWithRealtimeStatus(devices);
    }
    async getUserDevices(userId) {
        const devices = await this.prisma.device.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        return this.enrichDevicesWithRealtimeStatus(devices);
    }
    async getAllDevices() {
        const devices = await this.prisma.device.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return this.enrichDevicesWithRealtimeStatus(devices);
    }
    async deleteDevice(id) {
        const device = await this.prisma.device.findUnique({
            where: { id },
        });
        if (!device) {
            throw new common_1.NotFoundException('Không tìm thấy thiết bị để xóa');
        }
        await this.redis.del(`device:status:${id}`);
        return this.prisma.device.delete({
            where: { id },
        });
    }
    async enrichDevicesWithRealtimeStatus(devices) {
        const enriched = await Promise.all(devices.map(async (device) => {
            const redisKey = `device:status:${device.id}`;
            const isOnline = await this.redis.exists(redisKey);
            return {
                ...device,
                status: isOnline ? 'online' : 'offline',
            };
        }));
        return enriched;
    }
};
exports.DeviceService = DeviceService;
exports.DeviceService = DeviceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], DeviceService);
//# sourceMappingURL=device.service.js.map