import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common'; // مهم جداً للأوامر مثل *ngIf
import { PropertyCardComponent } from '../property-card/property-card'; // مهم لكي يتعرف على الكارت
import { PropertyService } from '../../Services/property';
import { Property } from '../../Models/property.model';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, PropertyCardComponent], 
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent implements OnInit {
  properties = signal<Property[]>([]); 
  message = signal<string>('');

  isLoading = signal<boolean>(false);
  private route = inject(ActivatedRoute);
  constructor(private propertyService: PropertyService) {}

  ngOnInit(): void {
     this.route.queryParams.subscribe(params => {
      this.loadProperties(params);
    });
  }

  loadProperties(filters: any = {}) {
    this.isLoading.set(true);
    this.propertyService.getProperties(filters).subscribe({
      next: (response: any) => {
       this.isLoading.set(false); // 3. وقف التحميل لما الداتا تيجي
        if (response.message) {
          this.message.set(response.message);
          this.properties.set([]);
        } else {
          this.properties.set(response);
          this.message.set('');
        }
      },
      error: (err) => {
        this.isLoading.set(false); // 4. وقف التحميل حتى لو فيه خطأ
        console.error(err);
      }
    });
  }
  onSearch(city: string, minPrice: string, maxPrice: string , searchTerm: string) {
    const filters = {
      city: city || null,
      minPrice: minPrice || null,
      maxPrice: maxPrice || null,
      searchTerm: searchTerm || null
    };

    // إعادة تحميل البيانات بناءً على الفلتر
    this.propertyService.getProperties(filters).subscribe({
      next: (response: any) => {
        if (response.message) {
          this.message.set(response.message);
          this.properties.set([]);
        } else {
          this.properties.set(response);
          this.message.set('');
        }
      }
    });
  }
  
}