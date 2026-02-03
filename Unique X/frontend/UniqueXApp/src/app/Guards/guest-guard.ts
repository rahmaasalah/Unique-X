import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../Services/auth';

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // لو المستخدم مسجل دخوله فعلاً (معاه توكن)
  if (authService.loggedIn()) {
    router.navigate(['/home']); // واديه للهوم علطول
    return false; // ارفض إنه يفتح صفحة اللوجين/الريجستر
  }

  return true; // لو مش مسجل، اسمح له يفتح اللوجين عادي
};