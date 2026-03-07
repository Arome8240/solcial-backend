import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ required: true })
  signature: string;

  @Prop({ required: true })
  type: string; // 'send', 'receive', 'airdrop'

  @Prop({ required: true })
  amount: number;

  @Prop()
  fromAddress: string;

  @Prop()
  toAddress: string;

  @Prop()
  status: string; // 'pending', 'confirmed', 'failed'

  @Prop()
  blockTime: Date;

  @Prop()
  fee: number;

  @Prop()
  memo: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

TransactionSchema.index({ user: 1, createdAt: -1 });
TransactionSchema.index({ signature: 1 }, { unique: true });
TransactionSchema.index({ fromAddress: 1 });
TransactionSchema.index({ toAddress: 1 });
