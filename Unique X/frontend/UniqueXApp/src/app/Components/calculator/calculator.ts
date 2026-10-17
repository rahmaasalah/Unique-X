import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

type Frequency = 'Annual' | 'Semi-Annual' | 'Quarterly' | 'Back-Loaded';
type Field = 'area' | 'pricePerMeter' | 'totalPrice' | 'downPct' | 'downAmount' | 'maintenancePct' | 'monthlyPct' | 'annualPct' | 'years';

interface CalcResult {
  area: number;
  pricePerMeter: number;
  totalPrice: number;
  downPct: number;
  downAmount: number;
  remaining: number;
  maintenancePct: number;
  maintenanceTotal: number;
  years: number;
  frequencyLabel: string;
  installmentsCount: number;
  installmentAmount: number;
  // Back-Loaded Payment Plan
  isBackLoaded: boolean;
  yearlyInstallment: number;
  monthlyPct: number;
  annualPct: number;
  monthlyAmount: number;
  annualAmount: number;
  monthlyCount: number;
  annualCount: number;
}

// 🟢 نفس حقول وحسابات الحاسبة اللي في صفحة add-property
@Component({
  selector: 'app-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './calculator.html'
})
export class CalculatorComponent {
  // القيم المعروضة في الحقول (بالفواصل) - بنحولها لأرقام وقت الحساب
  values: Record<Field, string> = {
    area: '', pricePerMeter: '', totalPrice: '',
    downPct: '', downAmount: '', maintenancePct: '', monthlyPct: '', annualPct: '', years: ''
  };
  frequency: Frequency = 'Quarterly';

  readonly frequencies: { value: Frequency; label: string; perYear: number }[] = [
    { value: 'Annual', label: 'Annual', perYear: 1 },
    { value: 'Semi-Annual', label: 'Semi-Annual', perYear: 2 },
    { value: 'Quarterly', label: 'Quarterly', perYear: 4 },
    // 🟢 Back-Loaded: جزء من القسط السنوي بيتدفع شهريًا (11 شهر في السنة) والباقي دفعة سنوية - perYear مش بيستخدم فيها
    { value: 'Back-Loaded', label: 'Back-Loaded Payment Plan', perYear: 0 }
  ];

  // عدد الشهور اللي بيتدفع فيها القسط الشهري في كل سنة (Back-Loaded)
  readonly monthsPerYear = 11;

  // آخر حقل اتكتب فيه (لو المستخدم دخل سعر المتر والإجمالي مع بعض، بناخد آخر واحد)
  private lastPriceField: 'pricePerMeter' | 'totalPrice' | null = null;
  private lastDownField: 'downPct' | 'downAmount' | null = null;

  errorMessage = signal<string>('');
  result = signal<CalcResult | null>(null);

  private readonly moneyFields: Field[] = ['pricePerMeter', 'totalPrice', 'downAmount'];
  private readonly decimalFields: Field[] = ['area', 'downPct', 'maintenancePct', 'monthlyPct', 'annualPct', 'years'];

  // ================== التعامل مع الإدخال ==================
  onInput(event: Event, field: Field) {
    const input = event.target as HTMLInputElement;
    let raw = input.value.replace(/,/g, '');

    if (this.decimalFields.includes(field)) {
      raw = raw.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1'); // أرقام ونقطة عشرية واحدة بس
    } else {
      raw = raw.replace(/\D/g, '');
    }

    if (['downPct', 'maintenancePct', 'monthlyPct', 'annualPct'].includes(field) && Number(raw) > 100) raw = '100';

    let display = raw;
    if (this.moneyFields.includes(field) && raw) {
      display = Number(raw).toLocaleString('en-US');
    }

    input.value = display;
    this.values[field] = display;

    if (field === 'pricePerMeter' || field === 'totalPrice') this.lastPriceField = field;
    if (field === 'downPct' || field === 'downAmount') this.lastDownField = field;

    this.errorMessage.set('');
    this.result.set(null); // نمسح النتيجة القديمة لأن القيم اتغيرت
  }

  blockInvalidKeys(event: KeyboardEvent) {
    if (['-', '+', 'e', 'E'].includes(event.key)) event.preventDefault();
  }

  private num(field: Field): number {
    return Number((this.values[field] || '').replace(/,/g, '')) || 0;
  }

  // نفس التقريب المستخدم في add-property (لأقرب 1000)
  private roundAmount(value: number): number {
    if (value <= 0) return 0;
    return Math.round(value / 1000) * 1000;
  }

