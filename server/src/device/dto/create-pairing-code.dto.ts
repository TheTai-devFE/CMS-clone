import { IsOptional, IsString } from 'class-validator';

export class CreatePairingCodeDto {
  @IsString()
  @IsOptional()
  macAddress?: string;

  @IsString()
  @IsOptional()
  screenResolution?: string;

  @IsString()
  @IsOptional()
  osVersion?: string;

  @IsString()
  @IsOptional()
  appVersion?: string;
}
