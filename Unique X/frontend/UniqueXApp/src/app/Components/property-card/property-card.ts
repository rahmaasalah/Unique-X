import { Component, Input, inject } from '@angular/core'; // تأكدي من وجود Input
import { CommonModule } from '@angular/common'; // مهم لاستخدام الـ Pipes مثل | number
import { Property } from '../../Models/property.model';
import { RouterModule } from '@angular/router'; 
import { PropertyService } from '../../Services/property';
import { AlertService } from '../../Services/alert';
import { Router } from '@angular/router';
import { AuthService } from '../../Services/auth';

@Component({
  selector: 'app-property-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './property-card.html',
  styleUrl: './property-card.css'
})
export class PropertyCardComponent {
  @Input() property!: Property;
  isLiked: boolean = false; 
  private propertyService = inject(PropertyService);
  private alertService = inject(AlertService);
  public authService = inject(AuthService); 
  private router = inject(Router);


   ngOnInit() {
  this.isLiked = this.property.isFavorite;
  if (this.router.url.includes('wishlist')) {
    this.isLiked = true;
  }
}

onToggleWishlist(event: Event) {
  event.stopPropagation();
  
  this.propertyService.toggleWishlist(this.property.id).subscribe({
      next: (res: any) => {
        this.isLiked = res.isFavorite; 
        
        this.property.isFavorite = res.isFavorite;
      },
      error: (err) => {
        console.error('Login required or server error');
      }
    });
  }
}