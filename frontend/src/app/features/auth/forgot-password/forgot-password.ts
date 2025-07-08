import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: 'forgot-password.html',
  styleUrl: 'forgot-password.scss',
})
export class ForgotPasswordComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = new FormBuilder();

  isLoading = signal(false);
  errorMessage = signal('');
  emailSent = signal(false);
  submittedEmail = signal('');
  resendCooldown = signal(0);

  forgotPasswordForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  onSubmit() {
    if (this.forgotPasswordForm.valid && !this.isLoading()) {
      this.isLoading.set(true);
      this.errorMessage.set('');

      const email = this.forgotPasswordForm.get('email')?.value;

      this.authService.forgotPassword(email).subscribe({
        next: (response) => {
          this.emailSent.set(true);
          this.submittedEmail.set(email);
          this.isLoading.set(false);

          console.log('Password reset email sent to:', email);
          this.router.navigate(['/auth/reset-password']);
        },
        error: (error) => {
          this.errorMessage.set(error || 'Password reset failed.');
          this.isLoading.set(false);
        },
      });
    }
  }

  resendEmail() {
    if (this.resendCooldown() > 0) return;

    // Start cooldown
    this.resendCooldown.set(30);
    const countdown = setInterval(() => {
      const current = this.resendCooldown();
      if (current <= 1) {
        clearInterval(countdown);
        this.resendCooldown.set(0);
      } else {
        this.resendCooldown.set(current - 1);
      }
    }, 1000);

    // Simulate resend API call
    setTimeout(() => {
      console.log('Password reset email resent to:', this.submittedEmail());
    }, 1000);
  }
}
