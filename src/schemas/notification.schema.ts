import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  recipient: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sender: Types.ObjectId;

  @Prop({ required: true, enum: ['like', 'comment', 'follow', 'tip', 'token_purchase', 'mention'] })
  type: string;

  @Prop({ type: Types.ObjectId, ref: 'Post' })
  post?: Types.ObjectId;

  @Prop()
  message: string;

  @Prop({ default: false })
  isRead: boolean;

  @Prop()
  amount?: number; // For tips and token purchases
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, isRead: 1 });
