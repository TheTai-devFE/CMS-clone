import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PlaylistItemDto {
  @IsString()
  @IsNotEmpty()
  mediaId: string;

  @IsInt()
  @Min(0)
  sortOrder: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  duration?: number; // thời lượng phát (cho ảnh)

  @IsString()
  @IsOptional()
  transitionEffect?: string;
}

export class AddPlaylistItemsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlaylistItemDto)
  items: PlaylistItemDto[];
}
