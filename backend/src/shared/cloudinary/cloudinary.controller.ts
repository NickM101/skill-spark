/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary.service';

const multerConfig = {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req: any, file: Express.Multer.File, cb: any) => {
    const allowedMimes = [
      // Images
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      // Videos
      'video/mp4',
      'video/avi',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-ms-wmv',
      'video/x-flv',
      'video/webm',
      'video/x-matroska',
      // PDFs
      'application/pdf',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new BadRequestException(`Unsupported file type: ${file.mimetype}`),
        false,
      );
    }
  },
};

@Controller('uploads')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const result = await this.cloudinaryService.uploadImage(
      file,
      folder || 'images',
    );

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    return {
      message: 'Image uploaded successfully',
      data: result.data,
    };
  }

  @Post('video')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const result = await this.cloudinaryService.uploadVideo(
      file,
      folder || 'videos',
    );

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    return {
      message: 'Video uploaded successfully',
      data: result.data,
    };
  }

  @Post('pdf')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadPDF(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const result = await this.cloudinaryService.uploadPDF(
      file,
      folder || 'documents',
    );

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    return {
      message: 'PDF uploaded successfully',
      data: result.data,
    };
  }

  @Delete(':publicId')
  async deleteFile(
    @Param('publicId') publicId: string,
    @Query('resourceType') resourceType: string = 'image',
  ) {
    const result = await this.cloudinaryService.deleteFile(
      publicId,
      resourceType,
    );

    if (!result) {
      throw new BadRequestException('Failed to delete file');
    }

    return {
      message: 'File deleted successfully',
      publicId,
    };
  }

  @Get('image/:publicId/optimized')
  getOptimizedImageUrl(
    @Param('publicId') publicId: string,
    @Query('width', ParseIntPipe) width?: number,
    @Query('height', ParseIntPipe) height?: number,
    @Query('quality') quality: string = 'auto',
  ) {
    const url = this.cloudinaryService.getOptimizedImageUrl(
      publicId,
      width,
      height,
      quality,
    );

    return {
      message: 'Optimized image URL generated',
      data: { url },
    };
  }

  @Get('video/:publicId/thumbnail')
  getVideoThumbnail(
    @Param('publicId') publicId: string,
    @Query('timeOffset', ParseIntPipe) timeOffset: number = 0,
  ) {
    const url = this.cloudinaryService.getVideoThumbnail(publicId, timeOffset);

    return {
      message: 'Video thumbnail URL generated',
      data: { url },
    };
  }
}
