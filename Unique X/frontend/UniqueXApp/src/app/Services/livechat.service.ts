import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { ChatProperty, ChatRequest } from './chat.service';

export interface LiveMessage {
  id: number;
  senderKey: string; senderName: string; senderImage?: string; isGuest: boolean;
  text?: string; imageUrl?: string; property?: ChatProperty | null; request?: ChatRequest | null;
  isPinned: boolean; pinnedAt?: string; pinnedByName?: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class LiveChatService {
  private base = environment.apiUrl + '/livechat';
  private hub?: signalR.HubConnection;

  message$ = new Subject<LiveMessage>();
  pinChanged$ = new Subject<LiveMessage>();
  deleted$ = new Subject<number>();
  connected = signal(false);

  constructor(private http: HttpClient) {}

  // الاتصال اللحظي مفتوح للكل (التوكن اختياري)
  async start(): Promise<void> {
    if (this.hub && this.hub.state !== signalR.HubConnectionState.Disconnected) return;

    this.hub = new signalR.HubConnectionBuilder()
      .withUrl(environment.apiUrl + '/hubs/livechat', {
        accessTokenFactory: () => localStorage.getItem('token') || ''
      })
      .withAutomaticReconnect()
      .build();

    this.hub.on('LiveMessage', (m: LiveMessage) => this.message$.next(m));
    this.hub.on('LivePinChanged', (m: LiveMessage) => this.pinChanged$.next(m));
    this.hub.on('LiveDeleted', (id: number) => this.deleted$.next(id));
    this.hub.onreconnected(() => this.connected.set(true));
    this.hub.onreconnecting(() => this.connected.set(false));
    this.hub.onclose(() => this.connected.set(false));

    try {
      await this.hub.start();
      this.connected.set(true);
    } catch (e) {
      this.connected.set(false);
      console.warn('Live chat real-time connection failed, falling back to polling.', e);
    }
  }

  async stop(): Promise<void> {
    try { await this.hub?.stop(); } catch { /* ignore */ }
    this.hub = undefined;
    this.connected.set(false);
  }

  getMessages(before?: number): Observable<LiveMessage[]> {
    let params = new HttpParams().set('take', 40);
    if (before) params = params.set('before', before);
    return this.http.get<LiveMessage[]>(`${this.base}/messages`, { params });
  }

  getPinned(): Observable<LiveMessage[]> {
    return this.http.get<LiveMessage[]>(`${this.base}/pinned`);
  }

  send(text: string, propertyCode: string, leadRequestId: number | undefined,
       guestName: string, guestKey: string, anonymous: boolean): Observable<LiveMessage> {
    const fd = new FormData();
    if (text) fd.append('text', text);
    if (propertyCode) fd.append('propertyCode', propertyCode);
    if (leadRequestId) fd.append('leadRequestId', String(leadRequestId));
    if (guestName) fd.append('guestName', guestName);
    if (guestKey) fd.append('guestKey', guestKey);
    if (anonymous) fd.append('anonymous', 'true');
    return this.http.post<LiveMessage>(`${this.base}/messages`, fd);
  }

  pin(id: number): Observable<LiveMessage> {
    return this.http.post<LiveMessage>(`${this.base}/messages/${id}/pin`, {});
  }
  unpin(id: number): Observable<LiveMessage> {
    return this.http.post<LiveMessage>(`${this.base}/messages/${id}/unpin`, {});
  }
  remove(id: number) {
    return this.http.delete(`${this.base}/messages/${id}`);
  }

  // لينك الدعوة: أي حد يفتحه يشوف الشات
  inviteLink(): string {
    return `${window.location.origin}/live-chat`;
  }
}