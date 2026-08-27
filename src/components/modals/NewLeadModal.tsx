import React, { useState } from 'react';
import { Users2, Plus, X, Building, DollarSign } from 'lucide-react';
import { TenantLead, LeadStage, Property } from '../../types';

interface NewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
  onSave: (lead: TenantLead) => void;
  editingLead?: TenantLead | null;
}

export const NewLeadModal: React.FC<NewLeadModalProps> = ({
  isOpen,
  onClose,
  properties,
  onSave,
  editingLead
}) => {
  const [name, setName] = useState<string>(editingLead?.name || '');
  const [email, setEmail] = useState<string>(editingLead?.email || '');
  const [phone, setPhone] = useState<string>(editingLead?.phone || '');
  const [source, setSource] = useState<string>(editingLead?.source || 'Roomies.com');
  const [stage, setStage] = useState<LeadStage>(editingLead?.stage || 'New Lead');
  const [assignedAgent, setAssignedAgent] = useState<string>(editingLead?.assignedAgent || 'Jake Moyer (Lead Broker)');
  const [maxBudget, setMaxBudget] = useState<number>(editingLead?.maxBudget || 1050);
  const [targetMoveInDate, setTargetMoveInDate] = useState<string>(
    editingLead?.targetMoveInDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );
  const [preferredBathroom, setPreferredBathroom] = useState<string>(editingLead?.preferredBathroom || 'Private Ensuite Preferred');
  const [preferredPropertyId, setPreferredPropertyId] = useState<string>(editingLead?.preferredPropertyIds[0] || properties[0]?.id || '');
  const [occupation, setOccupation] = useState<string>(editingLead?.occupation || 'Software Engineer');
  const [monthlyIncome, setMonthlyIncome] = useState<number>(editingLead?.monthlyIncome || 4800);
  const [score, setScore] = useState<number>(editingLead?.score || 88);
  const [isFurnishedPreferred, setIsFurnishedPreferred] = useState<boolean>(editingLead?.isFurnishedPreferred ?? true);

  // Lifestyle
  const [cleanliness, setCleanliness] = useState<string>(editingLead?.lifestyleProfile.cleanliness || 'Very Clean / Daily Tidy');
  const [schedule, setSchedule] = useState<string>(editingLead?.lifestyleProfile.schedule || '9-to-5 Daytime');
  const [socialLevel, setSocialLevel] = useState<string>(editingLead?.lifestyleProfile.socialLevel || 'Balanced (Polite & Independent)');
  const [notes, setNotes] = useState<string>(editingLead?.notes || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const newLead: TenantLead = {
      id: editingLead?.id || `lead-${Date.now()}`,
      name,
      email,
      phone: phone || '(303) 555-0199',
      source: source as any,
      stage,
      assignedAgent,
      createdDate: editingLead?.createdDate || new Date().toISOString().split('T')[0],
      score: Number(score) || 85,
      preferredPropertyIds: [preferredPropertyId],
      preferredBathroom: preferredBathroom as any,
      furnishingPreference: isFurnishedPreferred ? 'Furnished Only' : 'Either',
      creditScoreRange: '700-749 (Good)',
      maxBudget: Number(maxBudget) || 1000,
      targetMoveInDate,
      occupation,
      monthlyIncome: Number(monthlyIncome) || 3500,
      lifestyleProfile: {
        cleanliness,
        schedule,
        socialLevel,
        pets: (editingLead?.lifestyleProfile.pets as any) || 'No Pets',
        smoking: (editingLead?.lifestyleProfile.smoking as any) || 'Non-smoker strictly'
      },
      notes,
      activityHistory: editingLead?.activityHistory || [
        {
          id: 'act-1',
          date: new Date().toISOString().replace('T', ' ').slice(0, 16),
          type: 'note',
          title: 'Lead Inbound Registered',
          content: `Inquiry recorded via ${source} with $${maxBudget}/mo budget for Month-to-Month lease.`,
          agent: assignedAgent
        }
      ]
    };

    onSave(newLead);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-xl w-full shadow-2xl border border-zinc-200 overflow-hidden my-8">
        <div className="bg-zinc-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-indigo-600 flex items-center justify-center font-bold text-white shadow-xs">
              <Users2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">
                {editingLead ? `Edit Lead: ${editingLead.name}` : 'Record New Tenant Lead'}
              </h2>
              <p className="text-[11px] text-zinc-400">Add applicant profile, room preferences, and roommate survey</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs max-h-[700px] overflow-y-auto">
          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Jordan Miller"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Email *</label>
              <input
                type="email"
                required
                placeholder="jordan@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Phone Number</label>
              <input
                type="tel"
                placeholder="(303) 555-0182"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Lead Source & Stage */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Acquisition Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="Roomies.com">Roomies.com</option>
                <option value="Zillow Room Rental">Zillow Room Rental</option>
                <option value="Craigslist Housing">Craigslist Housing</option>
                <option value="Facebook Marketplace">Facebook Marketplace</option>
                <option value="Tenant Referral">Tenant Referral</option>
                <option value="Direct Website">Direct Website</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-zinc-700 mb-1">Pipeline Stage</label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as any)}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="New Inquiry">New Inquiry</option>
                <option value="Tour Scheduled">Tour Scheduled</option>
                <option value="Application Submitted">Application Submitted</option>
                <option value="Screening & Background">Screening & Background</option>
                <option value="Approved">Approved</option>
                <option value="Lease Sent">Lease Sent</option>
                <option value="Signed / Converted">Signed / Converted</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-zinc-700 mb-1">Lead Score (0-100)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md font-bold text-emerald-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Financials & Preferences */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Occupation</label>
              <input
                type="text"
                placeholder="e.g. Registered Nurse"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-zinc-700 mb-1">Monthly Income ($)</label>
              <input
                type="number"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-zinc-700 mb-1">Max Budget ($/mo)</label>
              <input
                type="number"
                value={maxBudget}
                onChange={(e) => setMaxBudget(Number(e.target.value))}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-zinc-900"
              />
            </div>
          </div>

          {/* Property & Room Preferences */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Preferred House</label>
              <select
                value={preferredPropertyId}
                onChange={(e) => setPreferredPropertyId(e.target.value)}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-zinc-700 mb-1">Bath Preference</label>
              <select
                value={preferredBathroom}
                onChange={(e) => setPreferredBathroom(e.target.value)}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="Private Ensuite Preferred">Private Ensuite Preferred</option>
                <option value="Shared Bathroom OK">Shared Bathroom OK</option>
                <option value="Any Bathroom Type">Any Bathroom Type</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-zinc-700 mb-1">Target Move-in</label>
              <input
                type="date"
                value={targetMoveInDate}
                onChange={(e) => setTargetMoveInDate(e.target.value)}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Roommate Lifestyle Compatibility Survey */}
          <div className="bg-zinc-50 p-3.5 rounded-md border border-zinc-200 space-y-3">
            <span className="font-bold text-zinc-800 text-xs block">Coliving Compatibility Profile</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] text-zinc-500 mb-1">Cleanliness</label>
                <select
                  value={cleanliness}
                  onChange={(e) => setCleanliness(e.target.value)}
                  className="w-full p-2 bg-white border border-zinc-300 rounded-md text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Immaculate / Shared Chore Champion">Immaculate / Chore Champion</option>
                  <option value="Very Clean / Daily Tidy">Very Clean / Daily Tidy</option>
                  <option value="Moderate / Standard Neat">Moderate / Standard Neat</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-500 mb-1">Work / Sleep Schedule</label>
                <select
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  className="w-full p-2 bg-white border border-zinc-300 rounded-md text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="9-to-5 Daytime">9-to-5 Daytime</option>
                  <option value="Early Morning (6 AM)">Early Morning (6 AM)</option>
                  <option value="Remote / WFH">Remote / WFH</option>
                  <option value="Night Shift / Hospital">Night Shift / Hospital</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-500 mb-1">Social Style</label>
                <select
                  value={socialLevel}
                  onChange={(e) => setSocialLevel(e.target.value)}
                  className="w-full p-2 bg-white border border-zinc-300 rounded-md text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Quiet & Independent">Quiet & Independent</option>
                  <option value="Balanced (Polite & Independent)">Balanced (Polite & Indep.)</option>
                  <option value="Social & Community-minded">Social & Community</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-zinc-700 mb-1">Inquiry / Screening Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Relocating from Seattle for new tech role. Clean background, no pets."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-zinc-300 text-zinc-700 font-medium hover:bg-zinc-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-bold shadow-xs transition"
            >
              {editingLead ? 'Save Lead' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
