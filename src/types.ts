export type ParcelStatus =
  | 'pending'
  | 'in_transit'
  | 'delivered'
  | 'absent'
  | 'failed'
  | 'reattempt';

export type GeocodingStatus = 'verified' | 'approximate' | 'failed' | 'manual';

export interface Parcel {
  id: string;
  trackingNumber: string;
  recipientName: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  country: string;
  fullAddress: string;
  phone?: string | null;
  notes?: string | null;
  
  // Geolocation
  lat: number | null;
  lng: number | null;
  geocodingStatus: GeocodingStatus;
  
  // Logistics & Status
  status: ParcelStatus;
  deliveryDate: string; // YYYY-MM-DD
  createdAt: string;    // ISO string
  deliveryTime?: string | null; // ISO string
  deliveredAtFormatted?: string | null;
  
  // Proof of Delivery
  deliveryProofPhoto?: string | null; // Base64 data URL
  signatureData?: string | null;      // Base64 PNG data URL
  deliveryGps?: {
    lat: number;
    lng: number;
    accuracy?: number;
  } | null;
  deliveryNote?: string | null;
  failureReason?: string | null;
  
  // Routing metrics
  routeOrder: number;
  distanceFromDriverKm?: number;
  distanceFromPrevKm?: number;
  estimatedDrivingMinutes?: number;
  isDelayed?: boolean;
  
  // Source info
  sourceImageThumbnail?: string | null;
  scannedBarcode?: string | null;
}

export interface DriverState {
  currentGps: { lat: number; lng: number } | null;
  gpsStatus: 'tracking' | 'fixed' | 'denied' | 'simulated';
  avgDeliverySeconds: number;
  tourStartTime: string | null;
  tourEnded: boolean;
}

export interface SmartTourStats {
  totalParcels: number;
  deliveredParcels: number;
  remainingParcels: number;
  absentFailedParcels: number;
  totalRemainingDistanceKm: number;
  totalRouteDistanceKm: number;
  avgDeliveryMinutes: number;
  estimatedFinishTime: string | null;
  progressPercentage: number;
  nextBestParcel: Parcel | null;
}

export interface DayTourSummary {
  date: string;
  totalParcels: number;
  delivered: number;
  absent: number;
  failed: number;
  totalDistanceKm: number;
  avgDeliveryMinutes: number;
  fastestDeliveryMinutes: number;
  slowestDeliveryMinutes: number;
  startTime: string;
  finishTime: string;
}

export type ActiveTab = 'route' | 'today' | 'all' | 'history' | 'map' | 'tour';
