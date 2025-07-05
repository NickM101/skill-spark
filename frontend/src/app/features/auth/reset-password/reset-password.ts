import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
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
  templateUrl: 'reset-password.html',
  styleUrl: 'reset-password.scss',
})
export class ResetPasswordComponent implements OnInit {
  private fb = new FormBuilder();
  private route = new ActivatedRoute();

  hidePassword = signal(true);
  hideConfirmPassword = signal(true);
  isLoading = signal(false);
  errorMessage = signal('');
  passwordReset = signal(false);
  isTokenValid = signal(true);
  passwordStrength = signal(0);
  currentPassword = signal('');

  resetPasswordForm: FormGroup = this.fb.group(
    {
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
    // Check if reset token is valid (from URL parameters)
    const token = this.route.snapshot.queryParams['token'];
    if (!token || token === 'invalid') {
      this.isTokenValid.set(false);
    }

    // Watch password changes for strength and requirements
    this.resetPasswordForm
      .get('password')
      ?.valueChanges.subscribe((password) => {
        this.currentPassword.set(password);
        this.updatePasswordStrength(password);
      });
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

  onSubmit() {
    if (this.resetPasswordForm.valid && !this.isLoading()) {
      this.isLoading.set(true);
      this.errorMessage.set('');

      // Simulate API call
      setTimeout(() => {
        // Mock successful password reset
        this.passwordReset.set(true);
        this.isLoading.set(false);

        console.log('Password reset successful');
      }, 2000);
    }
  }
}
