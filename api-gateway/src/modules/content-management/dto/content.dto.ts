import { IsString, IsOptional, IsEnum, IsArray, IsObject, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ContentType {
  COURSE = 'course',
  LESSON = 'lesson',
  MODULE = 'module',
  QUIZ = 'quiz',
  VIDEO = 'video',
  DOCUMENT = 'document',
  INTERACTIVE = 'interactive',
}

export enum ContentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  UNDER_REVIEW = 'under_review',
}

export class CreateContentDto {
  @ApiProperty({ description: 'Content title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Content description' })
  @IsString()
  description: string;

  @ApiProperty({ enum: ContentType, description: 'Type of content' })
  @IsEnum(ContentType)
  type: ContentType;

  @ApiPropertyOptional({ description: 'Content body/data' })
  @IsOptional()
  @IsObject()
  content?: any;

  @ApiPropertyOptional({ description: 'Author ID' })
  @IsOptional()
  @IsString()
  author_id?: string;

  @ApiPropertyOptional({ description: 'Parent content ID for hierarchical content' })
  @IsOptional()
  @IsString()
  parent_id?: string;

  @ApiPropertyOptional({ description: 'Content metadata' })
  @IsOptional()
  @IsObject()
  metadata?: any;

  @ApiPropertyOptional({ description: 'Content tags', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ enum: ContentStatus, description: 'Content status' })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @ApiPropertyOptional({ description: 'Content category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Content language' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ description: 'Difficulty level (1-5)' })
  @IsOptional()
  @IsNumber()
  difficulty_level?: number;

  @ApiPropertyOptional({ description: 'Estimated duration in minutes' })
  @IsOptional()
  @IsNumber()
  estimated_duration?: number;
}

export class UpdateContentDto {
  @ApiPropertyOptional({ description: 'Content title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Content description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ContentType, description: 'Type of content' })
  @IsOptional()
  @IsEnum(ContentType)
  type?: ContentType;

  @ApiPropertyOptional({ description: 'Content body/data' })
  @IsOptional()
  @IsObject()
  content?: any;

  @ApiPropertyOptional({ description: 'Content metadata' })
  @IsOptional()
  @IsObject()
  metadata?: any;

  @ApiPropertyOptional({ description: 'Content tags', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ enum: ContentStatus, description: 'Content status' })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @ApiPropertyOptional({ description: 'Content category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Content language' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ description: 'Difficulty level (1-5)' })
  @IsOptional()
  @IsNumber()
  difficulty_level?: number;

  @ApiPropertyOptional({ description: 'Estimated duration in minutes' })
  @IsOptional()
  @IsNumber()
  estimated_duration?: number;

  @ApiPropertyOptional({ description: 'Version notes' })
  @IsOptional()
  @IsString()
  version_notes?: string;
}

export class ContentSearchDto {
  @ApiPropertyOptional({ description: 'Search query' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: ContentType, description: 'Filter by content type' })
  @IsOptional()
  @IsEnum(ContentType)
  type?: ContentType;

  @ApiPropertyOptional({ enum: ContentStatus, description: 'Filter by content status' })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @ApiPropertyOptional({ description: 'Filter by author ID' })
  @IsOptional()
  @IsString()
  author_id?: string;

  @ApiPropertyOptional({ description: 'Filter by category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Filter by language' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ description: 'Filter by tags', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Page number for pagination' })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ description: 'Number of items per page' })
  @IsOptional()
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({ description: 'Sort by field' })
  @IsOptional()
  @IsString()
  sort_by?: string;

  @ApiPropertyOptional({ description: 'Sort order (asc/desc)' })
  @IsOptional()
  @IsString()
  sort_order?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: 'Include only published content' })
  @IsOptional()
  @IsBoolean()
  published_only?: boolean;
}