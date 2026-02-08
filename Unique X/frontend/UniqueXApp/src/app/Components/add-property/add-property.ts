import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PropertyService } from '../../Services/property';
import { AlertService } from '../../Services/alert';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-property',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-property.html',
  styleUrl: './add-property.css'
})
export class AddPropertyComponent implements OnInit {
  propertyForm!: FormGroup;
  selectedFiles: File[] = []; // لتخزين الصور المختارة محلياً
  selectedPhotos = signal<{ file: File, preview: string }[]>([]);
mainPhotoIndex: number = 0;
isSubmitting = false;
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
  private propertyService = inject(PropertyService);
  private alertService = inject(AlertService);
  private router = inject(Router);

  ngOnInit(): void {
    this.propertyForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(1)]],
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
  buildYear: [ '', [Validators.required, Validators.min(1800), Validators.max(this.currentYear)]],
  hasHotelEntrance: [false],
  hasSecurity: [false],
  isFirstOwner: [false],
  isLegalReconciled: [false],
  hasParking: [false], // 0 = Sale, 1 = Rent
      propertyType: [0, Validators.required],
      hasBalcony: [false],
  isFurnished: [false],
  paymentMethod: ['Full Cash', Validators.required],
  installmentYears: [1, [Validators.min(1)]] // 0 = Apartment, etc.
    });

    this.propertyForm.get('city')?.valueChanges.subscribe(cityId => {
    this.updateRegions(cityId);
  });

  // تشغيلها مرة واحدة في البداية لو فيه قيمة افتراضية
  this.updateRegions(this.propertyForm.get('city')?.value);
  }

  isInstallmentSelected(): boolean {
  return this.propertyForm.get('paymentMethod')?.value === 'Installment';
}

  updateRegions(cityId: any) {
  // تحويل cityId لرقم للتأكد
  const id = Number(cityId);
  this.filteredRegions = this.regionsMapping[id] || [];
  
  // إعادة تصغير حقل المنطقة لو المدينة اتغيرت عشان ميفضلش مختار منطقة قديمة غلط
  if (this.propertyForm.get('region')?.value) {
     this.propertyForm.get('region')?.setValue('');
  }
}

  // دالة لالتقاط الصور عند اختيارها
 onFileSelect(event: any) {
  const files = event.target.files;
  if (files) {
    this.selectedPhotos.set([]); // مسح الصور القديمة
    this.mainPhotoIndex = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      
      reader.onload = (e: any) => {
        // 2. تحديث الـ Signal باستخدام .update()
        // ده بيخلي الأنجولار "يفوق" ويرسم الصورة فوراً
        this.selectedPhotos.update(prev => [...prev, {
          file: file,
          preview: e.target.result
        }]);
      };
      
      reader.readAsDataURL(file);
    }
  }
}
setMainPhoto(index: number) {
  this.mainPhotoIndex = index;
}

removePhoto(index: number) {
  this.selectedPhotos.update(prev => {
    const newPhotos = [...prev];
    newPhotos.splice(index, 1);
    return newPhotos;
  });
  if (this.mainPhotoIndex === index) this.mainPhotoIndex = 0;
}


  onSubmit() {
  if (this.isSubmitting) return;

  // تأكدي إن فيه صور مختارة
  if (this.propertyForm.valid && this.selectedPhotos().length > 0) {
    this.isSubmitting = true;
    this.alertService.showLoading('Uploading images and saving property details...');

    const formData = new FormData();
    const formValues = this.propertyForm.value;

    // لوب ذكي: بيبعت البيانات اللي ليها قيمة بس ومبيبعتش الـ null
    Object.keys(formValues).forEach(key => {
      const value = formValues[key];
      
      // السطر ده هو الحل: لو القيمة null أو undefined مش هتتبعت أصلاً
      if (value !== null && value !== undefined) {
        const pascalKey = key.charAt(0).toUpperCase() + key.slice(1);
        formData.append(pascalKey, value.toString());
      }
    });

    // إرسال ترتيب الصورة الرئيسية
    formData.append('MainPhotoIndex', this.mainPhotoIndex.toString());

    // إرسال ملفات الصور الفعلية من الـ Signal
    this.selectedPhotos().forEach(p => {
      formData.append('Photos', p.file);
    });

    this.propertyService.addProperty(formData).subscribe({
      next: () => {
        this.alertService.close();
        this.alertService.success('Property Published Successfully!');
        this.router.navigate(['/home']);
        this.isSubmitting = false;
      },
      error: (err) => {
        this.alertService.close();
        console.error('Full Error Object:', err);
        // إظهار تفاصيل الخطأ عشان لو فيه حاجة تانية ناقصة نعرفها
        const msg = err.error?.errors ? JSON.stringify(err.error.errors) : 'Upload failed. Check your connection.';
        this.alertService.error(msg, 'Server Error');
        this.isSubmitting = false;
      }
    });
  } else if (this.selectedPhotos().length === 0) {
    this.alertService.error('Please upload at least one photo.');
  }
}

  updateCounter(controlName: string, amount: number) {
    const control = this.propertyForm.get(controlName);
    if (control) {
      const newValue = (control.value || 0) + amount;
      if (newValue >= 0) {
        control.patchValue(newValue);
      }
    }
  }
}