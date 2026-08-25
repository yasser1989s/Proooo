import { Parcel, DriverState, DayTourSummary } from '../types';

const STORAGE_KEY_PARCELS = 'pro_delivery_parcels_v2';
const STORAGE_KEY_DRIVER = 'pro_delivery_driver_v2';
const STORAGE_KEY_HISTORY = 'pro_delivery_tour_history_v2';

// Realistic sample German parcels located in Berlin route for initial state
export const INITIAL_SEEDED_PARCELS: Parcel[] = [
  {
    id: 'pkg-ber-001',
    trackingNumber: '00340434161094043101',
    recipientName: 'Dr. Michael Weber',
    street: 'Torstraße',
    houseNumber: '140',
    postalCode: '10119',
    city: 'Berlin',
    country: 'Deutschland',
    fullAddress: 'Torstraße 140, 10119 Berlin, Deutschland',
    phone: '+49 171 4982103',
    notes: 'Hinterhaus 2. OG rechts, bei Dr. Weber klingeln',
    lat: 52.5302,
    lng: 13.3995,
    geocodingStatus: 'verified',
    status: 'pending',
    deliveryDate: new Date().toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    routeOrder: 1,
    isDelayed: false,
  },
  {
    id: 'pkg-ber-002',
    trackingNumber: '00340434161094043102',
    recipientName: 'Katharina Lindner & Thomas Koch',
    street: 'Kastanienallee',
    houseNumber: '32',
    postalCode: '10435',
    city: 'Berlin',
    country: 'Deutschland',
    fullAddress: 'Kastanienallee 32, 10435 Berlin, Deutschland',
    phone: '+49 176 8920194',
    notes: 'Ablagevertrag: Im Innenhof unter der Treppe wetterfest deponieren',
    lat: 52.5365,
    lng: 13.4087,
    geocodingStatus: 'verified',
    status: 'pending',
    deliveryDate: new Date().toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 3.5 * 3600000).toISOString(),
    routeOrder: 2,
    isDelayed: false,
  },
  {
    id: 'pkg-ber-003',
    trackingNumber: '00340434161094043103',
    recipientName: 'Felix Schneider',
    street: 'Oderberger Str.',
    houseNumber: '18',
    postalCode: '10435',
    city: 'Berlin',
    country: 'Deutschland',
    fullAddress: 'Oderberger Str. 18, 10435 Berlin, Deutschland',
    phone: '+49 152 3490182',
    notes: 'Vorsicht zerbrechlich! Persönliche Übergabe',
    lat: 52.5402,
    lng: 13.4072,
    geocodingStatus: 'verified',
    status: 'pending',
    deliveryDate: new Date().toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 6.5 * 3600000).toISOString(), // Delayed!
    routeOrder: 3,
    isDelayed: true,
  },
  {
    id: 'pkg-ber-004',
    trackingNumber: '00340434161094043104',
    recipientName: 'Architekturbüro Bauer & Partner GmbH',
    street: 'Schönhauser Allee',
    houseNumber: '88',
    postalCode: '10439',
    city: 'Berlin',
    country: 'Deutschland',
    fullAddress: 'Schönhauser Allee 88, 10439 Berlin, Deutschland',
    phone: '+49 30 4492018',
    notes: 'Empfang 1. Stock / Gewerbeeinheit. Unterschrift erforderlich',
    lat: 52.5488,
    lng: 13.4145,
    geocodingStatus: 'verified',
    status: 'pending',
    deliveryDate: new Date().toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 2.8 * 3600000).toISOString(),
    routeOrder: 4,
    isDelayed: false,
  },
  {
    id: 'pkg-ber-005',
    trackingNumber: '00340434161094043105',
    recipientName: 'Sabine Hoffmann',
    street: 'Danziger Str.',
    houseNumber: '55',
    postalCode: '10435',
    city: 'Berlin',
    country: 'Deutschland',
    fullAddress: 'Danziger Str. 55, 10435 Berlin, Deutschland',
    phone: '+49 170 9948123',
    notes: 'Falls nicht da: Nachbar Frau Becker (EG links)',
    lat: 52.5408,
    lng: 13.4215,
    geocodingStatus: 'verified',
    status: 'pending',
    deliveryDate: new Date().toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    routeOrder: 5,
    isDelayed: false,
  },
  {
    id: 'pkg-ber-006',
    trackingNumber: '00340434161094043106',
    recipientName: 'Markus Vogel',
    street: 'Kollwitzstraße',
    houseNumber: '64',
    postalCode: '10435',
    city: 'Berlin',
    country: 'Deutschland',
    fullAddress: 'Kollwitzstraße 64, 10435 Berlin, Deutschland',
    phone: '+49 175 4819204',
    notes: 'Seitenflügel 3. OG',
    lat: 52.5372,
    lng: 13.4178,
    geocodingStatus: 'verified',
    status: 'pending',
    deliveryDate: new Date().toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 1.5 * 3600000).toISOString(),
    routeOrder: 6,
    isDelayed: false,
  },
  // Sample already delivered parcel today
  {
    id: 'pkg-ber-000-prev',
    trackingNumber: '00340434161094043100',
    recipientName: 'Anna Zimmermann',
    street: 'Rosenthaler Str.',
    houseNumber: '40',
    postalCode: '10178',
    city: 'Berlin',
    country: 'Deutschland',
    fullAddress: 'Rosenthaler Str. 40, 10178 Berlin, Deutschland',
    phone: '+49 172 3918290',
    notes: 'Erfolgreich zugestellt an Empfänger persönlich',
    lat: 52.5276,
    lng: 13.4022,
    geocodingStatus: 'verified',
    status: 'delivered',
    deliveryDate: new Date().toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    deliveryTime: new Date(Date.now() - 35 * 60000).toISOString(),
    deliveredAtFormatted: new Date(Date.now() - 35 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    deliveryGps: { lat: 52.5277, lng: 13.4021, accuracy: 5 },
    routeOrder: 0,
    isDelayed: false,
  },
  // Sample historical parcels for 14-day history view
  {
    id: 'pkg-hist-yest-1',
    trackingNumber: '00340434161094042901',
    recipientName: 'Julia Wagner',
    street: 'Friedrichstraße',
    houseNumber: '101',
    postalCode: '10117',
    city: 'Berlin',
    country: 'Deutschland',
    fullAddress: 'Friedrichstraße 101, 10117 Berlin, Deutschland',
    phone: '+49 173 8910291',
    lat: 52.5205,
    lng: 13.3888,
    geocodingStatus: 'verified',
    status: 'delivered',
    deliveryDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 86400000 - 4 * 3600000).toISOString(),
    deliveryTime: new Date(Date.now() - 86400000).toISOString(),
    deliveredAtFormatted: '14:25',
    deliveryGps: { lat: 52.5204, lng: 13.3889, accuracy: 4 },
    routeOrder: 1,
  },
  {
    id: 'pkg-hist-yest-2',
    trackingNumber: '00340434161094042902',
    recipientName: 'Stefan Richter',
    street: 'Leipziger Str.',
    houseNumber: '50',
    postalCode: '10117',
    city: 'Berlin',
    country: 'Deutschland',
    fullAddress: 'Leipziger Str. 50, 10117 Berlin, Deutschland',
    lat: 52.5115,
    lng: 13.3921,
    geocodingStatus: 'verified',
    status: 'absent',
    failureReason: 'Recipient absent. Notification card left in mailbox.',
    deliveryDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 86400000 - 5 * 3600000).toISOString(),
    deliveryTime: new Date(Date.now() - 86400000 + 3600000).toISOString(),
    deliveredAtFormatted: '15:10',
    routeOrder: 2,
  },
];

