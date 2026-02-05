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
        const user = response;
        if (user) {
          localStorage.setItem('token', user.token); 
          localStorage.setItem('user', JSON.stringify(user));
        }
      })
    );
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
}