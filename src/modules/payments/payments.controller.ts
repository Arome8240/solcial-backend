import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { SendPaymentDto } from './dto/send-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('send')
  async sendPayment(@Request() req, @Body() sendPaymentDto: SendPaymentDto) {
    return this.paymentsService.sendPayment(req.user.userId, sendPaymentDto);
  }

  @Get('history')
  async getPaymentHistory(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.paymentsService.getPaymentHistory(
      req.user.userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('qr')
  async generatePaymentQR(@Request() req, @Query('amount') amount?: string) {
    return this.paymentsService.generatePaymentQR(
      req.user.userId,
      amount ? parseFloat(amount) : undefined,
    );
  }

  @Post('request')
  async requestPayment(
    @Request() req,
    @Body('fromUsername') fromUsername: string,
    @Body('amount') amount: number,
    @Body('memo') memo?: string,
  ) {
    return this.paymentsService.requestPayment(req.user.userId, fromUsername, amount, memo);
  }
}
