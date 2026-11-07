import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ChatProperty {
  id: number; code?: string; title?: string; price: number;
  city?: string; region?: string; imageUrl?: string;
}

export interface ChatMessage {
  id: number; conversationId: number;
  senderId: string; senderName: string; senderImage?: string;
  text?: string; imageUrl?: string; property?: ChatProperty | null;
  createdAt: string;
}

export interface ChatMember { userId: string; name: string; imageUrl?: string; }

export interface Conversation {
  id: number;
  type: number; // 0 Direct, 1 Room
  title: string; imageUrl?: string; inviteCode?: string;
  membersCount: number; unreadCount: number;
  lastMessage?: string; lastMessageAt: string;
  members?: ChatMember[];
}

export interface ChatUser { id: string; name: string; imageUrl?: string; userType: number; }

@Injectable({ providedIn: 'root' })
export class ChatService {
  private base = environment.apiUrl + '/chat';
  private hub?: signalR.HubConnection;

  // رسائل جاية لحظيًا
  message$ = new Subject<ChatMessage>();
  // عدد الرسائل الغير مقروءة (للبادج في النافبار)
  unread = signal(0);

  constructor(private http: HttpClient) {}

  // ---------- Real-time ----------
  async start(): Promise<void> {
    if (!localStorage.getItem('token')) return;
    if (this.hub && this.hub.state !== signalR.HubConnectionState.Disconnected) return;

    // تحت /api عشان نفس راوت الـ reverse proxy بتاع الـ API يغطيه
    const hubUrl = environment.apiUrl + '/hubs/chat';
    this.hub = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, { accessTokenFactory: () => localStorage.getItem('token') || '' })
      .withAutomaticReconnect()
      .build();

    this.hub.on('ReceiveMessage', (m: ChatMessage) => {
      this.message$.next(m);
      this.refreshUnread();
    });

    this.hub.onreconnected(() => this.refreshUnread());

    try {
      await this.hub.start();
      this.refreshUnread();
    } catch {
      // لو الاتصال فشل الشات هيفضل شغال بالـ REST، ومحاولة تانية عند فتح الصفحة
    }
  }

  async stop(): Promise<void> {
    try { await this.hub?.stop(); } catch { /* ignore */ }
    this.hub = undefined;
    this.unread.set(0);
  }

  refreshUnread(): void {
    if (!localStorage.getItem('token')) return;
    this.http.get<{ count: number }>(`${this.base}/unread-count`)
      .subscribe({ next: r => this.unread.set(r.count), error: () => {} });
  }

  // ---------- REST ----------
  searchUsers(q: string): Observable<ChatUser[]> {
    return this.http.get<ChatUser[]>(`${this.base}/users`, { params: new HttpParams().set('q', q) });
  }
  getConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.base}/conversations`);
  }
  getConversation(id: number): Observable<Conversation> {
    return this.http.get<Conversation>(`${this.base}/conversations/${id}`);
  }
  startDirect(userId: string): Observable<Conversation> {
    return this.http.post<Conversation>(`${this.base}/direct`, { userId });
  }
  createRoom(name: string): Observable<Conversation> {
    return this.http.post<Conversation>(`${this.base}/rooms`, { name });
  }
  joinRoom(inviteCode: string): Observable<Conversation> {
    return this.http.post<Conversation>(`${this.base}/rooms/join`, { inviteCode });
  }
  leave(id: number) {
    return this.http.post(`${this.base}/conversations/${id}/leave`, {});
  }
  getMessages(id: number, before?: number): Observable<ChatMessage[]> {
    let params = new HttpParams().set('take', 40);
    if (before) params = params.set('before', before);
    return this.http.get<ChatMessage[]>(`${this.base}/conversations/${id}/messages`, { params });
  }
  send(id: number, text: string, propertyCode: string, image: File | null): Observable<ChatMessage> {
    const fd = new FormData();
    if (text) fd.append('text', text);
    if (propertyCode) fd.append('propertyCode', propertyCode);
    if (image) fd.append('image', image);
    return this.http.post<ChatMessage>(`${this.base}/conversations/${id}/messages`, fd);
  }
  markRead(id: number) {
    return this.http.post(`${this.base}/conversations/${id}/read`, {});
  }

  // لينك الدعوة اللي بيتشارك
  inviteLink(code: string): string {
    return `${window.location.origin}/chat/join/${code}`;
  }
}