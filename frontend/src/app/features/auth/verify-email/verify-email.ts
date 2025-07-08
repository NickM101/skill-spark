import { Component, signal, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SharedModule } from '@shared/shared.module';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [SharedModule],
  templateUrl:  './verify-email.html',
  styleUrl: './verify-email.scss',
})
export class VerifyEmailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  isVerifying = signal(false);
  verificationSuccess = signal(false);
  errorMessage = signal('');
  resendCooldown = signal(0);
  email = '';
  code = '';

  ngOnInit() {
    this.email = this.route.snapshot.queryParams['email'] || '';
    if (!this.email) {
      this.errorMessage.set('No email provided in the URL.');
      this.router.navigate(['/auth/login']);
    }
  }

  onCodeInput(event: any) {
    // Only allow numbers
    const value = event.target.value.replace(/[^0-9]/g, '');
    this.code = value;
    event.target.value = value;

    // Clear error message when user starts typing
    if (this.errorMessage()) {
      this.errorMessage.set('');
    }
  }

  isCodeValid(): boolean {
    return this.code.length === 6 && /^\d{6}$/.test(this.code);
  }

  verifyCode() {
    if (!this.isCodeValid()) {
      this.errorMessage.set('Please enter a valid 6-digit verification code.');
      return;
    }

    this.errorMessage.set('');
    this.isVerifying.set(true);

    // Call your auth service to verify the email
    this.authService.verifyEmail(this.code).subscribe({
      next: (response) => {
        this.isVerifying.set(false);
        this.verificationSuccess.set(true);
      },
      error: (error) => {
        this.isVerifying.set(false);
        this.errorMessage.set(
          error?.error?.message ||
            'Invalid or expired verification code. Please try again.'
        );
      },
    });
  }

  navigateToLogin() {
    this.router.navigate(['/auth/login']);
  }


  resendVerification() {
    if (this.resendCooldown() > 0) return;

    // Start cooldown
    this.resendCooldown.set(60);
    const countdown = setInterval(() => {
      const time = this.resendCooldown();
      if (time <= 1) {
        clearInterval(countdown);
        this.resendCooldown.set(0);
      } else {
        this.resendCooldown.set(time - 1);
      }
    }, 1000);

    // // Call your auth service to resend verification code
    // this.authService.resendVerificationCode(this.email).subscribe({
    //   next: (response) => {
    //     console.log(`Verification code resent to ${this.email}`);
    //     // Optionally show a success message
    //   },
    //   error: (error) => {
    //     console.error('Failed to resend verification code:', error);
    //     // Optionally show an error message
    //   },
    // });
  }
}
