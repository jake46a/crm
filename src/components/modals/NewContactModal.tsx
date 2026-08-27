import React, { useState } from 'react';
import { Contact as ContactIcon, Plus, X } from 'lucide-react';
import { Contact, ContactType, Property } from '../../types';

interface NewContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
  onSave: (contact: Contact) => void;
  editingContact?: Contact | null;
}

export const NewContactModal: React.FC<NewContactModalProps> = ({
  isOpen,
  onClose,
  properties,
  onSave,
  editingContact
}) => {
  const [name, setName] = useState<string>(editingContact?.name || '');
  const [type, setType] = useState<ContactType>(editingContact?.type || 'Vendor / Contractor');
  const [email, setEmail] = useState<string>(editingContact?.email || '');
  const [phone, setPhone] = useState<string>(editingContact?.phone || '');
  const [company, setCompany] = useState<string>(editingContact?.company || '');
  const [roleOrSpecialty, setRoleOrSpecialty] = useState<string>(editingContact?.roleOrSpecialty || 'Licensed Master Plumber');
  const [hourlyRate, setHourlyRate] = useState<number | undefined>(editingContact?.hourlyRate || 85);
  const [propertyId, setPropertyId] = useState<string>(editingContact?.propertyId || '');
  const [notes, setNotes] = useState<string>(editingContact?.notes || '');
  const [emergencyContactName, setEmergencyContactName] = useState<string>(editingContact?.emergencyContactName || '');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState<string>(editingContact?.emergencyContactPhone || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const prop = properties.find(p => p.id === propertyId);

    const colors = [
      'bg-indigo-600',
      'bg-emerald-600',
      'bg-amber-600',
      'bg-rose-600',
      'bg-cyan-600',
      'bg-purple-600'
    ];
    const randomBg = colors[Math.floor(Math.random() * colors.length)];

    const newContact: Contact = {
      id: editingContact?.id || `con-${Date.now()}`,
      name,
      type,
      status: editingContact?.status || 'Active',
      email,
      phone,
      company: company || undefined,
      roleOrSpecialty: roleOrSpecialty || undefined,
      hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
      propertyId: propertyId || undefined,
      propertyName: prop?.name,
      notes: notes || '',
      emergencyContactName: emergencyContactName || undefined,
      emergencyContactPhone: emergencyContactPhone || undefined,
      avatarBg: editingContact?.avatarBg || randomBg
    };

    onSave(newContact);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold">
              <ContactIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">
                {editingContact ? `Edit Contact: ${editingContact.name}` : 'Add Directory Contact'}
              </h2>
              <p className="text-[11px] text-slate-400">Save tenant, contractor vendor, or property investor</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs max-h-[700px] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Steve Kowalski"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Contact Type *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
              >
                <option value="Tenant">Active Room Tenant</option>
                <option value="Vendor / Contractor">Vendor / Contractor</option>
                <option value="Property Owner">Property Owner</option>
                <option value="Lead">Lead / Prospect</option>
                <option value="Emergency Contact">Emergency Contact</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                placeholder="(303) 555-0199"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="steve@plumbing.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {type === 'Vendor / Contractor' && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2.5">
              <span className="font-bold text-slate-800 text-xs block">Contractor Trade & Rates</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-slate-500">Trade / Specialty</label>
                  <input
                    type="text"
                    placeholder="e.g. Master Plumber & Drain Specialist"
                    value={roleOrSpecialty}
                    onChange={(e) => setRoleOrSpecialty(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500">Hourly Rate ($/hr)</label>
                  <input
                    type="number"
                    value={hourlyRate || ''}
                    onChange={(e) => setHourlyRate(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-slate-500">Company Name</label>
                <input
                  type="text"
                  placeholder="Front Range Rapid Plumbing"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>
          )}

          {type === 'Tenant' && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2.5">
              <span className="font-bold text-slate-800 text-xs block">Property & Emergency Contact</span>
              <div>
                <label className="block text-[11px] text-slate-500">Assigned House</label>
                <select
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                >
                  <option value="">-- Select House --</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-500">Next of Kin / Emergency Contact</label>
                  <input
                    type="text"
                    placeholder="e.g. Martha (Mother)"
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500">Emergency Phone</label>
                  <input
                    type="tel"
                    placeholder="(303) 555-0144"
                    value={emergencyContactPhone}
                    onChange={(e) => setEmergencyContactPhone(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">Notes & Details</label>
            <textarea
              rows={2}
              placeholder="e.g. Preferred vendor for emergency after-hours HVAC repairs."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-md transition"
            >
              {editingContact ? 'Save Contact' : 'Create Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
