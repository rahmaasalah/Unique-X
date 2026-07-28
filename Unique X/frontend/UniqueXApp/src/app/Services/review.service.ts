import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/properties`;

  getReviews(propertyId: number) {
    return this.http.get<any[]>(`${this.base}/${propertyId}/reviews`);
  }

  addReview(propertyId: number, dto: { rating: number; comment: string }) {
    return this.http.post<any>(`${this.base}/${propertyId}/reviews`, dto);
  }

  deleteReview(propertyId: number, reviewId: number) {
    return this.http.delete(`${this.base}/${propertyId}/reviews/${reviewId}`);
  }
}