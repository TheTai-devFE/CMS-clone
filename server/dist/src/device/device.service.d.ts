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
        deviceId: any;
        deviceName: any;
    }>;
    register(dto: RegisterDeviceDto, ipAddress: string): Promise<any>;
    heartbeat(dto: HeartbeatDto): Promise<{
        deviceId: any;
        deviceName: any;
        approvalStatus: any;
        status: string;
    }>;
    assignDevice(deviceId: string, userId: string): Promise<any>;
    getPendingDevices(): Promise<any[]>;
    getUserDevices(userId: string): Promise<any[]>;
    getAllDevices(): Promise<any[]>;
    deleteDevice(id: string): Promise<any>;
    getSystemLogs(user: {
        id: string;
        role: string;
    }): Promise<any[]>;
    private enrichDevicesWithRealtimeStatus;
}
