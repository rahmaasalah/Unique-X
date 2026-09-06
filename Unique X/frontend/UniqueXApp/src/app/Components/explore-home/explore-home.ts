import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PropertyCardComponent } from '../property-card/property-card';
import { PropertyService } from '../../Services/property';
import { Property } from '../../Models/property.model';

@Component({
  selector: 'app-explore-home',
  standalone: true,
  imports: [CommonModule, RouterModule, PropertyCardComponent],
  templateUrl: './explore-home.html',
  styleUrl: './explore-home.css'
})
export class ExploreHomeComponent implements OnInit {
  isLoading = signal<boolean>(true);

  // 🟢 دلوقتي بنجيب ResaleProject بس من الباك إند مباشرة (بدل ما نجيب كل الوحدات ونفلتر هنا)، مع Load More
  private readonly pageSize = 12;
  private readonly listingTypeCode = 3; // ResaleProject
  resaleProjectProps = signal<Property[]>([]);
  totalCount = signal(0);
  page = signal(1);
  isLoadingMore = signal(false);
  hasMore = computed(() => this.resaleProjectProps().length < this.totalCount());

  constructor(private propertyService: PropertyService) {}

  ngOnInit() {
    this.loadProperties();
  }

  private loadProperties(append: boolean = false) {
    if (append) {
      this.isLoadingMore.set(true);
    } else {
      this.isLoading.set(true);
      this.page.set(1);
    }

    this.propertyService.getProperties({
      listingType: this.listingTypeCode,
      pageNumber: this.page(),
      pageSize: this.pageSize
    }).subscribe({
      next: (response: any) => {
        this.isLoading.set(false);
        this.isLoadingMore.set(false);
        const data = response?.data ?? [];
        const total = response?.totalCount ?? data.length;
        this.resaleProjectProps.update(prev => append ? [...prev, ...data] : data);
        this.totalCount.set(total);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.isLoadingMore.set(false);
        console.error(err);
      }
    });
  }

  loadMore() {
    if (this.isLoadingMore() || !this.hasMore()) return;
    this.page.update(p => p + 1);
    this.loadProperties(true);
  }

  // 🟢 سكرول أفقي بأسهم يمين وشمال (زي شريط الأيقونات في الهوم)
  scrollH(container: HTMLElement, dir: number) {
    if (!container) return;
    const amount = container.clientWidth * 0.8 * dir;
    container.scrollBy({ left: amount, behavior: 'smooth' });
  }
}