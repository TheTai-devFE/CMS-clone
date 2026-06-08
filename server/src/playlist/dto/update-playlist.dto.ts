import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdatePlaylistDto {
  @IsString()
  @IsOptional()
  playlistName?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isSyncGroup?: boolean;

  @IsOptional()
  syncLayout?: any;
}
