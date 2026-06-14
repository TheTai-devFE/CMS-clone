import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { join } from 'path';

// Global polyfill to serialize BigInt fields automatically in JSON responses
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Kích hoạt CORS cho frontend & app client
  app.enableCors();

  // Kích hoạt Validation tự động cho các DTO
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  // Phục vụ file tĩnh từ thư mục ./uploads
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`CMS Backend is running on: http://0.0.0.0:${port} (Accessible from LAN)`);
}
bootstrap();
