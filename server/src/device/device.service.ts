import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { HeartbeatDto } from './dto/heartbeat.dto';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { CreatePairingCodeDto } from './dto/create-pairing-code.dto';
import { ClaimDeviceDto } from './dto/claim-device.dto';

@Injectable()
export class DeviceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async generatePairingCode(dto: CreatePairingCodeDto) {
    // Sinh mã liên kết ngẫu nhiên 6 chữ số
    const pairingCode = Math.floor(100000 + Math.random() * 900000).toString();
    const tempDeviceId = crypto.randomUUID();

    const tempInfo = {
      macAddress: dto.macAddress,
      screenResolution: dto.screenResolution,
      osVersion: dto.osVersion,
      appVersion: dto.appVersion,
      tempDeviceId,
    };

    // Lưu mã liên kết vào Redis (hết hạn sau 10 phút)
    await this.redis.set(`pairing_code:${pairingCode}`, JSON.stringify(tempInfo), 600);
    // Lưu trạng thái kết nối tạm thời
    await this.redis.set(`pairing_status:${tempDeviceId}`, JSON.stringify({ status: 'pending' }), 600);

    return {
      pairingCode,
      tempDeviceId,
      expireAt: Date.now() + 600000,
    };
  }

  async getPairingStatus(tempDeviceId: string) {
    const statusStr = await this.redis.get(`pairing_status:${tempDeviceId}`);
    if (!statusStr) {
      return { status: 'expired' };
    }
    return JSON.parse(statusStr);
  }

  async claimDevice(userId: string, dto: ClaimDeviceDto) {
    const pairingCode = dto.pairingCode.trim();
    const tempInfoStr = await this.redis.get(`pairing_code:${pairingCode}`);
    
    if (!tempInfoStr) {
      throw new BadRequestException('Mã liên kết không tồn tại hoặc đã hết hạn');
    }

    const tempInfo = JSON.parse(tempInfoStr);

    // 1. Kiểm tra giới hạn license của User
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const assignedCount = await this.prisma.device.count({
      where: { userId },
    });

    if (assignedCount >= user.licenseLimit) {
      throw new BadRequestException(
        `Vượt quá giới hạn bản quyền (Hạn mức: ${user.licenseLimit} thiết bị. Hiện tại đã gán: ${assignedCount} thiết bị)`
      );
    }

    // 2. Tạo thiết bị chính thức gán cho User
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

    // 3. Cập nhật trạng thái liên kết trên Redis để Player đang polling nhận biết được
    await this.redis.set(
      `pairing_status:${tempInfo.tempDeviceId}`,
      JSON.stringify({
        status: 'linked',
        apiKey,
        deviceId: device.id,
      }),
      120 // 2 phút để player polling
    );

    // Xóa pairing code để không cho claim lại
    await this.redis.del(`pairing_code:${pairingCode}`);

    return {
      success: true,
      deviceId: device.id,
      deviceName: device.deviceName,
    };
  }

  async register(dto: RegisterDeviceDto, ipAddress: string) {
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
      } catch (err) {
        console.error('Lỗi khi kiểm tra/cập nhật thiết bị hiện có:', err);
      }
    }

    // Sinh ngẫu nhiên API Key duy nhất cho thiết bị
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
        approvalStatus: 'approved', // Tự động phê duyệt ngay khi đăng ký
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

  async heartbeat(dto: HeartbeatDto) {
    const device = await this.prisma.device.findUnique({
      where: { id: dto.deviceId },
    });

    if (!device || device.apiKey !== dto.apiKey) {
      throw new UnauthorizedException('Thiết bị không hợp lệ hoặc sai API Key');
    }

    const now = new Date();

    // 1. Cập nhật last_heartbeat & status trong DB PostgreSQL
    await this.prisma.device.update({
      where: { id: dto.deviceId },
      data: {
        lastHeartbeat: now,
        status: 'online', // Luôn ghi nhận là online khi có heartbeat
      },
    });

    // 2. Ghi nhận trạng thái online trên Redis Cache với TTL 75 giây (2.5 lần chu kỳ 30s)
    const redisKey = `device:status:${dto.deviceId}`;
    await this.redis.set(redisKey, 'online', 75);

    // 3. Ghi log lịch sử heartbeat (tài nguyên máy)
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

  async assignDevice(deviceId: string, userId: string) {
    const device = await this.prisma.device.findUnique({
      where: { id: deviceId },
    });

    if (!device) {
      throw new NotFoundException('Không tìm thấy thiết bị');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    // Thực hiện transaction để kiểm soát license limit, tránh race condition
    return this.prisma.$transaction(async (tx) => {
      // Đếm số lượng máy đã được gán cho user hiện tại
      const assignedCount = await tx.device.count({
        where: { userId },
      });

      if (assignedCount >= user.licenseLimit) {
        throw new BadRequestException(
          `Vượt quá giới hạn bản quyền (Hạn mức: ${user.licenseLimit} thiết bị. Hiện tại đã gán: ${assignedCount} thiết bị)`
        );
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

    // Cập nhật trạng thái realtime từ Redis
    return this.enrichDevicesWithRealtimeStatus(devices);
  }

  async getUserDevices(userId: string) {
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

  async deleteDevice(id: string) {
    const device = await this.prisma.device.findUnique({
      where: { id },
    });

    if (!device) {
      throw new NotFoundException('Không tìm thấy thiết bị để xóa');
    }

    // Xóa cache trạng thái trên Redis
    await this.redis.del(`device:status:${id}`);

    return this.prisma.device.delete({
      where: { id },
    });
  }

  async getSystemLogs(user: { id: string; role: string }) {
    // 1. Lấy danh sách thiết bị thuộc quyền quản lý của người dùng
    let devices;
    if (user.role === 'admin') {
      devices = await this.prisma.device.findMany({
        select: { id: true, deviceName: true },
      });
    } else {
      devices = await this.prisma.device.findMany({
        where: { userId: user.id },
        select: { id: true, deviceName: true },
      });
    }

    const deviceIds = devices.map((d) => d.id);
    if (deviceIds.length === 0) {
      return [];
    }

    // 2. Lấy HeartbeatLog mới nhất của các thiết bị này
    const heartbeatLogs = await this.prisma.heartbeatLog.findMany({
      where: {
        deviceId: { in: deviceIds },
      },
      include: {
        device: {
          select: { deviceName: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    // 3. Lấy PlaybackLog mới nhất của các thiết bị này
    const playbackLogs = await this.prisma.playbackLog.findMany({
      where: {
        deviceId: { in: deviceIds },
      },
      include: {
        device: {
          select: { deviceName: true },
        },
        media: {
          select: { fileName: true },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
      take: 50,
    });

    // 4. Định dạng và trộn các log lại
    const formattedLogs = [
      ...heartbeatLogs.map((log) => ({
        id: `hb-${log.id}`,
        deviceName: log.device.deviceName,
        status: log.cpuUsage !== null ? 'Heartbeat' : 'Online',
        detail: `CPU: ${log.cpuUsage ?? 0}% | Memory Free: ${log.freeMemoryMb ?? 0}MB`,
        time: log.createdAt.toISOString(),
      })),
      ...playbackLogs.map((log) => ({
        id: `pb-${log.id}`,
        deviceName: log.device.deviceName,
        status: 'Playback Success',
        detail: `Đã phát file: ${log.media?.fileName ?? 'N/A'} (Thời lượng: ${log.durationPlayed ?? 0}s)`,
        time: log.startedAt.toISOString(),
      })),
    ];

    // Sắp xếp giảm dần theo thời gian
    formattedLogs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    // Trả về tối đa 100 log mới nhất
    return formattedLogs.slice(0, 100);
  }

  // Helper function để đọc trạng thái realtime từ Redis cho danh sách thiết bị
  private async enrichDevicesWithRealtimeStatus(devices: any[]) {
    const enriched = await Promise.all(
      devices.map(async (device) => {
        const redisKey = `device:status:${device.id}`;
        const isOnline = await this.redis.exists(redisKey);
        return {
          ...device,
          status: isOnline ? 'online' : 'offline',
        };
      })
    );
    return enriched;
  }
}
