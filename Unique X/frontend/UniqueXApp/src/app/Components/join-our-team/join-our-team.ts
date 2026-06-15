import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AlertService } from '../../Services/alert';

@Component({
  selector: 'app-join-our-team',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './join-our-team.html'
})
export class JoinOurTeamComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private alertService = inject(AlertService);
  private router = inject(Router);

  selectedFile = signal<File | null>(null);
  isSubmitting = signal(false);

  form: FormGroup = this.fb.group({
    fullName:              ['', Validators.required],
    phoneNumber:           ['', Validators.required],
    address:               ['', Validators.required],
    city:                  [''],
    hasJob:                ['', Validators.required],
    workPlace:             [''],
    hasLaptop:             ['', Validators.required],
    jobTitle:              ['', Validators.required],
    englishLevel:          ['', Validators.required],
    crmTools:              [[], Validators.required],
    pastExperiences:       [''],
    realEstateBackground:  [''],
    companyType:           ['', Validators.required],
    zoneWorkedOn:          ['', Validators.required],
    projectPreparation:    ['', Validators.required],
    visitSite:             ['', Validators.required],
    dealsClosing:          ['', Validators.required],
    salesLastQuarter:      ['', Validators.required],
  });

  crmOptions = ['Odoo', 'Engaz', 'Slack', 'Other'];

  onCrmToggle(tool: string) {
    const current: string[] = this.form.get('crmTools')?.value || [];
    const updated = current.includes(tool)
      ? current.filter(t => t !== tool)
      : [...current, tool];
    this.form.get('crmTools')?.setValue(updated);
  }

  isCrmSelected(tool: string): boolean {
    return (this.form.get('crmTools')?.value || []).includes(tool);
  }

  onFileChange(event: any) {
  const file = event.target.files[0];
  if (file) {
    this.selectedFile.set(file);
    console.log('File selected:', file.name, file.size); // أضيفي السطر ده مؤقتاً
  }
}

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.alertService.error('Please fill all required fields.');
      return;
    }

    this.isSubmitting.set(true);
    const formData = new FormData();
    const f = this.form.value;

    formData.append('FullName', f.fullName);
    formData.append('PhoneNumber', f.phoneNumber);
    formData.append('Address', f.address);
    formData.append('City', f.city || '');
    formData.append('HasJob', f.hasJob);
    formData.append('WorkPlace', f.workPlace || '');
    formData.append('HasLaptop', f.hasLaptop);
    formData.append('JobTitle', f.jobTitle);
    formData.append('EnglishLevel', f.englishLevel);
    formData.append('CrmTools', (f.crmTools as string[]).join(', '));
    formData.append('PastExperiences', f.pastExperiences || '');
    formData.append('RealEstateBackground', f.realEstateBackground || '');
    formData.append('CompanyType', f.companyType);
    formData.append('ZoneWorkedOn', f.zoneWorkedOn);
    formData.append('ProjectPreparation', f.projectPreparation);
    formData.append('VisitSite', f.visitSite);
    formData.append('DealsClosing', f.dealsClosing);
    formData.append('SalesLastQuarter', f.salesLastQuarter);

    if (this.selectedFile()) {
      formData.append('CvFile', this.selectedFile()!);
    }

    this.http.post('https://localhost:7294/api/jobapplications', formData).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.alertService.success('Application submitted successfully! We will contact you soon.');
        this.router.navigate(['/home']);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.alertService.error('Failed to submit. Please try again.');
      }
    });
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }
}