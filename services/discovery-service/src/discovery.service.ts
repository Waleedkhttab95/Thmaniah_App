import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Client } from '@elastic/elasticsearch';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { Category } from './schemas/category.schema';
import { UserPreference } from './schemas/user-preference.schema';
import { Content } from './schemas/content.schema';

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Injectable()
export class DiscoveryService {
  private readonly logger = new Logger(DiscoveryService.name);
  private readonly elasticsearchClient: Client;
  private readonly CACHE_TTL = 300;

  // Track cache keys by prefix for proper invalidation
  private cacheKeys = new Set<string>();

  constructor(
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(UserPreference.name) private userPreferenceModel: Model<UserPreference>,
    @InjectModel(Content.name) private contentModel: Model<Content>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) {
    this.elasticsearchClient = new Client({
      node: this.configService.get<string>('ELASTICSEARCH_URI', 'http://localhost:9200'),
      maxRetries: 3,
      requestTimeout: 30000,
    });
  }

  async handleContentCreated(data: any): Promise<void> {
    try {
      const content = new this.contentModel({
        contentId: data.contentId,
        title: data.title,
        description: data.description,
        type: data.type,
        category: data.category,
        language: data.language,
        duration: data.duration,
        publishDate: data.publishDate,
        tags: data.tags,
      });
      await content.save();
      await this.invalidateCacheByPrefix('trending');
      await this.invalidateCacheByPrefix('recommendations');
      this.logger.log(`Content created in discovery: ${data.contentId}`);
    } catch (error) {
      this.logger.error(`Failed to handle content_created: ${error.message}`);
    }
  }

  async handleContentUpdated(data: any): Promise<void> {
    try {
      await this.contentModel.findOneAndUpdate(
        { contentId: data.contentId },
        {
          title: data.title,
          description: data.description,
          type: data.type,
          category: data.category,
          language: data.language,
          duration: data.duration,
          publishDate: data.publishDate,
          tags: data.tags,
        },
        { new: true },
      );
      await this.invalidateCacheByPrefix('trending');
      await this.invalidateCacheByPrefix('recommendations');
      this.logger.log(`Content updated in discovery: ${data.contentId}`);
    } catch (error) {
      this.logger.error(`Failed to handle content_updated: ${error.message}`);
    }
  }

  async getCategories(): Promise<Category[]> {
    const cacheKey = 'all_categories';
    const cached = await this.cacheManager.get<Category[]>(cacheKey);
    if (cached) return cached;

    const categories = await this.categoryModel.find({ isActive: true }).exec();
    await this.setCacheWithTracking(cacheKey, categories);
    return categories;
  }

  async getTrendingContent(limit = 10): Promise<any[]> {
    const safeLimit = Math.min(limit, 50);
    const cacheKey = `trending_${safeLimit}`;
    const cached = await this.cacheManager.get<any[]>(cacheKey);
    if (cached) return cached;

    try {
      const { hits } = await this.elasticsearchClient.search({
        index: 'content',
        size: safeLimit,
        sort: [
          { publishDate: { order: 'desc' } },
          { _score: { order: 'desc' } },
        ],
        query: {
          bool: {
            must: [{ term: { status: 'published' } }],
          },
        },
      });

      const results = hits.hits.map(hit => hit._source);
      await this.setCacheWithTracking(cacheKey, results);
      return results;
    } catch (error) {
      this.logger.error(`Elasticsearch trending query failed: ${error.message}`);
      // Fallback to MongoDB
      const content = await this.contentModel
        .find()
        .sort({ publishDate: -1 })
        .limit(safeLimit)
        .lean()
        .exec();
      return content;
    }
  }

  async getRecommendations(userId: string, limit = 10): Promise<any[]> {
    const safeLimit = Math.min(limit, 50);
    const cacheKey = `recommendations_${userId}_${safeLimit}`;
    const cached = await this.cacheManager.get<any[]>(cacheKey);
    if (cached) return cached;

    const userPreference = await this.userPreferenceModel.findOne({ userId });
    if (!userPreference) {
      return this.getTrendingContent(safeLimit);
    }

    try {
      const { hits } = await this.elasticsearchClient.search({
        index: 'content',
        size: safeLimit,
        query: {
          bool: {
            must: [{ term: { status: 'published' } }],
            should: [
              { terms: { category: userPreference.favoriteCategories } },
              { terms: { tags: userPreference.favoriteTags } },
            ],
            must_not: [
              { terms: { _id: userPreference.watchedContent } },
            ],
          },
        },
      });

      const results = hits.hits.map(hit => hit._source);
      await this.setCacheWithTracking(cacheKey, results);
      return results;
    } catch (error) {
      this.logger.error(`Elasticsearch recommendations query failed: ${error.message}`);
      return this.getTrendingContent(safeLimit);
    }
  }

