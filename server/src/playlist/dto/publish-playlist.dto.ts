import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

/**
 * Item trong publish flow: deviceId + bật/tắt cho device đó.
 */
export class PublishDeviceItemDto {
  @IsUUID('4', { message: 'deviceId phải là UUID hợp lệ' })
  deviceId: string;

  @IsBoolean({ message: 'enabled phải là boolean' })
  enabled: boolean;
}

/**
 * T5: DTO cho POST /api/playlists/:id/publish.
 * Cho phép admin/user publish playlist tới nhiều device với on/off riêng biệt.
 */
export class PublishPlaylistDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Phải chọn ít nhất 1 thiết bị' })
  @ValidateNested({ each: true })
  @Type(() => PublishDeviceItemDto)
  devices: PublishDeviceItemDto[];

  /**
   * Tên hiển thị cho Schedule sẽ tạo (optional). Nếu không truyền, dùng
   * "Publish Nhanh - {playlistName}".
   */
  @IsString()
  @IsOptional()
  scheduleName?: string;
}
