import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PropertyService } from '../../Services/property';
import { AlertService } from '../../Services/alert';
import { Property } from '../../Models/property.model';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-my-properties',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './my-properties.html',
  styleUrl: './my-properties.css'
})
export class MyPropertiesComponent implements OnInit {
  // اللستة الأصلية اللي جاية من السيرفر
  myProperties = signal<Property[]>([]);
  // اللستة اللي بتتعرض فعلياً في الجدول (اللي بتتفلتر)
  displayedProperties = signal<Property[]>([]);
  
  // قيم البحث (Drafts)
  searchText = '';
  cityFilter = '';
  listingFilter = '';
  typeFilter = '';

  private propertyService = inject(PropertyService);
  private alertService = inject(AlertService);

  ngOnInit(): void {
    this.loadMyProperties();
  }

  loadMyProperties() {
    this.propertyService.getUserProperties().subscribe({
      next: (data) => {
        this.myProperties.set(data);
        this.displayedProperties.set(data); // في البداية نعرض الكل
      },
      error: (err) => console.error(err)
    });
  }

  // ================== دالة البحث عند الضغط على الزرار ==================
  onSearch() {
    const search = this.searchText.toLowerCase();
    
    const results = this.myProperties().filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(search) || 
                           (p.code && p.code.toLowerCase().includes(search)) ||
                           (p.projectName && p.projectName.toLowerCase().includes(search));

    
      
      const matchesCity = this.cityFilter === '' || p.city === this.cityFilter;
      const matchesListing = this.listingFilter === '' || p.listingType === this.listingFilter;
      const matchesType = this.typeFilter === '' || p.propertyType === this.typeFilter;

      return matchesSearch && matchesCity && matchesListing && matchesType;
    });

    this.displayedProperties.set(results);
    
    if (results.length === 0) {
      // اختياري: تنبيه لو مفيش نتايج
      console.log('No results found for this search');
    }
  }

  // دالة لتصفير البحث
  resetFilters() {
    this.searchText = '';
    this.cityFilter = '';
    this.listingFilter = '';
    this.typeFilter = '';
    this.displayedProperties.set(this.myProperties());
  }

  // الدوال الأخرى تظل كما هي (onDelete, onMarkAsSold)
  onDelete(id: number) {
    this.alertService.confirm('Are you sure?', () => {
      this.propertyService.deleteProperty(id).subscribe({
        next: () => {
          this.alertService.success('Deleted');
          this.loadMyProperties();
        }
      });
    });
  }

  onMarkAsSold(id: number) {
    this.propertyService.markAsSold(id).subscribe({
      next: () => this.loadMyProperties()
    });
  }
}