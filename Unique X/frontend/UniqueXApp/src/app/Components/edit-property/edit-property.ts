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
currentYear = new Date().getFullYear();

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
      title: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(1000000)]],
      area: ['', [Validators.required, Validators.min(1)]],
      rooms: [0, [Validators.min(0)]],
      bathrooms: [0, [Validators.min(0)]],
      city: [1, Validators.required], // القيمة الافتراضية القاهرة
      region: ['', Validators.required],
      address: [''],
      listingType: [0,  Validators.required],
      distanceFromLandmark: [''],
  hasMasterRoom: [false],
  receptionPieces: [0, [Validators.min(0)]],
  view: [''],
  floor: [0, [Validators.min(0)]],
  totalFloors: [2, [Validators.min(2)]],
  apartmentsPerFloor: [1, [Validators.min(1)]],
  elevatorsCount: [0, [Validators.min(0)]],
  buildYear: [ '', [Validators.required, Validators.min(1950), Validators.max(this.currentYear)]],
  hasHotelEntrance: [false],
  hasSecurity: [false],
  isFirstOwner: [false],
  isLegalReconciled: [false],
  hasParking: [false], // 0 = Sale, 1 = Rent
      propertyType: [0, Validators.required],
      hasBalcony: [false],
  isFurnished: [false],
  paymentMethod: ['Full Cash', Validators.required],
  installmentYears: [1, [Validators.min(1)]],
  deliveryStatus: [0], // 0 = Ready, 1 = Under Construction
  deliveryYear: [null],
  isLicensed: [false],
  hasWaterMeter: [false],
  hasElectricityMeter: [false],
  hasGasMeter: [false],
  hasLandShare: [false],
  downPayment: [0, [Validators.min(0)]],
  quarterInstallment: [0, [Validators.min(0)]],
  securityDeposit: [0, [Validators.min(0)]],
  monthlyRent: [0, [Validators.min(0)]],
  code: ['', Validators.required],
  finishing: [2]
    });

    this.propertyId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadPropertyData();

    this.editForm.get('city')?.valueChanges.subscribe(cityId => {
    this.updateRegions(cityId);
  });
  }

  showDeliveryMenu(): boolean {
  const type = Number(this.editForm.get('listingType')?.value);
  return type === 2 || type === 3;
}

// 3. دالة للتأكد هل الاستلام تحت الإنشاء
isUnderConstruction(): boolean {
  return Number(this.editForm.get('deliveryStatus')?.value) === 1;
}

  isInstallmentSelected(): boolean {
  return this.editForm.get('paymentMethod')?.value === 'Installment';
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
  const totalFloors = this.editForm.get('totalFloors')?.value || 0;

  if (control) {
    const newValue = (control.value || 0) + amount;

    // منع القيم السالبة
    if (newValue < 0) return;

    // شرط: رقم الدور لا يتخطى إجمالي أدوار البناية
    if (controlName === 'floor' && newValue > totalFloors) {
      this.alertService.error("Floor number cannot exceed total building floors!");
      return;
    }

    control.patchValue(newValue);
  }
}

// 3. دالة تفحص المدخلات اليدوية (عند الكتابة بالكيبورد)
validateFloorInput() {
  const floor = this.editForm.get('floor')?.value;
  const total = this.editForm.get('totalFloors')?.value;

  if (floor > total) {
    this.editForm.get('floor')?.patchValue(total);
    this.alertService.error(`Adjusted: Floor cannot be higher than ${total}`);
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

  isRent(): boolean {
  return Number(this.editForm.get('listingType')?.value) === 1;
}

// هل النوع مشروع (Primary/Resale Project)؟
isProject(): boolean {
  const type = Number(this.editForm.get('listingType')?.value);
  return type === 2 || type === 3;
}

// هل تم اختيار تقسيط؟
isInstallment(): boolean {
  return this.editForm.get('paymentMethod')?.value === 'Installment';
}

  onFileSelect(event: any) { this.selectedFiles = Array.from(event.target.files); }

  onSubmit() {
  if (this.editForm.valid) {
    this.alertService.showLoading('Saving changes...');
    const formData = new FormData();
    const formValues = this.editForm.value;

    // لوب ذكي لمنع إرسال كلمة "null"
    Object.keys(formValues).forEach(key => {
      const value = formValues[key];
      if (value !== null && value !== undefined) {
        const pascalKey = key.charAt(0).toUpperCase() + key.slice(1);
        formData.append(pascalKey, value.toString());
      }
    });

    if (this.newMainPhotoIndex !== null) {
      formData.append('MainPhotoIndex', this.newMainPhotoIndex.toString());
    }

    formData.append('DeliveryStatus', formValues.deliveryStatus.toString());
if (formValues.deliveryYear) {
    formData.append('DeliveryYear', formValues.deliveryYear.toString());
}

formData.append('IsLicensed', formValues.isLicensed.toString());
formData.append('HasWaterMeter', formValues.hasWaterMeter.toString());
formData.append('HasElectricityMeter', formValues.hasElectricityMeter.toString());
formData.append('HasGasMeter', formValues.hasGasMeter.toString());
formData.append('HasLandShare', formValues.hasLandShare.toString());
formData.append('Code', formValues.code);
formData.append('Finishing', formValues.finishing.toString());

    // إرسال الصور الجديدة لو تم اختيارها
    this.selectedPhotos().forEach(p => {
      formData.append('Photos', p.file);
    });

    this.propertyService.updateProperty(this.propertyId, formData).subscribe({
      next: () => {
        this.alertService.close();
        this.alertService.success('Changes saved successfully!');
        this.router.navigate(['/my-properties']);
      },
      error: (err) => {
        this.alertService.close();
        console.error(err);
        this.alertService.error('Update failed');
      }
    });
  }
}
}