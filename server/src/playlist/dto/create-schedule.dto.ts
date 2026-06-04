import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateScheduleDto {
  @IsString()
  @IsNotEmpty()
  scheduleName: string;

  @IsString()
  @IsNotEmpty()
  playlistId: string;

  @IsArray()
  @IsString({ each: true })
  deviceIds: string[];

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'startDate phải có định dạng YYYY-MM-DD' })
  startDate: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'endDate phải có định dạng YYYY-MM-DD' })
  endDate: string;

  @IsString()
  @IsOptional()
  @Matches(/^\d{2}:\d{2}:\d{2}$/, { message: 'startTime phải có định dạng HH:MM:SS' })
  startTime?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\d{2}:\d{2}:\d{2}$/, { message: 'endTime phải có định dạng HH:MM:SS' })
  endTime?: string;

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  dayOfWeek?: number[]; // Mảng thứ tự ngày: 0 = Chủ Nhật, 1 = Thứ 2...
}
