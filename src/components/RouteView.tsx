import React, { useState } from 'react';
import {
  Navigation,
  Phone,
  MessageSquare,
  FileText,
  Camera,
  PenTool,
  CheckCircle2,
  AlertOctagon,
  MoreVertical,
  Sparkles,
  MapPin,
  Clock,
  ArrowDown,
  AlertTriangle,
  Info,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { Parcel, DriverState } from '../types';

interface RouteViewProps {
  parcels: Parcel[];
  driverState: DriverState;
  onDeliverParcel: (parcel: Parcel) => void;
  onAbsentFailedParcel: (parcel: Parcel, status: 'absent' | 'failed', reason?: string) => void;
  onNavigateToParcel: (parcel: Parcel) => void;
  onOpenPhotoProof: (parcel: Parcel) => void;
  onOpenSignature: (parcel: Parcel) => void;
  onOpenDetails: (parcel: Parcel) => void;
  onOptimizeRoute: () => void;
  onSortNearest: () => void;
  onPrioritizeDelayed: (parcel: Parcel) => void;
}

export const RouteView: React.FC<RouteViewProps> = ({
  parcels,
  driverState,
  onDeliverParcel,
  onAbsentFailedParcel,
  onNavigateToParcel,
  onOpenPhotoProof,
  onOpenSignature,
  onOpenDetails,
  onOptimizeRoute,
  onSortNearest,
  onPrioritizeDelayed,
}) => {
  const [absentModalParcel, setAbsentModalParcel] = useState<Parcel | null>(null);
  const [failureReason, setFailureReason] = useState<string>('Recipient not home');
  const [noteEditParcel, setNoteEditParcel] = useState<Parcel | null>(null);
  const [customNote, setCustomNote] = useState<string>('');

  const activeParcels = parcels
    .filter((p) => p.status === 'pending' || p.status === 'in_transit' || p.status === 'reattempt')
    .sort((a, b) => a.routeOrder - b.routeOrder);

  const handleOpenAbsentModal = (parcel: Parcel) => {
    setAbsentModalParcel(parcel);
    setFailureReason('Recipient not home (Card left)');
  };

  const handleConfirmAbsent = (status: 'absent' | 'failed') => {
    if (absentModalParcel) {
      onAbsentFailedParcel(absentModalParcel, status, failureReason);
      setAbsentModalParcel(null);
    }
  };

  return (
    <div className="space-y-4 pb-28">
      {/* Route Action Controls Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-md flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-slate-300 font-display">Route:</span>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
            {activeParcels.length} stops
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Nearest Parcel */}
          <button
            onClick={onSortNearest}
            id="btn-route-nearest"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 active:scale-95 text-xs font-semibold transition-all"
          >
            <Compass className="w-3.5 h-3.5 text-blue-400" />
            <span>Nearest Parcel</span>
          </button>

          {/* Optimize Route 2-Opt */}
          <button
            onClick={onOptimizeRoute}
            id="btn-route-optimize"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-500 hover:to-cyan-500 active:scale-95 text-xs font-bold shadow-md shadow-blue-600/20 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Optimize Route</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {activeParcels.length === 0 && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white font-display">No open deliveries</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            All parcels have been successfully delivered or processed. Add new parcels with AI camera or check the history tab.
          </p>
        </div>
      )}

      {/* Delivery Cards Sequence */}
      <div className="space-y-3.5">
        {activeParcels.map((parcel, index) => {
          const isFirst = index === 0;
          const prevParcel = index > 0 ? activeParcels[index - 1] : null;

          return (
            <div key={parcel.id} className="relative">
              {/* Route Connecting Step Distance Indicator */}
              {index > 0 && (
                <div className="flex items-center justify-center my-1.5 text-[11px] font-mono text-slate-400">
                  <div className="h-4 w-px bg-slate-800 absolute -top-3 left-7" />
                  <span className="bg-slate-950/80 px-2 py-0.5 rounded-md border border-slate-800 text-[10px] text-slate-400 flex items-center gap-1">
                    <ArrowDown className="w-3 h-3 text-cyan-400" />
                    <span>
                      {parcel.distanceFromPrevKm ?? 0} km from Stop #{index} • ~
                      {parcel.estimatedDrivingMinutes ?? 2} min
                    </span>
                  </span>
                </div>
              )}

              {/* Main Parcel Card */}
              <div
                id={`card-parcel-${parcel.id}`}
                className={`bg-slate-900/95 border rounded-2xl p-4 shadow-lg transition-all ${
                  isFirst
                    ? 'border-blue-500/60 shadow-blue-900/20 ring-1 ring-blue-500/30'
                    : parcel.isDelayed
                    ? 'border-amber-500/50 bg-amber-950/10'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header: Stop Number + Recipient + Badges */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-md ${
                        isFirst
                          ? 'bg-blue-600 text-white shadow-blue-600/30'
                          : parcel.isDelayed
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 text-slate-200 border border-slate-700'
                      }`}
                    >
                      #{parcel.routeOrder}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-white font-display truncate">
                          {parcel.recipientName}
                        </h4>
                        {isFirst && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            NEXT STOP
                          </span>
                        )}
                        {parcel.isDelayed && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                            ⚠️ DELAYED
                          </span>
                        )}
                      </div>

                      {/* Address */}
                      <div className="flex items-center gap-1 text-xs text-slate-300 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium">
                          {parcel.street} {parcel.houseNumber}, {parcel.postalCode} {parcel.city}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Distance pill & more details */}
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700/80">
                      {isFirst
                        ? `${parcel.distanceFromDriverKm ?? 0} km`
                        : `${parcel.distanceFromPrevKm ?? 0} km`}
                    </span>
                    <button
                      onClick={() => onOpenDetails(parcel)}
                      className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
                      title="All details"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Tracking & Notes row */}
                <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
                  <span className="font-mono truncate">
                    📦 {parcel.trackingNumber}
                  </span>
                  {parcel.geocodingStatus === 'verified' && (
                    <span className="flex items-center gap-1 text-emerald-400 text-[10px] shrink-0">
                      <ShieldCheck className="w-3 h-3" />
                      <span>GPS verified</span>
                    </span>
                  )}
                  {parcel.geocodingStatus === 'failed' && (
                    <span className="flex items-center gap-1 text-amber-400 text-[10px] shrink-0">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Check address</span>
                    </span>
                  )}
                </div>

                {/* Delivery Notes badge */}
                {parcel.notes && (
                  <div className="mt-2 p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-amber-200/90 flex items-start gap-1.5">
                    <span className="font-bold shrink-0">Note:</span>
                    <span className="line-clamp-2">{parcel.notes}</span>
                  </div>
                )}

                {/* Proof Thumbnails preview if recorded */}
                {(parcel.deliveryProofPhoto || parcel.signatureData) && (
                  <div className="mt-2 flex items-center gap-2">
                    {parcel.deliveryProofPhoto && (
                      <div
                        onClick={() => onOpenPhotoProof(parcel)}
                        className="cursor-pointer flex items-center gap-1 px-2 py-1 rounded bg-slate-800 text-[10px] text-cyan-300 border border-slate-700"
                      >
                        <Camera className="w-3 h-3" />
                        <span>Photo attached</span>
                      </div>
                    )}
                    {parcel.signatureData && (
                      <div
                        onClick={() => onOpenSignature(parcel)}
                        className="cursor-pointer flex items-center gap-1 px-2 py-1 rounded bg-slate-800 text-[10px] text-emerald-300 border border-slate-700"
                      >
                        <PenTool className="w-3 h-3" />
                        <span>Signature captured</span>
                      </div>
                    )}
                  </div>
                )}

                {/* ALL BUTTONS (Every card has working functional event handlers) */}
                <div className="mt-3.5 pt-3 border-t border-slate-800/80 space-y-2">
                  {/* Primary Action Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Navigate Button */}
                    <button
                      onClick={() => onNavigateToParcel(parcel)}
                      id={`btn-nav-${parcel.id}`}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Navigate</span>
                    </button>

                    {/* Deliver Button */}
                    <button
                      onClick={() => onDeliverParcel(parcel)}
                      id={`btn-deliver-${parcel.id}`}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Deliver</span>
                    </button>
                  </div>

                  {/* Secondary Action Toolstrip */}
                  <div className="grid grid-cols-5 gap-1.5 text-slate-300 text-xs">
                    {/* Call */}
                    <a
                      href={parcel.phone ? `tel:${parcel.phone}` : undefined}
                      onClick={(e) => {
                        if (!parcel.phone) {
                          e.preventDefault();
                          alert(`No phone number available for ${parcel.recipientName}.`);
                        }
                      }}
                      id={`btn-call-${parcel.id}`}
                      className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl border text-[10px] font-medium transition-all ${
                        parcel.phone
                          ? 'bg-slate-800/90 border-slate-700 text-slate-200 hover:bg-slate-700 active:scale-95'
                          : 'bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed'
                      }`}
                      title={parcel.phone ? `Call: ${parcel.phone}` : 'No phone'}
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Call</span>
                    </a>

                    {/* WhatsApp */}
                    <a
                      href={
                        parcel.phone
                          ? `https://wa.me/${parcel.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                              `Hello ${parcel.recipientName}, your delivery driver from Pro Delivery is arriving shortly with your parcel (${parcel.trackingNumber}).`
                            )}`
                          : undefined
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        if (!parcel.phone) {
                          e.preventDefault();
                          alert('No phone number available for WhatsApp.');
                        }
                      }}
                      id={`btn-wa-${parcel.id}`}
                      className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl border text-[10px] font-medium transition-all ${
                        parcel.phone
                          ? 'bg-slate-800/90 border-slate-700 text-slate-200 hover:bg-slate-700 active:scale-95'
                          : 'bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed'
                      }`}
                      title="WhatsApp message"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                      <span>WhatsApp</span>
                    </a>

                    {/* Delivery Photo */}
                    <button
                      onClick={() => onOpenPhotoProof(parcel)}
                      id={`btn-photo-${parcel.id}`}
                      className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-200 hover:bg-slate-700 active:scale-95 text-[10px] font-medium transition-all"
                      title="Capture delivery photo"
                    >
                      <Camera className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Photo</span>
                    </button>

                    {/* Signature */}
                    <button
                      onClick={() => onOpenSignature(parcel)}
                      id={`btn-sig-${parcel.id}`}
                      className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-200 hover:bg-slate-700 active:scale-95 text-[10px] font-medium transition-all"
                      title="Collect signature"
                    >
                      <PenTool className="w-3.5 h-3.5 text-amber-400" />
                      <span>Sign</span>
                    </button>

                    {/* Absent / Failed */}
                    <button
                      onClick={() => handleOpenAbsentModal(parcel)}
                      id={`btn-absent-${parcel.id}`}
                      className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-300 hover:bg-rose-900/50 active:scale-95 text-[10px] font-medium transition-all"
                      title="Recipient absent"
                    >
                      <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                      <span>Absent</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Absent / Failure Reason Modal Dialog */}
      {absentModalParcel && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Record Delivery Issue</h3>
                <p className="text-xs text-slate-400">{absentModalParcel.recipientName}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">Reason for non-delivery:</label>
              <select
                value={failureReason}
                onChange={(e) => setFailureReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="Recipient not home (Card left)">
                  Recipient not home (Notification left)
                </option>
                <option value="No access to building / Gate locked">
                  No access to building / Gate locked
                </option>
                <option value="Name not on doorbell / Incomplete address">
                  Name not on doorbell / Incomplete address
                </option>
                <option value="Refused delivery">Refused delivery</option>
                <option value="Delivery postponed (Second attempt tomorrow)">
                  Second attempt tomorrow
                </option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setAbsentModalParcel(null)}
                className="px-3 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmAbsent('absent')}
                className="px-3 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 shadow-lg shadow-rose-600/30"
              >
                Record as Absent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
