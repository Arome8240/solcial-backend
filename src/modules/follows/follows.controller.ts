import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FollowsService } from './follows.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('follows')
@UseGuards(JwtAuthGuard)
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Post(':userId')
  async followUser(@Request() req, @Param('userId') userId: string) {
    return this.followsService.followUser(req.user.userId, userId);
  }

  @Delete(':userId')
  async unfollowUser(@Request() req, @Param('userId') userId: string) {
    return this.followsService.unfollowUser(req.user.userId, userId);
  }

  @Get('followers')
  async getFollowers(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.followsService.getFollowers(
      req.user.userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('followers/:userId')
  async getUserFollowers(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.followsService.getFollowers(
      userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('following')
  async getFollowing(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.followsService.getFollowing(
      req.user.userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('following/:userId')
  async getUserFollowing(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.followsService.getFollowing(
      userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('check/:userId')
  async checkIfFollowing(@Request() req, @Param('userId') userId: string) {
    return this.followsService.checkIfFollowing(req.user.userId, userId);
  }

  @Get('stats/:userId')
  async getFollowStats(@Param('userId') userId: string) {
    return this.followsService.getFollowStats(userId);
  }
}