export const INITIAL_DRIVER_STATE: DriverState = {
  // Default centered in Berlin Mitte start hub
  currentGps: { lat: 52.5245, lng: 13.401 },
  gpsStatus: 'fixed',
  avgDeliverySeconds: 240, // 4 mins initial default
  tourStartTime: new Date(Date.now() - 2 * 3600000).toISOString(),
  tourEnded: false,
};

export const storageService = {
  loadParcels(): Parcel[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PARCELS);
      if (!raw) {
        this.saveParcels(INITIAL_SEEDED_PARCELS);
        return INITIAL_SEEDED_PARCELS;
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        this.saveParcels(INITIAL_SEEDED_PARCELS);
        return INITIAL_SEEDED_PARCELS;
      }
      return parsed;
    } catch (e) {
      console.error('Error loading parcels from storage:', e);
      return INITIAL_SEEDED_PARCELS;
    }
  },

  saveParcels(parcels: Parcel[]) {
    try {
      localStorage.setItem(STORAGE_KEY_PARCELS, JSON.stringify(parcels));
    } catch (e) {
      console.error('Error saving parcels to storage:', e);
    }
  },

  loadDriverState(): DriverState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_DRIVER);
      if (!raw) {
        this.saveDriverState(INITIAL_DRIVER_STATE);
        return INITIAL_DRIVER_STATE;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        return INITIAL_DRIVER_STATE;
      }
      return {
        ...INITIAL_DRIVER_STATE,
        ...parsed,
        currentGps: parsed.currentGps || INITIAL_DRIVER_STATE.currentGps,
        gpsStatus: parsed.gpsStatus || INITIAL_DRIVER_STATE.gpsStatus,
      };
    } catch (e) {
      return INITIAL_DRIVER_STATE;
    }
  },

  saveDriverState(state: DriverState) {
    try {
      localStorage.setItem(STORAGE_KEY_DRIVER, JSON.stringify(state));
    } catch (e) {
      console.error('Error saving driver state:', e);
    }
  },

  loadTourHistory(): DayTourSummary[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (!raw) {
        const dummy: DayTourSummary[] = [
          {
            date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
            totalParcels: 32,
            delivered: 30,
            absent: 2,
            failed: 0,
            totalDistanceKm: 28.4,
            avgDeliveryMinutes: 4.2,
            fastestDeliveryMinutes: 1.8,
            slowestDeliveryMinutes: 9.5,
            startTime: '08:15',
            finishTime: '15:45',
          },
          {
            date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
            totalParcels: 28,
            delivered: 27,
            absent: 1,
            failed: 0,
            totalDistanceKm: 24.1,
            avgDeliveryMinutes: 3.9,
            fastestDeliveryMinutes: 2.0,
            slowestDeliveryMinutes: 8.1,
            startTime: '08:30',
            finishTime: '15:10',
          },
        ];
        this.saveTourHistory(dummy);
        return dummy;
      }
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  },

  saveTourHistory(history: DayTourSummary[]) {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
    } catch (e) {
      console.error('Error saving tour history:', e);
    }
  },

  resetAllData(): Parcel[] {
    this.saveParcels(INITIAL_SEEDED_PARCELS);
    this.saveDriverState(INITIAL_DRIVER_STATE);
    return INITIAL_SEEDED_PARCELS;
  },
};

export const loadParcelsFromStorage = () => storageService.loadParcels();
export const saveParcelsToStorage = (parcels: Parcel[]) => storageService.saveParcels(parcels);
export const loadDriverStateFromStorage = () => storageService.loadDriverState();
export const saveDriverStateToStorage = (state: DriverState) => storageService.saveDriverState(state);
