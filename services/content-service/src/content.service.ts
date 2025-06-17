import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Client } from '@elastic/elasticsearch';
import { ClientProxy } from '@nestjs/microservices';
import { Content } from './schemas/content.schema';
import { CreateContentDto } from './dto/create-content.dto';

@Injectable()
export class ContentService {
  private readonly elasticsearchClient: Client;

  constructor(
    @InjectModel(Content.name) private contentModel: Model<Content>,
    @Inject('DISCOVERY_SERVICE') private discoveryClient: ClientProxy,
  ) {
    this.elasticsearchClient = new Client({
      node: process.env.ELASTICSEARCH_URI || 'http://localhost:9200',
    });
  }

  async create(createContentDto: CreateContentDto, userId: string): Promise<Content> {
    const createdContent = new this.contentModel({
      ...createContentDto,
      createdBy: userId,
      publishDate: new Date(createContentDto.publishDate)
    });

    const savedContent = await createdContent.save();
    await this.indexContent(savedContent);

    // Send message to discovery service
    await this.discoveryClient.emit('content_created', {
      contentId: savedContent._id.toString(),
      title: savedContent.title,
      description: savedContent.description,
      type: savedContent.type,
      category: savedContent.category,
      language: savedContent.language,
      duration: savedContent.duration,
      publishDate: savedContent.publishDate,
      tags: savedContent.contentDetails?.tags || [],
      status: savedContent.status,
    }).toPromise();

    return savedContent;
  }

  async findAll(): Promise<Content[]> {
    return this.contentModel.find().exec();
  }

  async findOne(id: string): Promise<Content> {
    const content = await this.contentModel.findById(id).exec();
    if (!content) {
      throw new NotFoundException(`Content with ID ${id} not found`);
    }
    return content;
  }

  async update(id: string, updateContentDto: Partial<CreateContentDto>): Promise<Content> {
    const updatedContent = await this.contentModel
      .findByIdAndUpdate(
        id,
        { ...updateContentDto},
        { new: true },
      )
      .exec();

    if (!updatedContent) {
      throw new NotFoundException(`Content with ID ${id} not found`);
    }

    await this.indexContent(updatedContent);

    // Send message to discovery service
    await this.discoveryClient.emit('content_updated', {
      contentId: updatedContent._id.toString(),
      title: updatedContent.title,
      description: updatedContent.description,
      type: updatedContent.type,
      category: updatedContent.category,
      language: updatedContent.language,
      duration: updatedContent.duration,
      publishDate: updatedContent.publishDate,
      tags: updatedContent.contentDetails?.tags || [],
      status: updatedContent.status,
    }).toPromise();

    return updatedContent;
  }

  async delete(id: string): Promise<void> {
    const result = await this.contentModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Content with ID ${id} not found`);
    }
    await this.elasticsearchClient.delete({
      index: 'content',
      id,
    });
  }

  private async indexContent(content: Content): Promise<void> {
    await this.elasticsearchClient.index({
      index: 'content',
      id: content._id.toString(),
      document: {
        title: content.title,
        description: content.description,
        type: content.type,
        category: content.category,
        language: content.language,
        tags: content.contentDetails?.tags || [],
        status: content.status,
        publishDate: content.publishDate,
      },
    });
  }

  async search(query: string): Promise<Content[]> {
    const { hits } = await this.elasticsearchClient.search({
      index: 'content',
      query: {
        multi_match: {
          query,
          fields: ['title^2', 'description', 'category', 'tags'],
        },
      },
    });

    const contentIds = hits.hits.map(hit => hit._id);
    return this.contentModel.find({ _id: { $in: contentIds } }).exec();
  }
} 