import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ContentSourceService } from '../services/content-source.service';
import { CreateContentSourceDto } from '../dto/create-content-source.dto';
import { UpdateContentSourceDto } from '../dto/update-content-source.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('content-sources')
@Controller('content-sources')
export class ContentSourceController {
  constructor(private readonly contentSourceService: ContentSourceService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new content source' })
  @ApiResponse({ status: 201, description: 'Content source created successfully' })
  create(@Body() createContentSourceDto: CreateContentSourceDto) {
    return this.contentSourceService.create(createContentSourceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all content sources' })
  @ApiResponse({ status: 200, description: 'Return all content sources' })
  findAll() {
    return this.contentSourceService.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active content sources' })
  @ApiResponse({ status: 200, description: 'Return all active content sources' })
  findActive() {
    return this.contentSourceService.findActive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a content source by id' })
  @ApiResponse({ status: 200, description: 'Return the content source' })
  @ApiResponse({ status: 404, description: 'Content source not found' })
  findOne(@Param('id') id: string) {
    return this.contentSourceService.findOne(id);
  }

  @Get('name/:name')
  @ApiOperation({ summary: 'Get a content source by name' })
  @ApiResponse({ status: 200, description: 'Return the content source' })
  @ApiResponse({ status: 404, description: 'Content source not found' })
  findByName(@Param('name') name: string) {
    return this.contentSourceService.findByName(name);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a content source' })
  @ApiResponse({ status: 200, description: 'Content source updated successfully' })
  @ApiResponse({ status: 404, description: 'Content source not found' })
  update(
    @Param('id') id: string,
    @Body() updateContentSourceDto: UpdateContentSourceDto,
  ) {
    return this.contentSourceService.update(id, updateContentSourceDto);
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Toggle content source active status' })
  @ApiResponse({ status: 200, description: 'Content source status toggled successfully' })
  @ApiResponse({ status: 404, description: 'Content source not found' })
  toggleActive(@Param('id') id: string) {
    return this.contentSourceService.toggleActive(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a content source' })
  @ApiResponse({ status: 200, description: 'Content source deleted successfully' })
  @ApiResponse({ status: 404, description: 'Content source not found' })
  remove(@Param('id') id: string) {
    return this.contentSourceService.remove(id);
  }
} 