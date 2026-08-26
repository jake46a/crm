import React, { useState } from 'react';
import { 
  Wrench, 
  Users2, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  Building, 
  Star, 
  Edit2, 
  Trash2, 
  MessageSquare, 
  ShieldCheck, 
  Award, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Briefcase,
  Layers,
  FileCheck
} from 'lucide-react';
import { Contact, Property, WorkOrder, TenantLead } from '../types';

interface VendorsAgentsViewProps {
  contacts: Contact[];
  properties: Property[];
  workOrders: WorkOrder[];
  leads: TenantLead[];
  onOpenNewContactModal: (defaultType?: 'Vendor / Contractor' | 'Leasing Agent') => void;
  onOpenEditContactModal: (contact: Contact) => void;
  onOpenDeleteContactModal: (contact: Contact) => void;
  onNavigateToWorkOrders?: (vendorFilterQuery?: string) => void;
  onNavigateToLeads?: (agentFilterQuery?: string) => void;
}

export const VendorsAgentsView: React.FC<VendorsAgentsViewProps> = ({
  contacts,
  properties,
  workOrders,
  leads,
  onOpenNewContactModal,
  onOpenEditContactModal,
  onOpenDeleteContactModal,
  onNavigateToWorkOrders,
  onNavigateToLeads
}) => {
  const [activeSection, setActiveSection] = useState<'all' | 'vendors' | 'agents'>('all');
  const [tradeFilter, setTradeFilter] = useState<string>('all');
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Quick SMS State
  const [quickSmsContact, setQuickSmsContact] = useState<Contact | null>(null);
  const [smsText, setSmsText] = useState<string>('');
  const [smsSent, setSmsSent] = useState<boolean>(false);

  // Filter contacts to only Vendors/Contractors and Leasing Agents
  const allTeamMembers = contacts.filter(
    c => c.type === 'Vendor / Contractor' || c.type === 'Leasing Agent'
  );

  const vendors = contacts.filter(c => c.type === 'Vendor / Contractor');
  const agents = contacts.filter(c => c.type === 'Leasing Agent');

  // Filter based on active controls
  const filteredList = allTeamMembers.filter(member => {
    if (activeSection === 'vendors' && member.type !== 'Vendor / Contractor') return false;
    if (activeSection === 'agents' && member.type !== 'Leasing Agent') return false;

    if (activeSection === 'vendors' || activeSection === 'all') {
      if (tradeFilter !== 'all') {
        const trade = member.tradeCategory || member.roleOrSpecialty || '';
        if (!trade.toLowerCase().includes(tradeFilter.toLowerCase())) return false;
      }
    }

    if (propertyFilter !== 'all') {
      const assignedProps = member.assignedProperties || (member.propertyId ? [member.propertyId] : []);
      if (!assignedProps.includes(propertyFilter)) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = member.name.toLowerCase().includes(q);
      const matchCompany = member.company?.toLowerCase().includes(q);
      const matchEmail = member.email.toLowerCase().includes(q);
      const matchPhone = member.phone.toLowerCase().includes(q);
      const matchSpecialty = member.roleOrSpecialty?.toLowerCase().includes(q);
      const matchTrade = member.tradeCategory?.toLowerCase().includes(q);
      const matchLicense = member.licenseNumber?.toLowerCase().includes(q);
      const matchNotes = member.notes?.toLowerCase().includes(q);
      return matchName || matchCompany || matchEmail || matchPhone || matchSpecialty || matchTrade || matchLicense || matchNotes;
    }

    return true;
  });

  // Calculate metrics
  const activeVendorsCount = vendors.length;
  const emergencyVendorsCount = vendors.filter(v => v.emergencyAvailable || v.status === 'Available 24/7').length;
  const activeAgentsCount = agents.length;
  const openWorkOrdersAssigned = workOrders.filter(
    w => w.status !== 'Completed' && w.status !== 'Cancelled' && w.assignedVendorId
  ).length;
  const activeLeadsAssigned = leads.filter(
    l => l.stage !== 'Signed / Converted' && l.stage !== 'Lost / Archived' && l.assignedAgent
  ).length;

  const handleSendSms = () => {
    if (!smsText.trim()) return;
    setSmsSent(true);
    setTimeout(() => {
      setSmsSent(false);
      setQuickSmsContact(null);
      setSmsText('');
    }, 1400);
  };

  const TRADE_CATEGORIES = [
    { id: 'all', label: 'All Trades' },
    { id: 'Plumbing', label: 'Plumbing' },
    { id: 'Electrical', label: 'Electrical' },
    { id: 'HVAC', label: 'HVAC / Heat' },
    { id: 'Appliance', label: 'Appliances' },
    { id: 'Cleaning', label: 'Cleaning' },
    { id: 'Handyman', label: 'Handyman' },
    { id: 'Locks', label: 'Locks & Access' }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Actions */}
      <div className="bg-white rounded-sm p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-sm bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              <Briefcase className="w-3.5 h-3.5" />
            </div>
            <h1 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Vendors, Contractors & Leasing Agents
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dispatch trade contractors, schedule maintenance specialists, and coordinate licensed coliving leasing agents.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenNewContactModal('Vendor / Contractor')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs"
          >
            <Wrench className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ Add Vendor</span>
          </button>

          <button
            onClick={() => onOpenNewContactModal('Leasing Agent')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs"
          >
            <Users2 className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ Add Leasing Agent</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-sm p-3.5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Vendors</span>
            <Wrench className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-slate-900">{activeVendorsCount}</span>
            <span className="text-[11px] text-emerald-600 font-semibold">{emergencyVendorsCount} 24/7 ready</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Plumbers, HVAC, electrical, clean</p>
        </div>

        <div className="bg-white rounded-sm p-3.5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Leasing Agents</span>
            <Users2 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-slate-900">{activeAgentsCount}</span>
            <span className="text-[11px] text-purple-700 font-semibold font-mono">100% Licensed</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Denver & Boulder metro hubs</p>
        </div>

        <div className="bg-white rounded-sm p-3.5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active WO Dispatched</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-slate-900">{openWorkOrdersAssigned}</span>
            <span className="text-[11px] text-slate-500 font-medium">tickets in progress</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Assigned to trade contractors</p>
        </div>

        <div className="bg-white rounded-sm p-3.5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Leads Assigned</span>
            <Star className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-slate-900">{activeLeadsAssigned}</span>
            <span className="text-[11px] text-emerald-600 font-semibold font-mono">Tours / screening</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Managed by leasing coordinators</p>
        </div>
      </div>

      {/* Main Filter and Segment Navigation */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Section Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => { setActiveSection('all'); setTradeFilter('all'); }}
              className={`px-3.5 py-1.5 rounded-sm text-xs font-semibold uppercase tracking-tight transition-colors whitespace-nowrap border ${
                activeSection === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              All Team & Partners ({allTeamMembers.length})
            </button>

            <button
              onClick={() => { setActiveSection('vendors'); }}
              className={`px-3.5 py-1.5 rounded-sm text-xs font-semibold uppercase tracking-tight transition-colors whitespace-nowrap border flex items-center gap-1.5 ${
                activeSection === 'vendors'
                  ? 'bg-amber-700 text-white border-amber-700 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Wrench className="w-3.5 h-3.5 text-amber-500" />
              <span>Vendors & Contractors</span>
              <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-sm font-bold font-mono">
                {vendors.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveSection('agents'); setTradeFilter('all'); }}
              className={`px-3.5 py-1.5 rounded-sm text-xs font-semibold uppercase tracking-tight transition-colors whitespace-nowrap border flex items-center gap-1.5 ${
                activeSection === 'agents'
                  ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Users2 className="w-3.5 h-3.5 text-purple-300" />
              <span>Leasing Agents</span>
              <span className="text-[10px] bg-purple-100 text-purple-900 px-1.5 py-0.2 rounded-sm font-bold font-mono">
                {agents.length}
              </span>
            </button>
          </div>

          {/* Search Input */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={propertyFilter}
              onChange={(e) => setPropertyFilter(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-sm px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Coverage Properties</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                placeholder="Search trade, license, name, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded-sm pl-8 pr-3 py-1.5 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1.5 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Trade sub-filters if viewing Vendors or All */}
        {(activeSection === 'vendors' || activeSection === 'all') && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-bold mr-1 shrink-0">Trade Filter:</span>
            {TRADE_CATEGORIES.map(trade => (
              <button
                key={trade.id}
                onClick={() => setTradeFilter(trade.id)}
                className={`px-2.5 py-1 rounded-sm text-[11px] font-medium transition-colors whitespace-nowrap border ${
                  tradeFilter === trade.id
                    ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {trade.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cards Directory Grid */}
      {filteredList.length === 0 ? (
        <div className="bg-white rounded-sm border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">No vendors or leasing agents found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search criteria, trade category filter, or property coverage selector.
          </p>
          <div className="flex justify-center gap-2 pt-2">
            <button
              onClick={() => { setSearchQuery(''); setTradeFilter('all'); setPropertyFilter('all'); setActiveSection('all'); }}
              className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-sm text-xs font-semibold hover:bg-slate-50"
            >
              Reset Filters
            </button>
            <button
              onClick={() => onOpenNewContactModal('Vendor / Contractor')}
              className="px-3.5 py-1.5 bg-amber-600 text-white rounded-sm text-xs font-semibold hover:bg-amber-700"
            >
              + Add New Vendor
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredList.map(item => {
            const isVendor = item.type === 'Vendor / Contractor';
            const isAgent = item.type === 'Leasing Agent';
            
            // Work orders assigned to this vendor
            const assignedWOs = workOrders.filter(
              w => w.assignedVendorId === item.id || w.assignedVendorName === item.name
            );
            const activeWOs = assignedWOs.filter(
              w => w.status !== 'Completed' && w.status !== 'Cancelled'
            );

            // Leads assigned to this agent
            const assignedLeadsList = leads.filter(
              l => l.assignedAgent === item.name
            );
            const activeLeadsList = assignedLeadsList.filter(
              l => l.stage !== 'Signed / Converted' && l.stage !== 'Lost / Archived'
            );

            return (
              <div
                key={item.id}
                className="bg-white rounded-sm border border-slate-200 shadow-xs hover:border-slate-400 transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-4 space-y-3">
                  {/* Top Bar: Avatar, Name, and Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-sm flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0 ${item.avatarBg}`}>
                        {item.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 text-xs leading-snug truncate group-hover:text-blue-600 transition-colors">
                          {item.name}
                        </h3>
                        {item.company && (
                          <p className="text-[11px] text-slate-500 font-medium truncate">{item.company}</p>
                        )}
                      </div>
                    </div>

                    <span className={`text-[10px] px-2 py-0.5 rounded-sm font-bold uppercase tracking-tight border shrink-0 ${
                      isVendor ? 'bg-amber-50 text-amber-800 border-amber-200' :
                      isAgent ? 'bg-purple-50 text-purple-800 border-purple-200' :
                      'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {isVendor ? 'Vendor / Trade' : isAgent ? 'Leasing Agent' : item.type}
                    </span>
                  </div>

                  {/* Specialty / Trade & Rate / License Details */}
                  {isVendor && (
                    <div className="bg-amber-50/40 p-2.5 rounded-sm border border-amber-200/80 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-950 truncate">
                          {item.roleOrSpecialty || item.tradeCategory || 'Master Trade Specialist'}
                        </span>
                        {item.hourlyRate && (
                          <span className="font-mono font-bold text-slate-900 shrink-0 ml-1">
                            ${item.hourlyRate}/hr
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px]">
                        {(item.emergencyAvailable || item.status === 'Available 24/7') && (
                          <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.2 rounded-sm font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>24/7 Emergency Dispatch</span>
                          </span>
                        )}

                        {item.w9OnRecord && (
                          <span className="bg-slate-100 text-slate-700 border border-slate-300 px-1.5 py-0.2 rounded-sm font-medium flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>W-9 Verified</span>
                          </span>
                        )}

                        {item.rating && (
                          <span className="text-amber-600 font-bold font-mono">
                            ★ {item.rating}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {isAgent && (
                    <div className="bg-purple-50/40 p-2.5 rounded-sm border border-purple-200/80 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-purple-950 truncate">
                          {item.roleOrSpecialty || 'Licensed Leasing Agent'}
                        </span>
                        {item.rating && (
                          <span className="text-amber-600 font-bold font-mono text-[11px] shrink-0">
                            ★ {item.rating}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[10px]">
                        {item.licenseNumber && (
                          <span className="bg-purple-100 text-purple-900 border border-purple-300 px-1.5 py-0.2 rounded-sm font-mono font-bold">
                            Lic: {item.licenseNumber}
                          </span>
                        )}

                        {item.commissionRate && (
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded-sm font-medium">
                            Split: {item.commissionRate}
                          </span>
                        )}
                      </div>

                      {/* Covered Properties list */}
                      {item.assignedPropertyNames && item.assignedPropertyNames.length > 0 && (
                        <div className="text-[11px] text-slate-600 pt-1 border-t border-purple-100">
                          <span className="text-slate-400 font-medium">Coverage: </span>
                          <span className="font-semibold text-slate-800">{item.assignedPropertyNames.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Active Workload / Assignments Pill */}
                  {isVendor && (
                    <div className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-sm border border-slate-200">
                      <span className="text-slate-500 font-medium">Active Work Orders:</span>
                      <span className={`font-mono font-bold px-2 py-0.5 rounded-sm text-[11px] ${
                        activeWOs.length > 0 ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {activeWOs.length} ticket(s) in progress
                      </span>
                    </div>
                  )}

                  {isAgent && (
                    <div className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-sm border border-slate-200">
                      <span className="text-slate-500 font-medium">Assigned Prospect Leads:</span>
                      <span className={`font-mono font-bold px-2 py-0.5 rounded-sm text-[11px] ${
                        activeLeadsList.length > 0 ? 'bg-purple-100 text-purple-900 border border-purple-300' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {activeLeadsList.length} active lead(s)
                      </span>
                    </div>
                  )}

                  {/* Contact Info (Phone, Email, Dispatch) */}
                  <div className="space-y-1 text-xs text-slate-600 pt-1 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Primary:</span>
                      <a 
                        href={`tel:${item.phone}`} 
                        className="font-mono font-semibold text-slate-800 hover:text-blue-600 transition-colors"
                      >
                        {item.phone}
                      </a>
                    </div>

                    {item.secondaryPhone && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-red-500 font-bold">24/7 Dispatch:</span>
                        <a 
                          href={`tel:${item.secondaryPhone}`} 
                          className="font-mono font-semibold text-red-600 hover:underline truncate max-w-[170px]"
                        >
                          {item.secondaryPhone}
                        </a>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Email:</span>
                      <a 
                        href={`mailto:${item.email}`} 
                        className="font-mono text-slate-700 hover:text-blue-600 truncate max-w-[180px] text-[11px]"
                      >
                        {item.email}
                      </a>
                    </div>
                  </div>

                  {/* Notes snippet */}
                  {item.notes && (
                    <p className="text-[11px] text-slate-500 italic bg-slate-50 p-1.5 rounded-sm border border-slate-200 line-clamp-2">
                      "{item.notes}"
                    </p>
                  )}
                </div>

                {/* Footer Controls with Explicit DELETE button */}
                <div className="bg-slate-50/80 px-4 py-2.5 border-t border-slate-200 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setQuickSmsContact(item);
                      setSmsText(
                        isVendor 
                          ? `Hi ${item.name.split(' ')[0]}, this is Jake from Moyer PM. Are you available for a maintenance dispatch?` 
                          : `Hi ${item.name.split(' ')[0]}, this is Moyer PM. Could you provide an update on the latest prospect tour?`
                      );
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-sm text-xs font-semibold flex items-center gap-1.5 uppercase tracking-tight transition-colors shadow-2xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                    <span>Quick SMS</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <a
                      href={`tel:${item.phone}`}
                      className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-sm transition-colors"
                      title="Call Phone"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>

                    <a
                      href={`mailto:${item.email}`}
                      className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-sm transition-colors"
                      title="Send Email"
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </a>

                    <button
                      onClick={() => onOpenEditContactModal(item)}
                      className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-sm transition-colors"
                      title="Edit Details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Prominent Deletion Button */}
                    <button
                      onClick={() => onOpenDeleteContactModal(item)}
                      className="p-1.5 bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-sm transition-colors"
                      title={`Delete ${isVendor ? 'Vendor' : isAgent ? 'Leasing Agent' : 'Contact'}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick SMS Dispatch Modal */}
      {quickSmsContact && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-sm p-5 max-w-md w-full shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2 uppercase tracking-wide">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span>SMS Gateway: {quickSmsContact.name}</span>
              </h3>
              <button
                onClick={() => setQuickSmsContact(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-1.5">
                Target Mobile Number: <strong className="text-slate-900 font-mono">{quickSmsContact.phone}</strong>
              </p>
              <textarea
                rows={4}
                value={smsText}
                onChange={(e) => setSmsText(e.target.value)}
                placeholder="Type dispatch update, ticket assignment notice, or tour query..."
                className="w-full text-xs p-3 border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900"
              />
            </div>

            {smsSent && (
              <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-sm text-xs font-semibold text-center flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>SMS Dispatched via Moyer PM Gateway!</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setQuickSmsContact(null)}
                className="px-3 py-1.5 rounded-sm border border-slate-300 text-slate-600 text-xs font-semibold uppercase tracking-wider hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendSms}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-sm text-xs font-semibold uppercase tracking-wider shadow-xs transition-colors"
              >
                Send SMS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
