// src/app/features/admin/modules/category-management/category-management-routing.module.ts

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CategoryListComponent } from './components/category-list/category-list.component';

const routes: Routes = [
  {
    path: '',
    component: CategoryListComponent,
    data: {
      title: 'Category Management',
      breadcrumb: 'Categories',
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
export class CategoryManagementRoutingModule {}
