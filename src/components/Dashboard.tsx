import React from 'react';
import {
  Package,
  CheckCircle2,
  Clock,
  AlertOctagon,
  Route,
  Navigation,
  Sparkles,
  Phone,
  ArrowRight,
  MapPin,
  AlertTriangle,
  Flame,
  Check,
  TrendingUp,
} from 'lucide-react';
import { Parcel, SmartTourStats, DriverState } from '../types';

interface DashboardProps {
  parcels: Parcel[];
  tourStats: SmartTourStats;
  driverState: DriverState;
  onSelectParcel: (parcel: Parcel) => void;
  onDeliverParcel: (parcel: Parcel) => void;
  onNavigateToParcel: (parcel: Parcel) => void;
  onPrioritizeDelayed: (parcel: Parcel) => void;
  onOpenAddModal: () => void;
  onOpenMapView: () => void;
  onOpenTourAssistant: () => void;
  onOptimizeRoute: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  parcels,
  tourStats,
  driverState,
  onSelectParcel,
  onDeliverParcel,
  onNavigateToParcel,
  onPrioritizeDelayed,
  onOpenAddModal,
  onOpenMapView,
  onOpenTourAssistant,
  onOptimizeRoute,
}) => {
  const delayedParcels = parcels.filter(
    (p) => (p.status === 'pending' || p.status === 'in_transit') && p.isDelayed
  );
  const nextParcel = tourStats.nextBestParcel;
  const todayActive = parcels.filter(
    (p) => p.status === 'pending' || p.status === 'in_transit' || p.status === 'reattempt'
  );
  const deliveredToday = parcels.filter((p) => p.status === 'delivered');

  return (
    <div className="space-y-4 pb-24">
      {/* ⚠️ Delay Alert Banner */}
      {delayedParcels.length > 0 && (
        <div
          id="banner-delayed-parcels"
          className="bg-gradient-to-r from-amber-950/80 to-rose-950/80 border border-amber-500/40 rounded-2xl p-4 shadow-xl backdrop-blur-md"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-amber-200">
                  ⚠️ {delayedParcels.length} parcel{delayedParcels.length > 1 ? 's' : ''} delayed!
                </h3>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Priority Action
                </span>
              </div>
              <p className="text-xs text-amber-200/80 mt-1 line-clamp-1">
                {delayedParcels[0].recipientName} • {delayedParcels[0].street}{' '}
                {delayedParcels[0].houseNumber}
              </p>

              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => onPrioritizeDelayed(delayedParcels[0])}
                  id="btn-prioritize-delayed"
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Prioritize & Re-route</span>
                </button>
                <button
                  onClick={() => onNavigateToParcel(delayedParcels[0])}
                  id="btn-nav-delayed"
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 border border-amber-500/30 text-amber-300 hover:bg-slate-800 text-xs font-semibold rounded-xl active:scale-95 transition-all"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Navigate</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Total Parcels */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-display text-white">
              {tourStats.totalParcels}
            </span>
            <span className="text-[11px] text-slate-500">Parcels</span>
          </div>
        </div>

        {/* Delivered */}
        <div className="bg-slate-900/90 border border-emerald-900/40 rounded-2xl p-3.5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-400">Delivered</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-display text-emerald-400">
              {tourStats.deliveredParcels}
            </span>
            <span className="text-[11px] text-emerald-500/80">
              {tourStats.totalParcels > 0
                ? `${Math.round((tourStats.deliveredParcels / tourStats.totalParcels) * 100)}%`
                : '0%'}
            </span>
          </div>
        </div>

        {/* Remaining */}
        <div className="bg-slate-900/90 border border-cyan-900/40 rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-cyan-400">Remaining</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-display text-cyan-300">
              {tourStats.remainingParcels}
            </span>
            <span className="text-[11px] text-cyan-500/80">Stops</span>
          </div>
        </div>

        {/* Absent / Failed */}
        <div className="bg-slate-900/90 border border-rose-900/40 rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-400">Not Home / Failed</span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-display text-rose-400">
              {tourStats.absentFailedParcels}
            </span>
            <span className="text-[11px] text-rose-500/80">Issues</span>
          </div>
        </div>
      </div>

      {/* Smart Tour Progress & Finish ETA Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Smart Tour Progress
            </span>
          </div>
          <button
            onClick={onOpenTourAssistant}
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
          >
            <span>Assistant</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-slate-400">
              Tour Progress ({tourStats.progressPercentage}%)
            </span>
            <span className="font-mono font-semibold text-slate-300">
              {tourStats.deliveredParcels} / {tourStats.totalParcels}
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${tourStats.progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Dynamic Metric Badges */}
        <div className="mt-3.5 grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-center">
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Remaining Distance</div>
            <div className="font-mono text-sm font-bold text-slate-200 mt-0.5">
              {tourStats.totalRemainingDistanceKm} km
            </div>
          </div>
          <div className="border-x border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Ø Stop Duration</div>
            <div className="font-mono text-sm font-bold text-cyan-400 mt-0.5">
              {tourStats.avgDeliveryMinutes} min
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Est. Completion</div>
            <div className="font-mono text-sm font-bold text-emerald-400 mt-0.5">
              {tourStats.estimatedFinishTime || 'Finished'}
            </div>
          </div>
        </div>
      </div>

      {/* 🚀 Next Best Parcel (Hero Delivery Card) */}
      {nextParcel ? (
        <div
          id="card-next-best-parcel"
          className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-blue-500/40 rounded-2xl p-4 shadow-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 px-3 py-1 bg-blue-600 text-[10px] font-bold text-white rounded-bl-xl uppercase tracking-wider flex items-center gap-1 shadow-md">
            <Sparkles className="w-3 h-3" />
            <span>Next Best Parcel</span>
          </div>

          <div className="pr-28">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold text-xs">
                #{nextParcel.routeOrder}
              </span>
              <h3 className="text-base font-bold text-white font-display truncate">
                {nextParcel.recipientName}
              </h3>
            </div>
            <div className="flex items-start gap-1.5 mt-1.5 text-xs text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
              <span>
                {nextParcel.street} {nextParcel.houseNumber}, {nextParcel.postalCode}{' '}
                {nextParcel.city}
              </span>
            </div>
          </div>

          {/* Quick distance & duration chips */}
          <div className="flex items-center gap-2 mt-3 text-[11px] font-mono">
            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
              📍 {nextParcel.distanceFromDriverKm ?? 0} km away
            </span>
            <span className="px-2 py-0.5 rounded-md bg-blue-950/60 text-blue-300 border border-blue-800/50">
              ⏱ ~{nextParcel.estimatedDrivingMinutes ?? 3} min drive
            </span>
            {nextParcel.phone && (
              <a
                href={`tel:${nextParcel.phone}`}
                className="px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-800/50 flex items-center gap-1 hover:bg-emerald-900/60"
              >
                <Phone className="w-2.5 h-2.5" />
                <span>Call</span>
              </a>
            )}
          </div>

          {/* Notes badge if present */}
          {nextParcel.notes && (
            <div className="mt-2 p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-amber-300/90 flex items-start gap-1.5">
              <span className="font-bold">Note:</span>
              <span className="line-clamp-1">{nextParcel.notes}</span>
            </div>
          )}

          {/* Working Big Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5 mt-4">
            <button
              onClick={() => onNavigateToParcel(nextParcel)}
              id="btn-hero-navigate"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all"
            >
              <Navigation className="w-4 h-4" />
              <span>Start Navigation</span>
            </button>

            <button
              onClick={() => onDeliverParcel(nextParcel)}
              id="btn-hero-deliver"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Deliver Now</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-emerald-500/30 rounded-2xl p-6 text-center shadow-lg">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">All parcels delivered for today!</h3>
          <p className="text-xs text-slate-400 mt-1">
            Excellent job. There are no remaining active stops on today's tour.
          </p>
        </div>
      )}

      {/* Quick Action Bar: Map / Add Parcels / Optimize */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={onOpenMapView}
          id="btn-quick-map"
          className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:border-slate-700 active:scale-95 transition-all text-xs font-semibold"
        >
          <Route className="w-5 h-5 text-blue-400" />
          <span>Map Tour</span>
        </button>

        <button
          onClick={onOpenAddModal}
          id="btn-quick-add-ai"
          className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-blue-950/60 border border-blue-800/60 text-blue-200 hover:border-blue-600 active:scale-95 transition-all text-xs font-semibold"
        >
          <Sparkles className="w-5 h-5 text-cyan-400" />
          <span>Scan Parcels</span>
        </button>

        <button
          onClick={onOptimizeRoute}
          id="btn-quick-optimize"
          className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:border-slate-700 active:scale-95 transition-all text-xs font-semibold"
        >
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span>Optimize Route</span>
        </button>
      </div>

      {/* Today's Active Route Overview */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white font-display">
              Today's Delivery Sequence
            </h3>
            <span className="text-xs font-mono text-slate-400">
              ({todayActive.length} remaining)
            </span>
          </div>
        </div>

        <div className="space-y-2">
          {todayActive.slice(0, 5).map((parcel) => (
            <div
              key={parcel.id}
              onClick={() => onSelectParcel(parcel)}
              className="bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 rounded-xl p-3 flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                    parcel.isDelayed
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  #{parcel.routeOrder}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white truncate">
                      {parcel.recipientName}
                    </span>
                    {parcel.isDelayed && (
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-1.5 py-0.2 rounded">
                        Delayed
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {parcel.street} {parcel.houseNumber}, {parcel.city}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-mono font-medium text-slate-300 block">
                  {parcel.distanceFromPrevKm ?? 0} km
                </span>
                <span className="text-[10px] text-slate-500 block">
                  ~{parcel.estimatedDrivingMinutes ?? 2} min
                </span>
              </div>
            </div>
          ))}

          {todayActive.length > 5 && (
            <p className="text-center text-xs text-slate-500 py-1">
              + {todayActive.length - 5} more stops in Route tab
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
