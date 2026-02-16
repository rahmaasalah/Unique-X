import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  // تأكدي أن البورت يطابق البورت الخاص بمشروع الـ Backend عندك
  private baseUrl = 'https://localhost:7294/api/admin/';
  private http = inject(HttpClient);

  constructor() { }

  // --- إدارة المستخدمين ---

  // جلب قائمة بكل المستخدمين (Brokers & Clients)
  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl + 'users');
  }

  // تبديل حالة المستخدم (Active / Suspended)
  toggleUserStatus(userId: string): Observable<any> {
    // نبعت جسم فارغ {} لأننا بنغير الحالة في الباك اند بناءً على الـ ID
    return this.http.patch(`${this.baseUrl}toggle-user/${userId}`, {});
  }

  // --- إدارة العقارات ---

  // جلب كل العقارات الموجودة في النظام للمراجعة
  getAllProperties(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl + 'properties');
  }

  // تبديل حالة العقار (Active / Inactive)
  // لو الأدمن عمله Inactive، العقار هيختفي من صفحة الهوم فوراً
  togglePropertyStatus(propertyId: number): Observable<any> {
    return this.http.patch(`${this.baseUrl}toggle-property/${propertyId}`, {});
  }
}