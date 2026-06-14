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
import { Prisma } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { exec } from 'child_process';
import * as util from 'util';
import * as path from 'path';
import * as fs from 'fs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const execPromise = util.promisify(exec);

@Injectable()
export class PlaylistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly redis: RedisService,
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
        await this.processVideoWallSlicing(
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
        await this.processVideoWallSlicing(
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

    if (dto.deviceIds && dto.deviceIds.length > 0) {
      deviceIds = dto.deviceIds;
    } else if (dto.playlistId) {
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

    if (dto.deviceIds && dto.deviceIds.length > 0) {
      deviceIds = dto.deviceIds;
    } else if (dto.playlistId) {
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

  // ==========================================
  // HELPERS FOR VIDEO WALL AUTOMATED SLICING
  // ==========================================

  private async getVideoDimensions(
    filePath: string,
  ): Promise<{ width: number; height: number }> {
    try {
      const { stdout } = await execPromise(
        `/opt/homebrew/bin/ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "${filePath}"`,
      );
      const parts = stdout.trim().split('x');
      if (parts.length === 2) {
        const width = parseInt(parts[0], 10);
        const height = parseInt(parts[1], 10);
        if (!isNaN(width) && !isNaN(height)) {
          return { width, height };
        }
      }
      throw new Error('Định dạng kích thước video không hợp lệ');
    } catch (err) {
      console.error('[FFprobe] Lỗi khi đọc kích thước video:', err);
      return { width: 1920, height: 1080 };
    }
  }

  private async getVideoDuration(filePath: string): Promise<number> {
    try {
      const { stdout } = await execPromise(
        `/opt/homebrew/bin/ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`,
      );
      const duration = parseFloat(stdout.trim());
      if (!isNaN(duration)) {
        return Math.ceil(duration);
      }
      return 10;
    } catch (err) {
      console.error('[FFprobe] Lỗi khi đọc thời lượng video:', err);
      return 10;
    }
  }

  private async sliceVideo(
    inputPath: string,
    outputPath: string,
    width: number,
    height: number,
    x: number,
    y: number,
  ): Promise<void> {
    const cmd = `/opt/homebrew/bin/ffmpeg -y -i "${inputPath}" -vf "crop=${width}:${height}:${x}:${y}" -c:v libx264 -crf 23 -an "${outputPath}"`;
    try {
      await execPromise(cmd);
      console.log(`[FFmpeg] Cắt video thành công: ${outputPath}`);
    } catch (err: unknown) {
      console.error('[FFmpeg] Lỗi khi cắt video:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      throw new BadRequestException(
        'Không thể cắt video bằng FFmpeg: ' + errMsg,
      );
    }
  }

  private async processVideoWallSlicing(
    playlistId: string,
    sourceMediaId: string,
    rows: number,
    cols: number,
    userId: string,
  ) {
    const sourceMedia = await this.prisma.media.findUnique({
      where: { id: sourceMediaId },
    });
    if (!sourceMedia) {
      throw new NotFoundException(
        'Không tìm thấy video nguồn để ghép Video Wall',
      );
    }

    const storageType =
      this.configService.get<string>('STORAGE_TYPE') || 'local';
    const uploadDir =
      this.configService.get<string>('UPLOAD_DIR') || './uploads';

    let sourcePath = '';
    let isTempSourceDownloaded = false;

    if (storageType === 'r2') {
      const tempSourceFileName = `downloaded_source_${crypto.randomUUID()}_${path.basename(sourceMedia.fileUrl)}`;
      sourcePath = path.join(uploadDir, tempSourceFileName);

      try {
        console.log(
          `[Video Wall Slicing] Tải video nguồn từ Cloudflare R2: ${sourceMedia.fileUrl}`,
        );
        const response = await fetch(sourceMedia.fileUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        fs.writeFileSync(sourcePath, Buffer.from(arrayBuffer));
        isTempSourceDownloaded = true;
      } catch (err) {
        console.error(
          '[Video Wall Slicing] Lỗi khi tải video nguồn từ R2:',
          err,
        );
        throw new BadRequestException(
          'Không thể tải video nguồn từ Cloudflare R2 để xử lý cắt video',
        );
      }
    } else {
      const sourceFileName = path.basename(sourceMedia.fileUrl);
      sourcePath = path.join(uploadDir, sourceFileName);
      if (!fs.existsSync(sourcePath)) {
        throw new BadRequestException(
          'Tệp video nguồn không tồn tại trên hệ thống cục bộ',
        );
      }
    }

    const { width, height } = await this.getVideoDimensions(sourcePath);
    const duration = await this.getVideoDuration(sourcePath);

    const sliceWidth = Math.floor(width / cols);
    const sliceHeight = Math.floor(height / rows);

    console.log(
      `[Video Wall Slicing] Video gốc: ${width}x${height}, cắt thành Lưới ${rows}x${cols}. Kích thước ô: ${sliceWidth}x${sliceHeight}`,
    );

    const newPlaylistItems: {
      mediaId: string;
      sortOrder: number;
      duration: number;
    }[] = [];

    try {
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const slotIndex = row * cols + col + 1;
          const xOffset = col * sliceWidth;
          const yOffset = row * sliceHeight;

          const tempOutputName = `temp_${playlistId}_slot_${slotIndex}.mp4`;
          const tempOutputPath = path.join(uploadDir, tempOutputName);

          await this.sliceVideo(
            sourcePath,
            tempOutputPath,
            sliceWidth,
            sliceHeight,
            xOffset,
            yOffset,
          );

          const checksum = await this.calculateFileMd5(tempOutputPath);
          const finalFileName = `${checksum}.mp4`;
          const finalFilePath = path.join(uploadDir, finalFileName);

          let fileUrl = '';
          const fileSize = fs.statSync(tempOutputPath).size;

          if (storageType === 'r2') {
            try {
              const accessKeyId = this.configService.get<string>(
                'CLOUDFLARE_R2_ACCESS_KEY_ID',
              );
              const secretAccessKey = this.configService.get<string>(
                'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
              );
              const endpoint = this.configService.get<string>(
                'CLOUDFLARE_R2_ENDPOINT',
              );
              const r2BucketName =
                this.configService.get<string>('CLOUDFLARE_R2_BUCKET_NAME') ||
                'cms-media';
              const r2PublicUrl =
                this.configService.get<string>('CLOUDFLARE_R2_PUBLIC_URL') ||
                '';

              const s3Client = new S3Client({
                region: 'auto',
                endpoint,
                credentials: {
                  accessKeyId: accessKeyId!,
                  secretAccessKey: secretAccessKey!,
                },
              });

              // Check if media already exists in R2 or DB to avoid duplicate upload
              const existsInDb = await this.prisma.media.findFirst({
                where: { checksum },
              });

              if (!existsInDb) {
                const fileBuffer = fs.readFileSync(tempOutputPath);
                await s3Client.send(
                  new PutObjectCommand({
                    Bucket: r2BucketName,
                    Key: finalFileName,
                    Body: fileBuffer,
                    ContentType: 'video/mp4',
                  }),
                );
              }

              if (fs.existsSync(tempOutputPath)) {
                fs.unlinkSync(tempOutputPath);
              }

              const baseUrl = r2PublicUrl.endsWith('/')
                ? r2PublicUrl.slice(0, -1)
                : r2PublicUrl;
              fileUrl = `${baseUrl}/${finalFileName}`;
            } catch (r2Err) {
              console.error(
                '[Video Wall Slicing] Lỗi khi upload phần cắt lên R2:',
                r2Err,
              );
              throw new BadRequestException(
                'Không thể lưu phần cắt video lên Cloudflare R2',
              );
            }
          } else {
            if (!fs.existsSync(finalFilePath)) {
              fs.renameSync(tempOutputPath, finalFilePath);
            } else {
              fs.unlinkSync(tempOutputPath);
            }
            fileUrl = `/uploads/${finalFileName}`;
          }

          const sliceName = `Wall_${slotIndex}_${sourceMedia.fileName}`;

          let mediaRecord = await this.prisma.media.findFirst({
            where: { checksum },
          });

          if (!mediaRecord) {
            mediaRecord = await this.prisma.media.create({
              data: {
                userId,
                fileName: sliceName,
                fileUrl,
                fileSize: BigInt(fileSize),
                mimeType: 'video/mp4',
                checksum,
              },
            });
          }

          newPlaylistItems.push({
            mediaId: mediaRecord.id,
            sortOrder: slotIndex,
            duration,
          });
        }
      }
    } finally {
      // Xóa file nguồn tạm nếu đã download
      if (isTempSourceDownloaded && fs.existsSync(sourcePath)) {
        try {
          fs.unlinkSync(sourcePath);
        } catch (err) {
          console.error(
            '[Video Wall Slicing] Lỗi khi xóa file nguồn tạm:',
            err,
          );
        }
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.playlistItem.deleteMany({
        where: { playlistId },
      });

      const createData = newPlaylistItems.map((item) => ({
        id: crypto.randomUUID(),
        playlistId,
        mediaId: item.mediaId,
        sortOrder: item.sortOrder,
        duration: item.duration,
        transitionEffect: 'none',
      }));

      await tx.playlistItem.createMany({
        data: createData,
      });
    });

    console.log(
      `[Video Wall Slicing] Đã gán ${newPlaylistItems.length} ô cắt vào Playlist ID: ${playlistId}`,
    );
  }

  private calculateFileMd5(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('md5');
      const stream = fs.createReadStream(filePath);
      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', (err) => reject(err));
    });
  }
}
