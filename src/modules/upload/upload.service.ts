import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UploadService {
  private cloudinaryUrl: string;
  private cloudName: string;
  private uploadPreset: string;

  constructor(private configService: ConfigService) {
    this.cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME') || '';
    this.uploadPreset = this.configService.get<string>('CLOUDINARY_UPLOAD_PRESET') || '';
    this.cloudinaryUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;
  }

  async uploadImage(base64Image: string): Promise<string> {
    if (!this.cloudName || !this.uploadPreset) {
      throw new BadRequestException('Cloudinary configuration is missing');
    }

    try {
      const formData = new FormData();
      formData.append('file', base64Image);
      formData.append('upload_preset', this.uploadPreset);

      const response = await fetch(this.cloudinaryUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new BadRequestException('Failed to upload image to Cloudinary');
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new BadRequestException('Failed to upload image');
    }
  }

  async uploadMultipleImages(base64Images: string[]): Promise<string[]> {
    const uploadPromises = base64Images.map((image) => this.uploadImage(image));
    return Promise.all(uploadPromises);
  }
}
