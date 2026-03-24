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
  //selectedPhotos = signal<{ file: File, preview: string }[]>([]);
  selectedPhotos = signal<{ file: File, preview: string, originalFile: File, originalPreview: string, isWatermarked: boolean }[]>([]);

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
    'Al-Alamin': ['Zahra', 'Crysta', 'Plage', 'Lagoons', 'Alma', 'IL Latini', 'Downtown', 'Plam Hills North Coast', 'Mazarine', 'Golf Porto Marina', 'Marina 1', 'Marina 2', 'Marina 3', 'Marina 4', 'Marina 5', 'Marina 6', 'Marina 7', 'Marina 8'],
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
      pricePerMeter: ['', Validators.required],
      downPaymentPercentage: [''],
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
      const typeNum = Number(type);
      const priceControl = this.propertyForm.get('price');
      const ppmControl = this.propertyForm.get('pricePerMeter');
      const securityControl = this.propertyForm.get('securityDeposit');

      // 🟢 1. التعامل مع حقل "سعر المتر" (Primary فقط)
      if (typeNum === 2) { 
        ppmControl?.setValidators([Validators.required]);
      } else {
        ppmControl?.clearValidators();
        ppmControl?.setValue(''); // تصفير الحقل لو غير النوع
      }

      // 🟢 2. التعامل مع السعر الإجمالي والتأمين (حسب الإيجار أو البيع)
      if (typeNum === 1) { // إيجار
        priceControl?.setValidators([Validators.required, minAmountValidator(1)]);
        securityControl?.setValidators([Validators.required, minAmountValidator(0)]);
      } else { // أي نوع بيع آخر
        priceControl?.setValidators([Validators.required, minAmountValidator(1000000)]);
        securityControl?.clearValidators();
      }
      
      priceControl?.updateValueAndValidity();
      ppmControl?.updateValueAndValidity();
      securityControl?.updateValueAndValidity();
    });

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

isPrimary(): boolean {
    return Number(this.propertyForm.get('listingType')?.value) === 2;
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

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedPhotos.update(prev =>[
          ...prev, 
          { 
            file: file, 
            preview: e.target.result, 
            originalFile: file,             // حفظ الملف الأصلي للرجوع إليه
            originalPreview: e.target.result, // حفظ العرض الأصلي
            isWatermarked: false 
          }
        ]);
        };
      reader.readAsDataURL(file);
    }
  }
}

  
  // 🟢 دالة إضافة/إزالة العلامة المائية للصور الجديدة
  toggleWatermark(index: number) {
    const photoObj = this.selectedPhotos()[index];

    // 1. حالة الإزالة
    if (photoObj.isWatermarked) {
      this.selectedPhotos.update(photos => {
        const newPhotos = [...photos];
        newPhotos[index].file = newPhotos[index].originalFile;
        newPhotos[index].preview = newPhotos[index].originalPreview;
        newPhotos[index].isWatermarked = false;
        return newPhotos;
      });
      return;
    }

    // 2. حالة الإضافة
    this.alertService.showLoading('Applying Logo...');

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = photoObj.originalPreview; 
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const watermark = new Image();
      watermark.src = 'logo.png'; // 🟢 مسار اللوجو الشفاف بتاعك
      
      watermark.onload = () => {
        // 🟢 الحجم: 50% من عرض الصورة (هيكون كبير وفي المركز)
        const wmWidth = img.width * 0.50; 
        const wmHeight = watermark.height * (wmWidth / watermark.width);
        
        // 🟢 المكان: في المنتصف تماماً أفقياً ورأسياً
        const x = (img.width - wmWidth) / 2;
        const y = (img.height - wmHeight) / 2;

        // 🟢 الشفافية: 50% عشان ميعميش تفاصيل الشقة
        ctx.globalAlpha = 0.5; 
        ctx.drawImage(watermark, x, y, wmWidth, wmHeight);
        ctx.globalAlpha = 1.0; 

        canvas.toBlob((blob) => {
          if (blob) {
            // 🟢 التصدير كـ JPEG للحفاظ على مساحة السيرفر وسرعة الموقع
            const newFile = new File([blob], `watermarked_${photoObj.originalFile.name}`, { type: 'image/jpeg' });
            const newPreview = canvas.toDataURL('image/jpeg', 0.85); 

            this.selectedPhotos.update(photos => {
              const newPhotos = [...photos];
              newPhotos[index].file = newFile;
              newPhotos[index].preview = newPreview;
              newPhotos[index].isWatermarked = true;
              return newPhotos;
            });
            this.alertService.close();
          } else {
             this.alertService.close();
             this.alertService.error("Failed to process this specific image.");
          }
        }, 'image/jpeg', 0.85); // 0.85 دي نسبة ضغط ممتازة للجودة
      };
      
      watermark.onerror = () => {
         this.alertService.close();
         this.alertService.error("Logo file not found!");
      };
    };
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
    formData.append('Description', f.description);
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

