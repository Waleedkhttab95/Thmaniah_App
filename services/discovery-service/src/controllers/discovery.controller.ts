import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DiscoveryService } from '../discovery.service';

@Controller()
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @MessagePattern({ cmd: 'search_content' })
  async searchContent(@Payload() query: any) {
    return this.discoveryService.search(query);
  }

  @MessagePattern({ cmd: 'get_recommendations' })
  async getRecommendations(@Payload() data: { userId: string }) {
    return this.discoveryService.getRecommendations(data.userId);
  }

  @MessagePattern({ cmd: 'get_trending' })
  async getTrendingContent() {
    return this.discoveryService.getTrendingContent();
  }

  @MessagePattern({ cmd: 'manual_search' })
  async manualSearch(@Payload() query: any) {
    return this.discoveryService.searchManually(query);
  }
} 