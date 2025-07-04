import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: 'hero-section.html',
  styleUrl: 'hero-section.scss',
})
export class HeroSectionComponent implements OnInit {
  animationsStarted = signal(false);

  ngOnInit() {
    // Start animations after component loads
    setTimeout(() => {
      this.animationsStarted.set(true);
    }, 1000);
  }
}
