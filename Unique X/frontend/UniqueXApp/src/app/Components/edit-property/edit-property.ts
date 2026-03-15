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
    this.editForm = this.fb.group({
      title: ['',[Validators.required, Validators.maxLength(200)]],
      description: ['', Validators.required],
      price: ['',[Validators.required, minAmountValidator(1000000)]],
      area: ['',[Validators.required, Validators.min(1)]],
      rooms: [0, [Validators.min(0)]],
      bathrooms: [0, [Validators.min(0)]],
      city:[1, Validators.required],
      region: ['', Validators.required],
      projectName: [''],
      address:[''],
      listingType: [0, Validators.required],
      propertyType:[0, Validators.required],
      areaType: [0],
      villaCategory: [0],
      villaSubType:[null],
      groundRooms: [0], groundBaths: [0], groundReception: [0],
      firstRooms: [0], firstBaths: [0], firstReception: [0],
      secondRooms: [0], secondBaths: [0], secondReception: [0],
      hasPool: [false], hasGarden: [false],
      code: ['', Validators.required],
      finishing: [2],
      buildYear: ['', [Validators.min(1950), Validators.max(this.currentYear)]],
      floor:[0, [Validators.min(0)]],
      totalFloors: [2,[Validators.min(2)]],
      apartmentsPerFloor: [1, [Validators.min(1)]],
      elevatorsCount: [0, [Validators.min(0)]],
      receptionPieces: [0,[Validators.min(0)]],
      view: [''],
      distanceFromLandmark: [''],
      paymentMethod: ['Cash', Validators.required],
      installmentYears: [1],
      downPayment:[0],
      quarterInstallment: [0],
      monthlyRent: [0],
      securityDeposit:[0],
      deliveryStatus: [0],
      deliveryYear: [null],
      hasMasterRoom: [false], hasHotelEntrance: [false], hasSecurity: [false],
      hasParking: [false], hasBalcony: [false], isFurnished: [false],
      isFirstOwner: [false], isLegalReconciled: [false], isLicensed: [false],
      hasWaterMeter: [false], hasElectricityMeter: [false], hasGasMeter: [false], hasLandShare: [false],
      pricePerMeter: [''],
      downPaymentPercentage: ['']
    });

    this.propertyId = Number(this.route.snapshot.paramMap.get('id'));

    this.editForm.get('city')?.valueChanges.subscribe(() => { this.updateRegions(); this.updateProjectsList(); });
    this.editForm.get('region')?.valueChanges.subscribe(() => this.updateProjectsList());

    this.editForm.get('listingType')?.valueChanges.subscribe(type => {
      const priceControl = this.editForm.get('price');
      if (Number(type) === 1) { 
        priceControl?.setValidators([Validators.required, minAmountValidator(1)]);
      } else {
        priceControl?.setValidators([Validators.required, minAmountValidator(1000000)]);
      }
      priceControl?.updateValueAndValidity();
    });

    this.editForm.get('price')?.valueChanges.subscribe(val => {
      if (this.isRent()) {
        this.editForm.get('monthlyRent')?.setValue(val, { emitEvent: false });
      }
    });

    this.editForm.get('monthlyRent')?.valueChanges.subscribe(val => {
      if (this.isRent()) {
        this.editForm.get('price')?.setValue(val, { emitEvent: false });
      }
    });

    this.loadPropertyData();
  }

  loadPropertyData() {
    this.propertyService.getPropertyById(this.propertyId).subscribe({
      next: (data: any) => {
        const cityId = this.mapCityToId(data.city);
        this.updateRegions(cityId);
        this.updateProjectsList(cityId, data.region);

        // 🟢 حل مشكلة الزرار المقفول: تصفير القيم اللي راجعة صفر عشان متضربش في الـ Validators
        if (data.buildYear === 0) data.buildYear = '';
        if (data.totalFloors === 0) data.totalFloors = 2;
        if (data.apartmentsPerFloor === 0) data.apartmentsPerFloor = 1;

        this.editForm.patchValue({
          ...data,
          city: cityId,
          listingType: this.mapListingToId(data.listingType),
          propertyType: this.mapTypeToId(data.propertyType),
          finishing: this.mapFinishingToId(data.finishing),
          deliveryStatus: this.mapDeliveryToId(data.deliveryStatus),
          areaType: this.mapAreaTypeToId(data.areaType),
          villaCategory: this.mapVillaCatToId(data.villaCategory),
          villaSubType: this.mapVillaSubToId(data.villaSubType),
        });

        this.formatInitialAmount('price');
        this.formatInitialAmount('downPayment');
        this.formatInitialAmount('quarterInstallment');
        this.formatInitialAmount('monthlyRent');
        this.formatInitialAmount('securityDeposit');

        // 🟢 الجزء الجديد: حساب سعر المتر ونسبة المقدم عند فتح التعديل
        const area = Number(data.area) || 0;
        const price = Number(data.price) || 0;
        const downPayment = Number(data.downPayment) || 0;

        if (area > 0 && price > 0) {
          const ppm = price / area;
          this.editForm.get('pricePerMeter')?.setValue(ppm.toLocaleString('en-US'), { emitEvent: false });
        }

        if (price > 0 && downPayment > 0) {
          const dpPercent = (downPayment / price) * 100;
          this.editForm.get('downPaymentPercentage')?.setValue(parseFloat(dpPercent.toFixed(2)), { emitEvent: false });
        }

        this.existingPhotos.set(data.photos);
      }
    });
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

  isVilla(): boolean { return Number(this.editForm.get('propertyType')?.value) === 1; }

  isValidFinance(): boolean {
    if (this.isRent()) return !this.isSecurityExceeded();
    const total = this.getPureNumber('price');
    const down = this.getPureNumber('downPayment');
    const quarter = this.getPureNumber('quarterInstallment');
    return down < total && quarter < total;
  }

  isFinanceExceeded(controlName: string): boolean {
    const totalPrice = this.getPureNumber('price');
    const amount = this.getPureNumber(controlName);
    return amount > 0 && totalPrice > 0 && amount > totalPrice;
  }

  formatFinancial(event: any, controlName: string) {
    let input = event.target.value;
    let pureDigits = input.replace(/[^0-9]/g, '');
    if (pureDigits === '') { this.editForm.get(controlName)?.setValue(''); return; }
    let formatted = Number(pureDigits).toLocaleString('en-US');
    this.editForm.get(controlName)?.setValue(formatted, { emitEvent: false });
  }

  formatInteger(event: any, controlName: string) {
    let input = event.target.value;
    let pureDigits = input.replace(/[^0-9]/g, '');
    this.editForm.get(controlName)?.setValue(pureDigits, { emitEvent: false });
  }

  formatPercentage(event: any, controlName: string) {
    let input = event.target.value;
    let pureDigits = input.replace(/[^0-9.]/g, '');
    if ((pureDigits.match(/\./g) ||[]).length > 1) {
      pureDigits = pureDigits.substring(0, pureDigits.length - 1);
    }
    this.editForm.get(controlName)?.setValue(pureDigits, { emitEvent: false });
  }

  calculateTotalPrice() {
    const area = this.getPureNumber('area');
    const ppm = this.getPureNumber('pricePerMeter');
    if (area > 0 && ppm > 0) {
      const total = area * ppm;
      this.editForm.get('price')?.setValue(total.toLocaleString('en-US'), { emitEvent: false });
      if (this.isRent()) this.editForm.get('monthlyRent')?.setValue(total.toLocaleString('en-US'), { emitEvent: false });
      this.onAmountChange();
    }
  }

  onPercentageChange() {
    const total = this.getPureNumber('price');
    const dpPercent = Number(this.editForm.get('downPaymentPercentage')?.value || 0);
    if (total > 0 && dpPercent >= 0) {
      const dpAmount = total * (dpPercent / 100);
      this.editForm.get('downPayment')?.setValue(dpAmount.toLocaleString('en-US'), { emitEvent: false });
      this.calculateInstallments();
    }
  }

  onAmountChange() {
    const total = this.getPureNumber('price');
    const dpAmount = this.getPureNumber('downPayment');
    if (total > 0 && dpAmount >= 0) {
      const dpPercent = (dpAmount / total) * 100;
      this.editForm.get('downPaymentPercentage')?.setValue(parseFloat(dpPercent.toFixed(2)), { emitEvent: false });
      this.calculateInstallments();
    }
  }

  calculateInstallments() {
    const total = this.getPureNumber('price');
    const dpAmount = this.getPureNumber('downPayment');
    const years = this.getPureNumber('installmentYears');
    if (total > 0 && years > 0) {
      const remaining = total - dpAmount;
      if (remaining > 0) {
        const quarter = (remaining / years) / 4;
        this.editForm.get('quarterInstallment')?.setValue(quarter.toLocaleString('en-US'), { emitEvent: false });
      } else {
        this.editForm.get('quarterInstallment')?.setValue('0', { emitEvent: false });
      }
    }
  }

  isInstallmentSelected(): boolean { return this.editForm.get('paymentMethod')?.value === 'Installment'; }

  updateProjectsList(cId?: number, rName?: string) {
    const id = cId || Number(this.editForm.get('city')?.value);
    const reg = rName || this.editForm.get('region')?.value;
    if (id === 1 || id === 2) this.filteredProjects = this.projectsMapping[id]?.['any'] ||[];
    else if (id === 3) this.filteredProjects = this.projectsMapping[3]?.[reg] ||[];
    else this.filteredProjects =[];
  }

  showDeliveryMenu(): boolean {
    const type = Number(this.editForm.get('listingType')?.value);
    return type === 2 || type === 3;
  }

  isUnderConstruction(): boolean { return Number(this.editForm.get('deliveryStatus')?.value) === 1; }

  updateRegions(cId?: number) {
    const id = cId || Number(this.editForm.get('city')?.value);
    this.filteredRegions = this.regionsMapping[id] ||[];
    if (!cId && this.editForm.get('region')?.value) {
      this.editForm.get('region')?.setValue('');
    }
  }

  onFileSelect(event: any) {
    const files = event.target.files;
    if (files) {
      const existingCount = this.existingPhotos().length;
      const newlySelectedCount = this.selectedPhotos().length;
      const totalCurrent = existingCount + newlySelectedCount;
      const remainingLimit = 10 - totalCurrent;

      if (files.length > remainingLimit) {
        this.alertService.error(`Limit Reached! You can only add ${remainingLimit} more photos.`, 'Upload Limit');
        event.target.value = '';
        return;
      }

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

  isRent() { return Number(this.editForm.get('listingType')?.value) === 1; }
  isProject() { const t = Number(this.editForm.get('listingType')?.value); return t === 2 || t === 3; }
  isInstallment() { return this.editForm.get('paymentMethod')?.value === 'Installment'; }

  // 🟢 حل مشكلة التكرار ومطابقة صفحة الإضافة
  onSubmit() {
    if (this.isSubmitting) return;
    if (this.editForm.valid) {
      this.isSubmitting = true;
      this.alertService.showLoading('Saving changes...');
      
      const formData = new FormData();
      const f = this.editForm.value;

      formData.append('Title', f.title);
      formData.append('Description', f.description);
      formData.append('ProjectName', f.projectName || '');
      formData.append('Code', f.code || '');
      formData.append('Price', f.price.toString().replace(/,/g, ''));
      formData.append('Area', f.area.toString().replace(/,/g, ''));
      formData.append('City', f.city.toString());
      formData.append('Region', f.region);
      formData.append('ListingType', f.listingType.toString());
      formData.append('PropertyType', f.propertyType.toString());

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

      formData.append('PaymentMethod', f.paymentMethod || 'Full Cash');
      formData.append('InstallmentYears', (f.installmentYears || 0).toString());
      formData.append('DownPayment', (f.downPayment || '').toString().replace(/,/g, '') || '0');
      formData.append('QuarterInstallment', (f.quarterInstallment || '').toString().replace(/,/g, '') || '0');
      formData.append('SecurityDeposit', (f.securityDeposit || '').toString().replace(/,/g, '') || '0');
      formData.append('MonthlyRent', (f.monthlyRent || '').toString().replace(/,/g, '') || '0');

      formData.append('Floor', (f.floor || 0).toString());
      formData.append('TotalFloors', (f.totalFloors || 0).toString());
      if (this.isUnderConstruction()) {
        formData.append('BuildYear', '0');
      } else {
        formData.append('BuildYear', (f.buildYear || '').toString());
      }
      formData.append('Finishing', (f.finishing || 2).toString());
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

      if (this.newMainPhotoIndex !== null) formData.append('MainPhotoIndex', this.newMainPhotoIndex.toString());
      this.selectedPhotos().forEach(p => formData.append('Photos', p.file));

      this.propertyService.updateProperty(this.propertyId, formData).subscribe({
        next: () => { 
          this.alertService.close(); 
          this.alertService.success('Saved!'); 
          this.router.navigate(['/my-properties']); 
        },
        error: () => { 
          this.alertService.close(); 
          this.isSubmitting = false; 
          this.alertService.error('Error while saving'); 
        }
      });
    }
  }

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

  formatInitialAmount(controlName: string) {
    const val = this.editForm.get(controlName)?.value;
    if (val) {
      this.editForm.get(controlName)?.setValue(Number(val).toLocaleString('en-US'), { emitEvent: false });
    }
  }

  mapCityToId(c: string) { const m: any = { 'Cairo': 1, 'Alexandria': 2, 'NorthCoast': 3 }; return m[c] || 1; }
  mapListingToId(t: string) { const m: any = { 'Resale': 0, 'Rent': 1, 'Primary': 2, 'ResaleProject': 3 }; return m[t] ?? 0; }
  mapTypeToId(t: string) { const m: any = { 'Apartment': 0, 'Villa': 1, 'Shop': 2, 'Office': 3, 'Chalet': 4, 'FullFloor': 5 }; return m[t] ?? 0; }
  mapFinishingToId(f: string) { const m: any = { 'CoreAndShell': 0, 'SemiFinished': 1, 'FullyFinished': 2, 'SemiFurnished': 3, 'FullyFurnished': 4 }; return m[f] ?? 2; }
  mapDeliveryToId(s: string) { const m: any = { 'Ready': 0, 'UnderConstruction': 1 }; return m[s] ?? 0; }
  mapAreaTypeToId(val: string) { return val === 'LandArea' ? 0 : 1; }
  mapVillaCatToId(val: string) {
    const cats: any = { 'Standalone': 0, 'TwinHouse': 1, 'TownHouse': 2, 'TiesseraLower': 3, 'TiesseraUpper': 4, 'SkyVilla': 5 };
    return cats[val] ?? 0;
  }
  mapVillaSubToId(val: string) {
    if (!val) return null;
    return val === 'Basement' ? 0 : 1;
  }
}