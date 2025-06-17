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
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: String, enum: ContentType, required: true })
  type: ContentType;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  language: string;

  @Prop({ required: true })
  duration: number;

  @Prop({ required: true })
  publishDate: Date;

  @Prop({
    type: {
      tags: [String],
      thumbnail: String,
      videoUrl: String,
      source: String,
    },
  })
  contentDetails: {
    tags: string[];
    thumbnail: string;
    videoUrl: string;
    source: string;
  };

  @Prop({ type: String, enum: ContentStatus, default: ContentStatus.DRAFT })
  status: ContentStatus;

  @Prop({ required: true })
  createdBy: string;

  @Prop()
  updatedBy: string;
}

export const ContentSchema = SchemaFactory.createForClass(Content); 