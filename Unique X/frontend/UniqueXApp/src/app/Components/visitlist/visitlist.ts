import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PropertyService } from '../../Services/property';
import { PropertyCardComponent } from '../property-card/property-card';

@Component({
  selector: 'app-visit-list',
  standalone: true,
  imports: [CommonModule, RouterModule, PropertyCardComponent],
  templateUrl: './visitlist.html'
})
export class VisitListComponent implements OnInit {
  private propertyService = inject(PropertyService);

  properties = signal<any[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.propertyService.getMyVisitList().subscribe({
      next: (data) => { this.properties.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}