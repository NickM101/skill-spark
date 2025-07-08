// src/app/features/admin/modules/quizzes/services/quiz.service.ts

import { Injectable } from '@angular/core';
import { AddQuestionDto, Question } from '@core/models/question.model';
import { CreateQuizDto, Quiz, QuizFilters, UpdateQuizDto, QuizStats } from '@core/models/quiz.model';
import { ApiService } from '@core/services/api.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';


@Injectable({
  providedIn: 'root',
})
export class QuizService {
  private readonly endpoint = '/quizzes';

  constructor(private apiService: ApiService) {}

  /**
   * Create a new quiz for a course
   */
  createQuiz(courseId: string, quizData: CreateQuizDto): Observable<Quiz> {
    return this.apiService
      .post<Quiz>(`${this.endpoint}/courses/${courseId}/quizzes`, quizData)
      .pipe(map((response) => response.data));
  }

  /**
   * Get all quizzes for a course
   */
  getQuizzesByCourse(courseId: string): Observable<Quiz[]> {
    return this.apiService
      .get<Quiz[]>(`${this.endpoint}/courses/${courseId}/quizzes`)
      .pipe(map((response) => response.data || []));
  }

  /**
   * Get all quizzes with optional filters (admin view)
   */
  getAllQuizzes(
    filters?: QuizFilters
  ): Observable<{ quizzes: Quiz[]; pagination: any }> {
    const params = this.buildFilterParams(filters);
    return this.apiService.get<Quiz[]>(`${this.endpoint}`, params).pipe(
      map((response) => ({
        quizzes: response.data || [],
        pagination: response.meta,
      }))
    );
  }

  /**
   * Get a quiz by ID
   */
  getQuizById(quizId: string): Observable<Quiz> {
    return this.apiService
      .get<Quiz>(`${this.endpoint}/${quizId}`)
      .pipe(map((response) => response.data));
  }

  /**
   * Update a quiz
   */
  updateQuiz(quizId: string, quizData: UpdateQuizDto): Observable<Quiz> {
    return this.apiService
      .put<Quiz>(`${this.endpoint}/${quizId}`, quizData)
      .pipe(map((response) => response.data));
  }

  /**
   * Delete a quiz
   */
  deleteQuiz(quizId: string): Observable<void> {
    return this.apiService
      .delete<void>(`${this.endpoint}/${quizId}`)
      .pipe(map(() => undefined));
  }

  /**
   * Add a question to a quiz
   */
  addQuestion(
    quizId: string,
    questionData: AddQuestionDto
  ): Observable<Question> {
    return this.apiService
      .post<Question>(`${this.endpoint}/${quizId}/questions`, questionData)
      .pipe(map((response) => response.data));
  }

  /**
   * Publish a quiz
   */
  publishQuiz(quizId: string): Observable<Quiz> {
    return this.apiService
      .patch<Quiz>(`${this.endpoint}/${quizId}/publish`, {})
      .pipe(map((response) => response.data));
  }

  /**
   * Unpublish a quiz
   */
  unpublishQuiz(quizId: string): Observable<Quiz> {
    return this.apiService
      .patch<Quiz>(`${this.endpoint}/${quizId}/unpublish`, {})
      .pipe(map((response) => response.data));
  }

  /**
   * Get quiz statistics
   */
  getQuizStats(quizId: string): Observable<QuizStats> {
    return this.apiService
      .get<QuizStats>(`${this.endpoint}/${quizId}/stats`)
      .pipe(map((response) => response.data));
  }

  /**
   * Build filter parameters for API calls
   */
  private buildFilterParams(filters?: QuizFilters): any {
    if (!filters) return {};

    const params: any = {};

    if (filters.courseId) params.courseId = filters.courseId;
    if (filters.isPublished !== undefined)
      params.isPublished = filters.isPublished;
    if (filters.search) params.search = filters.search;
    if (filters.page) params.page = filters.page;
    if (filters.limit) params.limit = filters.limit;

    return params;
  }
}