formData.append('AreaType', f.areaType?.toString() || '0');
formData.append('VillaCategory', f.villaCategory?.toString() || '0');
if (f.villaSubType !== null) {
  formData.append('VillaSubType', f.villaSubType.toString());
}

    // المميزات الجديدة
    formData.append('HasPool', f.hasPool.toString());
    formData.append('HasGarden', f.hasGarden.toString());
    formData.append('HasLandShare', (f.hasLandShare || false).toString());
    formData.append('IsLicensed', (f.isLicensed || false).toString());
    formData.append('IsLegalReconciled', (f.isLegalReconciled || false).toString());
    formData.append('IsFirstOwner', (f.isFirstOwner || false).toString());
    formData.append('HasMasterRoom', (f.hasMasterRoom || false).toString());
    formData.append('HasHotelEntrance', (f.hasHotelEntrance || false).toString());
    formData.append('HasSecurity', (f.hasSecurity || false).toString());
    formData.append('HasParking', (f.hasParking || false).toString());
    formData.append('HasBalcony', (f.hasBalcony || false).toString());
    formData.append('HasElectricityMeter', (f.hasElectricityMeter || false).toString());
    formData.append('HasWaterMeter', (f.hasWaterMeter || false).toString());
    formData.append('HasGasMeter', (f.hasGasMeter || false).toString());

    // 9. الدفع والأسعار التفصيلية (الحقول التي كانت ناقصة مع تنظيفها من الفواصل)
    formData.append('PaymentMethod', f.paymentMethod || 'Full Cash');
    formData.append('InstallmentYears', (f.installmentYears || 0).toString());
    formData.append('DownPayment', (f.downPayment || '').toString().replace(/,/g, '') || '0');
    formData.append('QuarterInstallment', (f.quarterInstallment || '').toString().replace(/,/g, '') || '0');
    formData.append('SecurityDeposit', (f.securityDeposit || '').toString().replace(/,/g, '') || '0');
    formData.append('MonthlyRent', (f.monthlyRent || '').toString().replace(/,/g, '') || '0');

    // الحقول الفنية
    formData.append('Floor', (f.floor || 0).toString());
    formData.append('TotalFloors', (f.totalFloors || 0).toString());
    if (this.isUnderConstruction()) {
  formData.append('BuildYear', '0'); // نبعته 0 لو تحت الإنشاء
} else {
  formData.append('BuildYear', (f.buildYear || '').toString());
}
    formData.append('Finishing', f.finishing.toString());
    formData.append('Rooms', (f.rooms || 0).toString());
    formData.append('Bathrooms', (f.bathrooms || 0).toString());
    formData.append('ReceptionPieces', (f.receptionPieces || 0).toString());
    formData.append('DistanceFromLandmark', f.distanceFromLandmark || '');
    formData.append('View', f.view || '');
    formData.append('ApartmentsPerFloor', (f.apartmentsPerFloor || 1).toString());
    formData.append('ElevatorsCount', (f.elevatorsCount || 0).toString());


    formData.append('DeliveryStatus', (f.deliveryStatus || 0).toString());
    if (f.deliveryYear !== null && f.deliveryYear !== '') {
      formData.append('DeliveryYear', f.deliveryYear.toString());
    }

    

    formData.append('MainPhotoIndex', this.mainPhotoIndex.toString());
    this.selectedPhotos().forEach(p => formData.append('Photos', p.file));

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
  const totalFloors = Number(this.propertyForm.get('totalFloors')?.value) || 0;

  if (control) {
    const currentValue = Number(control.value) || 0;
    const newValue = currentValue + amount;

    if (newValue < 0) return;

    if (controlName === 'floor' && totalFloors > 0 && newValue > totalFloors) {
      this.alertService.error(`Floor number cannot exceed ${totalFloors}!`);
      return;
    }

    control.patchValue(newValue);
  }
}

