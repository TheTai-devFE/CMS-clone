import { Body, Controller, Delete, Get, Ip, NotFoundException, Param, Post, Put, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { DeviceService } from './device.service';
import { AssignDeviceDto } from './dto/assign-device.dto';
import { HeartbeatDto } from './dto/heartbeat.dto';
import { RegisterDeviceDto } from './dto/register-device.dto';

@Controller()
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  // ==========================================
  // ENDPOINTS DÀNH CHO PLAYER (KHÔNG CẦN AUTH)
  // ==========================================

  @Post('api/player/register')
  async registerDevice(@Body() dto: RegisterDeviceDto, @Ip() ip: string) {
    // Lưu ý: Nếu chạy qua proxy (Nginx, Cloudflare), IP thật nằm ở header X-Forwarded-For
    return this.deviceService.register(dto, ip);
  }

  @Post('api/player/heartbeat')
  async heartbeat(@Body() dto: HeartbeatDto) {
    return this.deviceService.heartbeat(dto);
  }

  // ==========================================
  // ENDPOINTS DÀNH CHO USER (YÊU CẦU AUTH)
  // ==========================================

  @Get('api/devices')
  @UseGuards(JwtAuthGuard)
  async getUserDevices(@CurrentUser() user: any) {
    if (user.role === 'admin') {
      return this.deviceService.getAllDevices();
    }
    return this.deviceService.getUserDevices(user.id);
  }

  @Get('api/devices/logs')
  @UseGuards(JwtAuthGuard)
  async getSystemLogs(@CurrentUser() user: any) {
    return this.deviceService.getSystemLogs(user);
  }

  @Delete('api/devices/:id')
  @UseGuards(JwtAuthGuard)
  async deleteDevice(@Param('id') id: string, @CurrentUser() user: any) {
    // Nếu là user thường, kiểm tra xem thiết bị có thuộc quyền sở hữu không trước khi xóa
    if (user.role !== 'admin') {
      const userDevices = await this.deviceService.getUserDevices(user.id);
      const isOwner = userDevices.some((d) => d.id === id);
      if (!isOwner) {
        throw new NotFoundException('Không tìm thấy thiết bị hoặc bạn không có quyền xóa');
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
}
