import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class DeviceBatchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private async getAccessibleDevices(
    user: { id: string; role: string },
    deviceIds: string[],
  ) {
    if (user.role === 'admin') {
      return this.prisma.device.findMany({
        where: { id: { in: deviceIds } },
      });
    }
    return this.prisma.device.findMany({
      where: { id: { in: deviceIds }, userId: user.id },
    });
  }

  async batchReboot(user: { id: string; role: string }, deviceIds: string[]) {
    const devices = await this.getAccessibleDevices(user, deviceIds);
    for (const device of devices) {
      await this.redis.set(
        `device:command:${device.id}:reboot`,
        JSON.stringify({ command: 'reboot', timestamp: Date.now() }),
        300,
      );
    }
    return {
      success: true,
      count: devices.length,
      message: `Đã gửi lệnh reboot tới ${devices.length} thiết bị`,
    };
  }

  async batchVolume(
    user: { id: string; role: string },
    deviceIds: string[],
    volume: number,
  ) {
    const devices = await this.getAccessibleDevices(user, deviceIds);
    for (const device of devices) {
      await this.redis.set(
        `device:command:${device.id}:volume`,
        JSON.stringify({ command: 'volume', volume, timestamp: Date.now() }),
        300,
      );
    }
    return {
      success: true,
      count: devices.length,
      message: `Đã gửi lệnh điều chỉnh âm lượng (${volume}%) tới ${devices.length} thiết bị`,
    };
  }

  async batchInstallApk(
    user: { id: string; role: string },
    deviceIds: string[],
    apkUrl?: string,
  ) {
    const devices = await this.getAccessibleDevices(user, deviceIds);
    for (const device of devices) {
      await this.redis.set(
        `device:command:${device.id}:install-apk`,
        JSON.stringify({ command: 'install-apk', apkUrl, timestamp: Date.now() }),
        600,
      );
    }
    return {
      success: true,
      count: devices.length,
      message: `Đã gửi lệnh cài đặt APK tới ${devices.length} thiết bị`,
    };
  }

  async batchUninstallApk(
    user: { id: string; role: string },
    deviceIds: string[],
  ) {
    const devices = await this.getAccessibleDevices(user, deviceIds);
    for (const device of devices) {
      await this.redis.set(
        `device:command:${device.id}:uninstall-apk`,
        JSON.stringify({ command: 'uninstall-apk', timestamp: Date.now() }),
        300,
      );
    }
    return {
      success: true,
      count: devices.length,
      message: `Đã gửi lệnh gỡ APK tới ${devices.length} thiết bị`,
    };
  }

  async batchClearContent(
    user: { id: string; role: string },
    deviceIds: string[],
  ) {
    const devices = await this.getAccessibleDevices(user, deviceIds);
    for (const device of devices) {
      await this.redis.set(
        `device:command:${device.id}:clear-content`,
        JSON.stringify({ command: 'clear-content', timestamp: Date.now() }),
        300,
      );
    }
    return {
      success: true,
      count: devices.length,
      message: `Đã gửi lệnh xóa nội dung tới ${devices.length} thiết bị`,
    };
  }
}
