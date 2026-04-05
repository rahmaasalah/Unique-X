import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  // تأكدي أن البورت يطابق البورت الخاص بمشروع الـ Backend عندك
  private baseUrl = environment.apiUrl + '/Admin';
  private http = inject(HttpClient);

  constructor() { }

  // --- إدارة المستخدمين ---

  // جلب قائمة بكل المستخدمين (Brokers & Clients)
  getAllUsers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/users`);
  }
  getStats(): Observable<any> { return this.http.get(`${this.baseUrl}/stats`); }

getDetailedProperties(): Observable<any[]> {
  return this.http.get<any[]>(`${this.baseUrl}/properties-detailed`);
}

  // تبديل حالة المستخدم (Active / Suspended)
  toggleUserStatus(userId: string): Observable<any> {
    // نبعت جسم فارغ {} لأننا بنغير الحالة في الباك اند بناءً على الـ ID
    return this.http.patch(`${this.baseUrl}/toggle-user/${userId}`, {});
  }

  reassignProperty(propertyId: number, newBrokerId: string) {
  return this.http.patch(`${this.baseUrl}/reassign-property/${propertyId}/${newBrokerId}`, {});
}

  // --- إدارة العقارات ---

  // جلب كل العقارات الموجودة في النظام للمراجعة
  getAllProperties(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/properties`);
  }

  // تبديل حالة العقار (Active / Inactive)
  // لو الأدمن عمله Inactive، العقار هيختفي من صفحة الهوم فوراً
  togglePropertyStatus(propertyId: number): Observable<any> {
    return this.http.patch(`${this.baseUrl}/toggle-property/${propertyId}`, {});
  }

  getBanners(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/banners`);
  }

  // لجلب البنرات في صفحة الهوم (عامة)
 getPublicBanners(): Observable<any[]> {
  // بنستخدم نفس الـ baseUrl اللي هو .../api/Admin
  return this.http.get<any[]>(`${this.baseUrl}/banners`); 
}

  addBanner(file: File, title: string): Observable<any> {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('title', title);
    return this.http.post(`${this.baseUrl}/add-banner`, fd);
  }

  deleteBanner(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/delete-banner/${id}`);
  }


  trackAction(action: string, propId?: number): Observable<any> {
  return this.http.post(`${this.baseUrl}/track?action=${action}&propertyId=${propId || ''}`, {});
}

getSoldProperties(): Observable<any[]> {
  return this.http.get<any[]>(`${this.baseUrl}/properties-sold`);
}

getActivityLogs(type: string): Observable<any[]> {
  return this.http.get<any[]>(`${this.baseUrl}/activity-logs/${type}`);
}

getSuspendedUsers(): Observable<any[]> {
  return this.http.get<any[]>(`${this.baseUrl}/suspended-users`);
}

getSuspendedProperties(): Observable<any[]> {
  return this.http.get<any[]>(`${this.baseUrl}/suspended-properties`);
}

getFinancialFile(): Observable<any> {
    return this.http.get(`${this.baseUrl}/financial-file`);
  }

  uploadFinancialFile(file: File): Observable<any> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post(`${this.baseUrl}/upload-financial`, fd);
  }

  deleteFinancialFile(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/delete-financial/${id}`);
  }

  getPendingProperties(): Observable<any[]> {
  return this.http.get<any[]>(`${this.baseUrl}/pending-properties`);
}

approveProperty(id: number): Observable<any> {
  return this.http.patch(`${this.baseUrl}/approve-property/${id}`, {});
}

rejectProperty(id: number, reason: string): Observable<any> {
  return this.http.patch(`${this.baseUrl}/reject-property/${id}`, { reason });
}
reorderBanners(orderedIds: number[]) {
  return this.http.put(`${this.baseUrl}/banners/reorder`, orderedIds);
}

duplicateProperty(propertyId: number, brokerId: string) {
    return this.http.post(`${this.baseUrl}/duplicate-property/${propertyId}/${brokerId}`, {});
  }
}