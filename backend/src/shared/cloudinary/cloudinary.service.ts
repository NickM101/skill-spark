/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/prefer-promise-reject-errors */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse } from 'cloudinary';

export interface CloudinaryResponse {
  public_id: string;
  url: string;
  secure_url: string;
  format: string;
  resource_type: string;
  bytes: number;
  width?: number;
  height?: number;
  duration?: number;
  pages?: number;
}

export interface UploadResult {
  success: boolean;
  data?: CloudinaryResponse;
  error?: string;
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024;

  constructor(private configService: ConfigService) {
    this.initializeCloudinary();
  }

  private initializeCloudinary(): void {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      this.logger.error(
        'Cloudinary credentials are missing in environment variables',
      );
      return;
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    this.logger.log('Cloudinary service initialized successfully');
  }

  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'images',
  ): Promise<UploadResult> {
    return this.uploadFile(file, folder, 'image');
  }

  async uploadVideo(
    file: Express.Multer.File,
    folder: string = 'videos',
  ): Promise<UploadResult> {
    return this.uploadFile(file, folder, 'video');
  }

  async uploadPDF(
    file: Express.Multer.File,
    folder: string = 'documents',
  ): Promise<UploadResult> {
    return this.uploadFile(file, folder, 'raw');
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string,
    resourceType: 'image' | 'video' | 'raw',
  ): Promise<UploadResult> {
    try {
      this.validateFile(file, resourceType);

      const uploadOptions: any = {
        folder,
        resource_type: resourceType,
        max_bytes: this.MAX_FILE_SIZE,
      };

      if (resourceType === 'image') {
        uploadOptions.allowed_formats = [
          'jpg',
          'jpeg',
          'png',
          'gif',
          'webp',
          'svg',
        ];
        uploadOptions.transformation = [
          { quality: 'auto' },
          { fetch_format: 'auto' },
        ];
      } else if (resourceType === 'video') {
        uploadOptions.allowed_formats = [
          'mp4',
          'avi',
          'mov',
          'wmv',
          'flv',
          'webm',
          'mkv',
        ];
        uploadOptions.transformation = [{ quality: 'auto' }, { format: 'mp4' }];
      } else if (resourceType === 'raw') {
        uploadOptions.allowed_formats = ['pdf'];
      }

      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(uploadOptions, (error, result) => {
            if (error) {
              reject(error);
            } else if (result) {
              resolve(result);
            } else {
              reject(new Error('Upload failed - no result returned'));
            }
          })
          .end(file.buffer);
      });

      const response: CloudinaryResponse = {
        public_id: result.public_id,
        url: result.url,
        secure_url: result.secure_url,
        format: result.format,
        resource_type: result.resource_type,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
        duration: result.duration,
        pages: result.pages,
      };

      this.logger.log(`File uploaded successfully: ${result.public_id}`);
      return { success: true, data: response };
    } catch (error) {
      this.logger.error('File upload failed:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteFile(
    publicId: string,
    resourceType: string = 'image',
  ): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });

      if (result.result === 'ok') {
        this.logger.log(`File deleted successfully: ${publicId}`);
        return true;
      } else {
        this.logger.warn(`Failed to delete file: ${publicId}`);
        return false;
      }
    } catch (error) {
      this.logger.error('File deletion failed:', error);
      return false;
    }
  }

  private validateFile(
    file: Express.Multer.File,
    resourceType: 'image' | 'video' | 'raw',
  ): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > this.MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size exceeds 10MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
      );
    }

    const allowedTypes = this.getAllowedMimeTypes(resourceType);
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Expected: ${resourceType}, Got: ${file.mimetype}`,
      );
    }
  }

  private getAllowedMimeTypes(type: 'image' | 'video' | 'raw'): string[] {
    const mimeTypes = {
      image: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
      ],
      video: [
        'video/mp4',
        'video/avi',
        'video/quicktime',
        'video/x-msvideo',
        'video/x-ms-wmv',
        'video/x-flv',
        'video/webm',
        'video/x-matroska',
      ],
      raw: ['application/pdf'],
    };

    return mimeTypes[type] || [];
  }

  getOptimizedImageUrl(
    publicId: string,
    width?: number,
    height?: number,
    quality: string = 'auto',
  ): string {
    const transformations: string[] = [];

    if (width && height) {
      transformations.push(`w_${width},h_${height},c_fill`);
    } else if (width) {
      transformations.push(`w_${width}`);
    } else if (height) {
      transformations.push(`h_${height}`);
    }

    transformations.push(`q_${quality}`, 'f_auto');

    return cloudinary.url(publicId, {
      transformation: transformations,
      secure: true,
    });
  }

  getVideoThumbnail(publicId: string, timeOffset: number = 0): string {
    return cloudinary.url(publicId, {
      resource_type: 'video',
      start_offset: timeOffset,
      end_offset: timeOffset + 1,
      format: 'jpg',
      transformation: [
        { width: 300, height: 200, crop: 'fill' },
        { quality: 'auto' },
      ],
      secure: true,
    });
  }
}
