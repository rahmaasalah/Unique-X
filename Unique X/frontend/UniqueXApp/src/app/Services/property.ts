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

  getProperties(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      if (filters.city) params = params.append('city', filters.city);
      if (filters.minPrice) params = params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params = params.append('maxPrice', filters.maxPrice);
      if (filters.listingType !== undefined && filters.listingType !== null) 
        params = params.append('listingType', filters.listingType);

       if (filters.searchTerm) params = params.append('searchTerm', filters.searchTerm);
    }
    
    return this.http.get<any>(this.baseUrl, { params });
  }

  getPropertyById(id: number): Observable<Property> {
    return this.http.get<Property>(`${this.baseUrl}/${id}`);
  }

 addProperty(formData: FormData): Observable<any> {
  return this.http.post(`${this.baseUrl}/add`, formData);
 }

getUserProperties(): Observable<Property[]> {
  return this.http.get<Property[]>(this.baseUrl + '/my-properties');
}

deleteProperty(id: number): Observable<any> {
  // تأكدي من المسار؛ في الباك اند بتاعنا هو api/properties/{id}
  return this.http.delete(`${this.baseUrl}/${id}`, { responseType: 'text' as 'json' });
}

// تحديث عقار
updateProperty(id: number, formData: FormData): Observable<any> {
  return this.http.put(`${this.baseUrl}/${id}`, formData);
}

toggleWishlist(propertyId: number): Observable<any> {
  return this.http.post(`https://localhost:7294/api/wishlist/toggle/${propertyId}`, {});
}

getWishlist(): Observable<Property[]> {
  return this.http.get<Property[]>(`https://localhost:7294/api/wishlist`);
}
}