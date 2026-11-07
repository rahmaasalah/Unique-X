import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatService } from '../../Services/chat.service';
import { AuthService } from '../../Services/auth';

// صفحة الدخول على روم من لينك الدعوة: /chat/join/:code
@Component({
  selector: 'app-chat-join',
  standalone: true,
  template: `
    <div class="text-center py-5 my-5">
      @if (error) {
        <i class="bi bi-exclamation-circle text-danger fs-1"></i>
        <p class="mt-2">{{ error }}</p>
      } @else {
        <div class="spinner-border text-danger" role="status"></div>
        <p class="mt-3 text-muted">Joining the room...</p>
      }
    </div>`
})
export class ChatJoinComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private chat = inject(ChatService);
  private auth = inject(AuthService);
  error = '';

  ngOnInit(): void {
    const code = this.route.snapshot.paramMap.get('code') || '';

    // لو مش مسجل دخول: نحفظ الكود ونكمل بعد اللوجين
    if (!this.auth.loggedIn()) {
      try { localStorage.setItem('pendingChatInvite', code); } catch { /* ignore */ }
      this.router.navigate(['/login']);
      return;
    }

    this.chat.joinRoom(code).subscribe({
      next: c => this.router.navigate(['/chat', c.id]),
      error: err => this.error = typeof err.error === 'string' ? err.error : 'This invitation link is not valid.'
    });
  }
}