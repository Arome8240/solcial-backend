import { IsString, IsArray, IsOptional, MaxLength, MinLength, IsBoolean, IsNumber, Min } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  content: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsBoolean()
  isTokenized?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  tokenSupply?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  tokenPrice?: number;
}
