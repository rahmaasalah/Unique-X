import { Component, OnInit, Input, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CrmService } from '../../../Services/crm.services';
import { AuthService } from '../../../Services/auth';

type CalView = 'month' | 'week' | 'day';

interface CalEvent {
  type: 'visit' | 'call';
  id: number;
  leadId: number;
  leadName: string;
  leadPhone: string;
  brokerName: string;
  start: Date;
  status: string;
  title: string;
  location?: string;
  propertyCode?: string;
  notes?: string;
}

// 🟢 كاليندر الـ CRM - بروكر: مواعيده هو بس | أدمن: Master Calendar لكل البروكرز
// الزيارات والمكالمات بتتخزن كتوقيت محلي (من datetime-local) فبنقراها كتوقيت محلي برضه من غير Z
@Component({
  selector: 'app-my-calendar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './my-calender.html',
  styleUrls: ['./my-calender.css']
})
export class MyCalenderComponent implements OnInit {
  private crmService = inject(CrmService);
  private authService = inject(AuthService);
  private router = inject(Router);

  // الأسبوع بيبدأ سبت (مصر). غيّري الرقم لو عايزاه يبدأ يوم تاني: 0 = أحد ... 6 = سبت
  private readonly WEEK_START = 6;

  // 🟢 لما الكاليندر تتحط جوه داشبوورد الأدمن (Master Calendar): بنخفي زرار الرجوع وبناخد فلتر البروكر من الداشبوورد
  @Input() embedded = false;
  @Input() brokerName = '';

  isAdmin = signal(false);
  currentBrokerId = '';

  view = signal<CalView>('month');
  cursor = signal<Date>(this.startOfDay(new Date()));
  events = signal<CalEvent[]>([]);
  loading = signal(false);
  selectedEvent = signal<CalEvent | null>(null);

  // الفلاتر
  fName = signal('');
  fPhone = signal('');
  fType = signal<'' | 'visit' | 'call'>('');
  fBroker = signal('');
  pickedDate = signal(''); // yyyy-MM-dd

  // 🟢 اليوم بيتعرض من 12 الضهر لـ 12 منتصف الليل (12 PM → 12 AM)، وأي موعد قبل 12 الضهر بيظهر في عمود "Before 12 PM"
  hours = Array.from({ length: 12 }, (_, i) => i + 12);
  weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // ===== Range حسب الـ view =====
  range = computed(() => {
    const c = this.cursor();
    const v = this.view();
    if (v === 'day') return { from: c, to: c };
    if (v === 'week') {
      const from = this.weekStart(c);
      return { from, to: this.addDays(from, 6) };
    }
    const first = new Date(c.getFullYear(), c.getMonth(), 1);
    const last = new Date(c.getFullYear(), c.getMonth() + 1, 0);
    const from = this.weekStart(first);
    const to = this.addDays(this.weekStart(last), 6);
    return { from, to };
  });

