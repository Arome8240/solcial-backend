import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  async createPost(@Request() req, @Body() createPostDto: CreatePostDto) {
    return this.postsService.createPost(req.user.userId, createPostDto);
  }

  @Get('feed')
  async getFeed(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.postsService.getFeed(
      req.user.userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('user/:username')
  async getUserPosts(
    @Request() req,
    @Param('username') username: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.postsService.getUserPosts(
      username,
      req.user.userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get(':id')
  async getPost(@Request() req, @Param('id') id: string) {
    return this.postsService.getPostById(id, req.user.userId);
  }

  @Delete(':id')
  async deletePost(@Request() req, @Param('id') id: string) {
    return this.postsService.deletePost(id, req.user.userId);
  }

  @Post(':id/like')
  async likePost(@Request() req, @Param('id') id: string) {
    return this.postsService.likePost(id, req.user.userId);
  }

  @Delete(':id/like')
  async unlikePost(@Request() req, @Param('id') id: string) {
    return this.postsService.unlikePost(id, req.user.userId);
  }

  @Post(':id/comments')
  async createComment(
    @Request() req,
    @Param('id') id: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.postsService.createComment(id, req.user.userId, createCommentDto);
  }

  @Get(':id/comments')
  async getComments(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.postsService.getComments(
      id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('comments/:id/replies')
  async getReplies(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.postsService.getReplies(
      id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }
}
