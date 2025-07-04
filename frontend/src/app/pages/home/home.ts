import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';

import { HeroSectionComponent } from './components/hero-section/hero-section';
import { FeaturedCoursesComponent } from './components/featured-courses/featured-courses';
import { StatsComponent } from './components/stats/stats';
import { TestimonialsComponent } from './components/testimonials/testimonials';
import { CtaSectionComponent } from './components/cta-section/cta-section';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    HeroSectionComponent,
    FeaturedCoursesComponent,
    StatsComponent,
    TestimonialsComponent,
    CtaSectionComponent,
  ],
  templateUrl: 'home.html',
  styleUrl: 'home.scss',
})
export class HomeComponent {
  features = signal([
    {
      id: 1,
      icon: 'school',
      title: 'Expert Instructors',
      description:
        'Learn from industry professionals with years of real-world experience and proven expertise.',
    },
    {
      id: 2,
      icon: 'access_time',
      title: 'Learn at Your Pace',
      description:
        'Flexible scheduling allows you to learn when it suits you best, with lifetime access to courses.',
    },
    {
      id: 3,
      icon: 'verified',
      title: 'Certified Learning',
      description:
        'Earn recognized certificates upon completion to showcase your skills to employers and clients.',
    },
    {
      id: 4,
      icon: 'groups',
      title: 'Community Support',
      description:
        'Join a vibrant community of learners, share knowledge, and get help when you need it.',
    },
    {
      id: 5,
      icon: 'trending_up',
      title: 'Track Progress',
      description:
        'Monitor your learning journey with detailed analytics and progress tracking tools.',
    },
    {
      id: 6,
      icon: 'devices',
      title: 'Multi-Device Access',
      description:
        'Access your courses anywhere, anytime on desktop, tablet, or mobile devices.',
    },
  ]);

  categories = signal([
    {
      id: 1,
      name: 'Programming',
      slug: 'programming',
      icon: 'code',
      courseCount: 45,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
      id: 2,
      name: 'Design',
      slug: 'design',
      icon: 'palette',
      courseCount: 32,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    },
    {
      id: 3,
      name: 'Business',
      slug: 'business',
      icon: 'business_center',
      courseCount: 28,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    },
    {
      id: 4,
      name: 'Marketing',
      slug: 'marketing',
      icon: 'trending_up',
      courseCount: 23,
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    },
    {
      id: 5,
      name: 'Data Science',
      slug: 'data-science',
      icon: 'analytics',
      courseCount: 19,
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    },
    {
      id: 6,
      name: 'Photography',
      slug: 'photography',
      icon: 'camera_alt',
      courseCount: 15,
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    },
  ]);
}
