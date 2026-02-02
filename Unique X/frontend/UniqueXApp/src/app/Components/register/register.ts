import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../Services/auth';
import { Router, RouterModule } from '@angular/router';
import { AlertService } from '../../Services/alert';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required]],
      password: ['', [Validators.required, 
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/)]],
      userType: [0, [Validators.required]] // 0 = Client, 1 = Broker
    });
  }

  onSubmit() {
  if (this.registerForm.valid) {
    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
        this.alertService.success('Your account has been created successfully!', 'Welcome!');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        const errorMessage = typeof err.error === 'string' ? err.error : 'Registration failed. Check your data.';
        this.alertService.error(errorMessage, 'Identity Error');
      }
    });
  }
  }
}