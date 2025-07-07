import { Injectable } from '@nestjs/common';
import {
  ApiResponse,
  ApiErrorResponse,
} from './interfaces/api-rensponse.interface';

@Injectable()
export class ApiResponseService {
  /**
   * Create a successful API response
   */
  success<T>(
    data: T,
    message: string = 'Operation successful',
  ): ApiResponse<T> {
    return {
      message,
      data,
    };
  }

  /**
   * Create an error API response
   */
  error(
    message: string,
    errorCode: string = 'INTERNAL_SERVER_ERROR',
    details?: any[],
  ): ApiErrorResponse {
    return {
      message,
      error: {
        code: errorCode,
        details,
      },
    };
  }

  /**
   * Create a paginated response
   */
  paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    message: string = 'Data retrieved successfully',
  ): ApiResponse<T[]> {
    const totalPages = Math.ceil(total / limit);

    return {
      message,
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Create a response with no data
   */
  noData(message: string = 'No data found'): ApiResponse {
    return {
      message,
    };
  }

  /**
   * Create a validation error response
   */
  validationError(
    errors: string[] | object[],
    message: string = 'Validation failed',
  ): ApiErrorResponse {
    return {
      message,
      error: {
        code: 'VALIDATION_ERROR',
        details: Array.isArray(errors) ? errors : [errors],
      },
    };
  }

  /**
   * Create an unauthorized response
   */
  unauthorized(message: string = 'Unauthorized access'): ApiErrorResponse {
    return {
      message,
      error: {
        code: 'UNAUTHORIZED',
        details: ['Authentication required'],
      },
    };
  }

  /**
   * Create a forbidden response
   */
  forbidden(message: string = 'Access forbidden'): ApiErrorResponse {
    return {
      message,
      error: {
        code: 'FORBIDDEN',
        details: ['Insufficient permissions'],
      },
    };
  }

  /**
   * Create a not found response
   */
  notFound(
    message: string = 'Resource not found',
    resourceType: string = 'resource',
  ): ApiErrorResponse {
    return {
      message,
      error: {
        code: 'NOT_FOUND',
        details: [`The requested ${resourceType} was not found`],
      },
    };
  }
}
