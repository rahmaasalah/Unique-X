import { CanDeactivateFn } from '@angular/router';

// 🟢 أي Component عايز يسأل المستخدم قبل ما يخرج لازم يعمل implement للميثود دي:
// true / Promise<true> = اخرج  |  false / Promise<false> = خليك في الصفحة
// بتتنفذ عند أي تنقل جوه الأنجولار (روابط، النافبار، زرار الرجوع) - مش عند قفل التاب أو الـ Refresh
export interface CanLeaveProperty {
  canLeave: () => boolean | Promise<boolean>;
}

export const propertyFeedbackGuard: CanDeactivateFn<CanLeaveProperty> = (component) => component.canLeave();