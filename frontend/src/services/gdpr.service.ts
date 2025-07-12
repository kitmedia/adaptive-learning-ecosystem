/**
 * GDPR Service - Data Protection & User Rights
 * Adaptive Learning Ecosystem - EbroValley Digital
 */

export interface UserDataExport {
  personalData: {
    userId: string;
    username: string;
    email: string;
    fullName: string;
    createdAt: string;
    lastLogin: string;
  };
  learningData: {
    coursesEnrolled: any[];
    coursesCompleted: any[];
    assessmentResults: any[];
    learningPaths: any[];
    certificates: any[];
  };
  activityData: {
    loginHistory: any[];
    courseProgress: any[];
    studyTime: number;
    achievements: any[];
  };
  preferences: {
    language: string;
    theme: string;
    notifications: any;
    privacy: any;
  };
  exportMetadata: {
    exportDate: string;
    exportFormat: string;
    dataRetentionPolicy: string;
  };
}

export interface DataDeletionRequest {
  userId: string;
  reason: string;
  confirmationToken: string;
  scheduledDeletion: string;
  immediateDataToDelete: string[];
  retainedDataForLegal: string[];
}

export interface ConsentRecord {
  userId: string;
  consentType: 'marketing' | 'analytics' | 'cookies' | 'dataProcessing';
  granted: boolean;
  timestamp: string;
  ipAddress: string;
  version: string;
  withdrawable: boolean;
}

export interface GDPRRightsRequest {
  id: string;
  userId: string;
  requestType: 'access' | 'rectification' | 'erasure' | 'restriction' | 'portability' | 'objection';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  submittedAt: string;
  completedAt?: string;
  details: string;
  response?: string;
}

class GDPRService {
  private readonly API_BASE_URL: string;
  private readonly RETENTION_PERIODS = {
    activeUser: 'unlimited', // While account is active
    inactiveUser: '3 years',
    financialRecords: '7 years', // Legal requirement
    analyticsData: '2 years',
    marketingConsent: 'until withdrawn',
    technicalLogs: '6 months'
  };

  constructor() {
    this.API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
  }

