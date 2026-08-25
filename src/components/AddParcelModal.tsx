import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  Layers,
  Check,
  Trash2,
  Edit2,
  Plus,
  X,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Package,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { Parcel } from '../types';
import {
  analyzeParcelImage,
  analyzeBatchParcelImages,
  createParcelFromExtracted,
  ExtractedParcelData,
} from '../services/aiService';

interface AddParcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddParcels: (parcels: Parcel[]) => void;
  currentParcelCount: number;
}

export const AddParcelModal: React.FC<AddParcelModalProps> = ({
  isOpen,
  onClose,
  onAddParcels,
  currentParcelCount,
}) => {
  const [activeMode, setActiveMode] = useState<'single' | 'batch' | 'manual'>('single');

  // Single Mode State
  const [singleImage, setSingleImage] = useState<string | null>(null);
  const [isAnalyzingSingle, setIsAnalyzingSingle] = useState(false);
  const [singleExtracted, setSingleExtracted] = useState<ExtractedParcelData | null>(null);
  const [singleError, setSingleError] = useState<string | null>(null);

  // Batch Mode State
  const [batchImages, setBatchImages] = useState<Array<{ data: string; mimeType: string }>>([]);
  const [isAnalyzingBatch, setIsAnalyzingBatch] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [batchExtractedList, setBatchExtractedList] = useState<ExtractedParcelData[]>([]);
  const [editingBatchIndex, setEditingBatchIndex] = useState<number | null>(null);

  // Manual Mode State
  const [manualForm, setManualForm] = useState<ExtractedParcelData>({
    recipientName: '',
    street: '',
    houseNumber: '',
    postalCode: '',
    city: 'Berlin',
    country: 'Deutschland',
    phone: '',
    trackingNumber: '',
    notes: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const batchFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Single Image Selection
  const handleSingleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setSingleImage(base64);
      setSingleError(null);
      await runSingleAnalysis(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  const runSingleAnalysis = async (imageBase64: string, mimeType: string) => {
    setIsAnalyzingSingle(true);
    setSingleError(null);
    try {
      const res = await analyzeParcelImage(imageBase64, mimeType);
      if (res.success && res.parcel) {
        setSingleExtracted(res.parcel);
      } else {
        setSingleError(res.error || 'Failed to read parcel label automatically.');
      }
    } catch (err: any) {
      setSingleError(err.message || 'Connection error during AI analysis.');
    } finally {
      setIsAnalyzingSingle(false);
    }
  };

  // Save Single Parcel
  const handleSaveSingle = async () => {
    if (!singleExtracted) return;
    setIsAnalyzingSingle(true);
    try {
      const newParcel = await createParcelFromExtracted(singleExtracted, currentParcelCount + 1);
      onAddParcels([newParcel]);
      resetAll();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzingSingle(false);
    }
  };

  // Batch Image Selection
  const handleBatchFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList: File[] = Array.from(files);
    let loadedCount = 0;
    const newItems: Array<{ data: string; mimeType: string }> = [];

    fileList.forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        newItems.push({ data: reader.result as string, mimeType: file.type });
        loadedCount++;
        if (loadedCount === fileList.length) {
          setBatchImages((prev) => [...prev, ...newItems]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Start Batch AI Analysis
  const handleStartBatchAnalysis = async () => {
    if (batchImages.length === 0) return;
    setIsAnalyzingBatch(true);
    setBatchProgress({ current: 0, total: batchImages.length });

    try {
      const results = await analyzeBatchParcelImages(batchImages, (current, total) => {
        setBatchProgress({ current, total });
      });

      setBatchExtractedList(results);
    } catch (err) {
      console.error('Batch analysis error:', err);
    } finally {
      setIsAnalyzingBatch(false);
      setBatchProgress(null);
    }
  };

  // Save All Batch Parcels
  const handleSaveAllBatch = async () => {
    if (batchExtractedList.length === 0) return;
    setIsAnalyzingBatch(true);

    try {
      const createdParcels: Parcel[] = [];
      for (let i = 0; i < batchExtractedList.length; i++) {
        const item = batchExtractedList[i];
        const parcel = await createParcelFromExtracted(item, currentParcelCount + i + 1);
        createdParcels.push(parcel);
      }

      onAddParcels(createdParcels);
      resetAll();
      onClose();
    } catch (e) {
      console.error('Error saving batch:', e);
    } finally {
      setIsAnalyzingBatch(false);
    }
  };

  // Save Manual Form
  const handleSaveManual = async () => {
    if (!manualForm.recipientName || !manualForm.street || !manualForm.city) {
      alert('Please specify recipient name, street, and city.');
      return;
    }
    const newParcel = await createParcelFromExtracted(manualForm, currentParcelCount + 1);
    onAddParcels([newParcel]);
    resetAll();
    onClose();
  };

  const resetAll = () => {
    setSingleImage(null);
    setSingleExtracted(null);
    setSingleError(null);
    setBatchImages([]);
    setBatchExtractedList([]);
    setEditingBatchIndex(null);
    setManualForm({
      recipientName: '',
      street: '',
      houseNumber: '',
      postalCode: '',
      city: 'Berlin',
      country: 'Germany',
      phone: '',
      trackingNumber: '',
      notes: '',
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">Add Parcels</h3>
              <p className="text-xs text-slate-400">AI parcel label recognition & geocoding</p>
            </div>
          </div>

          <button
            onClick={() => {
              resetAll();
              onClose();
            }}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-3 gap-1 p-2 bg-slate-950/80 border-b border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveMode('single')}
            id="tab-mode-single"
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeMode === 'single'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>1 Parcel (Scan)</span>
          </button>

          <button
            onClick={() => setActiveMode('batch')}
            id="tab-mode-batch"
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeMode === 'batch'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Multiple (Batch)</span>
          </button>

          <button
            onClick={() => setActiveMode('manual')}
            id="tab-mode-manual"
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeMode === 'manual'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Manual</span>
          </button>
        </div>

        {/* Modal Body Container */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {/* ================= MODE A: SINGLE PARCEL ================= */}
          {activeMode === 'single' && (
            <div className="space-y-4">
              {!singleImage && (
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-slate-700 hover:border-blue-500/80 rounded-2xl p-6 text-center bg-slate-950/40 transition-colors">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto mb-3">
                      <Camera className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-white">Capture or upload parcel label</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      AI automatically extracts recipient name, street, house number, postal code, and notes.
                    </p>

                    <div className="flex items-center justify-center gap-2.5 mt-4">
                      {/* Direct Camera Input */}
                      <button
                        onClick={() => cameraInputRef.current?.click()}
                        className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Open Camera</span>
                      </button>

                      {/* File Gallery */}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Upload Photo</span>
                      </button>
                    </div>

                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleSingleFileChange}
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleSingleFileChange}
                    />
                  </div>
                </div>
              )}

              {/* Single Image Analyzing Spinner */}
              {isAnalyzingSingle && (
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
                  <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
                  <h4 className="text-sm font-bold text-white">AI analyzing parcel label...</h4>
                  <p className="text-xs text-slate-400">
                    Extracting address data and barcode information with geocoding.
                  </p>
                </div>
              )}

              {/* Review & Edit Extracted Single Parcel */}
              {singleExtracted && !isAnalyzingSingle && (
                <div className="space-y-3.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Parcel details recognized!</span>
                    </span>
                    <button
                      onClick={() => {
                        setSingleImage(null);
                        setSingleExtracted(null);
                      }}
                      className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Rescan</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                        Recipient Name
                      </label>
                      <input
                        type="text"
                        value={singleExtracted.recipientName}
                        onChange={(e) =>
                          setSingleExtracted({ ...singleExtracted, recipientName: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                        Street Name
                      </label>
                      <input
                        type="text"
                        value={singleExtracted.street}
                        onChange={(e) =>
                          setSingleExtracted({ ...singleExtracted, street: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                        House Number
                      </label>
                      <input
                        type="text"
                        value={singleExtracted.houseNumber}
                        onChange={(e) =>
                          setSingleExtracted({ ...singleExtracted, houseNumber: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        value={singleExtracted.postalCode}
                        onChange={(e) =>
                          setSingleExtracted({ ...singleExtracted, postalCode: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={singleExtracted.city}
                        onChange={(e) =>
                          setSingleExtracted({ ...singleExtracted, city: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                        Phone (optional)
                      </label>
                      <input
                        type="tel"
                        value={singleExtracted.phone || ''}
                        onChange={(e) =>
                          setSingleExtracted({ ...singleExtracted, phone: e.target.value })
                        }
                        placeholder="+49..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                        Tracking / Barcode Number
                      </label>
                      <input
                        type="text"
                        value={singleExtracted.trackingNumber || ''}
                        onChange={(e) =>
                          setSingleExtracted({ ...singleExtracted, trackingNumber: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                        Notes / Delivery Instructions
                      </label>
                      <input
                        type="text"
                        value={singleExtracted.notes || ''}
                        onChange={(e) =>
                          setSingleExtracted({ ...singleExtracted, notes: e.target.value })
                        }
                        placeholder="e.g. Backdoor, 2nd floor, leave in garage..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSaveSingle}
                    id="btn-save-single-parcel"
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-98 transition-all"
                  >
                    <Check className="w-4 h-4" />
                    <span>Add Parcel to Tour</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ================= MODE B: BATCH MULTI-PARCEL ================= */}
          {activeMode === 'batch' && (
            <div className="space-y-4">
              {/* Batch Upload & Reel */}
              <div className="border-2 border-dashed border-slate-700 hover:border-blue-500/80 rounded-2xl p-5 text-center bg-slate-950/40">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto mb-2">
                  <Layers className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white">Scan multiple parcels at once</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Select multiple parcel label photos from your gallery or take several photos in sequence.
                </p>

                <div className="flex items-center justify-center gap-2.5 mt-3">
                  <button
                    onClick={() => batchFileInputRef.current?.click()}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Select Photos ({batchImages.length} loaded)</span>
                  </button>
                </div>

                <input
                  ref={batchFileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleBatchFileChange}
                />
              </div>

              {/* Photos Filmstrip Thumbnail Reel */}
              {batchImages.length > 0 && batchExtractedList.length === 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{batchImages.length} photos ready for analysis</span>
                    <button
                      onClick={() => setBatchImages([])}
                      className="text-rose-400 hover:text-rose-300"
                    >
                      Clear all
                    </button>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {batchImages.map((img, i) => (
                      <div
                        key={i}
                        className="w-16 h-16 rounded-xl border border-slate-700 overflow-hidden relative shrink-0 bg-slate-800"
                      >
                        <img src={img.data} alt="thumb" className="w-full h-full object-cover" />
                        <button
                          onClick={() => setBatchImages((prev) => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px]"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Start Batch Button */}
                  <button
                    onClick={handleStartBatchAnalysis}
                    disabled={isAnalyzingBatch}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Analyze all {batchImages.length} parcels with AI</span>
                  </button>
                </div>
              )}

              {/* Analyzing Progress */}
              {isAnalyzingBatch && batchProgress && (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center space-y-3">
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
                  <h4 className="text-sm font-bold text-white">
                    Analyzing parcel {batchProgress.current} of {batchProgress.total}...
                  </h4>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-cyan-400 h-full transition-all duration-300"
                      style={{
                        width: `${(batchProgress.current / batchProgress.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Review Screen with all detected parcels */}
              {batchExtractedList.length > 0 && !isAnalyzingBatch && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4" />
                      <span>{batchExtractedList.length} parcels recognized</span>
                    </span>
                    <button
                      onClick={() => {
                        setBatchExtractedList([]);
                        setBatchImages([]);
                      }}
                      className="text-xs text-slate-400 hover:text-slate-200"
                    >
                      Reset
                    </button>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {batchExtractedList.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span className="w-5 h-5 rounded-md bg-slate-800 text-slate-300 font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <h5 className="font-bold text-white truncate">{item.recipientName}</h5>
                            <p className="text-slate-400 truncate mt-0.5">
                              {item.street} {item.houseNumber}, {item.postalCode} {item.city}
                            </p>
                            <span className="font-mono text-[10px] text-cyan-400 mt-1 block">
                              📦 {item.trackingNumber}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() =>
                              setBatchExtractedList((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="w-7 h-7 rounded-lg bg-slate-800 text-rose-400 hover:bg-rose-950/60 flex items-center justify-center"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add All Valid Parcels Button */}
                  <button
                    onClick={handleSaveAllBatch}
                    id="btn-save-all-batch-parcels"
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-98 transition-all"
                  >
                    <Check className="w-4 h-4" />
                    <span>Add all {batchExtractedList.length} parcels to tour</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ================= MODE C: MANUAL ENTRY ================= */}
          {activeMode === 'manual' && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Recipient Name *
                  </label>
                  <input
                    type="text"
                    value={manualForm.recipientName}
                    onChange={(e) => setManualForm({ ...manualForm, recipientName: e.target.value })}
                    placeholder="e.g. Susanne Meyer"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Street *
                  </label>
                  <input
                    type="text"
                    value={manualForm.street}
                    onChange={(e) => setManualForm({ ...manualForm, street: e.target.value })}
                    placeholder="e.g. Friedrichstrasse"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    House Number *
                  </label>
                  <input
                    type="text"
                    value={manualForm.houseNumber}
                    onChange={(e) => setManualForm({ ...manualForm, houseNumber: e.target.value })}
                    placeholder="e.g. 42"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    value={manualForm.postalCode}
                    onChange={(e) => setManualForm({ ...manualForm, postalCode: e.target.value })}
                    placeholder="e.g. 10117"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    value={manualForm.city}
                    onChange={(e) => setManualForm({ ...manualForm, city: e.target.value })}
                    placeholder="e.g. Berlin"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={manualForm.phone || ''}
                    onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                    placeholder="+49 170..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Tracking / Barcode
                  </label>
                  <input
                    type="text"
                    value={manualForm.trackingNumber || ''}
                    onChange={(e) => setManualForm({ ...manualForm, trackingNumber: e.target.value })}
                    placeholder="Auto-generated if empty"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Notes / Delivery Instructions
                  </label>
                  <input
                    type="text"
                    value={manualForm.notes || ''}
                    onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                    placeholder="e.g. Garage, Neighbor..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveManual}
                id="btn-save-manual-parcel"
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 active:scale-98 transition-all mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Parcel Manually</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
