import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreatePairingCodeDto } from './dto/create-pairing-code.dto';
import { ClaimDeviceDto } from './dto/claim-device.dto';

@Injectable()
export class DevicePairingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async generatePairingCode(dto: CreatePairingCodeDto) {
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

    return { pairingCode, tempDeviceId, expireAt: Date.now() + 600000 };
  }

  async getPairingStatus(tempDeviceId: string) {
    const statusStr = await this.redis.get(`pairing_status:${tempDeviceId}`);
    return statusStr ? JSON.parse(statusStr) : { status: 'expired' };
  }

  async claimDevice(userId: string, dto: ClaimDeviceDto) {
    const pairingCode = dto.pairingCode.trim();
    const tempInfoStr = await this.redis.get(`pairing_code:${pairingCode}`);
    if (!tempInfoStr) {
      throw new BadRequestException('Mã liên kết không tồn tại hoặc đã hết hạn');
    }

    const tempInfo = JSON.parse(tempInfoStr);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    const assignedCount = await this.prisma.device.count({ where: { userId } });
    if (assignedCount >= user.licenseLimit) {
      throw new BadRequestException(
        `Vượt quá giới hạn bản quyền (Hạn mức: ${user.licenseLimit} thiết bị. Hiện tại đã gán: ${assignedCount} thiết bị)`,
      );
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

    await this.redis.set(
      `pairing_status:${tempInfo.tempDeviceId}`,
      JSON.stringify({
        status: 'success',
        deviceId: device.id,
        deviceName: device.deviceName,
        apiKey: device.apiKey,
      }),
      600,
    );
    await this.redis.del(`pairing_code:${pairingCode}`);
    return device;
  }
}
