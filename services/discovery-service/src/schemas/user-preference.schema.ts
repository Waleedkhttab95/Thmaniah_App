import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class UserPreference extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ type: [String], default: [] })
  favoriteCategories: string[];

  @Prop({ type: [String], default: [] })
  favoriteTags: string[];

  @Prop({ type: [String], default: [] })
  watchedContent: string[];

  @Prop({ type: Map, of: Number, default: {} })
  categoryWeights: Map<string, number>;

  @Prop({ type: Map, of: Number, default: {} })
  tagWeights: Map<string, number>;

  @Prop({ type: Date, default: Date.now })
  lastUpdated: Date;
}

export const UserPreferenceSchema = SchemaFactory.createForClass(UserPreference); 