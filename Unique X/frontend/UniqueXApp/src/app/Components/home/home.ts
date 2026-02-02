import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common'; // مهم جداً للأوامر مثل *ngIf
import { PropertyCardComponent } from '../property-card/property-card'; // مهم لكي يتعرف على الكارت
import { PropertyService } from '../../Services/property';
import { Property } from '../../Models/property.model';

@Component({
  selector: 'app-home',
  standalone: true,
  // أضفنا PropertyCardComponent و CommonModule هنا
  imports: [CommonModule, PropertyCardComponent], 
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent implements OnInit {
  properties = signal<Property[]>([]); 
  message = signal<string>('');
  constructor(private propertyService: PropertyService) {}

  ngOnInit(): void {
    this.loadProperties();
  }

  loadProperties() {
    this.propertyService.getProperties().subscribe({
      next: (response: any) => {
        // فحص الرد إذا كان يحتوي على رسالة أو داتا مباشرة
        if (response.message) {
          this.message.set(response.message);
          this.properties.set([]);
        } else {
          this.properties.set(response);
          this.message.set('');
        }
      },
      error: (err) => console.error(err)
    });
  }
}