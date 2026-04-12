import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../Services/auth';
import { AlertService } from '../../Services/alert';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports:[CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container d-flex align-items-center justify-content-center min-vh-100">
      <div class="card shadow-lg border-0 p-4 p-md-5 text-center" style="max-width: 450px; width: 100%;">
        <div class="icon-circle bg-danger-subtle text-danger mx-auto mb-4 d-flex align-items-center justify-content-center rounded-circle" style="width: 80px; height: 80px;">
           <i class="bi bi-envelope-at-fill fs-1"></i>
        </div>
        <h3 class="fw-bold text-dark mb-2">Forgot Password?</h3>
        <p class="text-muted small mb-4">Enter the email address associated with your account and we'll send you a link to reset your password.</p>
        
        <form (ngSubmit)="onSubmit()">
          <div class="mb-4 text-start">
            <label class="form-label fw-semibold">Email Address</label>
            <input type="email" class="form-control form-control-lg rounded-3" name="email" [(ngModel)]="email" required placeholder="name@example.com">
          </div>
          <button type="submit" [disabled]="!email || isLoading" class="btn btn-danger btn-lg w-100 rounded-pill mb-3 fw-bold">
            {{ isLoading ? 'Sending...' : 'Send Reset Link' }}
          </button>
          <a routerLink="/login" class="text-muted text-decoration-none small fw-bold"><i class="bi bi-arrow-left me-1"></i>Back to Login</a>
        </form>
      </div>
    </div>
  `
})
export class ForgotPasswordComponent {
  email: string = '';
  isLoading = false;
  private authService = inject(AuthService);
  private alertService = inject(AlertService);

  onSubmit() {
    if (!this.email) return;
    this.isLoading = true;
    this.alertService.showLoading('Sending link...');
    
    this.authService.forgotPassword(this.email).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.alertService.close();
        this.alertService.success('If your email exists in our system, you will receive a password reset link shortly.', 'Check Your Inbox');
        this.email = ''; // تفريغ الحقل
      },
      error: () => {
        this.isLoading = false;
        this.alertService.close();
        this.alertService.error('Something went wrong. Please try again.');
      }
    });
  }
}