import React, { useState, useEffect } from 'react';
import { RefreshCw, Check, CheckCircle2 } from 'lucide-react';
import { GoogleWorkspaceService } from '../services/googleWorkspace';
import { 
  Contact as ContactIcon, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  Building, 
  Wrench, 
  UserCheck, 
  ShieldAlert, 
  Star, 
  Edit2, 
  MessageSquare,
  DollarSign,
  Briefcase,
  Trash2,
  AlertTriangle,
  DoorClosed,
  Bed,
  Key
} from 'lucide-react';
import { Contact, ContactType, Property, Room } from '../types';
import { formatFullName } from '../utils/nameUtils';
import { formatPhoneNumber, getPhoneTelHref } from '../utils/phoneUtils';
import { QuickSmsModal, QuickSmsRecipient } from './modals/QuickSmsModal';
import { AssignRoomModal } from './modals/AssignRoomModal';

interface ContactsViewProps {
  contacts: Contact[];
  properties: Property[];
  rooms: Room[];
  onUpdateContact: (contact: Contact) => void;
  onDeleteContact: (contactId: string) => void;
  onOpenNewContactModal: () => void;
  onOpenEditContactModal: (contact: Contact) => void;
  onAssignRoom?: (
    contact: Contact,
    selectedProperty: Property | null,
    selectedRoom: Room | null,
    leaseDetails?: {
      startDate?: string;
      endDate?: string;
      rent?: number;
      updateRoomOccupancy?: boolean;
    }
  ) => void;
}

