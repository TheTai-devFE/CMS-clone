import * as fs from 'fs';
import * as path from 'path';
import { LicenseUtil } from '../src/common/license.util';

console.log('==================================================');
console.log('   CDM SIGNAGE ON-PREMISE LICENSE GENERATOR CLI   ');
console.log('==================================================\n');

// 1. Generate RSA Key Pair
console.log('🔑 Đang khởi tạo cặp khóa RSA 2048-bit...');
const { privateKey, publicKey } = LicenseUtil.generateKeyPair();

console.log('✅ Đã tạo cặp khóa thành công!\n');

// 2. Sample License Specs
const licenseData = {
  customerName: 'CÔNG TY TNHH SAMPLE ON-PREMISE',
  deviceLimit: 50,
  expireAt: '2027-12-31T23:59:59.000Z', // 1 Year or 'LIFETIME'
  issuedAt: new Date().toISOString(),
};

// 3. Sign License Data
const signedLicense = LicenseUtil.createLicense(licenseData, privateKey);

console.log('📄 THÔNG TIN LICENSE KEY ĐÃ TẠO:');
console.log(JSON.stringify(signedLicense, null, 2));

console.log('\n🔒 XÁC THỰC THỬ CHỮ KÝ SỐ RSA:');
const verifyResult = LicenseUtil.verifyLicense(signedLicense, publicKey);
console.log('Kết quả verify:', verifyResult);

console.log('\n✨ Bạn có thể lưu JSON trên vào file `license.key` ở thư mục gốc Server On-Premise.');
