import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { ContentSourceService } from '../services/content-source.service';
import { ContentImportService } from '../services/content-import.service';

@Controller()
export class ContentSourceController {
  private readonly logger = new Logger(ContentSourceController.name);

  constructor(
    private readonly contentSourceService: ContentSourceService,
    private readonly contentImportService: ContentImportService,
  ) {}

  @MessagePattern({ cmd: 'create_content_source' })
  async create(@Payload() data: any) {
    try {
      return await this.contentSourceService.create(data);
    } catch (error) {
      this.logger.error(`Failed to create content source: ${error.message}`);
      throw new RpcException(error.message);
    }
  }

  @MessagePattern({ cmd: 'get_all_content_sources' })
  async findAll() {
    try {
      return await this.contentSourceService.findAll();
    } catch (error) {
      this.logger.error(`Failed to fetch content sources: ${error.message}`);
      throw new RpcException(error.message);
    }
  }

  @MessagePattern({ cmd: 'get_content_source_by_id' })
  async findOne(@Payload() data: { id: string }) {
    try {
      return await this.contentSourceService.findOne(data.id);
    } catch (error) {
      this.logger.error(`Failed to fetch content source: ${error.message}`);
      throw new RpcException(error.message);
    }
  }

  @MessagePattern({ cmd: 'update_content_source' })
  async update(@Payload() data: { id: string; [key: string]: any }) {
    try {
      const { id, ...updateData } = data;
      return await this.contentSourceService.update(id, updateData);
    } catch (error) {
      this.logger.error(`Failed to update content source: ${error.message}`);
      throw new RpcException(error.message);
    }
  }

  @MessagePattern({ cmd: 'delete_content_source' })
  async remove(@Payload() data: { id: string }) {
    try {
      await this.contentSourceService.remove(data.id);
      return { message: 'Content source deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete content source: ${error.message}`);
      throw new RpcException(error.message);
    }
  }

  @MessagePattern({ cmd: 'import_content' })
  async importContent(@Payload() data: { source: string; config: Record<string, any>; userId: string }) {
    try {
      return await this.contentImportService.importContent(data.source, data.config, data.userId);
    } catch (error) {
      this.logger.error(`Failed to import content: ${error.message}`);
      throw new RpcException(error.message);
    }
  }

  @MessagePattern({ cmd: 'get_import_strategies' })
  async getImportStrategies() {
    return { strategies: this.contentImportService.getAvailableStrategies() };
  }
}
