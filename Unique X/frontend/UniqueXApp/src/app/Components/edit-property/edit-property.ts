import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PropertyService } from '../../Services/property';
import { AlertService } from '../../Services/alert';

function minAmountValidator(min: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const currentAmount = Number(control.value.toString().replace(/,/g, ''));
    return currentAmount < min ? { 'min': true } : null;
  };
}

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
isSubmitting = false;

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


projectsMapping: any = {
  1: { // Cairo
    'any': ['Twin towers', 'Valore smouha', 'Valore antoniadis', 'East towers']
  },
  2: { // Alexandria
    'any': [
      'Palm hills', 'Sawari', 'The One', 'Muruj', 'Alex west', 'Skyline', 'Crystal towers', 
      'Grand view', 'Twin towers', 'Valore smouha', 'Valore antoniadis', 'East towers', 
      'Fayroza smouha', 'Saraya gardens', 'Veranda', 'Jackranda', 'Jara', 'Oria city', 
      'El safwa city', 'Vida', 'Abha hayat', 'Pharma city', 'Jewar', 'Ouruba royals', 
      'Soly vie', 'San Stefano royals', 'Malaaz'
    ]
  },
  3: { // North Coast
    'Ras Al Hekma': ['Ramla', 'Azha', 'Naia Bay', 'El Masyaf', 'Fouka Bay', 'Remal', 'Hacienda West', 'Seashore', 'Ogami', 'Seashell Playa', 'La Vista Ras El Hikma', 'Caesar', 'Koun', 'Caesar Bay', 'Lyv', 'Mountain View Ras El Hikma', 'Solare', 'Swan Lake', 'Seashell Ras El Hikma', 'The Med', 'Gaia', 'June', 'Direction White', 'Cali Coast', 'Hacienda Waters', 'Mar Bay', 'Jefaira', 'Sea View', 'Safia', 'Salt', 'Azzar Islands', 'Saada North Coast', 'Katamya Coast', 'Soul', 'Lvls'],
    'Al-Dabaa': ['Dose', 'The Water Way', 'Seazen', 'La Vista Bay', 'La Vista Bay East', 'Hacienda Blue', 'La Sirena', 'D bay', 'South Med'],
    'Sidi Abdulrahman': ['Telal', 'Hacienda Red', 'Hacienda White', 'Amwaj', 'Q North', 'SeaShell', 'Bianchi Ilios', 'Shamasi', 'Masaya', 'Location', 'Stella Heights', 'Alura', 'La vista Cascada', 'Maraasi', 'Stella', 'Diplo 3', 'Haceinda Bay'],
    'Ghazala Bay': ['Playa Ghazala', 'Ghazala Bay', 'Zoya'],
    'Al-Alamin': ['Zahra', 'Crysta', 'Plage', 'Lagoons', 'Alma', 'IL Latini', 'Downtown', 'Plam Hills North Coast', 'Mazarine', 'Golf Porto Marina'],
    'sahel': ['Viller', 'The Island', 'Marina 8', 'North Code', 'Wanas Master', 'London', 'Eko Mena', 'Bungalows', 'Layana', 'Glee']
  }
};

