import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';

import { ApiService } from '@core/services/api.service';
import {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CategoryListResponse,
} from '@core/models/category.model';

export interface CategorySearchParams {
  page?: number;
  limit?: number;
  search?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  public categories$ = this.categoriesSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private apiService: ApiService) {}

  // ----------------------
  // Public CRUD Methods
  // ----------------------

  /**
   * Get all categories with optional pagination and search
   */
  getCategories(params: CategorySearchParams = {}): Observable<CategoryListResponse> {
    this.loadingSubject.next(true);

    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 10,
      ...(params.search && { search: params.search }),
    };

    return this.apiService.get<Category[]>('/categories', queryParams).pipe(
      map(response => {
        const { items, pagination } = this.apiService.extractPaginatedData(response);
        
        // Update local state
        this.categoriesSubject.next(items);

        return {
          categories: items,
          total: pagination.total,
          page: pagination.page,
          limit: pagination.limit,
          totalPages: pagination.totalPages,
        };
      }),
      tap(() => this.loadingSubject.next(false)),
      catchError(error => {
        this.loadingSubject.next(false);
        throw error;
      })
    );
  }

  /**
   * Get a single category by ID
   */
  getCategoryById(id: string): Observable<Category | null> {
    this.loadingSubject.next(true);

    return this.apiService.get<Category>(`/categories/${id}`).pipe(
      map(response => this.apiService.extractData(response) || null),
      tap(() => this.loadingSubject.next(false)),
      catchError(error => {
        this.loadingSubject.next(false);
        throw error;
      })
    );
  }

  /**
   * Create a new category (Admin only)
   */
  createCategory(request: CreateCategoryRequest): Observable<Category> {
    this.loadingSubject.next(true);

    const createDto = {
      name: request.name,
      description: request.description || '',
    };

    return this.apiService.post<Category>('/categories', createDto).pipe(
      map(response => {
        const newCategory = this.apiService.extractData(response)!;
        
        // Update local state
        const currentCategories = this.categoriesSubject.value;
        this.categoriesSubject.next([...currentCategories, newCategory]);
        
        return newCategory;
      }),
      tap(() => this.loadingSubject.next(false)),
      catchError(error => {
        this.loadingSubject.next(false);
        throw error;
      })
    );
  }

  /**
   * Update an existing category (Admin only)
   */
  updateCategory(request: UpdateCategoryRequest): Observable<Category> {
    this.loadingSubject.next(true);

    const updateDto = {
      ...(request.name && { name: request.name }),
      ...(request.description !== undefined && { description: request.description }),
    };

    return this.apiService.patch<Category>(`/categories/${request.id}`, updateDto).pipe(
      map(response => {
        const updatedCategory = this.apiService.extractData(response)!;
        
        // Update local state
        const currentCategories = this.categoriesSubject.value;
        const index = currentCategories.findIndex(c => c.id === request.id);
        
        if (index !== -1) {
          const updatedCategories = [...currentCategories];
          updatedCategories[index] = updatedCategory;
          this.categoriesSubject.next(updatedCategories);
        }
        
        return updatedCategory;
      }),
      tap(() => this.loadingSubject.next(false)),
      catchError(error => {
        this.loadingSubject.next(false);
        throw error;
      })
    );
  }

  /**
   * Delete a category (Admin only)
   */
  deleteCategory(id: string): Observable<void> {
    this.loadingSubject.next(true);

    return this.apiService.delete<null>(`/categories/${id}`).pipe(
      map(() => {
        // Update local state
        const currentCategories = this.categoriesSubject.value;
        const updatedCategories = currentCategories.filter(c => c.id !== id);
        this.categoriesSubject.next(updatedCategories);
        
        return void 0;
      }),
      tap(() => this.loadingSubject.next(false)),
      catchError(error => {
        this.loadingSubject.next(false);
        throw error;
      })
    );
  }

  // ----------------------
  // Utility Methods
  // ----------------------

  /**
   * Search categories by name
   */
  searchCategories(searchTerm: string, page: number = 1, limit: number = 10): Observable<CategoryListResponse> {
    return this.getCategories({ search: searchTerm, page, limit });
  }

  /**
   * Refresh categories from server
   */
  refreshCategories(): Observable<CategoryListResponse> {
    return this.getCategories();
  }

  /**
   * Get categories without pagination (for dropdowns, etc.)
   */
  getAllCategories(): Observable<Category[]> {
    return this.getCategories({ limit: 1000 }).pipe(
      map(response => response.categories)
    );
  }

  /**
   * Check if a category name already exists
   */
  categoryNameExists(name: string, excludeId?: string): Observable<boolean> {
    return this.categories$.pipe(
      map(categories => {
        return categories.some(category => 
          category.name.toLowerCase() === name.toLowerCase() && 
          category.id !== excludeId
        );
      })
    );
  }

  /**
   * Get category statistics
   */
  getCategoryStats(): Observable<{ totalCategories: number; categoriesWithCourses: number }> {
    return this.categories$.pipe(
      map(categories => ({
        totalCategories: categories.length,
        categoriesWithCourses: categories.filter(c => c.courses && c.courses.length > 0).length,
      }))
    );
  }

  // ----------------------
  // State Management
  // ----------------------

  /**
   * Clear local state
   */
  clearCategories(): void {
    this.categoriesSubject.next([]);
  }

  /**
   * Get current categories from local state
   */
  getCurrentCategories(): Category[] {
    return this.categoriesSubject.value;
  }

  /**
   * Update a single category in local state
   */
  updateCategoryInState(category: Category): void {
    const currentCategories = this.categoriesSubject.value;
    const index = currentCategories.findIndex(c => c.id === category.id);
    
    if (index !== -1) {
      const updatedCategories = [...currentCategories];
      updatedCategories[index] = category;
      this.categoriesSubject.next(updatedCategories);
    }
  }

  /**
   * Add a category to local state
   */
  addCategoryToState(category: Category): void {
    const currentCategories = this.categoriesSubject.value;
    this.categoriesSubject.next([...currentCategories, category]);
  }

  /**
   * Remove a category from local state
   */
  removeCategoryFromState(id: string): void {
    const currentCategories = this.categoriesSubject.value;
    const updatedCategories = currentCategories.filter(c => c.id !== id);
    this.categoriesSubject.next(updatedCategories);
  }
}