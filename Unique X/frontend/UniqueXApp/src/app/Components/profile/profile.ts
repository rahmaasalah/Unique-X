// src/app/components/profile/profile.component.ts

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../Services/auth';
import { AlertService } from '../../Services/alert';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class ProfileComponent implements OnInit {
  // سجنل شايل كل بيانات المستخدم بما فيها رابط الصورة
  userData = signal<any>(null);

  public authService = inject(AuthService);
  private alertService = inject(AlertService);

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile() {
    this.authService.getProfile().subscribe({
      next: (data) => {
        this.userData.set(data);

        // 🟢 تحديث hasCrmAccess في localStorage بالقيمة الحديثة من الداتابيز
        // عشان لو الأدمن أعطى الصلاحية بعد اللوجن، الزرار يظهر فوراً من غير logout
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        user.hasCrmAccess = !!data.hasCrmAccess;
        localStorage.setItem('user', JSON.stringify(user));
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

  copyProfileLink() {
    if (!this.userData()) return;

    const fName = this.userData().firstName || '';
    const lName = this.userData().lastName || '';

    // تحويل الاسم لصيغة لينك (مثال: Tarek Test -> tarek-test)
    const slug = `${fName} ${lName}`.trim().toLowerCase().replace(/\s+/g, '-');

    // تجميع اللينك النهائي
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/home?brokerName=${slug}`;

    // نسخ اللينك في الحافظة
    navigator.clipboard.writeText(link).then(() => {
      this.alertService.success('Your profile link has been copied!');
    }).catch(err => {
      console.error('Failed to copy: ', err);
      this.alertService.error('Failed to copy link.');
    });
  }
}