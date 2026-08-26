import React, { useState } from 'react';
import { 
  FileText, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Send, 
  Plus, 
  Edit3, 
  Printer, 
  TrendingUp, 
  Filter,
  Check,
  Building,
  User,
  Sparkles
} from 'lucide-react';
import { LeaseRenewal, LeaseRenewalStatus, Room, Property } from '../types';
import { RenewalStatusBadge } from './common/Badges';

interface LeaseRenewalsViewProps {
  renewals: LeaseRenewal[];
  rooms: Room[];
  properties: Property[];
  onUpdateRenewal: (renewal: LeaseRenewal) => void;
  onOpenNewRenewalModal: () => void;
  onOpenRenewalLetterModal: (renewal: LeaseRenewal) => void;
  onOpenAssistant: () => void;
}

export const LeaseRenewalsView: React.FC<LeaseRenewalsViewProps> = ({
  renewals,
  rooms,
  properties,
  onUpdateRenewal,
  onOpenNewRenewalModal,
  onOpenRenewalLetterModal,
  onOpenAssistant
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all'); // all, 30days, 60days, 90days
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Rate Adjustment Global Simulator State
  const [bulkAdjustmentPercent, setBulkAdjustmentPercent] = useState<number>(3.5);

  // Filter renewals
  const filteredRenewals = renewals.filter(ren => {
    if (statusFilter !== 'all' && ren.renewalStatus !== statusFilter) return false;
    if (propertyFilter !== 'all' && ren.propertyId !== propertyFilter) return false;
    if (timeFilter === '30days' && ren.daysUntilExpiration > 30) return false;
    if (timeFilter === '60days' && ren.daysUntilExpiration > 60) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        ren.tenantName.toLowerCase().includes(q) ||
        ren.propertyName.toLowerCase().includes(q) ||
        ren.roomName.toLowerCase().includes(q) ||
        ren.tenantEmail.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // KPI Calculations
  const urgentCount = renewals.filter(r => r.daysUntilExpiration <= 30 && r.renewalStatus !== 'Renewed Signed' && r.renewalStatus !== 'Tenant Declined (Vacating)').length;
  const acceptedCount = renewals.filter(r => r.renewalStatus === 'Tenant Accepted' || r.renewalStatus === 'Renewed Signed').length;
  const vacatingCount = renewals.filter(r => r.renewalStatus === 'Tenant Declined (Vacating)').length;
  
  // Total Rent Delta
  const totalMonthlyGain = renewals.reduce((sum, r) => sum + (r.proposedMonthlyRent - r.currentMonthlyRent), 0);
  const annualizedGain = totalMonthlyGain * 12;

  // 1-Click Status Advance
  const handleQuickStatusChange = (renewal: LeaseRenewal, newStatus: LeaseRenewalStatus) => {
    onUpdateRenewal({
      ...renewal,
      renewalStatus: newStatus,
      lastContactDate: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* View Header */}
      <div className="bg-white rounded-sm p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h1 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Tenant Lease Renewal Management
            </h1>
            {urgentCount > 0 && (
              <span className="bg-red-100 text-red-800 border border-red-300 text-[10px] px-2 py-0.5 rounded-sm font-bold uppercase tracking-tight">
                {urgentCount} Expiring Soon
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track 30/60/90-day room lease expirations, rate increases, and generate formal renewal notices.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenAssistant}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>AI Notice Drafter</span>
          </button>

          <button
            onClick={onOpenNewRenewalModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Record Lease Renewal</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-sm p-5 border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-tight text-slate-400">Total Tracked Leases</span>
          <p className="text-3xl font-light text-slate-900 mt-2">{renewals.length}</p>
          <p className="text-xs text-slate-500 mt-1">Room contracts in portfolio</p>
        </div>

        <div className="bg-white rounded-sm p-5 border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-tight text-red-600">Expiring &le; 30 Days</span>
          <p className="text-3xl font-light text-red-600 mt-2">{urgentCount}</p>
          <p className="text-xs text-slate-500 mt-1">Urgent response required</p>
        </div>

        <div className="bg-white rounded-sm p-5 border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-tight text-emerald-600">Renewals Accepted</span>
          <p className="text-3xl font-light text-emerald-600 mt-2">{acceptedCount}</p>
          <p className="text-xs text-slate-500 mt-1">{vacatingCount} vacating / scheduled turnover</p>
        </div>

        <div className="bg-white rounded-sm p-5 border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-tight text-amber-600">Projected Annual Lift</span>
          <p className="text-3xl font-light text-amber-600 mt-2 font-mono">+${annualizedGain.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1 font-mono">+${totalMonthlyGain}/mo across portfolio</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-sm p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-sm font-semibold uppercase tracking-tight transition-colors ${statusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              All ({renewals.length})
            </button>
            <button
              onClick={() => setStatusFilter('Review Pending')}
              className={`px-3 py-1.5 rounded-sm font-semibold uppercase tracking-tight transition-colors ${statusFilter === 'Review Pending' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              Review Pending ({renewals.filter(r => r.renewalStatus === 'Review Pending').length})
            </button>
            <button
              onClick={() => setStatusFilter('Notice Sent')}
              className={`px-3 py-1.5 rounded-sm font-semibold uppercase tracking-tight transition-colors ${statusFilter === 'Notice Sent' ? 'bg-blue-700 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
            >
              Notice Sent ({renewals.filter(r => r.renewalStatus === 'Notice Sent').length})
            </button>
            <button
              onClick={() => setStatusFilter('Negotiating Terms')}
              className={`px-3 py-1.5 rounded-sm font-semibold uppercase tracking-tight transition-colors ${statusFilter === 'Negotiating Terms' ? 'bg-amber-700 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
            >
              Negotiating ({renewals.filter(r => r.renewalStatus === 'Negotiating Terms').length})
            </button>
            <button
              onClick={() => setStatusFilter('Tenant Accepted')}
              className={`px-3 py-1.5 rounded-sm font-semibold uppercase tracking-tight transition-colors ${statusFilter === 'Tenant Accepted' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
            >
              Accepted ({renewals.filter(r => r.renewalStatus === 'Tenant Accepted').length})
            </button>
            <button
              onClick={() => setStatusFilter('Tenant Declined (Vacating)')}
              className={`px-3 py-1.5 rounded-sm font-semibold uppercase tracking-tight transition-colors ${statusFilter === 'Tenant Declined (Vacating)' ? 'bg-red-700 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
            >
              Vacating ({renewals.filter(r => r.renewalStatus === 'Tenant Declined (Vacating)').length})
            </button>
          </div>

          {/* Time & Search */}
          <div className="flex items-center gap-2.5">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-sm px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Timelines</option>
              <option value="30days">&le; 30 Days (Urgent)</option>
              <option value="60days">&le; 60 Days</option>
            </select>

            <select
              value={propertyFilter}
              onChange={(e) => setPropertyFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-sm px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Properties</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Search tenant or room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-sm px-3 py-1.5 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-44"
            />
          </div>
        </div>
      </div>

      {/* Renewals Table & Action Cards */}
      <div className="space-y-3">
        {filteredRenewals.length === 0 ? (
          <div className="bg-white rounded-sm p-8 text-center text-slate-400 border border-slate-200">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50 text-slate-400" />
            <p className="font-semibold text-xs uppercase tracking-wider">No lease renewals match your active filters.</p>
          </div>
        ) : (
          filteredRenewals.map(renewal => {
            const deltaRent = renewal.proposedMonthlyRent - renewal.currentMonthlyRent;
            const percentIncrease = ((deltaRent / renewal.currentMonthlyRent) * 100).toFixed(1);

            return (
              <div 
                key={renewal.id}
                className={`bg-white rounded-sm p-5 border shadow-xs transition-colors ${
                  renewal.daysUntilExpiration <= 7 && renewal.renewalStatus !== 'Renewed Signed' && renewal.renewalStatus !== 'Tenant Declined (Vacating)'
                    ? 'border-red-400'
                    : renewal.daysUntilExpiration <= 30 && renewal.renewalStatus !== 'Renewed Signed' && renewal.renewalStatus !== 'Tenant Declined (Vacating)'
                    ? 'border-amber-300'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Tenant & Room Info */}
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-bold text-slate-900 text-sm uppercase tracking-tight">{renewal.tenantName}</h3>
                      <RenewalStatusBadge status={renewal.renewalStatus} />
                      <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold font-mono uppercase tracking-tight ${
                        renewal.daysUntilExpiration <= 7
                          ? 'bg-red-100 text-red-800 border border-red-300'
                          : renewal.daysUntilExpiration <= 30
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        ⏱️ {renewal.daysUntilExpiration} days left
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 flex items-center gap-3 flex-wrap">
                      <span className="font-semibold text-slate-800">{renewal.propertyName}</span>
                      <span>•</span>
                      <span className="font-medium text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-sm border border-slate-200">
                        {renewal.roomName}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 flex items-center gap-4 flex-wrap pt-0.5">
                      <span>Email: <strong className="text-slate-700 font-mono">{renewal.tenantEmail}</strong></span>
                      <span>Phone: <strong className="text-slate-700 font-mono">{renewal.tenantPhone}</strong></span>
                      <span>Current Lease End: <strong className="text-slate-900 font-mono">{renewal.currentLeaseEndDate}</strong></span>
                    </div>

                    {renewal.tenantResponseNotes && (
                      <div className="mt-2 text-xs bg-slate-50 p-2.5 rounded-sm border border-slate-200 text-slate-700">
                        <strong className="text-slate-900">Tenant Feedback: </strong>
                        {renewal.tenantResponseNotes}
                      </div>
                    )}
                  </div>

                  {/* Middle: Rent Adjustment Calculator View */}
                  <div className="bg-slate-50 rounded-sm p-3 border border-slate-200 text-xs min-w-[220px] space-y-1.5">
                    <div className="flex justify-between items-baseline">
                      <span className="text-slate-500">Current Monthly:</span>
                      <span className="font-light text-slate-800 font-mono text-sm">${renewal.currentMonthlyRent}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-slate-500">Proposed Rate:</span>
                      <div className="text-right">
                        <span className="font-semibold text-emerald-700 font-mono text-sm">${renewal.proposedMonthlyRent}</span>
                        <span className="text-[10px] text-emerald-600 font-semibold ml-1.5">(+{percentIncrease}%)</span>
                      </div>
                    </div>
                    <div className="pt-1 border-t border-slate-200 flex justify-between text-[11px]">
                      <span className="text-slate-500">Proposed Term:</span>
                      <span className="font-medium text-slate-800">{renewal.proposedTermMonths} Months</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Decision Deadline:</span>
                      <span className="font-medium text-slate-800 font-mono">{renewal.decisionDeadline}</span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2 shrink-0">
                    <button
                      onClick={() => onOpenRenewalLetterModal(renewal)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Renewal Notice</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {renewal.renewalStatus !== 'Tenant Accepted' && renewal.renewalStatus !== 'Renewed Signed' && (
                        <button
                          onClick={() => handleQuickStatusChange(renewal, 'Tenant Accepted')}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-sm text-xs font-semibold uppercase tracking-tight transition-colors flex items-center gap-1"
                          title="Record that tenant agreed to renewal"
                        >
                          <Check className="w-3 h-3" />
                          <span>Accept</span>
                        </button>
                      )}

                      {renewal.renewalStatus !== 'Tenant Declined (Vacating)' && (
                        <button
                          onClick={() => handleQuickStatusChange(renewal, 'Tenant Declined (Vacating)')}
                          className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-800 border border-red-300 rounded-sm text-xs font-semibold uppercase tracking-tight transition-colors"
                          title="Record that tenant is vacating"
                        >
                          Vacating
                        </button>
                      )}

                      <button
                        onClick={() => handleQuickStatusChange(renewal, 'Notice Sent')}
                        className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-sm text-xs font-medium uppercase tracking-tight"
                        title="Mark Notice as Sent"
                      >
                        Mark Sent
                      </button>
                    </div>
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