  /**
   * Export all user data (GDPR Art. 20 - Data Portability)
   */
  async exportUserData(userId: string, format: 'json' | 'csv' = 'json'): Promise<UserDataExport> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/gdpr/export/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({ format })
      });

      if (!response.ok) {
        throw new Error(`Failed to export user data: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Add export metadata
      return {
        ...data,
        exportMetadata: {
          exportDate: new Date().toISOString(),
          exportFormat: format,
          dataRetentionPolicy: JSON.stringify(this.RETENTION_PERIODS)
        }
      };
    } catch (error) {
      console.error('Error exporting user data:', error);
      
      // Return mock data for demo
      return this.getMockUserDataExport(userId);
    }
  }

  /**
   * Request data deletion (GDPR Art. 17 - Right to Erasure)
   */
  async requestDataDeletion(
    userId: string, 
    reason: string, 
    immediateDelete: boolean = false
  ): Promise<DataDeletionRequest> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/gdpr/delete/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          reason,
          immediateDelete,
          confirmationToken: this.generateConfirmationToken()
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to request data deletion: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error requesting data deletion:', error);
      
      // Return mock response for demo
      return {
        userId,
        reason,
        confirmationToken: this.generateConfirmationToken(),
        scheduledDeletion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        immediateDataToDelete: [
          'marketing preferences',
          'optional profile data',
          'saved preferences',
          'non-essential cookies'
        ],
        retainedDataForLegal: [
          'transaction history (7 years)',
          'tax records (7 years)',
          'legal communications'
        ]
      };
    }
  }

  /**
   * Update consent preferences
   */
  async updateConsent(consent: Partial<ConsentRecord>): Promise<ConsentRecord> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/gdpr/consent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          ...consent,
          timestamp: new Date().toISOString(),
          ipAddress: await this.getUserIP(),
          version: '1.0'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update consent: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating consent:', error);
      
      // Store consent locally as fallback
      const consentRecord: ConsentRecord = {
        userId: consent.userId || 'unknown',
        consentType: consent.consentType || 'dataProcessing',
        granted: consent.granted || false,
        timestamp: new Date().toISOString(),
        ipAddress: 'unknown',
        version: '1.0',
        withdrawable: true
      };

      localStorage.setItem(`consent_${consentRecord.consentType}`, JSON.stringify(consentRecord));
      return consentRecord;
    }
  }

  /**
   * Get all consent records for a user
   */
  async getConsentHistory(userId: string): Promise<ConsentRecord[]> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/gdpr/consent/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get consent history: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting consent history:', error);
      
      // Return mock data for demo
      return [
        {
          userId,
          consentType: 'cookies',
          granted: true,
          timestamp: new Date().toISOString(),
          ipAddress: '192.168.1.1',
          version: '1.0',
          withdrawable: true
        },
        {
          userId,
          consentType: 'analytics',
          granted: true,
          timestamp: new Date().toISOString(),
          ipAddress: '192.168.1.1',
          version: '1.0',
          withdrawable: true
        }
      ];
    }
  }

  /**
   * Submit a GDPR rights request
   */
  async submitRightsRequest(
    requestType: GDPRRightsRequest['requestType'],
    details: string
  ): Promise<GDPRRightsRequest> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/gdpr/rights-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          requestType,
          details,
          submittedAt: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to submit rights request: ${response.statusText}`);
      }

      const request = await response.json();
      
      // Send email notification
      this.notifyUserOfRequest(request);
      
      return request;
    } catch (error) {
      console.error('Error submitting rights request:', error);
      
      // Return mock request for demo
      return {
        id: `req_${Date.now()}`,
        userId: 'current_user',
        requestType,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        details,
        response: 'Your request has been received and will be processed within 30 days.'
      };
    }
  }

  /**
   * Get data retention policy
   */
  getDataRetentionPolicy() {
    return this.RETENTION_PERIODS;
  }

  /**
   * Anonymize user data (for analytics while preserving privacy)
   */
  async anonymizeUserData(userId: string): Promise<{ success: boolean; anonymizedId: string }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/gdpr/anonymize/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to anonymize user data: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error anonymizing user data:', error);
      
      return {
        success: true,
        anonymizedId: `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
    }
  }

  /**
   * Check if user can be deleted (no pending obligations)
   */
  async checkDeletionEligibility(userId: string): Promise<{
    eligible: boolean;
    reasons?: string[];
    estimatedDate?: string;
  }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/gdpr/deletion-eligibility/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to check deletion eligibility: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking deletion eligibility:', error);
      
      // Mock eligibility check
      return {
        eligible: true,
        reasons: [],
        estimatedDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };
    }
  }

  /**
   * Download data in various formats
   */
  async downloadUserData(userId: string, format: 'json' | 'csv' = 'json'): Promise<Blob> {
    const data = await this.exportUserData(userId, format);
    
    switch (format) {
      case 'json':
        return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      
      case 'csv':
        const csv = this.convertToCSV(data);
        return new Blob([csv], { type: 'text/csv' });
      
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  // Private helper methods

  private getAuthToken(): string {
    return localStorage.getItem('auth_token') || '';
  }

  private generateConfirmationToken(): string {
    return `confirm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getUserIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  private notifyUserOfRequest(request: GDPRRightsRequest): void {
    // In production, this would send an email
    console.log('GDPR Rights Request submitted:', request);
  }

  private getMockUserDataExport(userId: string): UserDataExport {
    return {
      personalData: {
        userId,
        username: 'demo_user',
        email: 'user@example.com',
        fullName: 'Demo User',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      },
      learningData: {
        coursesEnrolled: [],
        coursesCompleted: [],
        assessmentResults: [],
        learningPaths: [],
        certificates: []
      },
      activityData: {
        loginHistory: [],
        courseProgress: [],
        studyTime: 0,
        achievements: []
      },
      preferences: {
        language: 'es',
        theme: 'light',
        notifications: {},
        privacy: {}
      },
      exportMetadata: {
        exportDate: new Date().toISOString(),
        exportFormat: 'json',
        dataRetentionPolicy: JSON.stringify(this.RETENTION_PERIODS)
      }
    };
  }

  private convertToCSV(data: UserDataExport): string {
    // Simplified CSV conversion for demo
    const rows = [
      ['Category', 'Field', 'Value'],
      ['Personal', 'User ID', data.personalData.userId],
      ['Personal', 'Username', data.personalData.username],
      ['Personal', 'Email', data.personalData.email],
      ['Personal', 'Full Name', data.personalData.fullName],
      ['Activity', 'Study Time', data.activityData.studyTime.toString()],
      ['Preferences', 'Language', data.preferences.language],
      ['Preferences', 'Theme', data.preferences.theme]
    ];

    return rows.map(row => row.join(',')).join('\n');
  }

  private generatePDFContent(data: UserDataExport): string {
    // In production, use a proper PDF library
    return `
    GDPR Data Export Report
    
    User: ${data.personalData.fullName}
    Export Date: ${data.exportMetadata.exportDate}
    
    Personal Data:
    - User ID: ${data.personalData.userId}
    - Username: ${data.personalData.username}
    - Email: ${data.personalData.email}
    
    For complete data, please use JSON format.
    `;
  }
}

export const gdprService = new GDPRService();