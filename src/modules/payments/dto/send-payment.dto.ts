import { IsString, IsNumber, IsOptional, Min, MaxLength } from 'class-validator';

export class SendPaymentDto {
  @IsString()
  recipient: string; // username or wallet address

  @IsNumber()
  @Min(0.000001)
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  memo?: string;
}
