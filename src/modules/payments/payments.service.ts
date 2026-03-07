import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PublicKey } from '@solana/web3.js';
import { User, UserDocument } from '../../schemas/user.schema';
import { Transaction, TransactionDocument } from '../../schemas/transaction.schema';
import { SolanaService } from '../solana/solana.service';
import { SendPaymentDto } from './dto/send-payment.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    private solanaService: SolanaService,
  ) {}

  async sendPayment(userId: string, sendPaymentDto: SendPaymentDto) {
    const sender = await this.userModel.findById(userId);
    if (!sender) {
      throw new NotFoundException('Sender not found');
    }

    let recipientAddress: string;

    // Check if recipient is username or wallet address
    if (sendPaymentDto.recipient.length < 32) {
      // Likely a username
      const recipient = await this.userModel.findOne({ username: sendPaymentDto.recipient });
      if (!recipient) {
        throw new NotFoundException('Recipient not found');
      }
      recipientAddress = recipient.walletAddress;
    } else {
      // Likely a wallet address
      try {
        new PublicKey(sendPaymentDto.recipient);
        recipientAddress = sendPaymentDto.recipient;
      } catch {
        throw new BadRequestException('Invalid wallet address');
      }
    }

    try {
      // Send transaction
      const signature = await this.solanaService.sendTransaction(
        sender.walletAddress,
        sender.encryptedPrivateKey,
        recipientAddress,
        sendPaymentDto.amount,
        sendPaymentDto.memo,
      );

      // Save transaction record
      await this.transactionModel.create({
        user: userId,
        signature,
        type: 'send',
        amount: sendPaymentDto.amount,
        fromAddress: sender.walletAddress,
        toAddress: recipientAddress,
        status: 'confirmed',
        memo: sendPaymentDto.memo,
      });

      return {
        signature,
        amount: sendPaymentDto.amount,
        toAddress: recipientAddress,
        status: 'confirmed',
      };
    } catch (error) {
      this.logger.error(`Payment failed: ${error.message}`);
      throw new BadRequestException(error.message || 'Payment failed');
    }
  }

  async getPaymentHistory(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const transactions = await this.transactionModel
      .find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return transactions.map((tx) => ({
      ...tx,
      id: tx._id,
    }));
  }

  async generatePaymentQR(userId: string, amount?: number) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate payment request data
    const paymentData = {
      address: user.walletAddress,
      amount: amount || null,
      label: `@${user.username}`,
      message: `Payment to @${user.username}`,
    };

    return paymentData;
  }

  async requestPayment(userId: string, fromUsername: string, amount: number, memo?: string) {
    const requester = await this.userModel.findById(userId);
    if (!requester) {
      throw new NotFoundException('User not found');
    }

    const payer = await this.userModel.findOne({ username: fromUsername });
    if (!payer) {
      throw new NotFoundException('Payer not found');
    }

    // In a real app, this would create a payment request notification
    // For now, just return the request details
    return {
      requester: {
        username: requester.username,
        name: requester.name,
        avatar: requester.avatar,
        walletAddress: requester.walletAddress,
      },
      payer: {
        username: payer.username,
        name: payer.name,
        avatar: payer.avatar,
      },
      amount,
      memo,
      status: 'pending',
    };
  }
}
