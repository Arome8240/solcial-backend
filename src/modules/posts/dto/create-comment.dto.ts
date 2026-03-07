import { IsString, IsOptional, MaxLength, MinLength, IsMongoId } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  content: string;

  @IsOptional()
  @IsMongoId()
  parentCommentId?: string;
}
