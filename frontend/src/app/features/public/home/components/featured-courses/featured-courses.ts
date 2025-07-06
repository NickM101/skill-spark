import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';

interface Course {
  id: number;
  title: string;
  description: string;
  instructor: string;
  instructorAvatar: string;
  price: number;
  originalPrice?: number;
  rating: number;
  studentCount: number;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  thumbnail: string;
  skills: string[];
  isBestseller?: boolean;
  isNew?: boolean;
}

@Component({
  selector: 'app-featured-courses',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
  ],
  templateUrl: 'featured-courses.html',
  styleUrl: 'featured-courses.scss',
})
export class FeaturedCoursesComponent {
  featuredCourses = signal<Course[]>([
    {
      id: 1,
      title: 'Complete JavaScript Mastery 2025',
      description:
        'Master JavaScript from basics to advanced concepts including ES6+, async programming, and modern frameworks.',
      instructor: 'Sarah Johnson',
      instructorAvatar:
        'https://images.unsplash.com/photo-1494790108755-2616b612b17c?w=150&h=150&fit=crop&crop=face',
      price: 79.99,
      originalPrice: 129.99,
      rating: 4.9,
      studentCount: 12458,
      duration: '42h 30m',
      level: 'Intermediate',
      category: 'Programming',
      thumbnail:
        'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=220&fit=crop',
      skills: [
        'JavaScript ES6+',
        'Async Programming',
        'DOM Manipulation',
        'APIs',
        'Modern Development',
      ],
      isBestseller: true,
    },
    {
      id: 2,
      title: 'UI/UX Design Fundamentals',
      description:
        'Learn the principles of user interface and user experience design with hands-on projects.',
      instructor: 'Michael Chen',
      instructorAvatar:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      price: 89.99,
      rating: 4.8,
      studentCount: 8934,
      duration: '28h 15m',
      level: 'Beginner',
      category: 'Design',
      thumbnail:
        'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=220&fit=crop',
      skills: [
        'Design Thinking',
        'Figma',
        'Prototyping',
        'User Research',
        'Wireframing',
      ],
      isNew: true,
    },
    {
      id: 3,
      title: 'Data Science with Python',
      description:
        'Complete data science bootcamp covering Python, pandas, machine learning, and data visualization.',
      instructor: 'Dr. Emily Rodriguez',
      instructorAvatar:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      price: 99.99,
      originalPrice: 149.99,
      rating: 4.9,
      studentCount: 15672,
      duration: '56h 45m',
      level: 'Advanced',
      category: 'Data Science',
      thumbnail:
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=220&fit=crop',
      skills: [
        'Python',
        'Pandas',
        'Machine Learning',
        'Data Visualization',
        'Statistics',
      ],
      isBestseller: true,
    },
    {
      id: 4,
      title: 'Digital Marketing Strategy',
      description:
        'Learn modern digital marketing techniques including SEO, social media, and paid advertising.',
      instructor: 'David Thompson',
      instructorAvatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      price: 69.99,
      rating: 4.7,
      studentCount: 6543,
      duration: '32h 20m',
      level: 'Intermediate',
      category: 'Marketing',
      thumbnail:
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=220&fit=crop',
      skills: [
        'SEO',
        'Social Media Marketing',
        'Google Ads',
        'Analytics',
        'Content Marketing',
      ],
    },
    {
      id: 5,
      title: 'React Development Bootcamp',
      description:
        'Build modern web applications with React, including hooks, context, and popular libraries.',
      instructor: 'Alex Martinez',
      instructorAvatar:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      price: 94.99,
      originalPrice: 139.99,
      rating: 4.8,
      studentCount: 9876,
      duration: '48h 10m',
      level: 'Intermediate',
      category: 'Programming',
      thumbnail:
        'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=220&fit=crop',
      skills: ['React', 'Hooks', 'Context API', 'Redux', 'Next.js'],
      isNew: true,
    },
    {
      id: 6,
      title: 'Business Analytics & Intelligence',
      description:
        'Master business analytics tools and techniques to make data-driven decisions.',
      instructor: 'Lisa Wang',
      instructorAvatar:
        'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face',
      price: 84.99,
      rating: 4.6,
      studentCount: 5432,
      duration: '36h 30m',
      level: 'Beginner',
      category: 'Business',
      thumbnail:
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=220&fit=crop',
      skills: ['Excel', 'Tableau', 'SQL', 'Power BI', 'Business Intelligence'],
    },
  ]);

  formatNumber(num: number): string {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  }

  calculateDiscount(currentPrice: number, originalPrice: number): number {
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  }

  enrollCourse(event: Event, courseId: number): void {
    event.preventDefault();
    event.stopPropagation();
    // Handle course enrollment
    console.log('Enrolling in course:', courseId);
  }

  loadMoreCourses(): void {
    // Load more courses functionality
    console.log('Loading more courses...');
  }
}
