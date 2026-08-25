import React, { useState, useRef, useEffect } from 'react';
import {
  Scan,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  Plus,
  Camera,
  Navigation,
} from 'lucide-react';
import { Parcel } from '../types';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  parcels: Parcel[];
  onSelectParcel: (parcel: Parcel) => void;
  onOpenAddModal: (prefilledBarcode?: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  parcels,
  onSelectParcel,
  onOpenAddModal,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [matchedParcel, setMatchedParcel] = useState<Parcel | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isScanningActive, setIsScanningActive] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setManualCode('');
      setMatchedParcel(null);
      setHasSearched(false);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }
    } catch (e) {
      console.warn('Camera could not be started for barcode scanner:', e);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  if (!isOpen) return null;

  const handleLookup = (code: string) => {
    const trimmed = code.trim().toLowerCase();
    if (!trimmed) return;

    setHasSearched(true);
    const found = parcels.find(
      (p) =>
        p.trackingNumber.toLowerCase().includes(trimmed) ||
        p.id.toLowerCase().includes(trimmed) ||
        (p.phone && p.phone.includes(trimmed))
    );

    setMatchedParcel(found || null);
  };

  // Simulate instant scan detection for testing
  const handleSimulateScan = (parcel: Parcel) => {
    setManualCode(parcel.trackingNumber);
    setMatchedParcel(parcel);
    setHasSearched(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl space-y-4">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Scan className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">Barcode & QR Scanner</h3>
              <p className="text-xs text-slate-400">Scan tracking numbers or lookup instantly</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Camera Viewfinder with Laser Scanner */}
        <div className="px-4">
          <div className="relative w-full h-52 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover opacity-80"
            />

            {/* Target Reticle */}
            <div className="absolute inset-8 border-2 border-cyan-500/60 rounded-xl pointer-events-none flex flex-col justify-between p-2">
              <div className="flex justify-between">
                <div className="w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
                <div className="w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
              </div>

              {/* Animated Laser Bar */}
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#22d3ee] animate-pulse" />

              <div className="flex justify-between">
                <div className="w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
                <div className="w-4 h-4 border-b-2 border-r-2 border-cyan-400" />
              </div>
            </div>

            <div className="absolute bottom-2 left-0 right-0 text-center text-[11px] text-cyan-300/80 font-mono bg-slate-950/70 py-0.5">
              Camera active • Align barcode / QR code
            </div>
          </div>
        </div>

        {/* Manual Barcode Input & Instant Match */}
        <div className="px-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => {
                  setManualCode(e.target.value);
                  handleLookup(e.target.value);
                }}
                placeholder="Enter tracking number..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-slate-500 font-mono focus:outline-none focus:border-cyan-500"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>

            <button
              onClick={() => handleLookup(manualCode)}
              className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-600/20 active:scale-95"
            >
              Search
            </button>
          </div>

          {/* Quick Demo match buttons */}
          {parcels.length > 0 && !matchedParcel && !hasSearched && (
            <div className="text-[11px] text-slate-400 space-y-1">
              <span>Or pick an existing parcel to test:</span>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {parcels.slice(0, 3).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSimulateScan(p)}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] shrink-0 border border-slate-700"
                  >
                    #{p.routeOrder} {p.recipientName.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Result Outcome */}
          {hasSearched && (
            <div>
              {matchedParcel ? (
                <div className="bg-slate-950 border border-emerald-500/50 rounded-2xl p-3.5 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Parcel found!</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      Stop #{matchedParcel.routeOrder}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white">{matchedParcel.recipientName}</h4>
                    <p className="text-xs text-slate-400">
                      {matchedParcel.street} {matchedParcel.houseNumber}, {matchedParcel.postalCode}{' '}
                      {matchedParcel.city}
                    </p>
                    <span className="font-mono text-[11px] text-cyan-400 mt-0.5 block">
                      📦 {matchedParcel.trackingNumber}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      onSelectParcel(matchedParcel);
                      onClose();
                    }}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-emerald-600/20"
                  >
                    <span>Open Parcel & Actions</span>
                  </button>
                </div>
              ) : (
                <div className="bg-slate-950 border border-amber-500/40 rounded-2xl p-3.5 space-y-2.5 text-center">
                  <p className="text-xs text-amber-300 font-medium">
                    No parcel found with number "{manualCode}" in current tour.
                  </p>
                  <button
                    onClick={() => {
                      onOpenAddModal(manualCode);
                      onClose();
                    }}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create as new parcel</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer padding */}
        <div className="p-2" />
      </div>
    </div>
  );
};
