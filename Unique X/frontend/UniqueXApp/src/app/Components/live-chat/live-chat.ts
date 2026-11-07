import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { LiveChatService, LiveMessage } from '../../Services/livechat.service';
import { AuthService } from '../../Services/auth';
import { AlertService } from '../../Services/alert';

@Component({
  selector: 'app-live-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './live-chat.html',
  styleUrl: './live-chat.css'
})
export class LiveChatComponent implements OnInit, OnDestroy {
  live = inject(LiveChatService);
  auth = inject(AuthService);
  private alert = inject(AlertService);

  @ViewChild('scroller') scroller?: ElementRef<HTMLElement>;
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  messages = signal<LiveMessage[]>([]);
  pinned = signal<LiveMessage[]>([]);
  hasMore = signal(false);
  loading = signal(true);
  showPinned = signal(false);

  // هوية الزائر (بتتخزن في المتصفح)
  guestKey = '';
  guestName = '';

  // composer
  text = '';
  propertyCode = '';
  showCode = false;
  image: File | null = null;
  imagePreview: string | null = null;
  sending = signal(false);

  private subs: Subscription[] = [];
  private pollTimer?: ReturnType<typeof setInterval>;

  get loggedIn(): boolean { return this.auth.loggedIn(); }

  get isAdmin(): boolean {
    try { return !!JSON.parse(localStorage.getItem('user') || '{}').roles?.includes('Admin'); } catch { return false; }
  }

  private get myUserId(): string {
    try { return JSON.parse(localStorage.getItem('user') || '{}').id || ''; } catch { return ''; }
  }

  ngOnInit(): void {
    this.initGuest();
    this.live.start();
    this.loadInitial();
    this.loadPinned();

    this.subs.push(
      this.live.message$.subscribe(m => this.onIncoming(m)),
      this.live.pinChanged$.subscribe(m => this.onPinChanged(m)),
      this.live.deleted$.subscribe(id => this.onDeleted(id))
    );

    // لو الاتصال اللحظي مش شغال: تحديث دوري
    this.pollTimer = setInterval(() => { if (!this.live.connected()) this.poll(); }, 6000);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.live.stop();
  }

