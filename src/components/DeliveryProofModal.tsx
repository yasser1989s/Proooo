import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  PenTool,
  X,
  Check,
  RotateCcw,
  Download,
  Trash2,
  Maximize2,
  Upload,
  ShieldCheck,
} from 'lucide-react';
import { Parcel } from '../types';

interface DeliveryProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  parcel: Parcel | null;
  initialMode: 'photo' | 'signature';
  onSaveProof: (
    parcelId: string,
    proof: { photo?: string | null; signature?: string | null }
  ) => void;
}

export const DeliveryProofModal: React.FC<DeliveryProofModalProps> = ({
  isOpen,
  onClose,
  parcel,
  initialMode,
  onSaveProof,
}) => {
  const [activeTab, setActiveTab] = useState<'photo' | 'signature'>(initialMode);
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  // Canvas Signature state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const hasDrawnRef = useRef(false);

  const photoFileInputRef = useRef<HTMLInputElement>(null);
  const photoCameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (parcel) {
      setPhotoData(parcel.deliveryProofPhoto || null);
      setSignatureData(parcel.signatureData || null);
      setActiveTab(initialMode);
    }
  }, [parcel, initialMode, isOpen]);

  // Set up signature canvas
  useEffect(() => {
    if (activeTab === 'signature' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#38bdf8'; // Cyan signature ink
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [activeTab]);

  if (!isOpen || !parcel) return null;

  // Drawing event handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    isDrawingRef.current = true;
    hasDrawnRef.current = true;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawingRef.current && canvasRef.current) {
      isDrawingRef.current = false;
      const data = canvasRef.current.toDataURL('image/png');
      setSignatureData(data);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setSignatureData(null);
      hasDrawnRef.current = false;
    }
  };

  // Photo handlers
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAndApply = () => {
    onSaveProof(parcel.id, {
      photo: photoData,
      signature: signatureData,
    });
    onClose();
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
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col space-y-3">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="min-w-0 pr-2">
            <h3 className="text-base font-bold text-white font-display truncate">
              Capture Proof of Delivery
            </h3>
            <p className="text-xs text-slate-400 truncate">
              {parcel.recipientName} • {parcel.street} {parcel.houseNumber}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 gap-1.5 px-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('photo')}
            id="tab-proof-photo"
            className={`py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'photo'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20 font-bold'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Delivery Photo</span>
          </button>

          <button
            onClick={() => setActiveTab('signature')}
            id="tab-proof-sig"
            className={`py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'signature'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20 font-bold'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>Customer Signature</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="px-4 space-y-4">
          {/* ================= PHOTO TAB ================= */}
          {activeTab === 'photo' && (
            <div className="space-y-3">
              {photoData ? (
                <div className="space-y-2">
                  <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 aspect-video group">
                    <img
                      src={photoData}
                      alt="Delivery proof"
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setFullscreenImage(photoData)}
                    />
                    <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-sm px-2 py-1 rounded-lg text-[11px] text-slate-300">
                      <Maximize2 className="w-3 h-3" />
                      <span>Tap for full screen</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      onClick={() => setPhotoData(null)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs font-semibold hover:bg-rose-900/50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete / Retake</span>
                    </button>

                    <button
                      onClick={() =>
                        handleDownload(
                          photoData,
                          `delivery-photo-${parcel.trackingNumber}-${Date.now()}.png`
                        )
                      }
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold hover:bg-slate-700"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-2xl p-6 text-center bg-slate-950/40 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Safe Drop / Handover Photo</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Take a photo documenting where the parcel was safely left or handed over.
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                      onClick={() => photoCameraInputRef.current?.click()}
                      className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-600/20 active:scale-95"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Take Photo</span>
                    </button>

                    <button
                      onClick={() => photoFileInputRef.current?.click()}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 active:scale-95"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Choose File</span>
                    </button>
                  </div>

                  <input
                    ref={photoCameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                  <input
                    ref={photoFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                </div>
              )}
            </div>
          )}

          {/* ================= SIGNATURE TAB ================= */}
          {activeTab === 'signature' && (
            <div className="space-y-3">
              <div className="relative rounded-2xl border-2 border-slate-700 bg-slate-950 overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={460}
                  height={180}
                  className="w-full h-44 touch-none cursor-crosshair block"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />

                {/* Subtle Signature Baseline */}
                <div className="absolute bottom-6 left-6 right-6 border-b border-dashed border-slate-800 pointer-events-none flex justify-between text-[10px] text-slate-400">
                  <span>X Sign here</span>
                  <span>Pro Delivery Sign</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={clearSignature}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-700 active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear Signature</span>
                </button>

                {signatureData && (
                  <button
                    onClick={() =>
                      handleDownload(
                        signatureData,
                        `signature-${parcel.trackingNumber}-${Date.now()}.png`
                      )
                    }
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-700 active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold active:scale-95 transition-all"
          >
            Cancel
          </button>

          <button
            onClick={handleSaveAndApply}
            id="btn-save-proof-confirm"
            className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Save Proof</span>
          </button>
        </div>
      </div>

      {/* Fullscreen Image Preview Lightbox */}
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
            alt="Fullscreen proof"
            className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-slate-800"
          />
        </div>
      )}
    </div>
  );
};
