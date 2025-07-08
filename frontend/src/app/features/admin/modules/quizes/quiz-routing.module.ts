// src/app/features/admin/modules/quizzes/quiz-routing.module.ts

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { QuizListComponent } from './components/quiz-list/quiz-list.component';
import { QuizFormComponent } from './components/quiz-form/quiz-form.component';
import { QuizDetailComponent } from './components/quiz-detail/quiz-detail.component';

const routes: Routes = [
  {
    path: '',
    component: QuizListComponent,
    data: {
      title: 'Quiz Management',
      breadcrumb: 'Quizzes',
    },
  },
  {
    path: 'create',
    component: QuizFormComponent,
    data: {
      title: 'Create Quiz',
      breadcrumb: 'Create',
    },
  },
  {
    path: 'courses/:courseId/create',
    component: QuizFormComponent,
    data: {
      title: 'Create Quiz',
      breadcrumb: 'Create',
    },
  },
  {
    path: ':id',
    component: QuizDetailComponent,
    data: {
      title: 'Quiz Details',
      breadcrumb: 'Details',
    },
  },
  {
    path: ':id/edit',
    component: QuizFormComponent,
    data: {
      title: 'Edit Quiz',
      breadcrumb: 'Edit',
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
export class QuizRoutingModule {}
