import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ContentSourceDocument = ContentSource & Document;

@Schema({ timestamps: true })
export class ContentSource {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const ContentSourceSchema = SchemaFactory.createForClass(ContentSource); 