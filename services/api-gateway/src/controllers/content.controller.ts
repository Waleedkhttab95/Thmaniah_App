import { Controller, Get, Post, Put, Delete, Body, Param, Query, Inject, HttpException, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { CreateContentDto } from '../dto/create-content.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../guards/roles.guard';

@ApiTags('Content')
@Controller('content')
export class ContentController {
  constructor(
    @Inject('CONTENT_SERVICE') private readonly contentService: ClientProxy,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new content' })
  @ApiBody({ type: CreateContentDto })
  @ApiResponse({ status: 201, description: 'Content successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createContent(@Body() createContentDto: CreateContentDto, @Req() req: any) {
    try {
      const response = await firstValueFrom(
        this.contentService.send({ cmd: 'create_content' }, {
          ...createContentDto,
          userId: req.user.id,
        }).pipe(timeout(5000)),
      );
      return response;
    } catch (error) {
      throw new HttpException(error.message || 'Failed to create content', HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all content (paginated)' })
  @ApiResponse({ status: 200, description: 'Paginated list of content' })
  async getAllContent(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const response = await firstValueFrom(
        this.contentService.send({ cmd: 'get_all_content' }, {
          page: page ? parseInt(page, 10) : 1,
          limit: limit ? parseInt(limit, 10) : 20,
        }).pipe(timeout(5000)),
      );
      return response;
    } catch (error) {
      throw new HttpException(error.message || 'Failed to fetch content', HttpStatus.INTERNAL_SERVER_ERROR);
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
        this.contentService.send({ cmd: 'get_content_by_id' }, { id }).pipe(timeout(5000)),
      );
      return response;
    } catch (error) {
      throw new HttpException(error.message || 'Content not found', HttpStatus.NOT_FOUND);
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update content' })
  @ApiParam({ name: 'id', description: 'Content ID' })
  @ApiBody({ type: CreateContentDto })
  @ApiResponse({ status: 200, description: 'Content successfully updated' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateContent(@Param('id') id: string, @Body() updateContentDto: Partial<CreateContentDto>, @Req() req: any) {
    try {
      const response = await firstValueFrom(
        this.contentService.send({ cmd: 'update_content' }, {
          id,
          ...updateContentDto,
          updatedBy: req.user.id,
        }).pipe(timeout(5000)),
      );
      return response;
    } catch (error) {
      throw new HttpException(error.message || 'Failed to update content', HttpStatus.BAD_REQUEST);
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete content' })
  @ApiParam({ name: 'id', description: 'Content ID' })
  @ApiResponse({ status: 200, description: 'Content successfully deleted' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteContent(@Param('id') id: string) {
    try {
      const response = await firstValueFrom(
        this.contentService.send({ cmd: 'delete_content' }, { id }).pipe(timeout(5000)),
      );
      return response;
    } catch (error) {
      throw new HttpException(error.message || 'Failed to delete content', HttpStatus.NOT_FOUND);
    }
  }
}
