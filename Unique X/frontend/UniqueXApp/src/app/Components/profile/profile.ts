// src/app/components/profile/profile.component.ts

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../Services/auth';
import { AlertService } from '../../Services/alert';
import { RouterLink } from "@angular/router";
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  // سجنل شايل كل بيانات المستخدم بما فيها رابط الصورة
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
      userType: [0]
    });

    this.loadProfile();
  }

  loadProfile() {
    this.authService.getProfile().subscribe({
      next: (data) => {
        this.userData.set(data); // تخزين البيانات بالكامل بما فيها الصورة
        this.profileForm.patchValue(data); // ملء الحقول في الفورم
      },
      error: () => this.alertService.error('Could not load profile data')
    });
  }

  onImageChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.alertService.showLoading('Uploading image...');
      this.authService.uploadProfileImage(file).subscribe({
        next: (res: any) => {
          this.alertService.close();
          
          // تحديث الصورة في الصفحة الحالية فوراً
          this.userData.update(current => ({ ...current, profileImageUrl: res.url }));
          
          // تحديث الـ LocalStorage عشان الـ Navbar يحس بالتغيير
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          user.profileImageUrl = res.url;
          localStorage.setItem('user', JSON.stringify(user));
          
          this.alertService.success('Profile picture updated!');
        },
        error: () => {
          this.alertService.close();
          this.alertService.error('Upload failed');
        }
      });
    }
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
  this.router.navigate(['/home']);
        },
        error: () => {
          this.alertService.close();
          this.alertService.error('Update failed');
        }
      });
    }
  }
}