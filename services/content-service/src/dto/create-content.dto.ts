import { IsString, IsEnum, IsNumber, IsDate, IsArray, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ContentType } from '../schemas/content.schema';

export class CreateContentDto {
  @ApiProperty({ example: 'The Future of Technology' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'A deep dive into emerging technologies' })
  @IsString()
  description: string;

  @ApiProperty({ enum: ContentType, example: ContentType.PODCAST })
  @IsEnum(ContentType)
  type: ContentType;

  @ApiProperty({ example: 'Technology' })
  @IsString()
  category: string;

  @ApiProperty({ example: 'English' })
  @IsString()
  language: string;

  @ApiProperty({ example: 3600 })
  @IsNumber()
  duration: number;



  @ApiProperty({
    example: {
      tags: ['technology', 'future', 'innovation'],
      thumbnail: 'https://example.com/thumbnail.jpg',
      videoUrl: 'https://example.com/video.mp4',
      source: 'YouTube',
      uploadStatus: 'completed',
      videoKey: 'videos/123/456-video.mp4',
      uploadError: null
    }
  })
  @IsOptional()
  contentDetails?: Partial<{
    tags: string[];
    thumbnail: string;
    videoUrl: string;
    source: string;
    uploadStatus?: 'pending' | 'processing' | 'completed' | 'failed';
    videoKey?: string;
    uploadError?: string;
  }>;
} 