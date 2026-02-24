import { ApplicationConfig, provideZonelessChangeDetection, importProvidersFrom} from '@angular/core'; // تعديل هنا
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { NgxGoogleAnalyticsModule, NgxGoogleAnalyticsRouterModule } from 'ngx-google-analytics';


export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(), // تعديل هنا
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor])),
     importProvidersFrom(
      NgxGoogleAnalyticsModule.forRoot('G-VYQY2D36T8'), 
      NgxGoogleAnalyticsRouterModule
    )
  ]
};