import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PropertyService } from '../../Services/property';
import { Property } from '../../Models/property.model';

@Component({
  selector: 'app-property-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './property-details.html',
  styleUrl: './property-details.css'
})
export class PropertyDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private propertyService = inject(PropertyService);
  
  property = signal<Property | null>(null);

  ngOnInit(): void {
    // الحصول على الـ ID من الرابط
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.propertyService.getPropertyById(id).subscribe({
        next: (data) => this.property.set(data),
        error: (err) => console.error(err)

        
      });
    }
    
  }

  
}