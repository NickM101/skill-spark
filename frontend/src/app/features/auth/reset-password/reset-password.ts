import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '@core/services/auth.service';

// Custom validator for password confirmation
function passwordMatchValidator(control: AbstractControl) {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');

  if (password && confirmPassword && password.value !== confirmPassword.value) {
    return { passwordMismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-reset-password',
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
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private router = inject(Router);

  hidePassword = signal(true);
  hideConfirmPassword = signal(true);
  isLoading = signal(false);
  errorMessage = signal('');
  passwordReset = signal(false);
  isTokenValid = signal(true);
  passwordStrength = signal(0);
  currentPassword = signal('');
  email = '';
  resendCooldown = signal(0);

  resetPasswordForm: FormGroup = this.fb.group(
    {
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
          ),
        ],
      ],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordMatchValidator }
  );

  ngOnInit() {
   
    // Watch password changes for strength and requirements
    this.resetPasswordForm
      .get('password')
      ?.valueChanges.subscribe((password) => {
        this.currentPassword.set(password);
        this.updatePasswordStrength(password);
      });
  }

  onCodeInput(event: any) {
    // Only allow numbers
    const value = event.target.value.replace(/[^0-9]/g, '');
    this.resetPasswordForm.get('code')?.setValue(value);
    event.target.value = value;

    // Clear error message when user starts typing
    if (this.errorMessage()) {
      this.errorMessage.set('');
    }
  }

  togglePasswordVisibility() {
    this.hidePassword.set(!this.hidePassword());
  }

  toggleConfirmPasswordVisibility() {
    this.hideConfirmPassword.set(!this.hideConfirmPassword());
  }

  updatePasswordStrength(password: string) {
    if (!password) {
      this.passwordStrength.set(0);
      return;
    }

    let strength = 0;

    if (password.length >= 8) strength += 20;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/\d/.test(password)) strength += 20;
    if (/[@$!%*?&]/.test(password)) strength += 20;

    this.passwordStrength.set(strength);
  }

  getStrengthClass(): string {
    const strength = this.passwordStrength();
    if (strength < 40) return 'weak';
    if (strength < 60) return 'fair';
    if (strength < 80) return 'good';
    return 'strong';
  }

  getStrengthText(): string {
    const strength = this.passwordStrength();
    if (strength === 0) return '';
    if (strength < 40) return 'Weak password';
    if (strength < 60) return 'Fair password';
    if (strength < 80) return 'Good password';
    return 'Strong password';
  }

  // Password requirement checks
  hasMinLength(): boolean {
    return this.currentPassword().length >= 8;
  }

  hasUppercase(): boolean {
    return /[A-Z]/.test(this.currentPassword());
  }

  hasLowercase(): boolean {
    return /[a-z]/.test(this.currentPassword());
  }

  hasNumber(): boolean {
    return /\d/.test(this.currentPassword());
  }

  hasSpecialChar(): boolean {
    return /[@$!%*?&]/.test(this.currentPassword());
  }

  resendCode() {
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

    // Call your auth service to resend reset code
    // this.authService.resendPasswordResetCode(this.email).subscribe({
    //   next: (response) => {
    //     console.log(`Password reset code resent to ${this.email}`);
    //     // Optionally show a success message
    //   },
    //   error: (error) => {
    //     console.error('Failed to resend password reset code:', error);
    //     this.errorMessage.set('Failed to resend code. Please try again.');
    //   },
    // });
  }

  onSubmit() {
    if (this.resetPasswordForm.valid && !this.isLoading()) {
      this.isLoading.set(true);
      this.errorMessage.set('');

      const formData = {
        token: this.resetPasswordForm.get('code')?.value,
        password: this.resetPasswordForm.get('password')?.value,
        confirmPassword: this.resetPasswordForm.get('confirmPassword')?.value,
      };

      // Call your auth service to reset password
      this.authService.resetPassword(formData).subscribe({
        next: (response) => {
          this.isLoading.set(false);
          this.passwordReset.set(true);
          console.log('Password reset successful');
        },
        error: (error) => {
          this.isLoading.set(false);
          this.errorMessage.set(
            error?.error?.message ||
              'Failed to reset password. Please check your code and try again.'
          );
        },
      });
    }
  }
}
