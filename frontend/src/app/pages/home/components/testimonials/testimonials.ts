import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  avatar: string;
  content: string;
  rating: number;
  course: string;
}

@Component({
  selector: 'app-testimonials',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: 'testimonials.html',
  styleUrl: 'testimonials.scss',
})
export class TestimonialsComponent implements OnInit {
  currentIndex = signal(0);
  translateX = signal(0);
  cardWidth = 424; // 400px + 24px gap
  visibleCards = 3;

  testimonials = signal<Testimonial[]>([
    {
      id: 1,
      name: 'Jessica Thompson',
      role: 'Frontend Developer',
      company: 'Tech Solutions Inc.',
      avatar:
        'https://images.unsplash.com/photo-1494790108755-2616b612b17c?w=120&h=120&fit=crop&crop=face',
      content:
        'The JavaScript course completely transformed my understanding of modern web development. The instructor explained complex concepts in such a clear way that I finally understood async programming and ES6 features.',
      rating: 5,
      course: 'Complete JavaScript Mastery',
    },
    {
      id: 2,
      name: 'Marcus Johnson',
      role: 'UI/UX Designer',
      company: 'Creative Agency',
      avatar:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=face',
      content:
        'As someone with no design background, this course gave me the confidence to transition into UX design. The hands-on projects and feedback from instructors were invaluable for building my portfolio.',
      rating: 5,
      course: 'UI/UX Design Fundamentals',
    },
    {
      id: 3,
      name: 'Sarah Chen',
      role: 'Data Scientist',
      company: 'Analytics Corp',
      avatar:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&crop=face',
      content:
        'The data science course exceeded my expectations. From Python basics to machine learning algorithms, everything was explained with real-world examples. I landed my dream job within 3 months!',
      rating: 5,
      course: 'Data Science with Python',
    },
    {
      id: 4,
      name: 'David Rodriguez',
      role: 'Digital Marketing Manager',
      company: 'Growth Marketing Ltd.',
      avatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=face',
      content:
        "The marketing strategy course provided practical insights that I immediately applied to my campaigns. ROI increased by 150% in just two months. The instructor's industry experience really shows.",
      rating: 4,
      course: 'Digital Marketing Strategy',
    },
    {
      id: 5,
      name: 'Emily Watson',
      role: 'React Developer',
      company: 'StartupTech',
      avatar:
        'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=120&h=120&fit=crop&crop=face',
      content:
        'Coming from jQuery background, React seemed daunting. This bootcamp made the transition smooth with step-by-step guidance. The project-based learning approach helped me build a strong foundation.',
      rating: 5,
      course: 'React Development Bootcamp',
    },
    {
      id: 6,
      name: 'Alex Kim',
      role: 'Business Analyst',
      company: 'Financial Services Group',
      avatar:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=face',
      content:
        'The business analytics course transformed how I approach data analysis. Learning Tableau and advanced Excel techniques helped me create compelling dashboards that impressed senior management.',
      rating: 4,
      course: 'Business Analytics & Intelligence',
    },
  ]);

  dots = signal<number[]>([]);
  maxIndex = signal(0);

  ngOnInit() {
    this.updateLayout();
    this.setupAutoSlide();
  }

  private updateLayout() {
    const totalCards = this.testimonials().length;
    const maxIdx = Math.max(0, totalCards - this.visibleCards);
    this.maxIndex.set(maxIdx);

    const dotsCount = maxIdx + 1;
    this.dots.set(Array.from({ length: dotsCount }, (_, i) => i));
  }

  nextSlide() {
    if (this.currentIndex() < this.maxIndex()) {
      const newIndex = this.currentIndex() + 1;
      this.currentIndex.set(newIndex);
      this.translateX.set(-newIndex * this.cardWidth);
    }
  }

  previousSlide() {
    if (this.currentIndex() > 0) {
      const newIndex = this.currentIndex() - 1;
      this.currentIndex.set(newIndex);
      this.translateX.set(-newIndex * this.cardWidth);
    }
  }

  goToSlide(index: number) {
    this.currentIndex.set(index);
    this.translateX.set(-index * this.cardWidth);
  }

  private setupAutoSlide() {
    setInterval(() => {
      if (this.currentIndex() >= this.maxIndex()) {
        this.goToSlide(0);
      } else {
        this.nextSlide();
      }
    }, 5000); // Auto-slide every 5 seconds
  }
}
