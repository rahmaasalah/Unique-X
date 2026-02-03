import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PropertyService } from '../../Services/property';
import { AlertService } from '../../Services/alert';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-property',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-property.html',
  styleUrl: './add-property.css'
})
export class AddPropertyComponent implements OnInit {
  propertyForm!: FormGroup;
  selectedFiles: File[] = []; // لتخزين الصور المختارة محلياً

  private fb = inject(FormBuilder);
  private propertyService = inject(PropertyService);
  private alertService = inject(AlertService);
  private router = inject(Router);

  ngOnInit(): void {
    this.propertyForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
      area: ['', [Validators.required, Validators.min(0)]],
      rooms: [0],
      bathrooms: [0],
      city: [1, Validators.required], // القيمة الافتراضية القاهرة
      region: [''],
      address: [''],
      listingType: [0], // 0 = Sale, 1 = Rent
      propertyType: [0] // 0 = Apartment, etc.
    });
  }

  // دالة لالتقاط الصور عند اختيارها
  onFileSelect(event: any) {
    const files = event.target.files;
    if (files.length > 0) {
      this.selectedFiles = Array.from(files);
    }
  }

  onSubmit() {
    if (this.propertyForm.valid && this.selectedFiles.length > 0) {
      const formData = new FormData();

       
      // 1. إضافة كل حقول النص والأرقام للـ FormData
      Object.keys(this.propertyForm.value).forEach(key => {
        formData.append(key, this.propertyForm.value[key]);
      });

      // 2. إضافة الصور (لازم الاسم يكون 'Photos' عشان يطابق الـ DTO في الباك اند)
      this.selectedFiles.forEach(file => {
        formData.append('Photos', file);
      });

      // 3. الإرسال للباك اند
      this.propertyService.addProperty(formData).subscribe({
        next: () => {
          this.alertService.success('Great! Your property is now live.', 'Property Published');
          this.router.navigate(['/home']);
        },
        error: (err) => {
          console.error(err);
          this.alertService.error('Failed to publish property. Please check your connection.');
        }
      });
    } else if (this.selectedFiles.length === 0) {
      this.alertService.error('Please upload at least one photo.');
    }
  }

  updateCounter(controlName: string, amount: number) {
  const control = this.propertyForm.get(controlName);
  if (control) {
    const currentValue = control.value || 0;
    const newValue = currentValue + amount;
    
    // الشرط: لا تسمح بالقيمة إذا كانت أقل من صفر
    if (newValue >= 0) {
      control.patchValue(newValue);
    }
  }
}
}