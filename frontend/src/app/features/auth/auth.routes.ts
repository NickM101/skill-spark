import { Routes } from '@angular/router';

export const authRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./auth-layout/auth-layout').then(m => m.AuthLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      },
      {
        path: 'login',
        loadComponent: () => import('./login/login').then(m => m.LoginComponent),
        title: 'Login - SkillSpark'
      },
      {
        path: 'register',
        loadComponent: () => import('./register/register').then(m => m.RegisterComponent),
        title: 'Sign Up - SkillSpark'
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./forgot-password/forgot-password').then(m => m.ForgotPasswordComponent),
        title: 'Forgot Password - SkillSpark'
      },
      {
        path: 'reset-password',
        loadComponent: () => import('./reset-password/reset-password').then(m => m.ResetPasswordComponent),
        title: 'Reset Password - SkillSpark'
      },
      {
        path: 'verify-email',
        loadComponent: () => import('./verify-email/verify-email').then(m => m.VerifyEmailComponent),
        title: 'Verify Email - SkillSpark'
      }
    ]
  }
];