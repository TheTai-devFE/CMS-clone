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

@Injectable()
export class PlaylistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async createPlaylist(dto: CreatePlaylistDto, userId: string) {
    return this.prisma.playlist.create({
      data: {
        userId,
        playlistName: dto.playlistName,
        description: dto.description,
        isSyncGroup: dto.isSyncGroup || false,
        syncLayout: dto.syncLayout as Prisma.InputJsonValue,
      },
    });
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

    return this.prisma.playlist.update({
      where: { id: playlistId },
      data: {
        playlistName: dto.playlistName,
        description: dto.description,
        isSyncGroup: dto.isSyncGroup,
        syncLayout: dto.syncLayout as Prisma.InputJsonValue,
      },
    });
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
        JSON.stringify({ status: 'idle', progress: 100, updatedAt: Date.now() }),
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

  private getDeviceIdsFromSyncLayout(syncLayout: any): string[] {
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
          const ids = syncLayout.deviceMapping[key];
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

  async createSchedule(dto: CreateScheduleDto, userId: string) {
    let deviceIds: string[] = [];

    if (dto.playlistId) {
      const playlist = await this.prisma.playlist.findUnique({
        where: { id: dto.playlistId },
      });
      if (!playlist) {
        throw new NotFoundException(
          'Không tìm thấy danh sách phát để lập lịch',
        );
      }
      if (dto.deviceIds && dto.deviceIds.length > 0) {
        deviceIds = dto.deviceIds;
      } else {
        deviceIds = this.getDeviceIdsFromSyncLayout(playlist.syncLayout);
      }
    } else if (dto.templateId) {
      const template = await this.prisma.template.findUnique({
        where: { id: dto.templateId },
      });
      if (!template) {
        throw new NotFoundException('Không tìm thấy bố cục để lập lịch');
      }
      // Đối với Template, tự động gán toàn bộ thiết bị của user
      const userDevices = await this.prisma.device.findMany({
        where: { userId },
      });
      deviceIds = userDevices.map((d) => d.id);
    } else {
      throw new BadRequestException(
        'Vui lòng chọn Playlist hoặc Bố cục hiển thị',
      );
    }

    // Nếu là Lịch phát nhanh (Quick Publish), tự động gỡ các thiết bị này khỏi các lịch phát nhanh cũ
    if (dto.scheduleName.startsWith('Publish Nhanh -') && deviceIds.length > 0) {
      const oldDeviceSchedules = await this.prisma.deviceSchedule.findMany({
        where: {
          deviceId: { in: deviceIds },
          schedule: {
            scheduleName: { startsWith: 'Publish Nhanh -' },
          },
        },
        include: {
          schedule: {
            include: {
              devices: true,
            },
          },
        },
      });

      if (oldDeviceSchedules.length > 0) {
        const scheduleIdsToUpdate = Array.from(
          new Set(oldDeviceSchedules.map((ds) => ds.scheduleId)),
        );
        
        // 1. Xóa liên kết của thiết bị này khỏi các lịch phát nhanh cũ
        await this.prisma.deviceSchedule.deleteMany({
          where: {
            deviceId: { in: deviceIds },
            scheduleId: { in: scheduleIdsToUpdate },
          },
        });

        // 2. Xóa các lịch phát nhanh cũ nếu chúng không còn thiết bị nào liên kết (dọn dẹp DB)
        for (const scheduleId of scheduleIdsToUpdate) {
          const remainingCount = await this.prisma.deviceSchedule.count({
            where: { scheduleId },
          });
          if (remainingCount === 0) {
            await this.prisma.schedule.delete({
              where: { id: scheduleId },
            }).catch((err) => console.error('Lỗi khi xóa lịch trình cũ trống:', err));
          }
        }
      }
    }

    // Định dạng lại ngày để lưu vào PostgreSQL
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    const schedule = await this.prisma.schedule.create({
      data: {
        userId,
        scheduleName: dto.scheduleName,
        playlistId: dto.playlistId ?? null,
        templateId: dto.templateId ?? null,
        startDate,
        endDate,
        startTime: dto.startTime || '00:00:00',
        endTime: dto.endTime || '23:59:59',
        dayOfWeek: dto.dayOfWeek || [1, 2, 3, 4, 5, 6, 0],
        devices: {
          create: deviceIds.map((deviceId) => ({
            deviceId,
          })),
        },
      },
      include: {
        devices: true,
      },
    });

    return schedule;
  }

  async getSchedules(userId: string, role: string) {
    const where = role === 'admin' ? {} : { userId };
    return this.prisma.schedule.findMany({
      where,
      include: {
        playlist: true,
        template: true,
        devices: {
          include: {
            device: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateSchedule(
    scheduleId: string,
    dto: CreateScheduleDto,
    userId: string,
    role: string,
  ) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: { devices: true },
    });

    if (!schedule) {
      throw new NotFoundException('Không tìm thấy lịch trình');
    }

    if (role !== 'admin' && schedule.userId !== userId) {
      throw new ForbiddenException(
        'Bạn không có quyền chỉnh sửa lịch trình này',
      );
    }

    let deviceIds: string[] = [];

    if (dto.playlistId) {
      const playlist = await this.prisma.playlist.findUnique({
        where: { id: dto.playlistId },
      });
      if (!playlist) {
        throw new NotFoundException(
          'Không tìm thấy danh sách phát để lập lịch',
        );
      }
      if (dto.deviceIds && dto.deviceIds.length > 0) {
        deviceIds = dto.deviceIds;
      } else {
        deviceIds = this.getDeviceIdsFromSyncLayout(playlist.syncLayout);
      }
    } else if (dto.templateId) {
      const template = await this.prisma.template.findUnique({
        where: { id: dto.templateId },
      });
      if (!template) {
        throw new NotFoundException('Không tìm thấy bố cục để lập lịch');
      }
      const userDevices = await this.prisma.device.findMany({
        where: { userId },
      });
      deviceIds = userDevices.map((d) => d.id);
    } else {
      throw new BadRequestException(
        'Vui lòng chọn Playlist hoặc Bố cục hiển thị',
      );
    }

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    return this.prisma.$transaction(async (tx) => {
      // 1. Xóa các liên kết thiết bị cũ
      await tx.deviceSchedule.deleteMany({
        where: { scheduleId },
      });

      // 2. Cập nhật lịch trình và tạo các liên kết thiết bị mới tự động
      const updatedSchedule = await tx.schedule.update({
        where: { id: scheduleId },
        data: {
          scheduleName: dto.scheduleName,
          playlistId: dto.playlistId ?? null,
          templateId: dto.templateId ?? null,
          startDate,
          endDate,
          startTime: dto.startTime || '00:00:00',
          endTime: dto.endTime || '23:59:59',
          dayOfWeek: dto.dayOfWeek || [1, 2, 3, 4, 5, 6, 0],
          devices: {
            create: deviceIds.map((deviceId) => ({
              deviceId,
            })),
          },
        },
        include: {
          devices: true,
        },
      });

      return updatedSchedule;
    });
  }

  async deleteSchedule(scheduleId: string, userId: string, role: string) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      throw new NotFoundException('Không tìm thấy lịch trình');
    }

    if (role !== 'admin' && schedule.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa lịch trình này');
    }

    // Tìm các thiết bị liên kết với schedule này
    const linkedDevices = await this.prisma.deviceSchedule.findMany({
      where: { scheduleId },
      select: { deviceId: true },
    });

    const uniqueDeviceIds = [...new Set(linkedDevices.map((d) => d.deviceId))];

    // Reset sync status trong Redis cho từng thiết bị liên quan
    for (const deviceId of uniqueDeviceIds) {
      const syncKey = `device:sync:${deviceId}`;
      await this.redis.set(
        syncKey,
        JSON.stringify({ status: 'idle', progress: 100, updatedAt: Date.now() }),
        3600,
      );
    }

    return this.prisma.schedule.delete({
      where: { id: scheduleId },
    });
  }

  // ==========================================
  // SYNC API CHO PLAYER CLIENT
  // ==========================================

  async getSyncPlaylistForDevice(deviceId: string, apiKey: string) {
    // 1. Xác thực thiết bị
    const device = await this.prisma.device.findUnique({
      where: { id: deviceId },
    });

    if (!device || device.apiKey !== apiKey) {
      throw new UnauthorizedException('Thiết bị không hợp lệ hoặc sai API Key');
    }

    if (device.approvalStatus !== 'approved') {
      return {
        status: 'pending',
        message: 'Thiết bị đang chờ Admin phê duyệt',
        items: [],
      };
    }

    // 2. Lấy thời gian hiện tại của Server
    const now = new Date();
    const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60 * 1000);
    const todayString = localNow.toISOString().split('T')[0];
    const today = new Date(`${todayString}T12:00:00.000Z`);

    // Lấy thời gian HH:mm:ss hiện tại
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const currentTimeString = `${hours}:${minutes}:${seconds}`;

    // Lấy thứ trong tuần (0 = Chủ Nhật, 1 = Thứ 2...)
    const currentDayOfWeek = now.getDay();

    // 3. Tìm các Schedule đang kích hoạt cho thiết bị này
    const activeSchedules = await this.prisma.schedule.findMany({
      where: {
        devices: {
          some: { deviceId },
        },
        startDate: { lte: today },
        endDate: { gte: today },
        startTime: { lte: currentTimeString },
        endTime: { gte: currentTimeString },
        dayOfWeek: { has: currentDayOfWeek }, // Kiểm tra xem mảng dayOfWeek có chứa thứ hiện tại không
      },
      include: {
        playlist: {
          include: {
            playlistItems: {
              include: {
                media: true,
              },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
        template: {
          include: {
            zones: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' }, // Lấy lịch phát có ưu tiên cao nhất trước
        { createdAt: 'desc' }, // Lấy lịch phát mới nhất trước nếu cùng độ ưu tiên
      ],
    });

    if (activeSchedules.length === 0) {
      return {
        status: 'active',
        playlistId: null,
        playlistName: 'Default Playback',
        items: [], // Không có lịch phát nào, màn hình sẽ hiển thị đen hoặc playlist trống
      };
    }

    const activeSchedule = activeSchedules[0];

    // Trả về cấu trúc tương thích tùy theo lịch là Playlist hay Template Layout
    if (activeSchedule.playlist) {
      const targetPlaylist = activeSchedule.playlist;
      return {
        status: 'active',
        type: 'playlist',
        playlistId: targetPlaylist.id,
        playlistName: targetPlaylist.playlistName,
        isSyncGroup: targetPlaylist.isSyncGroup,
        syncLayout: targetPlaylist.syncLayout,
        items: targetPlaylist.playlistItems.map((item) => ({
          itemId: item.id,
          mediaId: item.media.id,
          fileName: item.media.fileName,
          fileUrl: item.media.fileUrl, // Link tải tương đối
          fileSize: item.media.fileSize.toString(),
          mimeType: item.media.mimeType,
          checksum: item.media.checksum,
          sortOrder: item.sortOrder,
          duration: item.duration,
          transitionEffect: item.transitionEffect,
        })),
      };
    } else if (activeSchedule.template) {
      const targetTemplate = activeSchedule.template;
      return {
        status: 'active',
        type: 'template',
        templateId: targetTemplate.id,
        templateName: targetTemplate.name,
        width: targetTemplate.width,
        height: targetTemplate.height,
        orientation: targetTemplate.orientation,
        zones: targetTemplate.zones.map((zone) => ({
          id: zone.id,
          name: zone.name,
          type: zone.type,
          x: zone.x,
          y: zone.y,
          width: zone.width,
          height: zone.height,
          contentData: zone.contentData,
        })),
      };
    }

    return {
      status: 'active',
      playlistId: null,
      playlistName: 'Default Playback',
      items: [],
    };
  }
}
