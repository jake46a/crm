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
  Cloud,
  CloudCheck,
  CloudOff,
  LogIn,
  LogOut,
  UserCheck,
  ShieldAlert,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import { NavigationTab, LeaseRenewal, WorkOrder, TenantLead, Room, Property, Contact } from '../types';
import { useFirebase } from '../context/FirebaseContext';

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
  onResetData,
  onQuickNavigate
}) => {
  const { user, syncStatus, isFirebaseConnected, signIn, signOut, authError, clearAuthError } = useFirebase();
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [hasCopiedDomain, setHasCopiedDomain] = useState(false);

  const handleCopyDomain = () => {
    if (authError?.domain) {
      navigator.clipboard.writeText(authError.domain);
      setHasCopiedDomain(true);
      setTimeout(() => setHasCopiedDomain(false), 3000);
    }
  };

  // Computed urgent counts
  const urgentRenewalsCount = renewals.filter(r => r.daysUntilExpiration <= 30 && r.renewalStatus !== 'Renewed Signed' && r.renewalStatus !== 'Tenant Declined (Vacating)').length;
  const activeWorkOrdersCount = workOrders.filter(w => w.status !== 'Completed' && w.status !== 'Cancelled').length;
  const emergencyWOCount = workOrders.filter(w => w.priority === 'Emergency' && w.status !== 'Completed').length;
  const activeLeadsCount = leads.filter(l => l.stage !== 'Signed / Converted' && l.stage !== 'Lost / Archived').length;
  const totalRoomsCount = rooms.length;
  const occupiedRoomsCount = rooms.filter(r => r.status === 'Occupied').length;
  const occupancyRate = totalRoomsCount > 0 ? ((occupiedRoomsCount / totalRoomsCount) * 100).toFixed(1) : '0';

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
      case 'contacts': return 'Unified Contacts & Contractor Directory';
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
      id: 'contacts', 
      label: 'Contacts', 
      icon: ContactIcon,
      badge: <span className="text-[10px] bg-slate-800 text-slate-400 font-mono px-1.5 py-0.5 rounded-sm">{contacts.length}</span>
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
                if (window.confirm('Delete all sample CRM data? This will clear all properties, rooms, renewals, work orders, and contacts.')) {
                  onResetData();
                }
              }}
              className="flex items-center justify-center text-slate-400 hover:text-red-300 text-xs px-2 py-1.5 rounded-sm hover:bg-slate-800 border border-slate-800 transition"
              title="Delete All Sample Data"
            >
              <span>Clear Data</span>
            </button>
          </div>
        </div>

        {/* Sidebar Footer Metadata */}
        <div className="p-5 border-t border-slate-800 text-xs text-slate-500 space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-slate-400">Moyer Management</p>
            <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-sm ${
              syncStatus === 'connected'
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                : syncStatus === 'error'
                ? 'bg-red-950 text-red-400 border border-red-800/60'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
              {syncStatus === 'connected' ? 'Firestore Live' : 'Offline Mode'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Admin: {user?.displayName || user?.email || 'Jake Moyer'}</p>
          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
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

          {/* Cloud Sync Status Indicator */}
          <div 
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-medium border ${
              syncStatus === 'connected'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : syncStatus === 'error'
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
            title={syncStatus === 'connected' ? 'Connected to Firebase Firestore in real-time' : 'Running with local fallback cache'}
          >
            <Cloud className={`w-3.5 h-3.5 ${syncStatus === 'connected' ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span className="text-[11px] hidden md:inline">{syncStatus === 'connected' ? 'Cloud Synced' : 'Syncing...'}</span>
          </div>

          {/* User Profile & Firebase Auth Dropdown */}
          <div className="relative">
            {user ? (
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-sm border border-slate-200 hover:bg-slate-50 transition"
              >
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || 'User'} 
                    className="w-6 h-6 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-semibold text-slate-700 hidden sm:inline max-w-[100px] truncate">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
            ) : (
              <button
                onClick={signIn}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign In with Google</span>
                <span className="sm:hidden">Sign In</span>
              </button>
            )}

            {isUserMenuOpen && user && (
              <div 
                className="absolute right-0 top-full mt-1.5 w-60 bg-white border border-slate-200 rounded-sm shadow-xl py-2 z-50 text-xs"
                onClick={() => setIsUserMenuOpen(false)}
              >
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="font-semibold text-slate-900 truncate">{user.displayName || 'Property Manager'}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                  <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-1.5 py-0.5 rounded-sm border border-emerald-200">
                    <UserCheck className="w-3 h-3" />
                    <span>Firebase Authenticated</span>
                  </div>
                </div>
                <button
                  onClick={signOut}
                  className="w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 transition font-medium mt-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
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

      {/* Google Auth Domain Authorization Diagnostic Modal */}
      {authError && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-amber-500 text-slate-950 p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-6 h-6 text-slate-950 stroke-[2.5]" />
                <h3 className="font-bold text-base">Google Sign In: Domain Authorization</h3>
              </div>
              <button 
                onClick={clearAuthError}
                className="text-slate-900/70 hover:text-slate-950 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700">
              {authError.isDomainError ? (
                <>
                  <p className="leading-relaxed font-medium text-slate-900">
                    Google OAuth blocked this sign-in attempt because your Cloudflare host domain is not yet listed in your Firebase project's <strong>Authorized domains</strong> list.
                  </p>

                  {/* Domain Copy Box */}
                  <div className="bg-slate-100 p-3 rounded-xl border border-slate-300 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Domain to Authorize:</span>
                    <div className="flex items-center justify-between gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 font-mono text-xs text-blue-700 font-bold">
                      <span className="truncate">{authError.domain || window.location.hostname}</span>
                      <button
                        onClick={handleCopyDomain}
                        className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded font-sans text-[11px] font-bold transition shrink-0"
                      >
                        {hasCopiedDomain ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 3 Step Quick Instructions */}
                  <div className="space-y-2 bg-blue-50/60 p-3.5 rounded-xl border border-blue-200 text-slate-800">
                    <span className="font-bold text-blue-900 block text-xs">How to fix in 1 minute:</span>
                    <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-700 leading-normal">
                      <li>
                        Go to <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-700 font-bold underline inline-flex items-center gap-0.5">Firebase Console <ExternalLink className="w-2.5 h-2.5" /></a> and select project <strong>data-terminus-489202-p9</strong>.
                      </li>
                      <li>
                        Navigate to <strong>Authentication</strong> &rarr; <strong>Settings</strong> tab &rarr; <strong>Authorized domains</strong>.
                      </li>
                      <li>
                        Click <strong>Add domain</strong>, paste <code className="bg-white px-1 py-0.5 rounded border border-slate-300 font-mono font-bold text-blue-900">{authError.domain || window.location.hostname}</code>, and click <strong>Save</strong>.
                      </li>
                    </ol>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <p className="font-semibold text-rose-700">{authError.message}</p>
                  <p className="text-slate-500 text-[11px]">
                    If your browser or Cloudflare deployment is blocking popups, please ensure popups are allowed or try again.
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={clearAuthError}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs transition"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

