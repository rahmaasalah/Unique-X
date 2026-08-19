import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CurrencyService } from '../../Services/currency.service';

// ===================================================================
// ملحوظة مهمة: القيم دي (نسب التقدير السنوي ومعدل الخصم لكل سيناريو)
// افتراضية اتبنت على وصف المصطلحات (Glossary) في الصفحة المرجعية.
// عدّليها من هنا براحتك لو حابة تقريبها أكتر من نتائج حقيقية عندك.
// ===================================================================
interface ScenarioConfig {
  key: 'bullish' | 'stable' | 'declining';
  label: string;
  icon: string;
  appreciationRate: number; // % سنوي - تقدير سعر العقار
  discountRate: number;     // % سنوي - معدل الخصم لحسابات NPV
}

interface YearRow {
  year: number;
  propertyValue: number;
  monthlyRent: number;
  cumulativeRent: number;
  totalPaid: number;
  netWorth: number;
  roi: number;
  roe: number | null;
}

interface ScenarioResult {
  config: ScenarioConfig;
  unitPriceAtDelivery: number;
  unitPriceAfterInstallment: number;
  amountPaidAtDelivery: number;
  amountPaidAfterDelivery: number;
  totalRentAfterDelivery: number;
  netRentInstallmentAfterDelivery: number;
  totalRevenue: number;
  netCash: number;
  totalEquityPaid: number;
  roi: number;
  roe: number;
  irr: number;
  leverage: number;
  paybackYears: number | null;
  unitPVAtPurchasing: number;
  equityPVAtPurchasing: number;
  unitPVAfterInstallment: number;
  roiNPV: number;
  roeNPV: number;
  yearlyTable: YearRow[];
}

@Component({
  selector: 'app-investment-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './investment-calculator.html'
})
export class InvestmentCalculatorComponent {
  currencyService = inject(CurrencyService);

  // 🟢 معاينة سعر الوحدة المدخل بالعملة المختارة (السعر بيتخزن ويتحسب دايمًا بالجنيه المصري)
  unitPricePreview(): string {
    if (!this.unitPrice || this.currencyService.selectedCurrency() === 'EGP') return '';
    return `≈ ${this.currencyService.format(this.unitPrice)}`;
  }

  // ============== Unit type -> CAP Rate ==============
  unitTypes = [
    { key: 'Residential', label: 'Residential', icon: '🏠', capRate: 5 },
    { key: 'Commercial', label: 'Commercial', icon: '🏢', capRate: 6 },
    { key: 'Coastal', label: 'Coastal', icon: '🏖️', capRate: 8 },
  ];
  selectedUnitType = signal(this.unitTypes[0]);

  // ============== Scenarios ==============
  scenarios: ScenarioConfig[] = [
    { key: 'bullish', label: 'Bullish Economy', icon: '🚀', appreciationRate: 15, discountRate: 10 },
    { key: 'stable', label: 'Stable Economy', icon: '✅', appreciationRate: 10, discountRate: 15 },
    { key: 'declining', label: 'Declining Economy', icon: '⚠️', appreciationRate: 5, discountRate: 20 },
  ];

  // ============== Inputs ==============
  unitPrice: number | null = null;
  unitPriceDisplay: string = ''; // النسخة المعروضة بفواصل الآلاف (12,000,000)
  yearsToDeliver: number | null = null;
  installmentYears: number | null = null;
  deliveryPercent: number | null = null;

  // بيتنادى وقت الكتابة في حقل السعر - بيشيل أي حاجة مش رقم وبيحط فواصل الآلاف تلقائيًا
  onUnitPriceInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const digitsOnly = input.value.replace(/[^0-9]/g, ''); // بيشيل السالب وأي حروف كمان

    if (!digitsOnly) {
      this.unitPrice = null;
      this.unitPriceDisplay = '';
      input.value = '';
      return;
    }

