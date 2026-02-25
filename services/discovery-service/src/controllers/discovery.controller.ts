import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, EventPattern, Payload, RpcException } from '@nestjs/microservices';
import { DiscoveryService } from '../discovery.service';

@Controller()
export class DiscoveryController {
  private readonly logger = new Logger(DiscoveryController.name);

  constructor(private readonly discoveryService: DiscoveryService) {}

  @EventPattern('content_created')
  async handleContentCreated(@Payload() data: any) {
    try {
      this.logger.log(`Received content_created event for: ${data.contentId}`);
      await this.discoveryService.handleContentCreated(data);
    } catch (error) {
      this.logger.error(`Failed to handle content_created: ${error.message}`);
    }
  }

  @EventPattern('content_updated')
  async handleContentUpdated(@Payload() data: any) {
    try {
      this.logger.log(`Received content_updated event for: ${data.contentId}`);
      await this.discoveryService.handleContentUpdated(data);
    } catch (error) {
      this.logger.error(`Failed to handle content_updated: ${error.message}`);
    }
  }

  @MessagePattern({ cmd: 'search_content' })
  async searchContent(@Payload() query: any) {
    try {
      return await this.discoveryService.search(query);
    } catch (error) {
      this.logger.error(`Search failed: ${error.message}`);
      throw new RpcException(error.message);
    }
  }

  @MessagePattern({ cmd: 'get_recommendations' })
  async getRecommendations(@Payload() data: { userId: string }) {
    try {
      return await this.discoveryService.getRecommendations(data.userId);
    } catch (error) {
      this.logger.error(`Recommendations failed: ${error.message}`);
      throw new RpcException(error.message);
    }
  }

  @MessagePattern({ cmd: 'get_trending' })
  async getTrendingContent() {
    try {
      return await this.discoveryService.getTrendingContent();
    } catch (error) {
      this.logger.error(`Trending failed: ${error.message}`);
      throw new RpcException(error.message);
    }
  }

  @MessagePattern({ cmd: 'manual_search' })
  async manualSearch(@Payload() query: any) {
    try {
      return await this.discoveryService.searchManually(query);
    } catch (error) {
      this.logger.error(`Manual search failed: ${error.message}`);
      throw new RpcException(error.message);
    }
  }

  @MessagePattern({ cmd: 'get_preferences' })
  async getPreferences(@Payload() data: { userId: string }) {
    try {
      return await this.discoveryService.getPreferences(data.userId);
    } catch (error) {
      this.logger.error(`Get preferences failed: ${error.message}`);
      throw new RpcException(error.message);
    }
  }

  @MessagePattern({ cmd: 'update_preferences' })
  async updatePreferences(@Payload() data: { userId: string; favoriteCategories?: string[]; favoriteTags?: string[] }) {
    try {
      const { userId, ...preferences } = data;
      return await this.discoveryService.updatePreferences(userId, preferences);
    } catch (error) {
      this.logger.error(`Update preferences failed: ${error.message}`);
      throw new RpcException(error.message);
    }
  }
}
