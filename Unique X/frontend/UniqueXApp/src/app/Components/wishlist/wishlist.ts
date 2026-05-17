import { Component, inject, OnInit, signal } from '@angular/core';
import { Property } from '../../Models/property.model';
import { PropertyService } from '../../Services/property';
import { PropertyCardComponent } from "../property-card/property-card";
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [PropertyCardComponent, RouterModule, CommonModule],
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.css',
})
export class WishlistComponent implements  OnInit {
  favProperties = signal<Property[]>([]);
  propertyService = inject(PropertyService);



  // coding 
/*   projectCodes: [
{ code: 'PHA', name: 'Palm hills Alexandria' },
  { code: 'TO', name: 'The One' },
  { code: 'SL', name: 'Skyline' },
  { code: 'ET', name: 'East towers' },
  { code: 'AW', name: 'Alex west' },
  { code: 'VS', name: 'Valory Smouha' },
  { code: 'VA', name: 'Valory Antoinadis' },
  { code: 'MJ', name: 'Muruj' },
  { code: 'SW', name: 'Sawari' },
  { code: 'JK', name: 'Jackranda' },
  { code: 'VD', name: 'Vida' },
  { code: 'AS', name: 'Alsafwa' },
  { code: 'AH', name: 'Abha hayat' },
  { code: 'GV', name: 'Grand view' },
  { code: 'CT', name: 'Crystal towers' },
  { code: 'TT', name: 'Twin towers' },
  { code: 'VR', name: 'Veranda' },
  { code: 'JR', name: 'Jewar' },
  { code: 'SV', name: 'Soly vie' },
  { code: 'SSR', name: 'San Stefano royals' },
  { code: 'CP', name: 'Cleopatra plaza' },
  { code: 'MZ', name: 'Malaaz' },
{ code: 'SMG', name: 'Smoha Gate' },
]

governateCodes: [
  {code: 'A', name: 'Alexandria'},
  {code: 'C', name: 'Cairo'},
  {code: 'N', name: 'North Coast'},
]

listingTypeCodes: [
  {code: 'P', name: 'Primary'},
  {code: 'R', name: 'Resale'},
  {code: 'RP', name: 'Resale Project'},
  {code: 'T', name: 'Rent'},
]
propertyTypeCodes: [
  {code: 'A', name: 'Apartment'},
  {code: 'V', name: 'Villa'},
  {code: 'S', name: 'Shop'},
  {code: 'O', name: 'Office'},
  {code: 'CH', name: 'Chalet'},
  {code: 'F', name: 'Full Floor'},
]

resaleProjectCodes: [
  {code: '1', name: 'Sawari'},
  {code: '2', name: 'Muruj'},
  {code: '3', name: 'Palm hills'},
  {code: '4', name: 'The one'},
  {code: '5', name: 'Alex west'},
  {code: '6', name: 'Skyline'},
  {code: '7', name: 'Grandview'},
  {code: '8', name: 'Antoniades City'},
  {code: '9', name: 'Valory Antoniades'},
  {code: '10', name: 'Valory Smoha'},
  {code: '11', name: 'Jewar'},
  {code: '12', name: 'Crystal Towers'},
  {code: '13', name: 'Twin Towers'},
  {code: '14', name: 'East Towers'},
  {code: '15', name: 'Saraya Gardens'},
  {code: '16', name: 'Veranda'},
  {code: '17', name: 'Jackranda'},
  {code: '18', name: 'Oria City'},
  {code: '19', name: 'Elite City'},
  {code: '20', name: 'Vida'},
  {code: '21', name: 'Abha Hayat'},
  {code: '22', name: 'Ouruba Royals'},
  {code: '23', name: 'Soly Vie'},
  {code: '24', name: 'San Stefano Royals'},
  {code: '25', name: 'Malaaz'},
  {code: '26', name: 'Smouha Gate'},
]


resaleZoneCodes: [
  {code: '1', name: 'Abu Qir'},
  {code: '2', name: 'Al-Maamoura'},
  {code: '4', name: 'Al-zawaida'},
  {code: '5', name: 'Khurshid'},
  {code: '6', name: 'Al-Maraghi'},
  {code: '7', name: 'Bahary'},
  {code: '8', name: 'El-Mandara-kebly'},
  {code: '9', name: 'Al-Manshiyya'},
  {code: '11', name: 'Bashair al-khayr'},
  {code: '13', name: 'Al-Agamy'},
  {code: '14', name: 'Al-Baytash'},
  {code: '15', name: 'Al-Hanovil'},
  {code: '16', name: 'Al-Dakhila'},
  {code: '17', name: 'هنقرر'},
  {code: '20', name: 'Al-Amiriya'},
  {code: '21', name: 'Borj Al-Arab'},
  {code: '23', name: 'Sidi Bishr'},
  {code: '24', name: 'Al-Aasafirah-45'},
  {code: '25', name: 'Al-Aasafirah-bahary'},
  {code: '26', name: 'Al-Aasafirah-30'},
  {code: '32', name: 'Janaklis'},
  {code: '33', name: 'San Stefano'},
  {code: '34', name: 'Fleming'},
  {code: '35', name: 'Shods'},
  {code: '39', name: 'Al-Suyuf'},
  {code: '40', name: 'Bakus'},
  {code: '41', name: 'Bolkley'},
  {code: '42', name: 'Roshdy'},
  {code: '43', name: 'Zizinia'},
  {code: '45', name: 'Kafr Abdo'},
  {code: '46', name: 'Cleopatra'},
  {code: '47', name: 'Sporting'},
  {code: '48', name: 'Sidi Gaber'},
  {code: '49', name: 'Camp Schésar'},
  {code: '50', name: 'Al-Shatibi'},
  {code: '51', name: 'Al-Azariṭa'},
  {code: '52', name: 'Mahattah al-raml'},
  {code: '53', name: 'Al-Saraya'},
  {code: '56', name: 'Muharram Bik'},
  {code: '57', name: 'Al-Hadra'},
  {code: '59', name: 'Miamy'},
  {code: '60', name: 'Abo solaiman'},
  {code: '61', name: 'Falaky'},
  {code: '62', name: 'Al-Aasafirah-kebly'},
  {code: '63', name: 'Smouha'},
  {code: '64', name: 'لسه هنقرر'},
  {code: '66', name: 'Mahattat Misr'},
  {code: '67', name: 'Al-Ibrahimiya'},
  {code: '68', name: 'Moustafa Kamel'},
  {code: '69', name: 'Loran'},
  {code: '70', name: 'Al-luban'},
  {code: '71', name: 'Victoria'},
  {code: '72', name: 'Gliem'},
  {code: '73', name: 'Wabur al-miyah'},
  {code: '74', name: 'Karmouz'},
  {code: '76', name: 'Stanly'},
  {code: '77', name: 'Al-Aawaid'},
  {code: '78', name: 'لسه هنقرر'},
  {code: '79', name: 'Hajar al-nawatih'},
  {code: '80', name: 'Al-Montaza'},
  {code: '81', name: 'Al-Hedaya'},
  {code: '82', name: 'Wenget'},
  {code: '83', name: 'لسه هنقرر'},
  {code: '84', name: 'Abis'},
  {code: '85', name: 'Al-Hurriya'},
  {code: '86', name: 'Sultan Hussein'},
  {code: '87', name: 'Kubri al-namus'},
  {code: '88', name: 'Mohammed Naguib'},
  {code: '90', name: 'Al-Mahmoudia'},
  {code: '91', name: 'Saba Basha'},
  {code: '92', name: 'El-Mandara-bahary'},
  {code: '93', name: 'لسه هنقرر'},
  {code: '94', name: 'Tharwat'}, 
  {code: '95', name: 'Elshalalat'},
  {code: '96', name: 'Green Plaza'},
  {code: '97', name: 'King Mariout'},
]

 */
  ngOnInit(): void {
    this.propertyService.getWishlist().subscribe(data => this.favProperties.set(data));
  }
}