    const numericValue = Number(digitsOnly);
    this.unitPrice = numericValue;
    this.unitPriceDisplay = numericValue.toLocaleString('en-US');
    input.value = this.unitPriceDisplay;
  }

  // بيمنع كتابة "-" أو "e" (scientific notation) في أي حقل رقمي عادي
  blockNegativeKeys(event: KeyboardEvent) {
    if (event.key === '-' || event.key === 'e' || event.key === 'E' || event.key === '+') {
      event.preventDefault();
    }
  }

  // شبكة أمان إضافية: لو دخلت قيمة سالبة بأي طريقة تانية (لصق مثلاً)، نرجعها صفر فورًا
  clampNonNegative(field: 'yearsToDeliver' | 'installmentYears' | 'deliveryPercent') {
    const value = this[field];
    if (value !== null && value < 0) {
      this[field] = 0;
    }
  }

  // ============== Results ==============
  results = signal<ScenarioResult[] | null>(null);
  selectedScenarioKey = signal<'bullish' | 'stable' | 'declining'>('stable');
  activeView = signal<'chart' | 'table'>('chart');
  errorMessage = signal<string>('');

  selectedResult = computed(() => {
    const r = this.results();
    if (!r) return null;
    return r.find(x => x.config.key === this.selectedScenarioKey()) || null;
  });

  selectUnitType(t: any) {
    this.selectedUnitType.set(t);
  }

  calculate() {
    this.errorMessage.set('');

    const P0 = Number(this.unitPrice);
    const D = Number(this.yearsToDeliver);
    let I = Number(this.installmentYears);
    const deliveryFrac = Number(this.deliveryPercent) / 100;

    if (!P0 || P0 <= 0) { this.errorMessage.set('Please enter the unit price.'); return; }
    if (D === null || D < 0 || isNaN(D)) { this.errorMessage.set('Please enter the years to deliver.'); return; }
    if (!this.installmentYears || I <= 0) { this.errorMessage.set('Please enter the instalment years.'); return; }
    if (!this.deliveryPercent || deliveryFrac <= 0 || deliveryFrac > 1) { this.errorMessage.set('Please enter the delivery percentage (between 1 and 100).'); return; }

    // سنوات التقسيط لازم تكون أطول من أو تساوي سنوات الاستلام
    if (I < D) I = D;

    const capRate = this.selectedUnitType().capRate / 100;

    const results: ScenarioResult[] = this.scenarios.map(sc =>
      this.computeScenario(P0, D, I, deliveryFrac, capRate, sc)
    );

    this.results.set(results);
    this.selectedScenarioKey.set('stable');
    this.activeView.set('chart');
  }

  private computeScenario(
    P0: number, D: number, I: number, deliveryFrac: number, capRate: number, config: ScenarioConfig
  ): ScenarioResult {
    const a = config.appreciationRate / 100;
    const r = config.discountRate / 100;

    const unitPriceAtDelivery = P0 * Math.pow(1 + a, D);
    const unitPriceAfterInstallment = P0 * Math.pow(1 + a, I);

    const amountPaidAtDelivery = P0 * deliveryFrac;
    const amountPaidAfterDelivery = P0 * (1 - deliveryFrac);

    const postDeliveryYears = Math.max(I - D, 0);
    const annualRent = capRate * unitPriceAtDelivery;
    const totalRentAfterDelivery = annualRent * postDeliveryYears;
    const netRentInstallmentAfterDelivery = totalRentAfterDelivery - amountPaidAfterDelivery;

    const totalRevenue = unitPriceAfterInstallment + netRentInstallmentAfterDelivery;
    const netCash = totalRevenue - amountPaidAtDelivery;
    const totalEquityPaid = amountPaidAtDelivery;

    const roi = P0 > 0 ? (netCash / P0) * 100 : 0;
    const roe = totalEquityPaid > 0 ? (netCash / totalEquityPaid) * 100 : 0;
    const irr = I > 0 ? roe / I : 0;
    const leverage = deliveryFrac > 0 ? 1 / deliveryFrac : 0;
    const paybackYears = annualRent > 0 ? D + (P0 / annualRent) : null;

    // -------- NPV-based metrics --------
    const prePaymentPerYear = D > 0 ? amountPaidAtDelivery / D : amountPaidAtDelivery;
    let equityPVAtPurchasing = 0;
    if (D > 0) {
      for (let t = 0; t < D; t++) equityPVAtPurchasing += prePaymentPerYear / Math.pow(1 + r, t);
    } else {
      equityPVAtPurchasing = amountPaidAtDelivery;
    }

    const postPaymentPerYear = postDeliveryYears > 0 ? amountPaidAfterDelivery / postDeliveryYears : 0;
    let postPaymentsPV = 0;
    let rentPV = 0;
    for (let t = D; t < I; t++) {
      postPaymentsPV += postPaymentPerYear / Math.pow(1 + r, t);
      rentPV += annualRent / Math.pow(1 + r, t);
    }

    const unitPVAtPurchasing = equityPVAtPurchasing + postPaymentsPV;
    const unitPVAfterInstallment = unitPriceAfterInstallment / Math.pow(1 + r, I);

    const totalRevenuePV = unitPVAfterInstallment + rentPV - postPaymentsPV;
    const netCashPV = totalRevenuePV - equityPVAtPurchasing;
    const roiNPV = P0 > 0 ? (netCashPV / P0) * 100 : 0;
    const roeNPV = equityPVAtPurchasing > 0 ? (netCashPV / equityPVAtPurchasing) * 100 : 0;

    // -------- Yearly table --------
    const yearlyTable: YearRow[] = [];
    let cumulativeRent = 0;
    let totalPaid = 0;
    const preYearlyPayment = D > 0 ? amountPaidAtDelivery / D : amountPaidAtDelivery;
    const postYearlyPayment = postDeliveryYears > 0 ? amountPaidAfterDelivery / postDeliveryYears : 0;

    for (let year = 0; year <= I; year++) {
      const propertyValue = P0 * Math.pow(1 + a, year);

      if (year > 0) {
        totalPaid += year <= D ? preYearlyPayment : postYearlyPayment;
      } else {
        totalPaid += D === 0 ? amountPaidAtDelivery : 0;
      }

      const monthlyRent = year >= D ? annualRent / 12 : 0;
      if (year > D) cumulativeRent += annualRent;

      const netWorth = propertyValue + cumulativeRent - totalPaid;
      // 🟢 ROI = نسبة الربح (المكسب) على رأس المال، مش القيمة الكلية على رأس المال
      // عشان يبدأ من 0% في السنة صفر بدل ما يبدأ من 100%
      const roiYear = P0 > 0 ? ((netWorth - P0) / P0) * 100 : 0;
      const roeYear = totalPaid > 0 ? (netWorth / totalPaid) * 100 : null;

      yearlyTable.push({
        year, propertyValue, monthlyRent, cumulativeRent, totalPaid, netWorth,
        roi: roiYear, roe: roeYear
      });
    }

    return {
      config, unitPriceAtDelivery, unitPriceAfterInstallment, amountPaidAtDelivery,
      amountPaidAfterDelivery, totalRentAfterDelivery, netRentInstallmentAfterDelivery,
      totalRevenue, netCash, totalEquityPaid, roi, roe, irr, leverage, paybackYears,
      unitPVAtPurchasing, equityPVAtPurchasing, unitPVAfterInstallment, roiNPV, roeNPV,
      yearlyTable
    };
  }

  reset() {
    this.results.set(null);
    this.unitPrice = null;
    this.unitPriceDisplay = '';
    this.yearsToDeliver = null;
    this.installmentYears = null;
    this.deliveryPercent = null;
    this.errorMessage.set('');
  }

  // ============== Chart helpers (simple hand-built SVG line chart, no external deps) ==============
  chartPoints(key: 'propertyValue' | 'cumulativeRent' | 'totalPaid'): string {
    const result = this.selectedResult();
    if (!result) return '';
    const rows = result.yearlyTable;
    const maxVal = Math.max(...rows.map(r => Math.max(r.propertyValue, r.cumulativeRent, r.totalPaid)), 1);
    const width = 640, height = 260, padding = 30;

    return rows.map((row, i) => {
      const x = padding + (i / Math.max(rows.length - 1, 1)) * (width - padding * 2);
      const y = height - padding - (row[key] / maxVal) * (height - padding * 2);
      return `${x},${y}`;
    }).join(' ');
  }

  chartYears(): number[] {
    return this.selectedResult()?.yearlyTable.map(r => r.year) ?? [];
  }

  formatNumber(value: number | null): string {
    if (value === null || value === undefined || isNaN(value)) return '—';
    return this.currencyService.format(value);
  }

  formatPercent(value: number | null): string {
    if (value === null || value === undefined || isNaN(value)) return '—';
    return Math.round(value).toLocaleString('en-US') + '%';
  }
}