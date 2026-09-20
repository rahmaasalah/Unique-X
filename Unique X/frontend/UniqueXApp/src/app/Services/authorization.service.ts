import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PermissionCatalogItem {
  key: string;
  label: string;
}

export interface CustomRoleMember {
  userId: string;
  fullName: string;
  brokerCode?: string | null;
  phoneNumber?: string | null;
}

export interface CustomRole {
  id: number;
  name: string;
  dashboard: 'Admin' | 'Crm';
  description?: string | null;
  permissions: string[];
  members: CustomRoleMember[];
  createdAt: string;
}

export interface SaveCustomRolePayload {
  name: string;
  dashboard: 'Admin' | 'Crm';
  description?: string | null;
  permissionKeys: string[];
  memberUserIds: string[];
}

export interface MyPermissions {
  isFullAdmin: boolean;
  hasCrmAccess: boolean;
  adminPermissions: string[] | null; // null = كل الصلاحيات
  crmPermissions: string[] | null;
  adminRoleNames: string[];
  crmRoleNames: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthorizationService {
  private baseUrl = environment.apiUrl + '/Authorization';
  private http = inject(HttpClient);

  getCatalog(dashboard: 'Admin' | 'Crm'): Observable<PermissionCatalogItem[]> {
    return this.http.get<PermissionCatalogItem[]>(`${this.baseUrl}/catalog`, { params: { dashboard } });
  }

  getBrokers(): Observable<CustomRoleMember[]> {
    return this.http.get<CustomRoleMember[]>(`${this.baseUrl}/brokers`);
  }

  getRoles(dashboard: 'Admin' | 'Crm'): Observable<CustomRole[]> {
    return this.http.get<CustomRole[]>(`${this.baseUrl}/roles`, { params: { dashboard } });
  }

  createRole(payload: SaveCustomRolePayload): Observable<any> {
    return this.http.post(`${this.baseUrl}/roles`, payload);
  }

  updateRole(id: number, payload: SaveCustomRolePayload): Observable<any> {
    return this.http.put(`${this.baseUrl}/roles/${id}`, payload);
  }

  deleteRole(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/roles/${id}`);
  }

  getMyPermissions(): Observable<MyPermissions> {
    return this.http.get<MyPermissions>(`${this.baseUrl}/my-permissions`);
  }

  // 🟢 قائمة اليوزرز/البروكرز عشان الـ CRM dashboard - متاحة لأي يوزر مسجل دخول
  // (بديل عن AdminService.getAllUsers() اللي بقى محتاج صلاحية admin-dashboard)
  getCrmUsersData(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/crm-users-data`);
  }
}