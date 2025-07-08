// src/app/features/public/courses/courses-routing.module.ts

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CourseListComponent } from './components/course-list/course-list.component';
import { CourseDetailComponent } from './components/course-detail/course-detail.component';
import { LessonPlayerComponent } from './components/lesson-player/lesson-player.component';

const routes: Routes = [
  {
    path: '',
    component: CourseListComponent,
    data: {
      title: 'Courses',
      description: 'Browse our comprehensive catalog of courses',
    },
  },
  {
    path: ':id',
    component: CourseDetailComponent,
    data: {
      title: 'Course Details',
      description: 'View detailed information about this course',
    },
  },
  {
    path: ':courseId/lesson/:lessonId',
    component: LessonPlayerComponent,
    data: {
      title: ''
    },
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CoursesRoutingModule {}
