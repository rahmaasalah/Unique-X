import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { CreateLeadDto, LeadResponseDto, AdminDashboardDto, BrokerDashboardDto, WebsiteInquiryDto, BrokerProfileDataDto, RequestVisitDto } from '../Models/crm.models';
import { environment } from '../../environments/environment'; // تأكدي إن المسار ده صح حسب مكان ملف الـ environment عندك

@Injectable({
  providedIn: 'root'
})
export class CrmService {
  private http = inject(HttpClient);
  
  // هنا دمجنا الرابط الأساسي مع كلمة crm 
  // النتيجة هتكون: https://betk.property/api/crm
  private apiUrl = `${environment.apiUrl}/crm`; 
  public refreshNavbar$ = new Subject<void>(); 

  // 1. إضافة Lead جديد
  createLead(lead: CreateLeadDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/leads`, lead);
  }

  // 2. جلب الـ Leads
  getLeads(brokerId?: string, statusId?: number): Observable<LeadResponseDto[]> {
    let url = `${this.apiUrl}/leads`;
    let params =[];
    
    if (brokerId) params.push(`brokerId=${brokerId}`);
    if (statusId) params.push(`statusId=${statusId}`);
    
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
    
    return this.http.get<LeadResponseDto[]>(url);
  }

  // 3. جلب إحصائيات الأدمن
  getAdminDashboard(): Observable<AdminDashboardDto> {
    return this.http.get<AdminDashboardDto>(`${this.apiUrl}/dashboard/admin`);
  }

  // 4. جلب إحصائيات البروكر
  getBrokerDashboard(brokerId: string): Observable<BrokerDashboardDto> {
    return this.http.get<BrokerDashboardDto>(`${this.apiUrl}/dashboard/broker/${brokerId}`);
  }

  // تحديث حالة العميل (للسحب والإفلات)
updateLeadStatus(leadId: number, data: { newStatusId: number, brokerId: string, notes?: string }): Observable<any> {
  return this.http.put(`${this.apiUrl}/leads/${leadId}/status`, data);
}

// جلب تفاصيل العميل بالكامل (البروفايل، الزيارات، والتاريخ)
  getLeadDetails(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/leads/${id}`);
  }

  // إضافة زيارة جديدة
  scheduleVisit(visitData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/visits`, visitData);
  }

  // إضافة مهمة/مكالمة جديدة
  logActivity(activityData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/activities`, activityData);
  }

  // إرسال طلب من الموقع للـ CRM
  sendWebsiteInquiry(inquiry: WebsiteInquiryDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/leads/website-inquiry`, inquiry);
  }

  // زرار "Visit Now" في كارت الوحدة - العميل بيحدد ميعاد بنفسه
  requestVisit(dto: RequestVisitDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/leads/website-visit-request`, dto);
  }

  // جلب داتا بروفايل البروكر
  getBrokerProfileData(brokerId: string): Observable<BrokerProfileDataDto> {
    return this.http.get<BrokerProfileDataDto>(`${this.apiUrl}/dashboard/broker-profile/${brokerId}`);
  }

  // جلب الحملات
  getCampaigns(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/campaigns`);
  }

  // إضافة حملة
  createCampaign(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/campaigns`, data);
  }
  // مسح حملة
  deleteCampaign(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/campaigns/${id}`);
  }

  // تحديد المهمة كـ "تم الإنجاز" عشان تختفي من الإشعارات
  markActivityAsDone(activityId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/activities/${activityId}/mark-done`, {});
  }

  // دالة التبديل الجديدة (Toggle)
  toggleTaskStatus(activityId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/activities/${activityId}/toggle-status`, {});
  }

  // مسح عميل
  deleteLead(leadId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/leads/${leadId}`);
  }

  // عكس حالة الزيارة
  toggleVisitStatus(visitId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/visits/${visitId}/toggle-status`, {});
  }

  // مسح زيارة
  deleteVisit(visitId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/visits/${visitId}`);
  }

   updateLeadDetails(leadId: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/leads/${leadId}/update-details`, data);
  }

  updateVisitStatus(id: number, status: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/visits/${id}/status`, `"${status}"`, { headers: { 'Content-Type': 'application/json' }});
  }
  rescheduleVisit(id: number, newDate: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/visits/${id}/reschedule`, `"${newDate}"`, { headers: { 'Content-Type': 'application/json' }});
  }
  updateActivityStatus(id: number, status: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/activities/${id}/status`, `"${status}"`, { headers: { 'Content-Type': 'application/json' }});
  }
  rescheduleActivity(id: number, newDate: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/activities/${id}/reschedule`, `"${newDate}"`, { headers: { 'Content-Type': 'application/json' }});
  }

  // تعديل كامل لزيارة/مهمة لسه Pending (مش بس تأجيل الميعاد)
  updateVisit(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/visits/${id}`, data);
  }
  updateActivity(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/activities/${id}`, data);
  }

  addGeneralNote(leadId: number, brokerId: string, note: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/leads/${leadId}/add-note?brokerId=${brokerId}`, JSON.stringify(note), { headers: { 'Content-Type': 'application/json' }});
  }

  addVisitFeedback(id: number, feedback: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/visits/${id}/feedback`, JSON.stringify(feedback), { headers: { 'Content-Type': 'application/json' }});
  }

  addActivityFeedback(id: number, feedback: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/activities/${id}/feedback`, JSON.stringify(feedback), { headers: { 'Content-Type': 'application/json' }});
  }

  // جلب الترشيحات
  getLeadRecommendations(leadId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/leads/${leadId}/recommendations`);
  }

  // تسجيل إن البروكر داس على الترشيح
  markPropertyAsProposed(leadId: number, propertyId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/leads/${leadId}/mark-proposed/${propertyId}`, {});
  }

  // رفع ملف CSV
  uploadBulkLeads(file: File, brokerId: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/leads/upload-bulk?brokerId=${brokerId}`, formData);
  }

  transferLead(leadId: number, newBrokerId: string, adminId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/leads/${leadId}/transfer?adminId=${adminId}`, { newBrokerId });
  }

  approveDuplicateLead(leadId: number): Observable<any> {
  // تأكدي أن المسار يبدأ بـ admin/
  return this.http.patch(`${environment.apiUrl}/admin/leads/${leadId}/approve-duplicate`, {});
}

  getAdminCalendarEvents(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/dashboard/admin-calendar`);
  }

  getPropertyCodesByPurpose(purpose: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/leads/property-codes?purpose=${purpose}`);
  }

 
  bulkTransferLeads(leadIds: number[], newBrokerId: string, adminId: string) {
    return this.http.put<any>(`${this.apiUrl}/Leads/bulk-transfer?adminId=${adminId}`, { leadIds, newBrokerId });
  }


