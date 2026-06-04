import { IsNotEmpty, IsString } from 'class-validator';

export class AssignDeviceDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}
