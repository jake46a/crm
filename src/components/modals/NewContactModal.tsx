import React, { useState, useEffect } from 'react';
import { Contact as ContactIcon, Plus, X, Trash2, Wrench, Users2, ShieldCheck, DollarSign, Award } from 'lucide-react';
import { Contact, ContactType, Property } from '../../types';

interface NewContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
  onSave: (contact: Contact) => void;
  onDeleteRequest?: (contact: Contact) => void;
  editingContact?: Contact | null;
  defaultType?: ContactType;
}

export const NewContactModal: React.FC<NewContactModalProps> = ({
  isOpen,
  onClose,
  properties,
  onSave,
  onDeleteRequest,
  editingContact,
  defaultType = 'Vendor / Contractor'
}) => {
  const [name, setName] = useState<string>('');
  const [type, setType] = useState<ContactType>(defaultType);
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [secondaryPhone, setSecondaryPhone] = useState<string>('');
  const [company, setCompany] = useState<string>('');
  const [roleOrSpecialty, setRoleOrSpecialty] = useState<string>('');
  const [hourlyRate, setHourlyRate] = useState<number | undefined>(undefined);
  const [tradeCategory, setTradeCategory] = useState<string>('Plumbing');
  const [emergencyAvailable, setEmergencyAvailable] = useState<boolean>(false);
  const [w9OnRecord, setW9OnRecord] = useState<boolean>(true);
  const [insurancePolicyExpiry, setInsurancePolicyExpiry] = useState<string>('');
  const [licenseNumber, setLicenseNumber] = useState<string>('');
  const [commissionRate, setCommissionRate] = useState<string>('$250 / signed lease');
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);
  const [propertyId, setPropertyId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [emergencyContactName, setEmergencyContactName] = useState<string>('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState<string>('');

  useEffect(() => {
    if (editingContact) {
      setName(editingContact.name || '');
      setType(editingContact.type || 'Vendor / Contractor');
      setEmail(editingContact.email || '');
      setPhone(editingContact.phone || '');
      setSecondaryPhone(editingContact.secondaryPhone || '');
      setCompany(editingContact.company || '');
      setRoleOrSpecialty(editingContact.roleOrSpecialty || '');
      setHourlyRate(editingContact.hourlyRate);
      setTradeCategory(editingContact.tradeCategory || 'Plumbing');
      setEmergencyAvailable(editingContact.emergencyAvailable || editingContact.status === 'Available 24/7');
      setW9OnRecord(editingContact.w9OnRecord ?? true);
      setInsurancePolicyExpiry(editingContact.insurancePolicyExpiry || '');
      setLicenseNumber(editingContact.licenseNumber || '');
      setCommissionRate(editingContact.commissionRate ? String(editingContact.commissionRate) : '$250 / signed lease');
      setSelectedPropertyIds(editingContact.assignedProperties || (editingContact.propertyId ? [editingContact.propertyId] : []));
      setPropertyId(editingContact.propertyId || '');
      setNotes(editingContact.notes || '');
      setEmergencyContactName(editingContact.emergencyContactName || '');
      setEmergencyContactPhone(editingContact.emergencyContactPhone || '');
    } else {
      setName('');
      setType(defaultType);
      setEmail('');
      setPhone('');
      setSecondaryPhone('');
      setCompany('');
      setRoleOrSpecialty(defaultType === 'Leasing Agent' ? 'Licensed Coliving Specialist' : defaultType === 'Vendor / Contractor' ? 'Master Plumber' : '');
      setHourlyRate(defaultType === 'Vendor / Contractor' ? 95 : undefined);
      setTradeCategory('Plumbing');
      setEmergencyAvailable(false);
      setW9OnRecord(true);
      setInsurancePolicyExpiry('');
      setLicenseNumber('');
      setCommissionRate('$250 / signed lease');
      setSelectedPropertyIds([]);
      setPropertyId('');
      setNotes('');
      setEmergencyContactName('');
      setEmergencyContactPhone('');
    }
  }, [editingContact, defaultType, isOpen]);

  if (!isOpen) return null;

  const handleToggleProperty = (propId: string) => {
    if (selectedPropertyIds.includes(propId)) {
      setSelectedPropertyIds(selectedPropertyIds.filter(id => id !== propId));
    } else {
      setSelectedPropertyIds([...selectedPropertyIds, propId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const prop = properties.find(p => p.id === propertyId);
    const assignedProps = properties.filter(p => selectedPropertyIds.includes(p.id));

    const colors = [
      'bg-indigo-600',
      'bg-emerald-600',
      'bg-amber-600',
      'bg-rose-600',
      'bg-cyan-600',
      'bg-purple-600',
      'bg-teal-600',
      'bg-blue-600'
    ];
    const randomBg = colors[Math.floor(Math.random() * colors.length)];

    const statusValue = type === 'Vendor / Contractor' && emergencyAvailable 
      ? 'Available 24/7' 
      : editingContact?.status || 'Active';

    const newContact: Contact = {
      id: editingContact?.id || `con-${Date.now()}`,
      name: name.trim(),
      type,
      status: statusValue,
      email: email.trim(),
      phone: phone.trim(),
      secondaryPhone: secondaryPhone.trim() || undefined,
      company: company.trim() || undefined,
      roleOrSpecialty: roleOrSpecialty.trim() || undefined,
      hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
      propertyId: propertyId || (selectedPropertyIds.length > 0 ? selectedPropertyIds[0] : undefined),
      propertyName: prop?.name || (assignedProps.length > 0 ? assignedProps.map(p => p.name).join(', ') : undefined),
      notes: notes.trim(),
      emergencyContactName: emergencyContactName.trim() || undefined,
      emergencyContactPhone: emergencyContactPhone.trim() || undefined,
      avatarBg: editingContact?.avatarBg || randomBg,
      // Leasing agent fields
      licenseNumber: type === 'Leasing Agent' ? licenseNumber.trim() || undefined : undefined,
      commissionRate: type === 'Leasing Agent' ? commissionRate.trim() || undefined : undefined,
      assignedProperties: type === 'Leasing Agent' ? selectedPropertyIds : undefined,
      assignedPropertyNames: type === 'Leasing Agent' ? assignedProps.map(p => p.name) : undefined,
      // Vendor fields
      tradeCategory: type === 'Vendor / Contractor' ? tradeCategory : undefined,
      emergencyAvailable: type === 'Vendor / Contractor' ? emergencyAvailable : undefined,
      w9OnRecord: type === 'Vendor / Contractor' ? w9OnRecord : undefined,
      insurancePolicyExpiry: type === 'Vendor / Contractor' ? insurancePolicyExpiry || undefined : undefined
    };

    onSave(newContact);
    onClose();
  };

  const getHeaderTitle = () => {
    if (editingContact) {
      return `Edit ${editingContact.type}: ${editingContact.name}`;
    }
    if (type === 'Vendor / Contractor') return 'Add Vendor / Contractor';
    if (type === 'Leasing Agent') return 'Add Leasing Agent';
    return 'Add Directory Contact';
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow-xs ${
              type === 'Leasing Agent' ? 'bg-purple-600' : type === 'Vendor / Contractor' ? 'bg-amber-600' : 'bg-blue-600'
            }`}>
              {type === 'Leasing Agent' ? <Users2 className="w-4 h-4" /> : type === 'Vendor / Contractor' ? <Wrench className="w-4 h-4" /> : <ContactIcon className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">
                {getHeaderTitle()}
              </h2>
              <p className="text-[11px] text-slate-400">
                {type === 'Vendor / Contractor' ? 'Manage contractor trades, rates, and 24/7 dispatch' : type === 'Leasing Agent' ? 'Manage licensed agent, commission splits, and properties' : 'Save resident, contractor, or property investor'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs max-h-[750px] overflow-y-auto">
          {/* Contact Type Selector */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Contact Classification *</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('Vendor / Contractor')}
                className={`p-2 rounded-lg border text-center font-semibold text-xs transition-colors flex flex-col items-center gap-1 ${
                  type === 'Vendor / Contractor'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-900 ring-1 ring-amber-500'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Wrench className="w-4 h-4 text-amber-600" />
                <span>Vendor / Trade</span>
              </button>

              <button
                type="button"
                onClick={() => setType('Leasing Agent')}
                className={`p-2 rounded-lg border text-center font-semibold text-xs transition-colors flex flex-col items-center gap-1 ${
                  type === 'Leasing Agent'
                    ? 'bg-purple-500/15 border-purple-500 text-purple-900 ring-1 ring-purple-500'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Users2 className="w-4 h-4 text-purple-600" />
                <span>Leasing Agent</span>
              </button>

              <button
                type="button"
                onClick={() => setType('Property Owner')}
                className={`p-2 rounded-lg border text-center font-semibold text-xs transition-colors flex flex-col items-center gap-1 ${
                  type === 'Property Owner'
                    ? 'bg-blue-500/15 border-blue-500 text-blue-900 ring-1 ring-blue-500'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <ContactIcon className="w-4 h-4 text-blue-600" />
                <span>Other / Owner</span>
              </button>
            </div>
          </div>

          {/* Name & Company */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder={type === 'Leasing Agent' ? 'e.g. Sarah Jenkins' : 'e.g. Steve Kowalski'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Company / Organization</label>
              <input
                type="text"
                placeholder={type === 'Leasing Agent' ? 'Moyer Property Management' : 'Front Range Rapid Plumbing LLC'}
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Primary Phone *</label>
              <input
                type="tel"
                required
                placeholder="(303) 555-0199"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                placeholder={type === 'Leasing Agent' ? 'sarah@moyerpm.com' : 'steve@plumbing.co'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              />
            </div>
          </div>

          {/* Secondary phone if vendor */}
          {type === 'Vendor / Contractor' && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">24/7 Emergency Dispatch Phone (Optional)</label>
              <input
                type="text"
                placeholder="(303) 555-9801 (24/7 Emergency Dispatch)"
                value={secondaryPhone}
                onChange={(e) => setSecondaryPhone(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900"
              />
            </div>
          )}

          {/* ================= VENDOR SPECIFIC FIELDS ================= */}
          {type === 'Vendor / Contractor' && (
            <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-200 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <Wrench className="w-4 h-4 text-amber-600" />
                <span>Trade Qualifications & Dispatch Settings</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Primary Trade Category</label>
                  <select
                    value={tradeCategory}
                    onChange={(e) => setTradeCategory(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium text-xs text-slate-800"
                  >
                    <option value="Plumbing">Plumbing & Drains</option>
                    <option value="Electrical">Electrical & Smart Locks</option>
                    <option value="HVAC / Heating">HVAC, Boilers & Heating</option>
                    <option value="Appliance">Appliance Care & Refrigeration</option>
                    <option value="Cleaning">Cleaning & Sanitization</option>
                    <option value="General Handyman">General Maintenance & Drywall</option>
                    <option value="Painting & Drywall">Painting & Finishes</option>
                    <option value="Locks & Access">Locks, Hardware & Access</option>
                    <option value="Pest Control">Pest Control & Extermination</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Standard Hourly Rate ($/hr)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 font-mono">$</span>
                    <input
                      type="number"
                      placeholder="95"
                      value={hourlyRate || ''}
                      onChange={(e) => setHourlyRate(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full pl-6 p-2 bg-white border border-slate-300 rounded-lg font-mono text-xs text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Specialty & Trade Certifications</label>
                <input
                  type="text"
                  placeholder="e.g. Master Plumber & Backflow Certified"
                  value={roleOrSpecialty}
                  onChange={(e) => setRoleOrSpecialty(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              {/* Badges & Checkboxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emergencyAvailable}
                    onChange={(e) => setEmergencyAvailable(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-slate-800 font-semibold text-[11px]">Available for 24/7 Emergencies</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={w9OnRecord}
                    onChange={(e) => setW9OnRecord(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-slate-800 font-semibold text-[11px]">W-9 & Tax ID on Record</span>
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Insurance / Liability Expiration Date</label>
                <input
                  type="date"
                  value={insurancePolicyExpiry}
                  onChange={(e) => setInsurancePolicyExpiry(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800"
                />
              </div>
            </div>
          )}

          {/* ================= LEASING AGENT SPECIFIC FIELDS ================= */}
          {type === 'Leasing Agent' && (
            <div className="bg-purple-50/50 p-3.5 rounded-xl border border-purple-200 space-y-3">
              <div className="flex items-center gap-2 text-purple-900 font-bold text-xs">
                <Users2 className="w-4 h-4 text-purple-600" />
                <span>Leasing Agent License & Coverage</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Real Estate / Agent License #</label>
                  <input
                    type="text"
                    placeholder="e.g. CO-EA4001928"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Commission Structure</label>
                  <input
                    type="text"
                    placeholder="e.g. $250 / signed lease"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Role Title / Focus Area</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Coliving Specialist & Showing Lead"
                  value={roleOrSpecialty}
                  onChange={(e) => setRoleOrSpecialty(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Assigned Coverage Properties</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {properties.map(p => (
                    <label 
                      key={p.id}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                        selectedPropertyIds.includes(p.id)
                          ? 'bg-purple-100/70 border-purple-300 text-purple-950 font-semibold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPropertyIds.includes(p.id)}
                        onChange={() => handleToggleProperty(p.id)}
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span className="truncate">{p.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Notes & Description */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Internal Notes & Operating Guidelines</label>
            <textarea
              rows={2}
              placeholder={type === 'Leasing Agent' ? 'Handles roommate harmony screening, virtual video walk-throughs...' : 'Preferred vendor for after-hours emergency repairs...'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            {editingContact && onDeleteRequest ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDeleteRequest(editingContact);
                }}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete {type === 'Vendor / Contractor' ? 'Vendor' : type === 'Leasing Agent' ? 'Agent' : 'Contact'}</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold shadow-md transition-colors"
              >
                {editingContact ? 'Save Changes' : 'Create Entry'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

