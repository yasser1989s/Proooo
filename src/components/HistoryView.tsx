import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  AlertOctagon,
  Search,
  Download,
  Filter,
  Camera,
  PenTool,
  Calendar,
  MapPin,
  RefreshCw,
  Eye,
  FileSpreadsheet,
  FileJson,
  Clock,
} from 'lucide-react';
import { Parcel } from '../types';

interface HistoryViewProps {
  parcels: Parcel[];
  onSelectParcel: (parcel: Parcel) => void;
  onReopenParcel: (parcel: Parcel) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  parcels,
  onSelectParcel,
  onReopenParcel,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'delivered' | 'absent'>('all');
  const [timeRange, setTimeRange] = useState<'all' | 'today' | 'yesterday' | '7days' | '14days'>('all');

  const completedParcels = useMemo(() => {
    return parcels.filter(
      (p) => p.status === 'delivered' || p.status === 'absent' || p.status === 'failed'
    );
  }, [parcels]);

  const filteredList = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
    const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000);

    return completedParcels.filter((p) => {
      const matchesSearch =
        p.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.street.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.city.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // Status filter
      if (statusFilter === 'delivered' && p.status !== 'delivered') return false;
      if (statusFilter === 'absent' && p.status !== 'absent' && p.status !== 'failed') return false;

      // Time range filter (14-day history support)
      const pDate = p.deliveryTime ? new Date(p.deliveryTime) : new Date(p.deliveryDate || p.createdAt);
      const pDateStr = (p.deliveryDate || pDate.toISOString().slice(0, 10));

      if (timeRange === 'today') {
        return pDateStr === todayStr;
      }
      if (timeRange === 'yesterday') {
        return pDateStr === yesterdayStr;
      }
      if (timeRange === '7days') {
        return pDate >= sevenDaysAgo;
      }
      if (timeRange === '14days') {
        return pDate >= fourteenDaysAgo;
      }

      return true;
    });
  }, [completedParcels, searchTerm, statusFilter, timeRange]);

  const exportCSV = () => {
    const headers = [
      'TrackingNumber',
      'Recipient',
      'Street',
      'HouseNumber',
      'PostalCode',
      'City',
      'Status',
      'DeliveryTime',
      'PhotoProof',
      'SignatureProof',
      'FailureReason',
    ];

    const rows = filteredList.map((p) => [
      p.trackingNumber,
      `"${p.recipientName.replace(/"/g, '""')}"`,
      `"${p.street}"`,
      p.houseNumber,
      p.postalCode,
      p.city,
      p.status,
      p.deliveryTime || '',
      p.deliveryProofPhoto ? 'Yes' : 'No',
      p.signatureData ? 'Yes' : 'No',
      `"${(p.failureReason || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `pro-delivery-tour-report-${timeRange}-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportJSON = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredList, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute(
      'download',
      `pro-delivery-tour-report-${timeRange}-${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 pb-28">
      {/* Search & Export Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white font-display">14-Day Delivery History & Archive</h3>
            <p className="text-xs text-slate-400">
              {filteredList.length} shown of {completedParcels.length} archived records
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={exportCSV}
              id="btn-export-csv"
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold active:scale-95 transition-all"
              title="Export CSV tour report"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>CSV</span>
            </button>

            <button
              onClick={exportJSON}
              id="btn-export-json"
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold active:scale-95 transition-all"
              title="Export JSON dataset"
            >
              <FileJson className="w-3.5 h-3.5 text-blue-400" />
              <span>JSON</span>
            </button>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setTimeRange('all')}
            className={`px-2.5 py-1 rounded-lg shrink-0 transition-all ${
              timeRange === 'all'
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            All History
          </button>
          <button
            onClick={() => setTimeRange('today')}
            className={`px-2.5 py-1 rounded-lg shrink-0 transition-all ${
              timeRange === 'today'
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setTimeRange('yesterday')}
            className={`px-2.5 py-1 rounded-lg shrink-0 transition-all ${
              timeRange === 'yesterday'
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Yesterday
          </button>
          <button
            onClick={() => setTimeRange('7days')}
            className={`px-2.5 py-1 rounded-lg shrink-0 transition-all ${
              timeRange === '7days'
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Past 7 Days
          </button>
          <button
            onClick={() => setTimeRange('14days')}
            className={`px-2.5 py-1 rounded-lg shrink-0 transition-all ${
              timeRange === '14days'
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Past 14 Days
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by recipient, street, tracking number..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
        </div>

        {/* Filter Status Pills */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              statusFilter === 'all'
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({completedParcels.length})
          </button>

          <button
            onClick={() => setStatusFilter('delivered')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all ${
              statusFilter === 'delivered'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-slate-950 text-emerald-400 hover:text-emerald-300'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>
              Delivered ({completedParcels.filter((p) => p.status === 'delivered').length})
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('absent')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all ${
              statusFilter === 'absent'
                ? 'bg-rose-600 text-white font-bold'
                : 'bg-slate-950 text-rose-400 hover:text-rose-300'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>
              Absent (
              {
                completedParcels.filter((p) => p.status === 'absent' || p.status === 'failed')
                  .length
              }
              )
            </span>
          </button>
        </div>
      </div>

      {/* History Items List */}
      <div className="space-y-2.5">
        {filteredList.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center">
            <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-white">No records found</h4>
            <p className="text-xs text-slate-400 mt-1">
              Delivered or absent parcels will automatically appear in this history view.
            </p>
          </div>
        ) : (
          filteredList.map((parcel) => {
            const isDelivered = parcel.status === 'delivered';

            return (
              <div
                key={parcel.id}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 shadow-sm hover:border-slate-700 transition-all space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isDelivered
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {isDelivered ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <AlertOctagon className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white truncate">
                          {parcel.recipientName}
                        </h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isDelivered
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {isDelivered ? 'Delivered' : 'Absent'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate">
                          {parcel.street} {parcel.houseNumber}, {parcel.city}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Timestamp */}
                  <div className="text-right shrink-0">
                    <span className="font-mono text-[11px] font-semibold text-slate-300 block">
                      {parcel.deliveryTime
                        ? new Date(parcel.deliveryTime).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Today'}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500 block truncate max-w-[100px]">
                      {parcel.trackingNumber}
                    </span>
                  </div>
                </div>

                {/* Proof badges & Action row */}
                <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-xs">
                  <div className="flex items-center gap-2">
                    {parcel.deliveryProofPhoto && (
                      <span className="flex items-center gap-1 text-[10px] text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded-md border border-cyan-800/40">
                        <Camera className="w-3 h-3" />
                        <span>Photo</span>
                      </span>
                    )}
                    {parcel.signatureData && (
                      <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-800/40">
                        <PenTool className="w-3 h-3" />
                        <span>Signature</span>
                      </span>
                    )}
                    {parcel.failureReason && (
                      <span className="text-[10px] text-rose-300 truncate max-w-[180px]">
                        {parcel.failureReason}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onSelectParcel(parcel)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Details</span>
                    </button>

                    <button
                      onClick={() => onReopenParcel(parcel)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 text-xs font-semibold flex items-center gap-1"
                      title="Move back to active tour"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Reopen</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
