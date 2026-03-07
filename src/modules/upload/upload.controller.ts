import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  async uploadImage(@Body() body: { image: string }) {
    const url = await this.uploadService.uploadImage(body.image);
    return { url };
  }

  @Post('images')
  async uploadImages(@Body() body: { images: string[] }) {
    const urls = await this.uploadService.uploadMultipleImages(body.images);
    return { urls };
  }
}
