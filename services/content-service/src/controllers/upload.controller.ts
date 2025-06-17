import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { S3Service } from '../services/s3.service';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ContentService } from '../content.service';
@ApiTags('uploads')
@Controller('uploads')
export class UploadController {
  constructor(
    @InjectQueue('uploads') private uploadQueue: Queue,
    private readonly s3Service: S3Service,
    private readonly contentService: ContentService,
  ) {}

  @Post('video/:contentId')
  @ApiOperation({ summary: 'Upload a video for content' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadVideo(
    @Param('contentId') contentId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const key = `videos/${contentId}/${Date.now()}-${file.originalname}`;

    // Update content metadata with upload status
    await this.contentService.update(contentId, {
      contentDetails: {
        source: 'upload',
        uploadStatus: 'processing',
        videoKey: key
      },
    }
  );

    await this.uploadQueue.add(
      'upload-video',
      {
        file: file.buffer,
        key,
        contentId,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    );

    return {
      message: 'Video upload started',
      contentId,
      status: 'processing',
    };
  }

  @Post('presigned-url/:contentId')
  @ApiOperation({ summary: 'Get a presigned URL for direct upload' })
  async getPresignedUrl(@Param('contentId') contentId: string) {
    const key = `videos/${contentId}/${Date.now()}`;
    const url = await this.s3Service.generatePresignedUrl(key);

    // Update content metadata with upload status
    await this.contentService.update(contentId, {
      contentDetails: {
        source: 'upload',
        uploadStatus: 'processing',
        videoKey: key
      }
    });

    return {
      uploadUrl: url,
      key,
      contentId,
    };
  }
} 