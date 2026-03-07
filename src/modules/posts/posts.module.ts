import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { Post, PostSchema } from '../../schemas/post.schema';
import { Like, LikeSchema } from '../../schemas/like.schema';
import { Comment, CommentSchema } from '../../schemas/comment.schema';
import { User, UserSchema } from '../../schemas/user.schema';
import { PostToken, PostTokenSchema } from '../../schemas/post-token.schema';
import { TokenHolder, TokenHolderSchema } from '../../schemas/token-holder.schema';
import { Tip, TipSchema } from '../../schemas/tip.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { SolanaModule } from '../solana/solana.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: Like.name, schema: LikeSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: User.name, schema: UserSchema },
      { name: PostToken.name, schema: PostTokenSchema },
      { name: TokenHolder.name, schema: TokenHolderSchema },
      { name: Tip.name, schema: TipSchema },
    ]),
    NotificationsModule,
    SolanaModule,
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
