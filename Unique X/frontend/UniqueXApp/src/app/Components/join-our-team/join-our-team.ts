import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AlertService } from '../../Services/alert';
import { AdminService } from '../../Services/admin';
import { environment } from '../../../environments/environment';
import { getJobQuestions, JobSection, JobQuestion } from './job-questions.data';

@Component({
  selector: 'app-join-our-team',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './join-our-team.html'
})
export class JoinOurTeamComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private alertService = inject(AlertService);
  private adminService = inject(AdminService);
  private router = inject(Router);

  selectedFile = signal<File | null>(null);
  isSubmitting = signal(false);

  // ===================== Job Postings =====================
  jobs = signal<any[]>([]);
  jobsLoading = signal(true);
  selectedJob = signal<any>(null);
  // list = كروت الوظائف، detail = تفاصيل وظيفة واحدة، form = الفورم القديمة (fallback)، dynamicForm = الفورم الجديدة الخاصة بالوظيفة
  viewMode = signal<'list' | 'detail' | 'form' | 'dynamicForm'>('list');

  // ===================== نظام الأسئلة الديناميكية (8/9 وظائف بأسئلة مختلفة) =====================
  dynamicSections = signal<JobSection[] | null>(null);
  dynamicForm: FormGroup = this.fb.group({});

  ngOnInit() {
    this.adminService.getActiveJobPostings().subscribe({
      next: (data) => {
        this.jobs.set(data);
        this.jobsLoading.set(false);
      },
      error: () => this.jobsLoading.set(false)
    });
  }

  openJobDetail(job: any) {
    this.selectedJob.set(job);
    this.viewMode.set('detail');
  }

  backToList() {
    this.selectedJob.set(null);
    this.viewMode.set('list');
  }

  backToDetail() {
    this.viewMode.set('detail');
  }

  // 🟢 لو الوظيفة دي من ضمن الـ 9 اللي عندها أسئلة خاصة، نبني الفورم الديناميكية ليها
  // غير كده، نرجع للفورم القديمة كـ fallback عشان أي وظيفة جديدة تتضاف قبل ما نجهزلها أسئلة
  openApplyForm() {
    const job = this.selectedJob();
    const sections = job ? getJobQuestions(job.jobTitle) : null;

    if (sections) {
      this.buildDynamicForm(sections);
      this.viewMode.set('dynamicForm');
    } else {
      this.viewMode.set('form');
    }
  }

  buildDynamicForm(sections: JobSection[]) {
    this.dynamicSections.set(sections);
    const group: { [key: string]: any } = {};

    for (const section of sections) {
      for (const q of section.questions) {
        const validators = q.required === false ? [] : [Validators.required];
        group[q.id] = q.type === 'checkbox'
          ? this.fb.control<string[]>([], validators)
          : this.fb.control('', validators);

        // 🟢 لو السؤال فيه خيار "Other"، بنضيف جنبه خانة نص إضافية - إجبارية بس لو "Other" هو المختار فعلاً
        if (this.hasOtherOption(q)) {
          group[q.id + '_other'] = this.fb.control('');
        }
      }
    }

    this.dynamicForm = this.fb.group(group);

    // 🟢 مراقبة كل سؤال فيه "Other" - أول ما يتحدد، الخانة الإضافية تبقى إجبارية، وأول ما يتشال تتفضى وتبقى اختيارية
    for (const section of sections) {
      for (const q of section.questions) {
        if (!this.hasOtherOption(q)) continue;
        const mainCtrl = this.dynamicForm.get(q.id);
        const otherCtrl = this.dynamicForm.get(q.id + '_other');
        mainCtrl?.valueChanges.subscribe(val => {
          const otherSelected = q.type === 'checkbox' ? (val || []).includes('Other') : val === 'Other';
          if (otherSelected) {
            otherCtrl?.setValidators([Validators.required]);
          } else {
            otherCtrl?.clearValidators();
            otherCtrl?.setValue('');
          }
          otherCtrl?.updateValueAndValidity();
        });
      }
    }
  }

  // 🟢 هل السؤال ده فيه خيار "Other" ضمن اختياراته؟
  hasOtherOption(q: JobQuestion): boolean {
    return (q.options || []).includes('Other');
  }

  // 🟢 هل نظهر خانة "برجاء التوضيح" تحت السؤال ده دلوقتي؟ (يعني هل "Other" هو المختار فعلاً)
  showOtherInput(q: JobQuestion): boolean {
    if (!this.hasOtherOption(q)) return false;
    const val = this.dynamicForm.get(q.id)?.value;
    return q.type === 'checkbox' ? (val || []).includes('Other') : val === 'Other';
  }

  // 🟢 دوال الـ Checkbox الخاصة بالفورم الديناميكية
  toggleDynamicCheckbox(qid: string, option: string) {
    const ctrl = this.dynamicForm.get(qid);
    const current: string[] = ctrl?.value || [];
    const updated = current.includes(option)
      ? current.filter(v => v !== option)
      : [...current, option];
    ctrl?.setValue(updated);
  }

  isDynamicCheckboxSelected(qid: string, option: string): boolean {
    return (this.dynamicForm.get(qid)?.value || []).includes(option);
  }

  isDynamicInvalid(qid: string): boolean {
    const c = this.dynamicForm.get(qid);
    return !!(c?.invalid && c?.touched);
  }

  onDynamicSubmit() {
    if (this.dynamicForm.invalid) {
      this.dynamicForm.markAllAsTouched();
      this.alertService.error('Please fill all required fields.');
      return;
    }

    this.isSubmitting.set(true);
    const sections = this.dynamicSections();

    // 🟢 نجمع كل الإجابات في object واحد { "نص السؤال": "الإجابة" } عشان يتخزن كـ JSON
    // لو "Other" مختارة، بنضيف التفاصيل اللي كتبها جنبها في نفس الإجابة
    const answers: { [label: string]: string } = {};
    if (sections) {
      for (const section of sections) {
        for (const q of section.questions) {
          const val = this.dynamicForm.get(q.id)?.value;
          const otherText = this.hasOtherOption(q) ? (this.dynamicForm.get(q.id + '_other')?.value || '') : '';

          if (q.type === 'checkbox') {
            const list: string[] = val || [];
            const formatted = list.map(v => v === 'Other' && otherText ? `Other (${otherText})` : v);
            answers[q.label] = formatted.join(', ');
          } else {
            answers[q.label] = (val === 'Other' && otherText) ? `Other (${otherText})` : (val || '');
          }
        }
      }
    }

    const formData = new FormData();
    // 🟢 أول 8 أسئلة ثابتة في كل الوظائف (Personal Information) - بنبعتها كحقول منفصلة كمان عشان الأدمن يقدر يفلتر بيها بسهولة
    formData.append('FullName', this.dynamicForm.get('q1')?.value || '');
    formData.append('PhoneNumber', this.dynamicForm.get('q2')?.value || '');
    formData.append('WhatsAppNumber', this.dynamicForm.get('q3')?.value || '');
    formData.append('Email', this.dynamicForm.get('q4')?.value || '');
    formData.append('Age', this.dynamicForm.get('q5')?.value || '');
    formData.append('City', this.dynamicForm.get('q6')?.value || '');
    formData.append('EmploymentStatus', this.dynamicForm.get('q7')?.value || '');
    formData.append('HowHeard', this.dynamicForm.get('q8')?.value || '');
    formData.append('JobTitle', this.selectedJob()?.jobTitle || '');
    formData.append('AnswersJson', JSON.stringify(answers));

    // 🟢 حقول الفورم القديمة مش مستخدمة هنا - بنبعتها فاضية عشان الـ DTO/Backend القديم يقبل الطلب عادي
    formData.append('Address', '');
    formData.append('HasJob', '');
    formData.append('HasLaptop', '');
    formData.append('EnglishLevel', '');
    formData.append('CrmTools', '');
    formData.append('CompanyType', '');
    formData.append('ZoneWorkedOn', '');
    formData.append('ProjectPreparation', '');
    formData.append('VisitSite', '');
    formData.append('DealsClosing', '');
    formData.append('SalesLastQuarter', '');

    if (this.selectedFile()) {
      formData.append('CvFile', this.selectedFile()!);
    }

    this.http.post(`${environment.apiUrl}/jobapplications`, formData).subscribe({
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

  // 🟢 بيحول نص متعدد الأسطر (Key Responsibilities / Qualifications / KPIs) لقائمة نقاط
  toLines(text: string): string[] {
    if (!text) return [];
    return text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  }

  form: FormGroup = this.fb.group({
    fullName:              ['', Validators.required],
    phoneNumber:           ['', Validators.required],
    address:               ['', Validators.required],
    city:                  [''],
    hasJob:                ['', Validators.required],
    hasJobOther:           [''],          // حقل "Other" لـ Currently Employed
    workPlace:             [''],
    hasLaptop:             ['', Validators.required],
    jobTitle:              ['', Validators.required],
    englishLevel:          ['', Validators.required],
    crmTools:              [[], Validators.required],
    crmToolsOther:         [''],          // حقل "Other" لـ CRM Tools
    pastExperiences:       ['', Validators.required],
    realEstateBackground:  ['', Validators.required],
    notes:                 [''],          // Notes - غير required
    companyType:           ['', Validators.required],
    zoneWorkedOn:          ['', Validators.required],
    projectPreparation:    ['', Validators.required],
    visitSite:             ['', Validators.required],
    dealsClosing:          ['', Validators.required],
    salesLastQuarter:      ['', Validators.required],
  });

  crmOptions = ['Odoo', 'Engaz', 'Slack', 'Other'];

  // هل اختار "Other" في Currently Employed؟
  get showHasJobOther(): boolean {
    return this.form.get('hasJob')?.value === 'Other';
  }

  // هل اختار "Other" في CRM Tools؟
  get showCrmOther(): boolean {
    return (this.form.get('crmTools')?.value || []).includes('Other');
  }

  onCrmToggle(tool: string) {
    const current: string[] = this.form.get('crmTools')?.value || [];
    const updated = current.includes(tool)
      ? current.filter(t => t !== tool)
      : [...current, tool];
    this.form.get('crmTools')?.setValue(updated);
    // لو شالوا Other، نمسح الحقل
    if (!updated.includes('Other')) {
      this.form.get('crmToolsOther')?.setValue('');
    }
  }

  isCrmSelected(tool: string): boolean {
    return (this.form.get('crmTools')?.value || []).includes(tool);
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) this.selectedFile.set(file);
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
    formData.append('HasJobOther', f.hasJob === 'Other' ? (f.hasJobOther || '') : '');
    formData.append('WorkPlace', f.workPlace || '');
    formData.append('HasLaptop', f.hasLaptop);
    formData.append('JobTitle', f.jobTitle);
    formData.append('EnglishLevel', f.englishLevel);
    formData.append('CrmTools', (f.crmTools as string[]).join(', '));
    formData.append('CrmToolsOther', (f.crmTools as string[]).includes('Other') ? (f.crmToolsOther || '') : '');
    formData.append('PastExperiences', f.pastExperiences || '');
    formData.append('RealEstateBackground', f.realEstateBackground || '');
    formData.append('Notes', f.notes || '');
    formData.append('CompanyType', f.companyType);
    formData.append('ZoneWorkedOn', f.zoneWorkedOn);
    formData.append('ProjectPreparation', f.projectPreparation);
    formData.append('VisitSite', f.visitSite);
    formData.append('DealsClosing', f.dealsClosing);
    formData.append('SalesLastQuarter', f.salesLastQuarter);

    if (this.selectedFile()) {
      formData.append('CvFile', this.selectedFile()!);
    }

    this.http.post(`${environment.apiUrl}/jobapplications`, formData).subscribe({
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