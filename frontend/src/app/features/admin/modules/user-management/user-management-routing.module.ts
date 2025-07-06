// src/app/features/admin/modules/user-management/user-management-routing.module.ts

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserListComponent } from './components/user-list/user-list';

const routes: Routes = [
  {
    path: '',
    component: UserListComponent,
    data: {
      title: 'User Management',
      breadcrumb: 'Users',
    },
  },
  {
    path: '**',
    redirectTo: '',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UserManagementRoutingModule {}
