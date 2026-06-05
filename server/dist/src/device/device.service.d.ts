import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { HeartbeatDto } from './dto/heartbeat.dto';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { CreatePairingCodeDto } from './dto/create-pairing-code.dto';
import { ClaimDeviceDto } from './dto/claim-device.dto';
export declare class DeviceService {
    private readonly prisma;
    private readonly redis;
    constructor(prisma: PrismaService, redis: RedisService);
    generatePairingCode(dto: CreatePairingCodeDto): Promise<{
        pairingCode: string;
        tempDeviceId: `${string}-${string}-${string}-${string}-${string}`;
        expireAt: number;
    }>;
    getPairingStatus(tempDeviceId: string): Promise<any>;
    claimDevice(userId: string, dto: ClaimDeviceDto): Promise<{
        success: boolean;
        deviceId: string;
        deviceName: string;
    }>;
    register(dto: RegisterDeviceDto, ipAddress: string): Promise<{
        id: string;
        apiKey: string;
        deviceName: string;
        approvalStatus: string;
    }>;
    heartbeat(dto: HeartbeatDto): Promise<{
        deviceId: string;
        deviceName: string;
        approvalStatus: string;
        status: string;
    }>;
    assignDevice(deviceId: string, userId: string): Promise<{
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
    }>;
    getPendingDevices(): Promise<any[]>;
    getUserDevices(userId: string): Promise<any[]>;
    getAllDevices(): Promise<any[]>;
    deleteDevice(id: string): Promise<{
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
    }>;
    private enrichDevicesWithRealtimeStatus;
}
