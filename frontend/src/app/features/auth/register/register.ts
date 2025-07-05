import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';

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
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatSelectModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatStepperModule,
  ],
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

  constructor() {
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

  onSubmit() {
    if (this.registerForm.valid && !this.isLoading()) {
      this.isLoading.set(true);
      this.errorMessage.set('');

      // Simulate API call
      setTimeout(() => {
        const formData = this.registerForm.value;
        console.log('Registration data:', formData);

        // Mock successful registration
        console.log('Registration successful');
        // Redirect to email verification or login

        this.isLoading.set(false);
      }, 2000);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.registerForm.controls).forEach((key) => {
        this.registerForm.get(key)?.markAsTouched();
      });
    }
  }

  registerWithGoogle() {
    console.log('Register with Google');
    // Implement Google OAuth
  }

  registerWithGithub() {
    console.log('Register with GitHub');
    // Implement GitHub OAuth
  }
}
