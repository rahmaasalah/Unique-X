import { Component, inject, OnInit, signal } from '@angular/core';
import { Property } from '../../Models/property.model';
import { PropertyService } from '../../Services/property';
import { PropertyCardComponent } from "../property-card/property-card";
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-wishlist',
  imports: [PropertyCardComponent, RouterModule, CommonModule],
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.css',
})
export class WishlistComponent implements  OnInit {
  favProperties = signal<Property[]>([]);
  propertyService = inject(PropertyService);

  ngOnInit(): void {
    this.propertyService.getWishlist().subscribe(data => this.favProperties.set(data));
  }
}