  async search(query: { keywords: string; category?: string; tags?: string[] }): Promise<any[]> {
    const cacheKey = `search_${Buffer.from(JSON.stringify(query)).toString('base64')}`;
    const cached = await this.cacheManager.get<any[]>(cacheKey);
    if (cached) return cached;

    try {
      const boolQuery: any = {
        must: [
          { term: { status: 'published' } },
          {
            multi_match: {
              query: query.keywords,
              fields: ['title^3', 'description^2', 'tags'],
              fuzziness: 'AUTO',
            },
          },
        ],
      };

      if (query.category) {
        boolQuery.filter = [{ term: { category: query.category } }];
      }
      if (query.tags && query.tags.length > 0) {
        boolQuery.should = query.tags.map(tag => ({ term: { tags: tag } }));
      }

      const { hits } = await this.elasticsearchClient.search({
        index: 'content',
        size: 20,
        query: { bool: boolQuery },
      });

      const results = hits.hits.map(hit => hit._source);
      await this.setCacheWithTracking(cacheKey, results);
      return results;
    } catch (error) {
      this.logger.error(`Elasticsearch search failed: ${error.message}`);
      // Fallback to MongoDB text search
      const mongoQuery: any = { $text: { $search: query.keywords } };
      if (query.category) mongoQuery.category = query.category;
      if (query.tags?.length) mongoQuery.tags = { $in: query.tags };

      return this.contentModel.find(mongoQuery).limit(20).lean().exec();
    }
  }

  async searchManually(query: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filters?: {
      title?: string;
      description?: string;
      type?: string;
      category?: string;
      language?: string;
      tags?: string[];
      publishDate?: { start?: Date; end?: Date };
    };
  }): Promise<{ content: any[]; total: number; page: number; totalPages: number }> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'publishDate',
      sortOrder = 'desc',
      filters = {},
    } = query;

    const safeLimit = Math.min(limit, 100);
    const filterQuery: any = {};

    // Escape regex input to prevent ReDoS
    if (filters.title || filters.description) {
      filterQuery.$or = [];
      if (filters.title) {
        filterQuery.$or.push({ title: { $regex: escapeRegex(filters.title), $options: 'i' } });
      }
      if (filters.description) {
        filterQuery.$or.push({ description: { $regex: escapeRegex(filters.description), $options: 'i' } });
      }
    }

    if (filters.type) filterQuery.type = filters.type;
    if (filters.category) filterQuery.category = filters.category;
    if (filters.language) filterQuery.language = filters.language;

    if (filters.tags && filters.tags.length > 0) {
      filterQuery.tags = { $in: filters.tags };
    }

    if (filters.publishDate) {
      filterQuery.publishDate = {};
      if (filters.publishDate.start) {
        filterQuery.publishDate.$gte = filters.publishDate.start;
      }
      if (filters.publishDate.end) {
        filterQuery.publishDate.$lte = filters.publishDate.end;
      }
    }

    const allowedSortFields = ['publishDate', 'title', 'category', 'duration', 'createdAt'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'publishDate';
    const skip = (page - 1) * safeLimit;

    const [content, total] = await Promise.all([
      this.contentModel
        .find(filterQuery)
        .sort({ [safeSortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean()
        .exec(),
      this.contentModel.countDocuments(filterQuery),
    ]);

    return {
      content,
      total,
      page,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  // --- User Preferences ---

  async getPreferences(userId: string): Promise<UserPreference> {
    const preference = await this.userPreferenceModel.findOne({ userId });
    if (!preference) {
      return this.userPreferenceModel.create({
        userId,
        favoriteCategories: [],
        favoriteTags: [],
        watchedContent: [],
      });
    }
    return preference;
  }

  async updatePreferences(
    userId: string,
    data: { favoriteCategories?: string[]; favoriteTags?: string[] },
  ): Promise<UserPreference> {
    const preference = await this.userPreferenceModel.findOneAndUpdate(
      { userId },
      {
        ...data,
        lastUpdated: new Date(),
      },
      { new: true, upsert: true },
    );

    await this.invalidateCacheByPrefix(`recommendations_${userId}`);
    return preference;
  }

  // --- Cache helpers ---

  private async setCacheWithTracking(key: string, value: any): Promise<void> {
    this.cacheKeys.add(key);
    await this.cacheManager.set(key, value, this.CACHE_TTL);
  }

  private async invalidateCacheByPrefix(prefix: string): Promise<void> {
    const keysToDelete = [...this.cacheKeys].filter(k => k.startsWith(prefix));
    await Promise.all(
      keysToDelete.map(async key => {
        await this.cacheManager.del(key);
        this.cacheKeys.delete(key);
      }),
    );
  }
}
