import { GeocodingStatus } from '../types';

export interface GeocodeResult {
  lat: number | null;
  lng: number | null;
  geocodingStatus: GeocodingStatus;
  displayName?: string;
  error?: string;
}

export async function geocodeGermanAddress(
  street: string,
  houseNumber: string,
  postalCode: string,
  city: string,
  country: string = 'Deutschland'
): Promise<GeocodeResult> {
  try {
    const response = await fetch('/api/geocode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        street: street.trim(),
        houseNumber: houseNumber.trim(),
        postalCode: postalCode.trim(),
        city: city.trim(),
        country: country.trim() || 'Deutschland',
      }),
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = await response.json();

    if (data.success && data.lat && data.lng) {
      // Validate German bounding box (Latitude 47.0 to 55.2, Longitude 5.8 to 15.2)
      if (data.lat >= 47.0 && data.lat <= 55.2 && data.lng >= 5.8 && data.lng <= 15.2) {
        return {
          lat: data.lat,
          lng: data.lng,
          geocodingStatus: data.geocodingStatus || 'verified',
          displayName: data.displayName,
        };
      }
    }

    return {
      lat: null,
      lng: null,
      geocodingStatus: 'failed',
      error: data.error || 'Adresse in Deutschland nicht eindeutig gefunden.',
    };
  } catch (err: any) {
    console.warn('Geocoding request error:', err);
    return {
      lat: null,
      lng: null,
      geocodingStatus: 'failed',
      error: 'Geokodierung fehlgeschlagen. Bitte Internetverbindung prüfen.',
    };
  }
}
