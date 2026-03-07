import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TipDocument = Tip & Document;

@Schema({ timestamps: true })
export class Tip {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sender: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  recipient: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Post', required: true })
  post: Types.ObjectId;

  @Prop({ required: true })
  amount: number; // in SOL

  @Prop({ required: true })
  signature: string; // Transaction signature

  @Prop()
  message?: string;
}

export const TipSchema = SchemaFactory.createForClass(Tip);

TipSchema.index({ sender: 1, createdAt: -1 });
TipSchema.index({ recipient: 1, createdAt: -1 });
TipSchema.index({ post: 1 });
