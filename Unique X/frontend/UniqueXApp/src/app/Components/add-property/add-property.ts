import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { PropertyService } from '../../Services/property';
import { AlertService } from '../../Services/alert';
import { Router, ActivatedRoute } from '@angular/router';
import { CurrencyService } from '../../Services/currency.service';

function minAmountValidator(min: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    
    const currentAmount = Number(control.value.toString().replace(/,/g, ''));
    
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
  selectedFiles: File[] = [];
  selectedPhotos = signal<{ file: File, preview: string, originalFile: File, originalPreview: string, isWatermarked: boolean }[]>([]);

mainPhotoIndex: number = 0;
isSubmitting = false;
currentYear = new Date().getFullYear(); 

currentPrefix: string = '';

// 🟢 لو داخل من زرار "Add Your Property" في الناف بار (بدل فورم البروكر العادي)
// الوحدة هتروح لتاب "Owners Properties" عند الأدمن، والبروكر بيتحدد بعدين وقت الموافقة
private route = inject(ActivatedRoute);
ownerMode: boolean = false;



  // 🟢 بتتحمل بالكامل من الداتابيز (صفحة Developers & Projects بالأدمن) - شوفي loadDynamicLookups()
regionsMapping: any = {};

filteredRegions: string[] = []; 


  // 🟢 بتتحمل بالكامل من الداتابيز (صفحة Developers & Projects بالأدمن) - شوفي loadDynamicLookups()
projectsMapping: any = {};

  // 🟢 بتتحمل بالكامل من الداتابيز (صفحة Developers & Projects بالأدمن) - شوفي loadDynamicLookups()
dummyDevelopers: any[] = [];

  // 🟢 بتتحمل بالكامل من الداتابيز (صفحة Developers & Projects بالأدمن) - شوفي loadDynamicLookups()
primaryProjectCodes: any = {};

    // 🟢 بتتحمل بالكامل من الداتابيز (صفحة Developers & Projects بالأدمن) - شوفي loadDynamicLookups()
resaleProjectIds: any = {};

  legacySequenceStarters: any = {
    "NR93-": 51, "NPR93-": 85, 
    "ARP1-": 22, "ARP2-": 38, "ARP3-": 43, "ARP6-": 13, "ARP5-": 7,
    "ARP4-": 15, "ARP9-": 3, "ARP8-": 2, "ARP7-": 18, "ARP11-": 2,
    "ARP12-": 1, "AR69-": 120, "AR72-": 59, "AR43-": 28, "AR34-": 18,
    "AR41-": 28, "AR42-": 27, "AR91-": 26, "AR33-": 15, "AR32-": 26,
    "AR68-": 18, "AR45-": 55, "AR61-": 35, "AR71-": 16, "AR67-": 37,
    "AR50-": 7, "AR47-": 43, "AR46-": 26, "AR48-": 38, "AR49-": 52,
    "AR51-": 4, "AR52-": 3, "AR56-": 54, "AR63-": 327, "AR59-": 109,
    "AR23-": 127, "AR2-": 11, "AR92-": 35, "AR97-": 15
  };

    // 🟢 بتتحمل بالكامل من الداتابيز (صفحة Developers & Projects بالأدمن) - شوفي loadDynamicLookups()
resaleZoneIds: any = {};
filteredProjects: string[] = [];

  private fb = inject(FormBuilder);
  private propertyService = inject(PropertyService);
  private alertService = inject(AlertService);
  currencyService = inject(CurrencyService);

  // 🟢 السعر بيتخزن بالجنيه المصري دايمًا زي ما هو مكتوب؛ ده بس بيدي معاينة بالعملة المختارة تحت الحقل
  convertedPreview(rawValue: any): string {
    if (!rawValue) return '';
    if (this.currencyService.selectedCurrency() === 'EGP') return '';
    const num = parseFloat(String(rawValue).replace(/,/g, ''));
    if (isNaN(num) || num <= 0) return '';
    return `≈ ${this.currencyService.format(num)}`;
  }
  private router = inject(Router);

  ngOnInit(): void {
    this.ownerMode = this.route.snapshot.data['ownerMode'] === true;
    this.loadDynamicLookups();

    this.propertyForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', Validators.required],
      price: ['',[Validators.required, minAmountValidator(1000000)]],
      area: ['',[Validators.required, Validators.min(1)]],
      rooms: [0, [Validators.min(0)]],
      bathrooms:[0, [Validators.min(0)]],
      city: [1, Validators.required], 
      region: ['', Validators.required],
      address: [''],
      listingType: [0, Validators.required],
      distanceFromLandmark: [''],
      hasMasterRoom: [false],
      receptionPieces: [0,[Validators.min(0)]],
      view: [''],
      floor: [0,[Validators.min(0)]],
      totalFloors: [2, [Validators.min(2)]],
      apartmentsPerFloor: [1, [Validators.min(1)]],
      elevatorsCount: [0,[Validators.min(0)]],
      buildYear: ['',[Validators.min(1950), Validators.max(this.currentYear)]],
      hasHotelEntrance: [false],
      ownerName: ['', Validators.required],
      ownerPhone: ['', Validators.required],
      developerName: [''],
      hasSecurity: [false],
      isFirstOwner: [false],
      isLegalReconciled: [false],
      hasParking:[false], 
      builtUpArea: [0, [Validators.min(0)]],
landArea: [0, [Validators.min(0)]],
      propertyType: [0, Validators.required],
      areaType: [0],
      villaCategory: [0],
      villaSubType: [null],
      groundRooms: [0], groundBaths: [0], groundReception: [0],
      firstRooms: [0], firstBaths:[0], firstReception: [0],
      secondRooms: [0], secondBaths: [0], secondReception: [0],
      hasPool: [false], 
      hasGarden: [false],
      hasBalcony: [false],
      isFurnished: [false],
      paymentMethod:['Full Cash', Validators.required],
      deliveryStatus: [0], 
      deliveryYear: [null],
      isLicensed: [false],
      hasWaterMeter: [false],
      hasElectricityMeter: [false],
      hasGasMeter: [false],
      hasLandShare: [false],
      pricePerMeter: [''], // 🟢 إزالة Validators.required من هنا لمنع قفل الزرار في البداية
      paymentPlans: this.fb.array([this.createPaymentPlan()]),
      securityDeposit: [0, [minAmountValidator(0)]],
      monthlyRent: [0, [minAmountValidator(0)]],
      code: ['Auto-Generated'],
      finishing: [2],
      projectName: ['']
    });

    this.propertyForm.get('city')?.valueChanges.subscribe(cityId => {
      this.updateRegions(cityId);
    });

    this.propertyForm.get('listingType')?.valueChanges.subscribe(type => {
      const typeNum = Number(type);
      const priceControl = this.propertyForm.get('price');
      const ppmControl = this.propertyForm.get('pricePerMeter');
      const securityControl = this.propertyForm.get('securityDeposit');
      const devControl = this.propertyForm.get('developerName');

      if (typeNum === 2) { 
        ppmControl?.setValidators([Validators.required]);
        devControl?.setValidators([Validators.required]);
      } else {
        ppmControl?.clearValidators();
        ppmControl?.setValue('');
        devControl?.clearValidators(); // المطور اختياري
        devControl?.setValue('');
      }

      if (typeNum === 1) { 
        priceControl?.setValidators([Validators.required, minAmountValidator(1)]);
        securityControl?.setValidators([Validators.required, minAmountValidator(0)]);
      } else { 
        priceControl?.setValidators([Validators.required, minAmountValidator(1000000)]);
        securityControl?.clearValidators();
      }
      
      priceControl?.updateValueAndValidity();
      ppmControl?.updateValueAndValidity();
      securityControl?.updateValueAndValidity();
      devControl?.updateValueAndValidity();
    });

    this.updateRegions(this.propertyForm.get('city')?.value);
    this.propertyForm.get('city')?.valueChanges.subscribe(() => this.updateProjectsList());
    this.propertyForm.get('region')?.valueChanges.subscribe(() => this.updateProjectsList());

    this.propertyForm.get('price')?.valueChanges.subscribe(val => {
  if (this.isRent()) {
    const pureDigits = val ? val.toString().replace(/,/g, '') : '';
    const formatted = pureDigits && !isNaN(Number(pureDigits))
      ? Number(pureDigits).toLocaleString('en-US')
      : val;
    this.propertyForm.get('monthlyRent')?.setValue(formatted, { emitEvent: false });
  }
});

