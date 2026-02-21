import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../Services/auth';

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // لو المستخدم مسجل دخوله فعلاً (معاه توكن)
 if (authService.loggedIn()) {
    // نجيب بيانات اليوزر عشان نعرف هو مين
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (user.roles?.includes('Admin')) {
      router.navigate(['/admin']); // لو ادمن ودخل ع اللوجين يرجعه لصفحته
    } else {
      router.navigate(['/home']); // لو يوزر عادي يروح للهوم
    }
    return false;
  }

  return true; // لو مش مسجل، اسمح له يفتح اللوجين عادي
};