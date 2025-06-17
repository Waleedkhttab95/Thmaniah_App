import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum ContentType {
  PODCAST = 'podcast',
  DOCUMENTARY = 'documentary',
}

@Schema({ timestamps: true })
export class Content extends Document {
  @Prop({ required: true, index: true })
  contentId: string;
  
  @Prop({ required: true, index: 'text' })
  title: string;

  @Prop({ required: true, index: 'text' })
  description: string;

  @Prop({ type: String, enum: ContentType, required: true })
  type: ContentType;

  @Prop({ required: true, index: true })
  category: string;

  @Prop({ required: true, index: true })
  language: string;

  @Prop({ required: true })
  duration: number;

  @Prop({ required: true, index: true })
  publishDate: Date;

  @Prop({ type: [String], index: true })
  tags: string[];
}

export const ContentSchema = SchemaFactory.createForClass(Content);

// Create compound indexes for common query patterns
ContentSchema.index({ publishDate: -1, category: 1 });
ContentSchema.index({ category: 1, type: 1 });
ContentSchema.index({ tags: 1, publishDate: -1 });

// Create text index for title and description
ContentSchema.index({ title: 'text', description: 'text' }); 