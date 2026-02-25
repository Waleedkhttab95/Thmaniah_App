import { Controller, Get, Post, Put, Delete, Body, Param, Inject, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { CreateContentSourceDto } from '../dto/create-content-source.dto';
import { UpdateContentSourceDto } from '../dto/update-content-source.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../guards/roles.guard';

@ApiTags('Content Sources')
@Controller('content-sources')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ContentSourceController {
  constructor(
    @Inject('CONTENT_SERVICE') private readonly contentService: ClientProxy,
  ) {}

  @Post()
  @Roles('admin', 'editor')
  @ApiOperation({ summary: 'Create new content source' })
  @ApiBody({ type: CreateContentSourceDto })
  @ApiResponse({ status: 201, description: 'Content source successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createContentSource(@Body() createContentSourceDto: CreateContentSourceDto) {
    try {
      const response = await firstValueFrom(
        this.contentService.send({ cmd: 'create_content_source' }, createContentSourceDto).pipe(timeout(5000)),
      );
      return response;
    } catch (error) {
      throw new HttpException(error.message || 'Failed to create content source', HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all content sources' })
  @ApiResponse({ status: 200, description: 'List of all content sources' })
  async getAllContentSources() {
    try {
      const response = await firstValueFrom(
        this.contentService.send({ cmd: 'get_all_content_sources' }, {}).pipe(timeout(5000)),
      );
      return response;
    } catch (error) {
      throw new HttpException(error.message || 'Failed to fetch content sources', HttpStatus.INTERNAL_SERVER_ERROR);
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
        this.contentService.send({ cmd: 'get_content_source_by_id' }, { id }).pipe(timeout(5000)),
      );
      return response;
    } catch (error) {
      throw new HttpException(error.message || 'Content source not found', HttpStatus.NOT_FOUND);
    }
  }

  @Put(':id')
  @Roles('admin', 'editor')
  @ApiOperation({ summary: 'Update content source' })
  @ApiParam({ name: 'id', description: 'Content source ID' })
  @ApiBody({ type: UpdateContentSourceDto })
  @ApiResponse({ status: 200, description: 'Content source successfully updated' })
  async updateContentSource(@Param('id') id: string, @Body() updateContentSourceDto: UpdateContentSourceDto) {
    try {
      const response = await firstValueFrom(
        this.contentService.send({ cmd: 'update_content_source' }, { id, ...updateContentSourceDto }).pipe(timeout(5000)),
      );
      return response;
    } catch (error) {
      throw new HttpException(error.message || 'Failed to update content source', HttpStatus.BAD_REQUEST);
    }
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete content source' })
  @ApiParam({ name: 'id', description: 'Content source ID' })
  @ApiResponse({ status: 200, description: 'Content source successfully deleted' })
  async deleteContentSource(@Param('id') id: string) {
    try {
      const response = await firstValueFrom(
        this.contentService.send({ cmd: 'delete_content_source' }, { id }).pipe(timeout(5000)),
      );
      return response;
    } catch (error) {
      throw new HttpException(error.message || 'Failed to delete content source', HttpStatus.NOT_FOUND);
    }
  }
}
