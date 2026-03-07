import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PostTokenDocument = PostToken & Document;

@Schema({ timestamps: true })
export class PostToken {
  @Prop({ type: Types.ObjectId, ref: 'Post', required: true, unique: true })
  post: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  creator: Types.ObjectId;

  @Prop({ required: true })
  tokenMintAddress: string;

  @Prop({ required: true })
  totalSupply: number;

  @Prop({ required: true })
  initialPrice: number; // in SOL

  @Prop({ required: true })
  currentPrice: number; // in SOL

  @Prop({ default: 0 })
  soldTokens: number;

  @Prop({ default: 0 })
  totalVolume: number; // Total SOL traded
}

export const PostTokenSchema = SchemaFactory.createForClass(PostToken);

PostTokenSchema.index({ post: 1 });
PostTokenSchema.index({ creator: 1 });
PostTokenSchema.index({ tokenMintAddress: 1 });
