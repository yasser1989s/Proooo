import React, { useState } from 'react';
import {
  X,
  MapPin,
  Phone,
  MessageSquare,
  Navigation,
  CheckCircle2,
  AlertOctagon,
  Clock,
  Camera,
  PenTool,
  ShieldCheck,
  Download,
  Share2,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { Parcel } from '../types';

interface ParcelDetailModalProps {
  parcel: Parcel | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToParcel: (parcel: Parcel) => void;
  onDeliverParcel: (parcel: Parcel) => void;
  onOpenProofModal: (parcel: Parcel, mode: 'photo' | 'signature') => void;
}

export const ParcelDetailModal: React.FC<ParcelDetailModalProps> = ({
  parcel,
  isOpen,
  onClose,
  onNavigateToParcel,
  onDeliverParcel,
  onOpenProofModal,
}) => {
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  if (!isOpen || !parcel) return null;

  const getStatusBadge = () => {
    switch (parcel.status) {
      case 'delivered':
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Delivered successfully</span>
          </span>
        );
      case 'absent':
        return (
          <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5">
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Recipient absent</span>
          </span>
        );
      case 'failed':
        return (
          <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5">
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Delivery failed</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>In Transit / Pending</span>
          </span>
        );
    }
  };

  const handleDownload = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 font-bold text-xs flex items-center justify-center">
              #{parcel.routeOrder}
            </span>
            <div>
              <h3 className="text-base font-bold text-white font-display">Parcel Details</h3>
              <p className="text-xs font-mono text-slate-400">ID: {parcel.id}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Status & Barcode Header Banner */}
          <div className="bg-slate-950 border border-slate-800/90 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Status</span>
              <div className="mt-1">{getStatusBadge()}</div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Tracking No.</span>
              <span className="font-mono text-xs font-bold text-cyan-400 mt-1 block">
                {parcel.trackingNumber}
              </span>
            </div>
          </div>

          {/* Recipient & Address */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Recipient
              </span>
              <h4 className="text-base font-bold text-white mt-0.5">{parcel.recipientName}</h4>
            </div>

            <div className="border-t border-slate-900 pt-2.5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Delivery Address
              </span>
              <div className="flex items-start gap-2 mt-1 text-xs text-slate-200">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">
                    {parcel.street} {parcel.houseNumber}
                  </p>
                  <p className="text-slate-400">
                    {parcel.postalCode} {parcel.city}, {parcel.country}
                  </p>
                </div>
              </div>
            </div>

            {/* GPS Verification Info */}
            <div className="flex items-center justify-between text-[11px] font-mono border-t border-slate-900 pt-2 text-slate-400">
              <span>
                GPS: {parcel.lat?.toFixed(4)}, {parcel.lng?.toFixed(4)}
              </span>
              {parcel.geocodingStatus === 'verified' ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified</span>
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Approximate</span>
                </span>
              )}
            </div>
          </div>

          {/* Quick Communication Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <a
              href={parcel.phone ? `tel:${parcel.phone}` : undefined}
              onClick={(e) => {
                if (!parcel.phone) {
                  e.preventDefault();
                  alert('No phone number available.');
                }
              }}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                parcel.phone
                  ? 'bg-slate-950 border-emerald-800/60 text-emerald-300 hover:bg-emerald-950/30'
                  : 'bg-slate-950 border-slate-800 text-slate-600 cursor-not-allowed'
              }`}
            >
              <Phone className="w-4 h-4" />
              <span>{parcel.phone ? `Call (${parcel.phone})` : 'No Phone'}</span>
            </a>

            <a
              href={
                parcel.phone
                  ? `https://wa.me/${parcel.phone.replace(/[^0-9]/g, '')}`
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
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                parcel.phone
                  ? 'bg-slate-950 border-emerald-800/60 text-emerald-300 hover:bg-emerald-950/30'
                  : 'bg-slate-950 border-slate-800 text-slate-600 cursor-not-allowed'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp</span>
            </a>
          </div>

          {/* Delivery Instructions / Notes */}
          {parcel.notes && (
            <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-3.5 text-xs text-amber-200">
              <span className="font-bold block text-amber-300 mb-1">Delivery Notes / Instructions:</span>
              <p>{parcel.notes}</p>
            </div>
          )}

          {/* Delivery Timestamp & Reason if Absent */}
          {parcel.deliveryTime && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Delivery Time:</span>
                <span className="font-mono text-slate-200 font-bold">
                  {new Date(parcel.deliveryTime).toLocaleString('en-US')}
                </span>
              </div>
              {parcel.failureReason && (
                <div className="pt-2 border-t border-slate-900 text-rose-300">
                  <span className="font-bold">Reason for non-delivery:</span> {parcel.failureReason}
                </div>
              )}
            </div>
          )}

          {/* Delivery Proof Photo & Signature Previews */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Delivery Photo */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Delivery Photo</span>
                </span>
                <button
                  onClick={() => onOpenProofModal(parcel, 'photo')}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300"
                >
                  {parcel.deliveryProofPhoto ? 'Change' : 'Capture'}
                </button>
              </div>

              {parcel.deliveryProofPhoto ? (
                <div
                  className="relative rounded-xl overflow-hidden aspect-video border border-slate-700 cursor-pointer group"
                  onClick={() => setFullscreenImage(parcel.deliveryProofPhoto!)}
                >
                  <img
                    src={parcel.deliveryProofPhoto}
                    alt="Proof"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-xs text-white">
                    Tap to enlarge
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => onOpenProofModal(parcel, 'photo')}
                  className="rounded-xl border border-dashed border-slate-800 aspect-video flex flex-col items-center justify-center text-slate-500 hover:text-slate-400 hover:border-slate-700 cursor-pointer text-xs gap-1"
                >
                  <Camera className="w-5 h-5" />
                  <span>No photo attached</span>
                </div>
              )}
            </div>

            {/* Signature */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-amber-400" />
                  <span>Signature</span>
                </span>
                <button
                  onClick={() => onOpenProofModal(parcel, 'signature')}
                  className="text-[11px] text-amber-400 hover:text-amber-300"
                >
                  {parcel.signatureData ? 'Change' : 'Capture'}
                </button>
              </div>

              {parcel.signatureData ? (
                <div
                  className="relative rounded-xl overflow-hidden aspect-video border border-slate-700 bg-slate-900 p-2 cursor-pointer group flex items-center justify-center"
                  onClick={() => setFullscreenImage(parcel.signatureData!)}
                >
                  <img
                    src={parcel.signatureData}
                    alt="Signature"
                    className="max-h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-xs text-white">
                    Tap to enlarge
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => onOpenProofModal(parcel, 'signature')}
                  className="rounded-xl border border-dashed border-slate-800 aspect-video flex flex-col items-center justify-center text-slate-500 hover:text-slate-400 hover:border-slate-700 cursor-pointer text-xs gap-1"
                >
                  <PenTool className="w-5 h-5" />
                  <span>No signature</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              onNavigateToParcel(parcel);
              onClose();
            }}
            className="py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
          >
            <Navigation className="w-4 h-4" />
            <span>Start Navigation</span>
          </button>

          {parcel.status === 'pending' || parcel.status === 'in_transit' ? (
            <button
              onClick={() => {
                onDeliverParcel(parcel);
                onClose();
              }}
              className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Deliver Now</span>
            </button>
          ) : (
            <button
              onClick={onClose}
              className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Fullscreen Preview Lightbox */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-60 bg-black/95 flex flex-col items-center justify-center p-4"
          onClick={() => setFullscreenImage(null)}
        >
          <button
            onClick={() => setFullscreenImage(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center text-lg font-bold"
          >
            ✕
          </button>
          <img
            src={fullscreenImage}
            alt="Fullscreen"
            className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-slate-800"
          />
        </div>
      )}
    </div>
  );
};
