import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Kích hoạt CORS cho frontend & app client
  app.enableCors();

  // Kích hoạt Validation tự động cho các DTO
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  // Phục vụ file tĩnh từ thư mục ./uploads
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`CMS Backend is running on: http://localhost:${port}`);
}
bootstrap();
