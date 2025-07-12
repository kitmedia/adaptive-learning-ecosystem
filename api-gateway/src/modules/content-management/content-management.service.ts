import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { CreateContentDto, UpdateContentDto, ContentSearchDto } from './dto/content.dto';

@Injectable()
export class ContentManagementService {
  private readonly contentServiceUrl: string;
  private readonly httpClient: AxiosInstance;

  constructor(private configService: ConfigService) {
    this.contentServiceUrl = this.configService.get<string>(
      'CONTENT_MANAGEMENT_SERVICE_URL',
      'http://localhost:8006'
    );

    this.httpClient = axios.create({
      baseURL: this.contentServiceUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.httpClient.interceptors.response.use(
      (response) => response,
      (error) => {
        const message = error.response?.data?.message || error.message || 'Service unavailable';
        const status = error.response?.status || HttpStatus.SERVICE_UNAVAILABLE;
        throw new HttpException(message, status);
      }
    );
  }

  async createContent(createContentDto: CreateContentDto) {
    try {
      const response = await this.httpClient.post('/content', createContentDto);
      return response.data;
    } catch (error) {
      throw new HttpException(
        `Failed to create content: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getContent(id: string) {
    try {
      const response = await this.httpClient.get(`/content/${id}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new HttpException('Content not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        `Failed to retrieve content: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateContent(id: string, updateContentDto: UpdateContentDto) {
    try {
      const response = await this.httpClient.put(`/content/${id}`, updateContentDto);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new HttpException('Content not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        `Failed to update content: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteContent(id: string) {
    try {
      await this.httpClient.delete(`/content/${id}`);
    } catch (error) {
      if (error.response?.status === 404) {
        throw new HttpException('Content not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        `Failed to delete content: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async searchContent(searchDto: ContentSearchDto) {
    try {
      const params = new URLSearchParams();
      Object.entries(searchDto).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });

      const response = await this.httpClient.get(`/content?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new HttpException(
        `Failed to search content: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async uploadMedia(file: Express.Multer.File) {
    try {
      const formData = new FormData();
      formData.append('file', new Blob([file.buffer]), file.originalname);

      const response = await this.httpClient.post('/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      throw new HttpException(
        `Failed to upload media: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getCourses(query: any = {}) {
    try {
      const params = new URLSearchParams();
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });

      const response = await this.httpClient.get(`/courses?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve courses: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createCourse(courseData: any) {
    try {
      const response = await this.httpClient.post('/courses', courseData);
      return response.data;
    } catch (error) {
      throw new HttpException(
        `Failed to create course: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateCourse(id: string, courseData: any) {
    try {
      const response = await this.httpClient.put(`/courses/${id}`, courseData);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new HttpException('Course not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        `Failed to update course: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteCourse(id: string) {
    try {
      await this.httpClient.delete(`/courses/${id}`);
    } catch (error) {
      if (error.response?.status === 404) {
        throw new HttpException('Course not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        `Failed to delete course: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getLessons(courseId: string) {
    try {
      const response = await this.httpClient.get(`/lessons?course_id=${courseId}`);
      return response.data;
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve lessons: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createLesson(lessonData: any) {
    try {
      const response = await this.httpClient.post('/lessons', lessonData);
      return response.data;
    } catch (error) {
      throw new HttpException(
        `Failed to create lesson: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getTemplates(type?: string) {
    try {
      const params = type ? `?type=${type}` : '';
      const response = await this.httpClient.get(`/templates${params}`);
      return response.data;
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve templates: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Health check method
  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.httpClient.get('/health');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}