import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { ContentService } from '../content.service';

@Controller()
export class ContentController {
  private readonly logger = new Logger(ContentController.name);

  constructor(private readonly contentService: ContentService) {}

  @MessagePattern({ cmd: 'create_content' })
  async createContent(@Payload() data: any) {
    try {
      return await this.contentService.create(data, data.userId);
    } catch (error) {
      this.logger.error(`Failed to create content: ${error.message}`);
      throw new RpcException(error.message);
    }
  }

  @MessagePattern({ cmd: 'get_all_content' })
  async getAllContent(@Payload() data: { page?: number; limit?: number }) {
    try {
      return await this.contentService.findAll(data?.page, data?.limit);
    } catch (error) {
      this.logger.error(`Failed to fetch content: ${error.message}`);
      throw new RpcException(error.message);
    }
  }

  @MessagePattern({ cmd: 'get_content_by_id' })
  async getContentById(@Payload() data: { id: string }) {
    try {
      return await this.contentService.findOne(data.id);
    } catch (error) {
      this.logger.error(`Failed to fetch content ${data.id}: ${error.message}`);
      throw new RpcException(error.message);
    }
  }

  @MessagePattern({ cmd: 'update_content' })
  async updateContent(@Payload() data: { id: string; [key: string]: any }) {
    try {
      const { id, ...updateData } = data;
      return await this.contentService.update(id, updateData);
    } catch (error) {
      this.logger.error(`Failed to update content: ${error.message}`);
      throw new RpcException(error.message);
    }
  }

  @MessagePattern({ cmd: 'delete_content' })
  async deleteContent(@Payload() data: { id: string }) {
    try {
      await this.contentService.delete(data.id);
      return { message: 'Content deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete content: ${error.message}`);
      throw new RpcException(error.message);
    }
  }
}
