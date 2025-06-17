import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { ContentService } from './content.service';
import { CreateContentDto } from './dto/create-content.dto';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('content')
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new content' })
  @ApiResponse({ status: 201, description: 'Content successfully created' })
  async create(@Body() createContentDto: CreateContentDto, @Request() req) {
    return this.contentService.create(createContentDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all content' })
  @ApiResponse({ status: 200, description: 'Return all content' })
  async findAll() {
    return this.contentService.findAll();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search content' })
  @ApiResponse({ status: 200, description: 'Return search results' })
  async search(@Query('q') query: string) {
    return this.contentService.search(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get content by ID' })
  @ApiResponse({ status: 200, description: 'Return content by ID' })
  async findOne(@Param('id') id: string) {
    return this.contentService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update content' })
  @ApiResponse({ status: 200, description: 'Content successfully updated' })
  async update(
    @Param('id') id: string,
    @Body() updateContentDto: Partial<CreateContentDto>,
    @Request() req,
  ) {
    return this.contentService.update(id, updateContentDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete content' })
  @ApiResponse({ status: 200, description: 'Content successfully deleted' })
  async delete(@Param('id') id: string) {
    return this.contentService.delete(id);
  }
} 