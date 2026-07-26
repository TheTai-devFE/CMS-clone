import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ConfigService } from './config.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUser as CurrentUserType } from '../auth/interfaces/current-user.interface';

export class UpdateConfigDto {
  brandName?: string;
  logoUrl?: string;
  splashUrl?: string;
  backgroundUrl?: string;
}

@Controller('api/config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  // Public API cho Player & Web lấy thông tin cấu hình
  @Get()
  async getConfig() {
    return this.configService.getConfig();
  }

  // Admin API cập nhật logo, splash image, background
  @UseGuards(JwtAuthGuard)
  @Post()
  async updateConfig(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: UpdateConfigDto,
  ) {
    if (user.role !== 'admin') {
      throw new Error('Chỉ Admin mới có quyền cập nhật cấu hình hệ thống');
    }
    return this.configService.updateConfig(dto);
  }
}
