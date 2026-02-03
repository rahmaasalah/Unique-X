import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core'; // تعديل هنا
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(), // تعديل هنا
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor])) 
  ]
};