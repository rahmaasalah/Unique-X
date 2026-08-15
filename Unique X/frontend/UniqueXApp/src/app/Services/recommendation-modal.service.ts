import { Injectable, signal } from '@angular/core';

// 🟢 عشان زرار "Get Recommendations" في الناف بار يقدر يفتح نفس المودال اللي في صفحة الهوم
// حتى لو المستخدم مش واقف في صفحة الهوم أصلاً
@Injectable({ providedIn: 'root' })
export class RecommendationModalService {
  show = signal<boolean>(false);

  open(): void {
    this.show.set(true);
  }

  close(): void {
    this.show.set(false);
  }
}