validateFloorInput() {
  const floor = Number(this.propertyForm.get('floor')?.value) || 0;
  const total = Number(this.propertyForm.get('totalFloors')?.value) || 0;

  if (total > 0 && floor > total) {
    this.propertyForm.get('floor')?.patchValue(total);
    this.alertService.error(`Floor cannot be higher than total building floors (${total})`);
  }
}
  formatPercentage(event: any, controlName: string) {
    let input = event.target.value;
    let pureDigits = input.replace(/[^0-9.]/g, '');
    // منع كتابة أكثر من نقطة عشرية
    if ((pureDigits.match(/\./g) ||[]).length > 1) {
      pureDigits = pureDigits.substring(0, pureDigits.length - 1);
    }
    this.propertyForm.get(controlName)?.setValue(pureDigits, { emitEvent: false });
  }

  // 2. حساب السعر الكلي = المساحة × سعر المتر
  roundAmount(value: number): number {
    if (value <= 0) return 0;
    return Math.round(value / 1000) * 1000;
  }

  // 1. حساب السعر الكلي 
  calculateTotalPrice() {
    if (!this.isPrimary()) return; // 🟢 لو مش Primary، متعملش أي حسابات للسعر

    const area = this.getPureNumber('area');
    const ppm = this.getPureNumber('pricePerMeter');
    if (area > 0 && ppm > 0) {
      const total = this.roundAmount(area * ppm); 
      this.propertyForm.get('price')?.setValue(total.toLocaleString('en-US'), { emitEvent: false });
      if (this.isRent()) this.propertyForm.get('monthlyRent')?.setValue(total.toLocaleString('en-US'), { emitEvent: false });
      this.onAmountChange();
    }
  }

  // 2. حساب مبلغ المقدم بناءً على النسبة
  onPercentageChange() {
    const total = this.getPureNumber('price');
    const dpPercent = Number(this.propertyForm.get('downPaymentPercentage')?.value || 0);
    if (total > 0 && dpPercent >= 0) {
      // تطبيق التقريب
      const dpAmount = this.roundAmount(total * (dpPercent / 100));
      this.propertyForm.get('downPayment')?.setValue(dpAmount.toLocaleString('en-US'), { emitEvent: false });
      this.calculateInstallments();
    }
  }

  // 3. حساب النسبة لو كتب المبلغ بإيده
  onAmountChange() {
    const total = this.getPureNumber('price');
    const dpAmount = this.getPureNumber('downPayment');
    if (total > 0 && dpAmount >= 0) {
      const dpPercent = (dpAmount / total) * 100;
      this.propertyForm.get('downPaymentPercentage')?.setValue(parseFloat(dpPercent.toFixed(2)), { emitEvent: false });
      this.calculateInstallments();
    }
  }

  // 4. حساب القسط الربع سنوي
  calculateInstallments() {
    const total = this.getPureNumber('price');
    const dpAmount = this.getPureNumber('downPayment');
    const years = this.getPureNumber('installmentYears');
    if (total > 0 && years > 0) {
      const remaining = total - dpAmount;
      if (remaining > 0) {
        // تطبيق التقريب
        const quarter = this.roundAmount((remaining / years) / 4);
        this.propertyForm.get('quarterInstallment')?.setValue(quarter.toLocaleString('en-US'), { emitEvent: false });
      } else {
        this.propertyForm.get('quarterInstallment')?.setValue('0', { emitEvent: false });
      }
    }
  }
}