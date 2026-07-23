import {
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  Min,
  Max,
} from 'class-validator';

/**
 * DTO cho admin tạo user mới.
 * Backend sẽ tự sinh password ngẫu nhiên và trả về qua response (1 lần duy nhất).
 *
 * Sau khi tạo, admin nên gửi email cho user kèm credentials.
 */
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Tên tài khoản phải có ít nhất 3 ký tự' })
  username: string;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsIn(['user', 'admin'], { message: 'Role phải là user hoặc admin' })
  @IsOptional()
  role?: string;

  @IsInt({ message: 'Hạn mức license phải là số nguyên' })
  @Min(1, { message: 'Hạn mức license tối thiểu là 1' })
  @Max(999, { message: 'Hạn mức license tối đa là 999' })
  @IsOptional()
  licenseLimit?: number;
}
