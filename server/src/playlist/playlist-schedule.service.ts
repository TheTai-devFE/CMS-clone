import { Injectable, NotFoundException, ForbiddenException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';

@Injectable()
export class PlaylistScheduleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

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

  async publishPlaylist(
    playlistId: string,
    userId: string,
    role: string,
    devices: { deviceId: string; enabled: boolean }[],
    scheduleNameOverride?: string,
  ) {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id: playlistId },
      include: {
        playlistItems: { select: { id: true } },
      },
    });

    if (!playlist) {
      throw new NotFoundException('Không tìm thấy danh sách phát');
    }

    if (role !== 'admin' && playlist.userId !== userId) {
      throw new ForbiddenException(
        'Bạn không có quyền publish danh sách phát này',
      );
    }

    if (playlist.playlistItems.length === 0) {
      throw new BadRequestException(
        'Playlist phải có ít nhất 1 slide trước khi publish',
      );
    }

    const deviceIds = devices.map((d) => d.deviceId);
    const validDevices = await this.prisma.device.findMany({
      where: {
        id: { in: deviceIds },
        ...(role === 'admin' ? {} : { userId }),
      },
      select: { id: true, approvalStatus: true },
    });

    if (validDevices.length !== deviceIds.length) {
      throw new BadRequestException(
        'Một hoặc nhiều thiết bị không tồn tại hoặc không thuộc quyền của bạn',
      );
    }

    const invalidApproval = validDevices.find(
      (d) => d.approvalStatus !== 'approved',
    );
    if (invalidApproval) {
      throw new BadRequestException(
        `Thiết bị ${invalidApproval.id} chưa được admin duyệt`,
      );
    }

    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const endOfYear = new Date(today.getFullYear() + 2, 11, 31);

    await this.prisma.schedule.deleteMany({
      where: {
        playlistId,
        scheduleName: { startsWith: 'Publish Nhanh -' },
        userId,
      },
    });

    const scheduleName =
      scheduleNameOverride ||
      `Publish Nhanh - ${playlist.playlistName} (${new Date().toISOString().slice(0, 16).replace('T', ' ')})`;

    const schedule = await this.prisma.schedule.create({
      data: {
        userId,
        scheduleName,
        playlistId,
        startDate: startOfYear,
        endDate: endOfYear,
        startTime: '00:00:00',
        endTime: '23:59:59',
        dayOfWeek: [0, 1, 2, 3, 4, 5, 6],
        priority: 10,
        devices: {
          create: devices.map((d) => ({
            deviceId: d.deviceId,
            enabled: d.enabled,
          })),
        },
      },
      include: {
        devices: true,
      },
    });

    return {
      scheduleId: schedule.id,
      scheduleName: schedule.scheduleName,
      playlistId,
      deviceCount: schedule.devices.length,
      enabledCount: schedule.devices.filter((d) => d.enabled).length,
    };
  }

  async createSchedule(dto: CreateScheduleDto, userId: string) {
    let deviceIds: string[] = [];

    if (dto.deviceIds && dto.deviceIds.length > 0) {
      deviceIds = dto.deviceIds;
    } else if (dto.playlistId) {
      const playlist = await this.prisma.playlist.findUnique({
        where: { id: dto.playlistId },
      });
      if (!playlist) throw new NotFoundException('Không tìm thấy danh sách phát');
      deviceIds = this.getDeviceIdsFromSyncLayout(
        playlist.syncLayout as Record<string, unknown> | null | undefined,
      );
    } else if (dto.templateId) {
      const template = await this.prisma.template.findUnique({ where: { id: dto.templateId } });
      if (!template) throw new NotFoundException('Không tìm thấy bố cục');
      const userDevices = await this.prisma.device.findMany({ where: { userId } });
      deviceIds = userDevices.map((d) => d.id);
    } else {
      throw new BadRequestException('Vui lòng chọn Playlist hoặc Bố cục hiển thị');
    }

    return this.prisma.schedule.create({
      data: {
        userId,
        scheduleName: dto.scheduleName,
        playlistId: dto.playlistId ?? null,
        templateId: dto.templateId ?? null,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        startTime: dto.startTime || '00:00:00',
        endTime: dto.endTime || '23:59:59',
        dayOfWeek: dto.dayOfWeek || [1, 2, 3, 4, 5, 6, 0],
        devices: { create: deviceIds.map((deviceId) => ({ deviceId })) },
      },
      include: { devices: true },
    });
  }

  async getSchedules(userId: string, role: string) {
    const where = role === 'admin' ? {} : { userId };
    return this.prisma.schedule.findMany({
      where,
      include: { playlist: true, template: true, devices: { include: { device: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateSchedule(scheduleId: string, dto: CreateScheduleDto, userId: string, role: string) {
    const schedule = await this.prisma.schedule.findUnique({ where: { id: scheduleId } });
    if (!schedule) throw new NotFoundException('Không tìm thấy lịch trình');
    if (role !== 'admin' && schedule.userId !== userId) throw new ForbiddenException('Không có quyền');

    let deviceIds: string[] = dto.deviceIds || [];

    return this.prisma.$transaction(async (tx) => {
      await tx.deviceSchedule.deleteMany({ where: { scheduleId } });
      return tx.schedule.update({
        where: { id: scheduleId },
        data: {
          scheduleName: dto.scheduleName,
          playlistId: dto.playlistId ?? null,
          templateId: dto.templateId ?? null,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          startTime: dto.startTime || '00:00:00',
          endTime: dto.endTime || '23:59:59',
          dayOfWeek: dto.dayOfWeek || [1, 2, 3, 4, 5, 6, 0],
          devices: { create: deviceIds.map((deviceId) => ({ deviceId })) },
        },
        include: { devices: true },
      });
    });
  }

  async deleteSchedule(scheduleId: string, userId: string, role: string) {
    const schedule = await this.prisma.schedule.findUnique({ where: { id: scheduleId } });
    if (!schedule) throw new NotFoundException('Không tìm thấy lịch trình');
    if (role !== 'admin' && schedule.userId !== userId) throw new ForbiddenException('Không có quyền');

    const linkedDevices = await this.prisma.deviceSchedule.findMany({
      where: { scheduleId },
      select: { deviceId: true },
    });

    for (const d of linkedDevices) {
      await this.redis.set(`device:sync:${d.deviceId}`, JSON.stringify({ status: 'idle', progress: 100, updatedAt: Date.now() }), 3600);
    }

    return this.prisma.schedule.delete({ where: { id: scheduleId } });
  }

  async getSyncPlaylistForDevice(deviceId: string, apiKey: string) {
    const device = await this.prisma.device.findUnique({ where: { id: deviceId } });
    if (!device || device.apiKey !== apiKey) throw new UnauthorizedException('Thiết bị không hợp lệ');
    if (device.approvalStatus !== 'approved') return { status: 'pending', message: 'Chờ duyệt', items: [] };

    const now = new Date();
    const today = new Date(`${now.toISOString().split('T')[0]}T12:00:00.000Z`);
    const currentTimeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const activeSchedules = await this.prisma.schedule.findMany({
      where: {
        devices: { some: { deviceId, enabled: true } },
        startDate: { lte: today },
        endDate: { gte: today },
        startTime: { lte: currentTimeString },
        endTime: { gte: currentTimeString },
        dayOfWeek: { has: now.getDay() },
      },
      include: {
        playlist: { include: { playlistItems: { include: { media: true }, orderBy: { sortOrder: 'asc' } } } },
        template: { include: { zones: true } },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    if (activeSchedules.length === 0) {
      return { status: 'active', playlistId: null, playlistName: 'Default Playback', items: [] };
    }

    const activeSchedule = activeSchedules[0];
    if (activeSchedule.playlist) {
      const targetPlaylist = activeSchedule.playlist;
      const items = targetPlaylist.playlistItems.map((item) => ({
        itemId: item.id,
        mediaId: item.media.id,
        fileName: item.media.fileName,
        fileUrl: item.media.fileUrl,
        fileSize: item.media.fileSize.toString(),
        mimeType: item.media.mimeType,
        checksum: item.media.checksum,
        sortOrder: item.sortOrder,
        duration: item.duration,
        transitionEffect: item.transitionEffect,
      }));

      const responseBody: Record<string, unknown> = {
        status: 'active',
        type: 'playlist',
        playlistId: targetPlaylist.id,
        playlistName: targetPlaylist.playlistName,
        isSyncGroup: targetPlaylist.isSyncGroup,
        syncLayout: targetPlaylist.syncLayout,
        items,
      };

      if (targetPlaylist.isSyncGroup) {
        const syncPlayDeadline = Date.now() + 2000;
        await this.redis.set(`sync:start:${targetPlaylist.id}`, String(syncPlayDeadline), 3600);
        responseBody.serverTime = Date.now();
        responseBody.syncPlayDeadline = syncPlayDeadline;
      }

      return responseBody;
    }

    return { status: 'active', playlistId: null, playlistName: 'Default Playback', items: [] };
  }
}

