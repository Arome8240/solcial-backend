import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PostDocument = Post & Document;

@Schema({ timestamps: true })
export class Post {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  author: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop([String])
  images: string[];

  @Prop({ default: 0 })
  likesCount: number;

  @Prop({ default: 0 })
  commentsCount: number;

  @Prop({ default: 0 })
  sharesCount: number;

  @Prop({ default: 0 })
  tipsCount: number;

  @Prop({ default: 0 })
  totalTipsAmount: number; // Total SOL received in tips

  @Prop({ default: false })
  isTokenized: boolean;

  @Prop()
  tokenMintAddress: string;

  @Prop({ default: 0 })
  tokenSupply: number;

  @Prop({ default: 0 })
  tokenPrice: number; // Current price in SOL

  @Prop({ default: 0 })
  tokenHolders: number; // Number of unique holders
}

export const PostSchema = SchemaFactory.createForClass(Post);

PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ createdAt: -1 });
