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

  @Prop({ default: false })
  isTokenized: boolean;

  @Prop()
  tokenMintAddress: string;

  @Prop()
  tokenSupply: number;

  @Prop()
  tokenPrice: number;
}

export const PostSchema = SchemaFactory.createForClass(Post);

PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ createdAt: -1 });
