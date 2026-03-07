import { Injectable, Logger } from '@nestjs/common';
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import * as crypto from 'crypto';

@Injectable()
export class SolanaService {
  private readonly logger = new Logger(SolanaService.name);
  private connection: Connection;
  private readonly ENCRYPTION_KEY: Buffer;

  constructor() {
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    this.connection = new Connection(rpcUrl, 'confirmed');
    const encryptionKey = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    this.ENCRYPTION_KEY = Buffer.from(encryptionKey, 'hex');
    
    this.logger.log(`Connected to Solana ${process.env.SOLANA_NETWORK || 'devnet'}`);
  }

  /**
   * Generate new wallet keypair
   */
  generateWallet(): { publicKey: string; encryptedPrivateKey: string } {
    const keypair = Keypair.generate();
    const publicKey = keypair.publicKey.toString();
    const privateKey = Buffer.from(keypair.secretKey).toString('base64');
    
    // Encrypt private key before storing
    const encryptedPrivateKey = this.encrypt(privateKey);
    
    this.logger.log(`Generated new wallet: ${publicKey}`);
    return { publicKey, encryptedPrivateKey };
  }

  /**
   * Get wallet balance in SOL
   */
  async getBalance(address: string): Promise<number> {
    try {
      const publicKey = new PublicKey(address);
      const balance = await this.connection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      this.logger.error(`Failed to get balance for ${address}:`, error.message);
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  /**
   * Send SOL transaction
   */
  async sendTransaction(
    fromAddress: string,
    fromEncryptedKey: string,
    toAddress: string,
    amount: number,
    memo?: string,
  ): Promise<string> {
    try {
      // Decrypt and restore keypair
      const privateKey = this.decrypt(fromEncryptedKey);
      const secretKey = Buffer.from(privateKey, 'base64');
      const fromKeypair = Keypair.fromSecretKey(secretKey);

      // Validate recipient address
      const toPublicKey = new PublicKey(toAddress);

      // Check balance
      const balance = await this.getBalance(fromKeypair.publicKey.toString());
      if (balance < amount) {
        throw new Error('Insufficient balance');
      }

      // Create transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: fromKeypair.publicKey,
          toPubkey: toPublicKey,
          lamports: Math.floor(amount * LAMPORTS_PER_SOL),
        }),
      );

      // Send and confirm
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [fromKeypair],
        {
          commitment: 'confirmed',
        },
      );

      this.logger.log(`Transaction sent: ${signature}`);
      return signature;
    } catch (error) {
      this.logger.error('Transaction failed:', error.message);
      throw new Error(`Transaction failed: ${error.message}`);
    }
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(address: string, limit = 20) {
    try {
      const publicKey = new PublicKey(address);
      const signatures = await this.connection.getSignaturesForAddress(
        publicKey,
        { limit },
      );

      const transactions = await Promise.all(
        signatures.map(async (sig) => {
          try {
            const tx = await this.connection.getTransaction(sig.signature, {
              maxSupportedTransactionVersion: 0,
            });
            
            return {
              signature: sig.signature,
              blockTime: sig.blockTime,
              status: sig.confirmationStatus,
              slot: sig.slot,
              err: sig.err,
            };
          } catch (error) {
            this.logger.warn(`Failed to fetch transaction ${sig.signature}`);
            return null;
          }
        }),
      );

      return transactions.filter((tx) => tx !== null);
    } catch (error) {
      this.logger.error('Failed to get transaction history:', error.message);
      throw new Error(`Failed to get history: ${error.message}`);
    }
  }

  /**
   * Request airdrop (devnet/testnet only)
   */
  async requestAirdrop(address: string, amount = 1): Promise<string> {
    try {
      const publicKey = new PublicKey(address);
      
      // Check if we're on devnet/testnet
      if (process.env.SOLANA_NETWORK === 'mainnet') {
        throw new Error('Airdrops not available on mainnet');
      }

      const signature = await this.connection.requestAirdrop(
        publicKey,
        amount * LAMPORTS_PER_SOL,
      );

      // Wait for confirmation
      await this.connection.confirmTransaction(signature, 'confirmed');
      
      this.logger.log(`Airdrop successful: ${signature}`);
      return signature;
    } catch (error) {
      this.logger.error('Airdrop failed:', error.message);
      throw new Error(`Airdrop failed: ${error.message}`);
    }
  }

  /**
   * Verify transaction signature
   */
  async verifyTransaction(signature: string): Promise<boolean> {
    try {
      const tx = await this.connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0,
      });
      return tx !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Encrypt private key using AES-256-CBC
   */
  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.ENCRYPTION_KEY, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt private key
   */
  private decrypt(text: string): string {
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.ENCRYPTION_KEY, iv);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
