import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Follow, FollowDocument } from '../../schemas/follow.schema';
import { User, UserDocument } from '../../schemas/user.schema';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class FollowsService {
  constructor(
    @InjectModel(Follow.name) private followModel: Model<FollowDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private notificationsService: NotificationsService,
  ) {}

  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    const userToFollow = await this.userModel.findById(followingId);
    if (!userToFollow) {
      throw new NotFoundException('User not found');
    }

    const existingFollow = await this.followModel.findOne({
      follower: followerId,
      following: followingId,
    });

    if (existingFollow) {
      return { message: 'Already following', isFollowing: true };
    }

    await this.followModel.create({
      follower: followerId,
      following: followingId,
    });

    // Update counts
    await this.userModel.findByIdAndUpdate(followerId, { $inc: { followingCount: 1 } });
    await this.userModel.findByIdAndUpdate(followingId, { $inc: { followersCount: 1 } });

    // Send notification
    const follower = await this.userModel.findById(followerId);
    await this.notificationsService.createNotification({
      recipient: followingId,
      sender: followerId,
      type: 'follow',
      message: `${follower?.username} started following you`,
    });

    return { message: 'User followed', isFollowing: true };
  }

  async unfollowUser(followerId: string, followingId: string) {
    const follow = await this.followModel.findOneAndDelete({
      follower: followerId,
      following: followingId,
    });

    if (!follow) {
      return { message: 'Not following', isFollowing: false };
    }

    // Update counts
    await this.userModel.findByIdAndUpdate(followerId, { $inc: { followingCount: -1 } });
    await this.userModel.findByIdAndUpdate(followingId, { $inc: { followersCount: -1 } });

    return { message: 'User unfollowed', isFollowing: false };
  }

  async getFollowers(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const follows = await this.followModel
      .find({ following: userId })
      .skip(skip)
      .limit(limit)
      .populate('follower', 'username name avatar followersCount followingCount')
      .lean();

    return follows.map((follow) => ({
      ...follow.follower,
      id: (follow.follower as any)._id,
    }));
  }

  async getFollowing(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const follows = await this.followModel
      .find({ follower: userId })
      .skip(skip)
      .limit(limit)
      .populate('following', 'username name avatar followersCount followingCount')
      .lean();

    return follows.map((follow) => ({
      ...follow.following,
      id: (follow.following as any)._id,
    }));
  }

  async checkIfFollowing(followerId: string, followingId: string) {
    const follow = await this.followModel.exists({
      follower: followerId,
      following: followingId,
    });

    return { isFollowing: !!follow };
  }

  async getFollowStats(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      followersCount: user.followersCount,
      followingCount: user.followingCount,
    };
  }
}
