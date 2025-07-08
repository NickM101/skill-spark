import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';

import { environment } from '../../../environments/environment';

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  get<T>(endpoint: string, params?: any): Observable<ApiResponse<T>> {
    const httpParams = this.buildHttpParams(params);
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, {
      params: httpParams,
    });
  }

  post<T>(
    endpoint: string,
    body: any,
    options: {
      headers?: HttpHeaders;
      params?: HttpParams;
      observe?: 'body';
      reportProgress?: boolean;
      responseType?: 'json';
      withCredentials?: boolean;
    } = {}
  ): Observable<ApiResponse<T>> {
    const defaultOptions = {
      observe: 'body' as const,
      responseType: 'json' as const,
      ...options,
    };

    return this.http.post<ApiResponse<T>>(
      `${this.baseUrl}${endpoint}`,
      body,
      defaultOptions
    );
  }

  put<T>(endpoint: string, body: any): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, body);
  }

  patch<T>(endpoint: string, body: any): Observable<ApiResponse<T>> {
    return this.http.patch<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, body);
  }

  delete<T>(endpoint: string): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(`${this.baseUrl}${endpoint}`);
  }

  upload<T>(endpoint: string, formData: FormData): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(
      `${this.baseUrl}${endpoint}`,
      formData
    );
  }

  // Extract data from API response
  extractData<T>(response: ApiResponse<T>): T | undefined {
    return response.data;
  }

  // Extract paginated data
  extractPaginatedData<T>(response: ApiResponse<T[]>): {
    items: T[];
    pagination: any;
  } {
    return {
      items: response.data || [],
      pagination: response.meta,
    };
  }

  private buildHttpParams(params?: any): HttpParams {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== null && params[key] !== undefined) {
          if (Array.isArray(params[key])) {
            params[key].forEach((value: any) => {
              httpParams = httpParams.append(key, value.toString());
            });
          } else {
            httpParams = httpParams.set(key, params[key].toString());
          }
        }
      });
    }

    return httpParams;
  }
}
