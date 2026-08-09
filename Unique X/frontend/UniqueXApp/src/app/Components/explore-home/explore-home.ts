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
  properties = signal<Property[]>([]);
  isLoading = signal<boolean>(true);

  // 🟢 الصفحة دلوقتي بتعرض وحدات Resale Project بس
  resaleProjectProps = computed(() => this.properties().filter(p => p.listingType === 'ResaleProject'));

  constructor(private propertyService: PropertyService) {}

  ngOnInit() {
    this.loadProperties();
  }

  // بنجيب كل الوحدات من غير أي فلتر وبعدين بنفلتر Resale Project بس في الـ computed
  loadProperties() {
    this.isLoading.set(true);
    this.propertyService.getProperties({}).subscribe({
      next: (response: any) => {
        this.isLoading.set(false);
        const data = response?.message ? response.data : response;
        this.properties.set(data || []);
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error(err);
      }
    });
  }

  // 🟢 سكرول أفقي بأسهم يمين وشمال (زي شريط الأيقونات في الهوم)
  scrollH(container: HTMLElement, dir: number) {
    if (!container) return;
    const amount = container.clientWidth * 0.8 * dir;
    container.scrollBy({ left: amount, behavior: 'smooth' });
  }
}