filteredProjects: string[] = [];

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private propertyService = inject(PropertyService);
  private alertService = inject(AlertService);

  ngOnInit(): void {
    // === الجزء الجديد: بناء الفورم بكل الحقول ===
    this.editForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', Validators.required],
      price: ['', [Validators.required, minAmountValidator(1000000)]],
      area: ['', [Validators.required, Validators.min(1)]],
      rooms: [0, [Validators.min(0)]],
      bathrooms: [0, [Validators.min(0)]],
      city: [1, Validators.required],
      region: ['', Validators.required],
      projectName: [''], // جديد
      address: [''],
      listingType: [0, Validators.required],
      propertyType: [0, Validators.required],
      code: ['', Validators.required],
      finishing: [2],
      buildYear: ['', [Validators.min(1950), Validators.max(this.currentYear)]],
      floor: [0, [Validators.min(0)]],
      totalFloors: [2, [Validators.min(2)]],
      apartmentsPerFloor: [1, [Validators.min(1)]],
      elevatorsCount: [0, [Validators.min(0)]],
      receptionPieces: [0, [Validators.min(0)]],
      view: [''],
      distanceFromLandmark: [''],
      // Payment fields
      paymentMethod: ['Cash', Validators.required],
      installmentYears: [1],
      downPayment: [0],
      quarterInstallment: [0],
      monthlyRent: [0],
      securityDeposit: [0],
      // Delivery
      deliveryStatus: [0],
      deliveryYear: [null],
      // Switches
      hasMasterRoom: [false], hasHotelEntrance: [false], hasSecurity: [false],
      hasParking: [false], hasBalcony: [false], isFurnished: [false],
      isFirstOwner: [false], isLegalReconciled: [false], isLicensed: [false],
      hasWaterMeter: [false], hasElectricityMeter: [false], hasGasMeter: [false], hasLandShare: [false]
    });

    this.propertyId = Number(this.route.snapshot.paramMap.get('id'));

    // مراقبة التغييرات لتحديث القوائم
    this.editForm.get('city')?.valueChanges.subscribe(() => { this.updateRegions(); this.updateProjectsList(); });
    this.editForm.get('region')?.valueChanges.subscribe(() => this.updateProjectsList());

    this.editForm.get('listingType')?.valueChanges.subscribe(type => {
    const priceControl = this.editForm.get('price');
    
    if (Number(type) === 1) { // 1 = Rent
      // لو إيجار: اقبل أي سعر من أول 1 جنيه
      priceControl?.setValidators([Validators.required, minAmountValidator(1)]);
    } else {
      // لو بيع: ارجع لشرط المليون جنيه
      priceControl?.setValidators([Validators.required, minAmountValidator(1000000)]);
    }
    
    // تحديث الحالة فوراً عشان رسالة الخطأ تظهر أو تختفي
    priceControl?.updateValueAndValidity();
  });

  this.editForm.get('price')?.valueChanges.subscribe(val => {
    if (this.isRent()) {
      // تحديث قيمة الإيجار الشهري لتطابق السعر فوراً
      this.editForm.get('monthlyRent')?.setValue(val, { emitEvent: false });
    }
  });

  // 2. ربط الإيجار الشهري بالسعر (بالعكس)
  this.editForm.get('monthlyRent')?.valueChanges.subscribe(val => {
    if (this.isRent()) {
      this.editForm.get('price')?.setValue(val, { emitEvent: false });
    }
  });

    this.loadPropertyData();
  }

  getPureNumber(controlName: string): number {
  const val = this.editForm.get(controlName)?.value;
  if (!val) return 0;
  return Number(val.toString().replace(/,/g, ''));
}

isSecurityExceeded(): boolean {
  const totalPrice = this.getPureNumber('price');
  const security = this.getPureNumber('securityDeposit');
  
  return security > 0 && totalPrice > 0 && security > totalPrice;
}

// 1. للمبالغ المالية: تقبل أرقام فقط وتعيد رسم الفواصل أوتوماتيكياً
formatFinancial(event: any, controlName: string) {
  let input = event.target.value;

  // مسح أي شيء ليس رقماً (يمسح الحروف، السالب، النقطة، وحتى الفواصل القديمة)
  let pureDigits = input.replace(/[^0-9]/g, '');

  if (pureDigits === '') {
    this.editForm.get(controlName)?.setValue('');
    return;
  }

  // تحويل الأرقام الصافية لتنسيق أمريكي (يضع الفواصل كل 3 أرقام)
  let formatted = Number(pureDigits).toLocaleString('en-US');

  // تحديث القيمة في الفورم
  this.editForm.get(controlName)?.setValue(formatted, { emitEvent: false });
}

// 2. للأرقام الصحيحة: تمسح أي شيء ليس رقماً (لا فواصل ولا حروف ولا سالب)
formatInteger(event: any, controlName: string) {
  let input = event.target.value;

  // مسح أي رمز ليس رقماً من 0 لـ 9
  let pureDigits = input.replace(/[^0-9]/g, '');

  // تحديث الحقل بالقيمة الصافية
  this.editForm.get(controlName)?.setValue(pureDigits, { emitEvent: false });
}

