import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class HeartbeatDto {
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @IsString()
  @IsNotEmpty()
  apiKey: string;

  @IsString()
  @IsOptional()
  currentMediaId?: string;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  cpuUsage?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  freeMemoryMb?: number;
}
