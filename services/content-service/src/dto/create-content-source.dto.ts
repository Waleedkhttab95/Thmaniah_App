import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateContentSourceDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
} 