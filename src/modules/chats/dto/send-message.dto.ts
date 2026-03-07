import { IsString, IsOptional, IsNumber, IsEnum, MinLength, MaxLength, Min } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content: string;

  @IsOptional()
  @IsEnum(['text', 'payment', 'image'])
  type?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.000001)
  paymentAmount?: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
