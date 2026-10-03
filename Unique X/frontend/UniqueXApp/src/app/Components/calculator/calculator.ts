import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

type Frequency = 'Annual' | 'Semi-Annual' | 'Quarterly';
type Field = 'area' | 'pricePerMeter' | 'totalPrice' | 'downPct' | 'downAmount' | 'years';

interface CalcResult {
  area: number;
  pricePerMeter: number;
  totalPrice: number;
  downPct: number;
  downAmount: number;
  remaining: number;
  years: number;
  frequencyLabel: string;
  installmentsCount: number;
  installmentAmount: number;
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
    downPct: '', downAmount: '', years: ''
  };
  frequency: Frequency = 'Quarterly';

  readonly frequencies: { value: Frequency; label: string; perYear: number }[] = [
    { value: 'Annual', label: 'Annual', perYear: 1 },
    { value: 'Semi-Annual', label: 'Semi-Annual', perYear: 2 },
    { value: 'Quarterly', label: 'Quarterly', perYear: 4 }
  ];

  // آخر حقل اتكتب فيه (لو المستخدم دخل سعر المتر والإجمالي مع بعض، بناخد آخر واحد)
  private lastPriceField: 'pricePerMeter' | 'totalPrice' | null = null;
  private lastDownField: 'downPct' | 'downAmount' | null = null;

  errorMessage = signal<string>('');
  result = signal<CalcResult | null>(null);

  private readonly moneyFields: Field[] = ['pricePerMeter', 'totalPrice', 'downAmount'];
  private readonly decimalFields: Field[] = ['area', 'downPct', 'years'];

  // ================== التعامل مع الإدخال ==================
  onInput(event: Event, field: Field) {
    const input = event.target as HTMLInputElement;
    let raw = input.value.replace(/,/g, '');

    if (this.decimalFields.includes(field)) {
      raw = raw.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1'); // أرقام ونقطة عشرية واحدة بس
    } else {
      raw = raw.replace(/\D/g, '');
    }

    if (field === 'downPct' && Number(raw) > 100) raw = '100';

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

    // 3) القسط
    const remaining = totalPrice - downAmount;
    const years = this.num('years');
    const freq = this.frequencies.find(f => f.value === this.frequency) || this.frequencies[2];

    let installmentAmount = 0;
    let installmentsCount = 0;
    if (years > 0 && remaining > 0) {
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
      years,
      frequencyLabel: freq.label,
      installmentsCount,
      installmentAmount
    });
  }

  reset() {
    this.values = { area: '', pricePerMeter: '', totalPrice: '', downPct: '', downAmount: '', years: '' };
    this.frequency = 'Quarterly';
    this.lastPriceField = null;
    this.lastDownField = null;
    this.errorMessage.set('');
    this.result.set(null);
  }
}