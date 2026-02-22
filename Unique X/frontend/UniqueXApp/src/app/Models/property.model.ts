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
  brokerId: string;
brokerPropertyCount: number;
hasBalcony: boolean;
isFurnished: boolean;
paymentMethod: string;
installmentYears?: number;
isLicensed: boolean;
hasWaterMeter: boolean;
hasElectricityMeter: boolean;
hasGasMeter: boolean;
hasLandShare: boolean;
code: string;
monthlyRent: number;
downPayment: number;
quarterInstallment: number;
securityDeposit: number;
deliveryStatus: string;
deliveryYear?: number;
commissionPercentage: number;
finishing: string;
projectName?: string;
// بيانات الفيلا والأدوار
  groundRooms: number;
  groundBaths: number;
  groundReception: number;
  
  firstRooms: number;
  firstBaths: number;
  firstReception: number;
  
  secondRooms: number;
  secondBaths: number;
  secondReception: number;

  // أنواع الفيلا والمساحة
  areaType: string;
  villaCategory: string;
  villaSubType: string | null;

  // المميزات الجديدة
  hasPool: boolean;
  hasGarden: boolean;
}

export interface Photo {
  id: number; 
  url: string;
  isMain: boolean;
}