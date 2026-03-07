import { IsNumber, Min } from 'class-validator';

export class SendTipDto {
  @IsNumber()
  @Min(0.000001)
  amount: number;
}
