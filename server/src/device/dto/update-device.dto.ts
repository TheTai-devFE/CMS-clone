import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateDeviceDto {
  @IsString()
  @IsOptional()
  deviceName?: string;

  @IsBoolean()
  @IsOptional()
  useSecurityPassword?: boolean;

  @IsBoolean()
  @IsOptional()
  sleepScheduleEnabled?: boolean;

  @IsString()
  @IsOptional()
  sleepStartTime?: string;

  @IsString()
  @IsOptional()
  sleepEndTime?: string;
}
