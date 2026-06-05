import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddPlaylistItemsDto } from './dto/add-playlist-items.dto';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { CreateScheduleDto } from './dto/create-schedule.dto';

@Injectable()
export class PlaylistService {
  constructor(private readonly prisma: PrismaService) {}

  async createPlaylist(dto: CreatePlaylistDto, userId: string) {
    return this.prisma.playlist.create({
      data: {
        userId,
        playlistName: dto.playlistName,
        description: dto.description,
        isSyncGroup: dto.isSyncGroup || false,
        syncLayout: dto.syncLayout,
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

  async addPlaylistItems(playlistId: string, dto: AddPlaylistItemsDto, userId: string, role: string) {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id: playlistId },
    });

    if (!playlist) {
      throw new NotFoundException('Không tìm thấy danh sách phát');
    }

    if (role !== 'admin' && playlist.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền sửa danh sách phát này');
    }

    // Thực hiện trong một transaction để xóa items cũ và ghi đè items mới
    return this.prisma.$transaction(async (tx) => {
      // 1. Xóa toàn bộ playlist items cũ
      await tx.playlistItem.deleteMany({
        where: { playlistId },
      });

      // 2. Tạo danh sách items mới
      const createData = dto.items.map((item) => ({
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
      return tx.playlistItem.findMany({
        where: { playlistId },
        include: { media: true },
        orderBy: { sortOrder: 'asc' },
      });
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

    return this.prisma.playlist.delete({
      where: { id: playlistId },
    });
  }

  // ==========================================
  // SCHEDULING (LẬP LỊCH)
  // ==========================================

  async createSchedule(dto: CreateScheduleDto, userId: string) {
    if (dto.playlistId) {
      const playlist = await this.prisma.playlist.findUnique({
        where: { id: dto.playlistId },
      });
      if (!playlist) {
        throw new NotFoundException('Không tìm thấy danh sách phát để lập lịch');
      }
    } else if (dto.templateId) {
      const template = await this.prisma.template.findUnique({
        where: { id: dto.templateId },
      });
      if (!template) {
        throw new NotFoundException('Không tìm thấy bố cục để lập lịch');
      }
    } else {
      throw new BadRequestException('Vui lòng chọn Playlist hoặc Bố cục hiển thị');
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
          create: dto.deviceIds.map((deviceId) => ({
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
    // Lấy ngày chuẩn định dạng ISO YYYY-MM-DD
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
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
      orderBy: {
        priority: 'desc', // Lấy lịch phát có ưu tiên cao nhất trước
      },
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
