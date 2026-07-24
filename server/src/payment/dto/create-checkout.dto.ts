import { IsInt, IsNotEmpty, IsString, IsIn, Min } from 'class-validator';

export class CreateCheckoutDto {
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  licenseQuantity: number;

  @IsString()
  @IsIn(['rent', 'buy'])
  @IsNotEmpty()
  purchaseType: 'rent' | 'buy';
}
