import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum ContentType {
  PODCAST = 'podcast',
  DOCUMENTARY = 'documentary',
}

export enum ContentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

@Schema({ timestamps: true })
export class Content extends Document {
  @Prop({ required: true, index: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: String, enum: ContentType, required: true, index: true })
  type: ContentType;

  @Prop({ required: true, index: true })
  category: string;

  @Prop({ required: true, index: true })
  language: string;

  @Prop({ required: true })
  duration: number;

  @Prop({ required: true, index: true })
  publishDate: Date;

  @Prop({
    type: {
      tags: [String],
      thumbnail: String,
      videoUrl: String,
      source: String,
      uploadStatus: String,
      videoKey: String,
      uploadError: String,
    },
  })
  contentDetails: {
    tags: string[];
    thumbnail: string;
    videoUrl: string;
    source: string;
    uploadStatus?: string;
    videoKey?: string;
    uploadError?: string;
  };

  @Prop({ type: String, enum: ContentStatus, default: ContentStatus.DRAFT, index: true })
  status: ContentStatus;

  @Prop({ required: true })
  createdBy: string;

  @Prop()
  updatedBy: string;
}

export const ContentSchema = SchemaFactory.createForClass(Content);

ContentSchema.index({ category: 1, publishDate: -1 });
ContentSchema.index({ 'contentDetails.tags': 1, publishDate: -1 });
ContentSchema.index({ status: 1, publishDate: -1 });
ContentSchema.index({ language: 1, category: 1 });
ContentSchema.index({ title: 'text', description: 'text' });
