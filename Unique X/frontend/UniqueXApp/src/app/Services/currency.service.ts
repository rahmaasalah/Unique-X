import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export type CurrencyCode = 'EGP' | 'USD' | 'SAR';

@Injectable({ providedIn: 'root' })
export class CurrencyService {
  private http = inject(HttpClient);

  // قيم احتياطية لحد ما نجيب السعر الحقيقي من الباك إند (1 جنيه = ؟)
  private rates: Record<CurrencyCode, number> = { EGP: 1, USD: 0.021, SAR: 0.078 };

  symbols: Record<CurrencyCode, string> = { EGP: 'EGP', USD: '$', SAR: 'SAR' };

  // بيفضل متذكر اختيار العميل حتى لو عمل refresh للصفحة
  selectedCurrency = signal<CurrencyCode>(
    (localStorage.getItem('currency') as CurrencyCode) || 'EGP'
  );

  constructor() {
    this.loadRates();
  }

  loadRates() {
    this.http.get<any>(`${environment.apiUrl}/currency/rates`).subscribe({
      next: (res) => {
        if (res?.rates) this.rates = res.rates;
      },
      error: () => {} // نفضل شغالين بالقيم الاحتياطية لو الطلب فشل
    });
  }

  setCurrency(code: CurrencyCode) {
    this.selectedCurrency.set(code);
    localStorage.setItem('currency', code);
  }

  // بتحول أي مبلغ متخزن بالجنيه المصري (زي ما هو في الداتابيز دايمًا) للعملة المختارة حاليًا
  convert(amountInEgp: number): number {
    if (!amountInEgp && amountInEgp !== 0) return 0;
    const rate = this.rates[this.selectedCurrency()] ?? 1;
    return amountInEgp * rate;
  }

  // بترجع نص جاهز للعرض المباشر في أي تمبليت: "$ 1,234" أو "EGP 45,000"
  format(amountInEgp: number): string {
    if (!amountInEgp && amountInEgp !== 0) return '';
    const converted = this.convert(amountInEgp);
    const rounded = this.selectedCurrency() === 'EGP'
      ? Math.round(converted)
      : Math.round(converted * 100) / 100;
    return `${this.symbols[this.selectedCurrency()]} ${rounded.toLocaleString('en-US')}`;
  }
}