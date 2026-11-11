import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatRequestCardComponent } from './chat-request-card';
import { ChatService, MyPropertyItem, MyRequestItem } from '../../Services/chat.service';

// نافذة اختيار للبروكر: وحداته أو طلبات عملائه (بتتبعت في الشات بمجرد الضغط)
@Component({
  selector: 'app-broker-share-picker',
  standalone: true,
  imports: [CommonModule, ChatRequestCardComponent],
  template: `
    <div class="pick-back" (click)="closed.emit()">
      <div class="pick-box" (click)="$event.stopPropagation()">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <div class="fw-bold">
            @if (mode === 'properties') { <i class="bi bi-buildings"></i> My properties }
            @else { <i class="bi bi-person-lines-fill"></i> My clients' requests }
          </div>
          <button class="btn-close" (click)="closed.emit()"></button>
        </div>
        <div class="small text-muted mb-2">
          @if (mode === 'properties') { Tap a property to send it to the chat. }
          @else { Tap a request to send it (client name and phone are never shared). }
        </div>

        <div class="pick-list">
          @if (loading()) { <div class="text-center text-muted small p-3">Loading...</div> }

          @if (mode === 'properties') {
            @for (p of properties(); track p.id) {
              <button class="pick-item" (click)="pickedProperty.emit(p.code!)">
                @if (p.imageUrl) { <img [src]="p.imageUrl" alt=""> } @else { <span class="ph"><i class="bi bi-house"></i></span> }
                <span class="info">
                  <span class="fw-bold small d-block text-truncate">{{ p.title }}</span>
                  <span class="small text-muted d-block text-truncate">{{ p.region }}, {{ p.city }}</span>
                  <span class="small fw-bold text-danger">{{ p.price | number:'1.0-0' }} EGP</span>
                  <span class="code">{{ p.code }}</span>
                </span>
              </button>
            } @empty {
              @if (!loading()) { <div class="text-center text-muted small p-3">You have no approved properties yet.</div> }
            }
          } @else {
            @for (r of requests(); track r.id) {
              <button class="pick-item req" (click)="pickedRequest.emit(r.id)">
                <span class="w-100">
                  <span class="small fw-bold d-block mb-1"><i class="bi bi-person"></i> {{ r.leadName }}</span>
                  <app-chat-request-card [request]="r.request" />
                </span>
              </button>
            } @empty {
              @if (!loading()) { <div class="text-center text-muted small p-3">No client requests found.</div> }
            }
          }
        </div>
      </div>
    </div>`,
  styles: [`
    .pick-back { position:fixed; inset:0; background:rgba(0,0,0,.45); display:flex; align-items:center; justify-content:center; z-index:1090; padding:16px; }
    .pick-box { background:#fff; border-radius:14px; padding:16px; width:100%; max-width:460px; max-height:80vh; display:flex; flex-direction:column; }
    .pick-list { overflow-y:auto; }
    .pick-item { width:100%; display:flex; gap:10px; background:#fff; border:1px solid #eee; border-radius:10px; padding:6px; margin-bottom:8px; text-align:left; align-items:center; }
    .pick-item:hover { background:#fff5f5; border-color:#f3b5b9; }
    .pick-item img, .ph { width:70px; height:70px; object-fit:cover; border-radius:8px; flex-shrink:0; }
    .ph { background:#e9ecef; display:flex; align-items:center; justify-content:center; font-size:1.6rem; color:#6c757d; }
    .info { min-width:0; flex:1; }
    .code { font-size:.66rem; background:#f1f3f5; padding:0 6px; border-radius:6px; margin-left:6px; color:#495057; }
  `]
})
export class BrokerSharePickerComponent implements OnInit {
  @Input() mode: 'properties' | 'requests' = 'properties';
  @Output() pickedProperty = new EventEmitter<string>();
  @Output() pickedRequest = new EventEmitter<number>();
  @Output() closed = new EventEmitter<void>();

  properties = signal<MyPropertyItem[]>([]);
  requests = signal<MyRequestItem[]>([]);
  loading = signal(true);

  constructor(private chat: ChatService) {}

  ngOnInit(): void {
    if (this.mode === 'properties') {
      this.chat.getMyProperties().subscribe({
        next: l => { this.properties.set(l); this.loading.set(false); },
        error: () => this.loading.set(false)
      });
    } else {
      this.chat.getMyRequests().subscribe({
        next: l => { this.requests.set(l); this.loading.set(false); },
        error: () => this.loading.set(false)
      });
    }
  }
}