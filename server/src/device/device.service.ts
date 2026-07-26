import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { HeartbeatDto } from './dto/heartbeat.dto';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { CreatePairingCodeDto } from './dto/create-pairing-code.dto';
import { ClaimDeviceDto } from './dto/claim-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

import { DeviceBatchService } from './device-batch.service';
import { DeviceLogsService } from './device-logs.service';
import { DevicePairingService } from './device-pairing.service';

@Injectable()
export class DeviceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly batchService: DeviceBatchService,
    private readonly logsService: DeviceLogsService,
    private readonly pairingService: DevicePairingService,
  ) {}

  async generatePairingCode(dto: CreatePairingCodeDto) {
    return this.pairingService.generatePairingCode(dto);
  }

  async getPairingStatus(tempDeviceId: string) {
    return this.pairingService.getPairingStatus(tempDeviceId);
  }

  async claimDevice(userId: string, dto: ClaimDeviceDto) {
    return this.pairingService.claimDevice(userId, dto);
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
              screenResolution:
                dto.screenResolution || existingDevice.screenResolution,
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

  async heartbeat(dto: HeartbeatDto, ipAddress?: string) {
    const device = await this.prisma.device.findUnique({
      where: { id: dto.deviceId },
    });

    if (!device || device.apiKey !== dto.apiKey) {
      throw new UnauthorizedException('Thiết bị không hợp lệ hoặc sai API Key');
    }

    const now = new Date();

    // Clean up IP address (handle IPv6 mapping to IPv4 and localhost)
    let cleanIp = ipAddress;
    if (cleanIp) {
      if (cleanIp.startsWith('::ffff:')) {
        cleanIp = cleanIp.substring(7);
      }
      if (cleanIp === '::1') {
        cleanIp = '127.0.0.1';
      }
    }

    const redisKey = `device:status:${dto.deviceId}`;
    const isAlreadyOnline = await this.redis.exists(redisKey);

    const lastUpdate = device.lastHeartbeat
      ? new Date(device.lastHeartbeat).getTime()
      : 0;
    const isTimeForDbUpdate = now.getTime() - lastUpdate > 5 * 60 * 1000; // 5 minutes interval
    const isIpChanged = cleanIp !== device.ipAddress;

    // 1. Chỉ cập nhật PostgreSQL khi chuyển từ Offline sang Online, đổi IP, hoặc đã quá 5 phút
    if (!isAlreadyOnline || isIpChanged || isTimeForDbUpdate) {
      await this.prisma.device.update({
        where: { id: dto.deviceId },
        data: {
          lastHeartbeat: now,
          status: 'online',
          ipAddress: cleanIp || undefined,
        },
      });
    }

    // 2. Ghi nhận trạng thái online trên Redis Cache với TTL 150 giây (2.5 lần chu kỳ 60s)
    await this.redis.set(redisKey, 'online', 150);

    // Cập nhật trạng thái sync vào Redis nếu có gửi lên
    if (dto.syncStatus !== undefined || dto.syncProgress !== undefined) {
      const syncKey = `device:sync:${dto.deviceId}`;
      const existingDataStr = await this.redis.get(syncKey);
      let existingData = { status: 'idle', progress: 100 };
      if (existingDataStr) {
        try {
          existingData = JSON.parse(existingDataStr);
        } catch {
          // Ignore JSON parse error
        }
      }

      const updatedData = {
        status:
          dto.syncStatus !== undefined ? dto.syncStatus : existingData.status,
        progress:
          dto.syncProgress !== undefined
            ? dto.syncProgress
            : existingData.progress,
        updatedAt: Date.now(),
      };

      // Lưu trữ trong 1 giờ
      await this.redis.set(syncKey, JSON.stringify(updatedData), 3600);
    }

    // 3. Đã bỏ ghi log lịch sử heartbeat liên tục vào DB để tránh phình dữ liệu và tối ưu hiệu suất

    // Lấy thông tin user sở hữu thiết bị để đọc securityPassword của user
    const user = device.userId
      ? await this.prisma.user.findUnique({
          where: { id: device.userId },
          select: { securityPassword: true },
        })
      : null;

    // Lấy syncHash hiện tại của thiết bị
    const syncHash = await this.getSyncHashForDevice(dto.deviceId);

    return {
      deviceId: device.id,
      deviceName: device.deviceName,
      approvalStatus: device.approvalStatus,
      status: 'online',
      useSecurityPassword: device.useSecurityPassword,
      securityPassword:
        device.useSecurityPassword && user ? user.securityPassword : null,
      sleepScheduleEnabled: device.sleepScheduleEnabled,
      sleepStartTime: device.sleepStartTime,
      sleepEndTime: device.sleepEndTime,
      syncHash,
    };
  }

  // Helper lấy active schedule để băm syncHash nhanh
  private async getSyncHashForDevice(deviceId: string): Promise<string> {
    const now = new Date();
    const localNow = new Date(
      now.getTime() - now.getTimezoneOffset() * 60 * 1000,
    );
    const todayString = localNow.toISOString().split('T')[0];
    const today = new Date(`${todayString}T12:00:00.000Z`);

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
      select: {
        id: true,
        updatedAt: true,
        playlist: {
          select: {
            id: true,
            updatedAt: true,
          },
        },
        template: {
          select: {
            id: true,
            updatedAt: true,
          },
        },
      },
      orderBy: {
        priority: 'desc',
      },
      take: 1,
    });

    if (activeSchedules.length === 0) {
      return 'empty';
    }

    const activeSchedule = activeSchedules[0];
    const schedPart = `${activeSchedule.id}-${activeSchedule.updatedAt.getTime()}`;
    let subPart = '';

    if (activeSchedule.playlist) {
      subPart = `pl-${activeSchedule.playlist.id}-${activeSchedule.playlist.updatedAt.getTime()}`;
    } else if (activeSchedule.template) {
      subPart = `tmpl-${activeSchedule.template.id}-${activeSchedule.template.updatedAt.getTime()}`;
    }

    const rawString = `${schedPart}_${subPart}`;
    return crypto.createHash('md5').update(rawString).digest('hex');
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
          `Vượt quá giới hạn bản quyền (Hạn mức: ${user.licenseLimit} thiết bị. Hiện tại đã gán: ${assignedCount} thiết bị)`,
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
      include: { user: { select: { shortId: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const enriched = await this.enrichDevicesWithRealtimeStatus(devices);
    return enriched.map((d) => ({
      ...d,
      userShortId: (d as { user?: { shortId: string } }).user?.shortId || null,
    }));
  }

  async getAllDevices() {
    const devices = await this.prisma.device.findMany({
      include: { user: { select: { shortId: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const enriched = await this.enrichDevicesWithRealtimeStatus(devices);
    return enriched.map((d) => ({
      ...d,
      userShortId: (d as { user?: { shortId: string } }).user?.shortId || null,
    }));
  }

  async updateDevice(id: string, dto: UpdateDeviceDto) {
    const device = await this.prisma.device.findUnique({
      where: { id },
    });

    if (!device) {
      throw new NotFoundException('Không tìm thấy thiết bị để chỉnh sửa');
    }

    return this.prisma.device.update({
      where: { id },
      data: {
        deviceName: dto.deviceName ?? undefined,
        useSecurityPassword: dto.useSecurityPassword ?? undefined,
        sleepScheduleEnabled: dto.sleepScheduleEnabled ?? undefined,
        sleepStartTime: dto.sleepStartTime ?? undefined,
        sleepEndTime: dto.sleepEndTime ?? undefined,
      },
    });
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
    return this.logsService.getSystemLogs(user);
  }

  // Helper function để đọc trạng thái realtime từ Redis cho danh sách thiết bị
  private async enrichDevicesWithRealtimeStatus(
    devices: { id: string; status: string }[],
  ) {
    const enriched = await Promise.all(
      devices.map(async (device) => {
        const redisKey = `device:status:${device.id}`;
        const isOnline = await this.redis.exists(redisKey);

        const syncKey = `device:sync:${device.id}`;
        const syncDataStr = await this.redis.get(syncKey);
        let syncStatus = 'idle';
        let syncProgress = 100;

        if (syncDataStr) {
          try {
            const syncData = JSON.parse(syncDataStr);
            syncStatus = syncData.status || 'idle';
            syncProgress =
              typeof syncData.progress === 'number' ? syncData.progress : 100;
          } catch {
            // Ignore JSON parse error
          }
        }

        return {
          ...device,
          status: isOnline ? 'online' : 'offline',
          syncStatus,
          syncProgress,
        };
      }),
    );
    return enriched;
  }

  async batchReboot(user: { id: string; role: string }, deviceIds: string[]) {
    return this.batchService.batchReboot(user, deviceIds);
  }

  async batchVolume(
    user: { id: string; role: string },
    deviceIds: string[],
    volume: number,
  ) {
    return this.batchService.batchVolume(user, deviceIds, volume);
  }

  async batchInstallApk(
    user: { id: string; role: string },
    deviceIds: string[],
    apkUrl?: string,
  ) {
    return this.batchService.batchInstallApk(user, deviceIds, apkUrl);
  }

  async batchUninstallApk(
    user: { id: string; role: string },
    deviceIds: string[],
  ) {
    return this.batchService.batchUninstallApk(user, deviceIds);
  }

  async batchClearContent(
    user: { id: string; role: string },
    deviceIds: string[],
  ) {
    return this.batchService.batchClearContent(user, deviceIds);
  }
}
