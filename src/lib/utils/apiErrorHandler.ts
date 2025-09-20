// API Error Handling Utilities

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
}

export class ApiErrorHandler {
  /**
   * Convert fetch response to user-friendly error message
   */
  static async handleResponse(response: Response): Promise<any> {
    if (!response.ok) {
      let errorMessage = 'An unexpected error occurred';
      let errorDetails = null;

      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
        errorDetails = errorData.details || errorData;
      } catch {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }

      const apiError: ApiError = {
        message: this.getUserFriendlyMessage(response.status, errorMessage),
        status: response.status,
        details: errorDetails
      };

      throw apiError;
    }

    return response.json();
  }

  /**
   * Convert technical error messages to user-friendly ones
   */
  static getUserFriendlyMessage(status: number, originalMessage: string): string {
    // Common HTTP status codes
    switch (status) {
      case 400:
        if (originalMessage.toLowerCase().includes('url')) {
          return 'Please provide a valid YouTube video URL';
        }
        if (originalMessage.toLowerCase().includes('transcript')) {
          return 'Unable to extract transcript from this video. Please try a different video.';
        }
        return 'Invalid request. Please check your input and try again.';

      case 401:
        return 'Authentication required. Please log in and try again.';

      case 403:
        return 'You don\'t have permission to perform this action.';

      case 404:
        if (originalMessage.toLowerCase().includes('lesson')) {
          return 'Lesson not found. It may have been deleted or moved.';
        }
        return 'The requested resource was not found.';

      case 409:
        if (originalMessage.toLowerCase().includes('lesson')) {
          return 'A lesson for this video already exists.';
        }
        return 'This action conflicts with existing data.';

      case 422:
        if (originalMessage.toLowerCase().includes('validation')) {
          return 'The provided data is invalid. Please check your input.';
        }
        if (originalMessage.toLowerCase().includes('content')) {
          return 'Unable to generate lesson content. Please try a different video.';
        }
        return 'Unable to process your request. Please check your input.';

      case 429:
        return 'Too many requests. Please wait a moment and try again.';

      case 500:
        if (originalMessage.toLowerCase().includes('ai') || originalMessage.toLowerCase().includes('generation')) {
          return 'AI service is temporarily unavailable. Please try again later.';
        }
        if (originalMessage.toLowerCase().includes('database')) {
          return 'Database error. Please try again later.';
        }
        return 'Server error. Please try again later.';

      case 502:
      case 503:
      case 504:
        return 'Service temporarily unavailable. Please try again in a few minutes.';

      default:
        // For unknown status codes, try to make the original message more user-friendly
        if (originalMessage.toLowerCase().includes('network')) {
          return 'Network error. Please check your connection and try again.';
        }
        if (originalMessage.toLowerCase().includes('timeout')) {
          return 'Request timed out. Please try again.';
        }
        return originalMessage || 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Handle network and other fetch errors
   */
  static handleFetchError(error: any): ApiError {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        message: 'Network error. Please check your internet connection and try again.',
        status: 0,
        code: 'NETWORK_ERROR'
      };
    }

    if (error.name === 'AbortError') {
      return {
        message: 'Request was cancelled. Please try again.',
        status: 0,
        code: 'ABORTED'
      };
    }

    if (error.message?.includes('timeout')) {
      return {
        message: 'Request timed out. Please try again.',
        status: 0,
        code: 'TIMEOUT'
      };
    }

    // If it's already an ApiError, return as is
    if (error.status && error.message) {
      return error;
    }

    return {
      message: error.message || 'An unexpected error occurred',
      status: 0,
      code: 'UNKNOWN_ERROR'
    };
  }

  /**
   * Retry logic for failed requests
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Don't retry on client errors (4xx) except for 429 (rate limit)
        if (error.status >= 400 && error.status < 500 && error.status !== 429) {
          throw error;
        }

        if (attempt === maxRetries) {
          throw error;
        }

        // Exponential backoff
        const waitTime = delay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    throw lastError;
  }
}

/**
 * Enhanced fetch wrapper with error handling and retry logic
 */
export async function apiRequest<T = any>(
  url: string,
  options: RequestInit = {},
  retries: number = 2
): Promise<T> {
  const operation = async () => {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    return ApiErrorHandler.handleResponse(response);
  };

  try {
    return await ApiErrorHandler.withRetry(operation, retries);
  } catch (error) {
    throw ApiErrorHandler.handleFetchError(error);
  }
}
