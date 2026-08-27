import React, { useState } from 'react';
import { 
  Building2, 
  Home, 
  FileText, 
  Wrench, 
  Users2, 
  Contact as ContactIcon, 
  Sparkles, 
  Plus, 
  Search, 
  Database, 
  AlertCircle,
  Clock,
  ChevronDown,
  Menu,
  X,
  Briefcase
} from 'lucide-react';
import { NavigationTab, LeaseRenewal, WorkOrder, TenantLead, Room, Property, Contact } from '../types';

interface HeaderProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  renewals: LeaseRenewal[];
  workOrders: WorkOrder[];
  leads: TenantLead[];
  rooms: Room[];
  properties: Property[];
  contacts: Contact[];
  onOpenNewWorkOrder: () => void;
  onOpenNewLead: () => void;
  onOpenNewRenewal: () => void;
  onOpenNewRoom: () => void;
  onOpenNewContact: () => void;
  onOpenAssistant: () => void;
  onOpenExportImport: () => void;
  onOpenCloudflareD1?: () => void;
  onResetData: () => void;
  onQuickNavigate: (tab: NavigationTab, filterQuery?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  renewals,
  workOrders,
  leads,
  rooms,
  properties,
  contacts,
  onOpenNewWorkOrder,
  onOpenNewLead,
  onOpenNewRenewal,
  onOpenNewRoom,
  onOpenNewContact,
  onOpenAssistant,
  onOpenExportImport,
  onOpenCloudflareD1,
  onResetData,
  onQuickNavigate
}) => {
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Computed urgent counts
  const urgentRenewalsCount = renewals.filter(r => r.daysUntilExpiration <= 30 && r.renewalStatus !== 'Renewed Signed' && r.renewalStatus !== 'Tenant Declined (Vacating)').length;
  const activeWorkOrdersCount = workOrders.filter(w => w.status !== 'Completed' && w.status !== 'Cancelled').length;
  const emergencyWOCount = workOrders.filter(w => w.priority === 'Emergency' && w.status !== 'Completed').length;
  const activeLeadsCount = leads.filter(l => l.stage !== 'Signed / Converted' && l.stage !== 'Lost / Archived').length;
  const totalRoomsCount = rooms.length;
  const occupiedRoomsCount = rooms.filter(r => r.status === 'Occupied').length;
  const occupancyRate = totalRoomsCount > 0 ? ((occupiedRoomsCount / totalRoomsCount) * 100).toFixed(1) : '0';
  const vendorsAndAgentsCount = contacts.filter(c => c.type === 'Vendor / Contractor' || c.type === 'Leasing Agent').length;

  // Search matches
  const searchResults = searchQuery.trim() ? {
    properties: properties.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.address.toLowerCase().includes(searchQuery.toLowerCase())),
    rooms: rooms.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.propertyName.toLowerCase().includes(searchQuery.toLowerCase()) || r.currentTenantName?.toLowerCase().includes(searchQuery.toLowerCase())),
    leads: leads.filter(l => l.name.toLowerCase().includes(searchQuery.toLowerCase()) || l.email.toLowerCase().includes(searchQuery.toLowerCase()) || l.occupation.toLowerCase().includes(searchQuery.toLowerCase())),
    workOrders: workOrders.filter(w => w.title.toLowerCase().includes(searchQuery.toLowerCase()) || w.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) || w.propertyName.toLowerCase().includes(searchQuery.toLowerCase())),
    contacts: contacts.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.email.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.toLowerCase().includes(searchQuery.toLowerCase()))
  } : null;

  const totalResultsCount = searchResults 
    ? searchResults.properties.length + searchResults.rooms.length + searchResults.leads.length + searchResults.workOrders.length + searchResults.contacts.length
    : 0;

  const getTabTitle = (tab: NavigationTab) => {
    switch (tab) {
      case 'dashboard': return 'Portfolio Overview: Room Rentals';
      case 'properties': return 'Room Inventory & Coliving Assets';
      case 'renewals': return 'Lease Renewals & Expiration Engine';
      case 'workorders': return 'Maintenance Hub & Vendor Dispatch';
      case 'leads': return 'Tenant Leads & Roommate Screening CRM';
      case 'vendors-agents': return 'Vendors, Contractors & Leasing Agents';
      case 'contacts': return 'Unified Contacts & Resident Directory';
      case 'tenant-portal': return 'Resident Portal & Maintenance Submissions';
      case 'database-status': return 'Cloudflare D1 Database Status & Telemetry';
    }
  };

  const navItems: { id: NavigationTab; label: string; icon: React.FC<{ className?: string }>; badge?: React.ReactNode }[] = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: Building2 
    },
    { 
      id: 'properties', 
      label: 'Room Inventory', 
      icon: Home,
      badge: <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-1.5 py-0.5 rounded-sm">{totalRoomsCount}</span>
    },
    { 
      id: 'renewals', 
      label: 'Lease Renewals', 
      icon: FileText,
      badge: urgentRenewalsCount > 0 
        ? <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.5 rounded-sm">{urgentRenewalsCount}</span> 
        : <span className="text-[10px] bg-slate-800 text-slate-400 font-mono px-1.5 py-0.5 rounded-sm">{renewals.length}</span>
    },
    { 
      id: 'workorders', 
      label: 'Maintenance Hub', 
      icon: Wrench,
      badge: emergencyWOCount > 0 
        ? <span className="text-[10px] bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-sm">{emergencyWOCount}</span> 
        : activeWorkOrdersCount > 0 
        ? <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded-sm">{activeWorkOrdersCount}</span>
        : null
    },
    { 
      id: 'leads', 
      label: 'Leads & CRM', 
      icon: Users2,
      badge: <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded-sm font-semibold">{activeLeadsCount}</span>
    },
    { 
      id: 'vendors-agents', 
      label: 'Vendors & Agents', 
      icon: Briefcase,
      badge: <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono px-1.5 py-0.5 rounded-sm">{vendorsAndAgentsCount}</span>
    },
    { 
      id: 'contacts', 
      label: 'Resident Directory', 
      icon: ContactIcon,
      badge: <span className="text-[10px] bg-slate-800 text-slate-400 font-mono px-1.5 py-0.5 rounded-sm">{contacts.length}</span>
    },
    { 
      id: 'database-status', 
      label: 'Database Status', 
      icon: Database,
      badge: <span className="text-[10px] bg-orange-950 text-orange-300 border border-orange-800 font-mono px-1.5 py-0.5 rounded-sm font-semibold">D1</span>
    }
  ];

  return (
    <>
      {/* Desktop Sidebar (Geometric Balance Navigation Aside) */}
      <aside className="w-60 bg-slate-900 text-white flex flex-col shrink-0 min-h-screen border-r border-slate-800 hidden lg:flex select-none">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectTab('dashboard')}>
            <div className="w-8 h-8 bg-blue-500 rounded-sm flex items-center justify-center font-bold text-lg text-white shadow-xs">
              M
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-widest uppercase text-white">Moyer Prop.</h1>
              <p className="text-[10px] text-slate-400 font-mono">Room CRM v2.4</p>
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 py-6 px-4 space-y-1.5">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <div
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`px-4 py-2.5 rounded-sm text-sm font-medium transition-colors cursor-pointer flex items-center justify-between ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-500'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <item.icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Tools & Quick Actions */}
        <div className="px-4 py-3 border-t border-slate-800/80 space-y-2">
          <button
            onClick={onOpenAssistant}
            className="w-full flex items-center justify-between px-3 py-2 rounded-sm bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-xs transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Operations AI</span>
            </div>
            <span className="text-[9px] bg-blue-700 px-1 py-0.5 rounded-sm uppercase tracking-wider font-mono">GPT</span>
          </button>

          {/* Cloudflare D1 Database Trigger Button */}
          {onOpenCloudflareD1 && (
            <button
              onClick={onOpenCloudflareD1}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-sm bg-orange-950/40 hover:bg-orange-900/50 border border-orange-500/30 text-orange-300 font-medium text-xs shadow-xs transition-colors"
            >
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-orange-400" />
                <span>Cloudflare D1 Database</span>
              </div>
              <span className="text-[9px] bg-orange-500/30 text-orange-200 px-1 py-0.5 rounded-sm uppercase tracking-wider font-mono">SQL</span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              onClick={onOpenExportImport}
              className="flex items-center justify-center gap-1 text-slate-400 hover:text-slate-200 text-xs px-2 py-1.5 rounded-sm hover:bg-slate-800 border border-slate-800 transition"
              title="Backup & Export"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Backup</span>
            </button>
            <button
              onClick={() => {
                if (window.confirm('Reset CRM to initial Moyer Property Management sample dataset? Any unsaved local edits will be refreshed.')) {
                  onResetData();
                }
              }}
              className="flex items-center justify-center text-slate-400 hover:text-red-300 text-xs px-2 py-1.5 rounded-sm hover:bg-slate-800 border border-slate-800 transition"
              title="Reset Sample Data"
            >
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Sidebar Footer Metadata */}
        <div className="p-5 border-t border-slate-800 text-xs text-slate-500">
          <p className="font-semibold text-slate-400">Moyer Management v2.4</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Admin: Jake Moyer (Denver/Boulder)</p>
          <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Occupancy: {occupancyRate}%</span>
            <span className="text-emerald-400 font-bold">{occupiedRoomsCount}/{totalRoomsCount} Rm</span>
          </div>
        </div>
      </aside>

      {/* Top Header Bar inside the Main Column */}
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-xs">
        {/* Left: Mobile Drawer Trigger + Active View Breadcrumb Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            className="lg:hidden p-1.5 rounded-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
            aria-label="Toggle navigation"
          >
            {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-slate-700 tracking-tight">
              {getTabTitle(currentTab)}
            </h2>
          </div>
        </div>

        {/* Right: Search, Create Action, and Profile/AI Status */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Global Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              placeholder="Search tenants, rooms..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              className="bg-slate-100 border border-slate-200 pl-8 pr-4 py-1.5 rounded-sm text-xs w-44 sm:w-64 focus:ring-1 focus:ring-blue-500 focus:bg-white focus:border-blue-500 outline-none text-slate-900 placeholder-slate-400 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-700 text-xs"
              >
                ✕
              </button>
            )}

            {/* Live Search dropdown overlay */}
            {isSearchOpen && searchResults && totalResultsCount > 0 && (
              <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white border border-slate-200 rounded-sm shadow-xl z-50 max-h-96 overflow-y-auto p-2 text-xs">
                <div className="p-2 border-b border-slate-100 flex justify-between text-slate-400 font-bold uppercase text-[10px]">
                  <span>Found {totalResultsCount} results</span>
                  <button onClick={() => setIsSearchOpen(false)} className="text-slate-400 hover:text-slate-700">Close</button>
                </div>

                {searchResults.rooms.length > 0 && (
                  <div className="py-1">
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-slate-50">Rooms ({searchResults.rooms.length})</div>
                    {searchResults.rooms.map(room => (
                      <div 
                        key={room.id}
                        onClick={() => {
                          onQuickNavigate('properties');
                          setIsSearchOpen(false);
                        }}
                        className="px-2 py-1.5 hover:bg-slate-50 rounded-sm cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-0"
                      >
                        <div>
                          <p className="font-semibold text-slate-800">{room.name}</p>
                          <p className="text-[10px] text-slate-500">{room.propertyName} • ${room.monthlyRent}/mo</p>
                        </div>
                        <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-sm text-slate-700">{room.status}</span>
                      </div>
                    ))}
                  </div>
                )}

                {searchResults.leads.length > 0 && (
                  <div className="py-1 border-t border-slate-100">
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-slate-50">Tenant Leads ({searchResults.leads.length})</div>
                    {searchResults.leads.map(lead => (
                      <div 
                        key={lead.id}
                        onClick={() => {
                          onQuickNavigate('leads');
                          setIsSearchOpen(false);
                        }}
                        className="px-2 py-1.5 hover:bg-slate-50 rounded-sm cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-0"
                      >
                        <div>
                          <p className="font-semibold text-slate-800">{lead.name}</p>
                          <p className="text-[10px] text-slate-500">{lead.occupation} • ${lead.maxBudget}/mo</p>
                        </div>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-sm">{lead.stage}</span>
                      </div>
                    ))}
                  </div>
                )}

                {searchResults.workOrders.length > 0 && (
                  <div className="py-1 border-t border-slate-100">
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-red-600 bg-slate-50">Work Orders ({searchResults.workOrders.length})</div>
                    {searchResults.workOrders.map(wo => (
                      <div 
                        key={wo.id}
                        onClick={() => {
                          onQuickNavigate('workorders');
                          setIsSearchOpen(false);
                        }}
                        className="px-2 py-1.5 hover:bg-slate-50 rounded-sm cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-0"
                      >
                        <div>
                          <p className="font-semibold text-slate-800">{wo.ticketNumber}: {wo.title}</p>
                          <p className="text-[10px] text-slate-500">{wo.propertyName} ({wo.priority})</p>
                        </div>
                        <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-sm text-slate-700">{wo.status}</span>
                      </div>
                    ))}
                  </div>
                )}

                {searchResults.contacts.length > 0 && (
                  <div className="py-1 border-t border-slate-100">
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-50">Contacts ({searchResults.contacts.length})</div>
                    {searchResults.contacts.map(c => (
                      <div 
                        key={c.id}
                        onClick={() => {
                          onQuickNavigate('contacts');
                          setIsSearchOpen(false);
                        }}
                        className="px-2 py-1.5 hover:bg-slate-50 rounded-sm cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-0"
                      >
                        <div>
                          <p className="font-semibold text-slate-800">{c.name} {c.company ? `(${c.company})` : ''}</p>
                          <p className="text-[10px] text-slate-500">{c.phone} • {c.email}</p>
                        </div>
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-sm">{c.type}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Create Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold uppercase tracking-wider px-3 py-1.5 rounded-sm text-xs shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Create</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {isNewMenuOpen && (
              <div 
                className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-slate-200 rounded-sm shadow-xl py-1.5 z-50 text-xs"
                onClick={() => setIsNewMenuOpen(false)}
              >
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">Actions</div>
                <button
                  onClick={onOpenNewWorkOrder}
                  className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition"
                >
                  <Wrench className="w-4 h-4 text-red-500" />
                  <div>
                    <p className="font-semibold text-slate-900">New Work Order</p>
                    <p className="text-[10px] text-slate-500">Log repair or room maintenance</p>
                  </div>
                </button>
                <button
                  onClick={onOpenNewLead}
                  className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition"
                >
                  <Users2 className="w-4 h-4 text-emerald-600" />
                  <div>
                    <p className="font-semibold text-slate-900">New Tenant Lead</p>
                    <p className="text-[10px] text-slate-500">Add inquiry or prospect</p>
                  </div>
                </button>
                <button
                  onClick={onOpenNewRenewal}
                  className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="font-semibold text-slate-900">Record Lease Renewal</p>
                    <p className="text-[10px] text-slate-500">Propose term adjustment</p>
                  </div>
                </button>
                <div className="border-t border-slate-100 my-1"></div>
                <button
                  onClick={onOpenNewRoom}
                  className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition"
                >
                  <Home className="w-4 h-4 text-slate-600" />
                  <div>
                    <p className="font-semibold text-slate-900">Add Room / Asset</p>
                    <p className="text-[10px] text-slate-500">Expand room inventory</p>
                  </div>
                </button>
                <button
                  onClick={onOpenNewContact}
                  className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition"
                >
                  <ContactIcon className="w-4 h-4 text-slate-600" />
                  <div>
                    <p className="font-semibold text-slate-900">Add Contact</p>
                    <p className="text-[10px] text-slate-500">Contractor, owner, tenant</p>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Cloudflare D1 Top Quick Launcher */}
          {onOpenCloudflareD1 && (
            <button
              onClick={onOpenCloudflareD1}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-800 text-xs font-semibold shadow-2xs transition"
              title="Cloudflare D1 SQL Database & Sync"
            >
              <Database className="w-3.5 h-3.5 text-orange-600" />
              <span>D1 SQL</span>
            </button>
          )}

          {/* User profile avatar bubble matching theme */}
          <div 
            onClick={onOpenAssistant} 
            className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-xs text-slate-700 cursor-pointer hover:bg-slate-300 transition"
            title="Jake Moyer (Property Manager)"
          >
            JM
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation (when opened on small screens) */}
      {isMobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs flex">
          <div className="w-64 bg-slate-900 text-white flex flex-col h-full border-r border-slate-800 shadow-2xl p-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-blue-500 rounded-sm flex items-center justify-center font-bold text-base text-white">M</div>
                <h1 className="text-sm font-bold tracking-widest uppercase">Moyer Prop.</h1>
              </div>
              <button onClick={() => setIsMobileNavOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 py-4 space-y-1.5 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      setIsMobileNavOpen(false);
                    }}
                    className={`px-3.5 py-2 rounded-sm text-sm font-medium cursor-pointer flex items-center justify-between ${
                      isActive
                        ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-500'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge}
                  </div>
                );
              })}
            </nav>

            <div className="pt-3 border-t border-slate-800 space-y-2">
              <button
                onClick={() => {
                  onOpenAssistant();
                  setIsMobileNavOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-sm bg-blue-600 text-white font-medium text-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Operations Copilot</span>
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setIsMobileNavOpen(false)} />
        </div>
      )}
    </>
  );
};