  private initGuest(): void {
    try {
      let k = localStorage.getItem('liveGuestKey');
      if (!k) {
        k = (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36)).replace(/-/g, '').slice(0, 32);
        localStorage.setItem('liveGuestKey', k);
      }
      this.guestKey = k;
      this.guestName = localStorage.getItem('liveGuestName') || '';
    } catch { this.guestKey = Math.random().toString(36).slice(2); }
  }

  saveGuestName(): void {
    try { localStorage.setItem('liveGuestName', this.guestName.trim()); } catch { /* ignore */ }
  }

  // ---------- Loading ----------
  private loadInitial(): void {
    this.live.getMessages().subscribe({
      next: list => {
        this.messages.set(list);
        this.hasMore.set(list.length >= 40);
        this.loading.set(false);
        this.scrollBottom();
      },
      error: () => this.loading.set(false)
    });
  }

  loadPinned(): void {
    this.live.getPinned().subscribe({ next: l => this.pinned.set(l), error: () => {} });
  }

  loadOlder(): void {
    const first = this.messages()[0];
    if (!first) return;
    const el = this.scroller?.nativeElement;
    const prev = el?.scrollHeight ?? 0;
    this.live.getMessages(first.id).subscribe(list => {
      this.messages.set([...list, ...this.messages()]);
      this.hasMore.set(list.length >= 40);
      setTimeout(() => { if (el) el.scrollTop = el.scrollHeight - prev; });
    });
  }

  private poll(): void {
    this.live.getMessages().subscribe(list => {
      const known = new Set(this.messages().map(m => m.id));
      const fresh = list.filter(m => !known.has(m.id));
      if (fresh.length) { this.messages.update(l => [...l, ...fresh]); this.scrollBottom(); }
      // مزامنة التثبيت/المسح
      const latest = new Map(list.map(m => [m.id, m]));
      this.messages.update(l => l
        .filter(m => !(m.id >= (list[0]?.id ?? Infinity) && !latest.has(m.id)))
        .map(m => latest.get(m.id) ?? m));
    });
    this.loadPinned();
  }

  // ---------- Real-time handlers ----------
  private onIncoming(m: LiveMessage): void {
    if (this.messages().some(x => x.id === m.id)) return;
    const el = this.scroller?.nativeElement;
    const nearBottom = !el || el.scrollHeight - el.scrollTop - el.clientHeight < 150;
    this.messages.update(l => [...l, m]);
    if (nearBottom || this.isMine(m)) this.scrollBottom();
  }

  private onPinChanged(m: LiveMessage): void {
    this.messages.update(l => l.map(x => x.id === m.id ? m : x));
    this.pinned.update(l => {
      const rest = l.filter(x => x.id !== m.id);
      return m.isPinned ? [m, ...rest] : rest;
    });
  }

  private onDeleted(id: number): void {
    this.messages.update(l => l.filter(x => x.id !== id));
    this.pinned.update(l => l.filter(x => x.id !== id));
  }

  // ---------- Sending ----------
  onFile(ev: Event): void {
    const f = (ev.target as HTMLInputElement).files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) { this.alert.error('Please choose an image.'); return; }
    if (f.size > 5 * 1024 * 1024) { this.alert.error('Image is too large (max 5 MB).'); return; }
    this.image = f;
    const r = new FileReader();
    r.onload = () => (this.imagePreview = r.result as string);
    r.readAsDataURL(f);
  }

  removeImage(): void {
    this.image = null; this.imagePreview = null;
    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }

  canSend(): boolean {
    return !this.sending() && (!!this.text.trim() || !!this.image || !!this.propertyCode.trim());
  }

  send(): void {
    if (!this.canSend()) return;
    if (!this.loggedIn && this.guestName.trim().length < 2) {
      this.alert.error('Please enter your name (at least 2 letters).');
      return;
    }
    this.saveGuestName();
    this.sending.set(true);

    this.live.send(this.text.trim(), this.propertyCode.trim(), this.image, this.guestName.trim(), this.guestKey).subscribe({
      next: m => {
        this.onIncoming(m);
        this.text = ''; this.propertyCode = ''; this.showCode = false; this.removeImage();
        this.sending.set(false);
        this.scrollBottom();
      },
      error: err => {
        this.sending.set(false);
        const msg = err.status === 429 ? 'You are sending messages too fast. Please wait a moment.'
          : typeof err.error === 'string' ? err.error : 'Could not send the message.';
        this.alert.error(msg);
      }
    });
  }

  onEnter(ev: Event): void {
    const e = ev as KeyboardEvent;
    if (e.shiftKey) return;
    e.preventDefault();
    this.send();
  }

  // ---------- Admin actions ----------
  togglePin(m: LiveMessage): void {
    const call = m.isPinned ? this.live.unpin(m.id) : this.live.pin(m.id);
    call.subscribe({
      next: updated => this.onPinChanged(updated),
      error: () => this.alert.error('Could not update the pin.')
    });
  }

  remove(m: LiveMessage): void {
    this.alert.confirm('Delete this message for everyone?', () => {
      this.live.remove(m.id).subscribe({
        next: () => this.onDeleted(m.id),
        error: () => this.alert.error('Could not delete the message.')
      });
    });
  }

  // ---------- Helpers ----------
  copyInvite(): void {
    navigator.clipboard?.writeText(this.live.inviteLink()).then(
      () => this.alert.success('Live chat link copied.'),
      () => this.alert.error('Could not copy. Copy it from the address bar.')
    );
  }

  isMine(m: LiveMessage): boolean {
    return !!m.senderKey && (m.senderKey === this.guestKey || m.senderKey === this.myUserId);
  }

  showSender(i: number): boolean {
    const l = this.messages();
    return !this.isMine(l[i]) && (i === 0 || l[i - 1].senderKey !== l[i].senderKey);
  }

  showDay(i: number): boolean {
    const l = this.messages();
    return i === 0 || new Date(l[i - 1].createdAt).toDateString() !== new Date(l[i].createdAt).toDateString();
  }

  jumpTo(m: LiveMessage): void {
    this.showPinned.set(false);
    setTimeout(() => {
      const el = document.getElementById('live-msg-' + m.id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('flash');
        setTimeout(() => el.classList.remove('flash'), 1800);
      }
    }, 50);
  }

  private scrollBottom(): void {
    setTimeout(() => { const el = this.scroller?.nativeElement; if (el) el.scrollTop = el.scrollHeight; }, 50);
  }
}