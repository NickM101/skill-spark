import { Injectable } from '@angular/core';
import { ApiService } from '@core/services/api.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  status: string;
  // Add other properties as needed
}

export interface CreateEnrollmentDto {
  courseId: string;
  // Add other properties as needed
}

export interface UpdateEnrollmentDto {
  status?: string;
  // Add other properties as needed
}

@Injectable({
  providedIn: 'root',
})
export class EnrollmentService {
  private readonly endpoint = '/enrollments'; // Adjust the endpoint as needed

  constructor(private apiService: ApiService) {}

  create(createEnrollmentDto: CreateEnrollmentDto): Observable<Enrollment> {
    return this.apiService
      .post<Enrollment>(this.endpoint, createEnrollmentDto)
      .pipe(
        map((response) => this.apiService.extractData<Enrollment>(response)!)
      );
  }

  findAll(
    page: number = 1,
    limit: number = 10,
    role?: string,
    userId?: string,
    courseId?: string,
    status?: string
  ): Observable<{
    enrollments: Enrollment[];
    page: number;
    limit: number;
    total: number;
  }> {
    const params = { page, limit, role, userId, courseId, status };
    return this.apiService.get<Enrollment[]>(this.endpoint, params).pipe(
      map((response) => {
        const paginatedData =
          this.apiService.extractPaginatedData<Enrollment>(response);
        return {
          enrollments: paginatedData.items,
          page: paginatedData.pagination.page,
          limit: paginatedData.pagination.limit,
          total: paginatedData.pagination.total,
        };
      })
    );
  }

  getMyEnrollments(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Observable<{
    enrollments: Enrollment[];
    page: number;
    limit: number;
    total: number;
  }> {
    const params = { page, limit };
    return this.apiService
      .get<Enrollment[]>(`${this.endpoint}/my-enrollments`, params)
      .pipe(
        map((response) => {
          const paginatedData =
            this.apiService.extractPaginatedData<Enrollment>(response);
          return {
            enrollments: paginatedData.items,
            page: paginatedData.pagination.page,
            limit: paginatedData.pagination.limit,
            total: paginatedData.pagination.total,
          };
        })
      );
  }

  getCourseEnrollments(
    courseId: string,
    userId: string,
    page: number = 1,
    limit: number = 10,
    role?: string
  ): Observable<{
    enrollments: Enrollment[];
    page: number;
    limit: number;
    total: number;
  }> {
    const params = { page, limit, role };
    return this.apiService
      .get<Enrollment[]>(`${this.endpoint}/course/${courseId}`, params)
      .pipe(
        map((response) => {
          const paginatedData =
            this.apiService.extractPaginatedData<Enrollment>(response);
          return {
            enrollments: paginatedData.items,
            page: paginatedData.pagination.page,
            limit: paginatedData.pagination.limit,
            total: paginatedData.pagination.total,
          };
        })
      );
  }

  findOne(id: string, role?: string, userId?: string): Observable<Enrollment> {
    return this.apiService
      .get<Enrollment>(`${this.endpoint}/${id}`)
      .pipe(
        map((response) => this.apiService.extractData<Enrollment>(response)!)
      );
  }

  getProgress(id: string, role?: string, userId?: string): Observable<any> {
    return this.apiService
      .get<any>(`${this.endpoint}/${id}/progress`)
      .pipe(map((response) => this.apiService.extractData<any>(response)!));
  }

  update(
    id: string,
    updateEnrollmentDto: UpdateEnrollmentDto,
    role?: string,
    userId?: string
  ): Observable<Enrollment> {
    return this.apiService
      .patch<Enrollment>(`${this.endpoint}/${id}`, updateEnrollmentDto)
      .pipe(
        map((response) => this.apiService.extractData<Enrollment>(response)!)
      );
  }

  remove(id: string, role?: string, userId?: string): Observable<void> {
    return this.apiService
      .delete<void>(`${this.endpoint}/${id}`)
      .pipe(map((response) => this.apiService.extractData<void>(response)));
  }
}
