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
    
    console.log('Cloudinary Config:', {
      cloudName: this.cloudName,
      uploadPreset: this.uploadPreset,
      url: this.cloudinaryUrl,
    });
  }

  async uploadImage(base64Image: string): Promise<string> {
    if (!this.cloudName || !this.uploadPreset) {
      console.error('Cloudinary configuration missing:', {
        cloudName: this.cloudName,
        uploadPreset: this.uploadPreset,
      });
      throw new BadRequestException('Cloudinary configuration is missing. Please set CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET in .env');
    }

    try {
      const formData = new FormData();
      formData.append('file', base64Image);
      formData.append('upload_preset', this.uploadPreset);

      console.log('Uploading to Cloudinary...');
      const response = await fetch(this.cloudinaryUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Cloudinary error response:', errorText);
        throw new BadRequestException(`Failed to upload image to Cloudinary: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Upload successful:', data.secure_url);
      return data.secure_url;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to upload image');
    }
  }

  async uploadMultipleImages(base64Images: string[]): Promise<string[]> {
    const uploadPromises = base64Images.map((image) => this.uploadImage(image));
    return Promise.all(uploadPromises);
  }
}
