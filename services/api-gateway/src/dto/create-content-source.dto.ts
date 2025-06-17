import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateContentSourceDto {
  @ApiProperty({ example: 'YouTube Channel', description: 'The name of the content source' })
  @IsString()
  name: string;

  @ApiProperty({ required: false, example: true, description: 'Whether the content source is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
} 