// API Service para comunicación con backend
// Adaptive Learning Ecosystem - EbroValley Digital

import { authService } from './auth.service';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  status: number;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/v1`;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      
      // Get authentication token if available
      const token = await authService.getValidAccessToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers as Record<string, string>,
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(url, {
        headers,
        ...options,
      });

      const data = await response.json();

      return {
        data,
        status: response.status,
      };
    } catch (error) {
      console.error('API Request Error:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 500,
      };
    }
  }

  // Health checks
  async checkGatewayHealth(): Promise<ApiResponse> {
    return this.request('/health');
  }

  async checkAiTutorHealth(): Promise<ApiResponse> {
    return this.request('/ai-tutor/health');
  }

  // AI-Tutor endpoints
  async generateDiagnostic(studentId: string): Promise<ApiResponse> {
    return this.request(
      `/ai-tutor/diagnostic/generate?student_id=${studentId}`,
      { method: 'POST' }
    );
  }

  async analyzeDiagnostic(studentId: string, responses: unknown[]): Promise<ApiResponse> {
    return this.request('/ai-tutor/diagnostic/analyze', {
      method: 'POST',
      body: JSON.stringify({
        student_id: studentId,
        responses,
      }),
    });
  }

  async getAdaptivePath(studentId: string, courseId?: string): Promise<ApiResponse> {
    const params = courseId ? `?course_id=${courseId}` : '';
    return this.request(`/ai-tutor/path/adaptive/${studentId}${params}`);
  }

  async generateFeedback(studentId: string, activityData: unknown): Promise<ApiResponse> {
    return this.request('/ai-tutor/feedback/realtime', {
      method: 'POST',
      body: JSON.stringify({
        student_id: studentId,
        activity_data: activityData,
      }),
    });
  }

  async getStudentProfile(studentId: string): Promise<ApiResponse> {
    return this.request(`/ai-tutor/students/${studentId}/profile`);
  }

  // Progress Tracking endpoints
  async updateProgress(progressData: {
    lesson_id: string;
    student_id: string;
    course_id: string;
    action: string;
    score?: number;
    time_spent_seconds?: number;
  }): Promise<ApiResponse> {
    return this.request('/progress/update', {
      method: 'POST',
      body: JSON.stringify(progressData),
    });
  }

  async getStudentProgress(studentId: string, courseId: string): Promise<ApiResponse> {
    return this.request(`/progress/student/${studentId}/course/${courseId}`);
  }

  async getStudentProgressSummary(studentId: string): Promise<ApiResponse> {
    return this.request(`/progress/student/${studentId}/summary`);
  }

  // Assessment endpoints
  async generateAssessment(params: {
    course_id: string;
    difficulty_level?: string;
    num_questions?: number;
    assessment_type?: string;
  }): Promise<ApiResponse> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    return this.request(`/assessments/generate?${queryParams.toString()}`, {
      method: 'POST',
    });
  }

  async getAssessment(assessmentId: string, includeAnswers: boolean = false): Promise<ApiResponse> {
    const query = includeAnswers ? '?include_answers=true' : '';
    return this.request(`/assessments/${assessmentId}${query}`);
  }

  async submitAssessment(assessmentId: string, submission: unknown): Promise<ApiResponse> {
    return this.request(`/assessments/${assessmentId}/submit`, {
      method: 'POST',
      body: JSON.stringify(submission),
    });
  }

  // Health check methods for service monitoring
  async checkProgressHealth(): Promise<ApiResponse> {
    return this.request('/progress/health');
  }

  async checkAssessmentHealth(): Promise<ApiResponse> {
    return this.request('/assessments/health');
  }
}

export const apiService = new ApiService();
export default apiService;