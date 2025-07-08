// src/app/features/admin/modules/quizzes/quiz.module.ts

import { NgModule } from '@angular/core';

// Services
import { QuizService } from './services/quiz.service';
import { QuizRoutingModule } from './quiz-routing.module';
import { SharedModule } from '@shared/shared.module';

@NgModule({
  declarations: [],
  imports: [SharedModule],
  providers: [QuizService],
  exports: [QuizRoutingModule]
})
export class QuizModule {}
