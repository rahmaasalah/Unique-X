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
  createdAt: string;
  photos: Photo[];
  brokerName: string;
  brokerPhone: string;
}

export interface Photo {
  url: string;
  isMain: boolean;
}