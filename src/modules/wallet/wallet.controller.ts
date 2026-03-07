import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { SendSolDto } from './dto/send-sol.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('balance')
  async getBalance(@Request() req) {
    return this.walletService.getBalance(req.user.userId);
  }

  @Get('transactions')
  async getTransactions(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.walletService.getTransactions(
      req.user.userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Post('send')
  async sendSol(@Request() req, @Body() sendSolDto: SendSolDto) {
    return this.walletService.sendSol(req.user.userId, sendSolDto);
  }

  @Get('transactions/:signature')
  async getTransactionDetails(@Request() req, @Param('signature') signature: string) {
    return this.walletService.getTransactionDetails(req.user.userId, signature);
  }
}
