// src/app/features/admin/modules/course-management/course-management-routing.module.ts

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CourseListComponent } from './components/course-list/course-list.component';
import { CourseDetailComponent } from './components/course-detail/course-detail.component';
import { CourseFormComponent } from './components/course-form/course-form.component';

const routes: Routes = [
  {
    path: '',
    component: CourseListComponent,
    data: {
      title: 'Course Management',
      breadcrumb: 'Courses',
    },
  },
  {
    path: 'new',
    component: CourseFormComponent,
    data: {
      title: 'Create Course',
      breadcrumb: 'Create',
    },
  },
  {
    path: ':id',
    component: CourseDetailComponent,
    data: {
      title: 'Course Details',
      breadcrumb: 'Details',
    },
  },
  {
    path: ':id/edit',
    component: CourseFormComponent,
    data: {
      title: 'Edit Course',
      breadcrumb: 'Edit',
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
export class CourseManagementRoutingModule {}
