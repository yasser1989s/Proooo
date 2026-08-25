import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Compass,
  TrendingUp,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Building,
  Route,
  ArrowRight,
} from 'lucide-react';
import { Parcel, SmartTourStats, DriverState } from '../types';

interface TourAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  parcels: Parcel[];
  tourStats: SmartTourStats;
  driverState: DriverState;
  onApplyOptimization: () => void;
  onPrioritizeDelayed: (parcel: Parcel) => void;
}

export const TourAssistantModal: React.FC<TourAssistantModalProps> = ({
  isOpen,
  onClose,
  parcels,
  tourStats,
  driverState,
  onApplyOptimization,
  onPrioritizeDelayed,
}) => {
  const [isApplying, setIsApplying] = useState(false);

  if (!isOpen) return null;

  const activeParcels = parcels.filter(
    (p) => p.status === 'pending' || p.status === 'in_transit' || p.status === 'reattempt'
  );

  // Group by street for bundling recommendation
  const streetGroups: { [street: string]: Parcel[] } = {};
  activeParcels.forEach((p) => {
    const streetKey = `${p.street.toLowerCase()} (${p.city})`;
    if (!streetGroups[streetKey]) streetGroups[streetKey] = [];
    streetGroups[streetKey].push(p);
  });

  const bundledStreets = Object.entries(streetGroups).filter(([_, items]) => items.length > 1);

  const delayedParcels = activeParcels.filter((p) => p.isDelayed);

  const handleOptimizeAndClose = () => {
    setIsApplying(true);
    setTimeout(() => {
      onApplyOptimization();
      setIsApplying(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">AI Route Assistant</h3>
              <p className="text-xs text-slate-400">Intelligent logistics & route optimization</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Smart Tour KPI Overview */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
              <span>Tour Diagnostics & Forecast</span>
            </h4>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Pending Stops</span>
                <span className="font-mono text-base font-bold text-white mt-0.5 block">
                  {tourStats.remainingParcels} of {tourStats.totalParcels}
                </span>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Remaining Distance</span>
                <span className="font-mono text-base font-bold text-cyan-400 mt-0.5 block">
                  {tourStats.totalRemainingDistanceKm} km
                </span>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Avg. Delivery / Stop</span>
                <span className="font-mono text-base font-bold text-emerald-400 mt-0.5 block">
                  ~{tourStats.avgDeliveryMinutes} min
                </span>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Estimated Tour Finish</span>
                <span className="font-mono text-base font-bold text-amber-400 mt-0.5 block">
                  {tourStats.estimatedFinishTime || 'Today'}
                </span>
              </div>
            </div>
          </div>

          {/* AI Recommendation: Street Bundling */}
          {bundledStreets.length > 0 && (
            <div className="bg-slate-950 border border-blue-500/30 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                <Building className="w-4 h-4" />
                <span>Street Bundling Detected ({bundledStreets.length})</span>
              </div>
              <p className="text-xs text-slate-300">
                Multiple parcels are located on the same street. Parking once saves approximately{' '}
                {bundledStreets.length * 4} minutes of walking time.
              </p>

              <div className="space-y-1.5 pt-1">
                {bundledStreets.map(([street, items], i) => (
                  <div
                    key={i}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center justify-between"
                  >
                    <span className="font-medium text-white capitalize">{street}</span>
                    <span className="font-mono text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-md">
                      {items.length} parcels
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Recommendation: Delayed Parcel Priority */}
          {delayedParcels.length > 0 && (
            <div className="bg-slate-950 border border-amber-500/40 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                <span>{delayedParcels.length} delayed delivery(s)</span>
              </div>
              <p className="text-xs text-slate-300">
                Customers are urgently awaiting these shipments. The 2-Opt route optimizer automatically prioritizes these stops.
              </p>

              <div className="space-y-1 pt-1">
                {delayedParcels.map((p) => (
                  <div
                    key={p.id}
                    className="p-2 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-center justify-between text-xs"
                  >
                    <span className="text-amber-200 truncate">
                      {p.recipientName} ({p.street} {p.houseNumber})
                    </span>
                    <button
                      onClick={() => {
                        onPrioritizeDelayed(p);
                        onClose();
                      }}
                      className="px-2 py-1 rounded bg-amber-500 text-slate-950 text-[10px] font-bold shrink-0 hover:bg-amber-400"
                    >
                      Prioritize
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optimization Algorithm Info */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs text-slate-400">
            <h5 className="font-bold text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>2-Opt Traveling Salesperson (TSP) Algorithm</span>
            </h5>
            <p>
              Calculates the mathematically optimal route considering your current GPS position, distance weights, and priority flags to minimize total transit time and fuel consumption.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold active:scale-95 transition-all"
          >
            Close
          </button>

          <button
            onClick={handleOptimizeAndClose}
            disabled={isApplying}
            id="btn-apply-tour-assistant"
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 active:scale-95 transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isApplying ? 'Calculating...' : 'Optimize Route Plan Now'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
