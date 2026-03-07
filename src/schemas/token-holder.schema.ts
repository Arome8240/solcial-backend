import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TokenHolderDocument = TokenHolder & Document;

@Schema({ timestamps: true })
export class TokenHolder {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Post', required: true })
  post: Types.ObjectId;

  @Prop({ required: true })
  tokenMintAddress: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  purchasePrice: number; // Average purchase price in SOL

  @Prop({ required: true })
  totalInvested: number; // Total SOL invested
}

export const TokenHolderSchema = SchemaFactory.createForClass(TokenHolder);

TokenHolderSchema.index({ user: 1, post: 1 }, { unique: true });
TokenHolderSchema.index({ user: 1 });
TokenHolderSchema.index({ post: 1 });
