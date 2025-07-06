// category.service.ts
import { Injectable } from '@angular/core';
import { Category } from '../models/category.model';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private categories: Category[] = [
    {
      id: '1',
      name: 'Web Development',
      description:
        'Courses related to web development technologies and frameworks.',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      name: 'Data Science',
      description: 'Courses covering data science tools and techniques.',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // Add more mock categories as needed
  ];

  getCategories(): Category[] {
    return this.categories;
  }

  getCategoryById(id: string): Category | undefined {
    return this.categories.find((category) => category.id === id);
  }

  createCategory(category: Category): void {
    this.categories.push(category);
  }

  updateCategory(id: string, category: Category): void {
    const index = this.categories.findIndex((c) => c.id === id);
    if (index !== -1) {
      this.categories[index] = category;
    }
  }

  deleteCategory(id: string): void {
    this.categories = this.categories.filter((category) => category.id !== id);
  }
}
