import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PropertyService } from '../../Services/property';
import { Property } from '../../Models/property.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-compare-properties',
  standalone: true,
  imports:[CommonModule, RouterModule],
  templateUrl: './compare-properties.html',
  styleUrl: './compare-properties.css'
})
export class ComparePropertiesComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private propertyService = inject(PropertyService);

  prop1 = signal<Property | null>(null);
  prop2 = signal<Property | null>(null);
  isLoading = signal<boolean>(true);

  ngOnInit(): void {
    // جلب الـ IDs من الرابط /compare/:id1/:id2
    const id1 = Number(this.route.snapshot.paramMap.get('id1'));
    const id2 = Number(this.route.snapshot.paramMap.get('id2'));

    if (id1 && id2) {
      // 🟢 جلب بيانات العقارين في نفس اللحظة
      forkJoin({
        p1: this.propertyService.getPropertyById(id1),
        p2: this.propertyService.getPropertyById(id2)
      }).subscribe({
        next: (result: any) => {
          this.prop1.set(result.p1);
          this.prop2.set(result.p2);
          this.isLoading.set(false);
          // مسح الذاكرة عشان يقدر يقارن حاجة تانية بعدين
          localStorage.removeItem('compare_prop_1');
        },
        error: (err) => {
          console.error(err);
          this.isLoading.set(false);
        }
      });
    } else {
      this.router.navigate(['/home']);
    }
  }
}