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
  constructor(private propertyService: PropertyService, private router: Router, private activatedRoute: ActivatedRoute) {}

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

  formatInteger(event: any) {
    const input = event.target;
    input.value = input.value.replace(/[^0-9]/g, ''); // حذف أي شيء ليس رقماً
  }

  
  onSearch(params: any) {
  // تجميع الفلاتر مع مراعاة الحفاظ على listingType الحالي في الرابط
  const filters = {
    ...this.route.snapshot.queryParams,
    searchTerm: params.searchTerm || null,
    city: params.city || null,
    minPrice: params.minPrice || null,
    maxPrice: params.maxPrice || null,
    code: params.code || null,
    area: params.area || null,
    buildYear: params.buildYear || null,
    minRooms: params.minRooms || null,
    maxRooms: params.maxRooms || null,
    minBathrooms: params.minBathrooms || null,
    maxBathrooms: params.maxBathrooms || null,
    minFloor: params.minFloor || null,
    maxFloor: params.maxFloor || null
  };

  // تحديث الرابط فوراً
  this.router.navigate(['/home'], { queryParams: filters });
}
clearFilters() {
  // التوجه للهوم بدون أي Query Params
  this.router.navigate(['/home']);
  
}
}