// تعديل دالة التحقق المالي العامة لتشمل التأمين
isValidFinance(): boolean {
  if (this.isRent()) {
    return !this.isSecurityExceeded();
  }
  
  // شروط البيع القديمة (المقدم والقسط)
  const total = this.getPureNumber('price');
  const down = this.getPureNumber('downPayment');
  const quarter = this.getPureNumber('quarterInstallment');
  return down < total && quarter < total;
}

// دالة لفحص هل المقدم أو القسط تخطى السعر الإجمالي
isFinanceExceeded(controlName: string): boolean {
  const totalPrice = this.getPureNumber('price');
  const amount = this.getPureNumber(controlName);
  
  // يظهر الخطأ فقط لو القيمة أكبر من صفر وفعلاً أكبر من السعر التوتال
  return amount > 0 && totalPrice > 0 && amount > totalPrice;
}

  // === الجزء الجديد: جلب البيانات وعمل الـ Patch مع التنسيق ===
  loadPropertyData() {
    this.propertyService.getPropertyById(this.propertyId).subscribe({
      next: (data: any) => {
        // 1. تحويل النصوص لأرقام Enums
        const cityId = this.mapCityToId(data.city);
        
        // 2. تحديث القوائم المنسدلة أولاً
        this.updateRegions(cityId);
        this.updateProjectsList(cityId, data.region);

        // 3. ملء الفورم
        this.editForm.patchValue({
          ...data,
          city: cityId,
          listingType: this.mapListingToId(data.listingType),
          propertyType: this.mapTypeToId(data.propertyType),
          finishing: this.mapFinishingToId(data.finishing),
          deliveryStatus: this.mapDeliveryToId(data.deliveryStatus)
        });

        // 4. تنسيق مبالغ الأسعار بالفواصل فوراً عند التحميل
        this.formatInitialAmount('price');
        this.formatInitialAmount('downPayment');
        this.formatInitialAmount('quarterInstallment');
        this.formatInitialAmount('monthlyRent');
        this.formatInitialAmount('securityDeposit');

        this.existingPhotos.set(data.photos);
      }
    });
  }

  showDeliveryMenu(): boolean {
  const type = Number(this.editForm.get('listingType')?.value);
  return type === 2 || type === 3;
}

  // دالة مساعدة لتنسيق المبالغ عند التحميل لأول مرة
  formatInitialAmount(controlName: string) {
    const val = this.editForm.get(controlName)?.value;
    if (val) {
      this.editForm.get(controlName)?.setValue(Number(val).toLocaleString('en-US'), { emitEvent: false });
    }
  }

  // دالة تنسيق الرقم أثناء الكتابة (Commas)
  formatNumber(event: any, controlName: string) {
    let input = event.target.value.replace(/,/g, '');
    if (input === '') { this.editForm.get(controlName)?.setValue(''); return; }
    let formatted = Number(input).toLocaleString('en-US');
    this.editForm.get(controlName)?.setValue(formatted, { emitEvent: false });
  }

  // منطق إخفاء وإظهار الحقول
  isRent() { return Number(this.editForm.get('listingType')?.value) === 1; }
  isProject() { const t = Number(this.editForm.get('listingType')?.value); return t === 2 || t === 3; }
  isInstallment() { return this.editForm.get('paymentMethod')?.value === 'Installment'; }
  isUnderConstruction() { return Number(this.editForm.get('deliveryStatus')?.value) === 1; }

  // تحديث المناطق والمشروعات
  updateRegions(cId?: number) {
    const id = cId || Number(this.editForm.get('city')?.value);
    this.filteredRegions = this.regionsMapping[id] || [];
  }

  updateProjectsList(cId?: number, rName?: string) {
    const id = cId || Number(this.editForm.get('city')?.value);
    const reg = rName || this.editForm.get('region')?.value;
    if (id === 1 || id === 2) this.filteredProjects = this.projectsMapping[id]?.['any'] || [];
    else if (id === 3) this.filteredProjects = this.projectsMapping[3]?.[reg] || [];
    else this.filteredProjects = [];
  }

  // معالجة الصور
  onFileSelect(event: any) {
  const files = event.target.files;
  if (files) {
    // حساب (الموجود فعلاً على السيرفر + المختار حديثاً في القائمة)
    const existingCount = this.existingPhotos().length;
    const newlySelectedCount = this.selectedPhotos().length;
    const totalCurrent = existingCount + newlySelectedCount;
    
    const remainingLimit = 10 - totalCurrent;

    if (files.length > remainingLimit) {
      this.alertService.error(
        `Limit Reached! You have ${existingCount} existing and ${newlySelectedCount} new photos. You can only add ${remainingLimit} more.`,
        'Upload Limit'
      );
      event.target.value = '';
      return;
    }

    // إكمال العملية إذا كان العدد ضمن الحد المسموح
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedPhotos.update(prev => [...prev, { file: file, preview: e.target.result }]);
      };
      reader.readAsDataURL(file);
    }
  }
}


  setExistingAsMain(photoId: number) {
    this.alertService.showLoading('Updating...');
    this.propertyService.setMainPhoto(this.propertyId, photoId).subscribe({
      next: () => { this.alertService.close(); this.loadPropertyData(); this.alertService.success('Done'); }
    });
  }

  setNewAsMain(i: number) { this.newMainPhotoIndex = i; }
  
  removePhoto(i: number) {
    this.selectedPhotos.update(p => { const n = [...p]; n.splice(i, 1); return n; });
  }

  // === الجزء المطور: الإرسال وتنظيف الـ NULL والفواصل ===
  onSubmit() {
    if (this.editForm.valid) {
      this.isSubmitting = true;
      this.alertService.showLoading('Saving changes...');
      const formData = new FormData();
      const vals = this.editForm.value;

      Object.keys(vals).forEach(key => {
        let value = vals[key];
        if (value !== null && value !== undefined) {
          let strVal = value.toString();
          // مسح الفواصل قبل الإرسال للباك اند
          if (strVal.includes(',')) strVal = strVal.replace(/,/g, '');
          
          const pascalKey = key.charAt(0).toUpperCase() + key.slice(1);
          formData.append(pascalKey, strVal);
        }
      });

      if (this.newMainPhotoIndex !== null) formData.append('MainPhotoIndex', this.newMainPhotoIndex.toString());
      this.selectedPhotos().forEach(p => formData.append('Photos', p.file));

      this.propertyService.updateProperty(this.propertyId, formData).subscribe({
        next: () => { this.alertService.close(); this.alertService.success('Saved!'); this.router.navigate(['/my-properties']); },
        error: () => { this.alertService.close(); this.isSubmitting = false; this.alertService.error('Error'); }
      });
    }
  }

  // العدادات والتحقق من الأدوار
  updateCounter(name: string, amt: number) {
    const ctrl = this.editForm.get(name);
    const total = this.editForm.get('totalFloors')?.value || 0;
    if (ctrl) {
      const newVal = (ctrl.value || 0) + amt;
      if (newVal >= 0) {
        if (name === 'floor' && newVal > total) return;
        ctrl.patchValue(newVal);
      }
    }
  }

  validateFloorInput() {
    const f = this.editForm.get('floor')?.value;
    const t = this.editForm.get('totalFloors')?.value;
    if (f > t) this.editForm.get('floor')?.patchValue(t);
  }

  // خرائط التحويل من نصوص لأرقام (IDs)
  mapCityToId(c: string) { const m: any = { 'Cairo': 1, 'Alexandria': 2, 'NorthCoast': 3 }; return m[c] || 1; }
  mapListingToId(t: string) { const m: any = { 'Resale': 0, 'Rent': 1, 'Primary': 2, 'ResaleProject': 3 }; return m[t] ?? 0; }
  mapTypeToId(t: string) { const m: any = { 'Apartment': 0, 'Villa': 1, 'Shop': 2, 'Office': 3, 'Chalet': 4, 'FullFloor': 5 }; return m[t] ?? 0; }
  mapFinishingToId(f: string) { const m: any = { 'CoreAndShell': 0, 'SemiFinished': 1, 'FullyFinished': 2, 'SemiFurnished': 3, 'FullyFurnished': 4 }; return m[f] ?? 2; }
  mapDeliveryToId(s: string) { const m: any = { 'Ready': 0, 'UnderConstruction': 1 }; return m[s] ?? 0; }

}