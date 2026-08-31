import React, { useState } from 'react';
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
  AlertTriangle
} from 'lucide-react';
import { Contact, ContactType, Property, Room } from '../types';
import { formatFullName } from '../utils/nameUtils';
import { QuickSmsModal, QuickSmsRecipient } from './modals/QuickSmsModal';

interface ContactsViewProps {
  contacts: Contact[];
  properties: Property[];
  rooms: Room[];
  onUpdateContact: (contact: Contact) => void;
  onDeleteContact: (contactId: string) => void;
  onOpenNewContactModal: () => void;
  onOpenEditContactModal: (contact: Contact) => void;
}

export const ContactsView: React.FC<ContactsViewProps> = ({
  contacts,
  properties,
  rooms,
  onUpdateContact,
  onDeleteContact,
  onOpenNewContactModal,
  onOpenEditContactModal
}) => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [quickSmsModalContact, setQuickSmsModalContact] = useState<Contact | null>(null);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

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

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNewContactModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ Add Contact</span>
          </button>
        </div>
      </div>

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

              {/* Property & Room if tenant or owner */}
              {contact.propertyName && (
                <div className="text-xs bg-zinc-50 p-2 rounded-sm border border-zinc-200 text-zinc-700">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-zinc-400">
                      {contact.type === 'Property Owner' ? 'Owned Property' : 'Assigned Residence'}
                    </span>
                    <span className="font-semibold text-zinc-900">{contact.propertyName}</span>
                  </div>
                  {contact.roomName && (
                    <div className="flex items-center justify-between mt-1 pt-1 border-t border-zinc-200/60 text-[11px]">
                      <span className="text-zinc-400">Room:</span>
                      <span className="font-medium text-zinc-800">{contact.roomName}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Contact numbers */}
              <div className="space-y-1 text-xs text-zinc-600 pt-1 border-t border-zinc-100">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Phone:</span>
                  <a href={`tel:${contact.phone}`} className="font-mono font-medium text-zinc-800 hover:text-indigo-600">
                    {contact.phone}
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
                    <span className="font-medium text-zinc-700">{contact.emergencyContactName} ({contact.emergencyContactPhone})</span>
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
                  href={`tel:${contact.phone}`}
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
          phone: quickSmsModalContact.phone,
          email: quickSmsModalContact.email,
          roleOrType: quickSmsModalContact.type,
          propertyName: quickSmsModalContact.propertyName,
          roomName: quickSmsModalContact.roomName
        } : null}
        defaultTemplateId="general"
      />
    </div>
  );
};
