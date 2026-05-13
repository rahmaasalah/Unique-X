import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { CrmService } from '../../../Services/crm.services';
import { AlertService } from '../../../Services/alert';

@Component({
  selector: 'app-campaigns-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './campaigns-manager.html'
})
export class CampaignsManagerComponent implements OnInit {
  private crmService = inject(CrmService);
  private fb = inject(FormBuilder);
  private alertService = inject(AlertService);
  public router = inject(Router);

  campaignsList = signal<any[]>([]);
  campaignForm!: FormGroup;

  ngOnInit() {
    this.campaignForm = this.fb.group({
      name: ['', Validators.required],
      source: ['Facebook Ads', Validators.required]
    });
    this.loadCampaigns();
  }

  loadCampaigns() {
    this.crmService.getCampaigns().subscribe({
      next: (data) => this.campaignsList.set(data),
      error: (err) => console.error('Error fetching campaigns', err)
    });
  }

  onSubmitCampaign() {
    if (this.campaignForm.valid) {
      this.alertService.showLoading('Adding Campaign...');
      this.crmService.createCampaign(this.campaignForm.value).subscribe({
        next: () => {
          this.alertService.close();
          this.alertService.success('Campaign Added Successfully!');
          this.campaignForm.reset({ source: 'Facebook Ads' });
          this.loadCampaigns(); 
        },
        error: () => {
          this.alertService.close();
          this.alertService.error('Error adding campaign');
        }
      });
    }
  }

  onDeleteCampaign(id: number) {
    this.alertService.confirm('Are you sure you want to delete this campaign?', () => {
      this.crmService.deleteCampaign(id).subscribe({
        next: () => this.loadCampaigns(),
        error: () => this.alertService.error('Failed to delete campaign')
      });
    });
  }
}