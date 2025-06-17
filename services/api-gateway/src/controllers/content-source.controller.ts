import { Controller, Get, Post, Put, Delete, Body, Param, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { CreateContentSourceDto } from '../dto/create-content-source.dto';
import { UpdateContentSourceDto } from '../dto/update-content-source.dto';

@ApiTags('Content Sources')
@Controller('content-sources')
export class ContentSourceController {
  constructor(
    @Inject('CONTENT_SERVICE') private readonly contentService: ClientProxy,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create new content source' })
  @ApiBody({ type: CreateContentSourceDto })
  @ApiResponse({ status: 201, description: 'Content source successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createContentSource(@Body() createContentSourceDto: CreateContentSourceDto) {
    try {
      const response = await firstValueFrom(
        this.contentService.send({ cmd: 'create_content_source' }, createContentSourceDto),
      );
      return response;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all content sources' })
  @ApiResponse({ status: 200, description: 'List of all content sources' })
  async getAllContentSources() {
    try {
      const response = await firstValueFrom(
        this.contentService.send({ cmd: 'get_all_content_sources' }, {}),
      );
      return response;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get content source by ID' })
  @ApiParam({ name: 'id', description: 'Content source ID' })
  @ApiResponse({ status: 200, description: 'Content source details' })
  @ApiResponse({ status: 404, description: 'Content source not found' })
  async getContentSourceById(@Param('id') id: string) {
    try {
      const response = await firstValueFrom(
        this.contentService.send({ cmd: 'get_content_source_by_id' }, { id }),
      );
      return response;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update content source' })
  @ApiParam({ name: 'id', description: 'Content source ID' })
  @ApiBody({ type: UpdateContentSourceDto })
  @ApiResponse({ status: 200, description: 'Content source successfully updated' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async updateContentSource(@Param('id') id: string, @Body() updateContentSourceDto: UpdateContentSourceDto) {
    try {
      const response = await firstValueFrom(
        this.contentService.send({ cmd: 'update_content_source' }, { id, ...updateContentSourceDto }),
      );
      return response;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete content source' })
  @ApiParam({ name: 'id', description: 'Content source ID' })
  @ApiResponse({ status: 200, description: 'Content source successfully deleted' })
  @ApiResponse({ status: 404, description: 'Content source not found' })
  async deleteContentSource(@Param('id') id: string) {
    try {
      const response = await firstValueFrom(
        this.contentService.send({ cmd: 'delete_content_source' }, { id }),
      );
      return response;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }
} 