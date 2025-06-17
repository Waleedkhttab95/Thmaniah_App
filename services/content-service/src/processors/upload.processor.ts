import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { S3Service } from '../services/s3.service';
import { ContentService } from '../content.service';

@Processor('uploads')
export class UploadProcessor {
  private readonly logger = new Logger(UploadProcessor.name);

  constructor(
    private readonly s3Service: S3Service,
    private readonly contentService: ContentService,
  ) {}

  @Process('upload-video')
  async handleVideoUpload(job: Job<{ file: Buffer; key: string; contentId: string }>) {
    try {
      const { file, key, contentId } = job.data;
      
      await this.s3Service.uploadFile(key, file);
      
      const fileUrl = await this.s3Service.getFileUrl(key);
      
      // Update content metadata with video URL
      await this.contentService.update(contentId, {
        contentDetails: {
          videoUrl: fileUrl,
          videoKey: key,
          uploadStatus: 'completed'
        }
      });
      
      this.logger.log(`Video upload completed for content ${contentId}`);
    } catch (error) {
      this.logger.error(`Error processing video upload: ${error.message}`);
      
      // Update content metadata with error status
      await this.contentService.update(job.data.contentId, {
        contentDetails: {
          uploadStatus: 'failed',
          uploadError: error.message
        }
      });
      
      throw error;
    }
  }
} 