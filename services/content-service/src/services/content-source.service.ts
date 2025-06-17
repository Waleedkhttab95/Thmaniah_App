import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ContentSource, ContentSourceDocument } from '../schemas/content-source.schema';
import { CreateContentSourceDto } from '../dto/create-content-source.dto';
import { UpdateContentSourceDto } from '../dto/update-content-source.dto';

@Injectable()
export class ContentSourceService {
  constructor(
    @InjectModel(ContentSource.name)
    private contentSourceModel: Model<ContentSourceDocument>,
  ) {}

  async create(createContentSourceDto: CreateContentSourceDto): Promise<ContentSourceDocument> {
    const createdSource = new this.contentSourceModel(createContentSourceDto);
    return createdSource.save();
  }

  async findAll(): Promise<ContentSourceDocument[]> {
    return this.contentSourceModel.find().exec();
  }

  async findActive(): Promise<ContentSourceDocument[]> {
    return this.contentSourceModel.find({ isActive: true }).exec();
  }

  async findOne(id: string): Promise<ContentSourceDocument> {
    const source = await this.contentSourceModel.findById(id).exec();
    if (!source) {
      throw new NotFoundException(`Content source with ID ${id} not found`);
    }
    return source;
  }

  async findByName(name: string): Promise<ContentSourceDocument> {
    const source = await this.contentSourceModel.findOne({ name }).exec();
    if (!source) {
      throw new NotFoundException(`Content source with name ${name} not found`);
    }
    return source;
  }

  async update(id: string, updateContentSourceDto: UpdateContentSourceDto): Promise<ContentSourceDocument> {
    const updatedSource = await this.contentSourceModel
      .findByIdAndUpdate(id, updateContentSourceDto, { new: true })
      .exec();
    if (!updatedSource) {
      throw new NotFoundException(`Content source with ID ${id} not found`);
    }
    return updatedSource;
  }

  async remove(id: string): Promise<void> {
    const result = await this.contentSourceModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Content source with ID ${id} not found`);
    }
  }

  async toggleActive(id: string): Promise<ContentSourceDocument> {
    const source = await this.findOne(id);
    source.isActive = !source.isActive;
    return source.save();
  }
} 