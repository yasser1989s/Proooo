import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Navigation,
  Crosshair,
  Layers,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Package,
} from 'lucide-react';
import { Parcel, DriverState } from '../types';

interface MapViewProps {
  parcels: Parcel[];
  driverState: DriverState;
  onSelectParcel: (parcel: Parcel) => void;
  onNavigateToParcel: (parcel: Parcel) => void;
  onDeliverParcel: (parcel: Parcel) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  parcels,
  driverState,
  onSelectParcel,
  onNavigateToParcel,
  onDeliverParcel,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const [selectedMapParcel, setSelectedMapParcel] = useState<Parcel | null>(null);

  const activeParcels = parcels
    .filter((p) => (p.status === 'pending' || p.status === 'in_transit' || p.status === 'reattempt') && p.lat && p.lng)
    .sort((a, b) => a.routeOrder - b.routeOrder);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialLat = driverState.currentGps?.lat ?? 52.52;
    const initialLng = driverState.currentGps?.lng ?? 13.405;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    // Dark tile layer CartoDB Dark Matter / OSM
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        maxZoom: 19,
        subdomains: 'abcd',
      }
    ).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers and Polyline when parcels or driver position change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    // 1. Add Driver Location Marker
    if (driverState.currentGps) {
      const driverIcon = L.divIcon({
        className: 'driver-marker-custom',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="w-8 h-8 rounded-full bg-blue-500/30 animate-ping absolute"></div>
            <div class="w-6 h-6 rounded-full bg-blue-600 border-2 border-white shadow-xl flex items-center justify-center text-white">
              <div class="w-2 h-2 rounded-full bg-white"></div>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const driverMarker = L.marker([driverState.currentGps.lat, driverState.currentGps.lng], {
        icon: driverIcon,
        zIndexOffset: 1000,
      }).bindTooltip('📍 Current Driver Location', {
        permanent: false,
        direction: 'top',
        className: 'bg-slate-900 text-white text-xs border border-slate-700 rounded-lg p-1',
      });

      markersGroup.addLayer(driverMarker);
    }

    // 2. Add Parcel Markers
    const routeCoords: [number, number][] = [];
    if (driverState.currentGps) {
      routeCoords.push([driverState.currentGps.lat, driverState.currentGps.lng]);
    }

    activeParcels.forEach((parcel, idx) => {
      if (!parcel.lat || !parcel.lng) return;

      routeCoords.push([parcel.lat, parcel.lng]);

      const isFirst = idx === 0;
      let bgColor = 'bg-slate-800 text-white border-slate-600';

      if (isFirst) {
        bgColor = 'bg-blue-600 text-white border-white shadow-blue-500/50';
      } else if (parcel.isDelayed) {
        bgColor = 'bg-amber-500 text-slate-950 border-amber-300 font-black';
      }

      const parcelIcon = L.divIcon({
        className: 'parcel-marker-custom',
        html: `
          <div class="cursor-pointer transition-transform hover:scale-110 active:scale-95">
            <div class="w-7 h-7 rounded-full ${bgColor} border-2 shadow-lg flex items-center justify-center text-xs font-bold font-mono">
              ${parcel.routeOrder}
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([parcel.lat, parcel.lng], { icon: parcelIcon });
      marker.on('click', () => {
        setSelectedMapParcel(parcel);
      });

      markersGroup.addLayer(marker);
    });

    // 3. Draw Route Polyline
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
    }

    if (routeCoords.length >= 2) {
      const polyline = L.polyline(routeCoords, {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.8,
        dashArray: '8, 8',
      }).addTo(map);
      polylineRef.current = polyline;
    }
  }, [parcels, driverState.currentGps]);

  // Map Control Actions
  const handleCenterDriver = () => {
    if (mapInstanceRef.current && driverState.currentGps) {
      mapInstanceRef.current.flyTo(
        [driverState.currentGps.lat, driverState.currentGps.lng],
        15,
        { duration: 0.8 }
      );
    }
  };

  const handleFitRoute = () => {
    if (!mapInstanceRef.current) return;
    const allPoints: [number, number][] = [];
    if (driverState.currentGps) {
      allPoints.push([driverState.currentGps.lat, driverState.currentGps.lng]);
    }
    activeParcels.forEach((p) => {
      if (p.lat && p.lng) allPoints.push([p.lat, p.lng]);
    });

    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  return (
    <div className="relative w-full h-[calc(100vh-140px)] min-h-[460px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
      {/* Map Stage Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Map Controls Toolbar */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
        <button
          onClick={handleCenterDriver}
          title="Center driver location"
          className="w-10 h-10 rounded-xl bg-slate-900/95 border border-slate-700 text-blue-400 hover:text-blue-300 hover:bg-slate-800 shadow-xl flex items-center justify-center active:scale-95 transition-all"
        >
          <Crosshair className="w-5 h-5" />
        </button>

        <button
          onClick={handleFitRoute}
          title="Fit full route in view"
          className="w-10 h-10 rounded-xl bg-slate-900/95 border border-slate-700 text-slate-200 hover:bg-slate-800 shadow-xl flex items-center justify-center active:scale-95 transition-all"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <div className="h-px bg-slate-800 my-0.5" />

        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="w-10 h-10 rounded-xl bg-slate-900/95 border border-slate-700 text-slate-200 hover:bg-slate-800 shadow-xl flex items-center justify-center active:scale-95 transition-all"
        >
          <ZoomIn className="w-5 h-5" />
        </button>

        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="w-10 h-10 rounded-xl bg-slate-900/95 border border-slate-700 text-slate-200 hover:bg-slate-800 shadow-xl flex items-center justify-center active:scale-95 transition-all"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
      </div>

      {/* Top Legend Overlay */}
      <div className="absolute top-3 left-3 z-10 bg-slate-950/90 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-xl shadow-lg text-[11px] flex items-center gap-3 font-medium">
        <div className="flex items-center gap-1.5 text-blue-400">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span>Driver</span>
        </div>
        <div className="flex items-center gap-1.5 text-cyan-400">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
          <span>Next Stop</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-300">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
          <span>Pending ({activeParcels.length})</span>
        </div>
      </div>

      {/* Selected Parcel Bottom Floating Card */}
      {selectedMapParcel && (
        <div className="absolute bottom-4 left-4 right-4 z-20 bg-slate-900/95 backdrop-blur-md border border-blue-500/50 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                #{selectedMapParcel.routeOrder}
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-white font-display truncate">
                  {selectedMapParcel.recipientName}
                </h4>
                <p className="text-xs text-slate-300 truncate mt-0.5">
                  {selectedMapParcel.street} {selectedMapParcel.houseNumber},{' '}
                  {selectedMapParcel.city}
                </p>
                <div className="flex items-center gap-2 mt-1.5 text-[11px] font-mono text-cyan-400">
                  <span>📍 {selectedMapParcel.distanceFromDriverKm ?? 0} km</span>
                  <span>•</span>
                  <span>⏱ ~{selectedMapParcel.estimatedDrivingMinutes ?? 3} min</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedMapParcel(null)}
              className="text-slate-400 hover:text-white text-xs px-2 py-1 bg-slate-800 rounded-lg"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-800">
            <button
              onClick={() => onNavigateToParcel(selectedMapParcel)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl active:scale-95 shadow-md shadow-blue-600/20"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Navigate</span>
            </button>

            <button
              onClick={() => {
                onDeliverParcel(selectedMapParcel);
                setSelectedMapParcel(null);
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl active:scale-95 shadow-md shadow-emerald-600/20"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Deliver</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
