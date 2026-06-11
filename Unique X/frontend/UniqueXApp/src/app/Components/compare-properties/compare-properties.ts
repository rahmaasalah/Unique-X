import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PropertyService } from '../../Services/property';
import { Property } from '../../Models/property.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-compare-properties',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './compare-properties.html'
})
export class ComparePropertiesComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private propertyService = inject(PropertyService);
  
  properties = signal<Property[]>([]);
  isLoading = signal<boolean>(true);
  newCode = ''; 
  showModal = false;

  ngOnInit(): void {
  this.route.paramMap.subscribe(params => {
    const idsString = params.get('ids'); // سيصل هنا "123,456"
    if (idsString) {
      const ids = idsString.split(',').map(Number);
      
      // جلب البيانات لكل الـ IDs
      forkJoin(ids.map(id => this.propertyService.getPropertyById(id))).subscribe({
        next: (data) => {
          this.properties.set(data);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      });
    }
  });
}
 openAddCodeModal() {
  this.showModal = true;
}

closeModal() {
  this.showModal = false;
  this.newCode = '';
}

addByCode() {
  if (!this.newCode.trim()) return;
  
  this.propertyService.getPropertyByCode(this.newCode).subscribe({
    next: (prop) => {
      if (prop) {
        const currentIds = this.properties().map(p => p.id);
        if (!currentIds.includes(prop.id)) {
          this.closeModal();
          this.router.navigate(['/compare', [...currentIds, prop.id].join(',')]);
        } else {
          alert('This property is already in the comparison!');
        }
      }
    },
    error: () => alert('Property not found. Please check the code.')
  });
}

goToHomeForCompare() {
  // بنحفظ الـ IDs الحالية عشان نرجعلها بعد الاختيار
  const currentIds = this.properties().map(p => p.id).join(',');
  localStorage.setItem('compare_existing_ids', currentIds);
  localStorage.setItem('compare_mode', 'add_to_existing'); // ✅ mode مختلف
  this.router.navigate(['/home']);
}

goToHome() { 
  this.router.navigate(['/home']); 
}
}