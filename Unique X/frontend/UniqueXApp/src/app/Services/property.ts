import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Property } from '../Models/property.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PropertyService {
  baseUrl = 'https://localhost:7294/api/properties';

  constructor(private http: HttpClient) { }

  // الحصول على كل العقارات مع دعم الفلترة
  getProperties(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      if (filters.city) params = params.append('city', filters.city);
      if (filters.minPrice) params = params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params = params.append('maxPrice', filters.maxPrice);
    }
    return this.http.get<any>(this.baseUrl, { params });
  }

  getPropertyById(id: number): Observable<Property> {
    return this.http.get<Property>(`${this.baseUrl}/${id}`);
  }
}