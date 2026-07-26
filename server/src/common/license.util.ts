import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface LicenseData {
  customerName: string;
  deviceLimit: number;
  expireAt: string; // ISO String or 'LIFETIME'
  issuedAt: string;
}

export interface LicensePayload extends LicenseData {
  signature: string;
}

export class LicenseUtil {
  // Key pair generator for RSA 2048
  static generateKeyPair() {
    return crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });
  }

  // Sign license data with RSA Private Key
  static createLicense(
    data: LicenseData,
    privateKeyPem: string,
  ): LicensePayload {
    const dataString = JSON.stringify({
      customerName: data.customerName,
      deviceLimit: data.deviceLimit,
      expireAt: data.expireAt,
      issuedAt: data.issuedAt,
    });

    const signer = crypto.createSign('SHA256');
    signer.update(dataString);
    signer.end();

    const signature = signer.sign(privateKeyPem, 'base64');

    return {
      ...data,
      signature,
    };
  }

  // Verify license payload with RSA Public Key
  static verifyLicense(
    payload: LicensePayload,
    publicKeyPem: string,
  ): { valid: boolean; reason?: string } {
    try {
      const { signature, ...data } = payload;
      const dataString = JSON.stringify({
        customerName: data.customerName,
        deviceLimit: data.deviceLimit,
        expireAt: data.expireAt,
        issuedAt: data.issuedAt,
      });

      const verifier = crypto.createVerify('SHA256');
      verifier.update(dataString);
      verifier.end();

      const isValidSignature = verifier.verify(publicKeyPem, signature, 'base64');
      if (!isValidSignature) {
        return { valid: false, reason: 'Chữ ký License Key không hợp lệ hoặc đã bị chỉnh sửa' };
      }

      // Check Expiration Date
      if (data.expireAt !== 'LIFETIME') {
        const expireDate = new Date(data.expireAt);
        if (isNaN(expireDate.getTime()) || expireDate < new Date()) {
          return { valid: false, reason: 'License Key đã hết hạn sử dụng' };
        }
      }

      return { valid: true };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return { valid: false, reason: `Lỗi kiểm tra License: ${errorMsg}` };
    }
  }
}
