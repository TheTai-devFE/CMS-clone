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
    registerDevice(dto: RegisterDeviceDto, ip: string): Promise<any>;
    heartbeat(dto: HeartbeatDto): Promise<{
        deviceId: any;
        deviceName: any;
        approvalStatus: any;
        status: string;
    }>;
    claimDevice(user: any, dto: ClaimDeviceDto): Promise<{
        success: boolean;
        deviceId: any;
        deviceName: any;
    }>;
    getUserDevices(user: any): Promise<any[]>;
    getSystemLogs(user: any): Promise<any[]>;
    deleteDevice(id: string, user: any): Promise<any>;
    getPendingDevices(): Promise<any[]>;
    assignDevice(id: string, dto: AssignDeviceDto): Promise<any>;
}
