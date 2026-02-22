import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { PropertyService } from '../../Services/property';
import { AlertService } from '../../Services/alert';
import { Router } from '@angular/router';

function minAmountValidator(min: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    
    // مسح الفواصل وتحويل النص لرقم فعلي
    const currentAmount = Number(control.value.toString().replace(/,/g, ''));
    
    // المقارنة بالرقم المطلوب
    return currentAmount < min ? { 'min': true } : null;
  };
}

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
  private propertyService = inject(PropertyService);
  private alertService = inject(AlertService);
  private router = inject(Router);

  ngOnInit(): void {
    this.propertyForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', Validators.required],
      price: ['', [Validators.required, minAmountValidator(1000000)]],
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
  buildYear: [ '', [Validators.min(1950), Validators.max(this.currentYear)]],
  hasHotelEntrance: [false],
  hasSecurity: [false],
  isFirstOwner: [false],
  isLegalReconciled: [false],
  hasParking: [false], // 0 = Sale, 1 = Rent
  propertyType: [0, Validators.required],
  areaType: [0],
  villaCategory: [0],
  villaSubType: [null],
  // حقول الأدوار
  groundRooms: [0], groundBaths: [0], groundReception: [0],
  firstRooms: [0], firstBaths: [0], firstReception: [0],
  secondRooms: [0], secondBaths: [0], secondReception: [0],
  // مرافق جديدة
  hasPool: [false], 
  hasGarden: [false],
  hasBalcony: [false],
  isFurnished: [false],
  paymentMethod: ['Full Cash', Validators.required],
  installmentYears: [1, [Validators.min(1)]],
  deliveryStatus: [0], 
  deliveryYear: [null],
  isLicensed: [false],
  hasWaterMeter: [false],
  hasElectricityMeter: [false],
  hasGasMeter: [false],
  hasLandShare: [false],
  downPayment: [0, [minAmountValidator(0)]],
  quarterInstallment: [0, [minAmountValidator(0)]],
  securityDeposit: [0, [minAmountValidator(0)]],
  monthlyRent: [0, [minAmountValidator(0)]],
  code: ['', Validators.required],
  finishing: [2]
    });

    this.propertyForm.get('city')?.valueChanges.subscribe(cityId => {
    this.updateRegions(cityId);
  });

  this.propertyForm.get('listingType')?.valueChanges.subscribe(type => {
    const priceControl = this.propertyForm.get('price');
    
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

  // تشغيلها مرة واحدة في البداية لو فيه قيمة افتراضية
  this.updateRegions(this.propertyForm.get('city')?.value);

  this.propertyForm.get('city')?.valueChanges.subscribe(() => this.updateProjectsList());
this.propertyForm.get('region')?.valueChanges.subscribe(() => this.updateProjectsList());

this.propertyForm.get('price')?.valueChanges.subscribe(val => {
    if (this.isRent()) {
      // تحديث قيمة الإيجار الشهري لتطابق السعر فوراً
      this.propertyForm.get('monthlyRent')?.setValue(val, { emitEvent: false });
    }
  });

  // 2. ربط الإيجار الشهري بالسعر (بالعكس)
  this.propertyForm.get('monthlyRent')?.valueChanges.subscribe(val => {
    if (this.isRent()) {
      this.propertyForm.get('price')?.setValue(val, { emitEvent: false });
    }
  });
  }

  isSecurityExceeded(): boolean {
  const totalPrice = this.getPureNumber('price');
  const security = this.getPureNumber('securityDeposit');
  
  return security > 0 && totalPrice > 0 && security > totalPrice;
}

isVilla(): boolean {
  return Number(this.propertyForm.get('propertyType')?.value) === 1;
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

// 1. للمبالغ المالية: تقبل أرقام فقط وتعيد رسم الفواصل أوتوماتيكياً
formatFinancial(event: any, controlName: string) {
  let input = event.target.value;

  // مسح أي شيء ليس رقماً (يمسح الحروف، السالب، النقطة، وحتى الفواصل القديمة)
  let pureDigits = input.replace(/[^0-9]/g, '');

  if (pureDigits === '') {
    this.propertyForm.get(controlName)?.setValue('');
    return;
  }

  // تحويل الأرقام الصافية لتنسيق أمريكي (يضع الفواصل كل 3 أرقام)
  let formatted = Number(pureDigits).toLocaleString('en-US');

  // تحديث القيمة في الفورم
  this.propertyForm.get(controlName)?.setValue(formatted, { emitEvent: false });
}

// 2. للأرقام الصحيحة: تمسح أي شيء ليس رقماً (لا فواصل ولا حروف ولا سالب)
formatInteger(event: any, controlName: string) {
  let input = event.target.value;

  // مسح أي رمز ليس رقماً من 0 لـ 9
  let pureDigits = input.replace(/[^0-9]/g, '');

  // تحديث الحقل بالقيمة الصافية
  this.propertyForm.get(controlName)?.setValue(pureDigits, { emitEvent: false });
}

  isInstallmentSelected(): boolean {
  return this.propertyForm.get('paymentMethod')?.value === 'Installment';
}

getPureNumber(controlName: string): number {
  const val = this.propertyForm.get(controlName)?.value;
  if (!val) return 0;
  return Number(val.toString().replace(/,/g, ''));
}

// دالة لفحص هل المقدم أو القسط تخطى السعر الإجمالي
isFinanceExceeded(controlName: string): boolean {
  const totalPrice = this.getPureNumber('price');
  const amount = this.getPureNumber(controlName);
  
  // يظهر الخطأ فقط لو القيمة أكبر من صفر وفعلاً أكبر من السعر التوتال
  return amount > 0 && totalPrice > 0 && amount > totalPrice;
}

updateProjectsList() {
  const cityId = Number(this.propertyForm.get('city')?.value);
  const regionName = this.propertyForm.get('region')?.value;

  if (cityId === 1 || cityId === 2) {
    // للقاهرة وإسكندرية تظهر كل المشروعات بغض النظر عن المنطقة
    this.filteredProjects = this.projectsMapping[cityId]?.['any'] || [];
  } else if (cityId === 3) {
    // للساحل تظهر المشروعات بناءً على المنطقة المختارة بدقة
    this.filteredProjects = this.projectsMapping[3]?.[regionName] || [];
  } else {
    this.filteredProjects = [];
  }
  
  // تصفير اسم المشروع لو القائمة اتغيرت
  this.propertyForm.get('projectName')?.setValue('');
}



showDeliveryMenu(): boolean {
  const type = Number(this.propertyForm.get('listingType')?.value);
  return type === 2 || type === 3;
}

formatNumber(event: any, controlName: string) {
  let input = event.target.value;

  // مسح أي شيء ليس رقماً
  let pureNumber = input.replace(/,/g, '');

  if (pureNumber === '') {
    this.propertyForm.get(controlName)?.setValue('');
    return;
  }

  // تحويل النص لرقم وتنسيقه بالفواصل
  let formatted = Number(pureNumber).toLocaleString('en-US');

  // تحديث القيمة في الفورم (بدون تشغيل أحداث إضافية لمنع التعليق)
  this.propertyForm.get(controlName)?.setValue(formatted, { emitEvent: false });
}

// 3. دالة للتأكد هل الاستلام تحت الإنشاء
isUnderConstruction(): boolean {
  return Number(this.propertyForm.get('deliveryStatus')?.value) === 1;
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
    // 1. حساب العدد الحالي للصور التي تم اختيارها مسبقاً
    const currentCount = this.selectedPhotos().length;
    
    // 2. التحقق لو العدد الإجمالي (الحالي + الجديد) تخطى 10
    if (currentCount + files.length > 10) {
      this.alertService.error(`You can only upload a maximum of 10 photos. You already have ${currentCount}.`, 'Limit Reached');
      // تصفير مدخل الملفات في الـ HTML عشان ميفتكرش إنه اختارهم
      event.target.value = ''; 
      return;
    }

    // 3. لو العدد مسموح به، كمل عملية القراءة والـ Preview
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (e: any) => {
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

isRent(): boolean {
  return Number(this.propertyForm.get('listingType')?.value) === 1;
}

// هل النوع مشروع (Primary/Resale Project)؟
isProject(): boolean {
  const type = Number(this.propertyForm.get('listingType')?.value);
  return type === 2 || type === 3;
}

// هل تم اختيار تقسيط؟
isInstallment(): boolean {
  return this.propertyForm.get('paymentMethod')?.value === 'Installment';
}


  onSubmit() {
  if (this.isSubmitting) return;
  if (this.propertyForm.valid && this.selectedPhotos().length > 0) {
    this.isSubmitting = true;
    this.alertService.showLoading('Publishing Listing...');
    
    const formData = new FormData();
    const f = this.propertyForm.value;

    // إرسال الحقول يدوياً بالأسماء التي يتوقعها الباك اند (PascalCase)
    formData.append('Title', f.title);
    formData.append('ProjectName', f.projectName || ''); // حل مشكلة الـ NULL ✅
    formData.append('Code', f.code || '');
    formData.append('Price', f.price.toString().replace(/,/g, ''));
    formData.append('Area', f.area.toString());
    formData.append('City', f.city.toString());
    formData.append('Region', f.region);
    formData.append('ListingType', f.listingType.toString());
    formData.append('PropertyType', f.propertyType.toString());

    // حقول الفيلا (حتى لو قيمتها 0 لازم تتبعت)
    formData.append('GroundRooms', (f.groundRooms || 0).toString());
    formData.append('GroundBaths', (f.groundBaths || 0).toString());
    formData.append('GroundReception', (f.groundReception || 0).toString());
    formData.append('FirstRooms', (f.firstRooms || 0).toString());
    formData.append('FirstBaths', (f.firstBaths || 0).toString());
    formData.append('FirstReception', (f.firstReception || 0).toString());
    formData.append('SecondRooms', (f.secondRooms || 0).toString());
    formData.append('SecondBaths', (f.secondBaths || 0).toString());
    formData.append('SecondReception', (f.secondReception || 0).toString());

    formData.append('ProjectName', f.projectName || '');
formData.append('AreaType', f.areaType?.toString() || '0');
formData.append('VillaCategory', f.villaCategory?.toString() || '0');
if (f.villaSubType !== null) {
  formData.append('VillaSubType', f.villaSubType.toString());
}

    // المميزات الجديدة
    formData.append('HasPool', f.hasPool.toString());
    formData.append('HasGarden', f.hasGarden.toString());

    // الحقول الفنية
    formData.append('Floor', (f.floor || 0).toString());
    formData.append('TotalFloors', (f.totalFloors || 0).toString());
    formData.append('BuildYear', f.buildYear.toString());
    formData.append('Finishing', f.finishing.toString());
    
    // ... (تأكدي من إضافة باقي الـ Switches بنفس الطريقة: HasSecurity, etc.)

    // الصور
    formData.append('MainPhotoIndex', this.mainPhotoIndex.toString());
    this.selectedPhotos().forEach(p => formData.append('Photos', p.file));

    // الإرسال
    this.propertyService.addProperty(formData).subscribe({
      next: () => {
        this.alertService.close();
        this.alertService.success('Property Published Successfully!');
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.alertService.close();
        this.isSubmitting = false;
        this.alertService.error('Error while saving. Please check all fields.');
      }
    });
  }
}

  updateCounter(controlName: string, amount: number) {
  const control = this.propertyForm.get(controlName);
  const totalFloors = this.propertyForm.get('totalFloors')?.value || 0;

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
  const floor = this.propertyForm.get('floor')?.value;
  const total = this.propertyForm.get('totalFloors')?.value;

  if (floor > total) {
    this.propertyForm.get('floor')?.patchValue(total);
    this.alertService.error(`Adjusted: Floor cannot be higher than ${total}`);
  }
}
}