export const ContactsView: React.FC<ContactsViewProps> = ({
  contacts,
  properties,
  rooms,
  onUpdateContact,
  onDeleteContact,
  onOpenNewContactModal,
  onOpenEditContactModal,
  onAssignRoom
}) => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [quickSmsModalContact, setQuickSmsModalContact] = useState<Contact | null>(null);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [syncingContactId, setSyncingContactId] = useState<string | null>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean>(GoogleWorkspaceService.isConnected());
  const [connectedEmail, setConnectedEmail] = useState<string>(GoogleWorkspaceService.getConnectedEmail() || '');
  const [isConnectingGoogle, setIsConnectingGoogle] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [contactForRoomAssign, setContactForRoomAssign] = useState<Contact | null>(null);
  const [isAssignRoomModalOpen, setIsAssignRoomModalOpen] = useState<boolean>(false);

  useEffect(() => {
    setIsGoogleConnected(GoogleWorkspaceService.isConnected());
    setConnectedEmail(GoogleWorkspaceService.getConnectedEmail() || '');
  }, []);

  const handleConnectGoogle = async () => {
    setIsConnectingGoogle(true);
    setSyncFeedback(null);
    try {
      await GoogleWorkspaceService.requestAccessTokenSmart('info@1070yankstreet.com');
      setIsGoogleConnected(true);
      setConnectedEmail(GoogleWorkspaceService.getConnectedEmail() || '');
      setSyncFeedback('Google Contacts connected successfully.');
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user' && !err.message?.includes('closed-by-user')) {
        setSyncFeedback(err.message || 'Failed to connect Google account.');
      }
    } finally {
      setIsConnectingGoogle(false);
      setTimeout(() => setSyncFeedback(null), 5000);
    }
  };

  const handleSyncSingleContact = async (contact: Contact) => {
    if (!GoogleWorkspaceService.isConnected()) {
      await handleConnectGoogle();
      if (!GoogleWorkspaceService.isConnected()) return;
    }

    setSyncingContactId(contact.id);
    setSyncFeedback(null);
    try {
      const res = await GoogleWorkspaceService.createGoogleContact(contact);
      if (res.success) {
        const updated: Contact = {
          ...contact,
          googleContactId: res.googleContactId,
          googleContactResourceName: res.resourceName,
          googleContactSyncedAt: new Date().toISOString()
        };
        onUpdateContact(updated);
        setSyncFeedback(`Successfully synced "${contact.name}" to Google Contacts!`);
      } else {
        setSyncFeedback(`Google sync note: ${res.error || 'Failed to sync'}`);
      }
    } catch (err: any) {
      setSyncFeedback(`Sync failed: ${err.message || 'Unknown error'}`);
    } finally {
      setSyncingContactId(null);
      setTimeout(() => setSyncFeedback(null), 6000);
    }
  };

  // Filter contacts
  const filteredContacts = contacts.filter(c => {
    if (activeTab === 'agents' && c.type !== 'Leasing Agent') return false;
    if (activeTab === 'tenants' && c.type !== 'Tenant') return false;
    if (activeTab === 'vendors' && c.type !== 'Vendor / Contractor') return false;
    if (activeTab === 'owners' && c.type !== 'Property Owner') return false;
    if (activeTab === 'leads' && c.type !== 'Lead') return false;
    if (propertyFilter !== 'all' && c.propertyId !== propertyFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const fullName = formatFullName(c.firstName, c.lastName, c.name).toLowerCase();
      return (
        fullName.includes(q) ||
        (c.firstName && c.firstName.toLowerCase().includes(q)) ||
        (c.lastName && c.lastName.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        c.phone.toLowerCase().includes(q) ||
        (c.roleOrSpecialty && c.roleOrSpecialty.toLowerCase().includes(q)) ||
        (c.company && c.company.toLowerCase().includes(q)) ||
        (c.licenseNumber && c.licenseNumber.toLowerCase().includes(q)) ||
        (c.propertyName && c.propertyName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-sm p-5 border border-zinc-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ContactIcon className="w-4 h-4 text-indigo-600" />
            <h1 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
              Contacts & Vendor Directory
            </h1>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Directory of leasing agents, active tenants, contractors, and property owners.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {isGoogleConnected ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-sm text-xs font-medium">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Google Contacts: Connected</span>
            </div>
          ) : (
            <button
              onClick={handleConnectGoogle}
              disabled={isConnectingGoogle}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-semibold transition-colors"
              title="Connect your Google Workspace / Gmail account to sync contacts"
            >
              {isConnectingGoogle ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              )}
              <span>Connect Google Contacts</span>
            </button>
          )}

          <button
            onClick={onOpenNewContactModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ Add Contact</span>
          </button>
        </div>
      </div>

      {syncFeedback && (
        <div className="bg-sky-50 border border-sky-200 text-sky-800 text-xs px-4 py-2.5 rounded-sm flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
          <button
            onClick={() => setSyncFeedback(null)}
            className="text-sky-600 hover:text-sky-900 font-bold ml-2 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Directory Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-1.5 rounded-sm text-xs font-semibold uppercase tracking-tight transition-colors whitespace-nowrap border ${
            activeTab === 'all' ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs' : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
          }`}
        >
          All Contacts ({contacts.length})
        </button>

        <button
          onClick={() => setActiveTab('agents')}
          className={`px-3.5 py-1.5 rounded-sm text-xs font-semibold uppercase tracking-tight transition-colors whitespace-nowrap border flex items-center gap-1.5 ${
            activeTab === 'agents' ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs' : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
          }`}
        >
          <span>Leasing Agents</span>
          <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded-sm font-bold font-mono">
            {contacts.filter(c => c.type === 'Leasing Agent').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('tenants')}
          className={`px-3.5 py-1.5 rounded-sm text-xs font-semibold uppercase tracking-tight transition-colors whitespace-nowrap border flex items-center gap-1.5 ${
            activeTab === 'tenants' ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs' : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
          }`}
        >
          <span>Active Tenants</span>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-sm font-bold font-mono">
            {contacts.filter(c => c.type === 'Tenant').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('vendors')}
          className={`px-3.5 py-1.5 rounded-sm text-xs font-semibold uppercase tracking-tight transition-colors whitespace-nowrap border flex items-center gap-1.5 ${
            activeTab === 'vendors' ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs' : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
          }`}
        >
          <span>Vendors & Contractors</span>
          <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-sm font-bold font-mono">
            {contacts.filter(c => c.type === 'Vendor / Contractor').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('owners')}
          className={`px-3.5 py-1.5 rounded-sm text-xs font-semibold uppercase tracking-tight transition-colors whitespace-nowrap border flex items-center gap-1.5 ${
            activeTab === 'owners' ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs' : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
          }`}
        >
          <span>Property Owners</span>
          <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded-sm font-bold font-mono">
            {contacts.filter(c => c.type === 'Property Owner').length}
          </span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-sm p-4 border border-zinc-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <select
            value={propertyFilter}
            onChange={(e) => setPropertyFilter(e.target.value)}
            className="text-xs bg-zinc-50 border border-zinc-300 rounded-sm px-2.5 py-1.5 text-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Properties</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <input
          type="text"
          placeholder="Search name, phone, trade, company..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="text-xs bg-zinc-50 border border-zinc-300 rounded-sm px-3 py-1.5 text-zinc-700 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full sm:w-64"
        />
      </div>

      {/* Contacts Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredContacts.map(contact => (
          <div 
            key={contact.id}
            className="bg-white rounded-sm border border-zinc-200 shadow-xs p-4 hover:border-zinc-400 transition-colors flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              {/* Header with Avatar & Type */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-sm flex items-center justify-center text-white font-bold text-xs shadow-xs ${contact.avatarBg}`}>
                    {(() => {
                      const f = contact.firstName || contact.name.split(' ')[0] || '';
                      const l = contact.lastName || (contact.name.split(' ').length > 1 ? contact.name.split(' ')[contact.name.split(' ').length - 1] : '');
                      return `${f ? f[0] : ''}${l ? l[0] : ''}`.toUpperCase() || 'C';
                    })()}
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900 text-xs leading-snug">
                      {formatFullName(contact.firstName, contact.lastName, contact.name)}
                    </h3>
                    {contact.company && (
                      <p className="text-[11px] text-zinc-500 font-medium">{contact.company}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {contact.googleContactSyncedAt && (
                    <span
                      className="inline-flex items-center gap-1 text-[10px] text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded-xs font-semibold border border-sky-200/90"
                      title={`Synced with Google Contacts on ${new Date(contact.googleContactSyncedAt).toLocaleDateString()}`}
                    >
                      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      Google
                    </span>
                  )}
                  <span className={`text-[10px] px-2 py-0.5 rounded-sm font-bold uppercase tracking-tight border ${
                    contact.type === 'Leasing Agent' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                    contact.type === 'Tenant' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    contact.type === 'Vendor / Contractor' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    contact.type === 'Property Owner' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                    'bg-zinc-100 text-zinc-700 border-zinc-200'
                  }`}>
                    {contact.type}
                  </span>
                </div>
              </div>

              {/* Leasing Agent Profile Details */}
              {contact.type === 'Leasing Agent' && (
                <div className="text-xs bg-indigo-50/70 p-2.5 rounded-sm border border-indigo-200/70 text-zinc-700 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-950 text-xs">
                      {contact.roleOrSpecialty || 'Leasing Agent'}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-xs font-semibold ${
                      contact.status === 'Active' ? 'bg-emerald-100 text-emerald-800' :
                      contact.status === 'On Leave' ? 'bg-amber-100 text-amber-800' :
                      'bg-zinc-200 text-zinc-700'
                    }`}>
                      {contact.status || 'Active'}
                    </span>
                  </div>
                  {contact.licenseNumber && (
                    <div className="text-[11px] text-indigo-800 font-mono">
                      License: {contact.licenseNumber}
                    </div>
                  )}
                  <div className="text-[11px] text-zinc-600 flex items-center justify-between pt-0.5">
                    <span className="text-zinc-500">Coverage:</span>
                    <span className="font-medium text-zinc-800">
                      {contact.propertyName || 'Portfolio-Wide'}
                    </span>
                  </div>
                </div>
              )}

              {/* Vendor Role / Specialty info - only for Vendor / Contractor */}
              {contact.type === 'Vendor / Contractor' && (contact.roleOrSpecialty || contact.hourlyRate || contact.rating) && (
                <div className="text-xs bg-amber-50/70 p-2 rounded-sm border border-amber-200/80 text-zinc-700">
                  {contact.roleOrSpecialty && <span className="font-semibold text-zinc-900">{contact.roleOrSpecialty}</span>}
                  {contact.hourlyRate && (
                    <span className="text-zinc-600 ml-2 font-mono">(${contact.hourlyRate}/hr)</span>
                  )}
                  {contact.rating && (
                    <span className="text-amber-600 font-bold ml-2 font-mono">★ {contact.rating}</span>
                  )}
                </div>
              )}

              {/* Property & Room assignment section */}
              {contact.roomName ? (
                <div className="text-xs bg-zinc-50 p-2.5 rounded-sm border border-zinc-200 text-zinc-700 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-zinc-400">
                      {contact.type === 'Property Owner' ? 'Owned Property' : 'Assigned Residence'}
                    </span>
                    <span className="font-semibold text-zinc-900 truncate max-w-[170px]" title={contact.propertyName}>
                      {contact.propertyName || 'Coliving Residence'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-zinc-200/60 text-[11px]">
                    <div className="flex items-center gap-1.5 truncate">
                      <DoorClosed className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="font-semibold text-indigo-950 truncate">{contact.roomName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setContactForRoomAssign(contact);
                        setIsAssignRoomModalOpen(true);
                      }}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold hover:underline shrink-0 transition"
                      title="Change or unassign room"
                    >
                      Change Room
                    </button>
                  </div>
                </div>
              ) : (contact.type === 'Tenant' || contact.type === 'Lead') ? (
                <div className="text-xs bg-amber-50/70 p-2.5 rounded-sm border border-amber-200/80 text-zinc-700 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-900/60 block">Residence & Room</span>
                    <span className="text-[11px] text-amber-900 font-medium flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      <span>No room assigned</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setContactForRoomAssign(contact);
                      setIsAssignRoomModalOpen(true);
                    }}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm text-[11px] font-bold transition shadow-xs flex items-center gap-1 shrink-0"
                    title="Assign a room to this contact"
                  >
                    <DoorClosed className="w-3 h-3" />
                    <span>Assign Room</span>
                  </button>
                </div>
              ) : contact.propertyName ? (
                <div className="text-xs bg-zinc-50 p-2 rounded-sm border border-zinc-200 text-zinc-700">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-zinc-400">
                      {contact.type === 'Property Owner' ? 'Owned Property' : 'Assigned Residence'}
                    </span>
                    <span className="font-semibold text-zinc-900">{contact.propertyName}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1 pt-1 border-t border-zinc-200/60 text-[11px]">
                    <span className="text-zinc-400">Room:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setContactForRoomAssign(contact);
                        setIsAssignRoomModalOpen(true);
                      }}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
                    >
                      + Assign Room
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Contact numbers */}
              <div className="space-y-1 text-xs text-zinc-600 pt-1 border-t border-zinc-100">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Phone:</span>
                  <a href={getPhoneTelHref(contact.phone)} className="font-mono font-medium text-zinc-800 hover:text-indigo-600">
                    {formatPhoneNumber(contact.phone)}
                  </a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Email:</span>
                  <a href={`mailto:${contact.email}`} className="text-zinc-700 truncate max-w-[180px] hover:text-indigo-600 font-mono text-[11px]">
                    {contact.email}
                  </a>
                </div>
                {contact.emergencyContactName && (
                  <div className="pt-1 text-[11px] text-zinc-500 flex justify-between">
                    <span>Emergency:</span>
                    <span className="font-medium text-zinc-700">{contact.emergencyContactName} {contact.emergencyContactPhone ? `(${formatPhoneNumber(contact.emergencyContactPhone)})` : ''}</span>
                  </div>
                )}
              </div>

              {/* Notes */}
              {contact.notes && (
                <p className="text-[11px] text-zinc-500 italic bg-zinc-50 p-1.5 rounded-sm border border-zinc-200 line-clamp-2">
                  "{contact.notes}"
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center justify-between gap-2">
              <button
                onClick={() => setQuickSmsModalContact(contact)}
                className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-sm text-xs font-semibold flex items-center gap-1 uppercase tracking-tight transition-colors"
                title="Send SMS via Google Voice or Mobile SMS"
              >
                <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                <span>Quick SMS</span>
              </button>

              <div className="flex items-center gap-1.5">
                <a
                  href={getPhoneTelHref(contact.phone)}
                  className="p-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-sm transition-colors"
                  title="Call Contact"
                >
                  <Phone className="w-3.5 h-3.5" />
                </a>
                <a
                  href={`mailto:${contact.email}`}
                  className="p-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-sm transition-colors"
                  title="Email Contact"
                >
                  <Mail className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setContactForRoomAssign(contact);
                    setIsAssignRoomModalOpen(true);
                  }}
                  className={`p-1.5 rounded-sm transition-colors ${
                    contact.roomName
                      ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                  }`}
                  title={contact.roomName ? `Assigned to ${contact.roomName} (Click to change/unassign)` : 'Assign Room to Contact'}
                >
                  <DoorClosed className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleSyncSingleContact(contact)}
                  disabled={syncingContactId === contact.id}
                  className={`p-1.5 rounded-sm transition-colors ${
                    contact.googleContactSyncedAt
                      ? 'bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200'
                      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600'
                  }`}
                  title={contact.googleContactSyncedAt ? `Synced to Google Contacts (${new Date(contact.googleContactSyncedAt).toLocaleDateString()}) - Click to re-sync` : 'Sync this contact to Google Contacts'}
                >
                  {syncingContactId === contact.id ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-600" />
                  ) : (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={() => onOpenEditContactModal(contact)}
                  className="p-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-sm transition-colors"
                  title="Edit Contact"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setContactToDelete(contact)}
                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/60 rounded-sm transition-colors"
                  title="Delete Contact"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Contact Confirmation Modal */}
      {contactToDelete && (
        <div className="fixed inset-0 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-md max-w-md w-full shadow-2xl border border-zinc-200 overflow-hidden">
            <div className="bg-rose-50 border-b border-rose-100 p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 text-sm">Delete Contact</h3>
                <p className="text-xs text-zinc-500">Confirm removal from directory</p>
              </div>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <p className="text-zinc-700">
                Are you sure you want to delete <strong className="text-zinc-900 font-semibold">{formatFullName(contactToDelete.firstName, contactToDelete.lastName, contactToDelete.name)}</strong> ({contactToDelete.type}) from your directory?
              </p>
              <div className="bg-zinc-50 border border-zinc-200 rounded-sm p-3 space-y-1 text-zinc-600">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Phone:</span>
                  <span className="font-mono text-zinc-800">{contactToDelete.phone}</span>
                </div>
                {contactToDelete.email && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Email:</span>
                    <span className="font-mono text-zinc-800">{contactToDelete.email}</span>
                  </div>
                )}
                {contactToDelete.company && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Company:</span>
                    <span className="text-zinc-800">{contactToDelete.company}</span>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-rose-600">
                This record will be permanently deleted from local and cloud records.
              </p>
            </div>

            <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setContactToDelete(null)}
                className="px-3.5 py-1.5 rounded-sm border border-zinc-300 text-zinc-700 text-xs font-semibold hover:bg-zinc-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteContact(contactToDelete.id);
                  setContactToDelete(null);
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-sm text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Contact</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick SMS Modal with Google Voice & Mobile SMS integration */}
      <QuickSmsModal
        isOpen={Boolean(quickSmsModalContact)}
        onClose={() => setQuickSmsModalContact(null)}
        recipient={quickSmsModalContact ? {
          id: quickSmsModalContact.id,
          firstName: quickSmsModalContact.firstName,
          lastName: quickSmsModalContact.lastName,
          name: quickSmsModalContact.name,
          phone: formatPhoneNumber(quickSmsModalContact.phone),
          email: quickSmsModalContact.email,
          roleOrType: quickSmsModalContact.type,
          propertyName: quickSmsModalContact.propertyName,
          roomName: quickSmsModalContact.roomName
        } : null}
        defaultTemplateId="general"
      />

      {/* Assign Room Modal */}
      <AssignRoomModal
        isOpen={isAssignRoomModalOpen}
        onClose={() => {
          setIsAssignRoomModalOpen(false);
          setContactForRoomAssign(null);
        }}
        contact={contactForRoomAssign}
        properties={properties}
        rooms={rooms}
        onAssignRoom={(c, p, r, leaseDetails) => {
          if (onAssignRoom) {
            onAssignRoom(c, p, r, leaseDetails);
          } else {
            const updated: Contact = {
              ...c,
              propertyId: p?.id,
              propertyName: p?.name,
              roomId: r?.id,
              roomName: r?.name,
              type: c.type === 'Lead' && r ? 'Tenant' : c.type
            };
            onUpdateContact(updated);
          }
        }}
      />
    </div>
  );
};
