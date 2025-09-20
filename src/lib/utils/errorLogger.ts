// Error logging and monitoring utilities

export interface ErrorLogEntry {
  id: string;
  timestamp: Date;
  level: 'error' | 'warn' | 'info';
  message: string;
  stack?: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
}

class ErrorLogger {
  private logs: ErrorLogEntry[] = [];
  private maxLogs = 100;

  /**
   * Log an error with context
   */
  logError(
    error: Error | string,
    context?: Record<string, any>,
    level: 'error' | 'warn' | 'info' = 'error'
  ): void {
    const logEntry: ErrorLogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      level,
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      context,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    };

    // Add to local storage
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest log
    }

    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🔴 ${level.toUpperCase()}: ${logEntry.message}`);
      console.log('Timestamp:', logEntry.timestamp.toISOString());
      if (logEntry.stack) console.log('Stack:', logEntry.stack);
      if (context) console.log('Context:', context);
      console.groupEnd();
    }

    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('errorLogs', JSON.stringify(this.logs.slice(-50))); // Keep last 50
      } catch (e) {
        console.warn('Failed to store error logs in localStorage');
      }
    }

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(logEntry);
    }
  }

  /**
   * Log API errors specifically
   */
  logApiError(
    endpoint: string,
    method: string,
    status: number,
    error: any,
    requestData?: any
  ): void {
    this.logError(error, {
      type: 'API_ERROR',
      endpoint,
      method,
      status,
      requestData: requestData ? JSON.stringify(requestData) : undefined,
    });
  }

  /**
   * Log component errors
   */
  logComponentError(
    componentName: string,
    error: Error,
    props?: any,
    state?: any
  ): void {
    this.logError(error, {
      type: 'COMPONENT_ERROR',
      componentName,
      props: props ? JSON.stringify(props) : undefined,
      state: state ? JSON.stringify(state) : undefined,
    });
  }

  /**
   * Log user actions for debugging
   */
  logUserAction(action: string, data?: Record<string, any>): void {
    this.logError(`User action: ${action}`, {
      type: 'USER_ACTION',
      ...data,
    }, 'info');
  }

  /**
   * Get recent logs
   */
  getLogs(level?: 'error' | 'warn' | 'info'): ErrorLogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('errorLogs');
    }
  }

  /**
   * Load logs from localStorage
   */
  loadLogs(): void {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('errorLogs');
        if (stored) {
          this.logs = JSON.parse(stored);
        }
      } catch (e) {
        console.warn('Failed to load error logs from localStorage');
      }
    }
  }

  /**
   * Generate unique ID for log entries
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Send error to monitoring service (placeholder)
   */
  private async sendToMonitoringService(logEntry: ErrorLogEntry): Promise<void> {
    try {
      // In a real app, you would send to services like:
      // - Sentry
      // - LogRocket
      // - Datadog
      // - Custom logging endpoint
      
      // Example implementation:
      /*
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry),
      });
      */
      
      console.log('Would send to monitoring service:', logEntry);
    } catch (error) {
      console.warn('Failed to send error to monitoring service:', error);
    }
  }
}

// Singleton instance
export const errorLogger = new ErrorLogger();

// Initialize on client side
if (typeof window !== 'undefined') {
  errorLogger.loadLogs();

  // Global error handler
  window.addEventListener('error', (event) => {
    errorLogger.logError(event.error || event.message, {
      type: 'GLOBAL_ERROR',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    errorLogger.logError(event.reason, {
      type: 'UNHANDLED_PROMISE_REJECTION',
    });
  });
}

// Utility functions
export function logError(error: Error | string, context?: Record<string, any>): void {
  errorLogger.logError(error, context);
}

export function logApiError(
  endpoint: string,
  method: string,
  status: number,
  error: any,
  requestData?: any
): void {
  errorLogger.logApiError(endpoint, method, status, error, requestData);
}

export function logComponentError(
  componentName: string,
  error: Error,
  props?: any,
  state?: any
): void {
  errorLogger.logComponentError(componentName, error, props, state);
}

export function logUserAction(action: string, data?: Record<string, any>): void {
  errorLogger.logUserAction(action, data);
}
