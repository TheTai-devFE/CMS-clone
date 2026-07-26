import { Module } from '@nestjs/common';
import { DeviceController } from './device.controller';
import { DeviceService } from './device.service';
import { DeviceBatchService } from './device-batch.service';
import { DeviceLogsService } from './device-logs.service';
import { DevicePairingService } from './device-pairing.service';

@Module({
  controllers: [DeviceController],
  providers: [
    DeviceService,
    DeviceBatchService,
    DeviceLogsService,
    DevicePairingService,
  ],
  exports: [
    DeviceService,
    DeviceBatchService,
    DeviceLogsService,
    DevicePairingService,
  ],
})
export class DeviceModule {}
