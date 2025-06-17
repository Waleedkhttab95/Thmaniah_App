import { IsString, IsEnum, IsNumber, IsDate, IsArray, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ContentType {
  PODCAST = 'podcast',
  DOCUMENTARY = 'documentary',
}

export class CreateContentDto {
  @ApiProperty({ example: 'The Future of Technology', description: 'The title of the content' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'A deep dive into emerging technologies', description: 'The description of the content' })
  @IsString()
  description: string;

  @ApiProperty({ enum: ContentType, example: ContentType.PODCAST, description: 'The type of content' })
  @IsEnum(ContentType)
  type: ContentType;

  @ApiProperty({ example: 'Technology', description: 'The category of the content' })
  @IsString()
  category: string;

  @ApiProperty({ example: 'English', description: 'The language of the content' })
  @IsString()
  language: string;

  @ApiProperty({ example: 3600, description: 'The duration of the content in seconds' })
  @IsNumber()
  duration: number;

  @ApiProperty({ example: '2024-03-20T00:00:00.000Z', description: 'The publish date of the content' })
  @IsDate()
  publishDate: Date;

  @ApiProperty({
    example: {
      tags: ['technology', 'future', 'innovation'],
      thumbnail: 'https://example.com/thumbnail.jpg',
      videoUrl: 'https://example.com/video.mp4',
      source: 'YouTube',
      uploadStatus: 'completed',
      videoKey: 'videos/123/456-video.mp4',
      uploadError: null
    },
    description: 'Additional content details',
    required: false
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