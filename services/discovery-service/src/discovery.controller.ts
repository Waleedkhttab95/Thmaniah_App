import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DiscoveryService } from './discovery.service';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Controller('discovery')
@UseGuards(ThrottlerGuard)
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Get('categories')
  @Throttle({ default: { limit: 100, ttl: 60 } })
  async getCategories() {
    return this.discoveryService.getCategories();
  }

  @Get('trending')
  @Throttle({ default: { limit: 100, ttl: 60 } })
  async getTrendingContent(@Query('limit') limit?: number) {
    return this.discoveryService.getTrendingContent(limit);
  }

  @UseGuards(JwtAuthGuard)
  @Get('recommendations')
  @Throttle({ default: { limit: 50, ttl: 60 } })
  async getRecommendations(
    @Query('userId') userId: string,
    @Query('limit') limit?: number
  ) {
    return this.discoveryService.getRecommendations(userId, limit);
  }

  @UseGuards(JwtAuthGuard)
  @Post('preferences/:userId/content/:contentId')
  @Throttle({ default: { limit: 20, ttl: 60 } })
  async updateUserPreference(
    @Param('userId') userId: string,
    @Param('contentId') contentId: string
  ) {
    await this.discoveryService.updateUserPreference(userId, contentId);
    return { message: 'User preference updated successfully' };
  }

  @Get('similar/:contentId')
  @Throttle({ default: { limit: 100, ttl: 60 } })
  async getSimilarContent(
    @Param('contentId') contentId: string,
    @Query('limit') limit?: number
  ) {
    return this.discoveryService.getSimilarContent(contentId, limit);
  }

  @MessagePattern('content_created')
  async handleContentCreated(@Payload() data: any) {
    return this.discoveryService.handleContentCreated(data);
  }

  @MessagePattern('content_updated')
  async handleContentUpdated(@Payload() data: any) {
    return this.discoveryService.handleContentUpdated(data);
  }
} 