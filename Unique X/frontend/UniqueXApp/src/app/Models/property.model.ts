export interface Property {
  id: number;
  title: string;
  description: string;
  price: number;
  area: number;
  rooms: number;
  bathrooms: number;
  city: string;
  region: string;
  address: string;
  listingType: string;
  propertyType: string;
  isFavorite: boolean;
  isSold: boolean;
   distanceFromLandmark: string;
  hasMasterRoom: boolean;
  receptionPieces: number;
  view: string;
  floor: number;
  totalFloors: number;
  apartmentsPerFloor: number;
  elevatorsCount: number;
  buildYear: number;
  hasHotelEntrance: boolean;
  hasSecurity: boolean;
  isFirstOwner: boolean;
  isLegalReconciled: boolean;
  hasParking: boolean;
  createdAt: string;
  photos: Photo[];
  brokerName: string;
  brokerPhone: string;
}

export interface Photo {
  id: number; 
  url: string;
  isMain: boolean;
}