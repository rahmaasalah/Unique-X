import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ValuationService, ValuationOptions, ValuationRequest, ValuationResult
} from '../../Services/valuation.service';

@Component({
  selector: 'app-valuation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './valuation.component.html',
  styleUrls: ['./valuation.component.css']
})
export class ValuationComponent implements OnInit {
  // 🟢 كل حالة بتتغير بعد رد الـ API لازم تكون signal عشان الواجهة تتحدث (المشروع zoneless)
  options = signal<ValuationOptions>({
    cities: [], propertyTypes: [], finishingTypes: [], deliveryStatuses: []
  });
  regions = signal<string[]>([]);

  model: ValuationRequest = {
    city: '', region: '', propertyType: '', area: null, finishing: '',
    deliveryStatus: 'Ready', deliveryYear: null, floor: 0, totalFloors: null,
    buildYear: 0, rooms: 0, bathrooms: 0,
    hasElevator: false, hasParking: false, hasSecurity: false, hasBalcony: false,
    isLicensed: false, hasGarden: false, hasPool: false
  };

  features: { key: keyof ValuationRequest; label: string }[] = [
    { key: 'hasElevator', label: 'Elevator' },
    { key: 'hasParking', label: 'Parking' },
    { key: 'hasSecurity', label: 'Security' },
    { key: 'hasBalcony', label: 'Balcony' },
    { key: 'isLicensed', label: 'Licensed' },
    { key: 'hasGarden', label: 'Garden' },
    { key: 'hasPool', label: 'Pool' }
  ];

  // سنة التسليم لازم تكون بعد السنة الحالية (ولحد 15 سنة قدام)
  readonly currentYear = new Date().getFullYear();
  readonly minDeliveryYear = this.currentYear + 1;
  readonly maxDeliveryYear = this.currentYear + 15;

  loading = signal(false);
  error = signal('');
  result = signal<ValuationResult | null>(null);

  constructor(private svc: ValuationService) {}

  ngOnInit(): void {
    this.svc.getOptions().subscribe({
      next: o => this.options.set(o),
      error: () => this.error.set('Could not load the form. Please refresh the page.')
    });
  }

  // أي حالة غير Ready = تحت الإنشاء
  get isUnderConstruction(): boolean {
    return !!this.model.deliveryStatus && this.model.deliveryStatus !== 'Ready';
  }

  // الدور لازم يكون أقل من أو يساوي عدد أدوار البناية
  get floorError(): boolean {
    return !!this.model.totalFloors && this.model.floor > this.model.totalFloors;
  }

  // "UnderConstruction" -> "Under Construction"
  label(v: string): string {
    return v.replace(/([a-z])([A-Z])/g, '$1 $2');
  }

  onCityChange(): void {
    this.model.region = '';
    this.regions.set([]);
    if (!this.model.city) return;
    this.svc.getRegions(this.model.city).subscribe({
      next: r => this.regions.set(r),
      error: () => this.regions.set([])
    });
  }

  toggle(key: keyof ValuationRequest): void {
    (this.model as any)[key] = !(this.model as any)[key];
  }

  isOn(key: keyof ValuationRequest): boolean {
    return !!(this.model as any)[key];
  }

  showResult(): void {
    this.error.set('');
    this.result.set(null);
    this.loading.set(true);

    const body: ValuationRequest = {
      ...this.model,
      region: this.model.region.trim(),
      deliveryYear: this.isUnderConstruction ? this.model.deliveryYear : null,
      buildYear: this.isUnderConstruction ? 0 : (this.model.buildYear || 0),
      totalFloors: this.model.totalFloors || 0,
      floor: this.model.floor || 0,
      rooms: this.model.rooms || 0,
      bathrooms: this.model.bathrooms || 0
    };

    this.svc.estimate(body).subscribe({
      next: r => {
        this.result.set(r);
        this.loading.set(false);
        setTimeout(() =>
          document.getElementById('valuation-result')?.scrollIntoView({ behavior: 'smooth' }));
      },
      error: err => {
        this.loading.set(false);
        this.error.set(err?.status === 429
          ? 'Too many requests. Please try again in a minute.'
          : 'Something went wrong. Please check your data and try again.');
      }
    });
  }

  reset(): void {
    this.result.set(null);
    this.error.set('');
  }
}