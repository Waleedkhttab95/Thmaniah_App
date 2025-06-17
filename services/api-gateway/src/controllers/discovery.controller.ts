import { Controller, Get, Query, Inject, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

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
  @ApiQuery({ name: 'query', description: 'Search query parameters' })
  @ApiResponse({ status: 200, description: 'Search results' })
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
} 