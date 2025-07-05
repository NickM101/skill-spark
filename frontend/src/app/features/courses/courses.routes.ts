// src/app/features/courses/courses-routing.module.ts

import { Routes } from '@angular/router';

import { CourseListComponent } from './components/course-list/course-list';
import { CourseDetailComponent } from './components/course-detail/course-detail';

export const coursesRoutes: Routes = [
  {
    path: '',
    component: CourseListComponent,
    data: {
      title: 'All Courses',
      description: 'Browse our comprehensive course catalog',
    },
  },
  {
    path: ':id',
    component: CourseDetailComponent,
    data: {
      title: 'Course Details',
      description: 'View course information and enroll',
    },
  },
//   {
//     path: ':id/lessons/:lessonId',
//     loadChildren: () =>
//       import('../lessons/lessons.module').then((m) => m.LessonsModule),
//     data: {
//       title: 'Course Lesson',
//       description: 'Learn with interactive course content',
//     },
//   },
];

