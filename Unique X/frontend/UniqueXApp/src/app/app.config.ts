import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core'; // تعديل هنا
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(), // تعديل هنا
    provideRouter(routes),
    provideHttpClient()
  ]
};