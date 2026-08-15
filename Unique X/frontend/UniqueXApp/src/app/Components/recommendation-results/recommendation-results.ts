import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PropertyService } from '../../Services/property';
import { Property } from '../../Models/property.model';

// خصائص كل عقار متطابقة: العناصر اللي اتطابقت مع طلب العميل، عشان نلوّنها أخضر في الكارد
export interface ScoredProperty {
  property: Property;
  score: number;
  maxScore: number;
  matchedFields: Set<string>;
  matchPercent: number;
}

// ملحوظة: القيم دي لازم تطابق أسماء الـ enums في الباك إند بالظبط (PropEnums.cs)
const CITY_LABELS: Record<string, string> = { '1': 'Cairo', '2': 'Alexandria', '3': 'NorthCoast' };
const LISTING_TYPE_LABELS: Record<string, string> = { '0': 'Resale', '1': 'Rent', '2': 'Primary', '3': 'ResaleProject' };
const PROPERTY_TYPE_LABELS: Record<string, string> = { '0': 'Apartment', '1': 'Villa', '2': 'Shop', '3': 'Office', '4': 'Chalet', '5': 'FullFloor' };

@Component({
  selector: 'app-recommendation-results',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './recommendation-results.html'
})
export class RecommendationResultsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private propertyService = inject(PropertyService);

  results = signal<ScoredProperty[]>([]);
  isLoading = signal<boolean>(true);
  criteria: any = {};

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.criteria = { ...params };
      this.loadRecommendations();
    });
  }

  private loadRecommendations(): void {
    this.isLoading.set(true);

    // 🟢 المعايير التصنيفية (Zone/Listing Type/Property Type) بقت Multiple، فمش بنقدر نبعتها كفلتر واحد
    // للباك إند - بنجيب كل العقارات وبنفلتر ونرتب هنا في الفرونت
    this.propertyService.getProperties({}).subscribe({
      next: (response: any) => {
        const data: Property[] = response?.message ? response.data : response;

        const cities = this.splitParam(this.criteria.city).map(v => CITY_LABELS[v]).filter(Boolean);
        const listingTypes = this.splitParam(this.criteria.listingType).map(v => LISTING_TYPE_LABELS[v]).filter(Boolean);
        const propertyTypes = this.splitParam(this.criteria.propertyType).map(v => PROPERTY_TYPE_LABELS[v]).filter(Boolean);

        const filtered = (data || []).filter(p => {
          if (cities.length && !cities.includes(p.city)) return false;
          if (listingTypes.length && !listingTypes.includes(p.listingType)) return false;
          if (propertyTypes.length && !propertyTypes.includes(p.propertyType)) return false;
          return true;
        });

        const scored = filtered.map(p => this.scoreProperty(p));
        // ترتيب من الأعلى تطابقًا للأقل
        scored.sort((a, b) => b.matchPercent - a.matchPercent || b.score - a.score);
        this.results.set(scored);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  private splitParam(val: any): string[] {
    if (!val) return [];
    return String(val).split(',').map(v => v.trim()).filter(Boolean);
  }

  private inRange(value: number, min?: string, max?: string): boolean {
    const minN = min ? Number(min) : -Infinity;
    const maxN = max ? Number(max) : Infinity;
    return value >= minN && value <= maxN;
  }

  private scoreProperty(property: Property): ScoredProperty {
    const c = this.criteria;
    const matchedFields = new Set<string>();
    let maxScore = 0;
    let score = 0;

    if (c.minRooms || c.maxRooms) {
      maxScore++;
      if (this.inRange(Number(property.rooms), c.minRooms, c.maxRooms)) { score++; matchedFields.add('rooms'); }
    }
    if (c.minBathrooms || c.maxBathrooms) {
      maxScore++;
      if (this.inRange(Number(property.bathrooms), c.minBathrooms, c.maxBathrooms)) { score++; matchedFields.add('bathrooms'); }
    }
    // معيار الـ Total Floors مش بيتبعت خالص من الفورم لو Villa مختارة، فمش هيتحسب هنا
    if (c.minFloors || c.maxFloors) {
      maxScore++;
      if (this.inRange(Number(property.totalFloors), c.minFloors, c.maxFloors)) { score++; matchedFields.add('floors'); }
    }
    if (c.minFloorNumber || c.maxFloorNumber) {
      maxScore++;
      if (this.inRange(Number(property.floor), c.minFloorNumber, c.maxFloorNumber)) { score++; matchedFields.add('floorNumber'); }
    }
    if (c.minBudget || c.maxBudget) {
      maxScore++;
      if (this.inRange(property.price, c.minBudget, c.maxBudget)) { score++; matchedFields.add('budget'); }
    }

    const matchPercent = maxScore > 0 ? Math.round((score / maxScore) * 100) : 100;
    return { property, score, maxScore, matchedFields, matchPercent };
  }

  isMatched(item: ScoredProperty, field: string): boolean {
    return item.matchedFields.has(field);
  }

  goToDetails(id: number): void {
    this.router.navigate(['/property-details', id]);
  }

  goToHome(): void {
    this.router.navigate(['/home']);
  }
}