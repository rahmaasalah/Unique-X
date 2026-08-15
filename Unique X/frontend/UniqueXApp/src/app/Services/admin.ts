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

  // ===================== Project Financial Charts (نفس فكرة Financial File بالظبط) =====================
  getProjectFinancialFile(): Observable<any> {
    return this.http.get(`${this.baseUrl}/project-financial-file`);
  }

  uploadProjectFinancialFile(file: File): Observable<any> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post(`${this.baseUrl}/upload-project-financial`, fd);
  }

  deleteProjectFinancialFile(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/delete-project-financial/${id}`);
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

// --- بانرات ثابتة لصفحة الهوم (Explore Home / Add Property / Compare / Price Range / Recommendation...) ---
// كل واحد بيتحدد بـ key فريد وله صورة واحدة بس. بترجع Array مرتب حسب DisplayOrder
getHomeSectionBanners(): Observable<any[]> {
  return this.http.get<any[]>(`${this.baseUrl}/home-section-banners`);
}

uploadHomeSectionBanner(key: string, file: File): Observable<any> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('key', key);
  return this.http.post(`${this.baseUrl}/home-section-banners`, fd);
}

deleteHomeSectionBanner(key: string): Observable<any> {
  return this.http.delete(`${this.baseUrl}/home-section-banners/${key}`);
}

// 🟢 حفظ ترتيب البانرات بعد الـ drag & drop
reorderHomeSectionBanners(orderedKeys: string[]): Observable<any> {
  return this.http.put(`${this.baseUrl}/home-section-banners/reorder`, orderedKeys);
}

duplicateProperty(propertyId: number, brokerId: string) {
    return this.http.post(`${this.baseUrl}/duplicate-property/${propertyId}/${brokerId}`, {});
  }

 getHotDeals() {
    return this.http.get<any[]>(`${this.baseUrl}/hot-deals`);
  }

  addHotDeal(code: string) {
    return this.http.post(`${this.baseUrl}/hot-deals`, { code });
  }

  removeHotDeal(id: number) {
    return this.http.delete(`${this.baseUrl}/hot-deals/${id}`);
  }

  // ===================== Recommended to Visit (نفس فكرة Hot Deals) =====================
  getRecommendedVisits() {
    return this.http.get<any[]>(`${this.baseUrl}/recommended-visits`);
  }

  addRecommendedVisit(code: string) {
    return this.http.post(`${this.baseUrl}/recommended-visits`, { code });
  }

  removeRecommendedVisit(id: number) {
    return this.http.delete(`${this.baseUrl}/recommended-visits/${id}`);
  }

  grantCrmAccess(userId: string) {
  return this.http.patch(`${this.baseUrl}/grant-crm/${userId}`, {});
}

revokeCrmAccess(userId: string) {
  return this.http.patch(`${this.baseUrl}/revoke-crm/${userId}`, {});
}

getPendingDeletions(): Observable<any[]> {
  return this.http.get<any[]>(`${this.baseUrl}/pending-deletions`);
}

approveDeletion(id: number): Observable<any> {
  return this.http.post(`${this.baseUrl}/approve-deletion/${id}`, {});
}

rejectDeletion(id: number, reason: string): Observable<any> {
  return this.http.post(`${this.baseUrl}/reject-deletion/${id}`, { reason });
}

getJobApplications() {
  return this.http.get<any[]>(`${environment.apiUrl}/jobapplications`);
}

confirmJobApplication(id: number) {
  return this.http.put(`${environment.apiUrl}/jobapplications/${id}/confirm`, {});
}

scheduleInterview(id: number, dateTime: string) {
  return this.http.put(
    `${environment.apiUrl}/jobapplications/${id}/schedule`,
    JSON.stringify(dateTime),
    { headers: { 'Content-Type': 'application/json' } }
  );
}

getCvUrl(id: number): string {
  return `${environment.apiUrl}/jobapplications/${id}/cv`;
}

rejectJobApplication(id: number, reason: string) {
  return this.http.put(
    `${environment.apiUrl}/jobapplications/${id}/reject`,
    `"${reason}"`,
    { headers: { 'Content-Type': 'application/json' } }
  );
}

markAttended(id: number, attended: boolean) {
  return this.http.put(
    `${environment.apiUrl}/jobapplications/${id}/mark-attended`,
    attended,
    { headers: { 'Content-Type': 'application/json' } }
  );
}

finalDecision(id: number, decision: string, reason?: string) {
  return this.http.put(
    `${environment.apiUrl}/jobapplications/${id}/final-decision`,
    { decision, reason: reason || null },
    { headers: { 'Content-Type': 'application/json' } }
  );
}

// إدارة أكواد البروكرز
getBrokersWithCodes(): Observable<any[]> {
  return this.http.get<any[]>(`${this.baseUrl}/brokers-with-codes`);
}

setBrokerCode(userId: string, code: string): Observable<any> {
  return this.http.put(`${this.baseUrl}/set-broker-code/${userId}`,
    JSON.stringify(code),
    { headers: { 'Content-Type': 'application/json' } }
  );
}

clearBrokerCode(userId: string): Observable<any> {
  return this.http.delete(`${this.baseUrl}/clear-broker-code/${userId}`);
}

// --- Owner Properties (اللي اتقدمت من "Add Your Property") ---
private ownerPropsUrl = environment.apiUrl + '/owner-properties';

getOwnerProperties(): Observable<any[]> {
  return this.http.get<any[]>(this.ownerPropsUrl);
}

approveOwnerProperty(id: number, brokerId: string): Observable<any> {
  return this.http.patch(`${this.ownerPropsUrl}/${id}/approve`, { brokerId });
}

rejectOwnerProperty(id: number, reason: string): Observable<any> {
  return this.http.patch(`${this.ownerPropsUrl}/${id}/reject`, { reason });
}

// --- Lookups: Developers / Projects (Primary & Resale) / Regions ---

getDevelopers(): Observable<any[]> {
  return this.http.get<any[]>(`${this.baseUrl}/developers`);
}

addDeveloper(name: string, code: string): Observable<any> {
  return this.http.post(`${this.baseUrl}/developers`, { name, code });
}

deleteDeveloper(id: number): Observable<any> {
  return this.http.delete(`${this.baseUrl}/developers/${id}`);
}

// type: 0 = Primary, 1 = Resale
getProjects(type?: number, city?: number): Observable<any[]> {
  let url = `${this.baseUrl}/projects`;
  const params: string[] = [];
  if (type !== undefined && type !== null) params.push(`type=${type}`);
  if (city !== undefined && city !== null) params.push(`city=${city}`);
  if (params.length) url += `?${params.join('&')}`;
  return this.http.get<any[]>(url);
}

addProject(name: string, code: string, type: number, city: number, region?: string, developerId?: number): Observable<any> {
  return this.http.post(`${this.baseUrl}/projects`, { name, code, type, city, region: region || null, developerId: developerId || null });
}

deleteProject(id: number): Observable<any> {
  return this.http.delete(`${this.baseUrl}/projects/${id}`);
}

getRegions(city?: number): Observable<any[]> {
  let url = `${this.baseUrl}/regions`;
  if (city !== undefined && city !== null) url += `?city=${city}`;
  return this.http.get<any[]>(url);
}

addRegion(name: string, city: number, zoneCode?: string): Observable<any> {
  return this.http.post(`${this.baseUrl}/regions`, { name, zoneCode: zoneCode || null, city });
}

deleteRegion(id: number): Observable<any> {
  return this.http.delete(`${this.baseUrl}/regions/${id}`);
}
}