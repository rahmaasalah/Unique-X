import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ValuationOptions {
  cities: string[];
  propertyTypes: string[];
  finishingTypes: string[];
  deliveryStatuses: string[];
}

export interface ValuationRequest {
  city: string;
  region: string;
  propertyType: string;
  area: number | null;
  finishing: string;
  deliveryStatus: string;
  deliveryYear: number | null;
  floor: number;
  totalFloors: number | null;
  buildYear: number;
  rooms: number;
  bathrooms: number;
  hasElevator: boolean;
  hasParking: boolean;
  hasSecurity: boolean;
  hasBalcony: boolean;
  isLicensed: boolean;
  hasGarden: boolean;
  hasPool: boolean;
}

export interface ValuationResult {
  success: boolean;
  message?: string;
  pricePerMeterLow: number;
  pricePerMeterMid: number;
  pricePerMeterHigh: number;
  totalLow: number;
  totalMid: number;
  totalHigh: number;
  comparablesCount: number;
  confidence: 'High' | 'Medium' | 'Low';
  basis: string;
  disclaimer: string;
}

@Injectable({ providedIn: 'root' })
export class ValuationService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/valuation`;

  getOptions(): Observable<ValuationOptions> {
    return this.http.get<ValuationOptions>(`${this.base}/options`);
  }

  getRegions(city: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.base}/regions`, {
      params: new HttpParams().set('city', city)
    });
  }

  estimate(req: ValuationRequest): Observable<ValuationResult> {
    return this.http.post<ValuationResult>(`${this.base}/estimate`, req);
  }
}