import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminLayoutComponent } from '@layout/admin-layout/admin-layout';

export const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./components/admin-dashboard/admin-dashboard').then(
            (m) => m.AdminDashboardComponent
          ),
        title: 'Dashboard - SkillSpark',
      },
      {
        path: 'users',
        loadChildren: () =>
          import('./modules/user-management/user-management').then(
            (m) => m.UserManagementModule
          ),
        title: 'User Management',
      },
      {
        path: 'courses',
        loadChildren: () =>
          import('./modules/course-management/course-management').then(
            (m) => m.CourseManagementModule
          ),
        title: 'Course Management',
      },
      {
        path: 'categories',
        loadChildren: () =>
          import('./modules/category-management/category-management').then(
            (m) => m.CategoryManagementModule
          ),
        title: 'Category Management',
      }
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
