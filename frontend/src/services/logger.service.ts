/**
 * Logger Service
 * Adaptive Learning Ecosystem - EbroValley Digital
 * Enterprise-grade structured logging with multiple transports
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';
type LogCategory = 'system' | 'user' | 'api' | 'security' | 'performance' | 'business';

interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  category: LogCategory;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  stackTrace?: string;
  tags?: string[];
}

interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  enableLocalStorage: boolean;
  bufferSize: number;
  flushInterval: number; // milliseconds
  retentionDays: number;
  endpoints: {
    logs: string;
    errors: string;
    analytics: string;
  };
  sensitiveFields: string[];
}

class LoggerService {
  private static instance: LoggerService;
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private sessionId: string;
  private flushTimer: NodeJS.Timeout | null = null;
  private readonly LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    critical: 4
  };

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.config = {
      enabled: true,
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      enableConsole: process.env.NODE_ENV !== 'production',
      enableRemote: process.env.NODE_ENV === 'production',
      enableLocalStorage: true,
      bufferSize: 100,
      flushInterval: 30000, // 30 seconds
      retentionDays: 7,
      endpoints: {
        logs: '/api/logs',
        errors: '/api/errors',
        analytics: '/api/analytics/events'
      },
      sensitiveFields: ['password', 'token', 'secret', 'key', 'authorization', 'ssn', 'credit_card']
    };

    this.initialize();
  }

  static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  private initialize(): void {
    if (!this.config.enabled) return;

    // Start flush timer
    this.startFlushTimer();

    // Cleanup old logs on startup
    this.cleanupOldLogs();

    // Handle page unload
    window.addEventListener('beforeunload', () => {
      this.flush();
    });

    // Handle visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.flush();
      }
    });

    this.info('system', 'Logger Service initialized', {
      sessionId: this.sessionId,
      config: {
        level: this.config.level,
        enableConsole: this.config.enableConsole,
        enableRemote: this.config.enableRemote
      }
    });
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return this.config.enabled && 
           this.LOG_LEVELS[level] >= this.LOG_LEVELS[this.config.level];
  }

  private sanitizeContext(context: Record<string, any>): Record<string, any> {
    const sanitized = { ...context };
    
    const sanitizeObject = (obj: any, path = ''): any => {
      if (typeof obj !== 'object' || obj === null) {
        return obj;
      }

      if (Array.isArray(obj)) {
        return obj.map((item, index) => sanitizeObject(item, `${path}[${index}]`));
      }

      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        
        // Check if field is sensitive
        if (this.config.sensitiveFields.some(field => 
          key.toLowerCase().includes(field.toLowerCase()) ||
          currentPath.toLowerCase().includes(field.toLowerCase())
        )) {
          result[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
          result[key] = sanitizeObject(value, currentPath);
        } else {
          result[key] = value;
        }
      }
      return result;
    };

    return sanitizeObject(sanitized);
  }

  private createLogEntry(
    level: LogLevel,
    category: LogCategory,
    message: string,
    context?: Record<string, any>,
    stackTrace?: string
  ): LogEntry {
    return {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      level,
      category,
      message,
      context: context ? this.sanitizeContext(context) : undefined,
      userId: this.getCurrentUserId(),
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      url: window.location.href,
      stackTrace,
      tags: this.generateTags(level, category, message)
    };
  }

  private getCurrentUserId(): string | undefined {
    // Try to get user ID from various sources
    return localStorage.getItem('userId') || 
           sessionStorage.getItem('userId') || 
           undefined;
  }

  private generateTags(level: LogLevel, category: LogCategory, message: string): string[] {
    const tags: string[] = [level, category];
    
    // Add automatic tags based on content
    if (message.toLowerCase().includes('api')) tags.push('api');
    if (message.toLowerCase().includes('user')) tags.push('user-action');
    if (message.toLowerCase().includes('error')) tags.push('error');
    if (message.toLowerCase().includes('performance')) tags.push('performance');
    if (message.toLowerCase().includes('security')) tags.push('security');
    
    return tags;
  }

  private log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    context?: Record<string, any>,
    stackTrace?: string
  ): void {
    if (!this.shouldLog(level)) return;

    const logEntry = this.createLogEntry(level, category, message, context, stackTrace);

    // Console logging
    if (this.config.enableConsole) {
      this.logToConsole(logEntry);
    }

    // Add to buffer
    this.logBuffer.push(logEntry);

    // Local storage for critical logs
    if (this.config.enableLocalStorage && level === 'critical') {
      this.logToLocalStorage(logEntry);
    }

    // Immediate flush for critical errors
    if (level === 'critical' || level === 'error') {
      this.flush();
    }

    // Check buffer size
    if (this.logBuffer.length >= this.config.bufferSize) {
      this.flush();
    }
  }

  private logToConsole(entry: LogEntry): void {
    const emoji = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      critical: '🚨'
    };

    const style = {
      debug: 'color: #666',
      info: 'color: #2196F3',
      warn: 'color: #FF9800',
      error: 'color: #F44336',
      critical: 'color: #F44336; font-weight: bold; background: #FFE0E0'
    };

    const prefix = `${emoji[entry.level]} [${new Date(entry.timestamp).toISOString()}] [${entry.category.toUpperCase()}]`;
    
    console.groupCollapsed(`%c${prefix} ${entry.message}`, style[entry.level]);
    
    if (entry.context) {
      console.log('Context:', entry.context);
    }
    
    if (entry.stackTrace) {
      console.log('Stack:', entry.stackTrace);
    }
    
    console.log('Entry:', entry);
    console.groupEnd();
  }

  private logToLocalStorage(entry: LogEntry): void {
    try {
      const logs = JSON.parse(localStorage.getItem('app_logs') || '[]');
      logs.push(entry);
      
      // Keep only last 50 critical logs
      if (logs.length > 50) {
        logs.splice(0, logs.length - 50);
      }
      
      localStorage.setItem('app_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to save log to localStorage:', error);
    }
  }

  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private async flush(): Promise<void> {
    if (this.logBuffer.length === 0 || !this.config.enableRemote) return;

    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];

    try {
      await fetch(this.config.endpoints.logs, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          logs: logsToSend,
          meta: {
            sessionId: this.sessionId,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            url: window.location.href
          }
        })
      });

      console.log(`📤 Flushed ${logsToSend.length} logs to remote endpoint`);
    } catch (error) {
      console.error('Failed to flush logs:', error);
      
      // Put logs back in buffer on failure
      this.logBuffer.unshift(...logsToSend);
      
      // Prevent buffer from growing too large
      if (this.logBuffer.length > this.config.bufferSize * 2) {
        this.logBuffer = this.logBuffer.slice(-this.config.bufferSize);
      }
    }
  }

  private cleanupOldLogs(): void {
    try {
      const logs = JSON.parse(localStorage.getItem('app_logs') || '[]');
      const cutoffTime = Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000);
      
      const filteredLogs = logs.filter((log: LogEntry) => log.timestamp > cutoffTime);
      localStorage.setItem('app_logs', JSON.stringify(filteredLogs));
      
      if (logs.length !== filteredLogs.length) {
        this.info('system', `Cleaned up ${logs.length - filteredLogs.length} old logs`);
      }
    } catch (error) {
      console.error('Failed to cleanup old logs:', error);
    }
  }

  // Public API methods
  public debug(category: LogCategory, message: string, context?: Record<string, any>): void {
    this.log('debug', category, message, context);
  }

  public info(category: LogCategory, message: string, context?: Record<string, any>): void {
    this.log('info', category, message, context);
  }

  public warn(category: LogCategory, message: string, context?: Record<string, any>): void {
    this.log('warn', category, message, context);
  }

  public error(category: LogCategory, message: string, context?: Record<string, any>, error?: Error): void {
    this.log('error', category, message, context, error?.stack);
  }

  public critical(category: LogCategory, message: string, context?: Record<string, any>, error?: Error): void {
    this.log('critical', category, message, context, error?.stack);
  }

  // Specialized logging methods
  public logUserAction(action: string, context?: Record<string, any>): void {
    this.info('user', `User action: ${action}`, context);
  }

  public logAPICall(method: string, url: string, duration: number, status: number): void {
    this.info('api', `API ${method} ${url}`, {
      method,
      url,
      duration,
      status,
      success: status >= 200 && status < 400
    });
  }

  public logPerformance(metric: string, value: number, context?: Record<string, any>): void {
    this.info('performance', `Performance metric: ${metric}`, {
      metric,
      value,
      ...context
    });
  }

  public logSecurity(event: string, context?: Record<string, any>): void {
    this.warn('security', `Security event: ${event}`, context);
  }

  public logBusiness(event: string, context?: Record<string, any>): void {
    this.info('business', `Business event: ${event}`, context);
  }

  // Utility methods
  public setUserId(userId: string): void {
    localStorage.setItem('userId', userId);
    this.info('system', 'User ID set', { userId });
  }

  public setLogLevel(level: LogLevel): void {
    this.config.level = level;
    this.info('system', `Log level changed to ${level}`);
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public getLogs(): LogEntry[] {
    try {
      return JSON.parse(localStorage.getItem('app_logs') || '[]');
    } catch {
      return [];
    }
  }

  public clearLogs(): void {
    localStorage.removeItem('app_logs');
    this.logBuffer = [];
    this.info('system', 'Logs cleared');
  }

  public exportLogs(): string {
    const logs = this.getLogs();
    return JSON.stringify(logs, null, 2);
  }

  public async forceFlush(): Promise<void> {
    await this.flush();
  }

  public destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush();
  }
}

// Export singleton instance
export const logger = LoggerService.getInstance();

// Export convenience methods
export const log = {
  debug: (category: LogCategory, message: string, context?: Record<string, any>) => 
    logger.debug(category, message, context),
  info: (category: LogCategory, message: string, context?: Record<string, any>) => 
    logger.info(category, message, context),
  warn: (category: LogCategory, message: string, context?: Record<string, any>) => 
    logger.warn(category, message, context),
  error: (category: LogCategory, message: string, context?: Record<string, any>, error?: Error) => 
    logger.error(category, message, context, error),
  critical: (category: LogCategory, message: string, context?: Record<string, any>, error?: Error) => 
    logger.critical(category, message, context, error),
  
  // Specialized methods
  user: (action: string, context?: Record<string, any>) => 
    logger.logUserAction(action, context),
  api: (method: string, url: string, duration: number, status: number) => 
    logger.logAPICall(method, url, duration, status),
  performance: (metric: string, value: number, context?: Record<string, any>) => 
    logger.logPerformance(metric, value, context),
  security: (event: string, context?: Record<string, any>) => 
    logger.logSecurity(event, context),
  business: (event: string, context?: Record<string, any>) => 
    logger.logBusiness(event, context)
};

export default logger;