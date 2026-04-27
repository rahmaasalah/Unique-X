import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CrmService } from '../../../Services/crm.services';
import { AlertService } from '../../../Services/alert';

@Component({
  selector: 'app-broker-profile',
  standalone: true,
  imports:[CommonModule, RouterModule],
  templateUrl: './broker-profile.html',
  styleUrls: ['./broker-profile.css']
})
export class BrokerProfileComponent implements OnInit {
  private crmService = inject(CrmService);
  private alertService = inject(AlertService);

  brokerName = signal<string>('');
  brokerImage = signal<string>('https://cdn-icons-png.flaticon.com/512/149/149071.png');
  
  profileData = signal<any>(null);

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
  }

  loadProfileData(brokerId: string) {
    this.crmService.getBrokerProfileData(brokerId).subscribe({
      next: (data) => this.profileData.set(data),
      error: (err) => console.error('Error fetching profile data', err)
    });
  }

 toggleTask(task: any) {
    // 1. التحديث الوهمي السريع (عشان عين المستخدم تشوف الزرار بيتغير في ثانية)
    task.isDone = !task.isDone; 

    // 2. نبعت للباك إند يحفظ
    this.crmService.toggleTaskStatus(task.id).subscribe({
      next: () => {
        // 3. بنضرب جرس للناف بار عشان يقلل أو يزود الرقم أوتوماتيك
        this.crmService.refreshNavbar$.next(); 
      },
      error: () => {
        // لو حصل مشكلة نرجع الزرار زي ما كان
        task.isDone = !task.isDone; 
        this.alertService.error('Failed to update task status.');
      }
    });
  }

  toggleVisit(visit: any) {
    visit.isCompleted = !visit.isCompleted; // تغيير وهمي سريع للعين
    this.crmService.toggleVisitStatus(visit.id).subscribe({
      next: () => {
        this.crmService.refreshNavbar$.next(); // 👈 نحدث الجرس فوق
      },
      error: () => {
        visit.isCompleted = !visit.isCompleted; // نرجعها لو حصل إيرور
        this.alertService.error('Failed to update visit status.');
      }
    });
  }

  deleteVisit(visitId: number) {
    this.alertService.confirm('Delete this scheduled visit?', () => {
      this.alertService.showLoading('Deleting...');
      this.crmService.deleteVisit(visitId).subscribe({
        next: () => {
          this.alertService.close();
          this.alertService.success('Visit deleted.');
          this.crmService.refreshNavbar$.next(); // 👈 نحدث الجرس فوق عشان لو الزيارة كانت مسمعة فيه
          
          // نحدث الداتا بتاعة البروفايل
          const userString = localStorage.getItem('user');
          if (userString) {
            const brokerId = JSON.parse(userString).id || JSON.parse(userString).userId;
            this.loadProfileData(brokerId);
          }
        },
        error: () => {
          this.alertService.close();
          this.alertService.error('Failed to delete visit.');
        }
      });
    });
  }
}