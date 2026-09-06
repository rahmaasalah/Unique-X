import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PropertyService } from '../../Services/property';
import { PropertyCardComponent } from '../property-card/property-card';
import { Property } from '../../Models/property.model';

@Component({
  selector: 'app-price-range-search',
  standalone: true,
  imports: [CommonModule, RouterModule, PropertyCardComponent],
  templateUrl: './price-range-search.html'
})
export class PriceRangeSearchComponent {
  private propertyService = inject(PropertyService);
  private router = inject(Router);

  hasSearched = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  isLoadingMore = signal<boolean>(false);
  results = signal<Property[]>([]);
  totalCount = signal(0);
  hasMore = computed(() => this.results().length < this.totalCount());

  private readonly pageSize = 12;
  private page = 1;
  private lastMin = 0;
  private lastMax = Infinity;

  search(minEl: HTMLInputElement, maxEl: HTMLInputElement): void {
    this.lastMin = minEl?.value ? Number(minEl.value.replace(/,/g, '')) : 0;
    this.lastMax = maxEl?.value ? Number(maxEl.value.replace(/,/g, '')) : Infinity;
    this.page = 1;

    this.isLoading.set(true);
    this.hasSearched.set(true);

    // 🟢 الفلترة بقت بتحصل في الباك إند نفسه (MinPricePerMeter/MaxPricePerMeter) بدل ما نجيب كل العقارات ونفلتر هنا
    this.fetchPage(false);
  }

  loadMore(): void {
    if (this.isLoadingMore() || !this.hasMore()) return;
    this.page++;
    this.fetchPage(true);
  }

  private fetchPage(append: boolean): void {
    if (append) this.isLoadingMore.set(true);

    const filters: any = { pageNumber: this.page, pageSize: this.pageSize };
    if (this.lastMin > 0) filters.minPricePerMeter = this.lastMin;
    if (this.lastMax !== Infinity) filters.maxPricePerMeter = this.lastMax;

    this.propertyService.getProperties(filters).subscribe({
      next: (response: any) => {
        this.isLoading.set(false);
        this.isLoadingMore.set(false);
        const data = response?.data ?? [];
        const total = response?.totalCount ?? data.length;
        this.results.update(prev => append ? [...prev, ...data] : data);
        this.totalCount.set(total);
      },
      error: () => {
        this.isLoading.set(false);
        this.isLoadingMore.set(false);
      }
    });
  }

  formatPrice(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '');
    input.value = digits ? Number(digits).toLocaleString('en-US') : '';
  }

  goToHome(): void {
    this.router.navigate(['/home']);
  }
}