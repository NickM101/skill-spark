// src/app/features/admin/modules/category-management/category-management.module.ts

import { NgModule } from '@angular/core';

// Routing
import { CategoryManagementRoutingModule } from './category-management-routing.module';

// Services
import { CategoryService } from './services/category.service';
import { SharedModule } from '@shared/shared.module';

@NgModule({
  declarations: [],
  imports: [CategoryManagementRoutingModule, SharedModule],
  providers: [CategoryService],
})
export class CategoryManagementModule {}
