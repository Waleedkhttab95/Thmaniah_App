import { PartialType } from '@nestjs/mapped-types';
import { CreateContentSourceDto } from './create-content-source.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateContentSourceDto extends PartialType(CreateContentSourceDto) {
  @ApiProperty({ required: false, example: 'Updated YouTube Channel', description: 'The updated name of the content source' })
  name?: string;

  @ApiProperty({ required: false, example: true, description: 'The updated active status of the content source' })
  isActive?: boolean;
} 