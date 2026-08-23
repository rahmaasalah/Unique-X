import { CanDeactivateFn } from '@angular/router';

// 👇 أي Component عايز يستخدم الـ Guard ده لازم يعمل implement للإنترفيس ده
// ويرجع true/false من canDeactivate() حسب هل الفيدباك المطلوب اتضاف ولا لأ
export interface CanComponentDeactivate {
  canDeactivate: () => boolean;
}

// 👇 الـ Guard نفسه: بيسأل الـ Component "تقدر تخرج؟" وبيمنع التنقل جوه التطبيق لو رجع false
// (زرار Pipeline، الـ Navbar، Prev/Next، تسجيل خروج... إلخ)
// ملحوظة: ده بيمنع التنقل *جوه* الأنجولار روتر بس - قفل التاب أو الـ Refresh
// بيتغطوا بتحذير من المتصفح نفسه جوه الـ Component (beforeunload) مش من هنا،
// لأن المتصفحات مش بتسمح لأي كود يمنعهم فعليًا لأسباب أمان.
export const leadFeedbackGuard: CanDeactivateFn<CanComponentDeactivate> = (component) => {
  return component.canDeactivate ? component.canDeactivate() : true;
};