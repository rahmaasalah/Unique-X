import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; // 👈 استيراد FormsModule مهم للفلاتر
import { CrmService } from '../../../Services/crm.services';
import { AlertService } from '../../../Services/alert';

@Component({
  selector: 'app-broker-profile',
  standalone: true,
  imports:[CommonModule, RouterModule, FormsModule], // 👈 ضفنا FormsModule هنا
  templateUrl: './broker-profile.html',
  styleUrls: ['./broker-profile.css']
})
export class BrokerProfileComponent implements OnInit {
  private crmService = inject(CrmService);
  private alertService = inject(AlertService);

  brokerName = signal<string>('');
  brokerImage = signal<string>('https://cdn-icons-png.flaticon.com/512/149/149071.png');
  
  profileData = signal<any>(null);
  campaignsList = signal<any[]>([]); // 👈 لستة الحملات للفلتر

  // 🟢 الفلاتر
 searchQuery = signal<string>('');
  filterCampaign = signal<string>('');
  filterStage = signal<string>('');
  filterZone = signal<string>('');
  filterCreationDate = signal<string>('');
  filterLastUpdate = signal<string>('');
  filterMinBudget = signal<number | null>(null);
  filterMaxBudget = signal<number | null>(null);

  // 👇 نقلنا تعريف المناطق هنا عشان الـ HTML يقدر يشوفه
  zones =[
    { id: 1, name: 'Cairo' },
    { id: 2, name: 'Alexandria' },
    { id: 3, name: 'North Coast' }
  ];

  // 🟢 فلترة العملاء لحظياً
  filteredLeads = computed(() => {
    const data = this.profileData();
    if (!data || !data.leads) return[];
    let leads = data.leads;

    const q = this.searchQuery().toLowerCase();
    const camp = this.filterCampaign();
    const stage = this.filterStage();
    const zone = this.filterZone(); // شيلنا الـ toLowerCase عشان يطابق الاسم بالظبط
    const cDate = this.filterCreationDate();
    const uDate = this.filterLastUpdate();
    const minB = this.filterMinBudget();
    const maxB = this.filterMaxBudget();

    if (q) leads = leads.filter((l: any) => l.fullName.toLowerCase().includes(q) || l.phoneNumber.includes(q));
    if (camp) leads = leads.filter((l: any) => l.campaignName === camp);
    if (stage) leads = leads.filter((l: any) => l.statusId.toString() === stage);
    if (zone) leads = leads.filter((l: any) => l.zoneName === zone);
    if (cDate) leads = leads.filter((l: any) => new Date(l.createdAt).toISOString().split('T')[0] === cDate);
    if (uDate) leads = leads.filter((l: any) => new Date(l.updatedAt || l.createdAt).toISOString().split('T')[0] === uDate);
    if (minB !== null) leads = leads.filter((l: any) => l.totalAmount >= minB);
    if (maxB !== null) leads = leads.filter((l: any) => l.totalAmount <= maxB);

    return leads;
  });

  ngOnInit() {
    const userString = localStorage.getItem('user');
    if (userString) {
      const user = JSON.parse(userString);
      this.brokerName.set(user.username || 'Broker Profile');
      if (user.profileImageUrl) this.brokerImage.set(user.profileImageUrl);

      const brokerId = user.id || user.userId || '';
      if (brokerId) {
        this.loadProfileData(brokerId);
      }
    }
    
    // تحميل الحملات عشان الفلتر
    this.crmService.getCampaigns().subscribe(data => this.campaignsList.set(data));
  }

  loadProfileData(brokerId: string) {
    this.crmService.getBrokerProfileData(brokerId).subscribe({
      next: (data) => {
        // 👇 نفس الحل لضبط التوقيت في صفحة البروفايل
        if (data && data.leads) {
          data.leads.forEach((lead: any) => {
            if (lead.createdAt && !lead.createdAt.endsWith('Z')) lead.createdAt += 'Z';
            if (lead.updatedAt && !lead.updatedAt.endsWith('Z')) lead.updatedAt += 'Z';
          });
        }
        this.profileData.set(data);
      },
      error: (err) => console.error('Error fetching profile data', err)
    });
  }

  clearFilters() {
    this.searchQuery.set('');
    this.filterCampaign.set('');
    this.filterStage.set('');
    this.filterZone.set('');
    this.filterCreationDate.set('');
    this.filterLastUpdate.set('');
    this.filterMinBudget.set(null);
    this.filterMaxBudget.set(null);
  }

  toggleTask(task: any) {
    task.isDone = !task.isDone; 
    this.crmService.toggleTaskStatus(task.id).subscribe({
      next: () => this.crmService.refreshNavbar$.next(),
      error: () => { task.isDone = !task.isDone; this.alertService.error('Failed to update task status.'); }
    });
  }

  toggleVisit(visit: any) {
    visit.isCompleted = !visit.isCompleted;
    this.crmService.toggleVisitStatus(visit.id).subscribe({
      next: () => this.crmService.refreshNavbar$.next(),
      error: () => { visit.isCompleted = !visit.isCompleted; this.alertService.error('Failed to update visit status.'); }
    });
  }

  deleteVisit(visitId: number) {
    this.alertService.confirm('Delete this scheduled visit?', () => {
      this.alertService.showLoading('Deleting...');
      this.crmService.deleteVisit(visitId).subscribe({
        next: () => {
          this.alertService.close();
          this.alertService.success('Visit deleted.');
          this.crmService.refreshNavbar$.next(); 
          const userString = localStorage.getItem('user');
          if (userString) {
            const brokerId = JSON.parse(userString).id || JSON.parse(userString).userId;
            this.loadProfileData(brokerId);
          }
        },
        error: () => { this.alertService.close(); this.alertService.error('Failed to delete visit.'); }
      });
    });
  }
}