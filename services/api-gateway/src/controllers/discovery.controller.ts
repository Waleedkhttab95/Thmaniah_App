import { Controller, Get, Put, Body, Query, Req, Inject, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('Discovery')
@Controller('discovery')
@UseGuards(ThrottlerGuard)
export class DiscoveryController {
  constructor(
    @Inject('DISCOVERY_SERVICE') private readonly discoveryService: ClientProxy,
  ) {}

  @Get('search')
  @Throttle({ default: { limit: 100, ttl: 60 } })
  @ApiOperation({ summary: 'Search content' })
  @ApiQuery({ 
    name: 'keywords', 
    required: true,
    description: 'Search keywords to find content',
    type: String 
  })
  @ApiQuery({ 
    name: 'category', 
    required: false,
    description: 'Filter content by category',
    type: String 
  })
  @ApiQuery({ 
    name: 'tags', 
    required: false,
    description: 'Filter content by tags (can be multiple)',
    type: [String],
    isArray: true
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Search results',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          content: { type: 'string' },
          category: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          status: { type: 'string' }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async searchContent(@Query() query: any) {
    try {
      const response = await firstValueFrom(
        this.discoveryService.send({ cmd: 'search_content' }, query),
      );
      return response;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('recommendations')
  @Throttle({ default: { limit: 100, ttl: 60 } })
  @ApiOperation({ summary: 'Get content recommendations' })
  @ApiQuery({ name: 'userId', description: 'User ID for personalized recommendations' })
  @ApiResponse({ status: 200, description: 'List of recommended content' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async getRecommendations(@Query('userId') userId: string) {
    try {
      const response = await firstValueFrom(
        this.discoveryService.send({ cmd: 'get_recommendations' }, { userId }),
      );
      return response;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('trending')
  @Throttle({ default: { limit: 100, ttl: 60 } })
  @ApiOperation({ summary: 'Get trending content' })
  @ApiResponse({ status: 200, description: 'List of trending content' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getTrendingContent() {
    try {
      const response = await firstValueFrom(
        this.discoveryService.send({ cmd: 'get_trending' }, {}),
      );
      return response;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('manual-search')
  @Throttle({ default: { limit: 100, ttl: 60 } })
  @ApiOperation({ summary: 'Manual search with specific parameters' })
  @ApiQuery({ name: 'title', description: 'Title of the content', required: false })
  @ApiQuery({ name: 'category', description: 'Category of the content', required: false })
  @ApiQuery({ name: 'tags', description: 'Tags associated with the content', required: false })
  @ApiQuery({ name: 'dateFrom', description: 'Start date for content', required: false })
  @ApiQuery({ name: 'dateTo', description: 'End date for content', required: false })
  @ApiResponse({ status: 200, description: 'Search results' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async manualSearch(
    @Query('title') title?: string,
    @Query('category') category?: string,
    @Query('tags') tags?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    try {
      const searchParams = {
        title,
        category,
        tags: tags ? tags.split(',') : undefined,
        dateFrom,
        dateTo,
      };

      const response = await firstValueFrom(
        this.discoveryService.send({ cmd: 'manual_search' }, searchParams),
      );
      return response;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('preferences')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user discovery preferences' })
  @ApiResponse({
    status: 200,
    description: 'User preferences',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        favoriteCategories: { type: 'array', items: { type: 'string' } },
        favoriteTags: { type: 'array', items: { type: 'string' } },
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPreferences(@Req() req: any) {
    try {
      const response = await firstValueFrom(
        this.discoveryService.send({ cmd: 'get_preferences' }, { userId: req.user.id }).pipe(timeout(5000)),
      );
      return response;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Put('preferences')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user discovery preferences' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        favoriteCategories: { type: 'array', items: { type: 'string' }, description: 'Preferred content categories' },
        favoriteTags: { type: 'array', items: { type: 'string' }, description: 'Preferred content tags' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Updated preferences' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updatePreferences(@Req() req: any, @Body() body: { favoriteCategories?: string[]; favoriteTags?: string[] }) {
    try {
      const response = await firstValueFrom(
        this.discoveryService.send({ cmd: 'update_preferences' }, { userId: req.user.id, ...body }).pipe(timeout(5000)),
      );
      return response;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
} 