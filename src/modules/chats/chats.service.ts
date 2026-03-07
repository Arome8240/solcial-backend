import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Chat, ChatDocument } from '../../schemas/chat.schema';
import { Message, MessageDocument } from '../../schemas/message.schema';
import { User, UserDocument } from '../../schemas/user.schema';
import { SolanaService } from '../solana/solana.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { SendTipDto } from './dto/send-tip.dto';

@Injectable()
export class ChatsService {
  constructor(
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private solanaService: SolanaService,
  ) {}

  async createChat(userId: string, createChatDto: CreateChatDto) {
    const { participantId } = createChatDto;

    if (userId === participantId) {
      throw new BadRequestException('Cannot create chat with yourself');
    }

    const participant = await this.userModel.findById(participantId);
    if (!participant) {
      throw new NotFoundException('User not found');
    }

    // Check if chat already exists
    const existingChat = await this.chatModel.findOne({
      participants: { $all: [userId, participantId] },
    });

    if (existingChat) {
      return this.populateChat(existingChat);
    }

    // Create new chat
    const chat = await this.chatModel.create({
      participants: [userId, participantId],
    });

    return this.populateChat(chat);
  }

  async getChats(userId: string) {
    const chats = await this.chatModel
      .find({ participants: userId })
      .sort({ lastMessageAt: -1 })
      .populate('participants', 'username name avatar')
      .populate('lastMessageBy', 'username name')
      .lean();

    return chats.map((chat) => ({
      ...chat,
      id: chat._id,
      // Filter out current user from participants
      otherParticipant: (chat.participants as any[]).find(
        (p: any) => p._id.toString() !== userId,
      ),
    }));
  }

  async getMessages(chatId: string, userId: string, page: number = 1, limit: number = 50) {
    const chat = await this.chatModel.findById(chatId);
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    // Verify user is participant
    const isParticipant = chat.participants.some((p) => p.toString() === userId);
    if (!isParticipant) {
      throw new BadRequestException('You are not a participant in this chat');
    }

    const skip = (page - 1) * limit;

    const messages = await this.messageModel
      .find({ chat: chatId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'username name avatar')
      .lean();

    return messages.reverse().map((message) => ({
      ...message,
      id: message._id,
      isMine: message.sender && (message.sender as any)._id.toString() === userId,
    }));
  }

  async sendMessage(chatId: string, userId: string, sendMessageDto: SendMessageDto) {
    const chat = await this.chatModel.findById(chatId);
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    // Verify user is participant
    const isParticipant = chat.participants.some((p) => p.toString() === userId);
    if (!isParticipant) {
      throw new BadRequestException('You are not a participant in this chat');
    }

    const message = await this.messageModel.create({
      chat: chatId,
      sender: userId,
      content: sendMessageDto.content,
      type: sendMessageDto.type || 'text',
      paymentAmount: sendMessageDto.paymentAmount,
      imageUrl: sendMessageDto.imageUrl,
    });

    // Update chat's last message
    await this.chatModel.findByIdAndUpdate(chatId, {
      lastMessage: sendMessageDto.content,
      lastMessageAt: new Date(),
      lastMessageBy: userId,
    });

    await message.populate('sender', 'username name avatar');

    return {
      ...message.toObject(),
      id: message._id,
      isMine: true,
    };
  }

  async sendTip(chatId: string, userId: string, sendTipDto: SendTipDto) {
    const chat = await this.chatModel.findById(chatId).populate('participants');
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    // Verify user is participant
    const isParticipant = chat.participants.some((p: any) => p._id.toString() === userId);
    if (!isParticipant) {
      throw new BadRequestException('You are not a participant in this chat');
    }

    // Get sender and recipient
    const sender = await this.userModel.findById(userId);
    const recipient = (chat.participants as any[]).find(
      (p: any) => p._id.toString() !== userId,
    );

    if (!sender || !recipient) {
      throw new BadRequestException('Invalid participants');
    }

    // Send SOL transaction
    try {
      const signature = await this.solanaService.sendTransaction(
        sender.walletAddress,
        sender.encryptedPrivateKey,
        recipient.walletAddress,
        sendTipDto.amount,
        'Tip via Solcial',
      );

      // Create payment message
      const message = await this.messageModel.create({
        chat: chatId,
        sender: userId,
        content: `Sent ${sendTipDto.amount} SOL`,
        type: 'payment',
        paymentAmount: sendTipDto.amount,
        paymentSignature: signature,
      });

      // Update chat's last message
      await this.chatModel.findByIdAndUpdate(chatId, {
        lastMessage: `Sent ${sendTipDto.amount} SOL`,
        lastMessageAt: new Date(),
        lastMessageBy: userId,
      });

      await message.populate('sender', 'username name avatar');

      return {
        ...message.toObject(),
        id: message._id,
        isMine: true,
        signature,
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to send tip');
    }
  }

  async markAsRead(chatId: string, userId: string) {
    const chat = await this.chatModel.findById(chatId);
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    // Verify user is participant
    const isParticipant = chat.participants.some((p) => p.toString() === userId);
    if (!isParticipant) {
      throw new BadRequestException('You are not a participant in this chat');
    }

    // Mark all messages from other participants as read
    await this.messageModel.updateMany(
      {
        chat: chatId,
        sender: { $ne: userId },
        isRead: false,
      },
      { isRead: true },
    );

    return { message: 'Messages marked as read' };
  }

  private async populateChat(chat: ChatDocument) {
    await chat.populate('participants', 'username name avatar');
    return {
      ...chat.toObject(),
      id: chat._id,
    };
  }
}
