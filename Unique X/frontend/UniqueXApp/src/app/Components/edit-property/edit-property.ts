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
  selectedPhotos = signal<{ file: File, preview: string }[]>([]);
newMainPhotoIndex: number | null = null;

  regionsMapping: any = {
  1: ['Zamalek', 'El-Qourba', 'Nasr city'], // Cairo
  2: [
    'zizinia', 'Janaklis', 'Gliem', 'Fleming', 'San Stefano', 'Shods', 
    'Elshalalat', 'Wabur al-miyah', 'Al-Ibrahimiya', 'Al-Manshiyya', 
    'Camp Schésar', 'Muharram Bik', 'Mahattat Misr', 'Cleopatra', 
    'Al-Azariṭa', 'Al-Shatibi', 'Saba Basha', 'Sidi Gaber', 'Roshdy', 
    'Bolkley', 'Moustafa Kamel', 'Kafr Abdo', 'Stanly', 'Sidi Beshr', 
    'El-Mandara', 'Al-Suyuf', 'Victoria', 'Al-Aasafirah', 'Al-Maamoura', 
    'Toson', 'Smouha', 'New Smouha', 'Borj Al-Arab', 'Loran', 
    'Al-Agamy', 'King Mariout'
  ], // Alexandria
  3: ['Al-Dabaa', 'Sidi Abdulrahman', 'Ghazala Bay', 'Al-Alamin', 'Sahel', 'Ras Al Hekma'] // North Coast
};

filteredRegions: string[] = [];

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
      receptionPieces: [0],
      floor: [0],
      city: [1],
      region: [''],
      address: [''],
      listingType: [0],
      propertyType: [0],
      distanceFromLandmark: [''],
      buildYear: [2024],
      totalFloors: [0],
      apartmentsPerFloor: [0],
      elevatorsCount: [0],
      view: [''],
      hasMasterRoom: [false],
      hasHotelEntrance: [false],
      hasSecurity: [false],
      hasParking: [false],
      isFirstOwner: [false],
      isLegalReconciled: [false]
    });

    this.propertyId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadPropertyData();

    this.editForm.get('city')?.valueChanges.subscribe(cityId => {
    this.updateRegions(cityId);
  });
  }

 loadPropertyData() {
    this.propertyService.getPropertyById(this.propertyId).subscribe({
      next: (data: any) => {
        this.updateRegions(this.mapCityToId(data.city));
        this.editForm.patchValue({
          ...data,
          city: this.mapCityToId(data.city),
          listingType: this.mapListingToId(data.listingType),
          propertyType: this.mapTypeToId(data.propertyType)
        });
        this.existingPhotos.set(data.photos);
      }
    });
  }
  updateRegions(cityId: any) {
  // تحويل cityId لرقم للتأكد
  const id = Number(cityId);
  this.filteredRegions = this.regionsMapping[id] || [];
  
  // إعادة تصغير حقل المنطقة لو المدينة اتغيرت عشان ميفضلش مختار منطقة قديمة غلط
  if (this.editForm.get('region')?.value) {
     this.editForm.get('region')?.setValue('');
  }
}

  // دالة التحكم في عداد الغرف/الحمامات
  updateCounter(controlName: string, amount: number) {
    const control = this.editForm.get(controlName);
    if (control) {
      const newValue = (control.value || 0) + amount;
      if (newValue >= 0) control.patchValue(newValue);
    }
  }

  setExistingAsMain(photoId: number) {
  this.alertService.showLoading('Updating cover photo...');
  this.propertyService.setMainPhoto(this.propertyId, photoId).subscribe({
    next: () => {
      this.alertService.close();
      this.loadPropertyData(); // إعادة تحميل الصور لتظهر العلامة على الجديدة
      this.alertService.success('Main photo updated!');
    }
  });
}

// دالة اختيار صورة رئيسية من الصور الجديدة (قبل الرفع)
setNewAsMain(index: number) {
  this.newMainPhotoIndex = index;
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
      this.alertService.showLoading('Saving changes...');
      const formData = new FormData();
      Object.keys(this.editForm.value).forEach(key => {
        // نرسل المفاتيح بأسماء PascalCase لتطابق الـ DTO في الباك اند
        const pascalKey = key.charAt(0).toUpperCase() + key.slice(1);
        formData.append(pascalKey, this.editForm.value[key]);
      });

      if (this.newMainPhotoIndex !== null) {
      formData.append('MainPhotoIndex', this.newMainPhotoIndex.toString());
    }
      this.selectedPhotos().forEach(p => formData.append('Photos', p.file));

      this.propertyService.updateProperty(this.propertyId, formData).subscribe({
        next: () => {
          this.alertService.close();
          this.alertService.success('Changes saved successfully!');
          this.router.navigate(['/my-properties']);
        },
      error: () => {
        this.alertService.close();
        this.alertService.error('Update failed');
      }
    });
  }
}
}