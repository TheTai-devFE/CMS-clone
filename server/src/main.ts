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
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : [
        'http://localhost:3001',
        'http://localhost:8081',
        'http://127.0.0.1:8081',
        'exp://localhost:8081',
      ];
  
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

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
