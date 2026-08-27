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
  Briefcase
} from 'lucide-react';
import { Contact, ContactType, Property, Room } from '../types';

interface ContactsViewProps {
  contacts: Contact[];
  properties: Property[];
  rooms: Room[];
  onUpdateContact: (contact: Contact) => void;
  onOpenNewContactModal: () => void;
  onOpenEditContactModal: (contact: Contact) => void;
}

export const ContactsView: React.FC<ContactsViewProps> = ({
  contacts,
  properties,
  rooms,
  onUpdateContact,
  onOpenNewContactModal,
  onOpenEditContactModal
}) => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [quickSmsModalContact, setQuickSmsModalContact] = useState<Contact | null>(null);
  const [smsMessage, setSmsMessage] = useState<string>('');
  const [smsSentNotice, setSmsSentNotice] = useState<boolean>(false);

  // Filter contacts
  const filteredContacts = contacts.filter(c => {
    if (activeTab === 'tenants' && c.type !== 'Tenant') return false;
    if (activeTab === 'vendors' && c.type !== 'Vendor / Contractor') return false;
    if (activeTab === 'owners' && c.type !== 'Property Owner') return false;
    if (activeTab === 'leads' && c.type !== 'Lead') return false;
    if (propertyFilter !== 'all' && c.propertyId !== propertyFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.roleOrSpecialty && c.roleOrSpecialty.toLowerCase().includes(q)) ||
        (c.company && c.company.toLowerCase().includes(q)) ||
        (c.propertyName && c.propertyName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleSendQuickSMS = () => {
    if (!smsMessage.trim()) return;
    setSmsSentNotice(true);
    setTimeout(() => {
      setSmsSentNotice(false);
      setQuickSmsModalContact(null);
      setSmsMessage('');
    }, 1500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-sm p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ContactIcon className="w-4 h-4 text-blue-600" />
            <h1 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Contacts & Vendor Directory
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Directory of active room tenants, contractors, property owners, and emergency contacts.
          </p>
        </div>

        <button
          onClick={onOpenNewContactModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold uppercase tracking-wider transition-colors"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>+ Add Contact</span>
        </button>
      </div>

      {/* Directory Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-1.5 rounded-sm text-xs font-semibold uppercase tracking-tight transition-colors whitespace-nowrap border ${
            activeTab === 'all' ? 'bg-slate-900 text-white border-slate-900 shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Contacts ({contacts.length})
        </button>

        <button
          onClick={() => setActiveTab('tenants')}
          className={`px-3.5 py-1.5 rounded-sm text-xs font-semibold uppercase tracking-tight transition-colors whitespace-nowrap border flex items-center gap-1.5 ${
            activeTab === 'tenants' ? 'bg-slate-900 text-white border-slate-900 shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
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
            activeTab === 'vendors' ? 'bg-slate-900 text-white border-slate-900 shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
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
            activeTab === 'owners' ? 'bg-slate-900 text-white border-slate-900 shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span>Property Owners</span>
          <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded-sm font-bold font-mono">
            {contacts.filter(c => c.type === 'Property Owner').length}
          </span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-sm p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
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
        </div>

        <input
          type="text"
          placeholder="Search name, phone, trade, company..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-300 rounded-sm px-3 py-1.5 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-64"
        />
      </div>

      {/* Contacts Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredContacts.map(contact => (
          <div 
            key={contact.id}
            className="bg-white rounded-sm border border-slate-200 shadow-xs p-4 hover:border-slate-400 transition-colors flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              {/* Header with Avatar & Type */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-sm flex items-center justify-center text-white font-bold text-xs shadow-xs ${contact.avatarBg}`}>
                    {contact.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs leading-snug">{contact.name}</h3>
                    {contact.company && (
                      <p className="text-[11px] text-slate-500 font-medium">{contact.company}</p>
                    )}
                  </div>
                </div>

                <span className={`text-[10px] px-2 py-0.5 rounded-sm font-bold uppercase tracking-tight border ${
                  contact.type === 'Tenant' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  contact.type === 'Vendor / Contractor' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  contact.type === 'Property Owner' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                  'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  {contact.type}
                </span>
              </div>

              {/* Role / Specialty info */}
              {contact.roleOrSpecialty && (
                <div className="text-xs bg-slate-50 p-2 rounded-sm border border-slate-200 text-slate-700">
                  <span className="font-semibold text-slate-900">{contact.roleOrSpecialty}</span>
                  {contact.hourlyRate && (
                    <span className="text-slate-500 ml-2 font-mono">(${contact.hourlyRate}/hr)</span>
                  )}
                  {contact.rating && (
                    <span className="text-amber-600 font-bold ml-2 font-mono">★ {contact.rating}</span>
                  )}
                </div>
              )}

              {/* Property & Room if tenant or owner */}
              {contact.propertyName && (
                <div className="text-xs text-slate-600">
                  <p><strong className="text-slate-800">{contact.propertyName}</strong></p>
                  {contact.roomName && <p className="text-slate-600 font-medium text-[11px] ml-4">{contact.roomName}</p>}
                </div>
              )}

              {/* Contact numbers */}
              <div className="space-y-1 text-xs text-slate-600 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Phone:</span>
                  <a href={`tel:${contact.phone}`} className="font-mono font-medium text-slate-800 hover:text-blue-600">
                    {contact.phone}
                  </a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Email:</span>
                  <a href={`mailto:${contact.email}`} className="text-slate-700 truncate max-w-[180px] hover:text-blue-600 font-mono text-[11px]">
                    {contact.email}
                  </a>
                </div>
                {contact.emergencyContactName && (
                  <div className="pt-1 text-[11px] text-slate-500 flex justify-between">
                    <span>Emergency:</span>
                    <span className="font-medium text-slate-700">{contact.emergencyContactName} ({contact.emergencyContactPhone})</span>
                  </div>
                )}
              </div>

              {/* Notes */}
              {contact.notes && (
                <p className="text-[11px] text-slate-500 italic bg-slate-50 p-1.5 rounded-sm border border-slate-200 line-clamp-2">
                  "{contact.notes}"
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  setQuickSmsModalContact(contact);
                  setSmsMessage(`Hi ${contact.name.split(' ')[0]}, this is Moyer Property Management regarding `);
                }}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-sm text-xs font-semibold flex items-center gap-1 uppercase tracking-tight transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                <span>Quick SMS</span>
              </button>

              <div className="flex items-center gap-1.5">
                <a
                  href={`tel:${contact.phone}`}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-sm transition-colors"
                  title="Call Contact"
                >
                  <Phone className="w-3.5 h-3.5" />
                </a>
                <a
                  href={`mailto:${contact.email}`}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-sm transition-colors"
                  title="Email Contact"
                >
                  <Mail className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => onOpenEditContactModal(contact)}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-sm transition-colors"
                  title="Edit Contact"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick SMS Modal */}
      {quickSmsModalContact && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-sm p-5 max-w-md w-full shadow-lg border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 uppercase tracking-wide">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span>SMS to {quickSmsModalContact.name}</span>
              </h3>
              <button
                onClick={() => setQuickSmsModalContact(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-1.5">Recipient Mobile: <strong className="text-slate-800 font-mono">{quickSmsModalContact.phone}</strong></p>
              <textarea
                rows={4}
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                placeholder="Type resident message, maintenance update, or notice..."
                className="w-full text-xs p-3 border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {smsSentNotice && (
              <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-sm text-xs font-semibold text-center">
                ✓ Message sent via Moyer Resident Portal Gateway!
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setQuickSmsModalContact(null)}
                className="px-3 py-1.5 rounded-sm border border-slate-300 text-slate-600 text-xs font-semibold uppercase tracking-wider hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendQuickSMS}
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
