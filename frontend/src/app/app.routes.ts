import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./pages/home/home').then((m) => m.HomeComponent),
  },
  // {
  //   path: 'courses',
  //   loadChildren: () =>
  //     import('./features/courses/courses.routes').then((m) => m.coursesRoutes),
  // },
//   {
//     path: 'auth',
//     loadChildren: () =>
//       import('./features/auth/auth.routes').then((m) => m.authRoutes),
//   },
//   {
//     path: 'dashboard',
//     loadChildren: () =>
//       import('./features/dashboard/dashboard.routes').then(
//         (m) => m.dashboardRoutes
//       ),
//   },
//   {
//     path: 'lessons',
//     loadChildren: () =>
//       import('./features/lessons/lessons.routes').then((m) => m.lessonsRoutes),
//   },
//   {
//     path: 'admin',
//     loadChildren: () =>
//       import('./features/admin/admin.routes').then((m) => m.adminRoutes),
//   },
  {
    path: '**',
    redirectTo: '/home',
  },
];
