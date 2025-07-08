import { NgModule } from '@angular/core';

// Services
import { SharedModule } from '@shared/shared.module';
import { EnrollmentService } from './services/enrollments.service';
import { EnrollmentRoutingModule } from './enrollment-routing.module';


@NgModule({
  declarations: [],
  imports: [
    SharedModule
  ],
  providers: [EnrollmentService],
  exports: [EnrollmentRoutingModule],
})
export class EnrollmentModule {}
