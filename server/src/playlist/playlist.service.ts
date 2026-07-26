import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { AddPlaylistItemsDto } from './dto/add-playlist-items.dto';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import { ConfigService } from '@nestjs/config';
import { exec } from 'child_process';
import * as util from 'util';
import * as path from 'path';
import * as fs from 'fs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

import { VideoWallSlicerService } from './video-wall-slicer.service';
import { PlaylistSyncService } from './playlist-sync.service';
import { PlaylistScheduleService } from './playlist-schedule.service';

const execPromise = util.promisify(exec);

@Injectable()
export class PlaylistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly redis: RedisService,
    private readonly slicerService: VideoWallSlicerService,
    private readonly syncService: PlaylistSyncService,
    private readonly scheduleService: PlaylistScheduleService,
  ) {}

  async createPlaylist(dto: CreatePlaylistDto, userId: string) {
    const playlist = await this.prisma.playlist.create({
      data: {
        userId,
        playlistName: dto.playlistName,
        description: dto.description,
        isSyncGroup: dto.isSyncGroup || false,
        syncLayout: dto.syncLayout as Prisma.InputJsonValue,
      },
    });

    const syncLayout = dto.syncLayout as {
      videoWall?: {
        rows: number;
        cols: number;
        sourceMediaId: string;
      };
    } | null;

    if (dto.isSyncGroup && syncLayout && syncLayout.videoWall) {
      const { rows, cols, sourceMediaId } = syncLayout.videoWall;
      if (rows && cols && sourceMediaId) {
        await this.slicerService.processVideoWallSlicing(
          playlist.id,
          sourceMediaId,
          rows,
          cols,
          userId,
        );
      }
    }

    return playlist;
  }

  async getPlaylists(userId: string, role: string) {
    const where = role === 'admin' ? {} : { userId };
    return this.prisma.playlist.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPlaylistItems(playlistId: string, userId: string, role: string) {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id: playlistId },
    });

    if (!playlist) {
      throw new NotFoundException('Không tìm thấy danh sách phát');
    }

    if (role !== 'admin' && playlist.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xem danh sách phát này');
    }

    const items = await this.prisma.playlistItem.findMany({
      where: { playlistId },
      include: {
        media: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    return items.map((item) => ({
      id: item.id,
      sortOrder: item.sortOrder,
      duration: item.duration,
      transitionEffect: item.transitionEffect,
      media: {
        ...item.media,
        fileSize: item.media.fileSize.toString(),
      },
    }));
  }

  async addPlaylistItems(
    playlistId: string,
    dto: AddPlaylistItemsDto,
    userId: string,
    role: string,
  ) {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id: playlistId },
    });

    if (!playlist) {
      throw new NotFoundException('Không tìm thấy danh sách phát');
    }

    if (role !== 'admin' && playlist.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền sửa danh sách phát này');
    }

    // 1. Kiểm tra xem toàn bộ mediaId có tồn tại trong database hay không
    const mediaIds = dto.items.map((item) => item.mediaId);
    const uniqueMediaIds = Array.from(new Set(mediaIds));
    const existingMediaCount = await this.prisma.media.count({
      where: {
        id: { in: uniqueMediaIds },
      },
    });

    if (existingMediaCount !== uniqueMediaIds.length) {
      throw new BadRequestException(
        'Một hoặc nhiều file phương tiện không tồn tại trong hệ thống',
      );
    }

    // Thực hiện trong một transaction để xóa items cũ và ghi đè items mới
    return this.prisma.$transaction(async (tx) => {
      // 1. Xóa toàn bộ playlist items cũ
      await tx.playlistItem.deleteMany({
        where: { playlistId },
      });

      // 2. Tạo danh sách items mới (sinh UUID ngẫu nhiên để tránh lỗi Prisma createMany bypass generator)
      const createData = dto.items.map((item) => ({
        id: crypto.randomUUID(),
        playlistId,
        mediaId: item.mediaId,
        sortOrder: item.sortOrder,
        duration: item.duration || 10,
        transitionEffect: item.transitionEffect || 'none',
      }));

      await tx.playlistItem.createMany({
        data: createData,
      });

      // Lấy lại danh sách vừa cập nhật
      const items = await tx.playlistItem.findMany({
        where: { playlistId },
        include: { media: true },
        orderBy: { sortOrder: 'asc' },
      });

      return items.map((item) => ({
        id: item.id,
        sortOrder: item.sortOrder,
        duration: item.duration,
        transitionEffect: item.transitionEffect,
        media: {
          ...item.media,
          fileSize: item.media.fileSize.toString(),
        },
      }));
    });
  }

  async updatePlaylist(
    playlistId: string,
    dto: UpdatePlaylistDto,
    userId: string,
    role: string,
  ) {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id: playlistId },
    });

    if (!playlist) {
      throw new NotFoundException('Không tìm thấy danh sách phát');
    }

    if (role !== 'admin' && playlist.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền sửa danh sách phát này');
    }

    const updatedPlaylist = await this.prisma.playlist.update({
      where: { id: playlistId },
      data: {
        playlistName: dto.playlistName,
        description: dto.description,
        isSyncGroup: dto.isSyncGroup,
        syncLayout: dto.syncLayout as Prisma.InputJsonValue,
      },
    });

    const syncLayout = dto.syncLayout as {
      videoWall?: {
        rows: number;
        cols: number;
        sourceMediaId: string;
      };
    } | null;

    if (dto.isSyncGroup && syncLayout && syncLayout.videoWall) {
      const { rows, cols, sourceMediaId } = syncLayout.videoWall;
      if (rows && cols && sourceMediaId) {
        await this.slicerService.processVideoWallSlicing(
          playlistId,
          sourceMediaId,
          rows,
          cols,
          userId,
        );
      }
    }

    return updatedPlaylist;
  }

  async deletePlaylist(playlistId: string, userId: string, role: string) {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id: playlistId },
    });

    if (!playlist) {
      throw new NotFoundException('Không tìm thấy danh sách phát');
    }

    if (role !== 'admin' && playlist.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa danh sách phát này');
    }

    // Trước khi xóa playlist, tìm tất cả thiết bị liên kết qua Schedule
    // và reset trạng thái sync của chúng trong Redis để giao diện web không bị kẹt "Đang đồng bộ"
    const linkedDeviceSchedules = await this.prisma.deviceSchedule.findMany({
      where: {
        schedule: {
          playlistId,
        },
      },
      select: {
        deviceId: true,
      },
    });

    const uniqueDeviceIds = [
      ...new Set(linkedDeviceSchedules.map((ds) => ds.deviceId)),
    ];

    // Reset sync status trong Redis cho từng thiết bị liên quan
    for (const deviceId of uniqueDeviceIds) {
      const syncKey = `device:sync:${deviceId}`;
      await this.redis.set(
        syncKey,
        JSON.stringify({
          status: 'idle',
          progress: 100,
          updatedAt: Date.now(),
        }),
        3600,
      );
    }

    return this.prisma.playlist.delete({
      where: { id: playlistId },
    });
  }

  // ==========================================
  // SCHEDULING (LẬP LỊCH)
  // ==========================================

  private getDeviceIdsFromSyncLayout(
    syncLayout: Record<string, unknown> | null | undefined,
  ): string[] {
    if (!syncLayout) return [];
    const deviceIds = new Set<string>();

    if (typeof syncLayout === 'object') {
      if (
        syncLayout.targetDeviceId &&
        typeof syncLayout.targetDeviceId === 'string'
      ) {
        deviceIds.add(syncLayout.targetDeviceId);
      }

      if (
        syncLayout.deviceMapping &&
        typeof syncLayout.deviceMapping === 'object'
      ) {
        for (const key in syncLayout.deviceMapping) {
          const deviceMapping = syncLayout.deviceMapping as Record<string, unknown>;
          const ids = deviceMapping[key];
          if (Array.isArray(ids)) {
            ids.forEach((id) => {
              if (typeof id === 'string') deviceIds.add(id);
            });
          }
        }
      }
    }

    return Array.from(deviceIds);
  }

  /**
   * T5: Publish playlist tới danh sách device với on/off riêng biệt.
   *
   * Flow:
   * 1. Validate playlist thuộc user + có items
   * 2. Validate tất cả deviceId thuộc user + đã approved
   * 3. Tạo Schedule mới với playlistId (overwrite Schedule "Publish Nhanh" cũ nếu có)
   * 4. Tạo DeviceSchedule rows với enabled=true/false theo input
   *
   * Lưu ý: chỉ "publish" — KHÔNG ghi đè Schedule chính thức (có date/time/doW).
   * Nếu user muốn lập lịch chính thức, dùng Schedule UI riêng.
   *
   * @throws NotFoundException nếu playlist không tồn tại / không thuộc user
   * @throws BadRequestException nếu playlist rỗng hoặc device invalid
   */
  async publishPlaylist(
    playlistId: string,
    userId: string,
    role: string,
    devices: { deviceId: string; enabled: boolean }[],
    scheduleNameOverride?: string,
  ) {
    return this.scheduleService.publishPlaylist(
      playlistId,
      userId,
      role,
      devices,
      scheduleNameOverride,
    );
  }

  async createSchedule(dto: CreateScheduleDto, userId: string) {
    return this.scheduleService.createSchedule(dto, userId);
  }

  async getSchedules(userId: string, role: string) {
    return this.scheduleService.getSchedules(userId, role);
  }

  async updateSchedule(
    scheduleId: string,
    dto: CreateScheduleDto,
    userId: string,
    role: string,
  ) {
    return this.scheduleService.updateSchedule(scheduleId, dto, userId, role);
  }

  async deleteSchedule(scheduleId: string, userId: string, role: string) {
    return this.scheduleService.deleteSchedule(scheduleId, userId, role);
  }

  async getSyncPlaylistForDevice(deviceId: string, apiKey: string) {
    return this.scheduleService.getSyncPlaylistForDevice(deviceId, apiKey);
  }

  async getSyncTimeForDevice(
    deviceId: string,
    apiKey: string,
    playlistId: string,
  ) {
    return this.syncService.getSyncTimeForDevice(deviceId, apiKey, playlistId);
  }
}
