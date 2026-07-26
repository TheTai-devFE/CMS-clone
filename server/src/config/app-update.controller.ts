import { Controller, Get, Query } from '@nestjs/common';

export interface AppVersionResponse {
  latestVersion: string;
  minSupportedVersion: string;
  apkUrl: string;
  releaseNotes: string;
  forceUpdate: boolean;
}

@Controller('api/app')
export class AppUpdateController {
  @Get('version')
  async getAppVersion(@Query('currentVersion') currentVersion?: string): Promise<AppVersionResponse> {
    const latestVersion = '1.2.0';
    const minSupportedVersion = '1.0.0';
    const apkUrl = 'http://localhost:3000/uploads/apps/cdm-signage-v1.2.0.apk';
    
    let forceUpdate = false;
    if (currentVersion && currentVersion < minSupportedVersion) {
      forceUpdate = true;
    }

    return {
      latestVersion,
      minSupportedVersion,
      apkUrl,
      releaseNotes: 'Cập nhật tính năng OTA nâng cấp tự động từ xa qua WiFi và nâng cao hiệu năng trình chiếu PDF.',
      forceUpdate,
    };
  }
}
