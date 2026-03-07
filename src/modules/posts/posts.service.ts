import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from '../../schemas/post.schema';
import { Like, LikeDocument } from '../../schemas/like.schema';
import { Comment, CommentDocument } from '../../schemas/comment.schema';
import { User, UserDocument } from '../../schemas/user.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Like.name) private likeModel: Model<LikeDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async createPost(userId: string, createPostDto: CreatePostDto) {
    const post = await this.postModel.create({
      author: userId,
      content: createPostDto.content,
      images: createPostDto.images || [],
    });

    // Increment user's post count
    await this.userModel.findByIdAndUpdate(userId, { $inc: { postsCount: 1 } });

    return this.populatePost(post);
  }

  async getFeed(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const posts = await this.postModel
      .find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username name avatar')
      .lean();

    // Check if user liked each post
    const postsWithLikeStatus = await Promise.all(
      posts.map(async (post) => {
        const liked = await this.likeModel.exists({
          user: userId,
          post: post._id,
        });

        return {
          ...post,
          id: post._id,
          isLiked: !!liked,
        };
      }),
    );

    return postsWithLikeStatus;
  }

  async getPostById(postId: string, userId: string) {
    const post = await this.postModel
      .findById(postId)
      .populate('author', 'username name avatar')
      .lean();

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const liked = await this.likeModel.exists({
      user: userId,
      post: postId,
    });

    return {
      ...post,
      id: post._id,
      isLiked: !!liked,
    };
  }

  async getUserPosts(username: string, userId: string, page: number = 1, limit: number = 20) {
    const user = await this.userModel.findOne({ username });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const skip = (page - 1) * limit;

    const posts = await this.postModel
      .find({ author: user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username name avatar')
      .lean();

    const postsWithLikeStatus = await Promise.all(
      posts.map(async (post) => {
        const liked = await this.likeModel.exists({
          user: userId,
          post: post._id,
        });

        return {
          ...post,
          id: post._id,
          isLiked: !!liked,
        };
      }),
    );

    return postsWithLikeStatus;
  }

  async deletePost(postId: string, userId: string) {
    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.author.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await post.deleteOne();

    // Decrement user's post count
    await this.userModel.findByIdAndUpdate(userId, { $inc: { postsCount: -1 } });

    // Delete associated likes and comments
    await this.likeModel.deleteMany({ post: postId });
    await this.commentModel.deleteMany({ post: postId });

    return { message: 'Post deleted successfully' };
  }

  async likePost(postId: string, userId: string) {
    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const existingLike = await this.likeModel.findOne({
      user: userId,
      post: postId,
    });

    if (existingLike) {
      return { message: 'Post already liked', isLiked: true };
    }

    await this.likeModel.create({ user: userId, post: postId });
    await this.postModel.findByIdAndUpdate(postId, { $inc: { likesCount: 1 } });

    return { message: 'Post liked', isLiked: true };
  }

  async unlikePost(postId: string, userId: string) {
    const like = await this.likeModel.findOneAndDelete({
      user: userId,
      post: postId,
    });

    if (!like) {
      return { message: 'Post not liked', isLiked: false };
    }

    await this.postModel.findByIdAndUpdate(postId, { $inc: { likesCount: -1 } });

    return { message: 'Post unliked', isLiked: false };
  }

  async createComment(postId: string, userId: string, createCommentDto: CreateCommentDto) {
    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const comment = await this.commentModel.create({
      author: userId,
      post: postId,
      content: createCommentDto.content,
      parentComment: createCommentDto.parentCommentId || undefined,
    });

    // Increment post's comment count
    await this.postModel.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });

    // If it's a reply, increment parent comment's reply count
    if (createCommentDto.parentCommentId) {
      await this.commentModel.findByIdAndUpdate(
        createCommentDto.parentCommentId,
        { $inc: { repliesCount: 1 } },
      );
    }

    return this.populateComment(comment);
  }

  async getComments(postId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const comments = await this.commentModel
      .find({ post: postId, parentComment: null })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username name avatar')
      .lean();

    return comments.map((comment) => ({
      ...comment,
      id: comment._id,
    }));
  }

  async getReplies(commentId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const replies = await this.commentModel
      .find({ parentComment: commentId })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username name avatar')
      .lean();

    return replies.map((reply) => ({
      ...reply,
      id: reply._id,
    }));
  }

  private async populatePost(post: PostDocument) {
    await post.populate('author', 'username name avatar');
    return {
      ...post.toObject(),
      id: post._id,
      isLiked: false,
    };
  }

  private async populateComment(comment: CommentDocument) {
    await comment.populate('author', 'username name avatar');
    return {
      ...comment.toObject(),
      id: comment._id,
    };
  }
}
