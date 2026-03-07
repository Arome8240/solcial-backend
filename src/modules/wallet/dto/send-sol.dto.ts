import { IsString, IsNumber, Min, IsOptional, MaxLength } from 'class-validator';

export class SendSolDto {
  @IsString()
  toAddress: string;

  @IsNumber()
  @Min(0.000001)
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  memo?: string;
}
