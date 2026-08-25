import React, { useState, useEffect } from 'react';
import {
  Clock,
  MapPin,
  Navigation,
  Sparkles,
  RotateCcw,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Settings,
} from 'lucide-react';
import { DriverState, SmartTourStats } from '../types';

interface HeaderProps {
  driverState?: DriverState;
  onToggleGps?: () => void;
  tourStats?: SmartTourStats;
  onOpenSearch?: () => void;
  onOpenTourSummary?: () => void;
  onResetData?: () => void;
  onOptimizeRoute?: () => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  onOpenAddModal?: () => void;
  onOpenBarcodeScanner?: () => void;
  activeTab?: string;
  setActiveTab?: (tab: 'dashboard' | 'route' | 'map' | 'history') => void;
  totalParcels?: number;
  remainingParcels?: number;
}

export const Header: React.FC<HeaderProps> = ({
  driverState,
  onToggleGps,
  tourStats,
  onOpenSearch,
  onOpenTourSummary,
  onResetData,
  onOptimizeRoute,
  searchQuery = '',
  setSearchQuery,
  onOpenAddModal,
  onOpenBarcodeScanner,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const gpsStatus = driverState?.gpsStatus || 'fixed';
  const currentGps = driverState?.currentGps;

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setCurrentDate(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 safe-top">
      <div className="max-w-4xl mx-auto flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          {/* Brand & Clock */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold shrink-0">
              <span className="text-lg tracking-tighter">P</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-white font-display">
                  Pro Delivery
                </h1>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  PRO
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Clock className="w-3 h-3 text-slate-500" />
                <span className="font-mono text-slate-300 font-medium">{currentTime}</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400 text-[11px]">{currentDate}</span>
              </div>
            </div>
          </div>

          {/* Action icons & GPS status */}
          <div className="flex items-center gap-1.5">
            {/* GPS status pill */}
            <button
              onClick={onToggleGps}
              id="btn-header-gps"
              title="Toggle GPS status / simulation"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:border-slate-700 active:scale-95 transition-all"
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  gpsStatus === 'tracking' || gpsStatus === 'fixed'
                    ? 'bg-emerald-400 animate-driver-pulse'
                    : 'bg-amber-400'
                }`}
              />
              <span className="font-mono text-[11px] font-medium hidden sm:inline">
                {currentGps
                  ? `${currentGps.lat.toFixed(3)}, ${currentGps.lng.toFixed(3)}`
                  : 'GPS Ready'}
              </span>
              <span className="text-[11px] font-medium sm:hidden">GPS</span>
            </button>

            {/* Search Trigger */}
            <button
              onClick={() => {
                if (onOpenSearch) onOpenSearch();
                setIsSearchExpanded((prev) => !prev);
              }}
              id="btn-header-search"
              title="Search parcel"
              className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all active:scale-95 ${
                isSearchExpanded || searchQuery
                  ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
              }`}
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Route Optimize quick trigger */}
            {onOptimizeRoute && (
              <button
                onClick={onOptimizeRoute}
                id="btn-header-optimize"
                title="Optimize route now (2-Opt)"
                className="w-8 h-8 rounded-lg bg-blue-950/80 border border-blue-800/60 flex items-center justify-center text-blue-400 hover:text-blue-300 hover:border-blue-600 active:scale-95 transition-all"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            )}

            {/* Settings / Menu */}
            <div className="relative">
              <button
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                id="btn-header-settings"
                title="Options & Tour"
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white active:scale-95 transition-all"
              >
                <Settings className="w-4 h-4" />
              </button>

              {showSettingsMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-1.5 z-50 text-xs">
                  {onOpenTourSummary && (
                    <button
                      onClick={() => {
                        setShowSettingsMenu(false);
                        onOpenTourSummary();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-800 text-left"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                      <span>Tour Assistant & Analytics</span>
                    </button>
                  )}

                  {onOptimizeRoute && (
                    <button
                      onClick={() => {
                        setShowSettingsMenu(false);
                        onOptimizeRoute();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-800 text-left"
                    >
                      <Sparkles className="w-4 h-4 text-blue-400" />
                      <span>Recalculate Route (2-Opt)</span>
                    </button>
                  )}

                  {onOpenBarcodeScanner && (
                    <button
                      onClick={() => {
                        setShowSettingsMenu(false);
                        onOpenBarcodeScanner();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-800 text-left"
                    >
                      <Search className="w-4 h-4 text-emerald-400" />
                      <span>Barcode Scanner</span>
                    </button>
                  )}

                  <div className="h-px bg-slate-800 my-1" />

                  {onResetData && (
                    <button
                      onClick={() => {
                        setShowSettingsMenu(false);
                        if (
                          window.confirm(
                            'Reset all tour parcels to the default Berlin demo route?'
                          )
                        ) {
                          onResetData();
                        }
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-950/40 text-left"
                    >
                      <RotateCcw className="w-4 h-4 text-rose-400" />
                      <span>Reset Tour (Demo Data)</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Expandable Search Input */}
        {isSearchExpanded && setSearchQuery && (
          <div className="pt-1">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recipient, street, postal code or tracking number..."
                autoFocus
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-xs text-slate-400 hover:text-white px-1 py-0.5"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
