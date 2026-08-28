import React from 'react';
import { 
  Building2, 
  Users2, 
  FileText, 
  Wrench, 
  ArrowUpRight, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Printer
} from 'lucide-react';
import { Property, Room, LeaseRenewal, WorkOrder, TenantLead, ActivityLog, NavigationTab } from '../types';
import { PriorityBadge, WorkOrderStatusBadge, RenewalStatusBadge, RoomStatusBadge } from './common/Badges';

interface DashboardViewProps {
  properties: Property[];
  rooms: Room[];
  renewals: LeaseRenewal[];
  workOrders: WorkOrder[];
  leads: TenantLead[];
  activityLogs: ActivityLog[];
  onSelectTab: (tab: NavigationTab) => void;
  onOpenRenewalLetterModal: (renewal: LeaseRenewal) => void;
  onOpenWorkOrderModal: (wo?: WorkOrder) => void;
  onOpenNewLeadModal: () => void;
  onOpenNewWorkOrderModal: () => void;
  onOpenAssistant: () => void;
  onPrintWorkOrder?: (workOrder: WorkOrder) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  properties,
  rooms,
  renewals,
  workOrders,
  leads,
  activityLogs,
  onSelectTab,
  onOpenRenewalLetterModal,
  onOpenWorkOrderModal,
  onOpenNewLeadModal,
  onOpenNewWorkOrderModal,
  onOpenAssistant,
  onPrintWorkOrder
}) => {
  // Key Stats Calculations
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter(r => r.status === 'Occupied').length;
  const availableRooms = rooms.filter(r => r.status === 'Available').length;
  const turnoverRooms = rooms.filter(r => r.status === 'Under Turnover').length;
  const reservedRooms = rooms.filter(r => r.status === 'Reserved').length;
  const occupancyRate = totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : '0';

  const totalMonthlyRentRoll = rooms
    .filter(r => r.status === 'Occupied')
    .reduce((sum, r) => sum + r.monthlyRent, 0);

  const potentialGrossRentRoll = rooms.reduce((sum, r) => sum + r.monthlyRent, 0);

  // Expirations
  const urgentRenewals = renewals.filter(
    r => r.daysUntilExpiration <= 30 && r.renewalStatus !== 'Renewed Signed' && r.renewalStatus !== 'Tenant Declined (Vacating)'
  );
  const next60DaysRenewals = renewals.filter(r => r.daysUntilExpiration > 30 && r.daysUntilExpiration <= 60);

  // Active Work Orders
  const openWorkOrders = workOrders.filter(w => w.status !== 'Completed' && w.status !== 'Cancelled');
  const emergencyWorkOrders = openWorkOrders.filter(w => w.priority === 'Emergency');
  const highWorkOrders = openWorkOrders.filter(w => w.priority === 'High');

  // Leads
  const activeLeads = leads.filter(l => l.stage !== 'Signed / Converted' && l.stage !== 'Lost / Archived');
  const highQualityLeads = activeLeads.filter(l => l.score >= 90);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome / Status Bar: Portfolio Overview */}
      <div className="bg-zinc-950 text-white p-6 sm:p-7 rounded-sm border border-zinc-800 shadow-xs flex flex-col items-center text-center gap-5">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-sm bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold uppercase tracking-wider mb-2.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Denver & Boulder Room Rental Operations</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white text-center">
            Portfolio Overview: Room Rentals
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1.5 max-w-2xl text-center">
            Managing <span className="font-semibold text-white">{properties.length} Coliving Properties</span> with <span className="font-semibold text-white">{totalRooms} Individual Rental Rooms</span>.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <div className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-sm text-center min-w-[110px]">
            <p className="text-[10px] uppercase font-bold text-zinc-400">Occupancy</p>
            <p className="text-lg font-light text-emerald-400 mt-0.5">{occupancyRate}%</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-sm text-center min-w-[130px]">
            <p className="text-[10px] uppercase font-bold text-zinc-400">Monthly Rent Roll</p>
            <p className="text-lg font-light text-indigo-400 mt-0.5">${totalMonthlyRentRoll.toLocaleString()}</p>
          </div>
          <button
            onClick={onOpenAssistant}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold uppercase tracking-wider text-xs px-4 py-2.5 rounded-sm shadow-xs transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Operations</span>
          </button>
        </div>
      </div>

      {/* 4 Geometric KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Room Occupancy */}
        <div 
          onClick={() => onSelectTab('properties')}
          className="bg-white p-5 rounded-sm border border-zinc-200 shadow-xs relative overflow-hidden flex flex-col justify-between cursor-pointer hover:border-indigo-500 transition-colors group"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-tight">Room Occupancy</span>
              <Building2 className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-3xl font-light text-zinc-900 mt-2">
              {occupiedRooms}<span className="text-sm font-normal text-zinc-400 ml-1">/ {totalRooms}</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center gap-2 text-xs flex-wrap">
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-tight">
              {availableRooms} Available
            </span>
            <span className="bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-tight">
              {turnoverRooms} Turnover
            </span>
          </div>
        </div>

        {/* Card 2: Lease Expirations */}
        <div 
          onClick={() => onSelectTab('renewals')}
          className="bg-white p-5 rounded-sm border border-zinc-200 shadow-xs relative overflow-hidden flex flex-col justify-between cursor-pointer hover:border-amber-500 transition-colors group"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-tight">Lease Renewals</span>
              <FileText className={`w-4 h-4 ${urgentRenewals.length > 0 ? 'text-amber-600' : 'text-zinc-400'}`} />
            </div>
            <div className="text-3xl font-light text-zinc-900 mt-2">
              {urgentRenewals.length}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-amber-700 font-semibold uppercase tracking-tight">
              Expiring &lt;30 days
            </span>
            <span className="text-[11px] text-indigo-600 font-bold uppercase tracking-wider group-hover:translate-x-0.5 transition-transform">
              Review &rarr;
            </span>
          </div>
        </div>

        {/* Card 3: Active Work Orders */}
        <div 
          onClick={() => onSelectTab('workorders')}
          className="bg-white p-5 rounded-sm border border-zinc-200 shadow-xs relative overflow-hidden flex flex-col justify-between cursor-pointer hover:border-rose-500 transition-colors group"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-tight">Open Work Orders</span>
              <Wrench className={`w-4 h-4 ${emergencyWorkOrders.length > 0 ? 'text-rose-600' : 'text-zinc-400'}`} />
            </div>
            <div className="text-3xl font-light text-zinc-900 mt-2">
              {openWorkOrders.length}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center gap-2 text-xs flex-wrap">
            {emergencyWorkOrders.length > 0 && (
              <span className="bg-rose-100 text-rose-800 border border-rose-300 px-1.5 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-tight">
                ● {emergencyWorkOrders.length} Emergency
              </span>
            )}
            <span className="bg-zinc-100 text-zinc-700 border border-zinc-200 px-1.5 py-0.5 rounded-sm text-[10px] font-medium uppercase tracking-tight">
              {highWorkOrders.length} High Priority
            </span>
          </div>
        </div>

        {/* Card 4: Tenant Leads CRM */}
        <div 
          onClick={() => onSelectTab('leads')}
          className="bg-white p-5 rounded-sm border border-zinc-200 shadow-xs relative overflow-hidden flex flex-col justify-between cursor-pointer hover:border-emerald-500 transition-colors group"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-tight">Prospect Leads</span>
              <Users2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-light text-zinc-900 mt-2">
              {activeLeads.length}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-emerald-700 font-semibold uppercase tracking-tight">
              {highQualityLeads.length} High-Score Leads
            </span>
            <span className="text-[11px] text-indigo-600 font-bold uppercase tracking-wider group-hover:translate-x-0.5 transition-transform">
              Pipeline &rarr;
            </span>
          </div>
        </div>
      </div>

      {/* Tenant Portal Quick Access Banner */}
      <div className="bg-zinc-900 text-white rounded-sm p-4 border border-zinc-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm bg-indigo-600 flex items-center justify-center font-bold text-white shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-200">Self-Service Resident Portal</h3>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded-sm font-semibold">Live & Active</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Tenants can submit maintenance work orders, upload issue photos, grant entry permissions, and track real-time ticket progress.
            </p>
          </div>
        </div>
        <button
          onClick={() => onSelectTab('tenant-portal')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-sm transition shrink-0 flex items-center justify-center gap-1.5 shadow-xs"
        >
          <span>Open Tenant Portal</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Property & Room Occupancy Matrix */}
      <div className="bg-white rounded-sm border border-zinc-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-zinc-100 bg-zinc-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <h2 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
              Room Inventory & Occupancy Matrix
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-zinc-600 text-[11px] font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Occupied ({occupiedRooms})</span>
            </span>
            <span className="flex items-center gap-1.5 text-zinc-600 text-[11px] font-medium">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              <span>Available ({availableRooms})</span>
            </span>
            <span className="flex items-center gap-1.5 text-zinc-600 text-[11px] font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>Turnover ({turnoverRooms})</span>
            </span>
            <button 
              onClick={() => onSelectTab('properties')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider ml-2"
            >
              Manage Inventory &rarr;
            </button>
          </div>
        </div>

        {/* Matrix Grid */}
        <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {properties.map(property => {
            const propertyRooms = rooms.filter(r => r.propertyId === property.id);
            const propOccupied = propertyRooms.filter(r => r.status === 'Occupied').length;
            const propRate = propertyRooms.length > 0 ? ((propOccupied / propertyRooms.length) * 100).toFixed(0) : '0';
            const propRevenue = propertyRooms.filter(r => r.status === 'Occupied').reduce((s, r) => s + r.monthlyRent, 0);

            return (
              <div 
                key={property.id}
                className="bg-zinc-50/70 rounded-sm p-4 border border-zinc-200 hover:border-zinc-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-zinc-900 text-xs uppercase tracking-tight">{property.name}</h3>
                      <span className="text-[10px] bg-zinc-200 text-zinc-700 px-1.5 py-0.2 rounded-sm font-semibold uppercase">
                        {property.propertyType}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-0.5">{property.address}, {property.city} • Owner: {property.ownerName}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-tight text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-sm">
                      {propOccupied}/{propertyRooms.length} Occupied ({propRate}%)
                    </span>
                    <p className="text-[11px] font-mono text-zinc-600 mt-1">${propRevenue.toLocaleString()}/mo</p>
                  </div>
                </div>

                {/* Rooms chips in this property */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                  {propertyRooms.map(room => (
                    <div 
                      key={room.id}
                      onClick={() => onSelectTab('properties')}
                      className={`p-2.5 rounded-sm border text-xs cursor-pointer transition-colors ${
                        room.status === 'Occupied'
                          ? 'bg-white border-zinc-200 hover:border-emerald-500'
                          : room.status === 'Available'
                          ? 'bg-indigo-50/60 border-indigo-200 hover:border-indigo-500'
                          : room.status === 'Under Turnover'
                          ? 'bg-amber-50/60 border-amber-200 hover:border-amber-500'
                          : 'bg-zinc-100 border-zinc-300 hover:border-zinc-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-800 text-xs flex items-center gap-1">
                          {room.roomNumber} <span className="font-normal text-zinc-500 text-[10px]">({room.bathroomType.includes('Private') ? 'Ensuite' : 'Shared'})</span>
                          {room.notes && (
                            <span 
                              title={`Note: ${room.notes}`} 
                              className="inline-flex text-zinc-400 hover:text-indigo-600"
                            >
                              <FileText className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </span>
                        <span className="font-semibold text-zinc-900 font-mono text-xs">${room.monthlyRent}</span>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-[11px]">
                        {room.status === 'Occupied' ? (
                          <span className="text-zinc-600 truncate font-medium max-w-[120px]">
                            {room.currentTenantName}
                          </span>
                        ) : (
                          <span className={`font-semibold text-[10px] uppercase tracking-tight ${
                            room.status === 'Available' ? 'text-indigo-700' : room.status === 'Under Turnover' ? 'text-amber-700' : 'text-zinc-700'
                          }`}>
                            {room.status === 'Available' ? 'Ready to Rent' : room.status === 'Under Turnover' ? 'Turnover/Prep' : 'Reserved'}
                          </span>
                        )}
                        <RoomStatusBadge status={room.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two-Column Action Grid: Urgent Renewals & High Priority Work Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Upcoming Lease Renewals (Action Center) */}
        <div className="bg-white rounded-sm border border-zinc-200 shadow-xs flex flex-col justify-between overflow-hidden">
          <div>
            <div className="px-5 py-3.5 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  Upcoming Lease Renewals
                </h3>
              </div>
              <button 
                onClick={() => onSelectTab('renewals')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider"
              >
                View All ({renewals.length}) &rarr;
              </button>
            </div>

            <div className="divide-y divide-zinc-100">
              {urgentRenewals.slice(0, 4).map(ren => (
                <div key={ren.id} className="p-4 flex items-start justify-between gap-3 hover:bg-zinc-50/60 transition-colors">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-zinc-900 text-xs truncate">{ren.tenantName}</p>
                      <RenewalStatusBadge status={ren.renewalStatus} />
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-0.5 truncate">
                      {ren.propertyName} • <span className="font-medium text-zinc-700">{ren.roomName}</span>
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-zinc-600">
                      <span>Expires: <strong className="text-zinc-900 font-mono">{ren.currentLeaseEndDate}</strong></span>
                      <span>Rent: ${ren.currentMonthlyRent} &rarr; <strong className="text-emerald-700 font-mono">${ren.proposedMonthlyRent}/mo</strong></span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-tight ${
                      ren.daysUntilExpiration <= 7 ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      {ren.daysUntilExpiration} days left
                    </span>
                    <button
                      onClick={() => onOpenRenewalLetterModal(ren)}
                      className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-white rounded-sm text-[11px] font-medium transition"
                    >
                      Renewal Letter
                    </button>
                  </div>
                </div>
              ))}
              {urgentRenewals.length === 0 && (
                <div className="p-6 text-center text-xs text-zinc-500">
                  No leases expiring within the next 30 days.
                </div>
              )}
            </div>
          </div>

          <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50/50 text-right">
            <button
              onClick={() => onSelectTab('renewals')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold uppercase tracking-wider"
            >
              Open Renewal Manager & Rate Calculator &rarr;
            </button>
          </div>
        </div>

        {/* Right: Urgent & High Work Orders */}
        <div className="bg-white rounded-sm border border-zinc-200 shadow-xs flex flex-col justify-between overflow-hidden">
          <div>
            <div className="px-5 py-3.5 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  Active Maintenance & Work Orders
                </h3>
              </div>
              <button 
                onClick={() => onSelectTab('workorders')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider"
              >
                Kanban View ({openWorkOrders.length}) &rarr;
              </button>
            </div>

            <div className="divide-y divide-zinc-100">
              {openWorkOrders.slice(0, 4).map(wo => (
                <div key={wo.id} className="p-4 flex items-start justify-between gap-3 hover:bg-zinc-50/60 transition-colors">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-indigo-600">{wo.ticketNumber}</span>
                      <PriorityBadge priority={wo.priority} />
                      <WorkOrderStatusBadge status={wo.status} />
                    </div>
                    <p className="font-semibold text-zinc-900 text-xs mt-1 truncate">{wo.title}</p>
                    <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                      {wo.propertyName} ({wo.roomName || 'Common Area'})
                    </p>
                    <p className="text-[11px] text-zinc-600 mt-0.5">
                      Vendor: <span className="font-medium text-zinc-800">{wo.assignedVendorName || 'Unassigned'}</span>
                    </p>
                  </div>

                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <span className="text-[10px] text-zinc-400 font-mono">{wo.dateReported}</span>
                    <div className="flex items-center gap-1">
                      {onPrintWorkOrder && (
                        <button
                          onClick={() => onPrintWorkOrder(wo)}
                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-sm text-[11px] font-semibold flex items-center gap-1 transition"
                          title="Print work order slip"
                        >
                          <Printer className="w-3 h-3 text-amber-700" />
                          <span>Print</span>
                        </button>
                      )}
                      <button
                        onClick={() => onOpenWorkOrderModal(wo)}
                        className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-sm text-[11px] font-medium border border-zinc-200 transition"
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {openWorkOrders.length === 0 && (
                <div className="p-6 text-center text-xs text-zinc-500">
                  All work order tickets are completed.
                </div>
              )}
            </div>
          </div>

          <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50/50 text-right">
            <button
              onClick={() => onSelectTab('workorders')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold uppercase tracking-wider"
            >
              Open Maintenance Work Orders Kanban &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Qualified Leads & Recent CRM Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: High-Scoring Leads */}
        <div className="lg:col-span-2 bg-white rounded-sm border border-zinc-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users2 className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                Qualified Tenant Leads (Roommate Screening)
              </h3>
            </div>
            <button 
              onClick={() => onSelectTab('leads')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider"
            >
              Pipeline CRM &rarr;
            </button>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
            {highQualityLeads.slice(0, 4).map(lead => (
              <div 
                key={lead.id}
                onClick={() => onSelectTab('leads')}
                className="p-3.5 rounded-sm border border-zinc-200 hover:border-indigo-500 bg-zinc-50/50 hover:bg-white transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-900 text-xs uppercase tracking-tight">{lead.name}</span>
                  <span className="px-1.5 py-0.5 rounded-sm text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                    ★ {lead.score} Score
                  </span>
                </div>
                <p className="text-[11px] text-zinc-600 font-medium mt-1 truncate">{lead.occupation}</p>
                <div className="mt-2 text-[11px] text-zinc-500 flex flex-wrap gap-x-3 gap-y-1">
                  <span>Budget: <strong className="text-zinc-800 font-mono">${lead.maxBudget}/mo</strong></span>
                  <span>Move-in: <strong className="text-zinc-800 font-mono">{lead.targetMoveInDate}</strong></span>
                  <span>Bath: <strong>{lead.preferredBathroom}</strong></span>
                </div>
                <div className="mt-2.5 pt-2 border-t border-zinc-200 flex items-center justify-between text-[11px]">
                  <span className="text-zinc-500 text-[10px] uppercase font-semibold">Stage: <strong className="text-zinc-800">{lead.stage}</strong></span>
                  <span className="text-indigo-600 font-bold uppercase tracking-wider text-[10px]">Match Room &rarr;</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Recent Operations Log */}
        <div className="bg-white rounded-sm border border-zinc-200 shadow-xs flex flex-col justify-between overflow-hidden">
          <div>
            <div className="px-5 py-3.5 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-zinc-500" />
                <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  Live Operations Log
                </h3>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono">Real-time</span>
            </div>

            <div className="divide-y divide-zinc-100 p-4 space-y-2">
              {activityLogs.slice(0, 5).map(log => (
                <div key={log.id} className="pt-2 first:pt-0">
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                    <span className="font-bold uppercase text-zinc-600">{log.category}</span>
                    <span>{log.timestamp}</span>
                  </div>
                  <p className="text-zinc-800 text-xs mt-0.5 leading-snug">{log.message}</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">By: {log.user}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50/50 text-center">
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">Moyer Property Management v2.4</span>
          </div>
        </div>
      </div>
    </div>
  );
};

