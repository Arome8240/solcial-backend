import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ChatsService } from './chats.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { SendTipDto } from './dto/send-tip.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Post()
  async createChat(@Request() req, @Body() createChatDto: CreateChatDto) {
    return this.chatsService.createChat(req.user.userId, createChatDto);
  }

  @Get()
  async getChats(@Request() req) {
    return this.chatsService.getChats(req.user.userId);
  }

  @Get(':id/messages')
  async getMessages(
    @Request() req,
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.chatsService.getMessages(
      id,
      req.user.userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
    );
  }

  @Post(':id/messages')
  async sendMessage(
    @Request() req,
    @Param('id') id: string,
    @Body() sendMessageDto: SendMessageDto,
  ) {
    return this.chatsService.sendMessage(id, req.user.userId, sendMessageDto);
  }

  @Post(':id/tip')
  async sendTip(@Request() req, @Param('id') id: string, @Body() sendTipDto: SendTipDto) {
    return this.chatsService.sendTip(id, req.user.userId, sendTipDto);
  }

  @Put(':id/read')
  async markAsRead(@Request() req, @Param('id') id: string) {
    return this.chatsService.markAsRead(id, req.user.userId);
  }
}
