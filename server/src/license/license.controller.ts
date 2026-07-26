import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { LicenseService } from './license.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LicenseUtil, LicenseData } from '../common/license.util';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUser as CurrentUserType } from '../auth/interfaces/current-user.interface';

export class GenerateLicenseDto {
  customerName: string;
  deviceLimit: number;
  expireMonths: number; // 0 = LIFETIME
  privateKeyPem: string;
}

@Controller('api/license')
export class LicenseController {
  constructor(private readonly licenseService: LicenseService) {}

  @UseGuards(JwtAuthGuard)
  @Get('info')
  async getLicenseInfo(@CurrentUser() user: CurrentUserType) {
    return this.licenseService.getLicenseInfo();
  }

  // CLI / Admin Generator API
  @UseGuards(JwtAuthGuard)
  @Post('generate')
  async generateLicense(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: GenerateLicenseDto,
  ) {
    if (user.role !== 'admin') {
      throw new Error('Chỉ Admin mới có quyền cấp phát License Key');
    }

    const issuedAt = new Date().toISOString();
    let expireAt = 'LIFETIME';
    if (dto.expireMonths && dto.expireMonths > 0) {
      const d = new Date();
      d.setMonth(d.getMonth() + dto.expireMonths);
      expireAt = d.toISOString();
    }

    const data: LicenseData = {
      customerName: dto.customerName,
      deviceLimit: dto.deviceLimit,
      expireAt,
      issuedAt,
    };

    const licensePayload = LicenseUtil.createLicense(data, dto.privateKeyPem);
    return licensePayload;
  }
}
