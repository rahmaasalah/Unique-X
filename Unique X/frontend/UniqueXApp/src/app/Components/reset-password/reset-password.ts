import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../Services/auth';
import { AlertService } from '../../Services/alert';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container d-flex align-items-center justify-content-center min-vh-100">
      <div class="card shadow-lg border-0 p-4 p-md-5" style="max-width: 450px; width: 100%;">
        <div class="text-center mb-4">
          <h3 class="fw-bold text-dark mb-2">Create New Password</h3>
          <p class="text-muted small">Your new password must be different from previously used passwords.</p>
        </div>
        
        <form [formGroup]="resetForm" (ngSubmit)="onSubmit()">
          <div class="mb-3">
            <label class="form-label fw-semibold">New Password</label>
            <input type="password" formControlName="newPassword" class="form-control form-control-lg rounded-3">
            <div *ngIf="resetForm.get('newPassword')?.dirty && resetForm.get('newPassword')?.invalid" class="text-danger small mt-1">
               Password needs: 6+ chars, Upper, Lower, Number & Symbol.
            </div>
          </div>
          
          <div class="mb-4">
            <label class="form-label fw-semibold">Confirm Password</label>
            <input type="password" formControlName="confirmPassword" class="form-control form-control-lg rounded-3">
            <div *ngIf="resetForm.hasError('mismatch')" class="text-danger small mt-1">
               Passwords do not match.
            </div>
          </div>

          <button type="submit"[disabled]="resetForm.invalid || isLoading" class="btn btn-danger btn-lg w-100 rounded-pill fw-bold">
            {{ isLoading ? 'Saving...' : 'Reset Password' }}
          </button>
        </form>
      </div>
    </div>
  `
})
export class ResetPasswordComponent implements OnInit {
  resetForm!: FormGroup;
  email: string = '';
  token: string = '';
  isLoading = false;

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private alertService = inject(AlertService);

  ngOnInit() {
    // التقاط الإيميل والتوكن من رابط الـ URL (اللي جاي من الإيميل)
    this.email = this.route.snapshot.queryParams['email'] || '';
    this.token = this.route.snapshot.queryParams['token'] || '';

    if (!this.email || !this.token) {
      this.alertService.error('Invalid or expired password reset link.');
      this.router.navigate(['/login']);
    }

    this.resetForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W]).{6,}$/)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value ? null : { mismatch: true };
  }

  onSubmit() {
    if (this.resetForm.invalid) return;
    
    this.isLoading = true;
    this.alertService.showLoading('Resetting password...');

    const payload = {
      email: this.email,
      token: this.token,
      newPassword: this.resetForm.value.newPassword
    };

    this.authService.resetPassword(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.alertService.close();
        this.alertService.success('Your password has been reset successfully! You can now log in.', 'Success');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isLoading = false;
        this.alertService.close();
        const msg = typeof err.error === 'string' ? err.error : 'Failed to reset password. The link might be expired.';
        this.alertService.error(msg);
      }
    });
  }
}