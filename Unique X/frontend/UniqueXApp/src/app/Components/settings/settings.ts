// src/app/Components/settings/settings.ts

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../Services/auth';
import { AlertService } from '../../Services/alert';
import { PhoneInputComponent } from '../phone-input/phone-input';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, PhoneInputComponent],
  templateUrl: './settings.html',
  styleUrl: './settings.css'
})
export class SettingsComponent implements OnInit {
  profileForm!: FormGroup;
  userData = signal<any>(null);

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private alertService = inject(AlertService);
  private router = inject(Router);

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: [{ value: '', disabled: true }], // الإيميل للعرض فقط
      phoneNumber: ['', Validators.required],
      userType: [0],
      brokerTitle: [''],
      brokerDescription: ['']
    });

    this.loadProfile();
  }

  loadProfile() {
    this.authService.getProfile().subscribe({
      next: (data) => {
        this.userData.set(data);
        this.profileForm.patchValue(data);
      },
      error: () => this.alertService.error('Could not load profile data')
    });
  }

  onSubmit() {
    if (this.profileForm.valid) {
      this.alertService.showLoading('Saving your data...');
      // نستخدم getRawValue عشان نجيب الإيميل حتى وهو disabled
      this.authService.updateProfile(this.profileForm.getRawValue()).subscribe({
        next: () => {
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          user.username = this.profileForm.get('firstName')?.value; // تحديث الاسم
          localStorage.setItem('user', JSON.stringify(user));

          this.alertService.close();
          this.alertService.success('Profile updated successfully!');
          this.router.navigate(['/profile']);
        },
        error: () => {
          this.alertService.close();
          this.alertService.error('Update failed');
        }
      });
    }
  }
}