this.propertyForm.get('monthlyRent')?.valueChanges.subscribe(val => {
  if (this.isRent()) {
    const pureDigits = val ? val.toString().replace(/,/g, '') : '';
    const formatted = pureDigits && !isNaN(Number(pureDigits))
      ? Number(pureDigits).toLocaleString('en-US')
      : val;
    this.propertyForm.get('price')?.setValue(formatted, { emitEvent: false });
  }
});

    this.propertyForm.valueChanges.subscribe(() => {
      if (this.propertyForm.invalid) {
        console.warn('Form Invalid. Check these fields:');
        Object.keys(this.propertyForm.controls).forEach(key => {
          const controlErrors = this.propertyForm.get(key)?.errors;
          if (controlErrors != null) console.error(`Field "${key}":`, controlErrors);
        });
      }
    });

     this.propertyForm.valueChanges.subscribe(() => {
      this.updateLiveCodePreview();
    });
  }

  updateLiveCodePreview() {
    const f = this.propertyForm.getRawValue();
    
    if (!f.city || f.listingType === null || f.listingType === '') {
      this.propertyForm.get('code')?.setValue('Auto-Generated', { emitEvent: false });
      return;
    }

    let city = f.city == 1 ? "C" : f.city == 2 ? "A" : f.city == 3 ? "N" : "";
    let list = (f.listingType == 0 || f.listingType == 1) ? "R" : f.listingType == 2 ? "P" : (f.city == 3 ? "PR" : "RP"); 

    let type = f.propertyType == 0 ? "A" : f.propertyType == 1 ? "V" : 
               f.propertyType == 2 ? "S" : f.propertyType == 3 ? "O" : 
               f.propertyType == 4 ? "CH" : f.propertyType == 5 ? "F" : "";

    let prefix = "";

    const getProjCodePrimary = (name: string) => {
      if(!name) return '';
      const key = Object.keys(this.primaryProjectCodes).find(k => k.toLowerCase() === name.toLowerCase());
      return key ? this.primaryProjectCodes[key] : '';
    };

    const getDevCode = (name: string) => {
      if(!name) return '';
      const found = this.dummyDevelopers.find(d => d.name.toLowerCase() === name.toLowerCase());
      return found ? found.code : name.substring(0, 2).toUpperCase();
    };

    const getResaleProjectId = (name: string) => {
      if(!name) return '';
      const key = Object.keys(this.resaleProjectIds).find(k => k.toLowerCase() === name.toLowerCase());
      return key ? this.resaleProjectIds[key] : '(ProjId)';
    };

    const getZoneId = (name: string) => {
      if(!name) return '';
      const key = Object.keys(this.resaleZoneIds).find(k => k.toLowerCase() === name.toLowerCase());
      return key ? this.resaleZoneIds[key] : '0'; 
    };

    if (f.listingType == 2) { 
      const pCode = getProjCodePrimary(f.projectName);
      const dCode = getDevCode(f.developerName);
      prefix = `${city}${list}${type}-${pCode}${dCode}-`; 
    } 
    else if (f.listingType == 3) { 
      if (f.city == 3) prefix = `NPR93-`;
      else {
        const pId = getResaleProjectId(f.projectName);
        prefix = `${city}${list}${pId}-`;
      }
    } 
    else { 
      if (f.city == 3) prefix = `NR93-`; 
      else {
        const zId = getZoneId(f.region);
        prefix = `${city}${list}${zId}-`;
      }
    }

    // 🟢 السحر هنا: لو الـ Prefix مبني صح واتغير، هنكلم الباك إند يجيب الرقم اللي عليه الدور!
    if (prefix && this.currentPrefix !== prefix && !prefix.includes('(ProjId)') && !prefix.includes('(Zone)')) {
      this.currentPrefix = prefix; 
      this.propertyForm.get('code')?.setValue(`${prefix}Loading...`, { emitEvent: false }); 

      this.propertyService.getNextCode(prefix).subscribe({
        next: (res) => {
          this.propertyForm.get('code')?.setValue(res.code, { emitEvent: false });
        },
        error: () => {
          this.propertyForm.get('code')?.setValue(`${prefix}1`, { emitEvent: false });
        }
      });
    } else if (prefix.includes('(ProjId)') || prefix.includes('(Zone)')) {
      this.propertyForm.get('code')?.setValue(`${prefix}***`, { emitEvent: false });
    }
  }


  isSecurityExceeded(): boolean {
    const totalPrice = this.getPureNumber('price');
    const security = this.getPureNumber('securityDeposit');
    return security > 0 && totalPrice > 0 && security > totalPrice;
  }

  isVilla(): boolean { return Number(this.propertyForm.get('propertyType')?.value) === 1; }
  isPrimary(): boolean { return Number(this.propertyForm.get('listingType')?.value) === 2; }
  isRent(): boolean { return Number(this.propertyForm.get('listingType')?.value) === 1; }
  isProject(): boolean { const type = Number(this.propertyForm.get('listingType')?.value); return type === 2 || type === 3; }
  isInstallmentSelected(): boolean { return this.propertyForm.get('paymentMethod')?.value === 'Installment'; }
  isInstallment(): boolean { return this.propertyForm.get('paymentMethod')?.value === 'Installment'; }
  isUnderConstruction(): boolean { return Number(this.propertyForm.get('deliveryStatus')?.value) === 1; }

  isValidFinance(): boolean {
    if (this.isRent()) return !this.isSecurityExceeded();
    const total = this.getPureNumber('price');
    const down = this.getPureNumber('downPayment');
    const quarter = this.getPureNumber('quarterInstallment');
    return down < total && quarter < total;
  }

  getPureNumber(controlName: string): number {
    const val = this.propertyForm.get(controlName)?.value;
    if (!val) return 0;
    return Number(val.toString().replace(/,/g, ''));
  }

  isFinanceExceeded(controlName: string): boolean {
    const totalPrice = this.getPureNumber('price');
    const amount = this.getPureNumber(controlName);
    return amount > 0 && totalPrice > 0 && amount > totalPrice;
  }

  // ================== 🟢 الترجمة والتنسيقات (مهم جداً للموبايل) ==================
  convertArabicToEnglish(str: string): string {
    if (!str) return '';
    const arabicNumbers =['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return str.replace(/[٠-٩]/g, (char) => arabicNumbers.indexOf(char).toString());
  }

  formatFinancial(event: any, controlName: string) {
    let input = this.convertArabicToEnglish(event.target.value);
    let pureDigits = input.replace(/[^0-9]/g, '');
    if (pureDigits === '') { this.propertyForm.get(controlName)?.setValue(''); return; }
    let formatted = Number(pureDigits).toLocaleString('en-US');
    this.propertyForm.get(controlName)?.setValue(formatted, { emitEvent: false });
  }

  formatInteger(event: any, controlName: string) {
    let input = this.convertArabicToEnglish(event.target.value);
    let pureDigits = input.replace(/[^0-9]/g, '');
    this.propertyForm.get(controlName)?.setValue(pureDigits, { emitEvent: false });
  }

  formatPercentage(event: any, controlName: string) {
    let input = this.convertArabicToEnglish(event.target.value);
    let pureDigits = input.replace(/[^0-9.]/g, '');
    if ((pureDigits.match(/\./g) ||[]).length > 1) pureDigits = pureDigits.substring(0, pureDigits.length - 1);
    this.propertyForm.get(controlName)?.setValue(pureDigits, { emitEvent: false });
  }

  // ================== 🟢 إدارة المصفوفة (FormArray) ==================
  get paymentPlans(): FormArray {
    return this.propertyForm.get('paymentPlans') as FormArray;
  }

  createPaymentPlan(years = 1, dp = '', dpPercent = '', quarter = ''): FormGroup {
  return this.fb.group({
    installmentYears: [years, [Validators.min(1)]],
    downPaymentPercentage: [dpPercent],
    downPayment: [dp],
    frequency: ['Quarterly'],      // ✅ القيمة الافتراضية
    quarterInstallment: [quarter],
    installmentAmount: ['']        // ✅ أضيفي السطر ده
  });
}

  addPaymentPlan() {
    this.paymentPlans.push(this.createPaymentPlan());
  }

  removePaymentPlan(index: number) {
    if (this.paymentPlans.length > 1) {
      this.paymentPlans.removeAt(index);
    }
  }

  formatFinancialArray(event: any, controlName: string, index: number) {
    let input = this.convertArabicToEnglish(event.target.value);
    let pureDigits = input.replace(/[^0-9]/g, '');
    let formatted = pureDigits ? Number(pureDigits).toLocaleString('en-US') : '';
    this.paymentPlans.at(index).get(controlName)?.setValue(formatted, { emitEvent: false });
  }

  formatIntegerArray(event: any, controlName: string, index: number) {
  let input = this.convertArabicToEnglish(event.target.value);
  
  // 🟢 التعديل: السماح برقم واحد فقط بعد العلامة العشرية (اختياري) أو السماح بـ float
  // السماح بالأرقام والنقطة فقط
  let pureDigits = input.replace(/[^0-9.]/g, '');
  
  // منع وجود أكثر من نقطة
  if ((pureDigits.match(/\./g) || []).length > 1) {
    pureDigits = pureDigits.substring(0, pureDigits.lastIndexOf('.'));
  }
  
  this.paymentPlans.at(index).get(controlName)?.setValue(pureDigits, { emitEvent: false });
}

  formatPercentageArray(event: any, controlName: string, index: number) {
    let input = this.convertArabicToEnglish(event.target.value);
    let pureDigits = input.replace(/[^0-9.]/g, '');
    if ((pureDigits.match(/\./g) ||[]).length > 1) pureDigits = pureDigits.substring(0, pureDigits.length - 1);
    this.paymentPlans.at(index).get(controlName)?.setValue(pureDigits, { emitEvent: false });
  }

  // ================== 🟢 دوال الحسابات الذكية ==================
  roundAmount(value: number): number {
    if (value <= 0) return 0;
    return Math.round(value / 1000) * 1000;
  }

  // 🟢 دالة جديدة: لما يغير المساحة، تقرر تحسب السعر الكلي ولا سعر المتر
  onAreaChange() {
    if (!this.isPrimary()) return;
    const area = this.getPureNumber('area');
    const ppm = this.getPureNumber('pricePerMeter');
    const total = this.getPureNumber('price');

    if (area > 0) {
      // لو كاتب سعر المتر، احسب الإجمالي
      if (ppm > 0) {
        this.calculateTotalPrice();
      } 
      // لو مش كاتب سعر المتر بس كاتب الإجمالي، احسب سعر المتر
      else if (total > 0) {
        this.calculatePricePerMeter();
      }
    }
  }

  calculateTotalPrice() {
    if (!this.isPrimary()) return; 
    const area = this.getPureNumber('area');
    const ppm = this.getPureNumber('pricePerMeter');
    
    if (area > 0 && ppm > 0) {
      const total = this.roundAmount(area * ppm); 
      this.propertyForm.get('price')?.setValue(total.toLocaleString('en-US'), { emitEvent: false });
      if (this.isRent()) this.propertyForm.get('monthlyRent')?.setValue(total.toLocaleString('en-US'), { emitEvent: false });
      this.onTotalPriceChange();
    } else if (ppm === 0) {
      this.propertyForm.get('price')?.setValue('', { emitEvent: false });
    }
  }

  // 🟢 دالة حساب سعر المتر (السعر الإجمالي ÷ المساحة)
  calculatePricePerMeter() {
    if (!this.isPrimary()) return;
    const area = this.getPureNumber('area');
    const total = this.getPureNumber('price');

    if (area > 0 && total > 0) {
      const ppm = Math.round(total / area); // هنا مش بنقرب لأقرب 1000 عشان ده سعر متر
      this.propertyForm.get('pricePerMeter')?.setValue(ppm.toLocaleString('en-US'), { emitEvent: false });
    } else if (total === 0) {
      this.propertyForm.get('pricePerMeter')?.setValue('', { emitEvent: false });
    }
  }

  onTotalPriceChange() {
    for (let i = 0; i < this.paymentPlans.length; i++) {
      this.onAmountChange(i);
    }
  }

  onPercentageChange(index: number) {
    const total = this.getPureNumber('price');
    const plan = this.paymentPlans.at(index);
    const dpPercent = Number(plan.get('downPaymentPercentage')?.value || 0);

    if (total > 0 && dpPercent >= 0) {
      const dpAmount = this.roundAmount(total * (dpPercent / 100));
      plan.get('downPayment')?.setValue(dpAmount.toLocaleString('en-US'), { emitEvent: false });
      this.calculateInstallments(index);
    }
  }

  onAmountChange(index: number) {
    const total = this.getPureNumber('price');
    const plan = this.paymentPlans.at(index);
    const dpAmount = Number(plan.get('downPayment')?.value.toString().replace(/,/g, '') || 0);

    if (total > 0 && dpAmount >= 0) {
      const dpPercent = (dpAmount / total) * 100;
      plan.get('downPaymentPercentage')?.setValue(parseFloat(dpPercent.toFixed(2)), { emitEvent: false });
      this.calculateInstallments(index);
    }
  }

 calculateInstallments(index: number) {
  const total = this.getPureNumber('price');
  const plan = this.paymentPlans.at(index);
  
  const dpAmount = this.getPureNumberFromPlan(plan, 'downPayment');
  // 🟢 استبدال parseInt بـ parseFloat لدعم الكسور (2.5)
  const years = parseFloat(plan.get('installmentYears')?.value || 0); 
  const frequency = plan.get('frequency')?.value || 'Quarterly';

  if (total > 0 && years > 0) {
    const remaining = total - dpAmount;
    let result = 0;

    if (remaining > 0) {
      // الحساب سيعمل بشكل صحيح مع 2.5 سنة (سواء سنوي أو ربع سنوي)
      if (frequency === 'Quarterly') {
        result = (remaining / years) / 4;
      } else if (frequency === 'Semi-Annual') {
        result = (remaining / years) / 2;
      } else if (frequency === 'Annual') {
        result = remaining / years;
      }
      
      plan.get('installmentAmount')?.setValue(this.roundAmount(result).toLocaleString('en-US'), { emitEvent: false });
    }
  }
}
// دالة مساعدة لجلب الأرقام من داخل الـ FormArray
getPureNumberFromPlan(plan: AbstractControl, controlName: string): number {
  const val = plan.get(controlName)?.value;
  if (!val) return 0;
  return Number(val.toString().replace(/,/g, ''));
}

  // 🟢 بتجيب كل الـ Developers/Projects/Regions من الداتابيز (صفحة Lookups بالأدمن) وتبني
  // بيها الليستات المستخدمة في الفورم بالكامل - مفيش أي بيانات هاردكودد تانية في الملف ده
  loadDynamicLookups(): void {
    this.propertyService.getDevelopersList().subscribe({
      next: (list) => {
        this.dummyDevelopers = list.map((d: any) => ({ code: d.code, name: d.name }));
      },
      error: () => {}
    });

    this.propertyService.getRegionsList().subscribe({
      next: (list) => {
        const mapping: any = {};
        const zoneIds: any = {};
        list.forEach((r: any) => {
          if (!mapping[r.city]) mapping[r.city] = [];
          mapping[r.city].push(r.name);
          if (r.zoneCode) zoneIds[r.name] = r.zoneCode;
        });
        this.regionsMapping = mapping;
        this.resaleZoneIds = zoneIds;
        this.refreshFilteredListsSilently();
      },
      error: () => {}
    });

    // مشاريع Primary
    this.propertyService.getProjectsList(0).subscribe({
      next: (list) => {
        const mapping = this.projectsMapping || {};
        const codes: any = {};
        list.forEach((p: any) => {
          if (p.city === 2) {
            if (!mapping[2]) mapping[2] = {};
            if (!mapping[2]['any']) mapping[2]['any'] = [];
            mapping[2]['any'].push(p.name);
          } else {
            const region = p.region || 'any';
            if (!mapping[p.city]) mapping[p.city] = {};
            if (!mapping[p.city][region]) mapping[p.city][region] = [];
            mapping[p.city][region].push(p.name);
          }
          if (p.code) codes[p.name] = p.code;
        });
        this.projectsMapping = mapping;
        this.primaryProjectCodes = codes;
        this.refreshFilteredListsSilently();
      },
      error: () => {}
    });

    // مشاريع Resale
    this.propertyService.getProjectsList(1).subscribe({
      next: (list) => {
        const mapping = this.projectsMapping || {};
        const ids: any = {};
        list.forEach((p: any) => {
          if (p.city === 2) {
            if (!mapping[2]) mapping[2] = {};
            if (!mapping[2]['any']) mapping[2]['any'] = [];
            mapping[2]['any'].push(p.name);
          } else {
            const region = p.region || 'any';
            if (!mapping[p.city]) mapping[p.city] = {};
            if (!mapping[p.city][region]) mapping[p.city][region] = [];
            mapping[p.city][region].push(p.name);
          }
          if (p.code) ids[p.name] = p.code;
        });
        this.projectsMapping = mapping;
        this.resaleProjectIds = ids;
        this.refreshFilteredListsSilently();
      },
      error: () => {}
    });
  }

  // بتحدث الليستات الظاهرة (Regions/Projects) من غير ما تمسح اختيار المستخدم
  private refreshFilteredListsSilently(): void {
    const cityId = Number(this.propertyForm.get('city')?.value);
    const region = this.propertyForm.get('region')?.value;

    this.filteredRegions = this.regionsMapping[cityId] || [];

    if (cityId === 1 || cityId === 3) {
      this.filteredProjects = this.projectsMapping[cityId]?.[region] || [];
    } else if (cityId === 2) {
      this.filteredProjects = this.projectsMapping[cityId]?.['any'] || [];
    } else {
      this.filteredProjects = [];
    }
  }

  updateProjectsList(cId?: number, rName?: string) {
    const id = cId || Number(this.propertyForm.get('city')?.value);
    const reg = rName || this.propertyForm.get('region')?.value;
    
    // 🟢 القاهرة (1) والساحل (3) بقوا متقسمين حسب المنطقة
    if (id === 1 || id === 3) {
      this.filteredProjects = this.projectsMapping[id]?.[reg] ||[];
    } 
    // 🟢 إسكندرية (2) لسه بتعرض كل المشاريع بغض النظر عن المنطقة ('any')
    else if (id === 2) {
      this.filteredProjects = this.projectsMapping[id]?.['any'] ||[];
    } 
    else {
      this.filteredProjects =[];
    }
    
    this.propertyForm.get('projectName')?.setValue('');
  }

  updateRegions(cityId: any) {
    const id = Number(cityId);
    this.filteredRegions = this.regionsMapping[id] ||[];
    if (this.propertyForm.get('region')?.value) {
       this.propertyForm.get('region')?.setValue('');
    }
  }

  onFileSelect(event: any) {
    const files = event.target.files;
    if (files) {
      const currentCount = this.selectedPhotos().length;
      if (currentCount + files.length > 10) {
        this.alertService.error(`You can only upload a maximum of 10 photos. You already have ${currentCount}.`, 'Limit Reached');
        event.target.value = ''; 
        return;
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        this.compressImage(file).then(compressedFile => {
          const reader = new FileReader();
          reader.onload = (e: any) => {
            this.selectedPhotos.update(prev =>[
              ...prev,
              {
                file: compressedFile,
                preview: e.target.result,
                originalFile: compressedFile,
                originalPreview: e.target.result,
                isWatermarked: false
              }
            ]);
          };
          reader.readAsDataURL(compressedFile);
        });
      }
    }
  }

  compressImage(file: File): Promise<File> {
    return new Promise((resolve) => {
      const maxWidth = 1920;
      const quality = 0.75; 

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e: any) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) {
              const compressed = new File([blob], file.name, { type: 'image/jpeg' });
              resolve(compressed);
            } else {
              resolve(file); 
            }
          }, 'image/jpeg', quality);
        };
      };
    });
  }
  
  toggleWatermark(index: number) {
    const photoObj = this.selectedPhotos()[index];

    if (photoObj.isWatermarked) {
      this.selectedPhotos.update(photos => {
        const newPhotos =[...photos];
        newPhotos[index].file = newPhotos[index].originalFile;
        newPhotos[index].preview = newPhotos[index].originalPreview;
        newPhotos[index].isWatermarked = false;
        return newPhotos;
      });
      return; 
    }

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
      watermark.src = 'logo.png'; 
      
      watermark.onload = () => {
        const wmWidth = img.width * 0.50; 
        const wmHeight = watermark.height * (wmWidth / watermark.width);
        const x = (img.width - wmWidth) / 2;
        const y = (img.height - wmHeight) / 2;

        ctx.globalAlpha = 0.5; 
        ctx.drawImage(watermark, x, y, wmWidth, wmHeight);
        ctx.globalAlpha = 1.0; 

        canvas.toBlob((blob) => {
          if (blob) {
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
        }, 'image/jpeg', 0.85);
      };
      
      watermark.onerror = () => {
         this.alertService.close();
         this.alertService.error("Logo file not found!");
      };
    };
  }

  setMainPhoto(index: number) { this.mainPhotoIndex = index; }

  removePhoto(index: number) {
    this.selectedPhotos.update(prev => {
      const newPhotos = [...prev];
      newPhotos.splice(index, 1);
      return newPhotos;
    });
    if (this.mainPhotoIndex === index) this.mainPhotoIndex = 0;
  }

  // ===================== Drag & Drop reordering =====================
  draggedPhotoIndex: number | null = null;

  onPhotoDragStart(index: number) {
    this.draggedPhotoIndex = index;
  }

  onPhotoDragOver(event: DragEvent) {
    event.preventDefault(); // لازم نمنع الافتراضي عشان الـ drop يشتغل
  }

  onPhotoDrop(targetIndex: number) {
    if (this.draggedPhotoIndex === null || this.draggedPhotoIndex === targetIndex) {
      this.draggedPhotoIndex = null;
      return;
    }

    // بنحتفظ بمرجع الصورة اللي كانت معلّمة "Main" عشان لو مكانها اتغير، العلامة تفضل عليها هي مش على الرقم القديم
    const currentMainPhoto = this.selectedPhotos()[this.mainPhotoIndex];

    const photos = [...this.selectedPhotos()];
    const [moved] = photos.splice(this.draggedPhotoIndex, 1);
    photos.splice(targetIndex, 0, moved);
    this.selectedPhotos.set(photos);

    const newMainIndex = photos.indexOf(currentMainPhoto);
    this.mainPhotoIndex = newMainIndex >= 0 ? newMainIndex : 0;

    this.draggedPhotoIndex = null;
  }

  onPhotoDragEnd() {
    this.draggedPhotoIndex = null;
  }

  onSubmit() {
    if (this.isSubmitting) return;

    if (this.propertyForm.invalid) {
        this.propertyForm.markAllAsTouched(); 
        this.alertService.error("Please fill all required fields correctly.");
        return;
    }

    if (this.selectedPhotos().length === 0) {
        this.alertService.error("Please add at least one photo.");
        return;
    }

    this.isSubmitting = true;
    this.alertService.showLoading('Publishing Listing...');
    
    const formData = new FormData();
    const f = this.propertyForm.value;

    // 🟢 دالة السحر: بتغسل أي رقم جاي من الموبايل (بتحول العربي لإنجليزي وتمسح الفواصل والمسافات)
    const cleanNum = (val: any) => {
      if (val === null || val === undefined || val === '') return '0';
      let str = val.toString();
      const arabicNumbers =['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
      str = str.replace(/[٠-٩]/g, (char: string) => arabicNumbers.indexOf(char).toString());
      return str.replace(/[, ]/g, ''); // مسح أي فواصل أو مسافات
    };

    // إرسال الحقول النصية
    formData.append('Title', f.title || '');
    formData.append('Description', f.description || '');
    formData.append('OwnerName', f.ownerName || '');
    formData.append('OwnerPhone', f.ownerPhone || '');
    formData.append('DeveloperName', f.developerName || '');
    formData.append('ProjectName', f.projectName || ''); 
    formData.append('Code', f.code || '');
    formData.append('City', f.city.toString());
    formData.append('Region', f.region || '');
    formData.append('ListingType', f.listingType.toString());
    formData.append('PropertyType', f.propertyType.toString());
    formData.append('Finishing', (f.finishing || 2).toString());
    formData.append('PaymentMethod', f.paymentMethod || 'Full Cash');
    formData.append('DeliveryStatus', (f.deliveryStatus || 0).toString());
    formData.append('DistanceFromLandmark', f.distanceFromLandmark || '');
    formData.append('View', f.view || '');
    formData.append('PricePerMeter', cleanNum(f.pricePerMeter));

    // 🟢 إرسال الأرقام بعد غسيلها بـ cleanNum لضمان قبول C# لها
    formData.append('Price', cleanNum(f.price));
    formData.append('Area', cleanNum(f.area));
    formData.append('Rooms', cleanNum(f.rooms));
    formData.append('Bathrooms', cleanNum(f.bathrooms));
    formData.append('ReceptionPieces', cleanNum(f.receptionPieces));

    formData.append('BuiltUpArea', cleanNum(f.builtUpArea));
formData.append('LandArea', cleanNum(f.landArea));
    
    formData.append('Floor', cleanNum(f.floor));
    formData.append('TotalFloors', cleanNum(f.totalFloors));
    formData.append('ApartmentsPerFloor', cleanNum(f.apartmentsPerFloor));
    formData.append('ElevatorsCount', cleanNum(f.elevatorsCount));

    // حقول الفيلا (مغسولة)
    formData.append('GroundRooms', cleanNum(f.groundRooms));
    formData.append('GroundBaths', cleanNum(f.groundBaths));
    formData.append('GroundReception', cleanNum(f.groundReception));
    formData.append('FirstRooms', cleanNum(f.firstRooms));
    formData.append('FirstBaths', cleanNum(f.firstBaths));
    formData.append('FirstReception', cleanNum(f.firstReception));
    formData.append('SecondRooms', cleanNum(f.secondRooms));
    formData.append('SecondBaths', cleanNum(f.secondBaths));
    formData.append('SecondReception', cleanNum(f.secondReception));

    formData.append('AreaType', f.areaType?.toString() || '0');
    formData.append('VillaCategory', f.villaCategory?.toString() || '0');
    if (f.villaSubType !== null) {
      formData.append('VillaSubType', f.villaSubType.toString());
    }

    // المفاتيح (Booleans)
    formData.append('HasPool', (f.hasPool || false).toString());
    formData.append('HasGarden', (f.hasGarden || false).toString());
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

    // 🟢 خطط الدفع (مغسولة)
    if (f.paymentMethod === 'Installment') {
      this.paymentPlans.controls.forEach((plan, index) => {
        const y = cleanNum(plan.get('installmentYears')?.value);
        const dp = cleanNum(plan.get('downPayment')?.value);
        const q = cleanNum(plan.get('quarterInstallment')?.value);

        formData.append(`PaymentPlans[${index}].InstallmentYears`, y);
        formData.append(`PaymentPlans[${index}].DownPayment`, dp);
        formData.append(`PaymentPlans[${index}].QuarterInstallment`, q);

        formData.append(`PaymentPlans[${index}].InstallmentAmount`, cleanNum(plan.get('installmentAmount')?.value));
    formData.append(`PaymentPlans[${index}].Frequency`, plan.get('frequency')?.value);
      });
    }
    
    formData.append('SecurityDeposit', cleanNum(f.securityDeposit));
    formData.append('MonthlyRent', cleanNum(f.monthlyRent));

    // حماية سنة التسليم والبناء
    if (this.isUnderConstruction()) {
      formData.append('BuildYear', '0'); 
    } else {
      formData.append('BuildYear', cleanNum(f.buildYear));
    }

    if (f.deliveryYear !== null && f.deliveryYear !== '') {
      formData.append('DeliveryYear', cleanNum(f.deliveryYear));
    }

    formData.append('MainPhotoIndex', this.mainPhotoIndex.toString());
    formData.append('IsOwnerSubmitted', this.ownerMode.toString());
    this.selectedPhotos().forEach(p => formData.append('Photos', p.file));

    this.propertyService.addProperty(formData).subscribe({
      next: () => { 
          this.alertService.close(); 
          if (this.ownerMode) {
            this.alertService.warning('Thank you for your cooperation with Betk! Your property is now awaiting admin review.', 'Pending Review');
            this.router.navigate(['/home']);
          } else {
            this.alertService.warning('Submitted successfully! Waiting for admin approval.', 'Pending Review'); 
            this.router.navigate(['/my-properties']); 
          }
        },
      error: (err) => {
        this.alertService.close();
        this.isSubmitting = false;
        
        let errorMsg = 'Error while saving. Please check all fields.';
        if (err.error) {
          if (typeof err.error === 'string') errorMsg = err.error;
          else if (err.error.title) errorMsg = err.error.title;
          else if (err.error.errors) errorMsg = JSON.stringify(err.error.errors);
        }
        
        console.error("Backend Error:", err);
        this.alertService.error(errorMsg, 'Upload Failed');
      }
    });
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

  showDeliveryMenu(): boolean {
  const type = Number(this.propertyForm.get('listingType')?.value);
  return type === 2 || type === 3;
}
}