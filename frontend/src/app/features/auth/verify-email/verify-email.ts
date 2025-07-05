import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: 'verify-email.html',
  styleUrl: 'verify-email.scss',
})
export class VerifyEmailComponent implements OnInit {
  private route = new ActivatedRoute();

  isVerifying = signal(true);
  verificationSuccess = signal(false);
  errorMessage = signal('');
  resendCooldown = signal(0);

  ngOnInit() {
    // Get verification token from URL
    const token = this.route.snapshot.queryParams['token'];
    const email = this.route.snapshot.queryParams['email'];

    // Simulate email verification process
    setTimeout(() => {
      this.verifyEmail(token, email);
    }, 2000);
  }

  private verifyEmail(token: string, email: string) {
    this.isVerifying.set(false);

    // Mock verification logic
    if (token && token !== 'invalid') {
      // Success case
      this.verificationSuccess.set(true);
      console.log('Email verification successful for:', email);
    } else {
      // Error case
      this.verificationSuccess.set(false);
      if (!token) {
        this.errorMessage.set('Verification token is missing from the URL.');
      } else if (token === 'expired') {
        this.errorMessage.set(
          'This verification link has expired. Please request a new one.'
        );
      } else if (token === 'invalid') {
        this.errorMessage.set(
          'Invalid verification token. Please check your email for the correct link.'
        );
      } else if (token === 'already-verified') {
        this.errorMessage.set(
          'This email address has already been verified. You can sign in to your account.'
        );
      }
    }
  }

  resendVerification() {
    if (this.resendCooldown() > 0) return;

    // Start cooldown
    this.resendCooldown.set(60);
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
      console.log('Verification email resent');

      // Show success message or redirect
      // You could show a toast notification here
    }, 1000);
  }
}