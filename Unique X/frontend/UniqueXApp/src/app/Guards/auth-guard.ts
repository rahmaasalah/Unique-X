import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../Services/auth';
import { AlertService } from '../Services/alert';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const alertService = inject(AlertService);

  if (authService.loggedIn()) {
    return true; 
  } else {
    alertService.error('You must be logged in to access this page.', 'Access Denied');
    router.navigate(['/login']);
    return false;
  }
};