import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateZoneDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  type: string; // 'media' | 'text' | 'clock' | 'weather' | 'web'

  @IsInt()
  x: number;

  @IsInt()
  y: number;

  @IsInt()
  width: number;

  @IsInt()
  height: number;

  @IsOptional()
  contentData?: Record<string, unknown>;
}

export class CreateTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @IsOptional()
  width?: number;

  @IsInt()
  @IsOptional()
  height?: number;

  @IsString()
  @IsOptional()
  orientation?: string; // 'landscape' | 'portrait'

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateZoneDto)
  @IsOptional()
  zones?: CreateZoneDto[];
}