  title = computed(() => {
    const c = this.cursor();
    const v = this.view();
    if (v === 'month') return c.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    if (v === 'day') return c.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const r = this.range();
    return `${r.from.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${r.to.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  });

  // أيام الـ view الحالية (month = كل أيام الشبكة، week = 7، day = 1)
  days = computed(() => {
    const { from, to } = this.range();
    const out: Date[] = [];
    for (let d = new Date(from); d <= to; d = this.addDays(d, 1)) out.push(new Date(d));
    return out;
  });

  // صفوف الشهر (أسابيع)
  monthWeeks = computed(() => {
    const d = this.days();
    const w: Date[][] = [];
    for (let i = 0; i < d.length; i += 7) w.push(d.slice(i, i + 7));
    return w;
  });

  // ترتيب أسماء الأيام حسب بداية الأسبوع
  orderedWeekdays = computed(() => {
    const out: string[] = [];
    for (let i = 0; i < 7; i++) out.push(this.weekdayNames[(this.WEEK_START + i) % 7]);
    return out;
  });

  brokerOptions = computed(() =>
    Array.from(new Set(this.events().map(e => e.brokerName).filter(n => !!n && n.trim()))).sort()
  );

  filtered = computed(() => {
    const name = this.fName().trim().toLowerCase();
    const phone = this.fPhone().replace(/\D/g, '');
    const type = this.fType();
    const broker = this.fBroker();
    const inputBroker = this.brokerName;
    return this.events().filter(e => {
      if (inputBroker && e.brokerName !== inputBroker) return false;
      if (name && !(e.leadName || '').toLowerCase().includes(name)) return false;
      if (phone && !(e.leadPhone || '').replace(/\D/g, '').includes(phone)) return false;
      if (type && e.type !== type) return false;
      if (broker && e.brokerName !== broker) return false;
      return true;
    });
  });

  ngOnInit() {
    if (!this.embedded && !this.authService.isAllowedToOpenCrm()) {
      this.router.navigate(['/home']);
      return;
    }
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      this.currentBrokerId = user.id || user.userId || '';
      this.isAdmin.set(!!(user.roles && user.roles.includes('Admin')));
    } catch {}
    this.reload();
  }

  reload() {
    const { from, to } = this.range();
    this.loading.set(true);
    this.crmService.getCalendarEvents(this.fmt(from), this.fmt(to), this.isAdmin() ? '' : this.currentBrokerId).subscribe({
      next: (res) => {
        this.events.set((res || []).map((e: any) => ({
          ...e,
          start: new Date(String(e.start).replace(/Z$/, '')) // توقيت محلي زي ما اتسجل
        })));
        this.loading.set(false);
      },
      error: () => { this.events.set([]); this.loading.set(false); }
    });
  }

  // ===== Navigation =====
  setView(v: CalView) { this.view.set(v); this.reload(); }

  prev() { this.shift(-1); }
  next() { this.shift(1); }
  today() { this.cursor.set(this.startOfDay(new Date())); this.pickedDate.set(''); this.reload(); }

  private shift(dir: number) {
    const c = this.cursor();
    const v = this.view();
    if (v === 'month') this.cursor.set(new Date(c.getFullYear(), c.getMonth() + dir, 1));
    else this.cursor.set(this.addDays(c, dir * (v === 'week' ? 7 : 1)));
    this.reload();
  }

  // فلتر التاريخ: بيروح على اليوم ده
  onPickDate(value: string) {
    this.pickedDate.set(value);
    if (!value) return;
    const [y, m, d] = value.split('-').map(Number);
    this.cursor.set(new Date(y, m - 1, d));
    this.reload();
  }

  openDay(d: Date) {
    this.cursor.set(this.startOfDay(d));
    this.view.set('day');
    this.reload();
  }

  clearFilters() {
    this.fName.set(''); this.fPhone.set(''); this.fType.set(''); this.fBroker.set(''); this.pickedDate.set('');
  }

  // ===== Helpers للعرض =====
  eventsOn(d: Date): CalEvent[] {
    return this.filtered()
      .filter(e => this.sameDay(e.start, d))
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }

  eventsBefore(d: Date): CalEvent[] {
    return this.eventsOn(d).filter(e => e.start.getHours() < 12);
  }

  eventsAt(d: Date, hour: number): CalEvent[] {
    return this.eventsOn(d).filter(e => e.start.getHours() === hour);
  }

  hourLabel(h: number): string {
    const ap = h < 12 ? 'AM' : 'PM';
    const hh = h % 12 === 0 ? 12 : h % 12;
    return `${hh} ${ap}`;
  }

  isToday(d: Date) { return this.sameDay(d, new Date()); }
  isOtherMonth(d: Date) { return d.getMonth() !== this.cursor().getMonth(); }

  statusClass(e: CalEvent): string {
    const s = (e.status || 'Pending');
    return 'st-' + s.toLowerCase();
  }

  private sameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }
  private startOfDay(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  private addDays(d: Date, n: number) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  private weekStart(d: Date) {
    const diff = (d.getDay() - this.WEEK_START + 7) % 7;
    return this.addDays(d, -diff);
  }
  private fmt(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}