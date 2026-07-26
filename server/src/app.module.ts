import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './redis/redis.module';
import { DeviceModule } from './device/device.module';
import { MediaModule } from './media/media.module';
import { PlaylistModule } from './playlist/playlist.module';
import { TemplateModule } from './template/template.module';
import { PaymentModule } from './payment/payment.module';
import { AppConfigModule } from './config/config.module';
import { LicenseModule } from './license/license.module';
import { AppUpdateController } from './config/app-update.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    RedisModule,
    DeviceModule,
    MediaModule,
    PlaylistModule,
    TemplateModule,
    PaymentModule,
    AppConfigModule,
    LicenseModule,
  ],
  controllers: [AppController, AppUpdateController],
  providers: [AppService],
})
export class AppModule {}