  // ================== الحساب ==================
  calculate() {
    this.errorMessage.set('');
    this.result.set(null);

    const area = this.num('area');
    const ppmIn = this.num('pricePerMeter');
    const totalIn = this.num('totalPrice');

    if (area <= 0 || (ppmIn <= 0 && totalIn <= 0)) {
      this.errorMessage.set('Please enter the area and either the price per meter or the total price.');
      return;
    }

    // 1) السعر الكلي وسعر المتر
    let useTotal = totalIn > 0;
    if (ppmIn > 0 && totalIn > 0) {
      useTotal = this.lastPriceField === 'totalPrice';
    }

    let totalPrice: number;
    let pricePerMeter: number;
    if (useTotal) {
      totalPrice = totalIn;
      pricePerMeter = Math.round(totalPrice / area);   // سعر المتر مش بيتقرب لـ 1000
    } else {
      pricePerMeter = ppmIn;
      totalPrice = this.roundAmount(area * ppmIn);
    }

    // 2) المقدم (نسبة أو مبلغ)
    const pctIn = this.num('downPct');
    const amtIn = this.num('downAmount');

    let useAmount = amtIn > 0;
    if (pctIn > 0 && amtIn > 0) {
      useAmount = this.lastDownField === 'downAmount';
    }

    let downAmount = 0;
    let downPct = 0;
    if (useAmount) {
      downAmount = amtIn;
      downPct = parseFloat(((downAmount / totalPrice) * 100).toFixed(2));
    } else if (pctIn > 0) {
      downPct = pctIn;
      downAmount = this.roundAmount(totalPrice * (pctIn / 100));
    }

    if (downAmount > totalPrice) {
      this.errorMessage.set('The down payment cannot be greater than the total price.');
      return;
    }

    // 3) مصاريف الصيانة (نسبة من السعر الكلي)
    const maintenancePct = this.num('maintenancePct');
    const maintenanceTotal = maintenancePct > 0 ? Math.round(totalPrice * (maintenancePct / 100)) : 0;

    // 4) القسط
    const remaining = totalPrice - downAmount;
    const years = this.num('years');
    const freq = this.frequencies.find(f => f.value === this.frequency) || this.frequencies[2];

    const isBackLoaded = freq.value === 'Back-Loaded';

    let installmentAmount = 0;
    let installmentsCount = 0;
    let yearlyInstallment = 0;
    let monthlyPct = 0, annualPct = 0;
    let monthlyAmount = 0, annualAmount = 0;
    let monthlyCount = 0, annualCount = 0;

    if (isBackLoaded) {
      // 🟢 Back-Loaded: (السعر - المقدم) ÷ عدد السنين = القسط السنوي الكلي، وبعدين بيتقسم لجزء شهري (11 شهر) وجزء سنوي بالنسب المدخلة
      const mHas = this.values.monthlyPct !== '';
      const aHas = this.values.annualPct !== '';
      if (!mHas && !aHas) {
        this.errorMessage.set('Please enter the monthly % and/or the annual % for the Back-Loaded Payment Plan.');
        return;
      }
      monthlyPct = mHas ? this.num('monthlyPct') : 100 - this.num('annualPct');
      annualPct = aHas ? this.num('annualPct') : 100 - monthlyPct;
      if (Math.abs(monthlyPct + annualPct - 100) > 0.001) {
        this.errorMessage.set('The monthly % and the annual % must add up to 100%.');
        return;
      }
      if (years > 0 && remaining > 0) {
        yearlyInstallment = Math.round(remaining / years);
        monthlyAmount = this.roundAmount((remaining / years) * (monthlyPct / 100) / this.monthsPerYear);
        annualAmount = this.roundAmount((remaining / years) * (annualPct / 100));
        monthlyCount = parseFloat((years * this.monthsPerYear).toFixed(2));
        annualCount = parseFloat(years.toFixed(2));
      }
    } else if (years > 0 && remaining > 0) {
      installmentsCount = parseFloat((years * freq.perYear).toFixed(2));
      installmentAmount = this.roundAmount(remaining / years / freq.perYear);
    }

    this.result.set({
      area,
      pricePerMeter,
      totalPrice,
      downPct,
      downAmount,
      remaining,
      maintenancePct,
      maintenanceTotal,
      years,
      frequencyLabel: freq.label,
      installmentsCount,
      installmentAmount,
      isBackLoaded,
      yearlyInstallment,
      monthlyPct,
      annualPct,
      monthlyAmount,
      annualAmount,
      monthlyCount,
      annualCount
    });
  }

  reset() {
    this.values = { area: '', pricePerMeter: '', totalPrice: '', downPct: '', downAmount: '', maintenancePct: '', monthlyPct: '', annualPct: '', years: '' };
    this.frequency = 'Quarterly';
    this.lastPriceField = null;
    this.lastDownField = null;
    this.errorMessage.set('');
    this.result.set(null);
  }
}