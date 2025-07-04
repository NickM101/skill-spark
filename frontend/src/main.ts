import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideToastr } from 'ngx-toastr';

import { AppComponent } from './app/app';
import { routes } from './app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    // Enable zoneless change detection for better performance
    provideZonelessChangeDetection(),

    // Provide routing
    provideRouter(routes),

    // Provide HTTP client
    provideHttpClient(withInterceptorsFromDi()),

    // Provide animations for Angular Material
    provideAnimationsAsync(),

    // Provide Toastr for notifications
    provideToastr({
      timeOut: 3000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
      progressBar: true,
      closeButton: true,
    }),
  ],
}).catch((err) => console.error(err));
