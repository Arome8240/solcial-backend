import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from '../../schemas/post.schema';
import { Like, LikeDocument } from '../../schemas/like.schema';
import { Comment, CommentDocument } from '../../schemas/comment.schema';
import { User, UserDocument } from '../../schemas/user.schema';
import { PostToken, PostTokenDocument } from '../../schemas/post-token.schema';
import { TokenHolder, TokenHolderDocument } from '../../schemas/token-holder.schema';
import { Tip, TipDocument } from '../../schemas/tip.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { SolanaService } from '../solana/solana.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Like.name) private likeModel: Model<LikeDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(PostToken.name) private postTokenModel: Model<PostTokenDocument>,
    @InjectModel(TokenHolder.name) private tokenHolderModel: Model<TokenHolderDocument>,
    @InjectModel(Tip.name) private tipModel: Model<TipDocument>,
    private notificationsService: NotificationsService,
    private solanaService: SolanaService,
  ) {}

  async createPost(userId: string, createPostDto: CreatePostDto) {
    const post = await this.postModel.create({
      author: userId,
      content: createPostDto.content,
      images: createPostDto.images || [],
      isTokenized: createPostDto.isTokenized || false,
      tokenSupply: createPostDto.tokenSupply || 0,
      tokenPrice: createPostDto.tokenPrice || 0,
    });

    // If tokenized, create token record
    if (createPostDto.isTokenized && createPostDto.tokenSupply && createPostDto.tokenPrice) {
      // Generate a mock token mint address (in production, create actual SPL token)
      const tokenMintAddress = `token_${post._id}_${Date.now()}`;
      
      await this.postTokenModel.create({
        post: post._id,
        creator: userId,
        tokenMintAddress,
        totalSupply: createPostDto.tokenSupply,
        initialPrice: createPostDto.tokenPrice,
        currentPrice: createPostDto.tokenPrice,
        soldTokens: 0,
        totalVolume: 0,
      });

      // Update post with token address
      post.tokenMintAddress = tokenMintAddress;
      await post.save();
    }

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

  async buyPostToken(postId: string, userId: string, amount: number) {
    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (!post.isTokenized) {
      throw new BadRequestException('Post is not tokenized');
    }

    const postToken = await this.postTokenModel.findOne({ post: postId });
    if (!postToken) {
      throw new NotFoundException('Post token not found');
    }

    const availableTokens = postToken.totalSupply - postToken.soldTokens;
    if (amount > availableTokens) {
      throw new BadRequestException('Not enough tokens available');
    }

    const totalCost = amount * postToken.currentPrice;

    // Get buyer and seller wallets
    const buyer = await this.userModel.findById(userId);
    const seller = await this.userModel.findById(post.author);

    if (!buyer || !seller) {
      throw new NotFoundException('User not found');
    }

    // Transfer SOL from buyer to seller
    const signature = await this.solanaService.transferSol(
      buyer.walletAddress,
      seller.walletAddress,
      totalCost,
      buyer.encryptedPrivateKey,
    );

    // Update or create token holder record
    const existingHolder = await this.tokenHolderModel.findOne({
      user: userId,
      post: postId,
    });

    if (existingHolder) {
      const newTotalAmount = existingHolder.amount + amount;
      const newTotalInvested = existingHolder.totalInvested + totalCost;
      existingHolder.amount = newTotalAmount;
      existingHolder.totalInvested = newTotalInvested;
      existingHolder.purchasePrice = newTotalInvested / newTotalAmount;
      await existingHolder.save();
    } else {
      await this.tokenHolderModel.create({
        user: userId,
        post: postId,
        tokenMintAddress: postToken.tokenMintAddress,
        amount,
        purchasePrice: postToken.currentPrice,
        totalInvested: totalCost,
      });

      // Increment token holders count
      await this.postModel.findByIdAndUpdate(postId, { $inc: { tokenHolders: 1 } });
    }

    // Update post token stats
    postToken.soldTokens += amount;
    postToken.totalVolume += totalCost;
    // Simple price increase: 1% per 10% of supply sold
    postToken.currentPrice = postToken.initialPrice * (1 + (postToken.soldTokens / postToken.totalSupply) * 0.1);
    await postToken.save();

    // Update post token price
    await this.postModel.findByIdAndUpdate(postId, {
      tokenPrice: postToken.currentPrice,
    });

    // Update buyer's portfolio
    await this.userModel.findByIdAndUpdate(userId, {
      $inc: { totalInvested: totalCost },
    });

    // Send notification to post author
    await this.notificationsService.createNotification({
      recipient: post.author.toString(),
      sender: userId,
      type: 'token_purchase',
      message: `${buyer.username} bought ${amount} tokens of your post`,
      post: postId,
      amount: totalCost,
    });

    return {
      message: 'Tokens purchased successfully',
      signature,
      amount,
      totalCost,
      newPrice: postToken.currentPrice,
    };
  }

  async tipPost(postId: string, userId: string, amount: number, message?: string) {
    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.author.toString() === userId) {
      throw new BadRequestException('Cannot tip your own post');
    }

    // Get tipper and recipient wallets
    const tipper = await this.userModel.findById(userId);
    const recipient = await this.userModel.findById(post.author);

    if (!tipper || !recipient) {
      throw new NotFoundException('User not found');
    }

    // Transfer SOL
    const signature = await this.solanaService.transferSol(
      tipper.walletAddress,
      recipient.walletAddress,
      amount,
      tipper.encryptedPrivateKey,
    );

    // Create tip record
    await this.tipModel.create({
      sender: userId,
      recipient: post.author,
      post: postId,
      amount,
      signature,
      message,
    });

    // Update post tip stats
    await this.postModel.findByIdAndUpdate(postId, {
      $inc: { tipsCount: 1, totalTipsAmount: amount },
    });

    // Send notification
    await this.notificationsService.createNotification({
      recipient: post.author.toString(),
      sender: userId,
      type: 'tip',
      message: `${tipper.username} tipped you ${amount} SOL on your post`,
      post: postId,
      amount,
    });

    return {
      message: 'Tip sent successfully',
      signature,
      amount,
    };
  }

  async getPostTips(postId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const tips = await this.tipModel
      .find({ post: postId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'username name avatar')
      .lean();

    return tips.map((tip) => ({
      ...tip,
      id: tip._id,
    }));
  }

  async getUserPortfolio(userId: string) {
    const holdings = await this.tokenHolderModel
      .find({ user: userId })
      .populate({
        path: 'post',
        populate: {
          path: 'author',
          select: 'username name avatar',
        },
      })
      .lean();

    // Calculate current portfolio value
    let totalValue = 0;
    let totalInvested = 0;

    const portfolioItems = await Promise.all(
      holdings.map(async (holding: any) => {
        const postToken = await this.postTokenModel.findOne({ post: holding.post._id });
        const currentValue = holding.amount * (postToken?.currentPrice || 0);
        totalValue += currentValue;
        totalInvested += holding.totalInvested;

        return {
          id: holding._id,
          post: holding.post,
          amount: holding.amount,
          purchasePrice: holding.purchasePrice,
          currentPrice: postToken?.currentPrice || 0,
          totalInvested: holding.totalInvested,
          currentValue,
          profitLoss: currentValue - holding.totalInvested,
          profitLossPercentage: ((currentValue - holding.totalInvested) / holding.totalInvested) * 100,
        };
      }),
    );

    // Update user's portfolio value
    await this.userModel.findByIdAndUpdate(userId, {
      portfolioValue: totalValue,
    });

    return {
      totalValue,
      totalInvested,
      totalProfitLoss: totalValue - totalInvested,
      totalProfitLossPercentage: totalInvested > 0 ? ((totalValue - totalInvested) / totalInvested) * 100 : 0,
      holdings: portfolioItems,
    };
  }
}
