import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ContentService } from '../content.service';

@Controller()
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @MessagePattern({ cmd: 'create_content' })
  async createContent(@Payload() data: any) {
    return this.contentService.create(data, data.userId);
  }

  @MessagePattern({ cmd: 'get_all_content' })
  async getAllContent() {
    return this.contentService.findAll();
  }

  @MessagePattern({ cmd: 'get_content_by_id' })
  async getContentById(@Payload() data: { id: string }) {
    return this.contentService.findOne(data.id);
  }

  @MessagePattern({ cmd: 'update_content' })
  async updateContent(@Payload() data: { id: string; [key: string]: any }) {
    const { id, ...updateData } = data;
    return this.contentService.update(id, updateData);
  }

  @MessagePattern({ cmd: 'delete_content' })
  async deleteContent(@Payload() data: { id: string }) {
    return this.contentService.delete(data.id);
  }
} 