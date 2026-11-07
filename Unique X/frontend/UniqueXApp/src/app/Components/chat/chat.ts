import { Component, ElementRef, OnDestroy, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, Subject, switchMap, of } from 'rxjs';
import { ChatMessage, ChatService, ChatUser, Conversation } from '../../Services/chat.service';
import { AlertService } from '../../Services/alert';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './chat.html',
  styleUrl: './chat.css'
})
export class ChatComponent implements OnInit, OnDestroy {
  chat = inject(ChatService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private alert = inject(AlertService);

  @ViewChild('scroller') scroller?: ElementRef<HTMLElement>;
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  me = this.currentUserId();
  conversations = signal<Conversation[]>([]);
  activeId = signal<number | null>(null);
  active = computed(() => this.conversations().find(c => c.id === this.activeId()) ?? this.detail());
  detail = signal<Conversation | null>(null);
  messages = signal<ChatMessage[]>([]);
  loadingMessages = signal(false);
  hasMore = signal(false);

  // composer
  text = '';
  propertyCode = '';
  showCode = false;
  image: File | null = null;
  imagePreview: string | null = null;
  sending = signal(false);

  // new chat / room
  showNew = signal(false);
  newTab: 'direct' | 'room' = 'direct';
  userQuery = '';
  userResults = signal<ChatUser[]>([]);
  roomName = '';

  // room info
  showInfo = signal(false);

  private subs: Subscription[] = [];
  private search$ = new Subject<string>();

  ngOnInit(): void {
    this.chat.start();
    this.loadConversations();

    this.subs.push(
      this.route.paramMap.subscribe(p => {
        const id = Number(p.get('id'));
        if (id) this.open(id, false); else { this.activeId.set(null); this.messages.set([]); }
      }),
      this.chat.message$.subscribe(m => this.onIncoming(m)),
      this.search$.pipe(
        debounceTime(300), distinctUntilChanged(),
        switchMap(q => q.trim().length >= 2 ? this.chat.searchUsers(q.trim()) : of([] as ChatUser[]))
      ).subscribe(r => this.userResults.set(r))
    );
  }

  ngOnDestroy(): void { this.subs.forEach(s => s.unsubscribe()); }

  private currentUserId(): string {
    try { return JSON.parse(localStorage.getItem('user') || '{}').id || ''; } catch { return ''; }
  }

  // ---------- Conversations ----------
  loadConversations(): void {
    this.chat.getConversations().subscribe({
      next: list => this.conversations.set(list),
      error: () => {}
    });
  }

  select(c: Conversation): void {
    this.router.navigate(['/chat', c.id]);
  }

  back(): void { this.router.navigate(['/chat']); }

  private open(id: number, navigate: boolean): void {
    if (navigate) this.router.navigate(['/chat', id]);
    this.activeId.set(id);
    this.showInfo.set(false);
    this.messages.set([]);
    this.hasMore.set(false);
    this.resetComposer();

    this.chat.getConversation(id).subscribe({
      next: c => this.detail.set(c),
      error: () => { this.alert.error('Conversation not found.'); this.router.navigate(['/chat']); }
    });

    this.loadingMessages.set(true);
    this.chat.getMessages(id).subscribe({
      next: list => {
        this.messages.set(list);
        this.hasMore.set(list.length >= 40);
        this.loadingMessages.set(false);
        this.scrollBottom();
        this.markRead(id);
      },
      error: () => this.loadingMessages.set(false)
    });
  }

  loadOlder(): void {
    const id = this.activeId();
    const first = this.messages()[0];
    if (!id || !first) return;
    const el = this.scroller?.nativeElement;
    const prevHeight = el?.scrollHeight ?? 0;
    this.chat.getMessages(id, first.id).subscribe(list => {
      this.messages.set([...list, ...this.messages()]);
      this.hasMore.set(list.length >= 40);
      setTimeout(() => { if (el) el.scrollTop = el.scrollHeight - prevHeight; });
    });
  }

  private markRead(id: number): void {
    this.chat.markRead(id).subscribe(() => {
      this.conversations.update(list => list.map(c => c.id === id ? { ...c, unreadCount: 0 } : c));
      this.chat.refreshUnread();
    });
  }

  private onIncoming(m: ChatMessage): void {
    const isActive = m.conversationId === this.activeId();

    if (isActive && !this.messages().some(x => x.id === m.id)) {
      this.messages.update(list => [...list, m]);
      this.scrollBottom();
      if (m.senderId !== this.me) this.markRead(m.conversationId);
    }

    const known = this.conversations().some(c => c.id === m.conversationId);
    if (!known) { this.loadConversations(); return; }

    const preview = m.text || (m.property ? '🏠 Property' : m.imageUrl ? '📷 Photo' : '');
    this.conversations.update(list => {
      const updated = list.map(c => c.id === m.conversationId ? {
        ...c,
        lastMessage: preview,
        lastMessageAt: m.createdAt,
        unreadCount: !isActive && m.senderId !== this.me ? c.unreadCount + 1 : c.unreadCount
      } : c);
      return updated.sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
    });
  }

  // ---------- Sending ----------
  onFile(ev: Event): void {
    const f = (ev.target as HTMLInputElement).files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) { this.alert.error('Please choose an image.'); return; }
    if (f.size > 5 * 1024 * 1024) { this.alert.error('Image is too large (max 5 MB).'); return; }
    this.image = f;
    const reader = new FileReader();
    reader.onload = () => (this.imagePreview = reader.result as string);
    reader.readAsDataURL(f);
  }

