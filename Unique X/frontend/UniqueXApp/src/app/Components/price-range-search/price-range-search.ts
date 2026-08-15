import { Component, inject, signal } from '@angular/core';
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
  results = signal<Property[]>([]);

  search(minEl: HTMLInputElement, maxEl: HTMLInputElement): void {
    const min = minEl?.value ? Number(minEl.value.replace(/,/g, '')) : 0;
    const max = maxEl?.value ? Number(maxEl.value.replace(/,/g, '')) : Infinity;

    this.isLoading.set(true);
    this.hasSearched.set(true);

    // 🟢 مفيش فلتر جاهز في الباك إند على سعر المتر، فبنجيب العقارات وبنفلتر هنا في الفرونت
    this.propertyService.getProperties({}).subscribe({
      next: (response: any) => {
        const data: Property[] = response?.message ? response.data : response;
        const filtered = (data || []).filter(p => {
          const ppm = p.pricePerMeter > 0 ? p.pricePerMeter : (p.area > 0 ? p.price / p.area : 0);
          return ppm >= min && ppm <= max;
        });
        this.results.set(filtered);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
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