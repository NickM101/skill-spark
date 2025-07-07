import { CourseProgressDto } from './course-progress.dto';

export class ProgressStatsDto {
  totalCoursesEnrolled: number;
  totalCoursesCompleted: number;
  totalLessonsCompleted: number;
  averageCourseCompletion: number;
  courseProgress: CourseProgressDto[];
}
