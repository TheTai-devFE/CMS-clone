import { DeviceService } from './device.service';
import { AssignDeviceDto } from './dto/assign-device.dto';
import { HeartbeatDto } from './dto/heartbeat.dto';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { CreatePairingCodeDto } from './dto/create-pairing-code.dto';
import { ClaimDeviceDto } from './dto/claim-device.dto';
export declare class DeviceController {
    private readonly deviceService;
    constructor(deviceService: DeviceService);
    generatePairingCode(dto: CreatePairingCodeDto): Promise<{
        pairingCode: string;
        tempDeviceId: `${string}-${string}-${string}-${string}-${string}`;
        expireAt: number;
    }>;
    getPairingStatus(tempDeviceId: string): Promise<any>;
    registerDevice(dto: RegisterDeviceDto, ip: string): Promise<{
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
    claimDevice(user: any, dto: ClaimDeviceDto): Promise<{
        success: boolean;
        deviceId: string;
        deviceName: string;
    }>;
    getUserDevices(user: any): Promise<any[]>;
    deleteDevice(id: string, user: any): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        apiKey: string;
        deviceName: string;
        approvalStatus: string;
        macAddress: string | null;
        ipAddress: string | null;
        screenResolution: string | null;
        osVersion: string | null;
        appVersion: string | null;
        lastHeartbeat: Date | null;
        userId: string | null;
    }>;
    getPendingDevices(): Promise<any[]>;
    assignDevice(id: string, dto: AssignDeviceDto): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        apiKey: string;
        deviceName: string;
        approvalStatus: string;
        macAddress: string | null;
        ipAddress: string | null;
        screenResolution: string | null;
        osVersion: string | null;
        appVersion: string | null;
        lastHeartbeat: Date | null;
        userId: string | null;
    }>;
}
