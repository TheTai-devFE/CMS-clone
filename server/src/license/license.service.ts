import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { LicenseUtil, LicensePayload } from '../common/license.util';

@Injectable()
export class LicenseService implements OnModuleInit {
  private readonly logger = new Logger(LicenseService.name);
  private currentLicense: LicensePayload | null = null;
  private isValid = false;

  // Default public key for verifying license in On-Premise mode
  private readonly defaultPublicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuW1D6i/T5q2Q+X8J0
+8w0G6cR9f1vK3bX... (Default Public Key)
-----END PUBLIC KEY-----`;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.verifySystemLicense();
  }

  verifySystemLicense() {
    const licenseFilePath =
      this.configService.get<string>('LICENSE_FILE_PATH') ||
      path.join(process.cwd(), 'license.key');

    if (!fs.existsSync(licenseFilePath)) {
      this.logger.log('SaaS Cloud Mode: Chưa phát hiện file license.key On-Premise. Chạy ở chế độ Cloud mặc định.');
      this.isValid = true; // Default SaaS Cloud Mode
      return;
    }

    try {
      const content = fs.readFileSync(licenseFilePath, 'utf8');
      const payload: LicensePayload = JSON.parse(content);

      const publicKey =
        this.configService.get<string>('RSA_PUBLIC_KEY') || this.defaultPublicKey;

      const result = LicenseUtil.verifyLicense(payload, publicKey);

      if (result.valid) {
        this.currentLicense = payload;
        this.isValid = true;
        this.logger.log(
          `On-Premise License Verified! Khách hàng: ${payload.customerName}, Hạn mức: ${payload.deviceLimit} thiết bị, Hạn dùng: ${payload.expireAt}`,
        );
      } else {
        this.isValid = false;
        this.logger.error(`Xác thực License On-Premise thất bại: ${result.reason}`);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.isValid = false;
      this.logger.error(`Lỗi đọc file license.key: ${errorMsg}`);
    }
  }

  getLicenseInfo() {
    return {
      isValid: this.isValid,
      license: this.currentLicense,
    };
  }
}
