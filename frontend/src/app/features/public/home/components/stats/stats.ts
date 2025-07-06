import {
  Component,
  signal,
  OnInit,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

interface Stat {
  id: number;
  icon: string;
  value: number;
  label: string;
  suffix?: string;
  animatedValue: number;
}

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: 'stats.html',
  styleUrl: 'stats.scss',
})
export class StatsComponent implements OnInit {
  @ViewChild('statsSection', { static: true }) statsSection!: ElementRef;

  isVisible = signal(false);

  stats = signal<Stat[]>([
    {
      id: 1,
      icon: 'people',
      value: 50000,
      label: 'Active Students',
      suffix: '+',
      animatedValue: 0,
    },
    {
      id: 2,
      icon: 'school',
      value: 500,
      label: 'Expert Courses',
      suffix: '+',
      animatedValue: 0,
    },
    {
      id: 3,
      icon: 'person',
      value: 150,
      label: 'Professional Instructors',
      suffix: '+',
      animatedValue: 0,
    },
    {
      id: 4,
      icon: 'workspace_premium',
      value: 95,
      label: 'Success Rate',
      suffix: '%',
      animatedValue: 0,
    },
  ]);

  ngOnInit() {
    this.setupIntersectionObserver();
  }

  private setupIntersectionObserver() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.isVisible.set(true);
            this.animateNumbers();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(this.statsSection.nativeElement);
  }

  private animateNumbers() {
    const duration = 2000; // 2 seconds
    const frameRate = 60;
    const totalFrames = (duration / 1000) * frameRate;

    this.stats().forEach((stat, index) => {
      let currentFrame = 0;
      const increment = stat.value / totalFrames;

      const animate = () => {
        currentFrame++;
        const progress = currentFrame / totalFrames;
        const easedProgress = this.easeOutQuart(progress);

        stat.animatedValue = Math.floor(stat.value * easedProgress);

        if (currentFrame < totalFrames) {
          requestAnimationFrame(animate);
        } else {
          stat.animatedValue = stat.value;
        }
      };

      // Stagger the animations
      setTimeout(() => {
        animate();
      }, index * 200);
    });
  }

  private easeOutQuart(t: number): number {
    return 1 - Math.pow(1 - t, 4);
  }
}