  removeImage(): void {
    this.image = null; this.imagePreview = null;
    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }

  private resetComposer(): void {
    this.text = ''; this.propertyCode = ''; this.showCode = false; this.removeImage();
  }

  canSend(): boolean {
    return !this.sending() && (!!this.text.trim() || !!this.image || !!this.propertyCode.trim());
  }

  send(): void {
    const id = this.activeId();
    if (!id || !this.canSend()) return;

    this.sending.set(true);
    this.chat.send(id, this.text.trim(), this.propertyCode.trim(), this.image).subscribe({
      next: m => {
        if (!this.messages().some(x => x.id === m.id)) this.messages.update(l => [...l, m]);
        this.resetComposer();
        this.sending.set(false);
        this.scrollBottom();
        this.onIncoming(m);
      },
      error: err => {
        this.sending.set(false);
        this.alert.error(typeof err.error === 'string' ? err.error : 'Could not send the message.');
      }
    });
  }

  onEnter(ev: Event): void {
    const e = ev as KeyboardEvent;
    if (e.shiftKey) return;
    e.preventDefault();
    this.send();
  }

  // ---------- New chat / room ----------
  openNew(tab: 'direct' | 'room'): void {
    this.newTab = tab; this.userQuery = ''; this.userResults.set([]); this.roomName = '';
    this.showNew.set(true);
  }

  onUserQuery(): void { this.search$.next(this.userQuery); }

  startWith(u: ChatUser): void {
    this.chat.startDirect(u.id).subscribe({
      next: c => { this.showNew.set(false); this.loadConversations(); this.router.navigate(['/chat', c.id]); },
      error: err => this.alert.error(typeof err.error === 'string' ? err.error : 'Could not start the chat.')
    });
  }

  createRoom(): void {
    const name = this.roomName.trim();
    if (!name) return;
    this.chat.createRoom(name).subscribe({
      next: c => { this.showNew.set(false); this.loadConversations(); this.router.navigate(['/chat', c.id]); },
      error: () => this.alert.error('Could not create the room.')
    });
  }

  // ---------- Room info ----------
  inviteLink(): string {
    const code = this.active()?.inviteCode;
    return code ? this.chat.inviteLink(code) : '';
  }

  copyInvite(): void {
    const link = this.inviteLink();
    if (!link) return;
    navigator.clipboard?.writeText(link).then(
      () => this.alert.success('Invitation link copied.'),
      () => this.alert.error('Could not copy. Copy it manually.')
    );
  }

  leaveRoom(): void {
    const id = this.activeId();
    if (!id) return;
    this.alert.confirm('Leave this room?', () => {
      this.chat.leave(id).subscribe(() => {
        this.conversations.update(l => l.filter(c => c.id !== id));
        this.router.navigate(['/chat']);
      });
    });
  }

  // ---------- Helpers ----------
  isMine(m: ChatMessage): boolean { return m.senderId === this.me; }

  showSender(i: number): boolean {
    const list = this.messages();
    return this.active()?.type === 1 && !this.isMine(list[i]) && (i === 0 || list[i - 1].senderId !== list[i].senderId);
  }

  showDay(i: number): boolean {
    const list = this.messages();
    return i === 0 || new Date(list[i - 1].createdAt).toDateString() !== new Date(list[i].createdAt).toDateString();
  }

  private scrollBottom(): void {
    setTimeout(() => { const el = this.scroller?.nativeElement; if (el) el.scrollTop = el.scrollHeight; }, 50);
  }
}