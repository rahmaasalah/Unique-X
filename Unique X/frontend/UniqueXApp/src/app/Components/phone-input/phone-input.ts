import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

// 🟢 كومبوننت واحد بيتحط بدل أي حقل تليفون في التطبيق - بيدخل كود الدولة الأول وبعدين الرقم
// شغال مع formControlName (Reactive Forms) وكمان مع [(ngModel)] لأنه بيعمل implement لـ ControlValueAccessor
// القيمة اللي بترجع/بتتاخد شكلها دايمًا: "+20 01012345678" (كود الدولة + مسافة + الرقم زي ما اتكتب)
@Component({
  selector: 'app-phone-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './phone-input.html',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => PhoneInputComponent),
    multi: true
  }]
})
export class PhoneInputComponent implements ControlValueAccessor {
  @Input() placeholder: string = 'e.g. 01012345678';

  // 🟢 مصر أول واحدة افتراضيًا لأنها السوق الأساسي، وبعدها باقي دول الخليج والدول الشائعة
  countryCodes = [
    { code: '+20', flag: '🇪🇬', name: 'Egypt' },
    { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
    { code: '+971', flag: '🇦🇪', name: 'UAE' },
    { code: '+965', flag: '🇰🇼', name: 'Kuwait' },
    { code: '+974', flag: '🇶🇦', name: 'Qatar' },
    { code: '+973', flag: '🇧🇭', name: 'Bahrain' },
    { code: '+968', flag: '🇴🇲', name: 'Oman' },
    { code: '+962', flag: '🇯🇴', name: 'Jordan' },
    { code: '+961', flag: '🇱🇧', name: 'Lebanon' },
    { code: '+218', flag: '🇱🇾', name: 'Libya' },
    { code: '+1', flag: '🇺🇸', name: 'USA / Canada' },
    { code: '+44', flag: '🇬🇧', name: 'UK' },
  ];

  selectedCode: string = '+20';
  localNumber: string = '';
  disabled = false;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  // بيستقبل القيمة القديمة (لو موجودة، زي وقت التعديل على ليد/بروفايل موجود بالفعل) ويفصلها لكود + رقم
  writeValue(value: string): void {
    if (!value) {
      this.selectedCode = '+20';
      this.localNumber = '';
      return;
    }
    const trimmed = value.trim();
    const match = this.countryCodes
      .slice()
      .sort((a, b) => b.code.length - a.code.length)
      .find(c => trimmed.startsWith(c.code));

    if (match) {
      this.selectedCode = match.code;
      this.localNumber = trimmed.substring(match.code.length).trim();
    } else {
      // 🟢 قيمة قديمة متسجلة بالشكل المحلي القديم (من غير كود دولة) - نعتبرها مصرية افتراضيًا ونعرضها زي ما هي
      this.selectedCode = '+20';
      this.localNumber = trimmed.replace(/^\+?20/, '').trim();
    }
  }

  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }

  emitValue() {
    const digits = this.localNumber.replace(/\D/g, '');
    this.localNumber = digits;
    this.onChange(digits ? `${this.selectedCode} ${digits}` : '');
    this.onTouched();
  }

  onCodeChange() { this.emitValue(); }
  onNumberChange() { this.emitValue(); }
}