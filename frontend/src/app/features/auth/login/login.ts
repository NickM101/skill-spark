import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '@core/services/auth.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatDividerModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: 'login.html',
  styleUrl: 'login.scss',
})
export class LoginComponent {
  
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = new FormBuilder();

  hidePassword = signal(true);
  isLoading = signal(false);
  errorMessage = signal('');

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false],
  });

  togglePasswordVisibility() {
    this.hidePassword.set(!this.hidePassword());
  }

  onSubmit() {
    if (this.loginForm.valid && !this.isLoading()) {
      this.isLoading.set(true);
      this.errorMessage.set('');

       const credentials = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password,
      };

      this.authService
        .login(credentials)
        .pipe(
          finalize(() => {
            this.isLoading.set(false);
          })
        )
        .subscribe({
          next: (response) => {
            console.log("RESPONSE", response)
            this.redirectAfterLogin();
          },
          error: (error) => {
            console.log("ERROR LOGIN", typeof error)
            this.errorMessage.set(error || 'Login failed.');
          },
        });
    }
  }

  private redirectAfterLogin(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    // Redirect based on user role
    switch (user.role) {
      case 'ADMIN':
      case 'INSTRUCTOR':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'STUDENT':
      default:
        this.router.navigate(['/home']);
        break;
    }
  }

  fillDemoCredentials(role: 'student' | 'instructor' | 'admin') {
    const credentials = {
      student: { email: 'student@demo.com', password: 'demo123' },
      instructor: { email: 'instructor@demo.com', password: 'demo123' },
      admin: { email: 'admin@demo.com', password: 'demo123' },
    };

    this.loginForm.patchValue(credentials[role]);
    this.errorMessage.set('');
  }
}
