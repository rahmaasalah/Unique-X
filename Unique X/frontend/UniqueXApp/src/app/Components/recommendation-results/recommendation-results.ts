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

    // 🟢 بنستخدم الفلاتر الأساسية بس (Zone/Listing Type/Property Type) في الطلب للباك إند،
    // وباقي المواصفات (أوض، حمامات، أدوار، ميزانية) بنستخدمها في المطابقة والترتيب هنا في الفرونت
    const hardFilters: any = {};
    if (this.criteria.city) hardFilters.city = this.criteria.city;
    if (this.criteria.listingType) hardFilters.listingType = this.criteria.listingType;
    if (this.criteria.propertyType) hardFilters.propertyType = this.criteria.propertyType;

    this.propertyService.getProperties(hardFilters).subscribe({
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

  private scoreProperty(property: Property): ScoredProperty {
    const c = this.criteria;
    const matchedFields = new Set<string>();
    let maxScore = 0;
    let score = 0;

    if (c.rooms) {
      maxScore++;
      if (Number(property.rooms) === Number(c.rooms)) { score++; matchedFields.add('rooms'); }
    }
    if (c.bathrooms) {
      maxScore++;
      if (Number(property.bathrooms) === Number(c.bathrooms)) { score++; matchedFields.add('bathrooms'); }
    }
    if (c.floors) {
      maxScore++;
      if (Number(property.totalFloors) === Number(c.floors)) { score++; matchedFields.add('floors'); }
    }
    if (c.floorNumber) {
      maxScore++;
      if (Number(property.floor) === Number(c.floorNumber)) { score++; matchedFields.add('floorNumber'); }
    }
    if (c.minBudget || c.maxBudget) {
      maxScore++;
      const min = c.minBudget ? Number(c.minBudget) : 0;
      const max = c.maxBudget ? Number(c.maxBudget) : Infinity;
      if (property.price >= min && property.price <= max) { score++; matchedFields.add('budget'); }
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