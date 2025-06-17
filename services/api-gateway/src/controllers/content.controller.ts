import { Controller, Get, Post, Put, Delete, Body, Param, Inject, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { CreateContentDto } from '../dto/create-content.dto';

@ApiTags('Content')
@Controller('content')
export class ContentController {
  constructor(
    @Inject('CONTENT_SERVICE') private readonly contentService: ClientProxy,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create new content' })
  @ApiBody({ type: CreateContentDto })
  @ApiResponse({ status: 201, description: 'Content successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createContent(@Body() createContentDto: CreateContentDto) {
    try {
      const response = await firstValueFrom(
        this.contentService.send({ cmd: 'create_content' }, { ...createContentDto, userId: "Test User" }),
      );
      return response;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all content' })
  @ApiResponse({ status: 200, description: 'List of all content' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getAllContent() {
    try {
      const response = await firstValueFrom(
        this.contentService.send({ cmd: 'get_all_content' }, {}),
      );
      return response;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get content by ID' })
  @ApiParam({ name: 'id', description: 'Content ID' })
  @ApiResponse({ status: 200, description: 'Content details' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  async getContentById(@Param('id') id: string) {
    try {
      const response = await firstValueFrom(
        this.contentService.send({ cmd: 'get_content_by_id' }, { id }),
      );
      return response;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update content' })
  @ApiParam({ name: 'id', description: 'Content ID' })
  @ApiBody({ type: CreateContentDto })
  @ApiResponse({ status: 200, description: 'Content successfully updated' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async updateContent(@Param('id') id: string, @Body() updateContentDto: Partial<CreateContentDto>) {
    try {
      const response = await firstValueFrom(
        this.contentService.send({ cmd: 'update_content' }, { id, ...updateContentDto }),
      );
      return response;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete content' })
  @ApiParam({ name: 'id', description: 'Content ID' })
  @ApiResponse({ status: 200, description: 'Content successfully deleted' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  async deleteContent(@Param('id') id: string) {
    try {
      const response = await firstValueFrom(
        this.contentService.send({ cmd: 'delete_content' }, { id }),
      );
      return response;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }
} 