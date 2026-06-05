import { IsNotEmpty, IsString } from 'class-validator';

export class ClaimDeviceDto {
  @IsString()
  @IsNotEmpty()
  pairingCode: string;

  @IsString()
  @IsNotEmpty()
  deviceName: string;
}
