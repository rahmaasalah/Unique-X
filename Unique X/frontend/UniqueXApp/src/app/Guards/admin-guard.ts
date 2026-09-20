import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { AuthService } from '../Services/auth'; // تأكدي من صحة المسار عندك
import { AlertService } from '../Services/alert'; // تأكدي من صحة المسار عندك
import { AuthorizationService } from '../Services/authorization.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const alertService = inject(AlertService);
  const authorizationService = inject(AuthorizationService);

  // 1. سحب بيانات المستخدم المخزنة في المتصفح
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  if (!authService.loggedIn()) {
    alertService.error('Access Denied! You do not have permission to view this page.', 'Restricted Area');
    router.navigate(['/home']);
    return false;
  }

  // 2. فُل أدمن (Role = Admin) - يعدي على طول زي ما كان بالظبط (من غير ما نستنى الـ API)
  if (user?.roles?.includes('Admin')) {
    return true;
  }

  // 3. مش فُل أدمن - نتحقق لو معاه Custom Role جوه admin-dashboard (زي Team Leader)
  // ده الوحيد اللي بيحتاج نستنى رد الـ API قبل ما نقرر
  return authorizationService.getMyPermissions().pipe(
    map(perm => {
      if (perm.isFullAdmin || (perm.adminPermissions && perm.adminPermissions.length > 0)) {
        return true;
      }
      alertService.error('Access Denied! You do not have permission to view this page.', 'Restricted Area');
      router.navigate(['/home']);
      return false;
    }),
    catchError(() => {
      alertService.error('Access Denied! You do not have permission to view this page.', 'Restricted Area');
      router.navigate(['/home']);
      return of(false);
    })
  );
};