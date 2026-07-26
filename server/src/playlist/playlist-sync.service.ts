import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class PlaylistSyncService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getSyncTimeForDevice(
    deviceId: string,
    apiKey: string,
    playlistId: string,
  ) {
    const device = await this.prisma.device.findUnique({
      where: { id: deviceId },
    });
    if (!device || device.apiKey !== apiKey) {
      throw new UnauthorizedException('Thiết bị không hợp lệ hoặc sai API Key');
    }

    const stored = await this.redis.get(`sync:start:${playlistId}`);
    const serverTime = Date.now();

    if (!stored) {
      return {
        serverTime,
        syncPlayDeadline: null,
        message: 'Chưa có mốc sync cho playlist này',
      };
    }

    return {
      serverTime,
      syncPlayDeadline: parseInt(stored, 10),
    };
  }
}
