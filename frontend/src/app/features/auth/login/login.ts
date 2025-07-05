import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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

      // Simulate API call
      setTimeout(() => {
        // Mock authentication logic
        const { email, password } = this.loginForm.value;

        // Demo credentials check
        const demoCredentials = [
          { email: 'student@demo.com', password: 'demo123', role: 'student' },
          {
            email: 'instructor@demo.com',
            password: 'demo123',
            role: 'instructor',
          },
          { email: 'admin@demo.com', password: 'demo123', role: 'admin' },
        ];

        const user = demoCredentials.find(
          (cred) => cred.email === email && cred.password === password
        );

        if (user) {
          console.log('Login successful:', user);
          // Redirect to dashboard
          // this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage.set(
            'Invalid email or password. Try demo credentials below.'
          );
        }

        this.isLoading.set(false);
      }, 2000);
    }
  }

  loginWithGoogle() {
    console.log('Login with Google');
    // Implement Google OAuth
  }

  loginWithGithub() {
    console.log('Login with GitHub');
    // Implement GitHub OAuth
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