rejectDuplicateLead(leadId: number): Observable<any> {
  // بدلاً من `${this.apiUrl}/...` 
  // استخدمي الرابط المباشر للـ admin
  return this.http.patch(`${environment.apiUrl}/admin/leads/${leadId}/reject-duplicate`, {});
}

getPropertyCodes(): Observable<string[]> {
  return this.http.get<string[]>(`${this.apiUrl}/campaigns/approved-property-codes`); 
}

getFavoriteIds(brokerId: string): Observable<number[]> {
  return this.http.get<number[]>(`${this.apiUrl}/favorites?brokerId=${brokerId}`);
}

getAllFavorites(): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/favorites/all`);
}

addFavorite(brokerId: string, leadId: number): Observable<any> {
  return this.http.post(`${this.apiUrl}/favorites`, { brokerId, leadId });
}

removeFavorite(brokerId: string, leadId: number): Observable<any> {
  return this.http.delete(`${this.apiUrl}/favorites?brokerId=${brokerId}&leadId=${leadId}`);
}
getPendingClients(): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/leads/pending-clients`);
}

getBrokerReport(brokerId: string, from?: string, to?: string): Observable<any> {
  let url = `${this.apiUrl}/dashboard/broker-report/${brokerId}`;
  const params: string[] = [];
  if (from) params.push(`from=${from}`);
  if (to) params.push(`to=${to}`);
  if (params.length > 0) url += '?' + params.join('&');
  return this.http.get<any>(url);
}
}