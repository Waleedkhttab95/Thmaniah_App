import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Client } from '@elastic/elasticsearch';
import { Cache } from 'cache-manager';
import { Category } from './schemas/category.schema';
import { UserPreference } from './schemas/user-preference.schema';
import { Content } from './schemas/content.schema';

interface ContentSource {
  category: string;
  tags: string[];
  status: string;
}

@Injectable()
export class DiscoveryService {
  private readonly elasticsearchClient: Client;
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(UserPreference.name) private userPreferenceModel: Model<UserPreference>,
    @InjectModel(Content.name) private contentModel: Model<Content>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {
    this.elasticsearchClient = new Client({
      node: process.env.ELASTICSEARCH_URI || 'http://localhost:9200',
      maxRetries: 5,
      requestTimeout: 60000,
      sniffOnStart: true
    });
  }

  async handleContentCreated(data: any) {
    // Create content in discovery service database
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

    // Invalidate relevant caches
    await this.cacheManager.del('trending_*');
    await this.cacheManager.del('recommendations_*');
  }

  async handleContentUpdated(data: any) {
    // Update content in discovery service database
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
      { new: true }
    );

    // Invalidate relevant caches
    await this.cacheManager.del('trending_*');
    await this.cacheManager.del('recommendations_*');
    await this.cacheManager.del(`similar_${data.contentId}_*`);
  }

  async getCategories(): Promise<Category[]> {
    const cacheKey = 'all_categories';
    const cached = await this.cacheManager.get<Category[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const categories = await this.categoryModel.find({ isActive: true }).exec();
    await this.cacheManager.set(cacheKey, categories, this.CACHE_TTL);
    return categories;
  }

  async getTrendingContent(limit: number = 10): Promise<any[]> {
    const cacheKey = `trending_${limit}`;
    const cached = await this.cacheManager.get<any[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const { hits } = await this.elasticsearchClient.search({
      index: 'content',
      size: limit,
      sort: [
        { publishDate: { order: 'desc' } },
        { _score: { order: 'desc' } }
      ],
      query: {
        bool: {
          must: [
            { term: { status: 'published' } }
          ]
        }
      }
    });

    const results = hits.hits.map(hit => hit._source);
    await this.cacheManager.set(cacheKey, results, this.CACHE_TTL);
    return results;
  }

  async getRecommendations(userId: string, limit: number = 10): Promise<any[]> {
    const cacheKey = `recommendations_${userId}_${limit}`;
    const cached = await this.cacheManager.get<any[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const userPreference = await this.userPreferenceModel.findOne({ userId });
    if (!userPreference) {
      return this.getTrendingContent(limit);
    }

    const { hits } = await this.elasticsearchClient.search({
      index: 'content',
      size: limit,
      query: {
        bool: {
          must: [
            { term: { status: 'published' } }
          ],
          should: [
            { terms: { category: userPreference.favoriteCategories } },
            { terms: { tags: userPreference.favoriteTags } }
          ],
          must_not: [
            { terms: { _id: userPreference.watchedContent } }
          ]
        }
      }
    });

    const results = hits.hits.map(hit => hit._source);
    await this.cacheManager.set(cacheKey, results, this.CACHE_TTL);
    return results;
  }

  async updateUserPreference(userId: string, contentId: string): Promise<void> {
    const content = await this.elasticsearchClient.get<ContentSource>({
      index: 'content',
      id: contentId
    });

    const userPreference = await this.userPreferenceModel.findOne({ userId });
    if (!userPreference) {
      await this.userPreferenceModel.create({
        userId,
        watchedContent: [contentId],
        categoryWeights: { [content._source.category]: 1 },
        tagWeights: content._source.tags.reduce((acc, tag) => ({ ...acc, [tag]: 1 }), {})
      });
      return;
    }

    // Update watched content
    if (!userPreference.watchedContent.includes(contentId)) {
      userPreference.watchedContent.push(contentId);
    }

    // Update category weights
    const categoryWeight = userPreference.categoryWeights.get(content._source.category) || 0;
    userPreference.categoryWeights.set(content._source.category, categoryWeight + 1);

    // Update tag weights
    content._source.tags.forEach(tag => {
      const tagWeight = userPreference.tagWeights.get(tag) || 0;
      userPreference.tagWeights.set(tag, tagWeight + 1);
    });

    userPreference.lastUpdated = new Date();
    await userPreference.save();

    // Invalidate user-specific caches
    await this.cacheManager.del(`recommendations_${userId}_*`);
  }

  async getSimilarContent(contentId: string, limit: number = 10): Promise<any[]> {
    const cacheKey = `similar_${contentId}_${limit}`;
    const cached = await this.cacheManager.get<any[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const content = await this.elasticsearchClient.get<ContentSource>({
      index: 'content',
      id: contentId
    });

    const { hits } = await this.elasticsearchClient.search({
      index: 'content',
      size: limit,
      query: {
        bool: {
          must: [
            { term: { status: 'published' } }
          ],
          should: [
            { term: { category: content._source.category } },
            { terms: { tags: content._source.tags } }
          ],
          must_not: [
            { term: { _id: contentId } }
          ]
        }
      }
    });

    const results = hits.hits.map(hit => hit._source);
    await this.cacheManager.set(cacheKey, results, this.CACHE_TTL);
    return results;
  }

  async search(query: { keywords: string; category?: string; tags?: string[] }): Promise<any[]> {
    const cacheKey = `search_${JSON.stringify(query)}`;
    const cached = await this.cacheManager.get<any[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const { hits } = await this.elasticsearchClient.search({
      index: 'content',
      size: 20,
      query: {
        bool: {
          must: [
            { term: { status: 'published' } },
            {
              multi_match: {
                query: query.keywords,
                fields: ['title^3', 'description^2', 'content'],
                fuzziness: 'AUTO'
              }
            }
          ],
          ...(query.category && {
            filter: [{ term: { category: query.category } }]
          }),
          ...(query.tags && query.tags.length > 0 && {
            should: query.tags.map(tag => ({ term: { tags: tag } }))
          })
        }
      }
    });

    const results = hits.hits.map(hit => hit._source);
    await this.cacheManager.set(cacheKey, results, this.CACHE_TTL);
    return results;
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
      publishDate?: {
        start?: Date;
        end?: Date;
      };
    };
  }): Promise<{ content: any[]; total: number; page: number; totalPages: number }> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'publishDate',
      sortOrder = 'desc',
      filters = {}
    } = query;

    // Build the filter object
    const filterQuery: any = {};

    // Add text search if title or description is provided
    if (filters.title || filters.description) {
      filterQuery.$or = [];
      if (filters.title) {
        filterQuery.$or.push({ title: { $regex: filters.title, $options: 'i' } });
      }
      if (filters.description) {
        filterQuery.$or.push({ description: { $regex: filters.description, $options: 'i' } });
      }
    }

    // Add exact match filters
    if (filters.type) filterQuery.type = filters.type;
    if (filters.category) filterQuery.category = filters.category;
    if (filters.language) filterQuery.language = filters.language;

    // Add tags filter if provided
    if (filters.tags && filters.tags.length > 0) {
      filterQuery.tags = { $in: filters.tags };
    }

    // Add date range filter if provided
    if (filters.publishDate) {
      filterQuery.publishDate = {};
      if (filters.publishDate.start) {
        filterQuery.publishDate.$gte = filters.publishDate.start;
      }
      if (filters.publishDate.end) {
        filterQuery.publishDate.$lte = filters.publishDate.end;
      }
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Execute the query with pagination and sorting
    const [content, total] = await Promise.all([
      this.contentModel
        .find(filterQuery)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.contentModel.countDocuments(filterQuery)
    ]);

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    return {
      content,
      total,
      page,
      totalPages
    };
  }
} 