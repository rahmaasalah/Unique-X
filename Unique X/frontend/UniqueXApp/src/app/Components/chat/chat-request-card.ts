import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatRequest } from '../../Services/chat.service';

// كارت طلب عميل (من غير أي بيانات شخصية) بيظهر في الشات
@Component({
  selector: 'app-chat-request-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (request) {
      <div class="req-card">
        <div class="req-head"><i class="bi bi-person-lines-fill"></i> Client request</div>
        <div class="req-tags">
          @for (t of split(request.purpose); track t) { <span class="tag tag-p">{{ t }}</span> }
          @for (t of split(request.propertyType); track t) { <span class="tag">{{ t }}</span> }
        </div>
        <div class="req-row"><i class="bi bi-cash-stack"></i>
          {{ request.minBudget | number:'1.0-0' }} – {{ request.maxBudget | number:'1.0-0' }} EGP
        </div>
        @if (location()) { <div class="req-row"><i class="bi bi-geo-alt"></i> {{ location() }}</div> }
        @if (request.paymentMethod) {
          <div class="req-row"><i class="bi bi-wallet2"></i> {{ request.paymentMethod }}
            @if (request.downPayment) { · Down {{ request.downPayment | number:'1.0-0' }} }
            @if (request.installmentYears) { · {{ request.installmentYears }} yrs }
          </div>
        }
        @if (rooms()) { <div class="req-row"><i class="bi bi-door-open"></i> {{ rooms() }}</div> }
      </div>
    }`,
  styles: [`
    .req-card { background:#fff; color:#212529; border:1px solid #eee; border-left:4px solid #ef3341; border-radius:10px; padding:8px 10px; width:290px; max-width:100%; margin-bottom:4px; text-align:left; }
    .req-head { font-size:.72rem; font-weight:700; color:#ef3341; margin-bottom:4px; }
    .req-tags { display:flex; flex-wrap:wrap; gap:4px; margin-bottom:4px; }
    .tag { background:#f1f3f5; color:#495057; font-size:.68rem; padding:1px 7px; border-radius:8px; }
    .tag-p { background:#fde2e0; color:#c1121f; }
    .req-row { font-size:.78rem; margin-top:2px; }
    .req-row i { color:#6c757d; margin-right:4px; }
  `]
})
export class ChatRequestCardComponent {
  @Input() request?: ChatRequest | null;

  split(v?: string | null): string[] {
    return (v || '').split(',').map(x => x.trim()).filter(x => !!x);
  }

  location(): string {
    const r = this.request;
    if (!r) return '';
    const parts = [r.projects, r.regions, r.cities, r.preferredLocation]
      .flatMap(x => this.split(x))
      .filter((x, i, a) => a.indexOf(x) === i);
    return parts.slice(0, 5).join(', ');
  }

  rooms(): string {
    const r = this.request;
    if (!r) return '';
    const range = (a?: number | null, b?: number | null, label = '') =>
      a || b ? `${a ?? '?'}${b && b !== a ? '–' + b : ''} ${label}` : '';
    return [range(r.minRooms, r.maxRooms, 'rooms'), range(r.minBathrooms, r.maxBathrooms, 'baths')]
      .filter(x => !!x).join(' · ');
  }
}