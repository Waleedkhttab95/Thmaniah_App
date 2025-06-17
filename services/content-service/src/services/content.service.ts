import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Content } from '../schemas/content.schema';
import { CreateContentDto } from '../dto/create-content.dto';

@Injectable()
export class ContentService {
  constructor(
    @InjectModel(Content.name) private contentModel: Model<Content>,
  ) {}

  async create(createContentDto: CreateContentDto): Promise<Content> {
    const createdContent = new this.contentModel(createContentDto);
    return createdContent.save();
  }

  async findAll(): Promise<Content[]> {
    return this.contentModel.find().exec();
  }

  async findOne(id: string): Promise<Content> {
    return this.contentModel.findById(id).exec();
  }

  async update(id: string, updateContentDto: Partial<CreateContentDto>): Promise<Content> {
    if (updateContentDto.contentDetails) {
      // Merge metadata fields
      return this.contentModel
        .findByIdAndUpdate(
          id,
          { $set: Object.entries(updateContentDto.contentDetails).reduce((acc, [key, value]) => {
            acc[`metadata.${key}`] = value;
            return acc;
          }, {} as Record<string, any>) },
          { new: true }
        )
        .exec();
    }
    return this.contentModel
      .findByIdAndUpdate(id, updateContentDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<Content> {
    return this.contentModel.findByIdAndDelete(id).exec();
  }
} 