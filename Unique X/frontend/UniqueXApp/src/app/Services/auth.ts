import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  baseUrl = 'https://localhost:7294/api/auth/'; 

  constructor(private http: HttpClient) { }

  login(model: any) {
  return this.http.post<any>(this.baseUrl + 'login', model).pipe(
    map((response: any) => {
      if (response && response.token) {
        // التخزين لازم يحصل هنا فوراً
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response));
      }
      return response;
    })
  );
}

getBrokers(): Observable<any[]> {
  return this.http.get<any[]>(`${this.baseUrl}brokers`);
}

getAdminContact(): Observable<any> {
  return this.http.get(`${this.baseUrl}admin-contact`);
}

  register(model: any) {
    return this.http.post(this.baseUrl + 'register', model);
  }

  loggedIn() {
    const token = localStorage.getItem('token');
    return !!token; 
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getUserType(): number {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.roles?.includes('Broker') ? 1 : 0; 
  // أو بناءً على الحقل اللي بيجيلك من الباك اند مباشرة
}

getUserName(): string {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.username || 'User';
}

getProfile(): Observable<any> {
  return this.http.get(`${this.baseUrl}profile`);
}

updateProfile(model: any): Observable<any> {
  return this.http.put(`${this.baseUrl}profile`, model);
}

uploadProfileImage(file: File): Observable<any> {
  const formData = new FormData();
  formData.append('file', file);
  return this.http.post(`${this.baseUrl}upload-profile-image`, formData);
}
getUserImage(): string | null {
  const userString = localStorage.getItem('user');
  if (userString) {
    const user = JSON.parse(userString);
    // تأكدي إن الاسم مطابق للي بيتخزن عندك (غالباً profileImageUrl)
    return user.profileImageUrl || null;
  }
  return null;
}
}