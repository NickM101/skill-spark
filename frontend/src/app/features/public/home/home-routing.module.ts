import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    data: {
      title: 'SkillSpark - Learn, Teach, and Grow Your Skills',
      description:
        'Join SkillSpark to learn in-demand skills, share knowledge as an instructor, and grow your career with industry-aligned courses and certifications.',
      keywords:
        'SkillSpark, online learning, teach online, digital skills, e-learning, LMS, instructor platform, student learning, certifications',
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HomeRoutingModule {}
