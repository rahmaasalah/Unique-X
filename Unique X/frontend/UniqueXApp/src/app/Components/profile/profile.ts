import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../Services/auth';
import { AlertService } from '../../Services/alert';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html'
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  stats = signal<any>(null);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private alertService = inject(AlertService);

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: [{value: '', disabled: true}], // الإيميل لا يعدل غالباً
      phoneNumber: ['', Validators.required],
      userType: [0]
    });

    this.loadProfile();
  }

  loadProfile() {
    this.authService.getProfile().subscribe(data => {
      this.profileForm.patchValue(data);
      this.stats.set(data);
    });
  }

  onSubmit() {
    if (this.profileForm.valid) {
      this.authService.updateProfile(this.profileForm.getRawValue()).subscribe({
        next: () => this.alertService.success('Profile updated!'),
        error: () => this.alertService.error('Update failed')
      });
    }
  }
}