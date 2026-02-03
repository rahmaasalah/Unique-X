import { Component, Input } from '@angular/core'; // تأكدي من وجود Input
import { CommonModule } from '@angular/common'; // مهم لاستخدام الـ Pipes مثل | number
import { Property } from '../../Models/property.model';
import { RouterModule } from '@angular/router'; // مهم لاستخدام [routerLink]

@Component({
  selector: 'app-property-card',
  standalone: true,
  imports: [CommonModule, RouterModule], // أضفنا CommonModule و RouterModule هنا
  templateUrl: './property-card.html',
  styleUrl: './property-card.css'
})
export class PropertyCardComponent {
  // حل مشكلة Can't bind to 'property'
  @Input() property!: Property; 
}