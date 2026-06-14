import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import { join } from 'path';
import { AppModule } from './app.module';

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

  // Cấu hình Swagger UI (UI Test API)
  const config = new DocumentBuilder()
    .setTitle('CMS API')
    .setDescription('Tài liệu và giao diện kiểm thử các API cho hệ thống CMS')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`CMS Backend is running on: http://localhost:${port}`);
  console.log(`API Docs is available on: http://localhost:${port}/api/docs`);
}
bootstrap();
