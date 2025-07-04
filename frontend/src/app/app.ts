import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

import { HeaderComponent } from './layout/header/header';
import { FooterComponent } from './layout/footer/footer';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
  ],
  templateUrl: 'app.html',
  styleUrl: 'app.scss',
})
export class AppComponent {
  title = 'Skill-Spark - E-Learning Platform';
}
