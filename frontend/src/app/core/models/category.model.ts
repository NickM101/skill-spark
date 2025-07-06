import { Course } from './course.model';

export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  courses?: Course[];
}
