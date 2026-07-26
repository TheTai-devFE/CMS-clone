import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DeviceLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSystemLogs(user: { id: string; role: string }) {
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
    if (deviceIds.length === 0) return [];

    const heartbeatLogs = await this.prisma.heartbeatLog.findMany({
      where: { deviceId: { in: deviceIds } },
      include: { device: { select: { deviceName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const playbackLogs = await this.prisma.playbackLog.findMany({
      where: { deviceId: { in: deviceIds } },
      include: {
        device: { select: { deviceName: true } },
        media: { select: { fileName: true } },
      },
      orderBy: { startedAt: 'desc' },
      take: 50,
    });

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

    formattedLogs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    return formattedLogs.slice(0, 100);
  }
}
