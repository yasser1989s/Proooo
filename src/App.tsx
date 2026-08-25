import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Route as RouteIcon,
  Map as MapIcon,
  History as HistoryIcon,
  Plus,
  Scan,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { Parcel, DriverState, SmartTourStats } from './types';
import {
  loadParcelsFromStorage,
  saveParcelsToStorage,
  loadDriverStateFromStorage,
  saveDriverStateToStorage,
  INITIAL_DRIVER_STATE,
  INITIAL_SEEDED_PARCELS,
} from './services/storage';
import {
  calculateSmartTourStats,
  optimizeRouteWith2Opt,
  sortParcelsByProximity,
  prioritizeDelayedParcel,
} from './services/routeCalculator';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { RouteView } from './components/RouteView';
import { MapView } from './components/MapView';
import { HistoryView } from './components/HistoryView';
import { AddParcelModal } from './components/AddParcelModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { DeliveryProofModal } from './components/DeliveryProofModal';
import { ParcelDetailModal } from './components/ParcelDetailModal';
import { TourAssistantModal } from './components/TourAssistantModal';

export const App: React.FC = () => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'route' | 'map' | 'history'>('dashboard');

  // Core Data State
  const [parcels, setParcels] = useState<Parcel[]>(() => loadParcelsFromStorage());
  const [driverState, setDriverState] = useState<DriverState>(() => loadDriverStateFromStorage());
  const [searchQuery, setSearchQuery] = useState('');

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'info' | 'warning';
  } | null>(null);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [isTourAssistantOpen, setIsTourAssistantOpen] = useState(false);
  const [detailParcel, setDetailParcel] = useState<Parcel | null>(null);
  const [proofModalState, setProofModalState] = useState<{
    isOpen: boolean;
    parcel: Parcel | null;
    mode: 'photo' | 'signature';
  }>({
    isOpen: false,
    parcel: null,
    mode: 'photo',
  });

  // Calculate live tour statistics and recalculated distances
  const tourStats = useMemo(() => {
    return calculateSmartTourStats(parcels, driverState.currentGps);
  }, [parcels, driverState.currentGps]);

  // Persist Parcels & Driver State automatically
  useEffect(() => {
    saveParcelsToStorage(parcels);
  }, [parcels]);

  useEffect(() => {
    saveDriverStateToStorage(driverState);
  }, [driverState]);

  // Request & Watch Real GPS with fallback
  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setDriverState((prev) => ({
            ...prev,
            currentGps: {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            },
          }));
        },
        (err) => {
          console.log('GPS watchPosition info/fallback:', err.message);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  const showToast = (text: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // ================= ACTION HANDLERS =================

  // 1. Deliver Parcel (Instant 1-Click with GPS & Time Stamp)
  const handleDeliverParcel = (parcel: Parcel) => {
    const updatedParcels = parcels.map((p) => {
      if (p.id === parcel.id) {
        return {
          ...p,
          status: 'delivered' as const,
          deliveryTime: new Date().toISOString(),
        };
      }
      return p;
    });

    // Re-optimize route order of remaining active parcels
    const active = updatedParcels.filter(
      (p) => p.status === 'pending' || p.status === 'in_transit' || p.status === 'reattempt'
    );
    const optimizedActive = optimizeRouteWith2Opt(active, driverState.currentGps);

    // Merge active with completed
    const finalParcels = updatedParcels.map((p) => {
      const matchingActive = optimizedActive.find((o) => o.id === p.id);
      return matchingActive || p;
    });

    setParcels(finalParcels);
    showToast(`✅ Parcel for ${parcel.recipientName} marked as delivered!`, 'success');
  };

  // 2. Mark as Absent / Failed Delivery
  const handleAbsentFailedParcel = (
    parcel: Parcel,
    status: 'absent' | 'failed',
    reason?: string
  ) => {
    const updatedParcels = parcels.map((p) => {
      if (p.id === parcel.id) {
        return {
          ...p,
          status,
          deliveryTime: new Date().toISOString(),
          failureReason: reason || 'Recipient not home',
        };
      }
      return p;
    });

    // Re-index remaining active parcels
    const active = updatedParcels.filter(
      (p) => p.status === 'pending' || p.status === 'in_transit' || p.status === 'reattempt'
    );
    const reordered = active.map((p, idx) => ({ ...p, routeOrder: idx + 1 }));

    const finalParcels = updatedParcels.map((p) => {
      const matching = reordered.find((r) => r.id === p.id);
      return matching || p;
    });

    setParcels(finalParcels);
    showToast(`⚠️ Parcel #${parcel.routeOrder} marked as "${reason || 'Absent'}".`, 'warning');
  };

  // 3. Navigate To Parcel (Google Maps / Apple Maps URL)
  const handleNavigateToParcel = (parcel: Parcel) => {
    if (parcel.lat && parcel.lng) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${parcel.lat},${parcel.lng}&travelmode=driving`;
      window.open(url, '_blank', 'noopener,noreferrer');
      showToast(`🧭 Navigation started to: ${parcel.street} ${parcel.houseNumber}`, 'info');
    } else {
      const encodedAddress = encodeURIComponent(
        `${parcel.street} ${parcel.houseNumber}, ${parcel.postalCode} ${parcel.city}, Germany`
      );
      const url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // 4. Optimize Route (2-Opt TSP Logistics recalculation)
  const handleOptimizeRoute = () => {
    const active = parcels.filter(
      (p) => p.status === 'pending' || p.status === 'in_transit' || p.status === 'reattempt'
    );
    if (active.length < 2) {
      showToast('Tour has fewer than 2 active stops - already optimal!', 'info');
      return;
    }

    const optimized = optimizeRouteWith2Opt(active, driverState.currentGps);
    const updatedParcels = parcels.map((p) => {
      const matching = optimized.find((o) => o.id === p.id);
      return matching || p;
    });

    setParcels(updatedParcels);
    showToast('✨ 2-Opt Tour Optimization applied successfully!', 'success');
  };

  // 5. Sort Route Starting with Nearest Parcel
  const handleSortNearest = () => {
    const active = parcels.filter(
      (p) => p.status === 'pending' || p.status === 'in_transit' || p.status === 'reattempt'
    );
    if (active.length === 0) return;

    const sorted = sortParcelsByProximity(active, driverState.currentGps);
    const updatedParcels = parcels.map((p) => {
      const matching = sorted.find((s) => s.id === p.id);
      return matching || p;
    });

    setParcels(updatedParcels);
    showToast('📍 Route sorted by nearest parcel stops.', 'info');
  };

  // 6. Prioritize Delayed Parcel
  const handlePrioritizeDelayed = (delayedParcel: Parcel) => {
    const active = parcels.filter(
      (p) => p.status === 'pending' || p.status === 'in_transit' || p.status === 'reattempt'
    );
    const prioritized = prioritizeDelayedParcel(active, delayedParcel.id, driverState.currentGps);

    const updatedParcels = parcels.map((p) => {
      const matching = prioritized.find((item) => item.id === p.id);
      return matching || p;
    });

    setParcels(updatedParcels);
    showToast(`⚡ ${delayedParcel.recipientName} prioritized to Stop #1!`, 'warning');
  };

  // 7. Add New Parcels (From AI single, batch, or manual)
  const handleAddParcels = (newParcels: Parcel[]) => {
    const combined = [...parcels, ...newParcels];
    const active = combined.filter(
      (p) => p.status === 'pending' || p.status === 'in_transit' || p.status === 'reattempt'
    );
    const optimized = optimizeRouteWith2Opt(active, driverState.currentGps);

    const finalParcels = combined.map((p) => {
      const matching = optimized.find((o) => o.id === p.id);
      return matching || p;
    });

    setParcels(finalParcels);
    showToast(
      `🎉 ${newParcels.length} parcel${newParcels.length > 1 ? 's' : ''} added to tour!`,
      'success'
    );
  };

  // 8. Save Proof Photo / Signature
  const handleSaveProof = (
    parcelId: string,
    proof: { photo?: string | null; signature?: string | null }
  ) => {
    setParcels((prev) =>
      prev.map((p) => {
        if (p.id === parcelId) {
          return {
            ...p,
            deliveryProofPhoto:
              proof.photo !== undefined ? proof.photo : p.deliveryProofPhoto,
            signatureData:
              proof.signature !== undefined ? proof.signature : p.signatureData,
          };
        }
        return p;
      })
    );
    showToast('📸 Delivery proof saved successfully!', 'success');
  };

  // 9. Reopen / Redeliver Parcel from History
  const handleReopenParcel = (parcel: Parcel) => {
    const updatedParcels = parcels.map((p) => {
      if (p.id === parcel.id) {
        return {
          ...p,
          status: 'pending' as const,
          deliveryTime: undefined,
          failureReason: undefined,
          routeOrder: parcels.filter((x) => x.status === 'pending').length + 1,
        };
      }
      return p;
    });

    setParcels(updatedParcels);
    showToast(`🔄 Parcel #${parcel.trackingNumber} reopened back into active tour.`, 'info');
  };

  // 10. Toggle GPS Simulator / Live Tracking
  const handleToggleGps = () => {
    setDriverState((prev) => {
      const nextStatus =
        prev.gpsStatus === 'fixed'
          ? 'tracking'
          : prev.gpsStatus === 'tracking'
          ? 'simulated'
          : 'fixed';
      
      // If cycling, slightly adjust simulation location for demo realism
      const simulatedLat = 52.5245 + (Math.random() - 0.5) * 0.01;
      const simulatedLng = 13.401 + (Math.random() - 0.5) * 0.01;
      
      return {
        ...prev,
        gpsStatus: nextStatus,
        currentGps: { lat: simulatedLat, lng: simulatedLng },
      };
    });
    showToast('📡 GPS location updated.', 'info');
  };

  // 11. Reset All Data to Standard Demo
  const handleResetData = () => {
    setParcels(INITIAL_SEEDED_PARCELS);
    setDriverState(INITIAL_DRIVER_STATE);
    saveParcelsToStorage(INITIAL_SEEDED_PARCELS);
    saveDriverStateToStorage(INITIAL_DRIVER_STATE);
    showToast('🔄 Tour data reset to standard demo tour!', 'success');
  };

  // Search Filter for Top Bar
  const displayedParcels = useMemo(() => {
    if (!searchQuery.trim()) return parcels;
    const q = searchQuery.toLowerCase();
    return parcels.filter(
      (p) =>
        p.recipientName.toLowerCase().includes(q) ||
        p.street.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.trackingNumber.toLowerCase().includes(q)
    );
  }, [parcels, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white pb-6">
      {/* Top Application Header */}
      <Header
        driverState={driverState}
        tourStats={tourStats}
        onToggleGps={handleToggleGps}
        onOptimizeRoute={handleOptimizeRoute}
        onOpenTourSummary={() => setIsTourAssistantOpen(true)}
        onResetData={handleResetData}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenBarcodeScanner={() => setIsBarcodeModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalParcels={tourStats.totalParcels}
        remainingParcels={tourStats.remainingParcels}
      />

      {/* Main Interactive Screen Content */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-3.5 sm:px-6 pt-3">
        {activeTab === 'dashboard' && (
          <Dashboard
            parcels={displayedParcels}
            tourStats={tourStats}
            driverState={driverState}
            onSelectParcel={(p) => setDetailParcel(p)}
            onDeliverParcel={handleDeliverParcel}
            onNavigateToParcel={handleNavigateToParcel}
            onPrioritizeDelayed={handlePrioritizeDelayed}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onOpenMapView={() => setActiveTab('map')}
            onOpenTourAssistant={() => setIsTourAssistantOpen(true)}
            onOptimizeRoute={handleOptimizeRoute}
          />
        )}

        {activeTab === 'route' && (
          <RouteView
            parcels={displayedParcels}
            driverState={driverState}
            onDeliverParcel={handleDeliverParcel}
            onAbsentFailedParcel={handleAbsentFailedParcel}
            onNavigateToParcel={handleNavigateToParcel}
            onOpenPhotoProof={(p) =>
              setProofModalState({ isOpen: true, parcel: p, mode: 'photo' })
            }
            onOpenSignature={(p) =>
              setProofModalState({ isOpen: true, parcel: p, mode: 'signature' })
            }
            onOpenDetails={(p) => setDetailParcel(p)}
            onOptimizeRoute={handleOptimizeRoute}
            onSortNearest={handleSortNearest}
            onPrioritizeDelayed={handlePrioritizeDelayed}
          />
        )}

        {activeTab === 'map' && (
          <MapView
            parcels={displayedParcels}
            driverState={driverState}
            onSelectParcel={(p) => setDetailParcel(p)}
            onNavigateToParcel={handleNavigateToParcel}
            onDeliverParcel={handleDeliverParcel}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            parcels={displayedParcels}
            onSelectParcel={(p) => setDetailParcel(p)}
            onReopenParcel={handleReopenParcel}
          />
        )}
      </main>

      {/* ================= BOTTOM MOBILE NAVIGATION BAR ================= */}
      <nav
        id="bottom-nav-bar"
        className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/90 px-3 py-1.5 flex items-center justify-around max-w-2xl mx-auto shadow-2xl"
      >
        <button
          onClick={() => setActiveTab('dashboard')}
          id="nav-tab-dashboard"
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all ${
            activeTab === 'dashboard'
              ? 'text-blue-400 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('route')}
          id="nav-tab-route"
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all relative ${
            activeTab === 'route'
              ? 'text-blue-400 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <RouteIcon className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Route</span>
          {tourStats.remainingParcels > 0 && (
            <span className="absolute top-1 right-2 w-4 h-4 rounded-full bg-cyan-500 text-slate-950 font-bold text-[9px] flex items-center justify-center">
              {tourStats.remainingParcels}
            </span>
          )}
        </button>

        {/* Floating Quick Action Add Button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          id="btn-nav-floating-add"
          className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-emerald-400 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 active:scale-95 transition-all -translate-y-2 border-2 border-slate-950"
          title="Add Parcels"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>

        <button
          onClick={() => setActiveTab('map')}
          id="nav-tab-map"
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all ${
            activeTab === 'map'
              ? 'text-blue-400 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MapIcon className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Map</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          id="nav-tab-history"
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all ${
            activeTab === 'history'
              ? 'text-blue-400 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <HistoryIcon className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">History</span>
        </button>
      </nav>

      {/* ================= FLOATING TOAST NOTIFICATION ================= */}
      {toastMessage && (
        <div className="fixed top-16 left-4 right-4 z-50 flex justify-center pointer-events-none animate-in fade-in slide-in-from-top duration-200">
          <div
            className={`px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md border text-xs font-semibold flex items-center gap-2 pointer-events-auto ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200 shadow-emerald-900/30'
                : toastMessage.type === 'warning'
                ? 'bg-amber-950/90 border-amber-500/50 text-amber-200 shadow-amber-900/30'
                : 'bg-blue-950/90 border-blue-500/50 text-blue-200 shadow-blue-900/30'
            }`}
          >
            {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {toastMessage.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
            {toastMessage.type === 'info' && <Info className="w-4 h-4 text-blue-400" />}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* ================= ALL MODAL DIALOGS ================= */}

      {/* 1. Add Parcels AI / Batch Modal */}
      <AddParcelModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddParcels={handleAddParcels}
        currentParcelCount={parcels.length}
      />

      {/* 2. Barcode & QR Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
        parcels={parcels}
        onSelectParcel={(p) => setDetailParcel(p)}
        onOpenAddModal={(code) => {
          setIsAddModalOpen(true);
        }}
      />

      {/* 3. Delivery Proof (Photo / Signature) Modal */}
      <DeliveryProofModal
        isOpen={proofModalState.isOpen}
        onClose={() =>
          setProofModalState({ isOpen: false, parcel: null, mode: 'photo' })
        }
        parcel={proofModalState.parcel}
        initialMode={proofModalState.mode}
        onSaveProof={handleSaveProof}
      />

      {/* 4. Full Parcel Details Modal */}
      <ParcelDetailModal
        parcel={detailParcel}
        isOpen={detailParcel !== null}
        onClose={() => setDetailParcel(null)}
        onNavigateToParcel={handleNavigateToParcel}
        onDeliverParcel={handleDeliverParcel}
        onOpenProofModal={(parcel, mode) => {
          setDetailParcel(null);
          setProofModalState({ isOpen: true, parcel, mode });
        }}
      />

      {/* 5. AI Tour Assistant Modal */}
      <TourAssistantModal
        isOpen={isTourAssistantOpen}
        onClose={() => setIsTourAssistantOpen(false)}
        parcels={parcels}
        tourStats={tourStats}
        driverState={driverState}
        onApplyOptimization={handleOptimizeRoute}
        onPrioritizeDelayed={handlePrioritizeDelayed}
      />
    </div>
  );
};

export default App;
