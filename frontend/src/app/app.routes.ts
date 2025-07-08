
// src/app/app.routes.ts

import { Routes } from '@angular/router';
import { GuestGuard } from '@core/guards';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./features/public/public.module').then((m) => m.PublicModule),
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.module').then((m) => m.AuthModule),
    canActivate: [GuestGuard]
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('./features/admin/admin.module').then((m) => m.AdminModule),
  },
];
