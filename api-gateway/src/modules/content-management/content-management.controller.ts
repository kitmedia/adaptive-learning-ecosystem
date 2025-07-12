import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { ContentManagementService } from './content-management.service';
import { CreateContentDto, UpdateContentDto, ContentSearchDto } from './dto/content.dto';

@ApiTags('Content Management')
@Controller('content-management')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ContentManagementController {
  constructor(private readonly contentService: ContentManagementService) {}

  @Post('content')
  @Roles('teacher', 'admin')
  @ApiOperation({ summary: 'Create new content' })
  @ApiResponse({ status: 201, description: 'Content created successfully' })
  async createContent(@Body() createContentDto: CreateContentDto) {
    try {
      const result = await this.contentService.createContent(createContentDto);
      return {
        success: true,
        data: result,
        message: 'Content created successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create content',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('content/:id')
  @ApiOperation({ summary: 'Get content by ID' })
  @ApiResponse({ status: 200, description: 'Content retrieved successfully' })
  async getContent(@Param('id') id: string) {
    try {
      const result = await this.contentService.getContent(id);
      return {
        success: true,
        data: result,
        message: 'Content retrieved successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Content not found',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Put('content/:id')
  @Roles('teacher', 'admin')
  @ApiOperation({ summary: 'Update content' })
  @ApiResponse({ status: 200, description: 'Content updated successfully' })
  async updateContent(
    @Param('id') id: string,
    @Body() updateContentDto: UpdateContentDto,
  ) {
    try {
      const result = await this.contentService.updateContent(id, updateContentDto);
      return {
        success: true,
        data: result,
        message: 'Content updated successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update content',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('content/:id')
  @Roles('teacher', 'admin')
  @ApiOperation({ summary: 'Delete content' })
  @ApiResponse({ status: 200, description: 'Content deleted successfully' })
  async deleteContent(@Param('id') id: string) {
    try {
      await this.contentService.deleteContent(id);
      return {
        success: true,
        message: 'Content deleted successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to delete content',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('content')
  @ApiOperation({ summary: 'Search and filter content' })
  @ApiResponse({ status: 200, description: 'Content list retrieved successfully' })
  async searchContent(@Query() searchDto: ContentSearchDto) {
    try {
      const result = await this.contentService.searchContent(searchDto);
      return {
        success: true,
        data: result,
        message: 'Content list retrieved successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve content',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('media/upload')
  @Roles('teacher', 'admin')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload media file' })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  async uploadMedia(@UploadedFile() file: Express.Multer.File) {
    try {
      if (!file) {
        throw new HttpException('No file provided', HttpStatus.BAD_REQUEST);
      }

      const result = await this.contentService.uploadMedia(file);
      return {
        success: true,
        data: result,
        message: 'File uploaded successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to upload file',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('courses')
  @ApiOperation({ summary: 'Get all courses' })
  @ApiResponse({ status: 200, description: 'Courses retrieved successfully' })
  async getCourses(@Query() query: any) {
    try {
      const result = await this.contentService.getCourses(query);
      return {
        success: true,
        data: result,
        message: 'Courses retrieved successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve courses',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('courses')
  @Roles('teacher', 'admin')
  @ApiOperation({ summary: 'Create new course' })
  @ApiResponse({ status: 201, description: 'Course created successfully' })
  async createCourse(@Body() courseData: any) {
    try {
      const result = await this.contentService.createCourse(courseData);
      return {
        success: true,
        data: result,
        message: 'Course created successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create course',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('courses/:id')
  @Roles('teacher', 'admin')
  @ApiOperation({ summary: 'Update course' })
  @ApiResponse({ status: 200, description: 'Course updated successfully' })
  async updateCourse(@Param('id') id: string, @Body() courseData: any) {
    try {
      const result = await this.contentService.updateCourse(id, courseData);
      return {
        success: true,
        data: result,
        message: 'Course updated successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update course',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('courses/:id')
  @Roles('teacher', 'admin')
  @ApiOperation({ summary: 'Delete course' })
  @ApiResponse({ status: 200, description: 'Course deleted successfully' })
  async deleteCourse(@Param('id') id: string) {
    try {
      await this.contentService.deleteCourse(id);
      return {
        success: true,
        message: 'Course deleted successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to delete course',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('lessons')
  @ApiOperation({ summary: 'Get lessons for a course' })
  @ApiResponse({ status: 200, description: 'Lessons retrieved successfully' })
  async getLessons(@Query('courseId') courseId: string) {
    try {
      const result = await this.contentService.getLessons(courseId);
      return {
        success: true,
        data: result,
        message: 'Lessons retrieved successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve lessons',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('lessons')
  @Roles('teacher', 'admin')
  @ApiOperation({ summary: 'Create new lesson' })
  @ApiResponse({ status: 201, description: 'Lesson created successfully' })
  async createLesson(@Body() lessonData: any) {
    try {
      const result = await this.contentService.createLesson(lessonData);
      return {
        success: true,
        data: result,
        message: 'Lesson created successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create lesson',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get content templates' })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully' })
  async getTemplates(@Query('type') type?: string) {
    try {
      const result = await this.contentService.getTemplates(type);
      return {
        success: true,
        data: result,
        message: 'Templates retrieved successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve templates',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}