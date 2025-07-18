import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
  ],
  templateUrl: 'app.html',
  styleUrl: 'app.scss',
})
export class AppComponent {
  title = 'Skill-Spark - E-Learning Platform';
}
