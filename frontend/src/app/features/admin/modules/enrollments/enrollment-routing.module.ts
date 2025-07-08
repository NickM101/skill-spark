import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Guards

import { EnrollmentDetailComponent } from './components/enrollment-detail/enrollment-detail';
import { EnrollmentListComponent } from './components/enrollment-list/enrollment-list';
import { EnrollmentCreateComponent } from './components/enrollment-create/enrollment-create';
import { EnrollmentProgressComponent } from './components/enrollment-progress/enrollment-progress';


const routes: Routes = [
  {
    path: '',
    component: EnrollmentListComponent,
    // canActivate: [AuthGuard, RoleGuard],
    data: {
      title: 'Enrollments',
    //   roles: [Role.ADMIN, Role.INSTRUCTOR],
      breadcrumb: 'Enrollments',
    },
  },
  {
    path: 'create',
    component: EnrollmentCreateComponent,
    // canActivate: [AuthGuard, RoleGuard],
    data: {
      title: 'Create Enrollment',
    //   roles: [Role.ADMIN],
      breadcrumb: 'Create Enrollment',
    },
  },
  {
    path: 'progress',
    component: EnrollmentProgressComponent,
    // canActivate: [AuthGuard, RoleGuard],
    data: {
      title: 'Progress Overview',
    //   roles: [Role.ADMIN, Role.INSTRUCTOR],
      breadcrumb: 'Progress Overview',
    },
  },
  {
    path: 'course/:courseId',
    component: EnrollmentListComponent,
    // canActivate: [AuthGuard, RoleGuard],
    data: {
      title: 'Course Enrollments',
    //   roles: [Role.ADMIN, Role.INSTRUCTOR],
      breadcrumb: 'Course Enrollments',
    },
  },
  {
    path: 'student/:studentId',
    component: EnrollmentListComponent,
    // canActivate: [AuthGuard, RoleGuard],
    data: {
      title: 'Student Enrollments',
    //   roles: [Role.ADMIN, Role.INSTRUCTOR],
      breadcrumb: 'Student Enrollments',
    },
  },
  {
    path: ':id',
    component: EnrollmentDetailComponent,
    // canActivate: [AuthGuard, RoleGuard],
    data: {
      title: 'Enrollment Details',
    //   roles: [Role.ADMIN, Role.INSTRUCTOR],
      breadcrumb: 'Enrollment Details',
    },
  },
  {
    path: ':id/progress',
    component: EnrollmentProgressComponent,
    // canActivate: [AuthGuard, RoleGuard],
    data: {
      title: 'Enrollment Progress',
    //   roles: [Role.ADMIN, Role.INSTRUCTOR],
      breadcrumb: 'Progress',
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
export class EnrollmentRoutingModule {}
