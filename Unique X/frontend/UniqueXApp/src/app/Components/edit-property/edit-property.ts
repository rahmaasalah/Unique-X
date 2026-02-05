// src/app/components/edit-property/edit-property.component.ts

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PropertyService } from '../../Services/property';
import { AlertService } from '../../Services/alert';

@Component({
  selector: 'app-edit-property',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './edit-property.html'
})
export class EditPropertyComponent implements OnInit {
  editForm!: FormGroup;
  propertyId!: number;
  selectedFiles: File[] = [];
  existingPhotos = signal<any[]>([]);

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private propertyService = inject(PropertyService);
  private alertService = inject(AlertService);

  ngOnInit(): void {
    this.editForm = this.fb.group({
      title: ['', [Validators.required]],
      description: ['', Validators.required],
      price: ['', [Validators.required]],
      area: ['', [Validators.required]],
      rooms: [0],
      bathrooms: [0],
      city: [1],
      region: [''],
      address: [''],
      listingType: [0],
      propertyType: [0]
    });

    this.propertyId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadPropertyData();
  }

  loadPropertyData() {
    this.propertyService.getPropertyById(this.propertyId).subscribe({
      next: (data: any) => {
        this.editForm.patchValue({
          title: data.title,
          description: data.description,
          price: data.price,
          area: data.area,
          rooms: data.rooms,
          bathrooms: data.bathrooms,
          region: data.region,
          address: data.address,
          city: this.mapCityToId(data.city),
          listingType: this.mapListingToId(data.listingType),
          propertyType: this.mapTypeToId(data.propertyType)
        });
        this.existingPhotos.set(data.photos);
      }
    });
  }

  // دالة التحكم في عداد الغرف/الحمامات
  updateCounter(controlName: string, amount: number) {
    const control = this.editForm.get(controlName);
    if (control) {
      const newValue = (control.value || 0) + amount;
      if (newValue >= 0) control.patchValue(newValue);
    }
  }

  // تحويل النصوص القادمة من الباك اند لأرقام (IDs)
  mapCityToId(city: string) {
    const cities: any = { 'Cairo': 1, 'Alexandria': 2, 'NorthCoast': 3 };
    return cities[city] || 1;
  }
  mapListingToId(type: string) {
    const types: any = { 'Resell': 0, 'Rent': 1, 'Primary': 2, 'ResellProject': 3 };
    return types[type] ?? 0;
  }
  mapTypeToId(type: string) {
    const types: any = { 'Apartment': 0, 'Villa': 1, 'Shop': 2, 'Office': 3, 'Chalet': 4 };
    return types[type] ?? 0;
  }

  onFileSelect(event: any) { this.selectedFiles = Array.from(event.target.files); }

  onSubmit() {
    if (this.editForm.valid) {
      const formData = new FormData();
      Object.keys(this.editForm.value).forEach(key => {
        formData.append(key, this.editForm.value[key]);
      });
      this.selectedFiles.forEach(file => { formData.append('Photos', file); });

      this.propertyService.updateProperty(this.propertyId, formData).subscribe({
        next: () => {
          this.alertService.success('Update successful!');
          this.router.navigate(['/my-properties']);
        }
      });
    }
  }
}