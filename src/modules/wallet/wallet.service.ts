import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Connection, PublicKey, LAMPORTS_PER_SOL, ParsedTransactionWithMeta } from '@solana/web3.js';
import { User, UserDocument } from '../../schemas/user.schema';
import { Transaction, TransactionDocument } from '../../schemas/transaction.schema';
import { SolanaService } from '../solana/solana.service';
import { SendSolDto } from './dto/send-sol.dto';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);
  private connection: Connection;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    private solanaService: SolanaService,
  ) {
    this.connection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
      'confirmed',
    );
  }

  async getBalance(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    try {
      const publicKey = new PublicKey(user.walletAddress);
      const balance = await this.connection.getBalance(publicKey);
      const solBalance = balance / LAMPORTS_PER_SOL;

      return {
        walletAddress: user.walletAddress,
        balance: solBalance,
        balanceLamports: balance,
      };
    } catch (error) {
      this.logger.error(`Failed to get balance: ${error.message}`);
      throw new BadRequestException('Failed to get balance');
    }
  }

  async getTransactions(userId: string, page: number = 1, limit: number = 20) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    try {
      const publicKey = new PublicKey(user.walletAddress);
      
      // Get signatures from Solana
      const signatures = await this.connection.getSignaturesForAddress(publicKey, {
        limit: limit * page,
      });

      // Paginate
      const start = (page - 1) * limit;
      const paginatedSignatures = signatures.slice(start, start + limit);

      // Get transaction details
      const transactions = await Promise.all(
        paginatedSignatures.map(async (sig) => {
          try {
            const tx = await this.connection.getParsedTransaction(sig.signature, {
              maxSupportedTransactionVersion: 0,
            });

            return this.parseTransaction(tx, user.walletAddress, sig.signature);
          } catch (error) {
            this.logger.warn(`Failed to parse transaction ${sig.signature}: ${error.message}`);
            return null;
          }
        }),
      );

      return transactions.filter((tx) => tx !== null);
    } catch (error) {
      this.logger.error(`Failed to get transactions: ${error.message}`);
      throw new BadRequestException('Failed to get transactions');
    }
  }

  async sendSol(userId: string, sendSolDto: SendSolDto) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    try {
      // Validate recipient address
      let toPublicKey: PublicKey;
      try {
        toPublicKey = new PublicKey(sendSolDto.toAddress);
      } catch {
        throw new BadRequestException('Invalid recipient address');
      }

      // Send transaction
      const signature = await this.solanaService.sendTransaction(
        user.walletAddress,
        user.encryptedPrivateKey,
        sendSolDto.toAddress,
        sendSolDto.amount,
        sendSolDto.memo,
      );

      // Save transaction record
      await this.transactionModel.create({
        user: userId,
        signature,
        type: 'send',
        amount: sendSolDto.amount,
        fromAddress: user.walletAddress,
        toAddress: sendSolDto.toAddress,
        status: 'confirmed',
        memo: sendSolDto.memo,
      });

      return {
        signature,
        amount: sendSolDto.amount,
        toAddress: sendSolDto.toAddress,
        status: 'confirmed',
      };
    } catch (error) {
      this.logger.error(`Failed to send SOL: ${error.message}`);
      throw new BadRequestException(error.message || 'Failed to send SOL');
    }
  }

  async getTransactionDetails(userId: string, signature: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    try {
      const tx = await this.connection.getParsedTransaction(signature, {
        maxSupportedTransactionVersion: 0,
      });

      if (!tx) {
        throw new BadRequestException('Transaction not found');
      }

      return this.parseTransaction(tx, user.walletAddress, signature);
    } catch (error) {
      this.logger.error(`Failed to get transaction details: ${error.message}`);
      throw new BadRequestException('Failed to get transaction details');
    }
  }

  private parseTransaction(
    tx: ParsedTransactionWithMeta | null,
    userWalletAddress: string,
    signature: string,
  ) {
    if (!tx || !tx.meta) {
      return null;
    }

    const accountKeys = tx.transaction.message.accountKeys;
    const preBalances = tx.meta.preBalances;
    const postBalances = tx.meta.postBalances;

    // Find user's account index
    const userAccountIndex = accountKeys.findIndex(
      (key) => key.pubkey.toString() === userWalletAddress,
    );

    if (userAccountIndex === -1) {
      return null;
    }

    const preBalance = preBalances[userAccountIndex];
    const postBalance = postBalances[userAccountIndex];
    const balanceChange = postBalance - preBalance;

    // Determine transaction type
    let type: string;
    let amount: number;
    let fromAddress: string | undefined;
    let toAddress: string | undefined;

    if (balanceChange > 0) {
      type = 'receive';
      amount = balanceChange / LAMPORTS_PER_SOL;
      fromAddress = accountKeys[0]?.pubkey.toString();
      toAddress = userWalletAddress;
    } else {
      type = 'send';
      amount = Math.abs(balanceChange) / LAMPORTS_PER_SOL;
      fromAddress = userWalletAddress;
      // Find recipient (usually the second account)
      toAddress = accountKeys[1]?.pubkey.toString();
    }

    return {
      signature,
      type,
      amount,
      fromAddress,
      toAddress,
      status: tx.meta.err ? 'failed' : 'confirmed',
      blockTime: tx.blockTime ? new Date(tx.blockTime * 1000) : null,
      fee: (tx.meta.fee || 0) / LAMPORTS_PER_SOL,
      slot: tx.slot,
    };
  }
}
