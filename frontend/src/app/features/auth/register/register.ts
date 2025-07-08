import { Component, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, RegisterData } from '@core/services/auth.service';
import { SharedModule } from '@shared/shared.module';

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
  selector: 'app-register',
  standalone: true,
  imports: [SharedModule],
  templateUrl: 'register.html',
  styleUrl: 'register.scss',
})
export class RegisterComponent {
  private fb = new FormBuilder();

  hidePassword = signal(true);
  hideConfirmPassword = signal(true);
  isLoading = signal(false);
  errorMessage = signal('');
  passwordStrength = signal(0);

  registerForm: FormGroup = this.fb.group(
    {
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      role: ['student', [Validators.required]],
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
      acceptTerms: [false, [Validators.requiredTrue]],
      acceptMarketing: [false],
    },
    { validators: passwordMatchValidator }
  );

  constructor(private authService: AuthService, private router: Router) {
    // Watch password changes for strength indicator
    this.registerForm.get('password')?.valueChanges.subscribe((password) => {
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

    // Length check
    if (password.length >= 8) strength += 25;

    // Lowercase check
    if (/[a-z]/.test(password)) strength += 25;

    // Uppercase check
    if (/[A-Z]/.test(password)) strength += 25;

    // Number and special character check
    if (/\d/.test(password) && /[@$!%*?&]/.test(password)) strength += 25;

    this.passwordStrength.set(strength);
  }

  getStrengthClass(): string {
    const strength = this.passwordStrength();
    if (strength < 25) return 'weak';
    if (strength < 50) return 'fair';
    if (strength < 75) return 'good';
    return 'strong';
  }

  getStrengthText(): string {
    const strength = this.passwordStrength();
    if (strength === 0) return '';
    if (strength < 25) return 'Weak password';
    if (strength < 50) return 'Fair password';
    if (strength < 75) return 'Good password';
    return 'Strong password';
  }

  onSubmit(): void {
    if (this.registerForm.valid && !this.isLoading()) {
      this.isLoading.set(true);
      this.errorMessage.set('');

      const formValue = this.registerForm.value;

      const payload: RegisterData = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        email: formValue.email,
        password: formValue.password,
        confirmPassword: formValue.confirmPassword,
        role: formValue.role.toUpperCase(),
      };

      this.authService.register(payload).subscribe({
        next: (response) => {
          console.log('Registration success:', response);
          this.router.navigate(['/auth/verify-email'], {
            queryParams: { email: formValue.email },
          });
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Registration failed:', err);
          this.errorMessage.set(err.message || 'Something went wrong.');
          this.isLoading.set(false);

        },
        complete: () => {
          this.isLoading.set(false);
        },
      });
    } else {
      // Show validation errors
      Object.keys(this.registerForm.controls).forEach((key) => {
        this.registerForm.get(key)?.markAsTouched();
      });
    }
  }
}
