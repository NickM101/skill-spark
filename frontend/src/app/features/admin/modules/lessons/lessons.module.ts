// src/app/features/lessons/lessons.module.ts

import { NgModule } from '@angular/core';

// Services
import { LessonService } from './services/lesson.service';

// Shared Module
import { SharedModule } from '@shared/shared.module';
import { DragDropModule } from '@angular/cdk/drag-drop';

@NgModule({
  declarations: [],
  imports: [SharedModule, DragDropModule],
  providers: [LessonService],
  exports: [],
})
export class LessonsModule {}
