import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PropertyService } from '../../Services/property';
import { AlertService } from '../../Services/alert';
import { Property } from '../../Models/property.model';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-my-properties',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-properties.html'
})
export class MyPropertiesComponent implements OnInit {
  myProperties = signal<Property[]>([]);
  private propertyService = inject(PropertyService);
  private alertService = inject(AlertService);

  ngOnInit(): void {
    this.loadMyProperties();
  }

  loadMyProperties() {
    this.propertyService.getUserProperties().subscribe({
      next: (data) => this.myProperties.set(data),
      error: (err) => console.error(err)
    });
  }

  onDelete(id: number) {
    this.alertService.confirm('Do you really want to delete this property?', () => {
      this.propertyService.deleteProperty(id).subscribe({
        next: () => {
          this.alertService.success('Property deleted successfully');
          this.loadMyProperties(); // إعادة تحميل القائمة بعد الحذف
        },
        error: (err) => this.alertService.error('Failed to delete property')
      });
    });
  }

  onMarkAsSold(id: number) {
  this.propertyService.markAsSold(id).subscribe({
    next: () => {
      // هذه الخطوة هي التي ستغير شكل الزرار فوراً
      this.loadMyProperties(); 
      this.alertService.success('Status updated!');
    }
  });
}
}