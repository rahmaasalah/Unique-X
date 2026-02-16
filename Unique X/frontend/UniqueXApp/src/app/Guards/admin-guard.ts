import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../Services/auth'; // تأكدي من صحة المسار عندك
import { AlertService } from '../Services/alert'; // تأكدي من صحة المسار عندك

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const alertService = inject(AlertService);

  // 1. سحب بيانات المستخدم المخزنة في المتصفح
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  // 2. التحقق من شرطين:
  // - يكون مسجل دخول فعلاً (معاه توكن سليم)
  // - تكون مصفوفة الـ roles جواه تحتوي على كلمة 'Admin'
  if (authService.loggedIn() && user?.roles?.includes('Admin')) {
    return true; // مسموح له بالدخول لصفحة الأدمن
  }

  // 3. لو الشرط مختل (مش مسجل أو مش أدمن)
  alertService.error('Access Denied! You do not have permission to view this page.', 'Restricted Area');
  
  // توجيهه لصفحة الهوم (أو اللوجين حسب رغبتك)
  router.navigate(['/home']); 
  return false;
};