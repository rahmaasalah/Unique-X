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

  resaleProps = computed(() => this.properties().filter(p => p.listingType === 'Resale'));
  resaleProjectProps = computed(() => this.properties().filter(p => p.listingType === 'ResaleProject'));
  primaryProps = computed(() => this.properties().filter(p => p.listingType === 'Primary'));
  rentProps = computed(() => this.properties().filter(p => p.listingType === 'Rent'));

  constructor(private propertyService: PropertyService) {}

  ngOnInit() {
    this.loadProperties();
  }

  // بنجيب كل الوحدات من غير أي فلتر — نفس ترتيب أقسام الهوم بالظبط
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
}