import React, { useState, useEffect } from 'react';
import { Contact as ContactIcon, Plus, X, Trash2, AlertTriangle, CreditCard, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { Contact, ContactType, Property } from '../../types';
import { splitFullName, formatFullName } from '../../utils/nameUtils';
import { SquareService } from '../../services/squareService';

interface NewContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
  onSave: (contact: Contact) => void;
  editingContact?: Contact | null;
  onDeleteContact?: (contactId: string) => void;
}

export const NewContactModal: React.FC<NewContactModalProps> = ({
  isOpen,
  onClose,
  properties,
  onSave,
  editingContact,
  onDeleteContact
}) => {
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [type, setType] = useState<ContactType>('Tenant');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [company, setCompany] = useState<string>('');
  const [roleOrSpecialty, setRoleOrSpecialty] = useState<string>('');
  const [hourlyRate, setHourlyRate] = useState<number | undefined>(undefined);
  const [propertyId, setPropertyId] = useState<string>('');
  const [licenseNumber, setLicenseNumber] = useState<string>('');
  const [commissionRate, setCommissionRate] = useState<string>('');
  const [status, setStatus] = useState<'Active' | 'Past' | 'Prospect' | 'Available 24/7' | 'On Leave' | 'Inactive'>('Active');
  const [notes, setNotes] = useState<string>('');
  const [emergencyContactName, setEmergencyContactName] = useState<string>('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState<string>('');
  const [squareCustomerId, setSquareCustomerId] = useState<string>('');
  const [isSyncingSquare, setIsSyncingSquare] = useState<boolean>(false);
  const [squareSyncStatus, setSquareSyncStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setIsConfirmingDelete(false);
      setSquareSyncStatus(null);
      if (editingContact) {
        let fName = editingContact.firstName || '';
        let lName = editingContact.lastName || '';
        if (!fName && !lName && editingContact.name) {
          const split = splitFullName(editingContact.name);
          fName = split.firstName;
          lName = split.lastName;
        }
        setFirstName(fName);
        setLastName(lName);
        setType(editingContact.type || 'Tenant');
        setEmail(editingContact.email || '');
        setPhone(editingContact.phone || '');
        setCompany(editingContact.company || '');
        setRoleOrSpecialty(editingContact.roleOrSpecialty || '');
        setHourlyRate(editingContact.hourlyRate);
        setPropertyId(editingContact.propertyId || '');
        setLicenseNumber(editingContact.licenseNumber || '');
        setCommissionRate(editingContact.commissionRate || '');
        setStatus(editingContact.status || 'Active');
        setNotes(editingContact.notes || '');
        setEmergencyContactName(editingContact.emergencyContactName || '');
        setEmergencyContactPhone(editingContact.emergencyContactPhone || '');
        setSquareCustomerId(editingContact.squareCustomerId || '');
      } else {
        setFirstName('');
        setLastName('');
        setType('Tenant');
        setEmail('');
        setPhone('');
        setCompany('');
        setRoleOrSpecialty('Senior Leasing Agent');
        setHourlyRate(undefined);
        setPropertyId('');
        setLicenseNumber('');
        setCommissionRate('');
        setStatus('Active');
        setNotes('');
        setEmergencyContactName('');
        setEmergencyContactPhone('');
        setSquareCustomerId('');
      }
    }
  }, [isOpen, editingContact]);

  const handleRefreshSquareCustomer = async () => {
    if (!email.trim()) {
      setSquareSyncStatus({
        type: 'error',
        message: 'Tenant email address is required to query or create in Square.'
      });
      return;
    }

    setIsSyncingSquare(true);
    setSquareSyncStatus(null);
    try {
      const result = await SquareService.searchOrCreateCustomer({
        email: email.trim(),
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        phone: phone.trim() || undefined,
        note: `Coliving Tenant in Moyer PM CRM`
      });

      if (result.customerId) {
        setSquareCustomerId(result.customerId);
        setSquareSyncStatus({
          type: 'success',
          message: result.isNew 
            ? `New Square customer created: ${result.customerId}` 
            : `Existing Square customer matched: ${result.customerId}`
        });
      }
    } catch (err: any) {
      setSquareSyncStatus({
        type: 'error',
        message: err.message || 'Error querying Square Customers API'
      });
    } finally {
      setIsSyncingSquare(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fName = firstName.trim();
    const lName = lastName.trim();
    const fullName = formatFullName(fName, lName);
    if (!fullName || !phone.trim()) return;

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

    const isVendor = type === 'Vendor / Contractor';
    const isTenant = type === 'Tenant';
    const isOwner = type === 'Property Owner';
    const isAgent = type === 'Leasing Agent';

    // If new tenant has email but no squareCustomerId yet, query Square automatically
    const saveContactWithSquare = async () => {
      let finalSquareId = squareCustomerId.trim();
      if (isTenant && email.trim() && !finalSquareId) {
        try {
          const res = await SquareService.searchOrCreateCustomer({
            email: email.trim(),
            firstName: fName || undefined,
            lastName: lName || undefined,
            phone: phone.trim() || undefined,
            note: 'Coliving Tenant in Moyer PM CRM'
          });
          if (res.customerId) {
            finalSquareId = res.customerId;
          }
        } catch (err) {
          console.warn('Square customer auto-sync on save notice:', err);
        }
      }

      const newContact: Contact = {
        id: editingContact?.id || `con-${Date.now()}`,
        firstName: fName || undefined,
        lastName: lName || undefined,
        name: fullName,
        type,
        status: isAgent ? status : (editingContact?.status || 'Active'),
        email: email.trim() || undefined,
        phone: phone.trim(),
        company: (isVendor || isOwner) && company.trim() ? company.trim() : undefined,
        roleOrSpecialty: (isVendor || isAgent) && roleOrSpecialty.trim() ? roleOrSpecialty.trim() : (isAgent ? 'Leasing Agent' : undefined),
        hourlyRate: isVendor && hourlyRate ? Number(hourlyRate) : undefined,
        licenseNumber: isAgent && licenseNumber.trim() ? licenseNumber.trim() : undefined,
        commissionRate: isAgent && commissionRate.trim() ? commissionRate.trim() : undefined,
        propertyId: (isTenant || isOwner || isAgent) && propertyId ? propertyId : undefined,
        propertyName: (isTenant || isOwner || isAgent) ? prop?.name : undefined,
        notes: notes.trim() || '',
        emergencyContactName: isTenant && emergencyContactName.trim() ? emergencyContactName.trim() : undefined,
        emergencyContactPhone: isTenant && emergencyContactPhone.trim() ? emergencyContactPhone.trim() : undefined,
        squareCustomerId: isTenant && finalSquareId ? finalSquareId : undefined,
        avatarBg: editingContact?.avatarBg || (isAgent ? 'bg-indigo-600' : randomBg)
      };

      onSave(newContact);
      onClose();
    };

    saveContactWithSquare();
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-lg w-full shadow-2xl border border-zinc-200 overflow-hidden my-8">
        <div className="bg-zinc-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-indigo-600 flex items-center justify-center font-bold text-white shadow-xs">
              <ContactIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">
                {editingContact ? `Edit Contact: ${formatFullName(firstName, lastName, editingContact.name)}` : 'Add Directory Contact'}
              </h2>
              <p className="text-[11px] text-zinc-400">Save tenant, contractor vendor, or property investor</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs max-h-[700px] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-zinc-700 mb-1">First Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Sarah"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Last Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Jenkins"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-zinc-700 mb-1">Contact Type *</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="Leasing Agent">Leasing Agent</option>
              <option value="Tenant">Active Room Tenant</option>
              <option value="Vendor / Contractor">Vendor / Contractor</option>
              <option value="Property Owner">Property Owner</option>
              <option value="Lead">Lead / Prospect</option>
              <option value="Emergency Contact">Emergency Contact</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                placeholder="(303) 555-0199"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-zinc-700 mb-1">Email Address</label>
              <input
                type="email"
                placeholder={type === 'Leasing Agent' ? 'agent@moyerpm.com' : 'contact@example.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {type === 'Leasing Agent' && (
            <div className="bg-indigo-50/70 p-3 rounded-md border border-indigo-200 space-y-2.5">
              <span className="font-bold text-indigo-900 text-xs block">Leasing Agent & Showing Profile</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-zinc-600 font-medium">Agent Title / Specialty</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Leasing Agent"
                    value={roleOrSpecialty}
                    onChange={(e) => setRoleOrSpecialty(e.target.value)}
                    className="w-full p-2 bg-white border border-zinc-300 rounded-md text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-600 font-medium">License # / Agent ID</label>
                  <input
                    type="text"
                    placeholder="e.g. DRE #02194820"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="w-full p-2 bg-white border border-zinc-300 rounded-md text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-zinc-600 font-medium">Assigned Primary Territory</label>
                  <select
                    value={propertyId}
                    onChange={(e) => setPropertyId(e.target.value)}
                    className="w-full p-2 bg-white border border-zinc-300 rounded-md text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">All Properties (Portfolio-Wide)</option>
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-600 font-medium">Active Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full p-2 bg-white border border-zinc-300 rounded-md text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Active">Active (Taking Inbound Leads & Tours)</option>
                    <option value="On Leave">On Leave / Away</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {type === 'Vendor / Contractor' && (
            <div className="bg-zinc-50 p-3 rounded-md border border-zinc-200 space-y-2.5">
              <span className="font-bold text-zinc-800 text-xs block">Contractor Trade & Rates</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-zinc-500">Trade / Specialty</label>
                  <input
                    type="text"
                    placeholder="e.g. Master Plumber & Drain Specialist"
                    value={roleOrSpecialty}
                    onChange={(e) => setRoleOrSpecialty(e.target.value)}
                    className="w-full p-2 bg-white border border-zinc-300 rounded-md text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500">Hourly Rate ($/hr)</label>
                  <input
                    type="number"
                    value={hourlyRate || ''}
                    onChange={(e) => setHourlyRate(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full p-2 bg-white border border-zinc-300 rounded-md text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-zinc-500">Company Name</label>
                <input
                  type="text"
                  placeholder="Front Range Rapid Plumbing"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full p-2 bg-white border border-zinc-300 rounded-md text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {type === 'Tenant' && (
            <div className="bg-zinc-50 p-3 rounded-md border border-zinc-200 space-y-2.5">
              <span className="font-bold text-zinc-800 text-xs block">Property & Emergency Contact</span>
              <div>
                <label className="block text-[11px] text-zinc-500">Assigned House</label>
                <select
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  className="w-full p-2 bg-white border border-zinc-300 rounded-md text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">-- Select House --</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-zinc-500">Next of Kin / Emergency Contact</label>
                  <input
                    type="text"
                    placeholder="e.g. Martha (Mother)"
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                    className="w-full p-2 bg-white border border-zinc-300 rounded-md text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500">Emergency Phone</label>
                  <input
                    type="tel"
                    placeholder="(303) 555-0144"
                    value={emergencyContactPhone}
                    onChange={(e) => setEmergencyContactPhone(e.target.value)}
                    className="w-full p-2 bg-white border border-zinc-300 rounded-md text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Square Customer ID & Refresh Button */}
              <div className="pt-2 border-t border-zinc-200">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <label className="flex items-center gap-1.5 font-bold text-zinc-800 text-[11px] uppercase tracking-wider">
                    <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Square Customer ID</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleRefreshSquareCustomer}
                    disabled={isSyncingSquare || !email.trim()}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-300 rounded-sm shadow-2xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Query Square Customers API by email address or create new customer"
                  >
                    <RefreshCw className={`w-3 h-3 text-indigo-600 ${isSyncingSquare ? 'animate-spin' : ''}`} />
                    <span>Refresh Square Customer ID</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={squareCustomerId}
                  onChange={(e) => setSquareCustomerId(e.target.value)}
                  placeholder="Auto-synced via Square Customers API..."
                  className="w-full p-2 bg-white border border-zinc-300 rounded-md font-mono text-xs text-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                {squareSyncStatus && (
                  <div className={`mt-1.5 p-2 rounded text-xs flex items-center gap-1.5 ${
                    squareSyncStatus.type === 'success' 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}>
                    {squareSyncStatus.type === 'success' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    )}
                    <span className="leading-tight">{squareSyncStatus.message}</span>
                  </div>
                )}
                <p className="text-[10px] text-zinc-500 mt-1">
                  Square Customer record is queried using tenant's email address. If no match is found, a customer is created in Square automatically.
                </p>
              </div>
            </div>
          )}

          {type === 'Property Owner' && (
            <div className="bg-zinc-50 p-3 rounded-md border border-zinc-200 space-y-2.5">
              <span className="font-bold text-zinc-800 text-xs block">Property Owner / Investor Details</span>
              <div>
                <label className="block text-[11px] text-zinc-500">Owned Property / House</label>
                <select
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  className="w-full p-2 bg-white border border-zinc-300 rounded-md text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">-- Select Property --</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-zinc-500">Company / Entity / LLC Name</label>
                <input
                  type="text"
                  placeholder="e.g. Apex Real Estate Holdings LLC"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full p-2 bg-white border border-zinc-300 rounded-md text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-bold text-zinc-700 mb-1">Notes & Details</label>
            <textarea
              rows={2}
              placeholder="e.g. Preferred vendor for emergency after-hours HVAC repairs."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {isConfirmingDelete && editingContact && onDeleteContact && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-rose-800">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>Delete <strong>{editingContact.name}</strong> from directory permanently?</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(false)}
                  className="px-2.5 py-1 text-zinc-600 hover:bg-white rounded border border-zinc-200 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteContact(editingContact.id);
                    onClose();
                  }}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold text-xs shadow-xs"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-zinc-200">
            {editingContact && onDeleteContact ? (
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                className="w-full sm:w-auto px-3.5 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-md font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Contact</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2 rounded-md border border-zinc-300 text-zinc-700 font-medium hover:bg-zinc-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-bold shadow-xs transition"
              >
                {editingContact ? 'Save Contact' : 'Create Contact'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
