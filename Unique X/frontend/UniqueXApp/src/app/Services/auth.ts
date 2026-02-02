import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';

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
}