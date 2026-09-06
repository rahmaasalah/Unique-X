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

    const cities = this.splitParam(this.criteria.city);
    const listingTypes = this.splitParam(this.criteria.listingType);
    const propertyTypes = this.splitParam(this.criteria.propertyType);

    // 🟢 المعايير التصنيفية (Zone/Listing Type/Property Type) بقت بتتبعت للباك إند نفسه كفلتر Multi-select
    // فبنجيب بس العقارات اللي تطابقها فعلاً بدل كل عقار في الداتابيز. الترتيب حسب نسبة التطابق (rooms/budget/...)
    // لسه بيحصل هنا في الفرونت لأنه محتاج يشوف كل المرشحين مع بعض عشان يرتبهم صح من الأعلى للأقل
    this.propertyService.getProperties({
      cities: cities.join(','),
      listingTypes: listingTypes.join(','),
      propertyTypes: propertyTypes.join(',')
    }).subscribe({
      next: (response: any) => {
        const data: Property[] = response?.message ? response.data : response;

        const scored = (data || []).map(p => this.scoreProperty(p));
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