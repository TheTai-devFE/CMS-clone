import {
  Body,
  Controller,
  Delete,
  Get,
  Ip,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUser as CurrentUserType } from '../auth/interfaces/current-user.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { DeviceService } from './device.service';
import { AssignDeviceDto } from './dto/assign-device.dto';
import { HeartbeatDto } from './dto/heartbeat.dto';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { CreatePairingCodeDto } from './dto/create-pairing-code.dto';
import { ClaimDeviceDto } from './dto/claim-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

export class BatchActionDto {
  deviceIds: string[];
  volume?: number;
  apkUrl?: string;
}

@Controller()
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  // ==========================================
  // ENDPOINTS DÀNH CHO PLAYER (KHÔNG CẦN AUTH)
  // ==========================================

  @Post('api/player/pairing-code')
  async generatePairingCode(@Body() dto: CreatePairingCodeDto) {
    return this.deviceService.generatePairingCode(dto);
  }

  @Get('api/player/time')
  getServerTime() {
    return { serverTime: Date.now() };
  }

  @Get('api/player/pairing-status/:tempDeviceId')
  async getPairingStatus(@Param('tempDeviceId') tempDeviceId: string) {
    return this.deviceService.getPairingStatus(tempDeviceId);
  }

  @Post('api/player/register')
  async registerDevice(@Body() dto: RegisterDeviceDto, @Ip() ip: string) {
    // Lưu ý: Nếu chạy qua proxy (Nginx, Cloudflare), IP thật nằm ở header X-Forwarded-For
    return this.deviceService.register(dto, ip);
  }

  @Post('api/player/heartbeat')
  async heartbeat(@Body() dto: HeartbeatDto, @Ip() ip: string) {
    return this.deviceService.heartbeat(dto, ip);
  }

  // ==========================================
  // ENDPOINTS DÀNH CHO USER (YÊU CẦU AUTH)
  // ==========================================

  @Post('api/devices/claim')
  @UseGuards(JwtAuthGuard)
  async claimDevice(@CurrentUser() user: CurrentUserType, @Body() dto: ClaimDeviceDto) {
    return this.deviceService.claimDevice(user.id, dto);
  }

  @Get('api/devices')
  @UseGuards(JwtAuthGuard)
  async getUserDevices(@CurrentUser() user: CurrentUserType) {
    if (user.role === 'admin') {
      return this.deviceService.getAllDevices();
    }
    return this.deviceService.getUserDevices(user.id);
  }

  @Get('api/devices/logs')
  @UseGuards(JwtAuthGuard)
  async getSystemLogs(@CurrentUser() user: CurrentUserType) {
    return this.deviceService.getSystemLogs(user);
  }

  @Put('api/devices/:id')
  @UseGuards(JwtAuthGuard)
  async updateDevice(
    @Param('id') id: string,
    @Body() dto: UpdateDeviceDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    if (user.role !== 'admin') {
      const userDevices = await this.deviceService.getUserDevices(user.id);
      const isOwner = userDevices.some((d) => d.id === id);
      if (!isOwner) {
        throw new NotFoundException(
          'Không tìm thấy thiết bị hoặc bạn không có quyền chỉnh sửa',
        );
      }
    }
    return this.deviceService.updateDevice(id, dto);
  }

  @Delete('api/devices/:id')
  @UseGuards(JwtAuthGuard)
  async deleteDevice(@Param('id') id: string, @CurrentUser() user: CurrentUserType) {
    // Nếu là user thường, kiểm tra xem thiết bị có thuộc quyền sở hữu không trước khi xóa
    if (user.role !== 'admin') {
      const userDevices = await this.deviceService.getUserDevices(user.id);
      const isOwner = userDevices.some((d) => d.id === id);
      if (!isOwner) {
        throw new NotFoundException(
          'Không tìm thấy thiết bị hoặc bạn không có quyền xóa',
        );
      }
    }
    return this.deviceService.deleteDevice(id);
  }

  // ==========================================
  // ENDPOINTS DÀNH CHO ADMIN (YÊU CẦU ADMIN AUTH)
  // ==========================================

  @Get('api/admin/devices/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getPendingDevices() {
    return this.deviceService.getPendingDevices();
  }

  @Put('api/admin/devices/:id/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async assignDevice(@Param('id') id: string, @Body() dto: AssignDeviceDto) {
    return this.deviceService.assignDevice(id, dto.userId);
  }

  // ==========================================
  // BATCH ACTIONS (YÊU CẦU AUTH)
  // ==========================================

  @Post('api/devices/batch/reboot')
  @UseGuards(JwtAuthGuard)
  async batchReboot(@CurrentUser() user: CurrentUserType, @Body() dto: BatchActionDto) {
    return this.deviceService.batchReboot(user, dto.deviceIds);
  }

  @Post('api/devices/batch/volume')
  @UseGuards(JwtAuthGuard)
  async batchVolume(@CurrentUser() user: CurrentUserType, @Body() dto: BatchActionDto) {
    return this.deviceService.batchVolume(user, dto.deviceIds, dto.volume!);
  }

  @Post('api/devices/batch/install-apk')
  @UseGuards(JwtAuthGuard)
  async batchInstallApk(@CurrentUser() user: CurrentUserType, @Body() dto: BatchActionDto) {
    return this.deviceService.batchInstallApk(user, dto.deviceIds, dto.apkUrl);
  }

  @Post('api/devices/batch/uninstall-apk')
  @UseGuards(JwtAuthGuard)
  async batchUninstallApk(@CurrentUser() user: CurrentUserType, @Body() dto: BatchActionDto) {
    return this.deviceService.batchUninstallApk(user, dto.deviceIds);
  }

  @Post('api/devices/batch/clear-content')
  @UseGuards(JwtAuthGuard)
  async batchClearContent(@CurrentUser() user: CurrentUserType, @Body() dto: BatchActionDto) {
    return this.deviceService.batchClearContent(user, dto.deviceIds);
  }
}
