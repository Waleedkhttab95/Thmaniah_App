import { Injectable, NotFoundException, Inject, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Client } from '@elastic/elasticsearch';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Content } from './schemas/content.schema';
import { CreateContentDto } from './dto/create-content.dto';
import { ConfigService } from '@nestjs/config';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);
  private readonly elasticsearchClient: Client;

  constructor(
    @InjectModel(Content.name) private contentModel: Model<Content>,
    @Inject('DISCOVERY_SERVICE') private discoveryClient: ClientProxy,
    private configService: ConfigService,
  ) {
    this.elasticsearchClient = new Client({
      node: this.configService.get<string>('ELASTICSEARCH_URI', 'http://localhost:9200'),
    });
  }

  async create(createContentDto: CreateContentDto, userId: string): Promise<Content> {
    const createdContent = new this.contentModel({
      ...createContentDto,
      createdBy: userId,
      publishDate: new Date(),
    });

    const savedContent = await createdContent.save();

    // Index in Elasticsearch (non-blocking — don't fail if ES is down)
    this.indexContent(savedContent).catch(err =>
      this.logger.warn(`Failed to index content ${savedContent._id}: ${err.message}`),
    );

    // Notify discovery service (non-blocking)
    firstValueFrom(
      this.discoveryClient.emit('content_created', {
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
      }),
    ).catch(err =>
      this.logger.warn(`Failed to notify discovery service: ${err.message}`),
    );

    return savedContent;
  }

  async findAll(page = 1, limit = 20): Promise<PaginatedResult<Content>> {
    const skip = (page - 1) * limit;
    const safeLimit = Math.min(limit, 100);

    const [data, total] = await Promise.all([
      this.contentModel.find().sort({ publishDate: -1 }).skip(skip).limit(safeLimit).lean().exec(),
      this.contentModel.countDocuments(),
    ]);

    return {
      data: data as Content[],
      total,
      page,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
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
      .findByIdAndUpdate(id, { ...updateContentDto }, { new: true })
      .exec();

    if (!updatedContent) {
      throw new NotFoundException(`Content with ID ${id} not found`);
    }

    // Re-index in Elasticsearch (non-blocking)
    this.indexContent(updatedContent).catch(err =>
      this.logger.warn(`Failed to re-index content ${id}: ${err.message}`),
    );

    // Notify discovery service (non-blocking)
    firstValueFrom(
      this.discoveryClient.emit('content_updated', {
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
      }),
    ).catch(err =>
      this.logger.warn(`Failed to notify discovery service: ${err.message}`),
    );

    return updatedContent;
  }

  async delete(id: string): Promise<void> {
    const result = await this.contentModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Content with ID ${id} not found`);
    }

    // Remove from Elasticsearch (non-blocking)
    this.elasticsearchClient.delete({ index: 'content', id }).catch(err =>
      this.logger.warn(`Failed to remove content ${id} from ES: ${err.message}`),
    );
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
