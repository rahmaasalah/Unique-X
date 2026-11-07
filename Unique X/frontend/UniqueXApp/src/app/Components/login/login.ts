import { Component, OnInit, ChangeDetectorRef, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../Services/auth';
import { ChatService } from '../../Services/chat.service';
import { Router, RouterModule } from '@angular/router';
import { AlertService } from '../../Services/alert';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
      private cdr = inject(ChangeDetectorRef);
      private chatService = inject(ChatService);


  constructor(
    private fb: FormBuilder, 
    private authService: AuthService,
    private router: Router,
    private alertService: AlertService
  ) {}

  showPassword = false;

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.authService.login(this.loginForm.value).subscribe({
        next: (response: any) => {
          this.chatService.start(); // الشات اللحظي
          this.alertService.success('Logged in successfully!', 'Welcome');

          // 2. استخدام setTimeout عشان ندي فرصة للـ LocalStorage يتخزن والـ Alert يظهر
          setTimeout(() => {
            // 🟢 لو كان داخل من لينك دعوة روم شات، نكمل عليها
            let pendingInvite: string | null = null;
            try { pendingInvite = localStorage.getItem('pendingChatInvite'); localStorage.removeItem('pendingChatInvite'); } catch { /* ignore */ }
            if (pendingInvite) {
              this.router.navigateByUrl('/chat/join/' + pendingInvite);
              return;
            }

            const roles = response.roles as string[];
            
            if (roles && roles.includes('Admin')) {
              // نستخدم navigateByUrl أحياناً بتكون أسرع في التوجيه الجذري
              this.router.navigateByUrl('/admin').then(() => {
                this.cdr.detectChanges(); // إجبار الأنجولار على تحديث الواجهة
              });
            } else {
              this.router.navigateByUrl('/home').then(() => {
                this.cdr.detectChanges(); // إجبار الأنجولار على تحديث الواجهة
              });
            }
          }, 100); // تأخير 100 ملي ثانية فقط
        },
        error: (err) => {
          this.alertService.error('Invalid email or password.');
          const errorMessage = typeof err.error === 'string' ? err.error : 'Login failed';
    this.alertService.error(errorMessage, 'Access Denied');
        }
      });
    }
  }
}