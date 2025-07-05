import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-auth-layout',
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: 'auth-layout.html',
  styleUrl: 'auth-layout.scss',
})
export class AuthLayoutComponent {}
