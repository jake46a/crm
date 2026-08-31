import React, { useState, useEffect } from 'react';
import { FileText, Plus, X, Building, DollarSign, Sparkles, AlertCircle, Calendar, ShieldCheck, Clock, Trash2, User, Mail, Phone } from 'lucide-react';
import { LeaseRenewal, LeaseRenewalStatus, Property, Room } from '../../types';
import { calculateAnnualReviewMilestones } from '../../utils/leaseEngine';

interface NewRenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
  rooms: Room[];
  onSave: (renewal: LeaseRenewal) => void;
  editingRenewal?: LeaseRenewal | null;
  onDelete?: (renewalId: string) => void;
}

export const NewRenewalModal: React.FC<NewRenewalModalProps> = ({
  isOpen,
  onClose,
  properties,
  rooms,
  onSave,
  editingRenewal,
  onDelete
}) => {
  const occupiedRooms = rooms.filter(r => r.status === 'Occupied' || r.id === editingRenewal?.roomId);

  const [roomId, setRoomId] = useState<string>('');
  const [tenantName, setTenantName] = useState<string>('');
  const [tenantEmail, setTenantEmail] = useState<string>('');
  const [tenantPhone, setTenantPhone] = useState<string>('');
  const [renewalStatus, setRenewalStatus] = useState<LeaseRenewalStatus>('Review Pending');
  const [leaseStartDate, setLeaseStartDate] = useState<string>('2025-10-01');
  const [currentMonthlyRent, setCurrentMonthlyRent] = useState<number>(895);
  const [proposedMonthlyRent, setProposedMonthlyRent] = useState<number>(930);
  const [tenantResponseNotes, setTenantResponseNotes] = useState<string>('');
  const [internalNotes, setInternalNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  // Calculate live 1-year anniversary milestones
  const milestones = calculateAnnualReviewMilestones(leaseStartDate, currentMonthlyRent);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setShowDeleteConfirm(false);
      const defaultRoomId = editingRenewal?.roomId || occupiedRooms[0]?.id || (rooms.length > 0 ? rooms[0].id : '');
      setRoomId(defaultRoomId);

      if (editingRenewal) {
        setTenantName(editingRenewal.tenantName || '');
        setTenantEmail(editingRenewal.tenantEmail || '');
        setTenantPhone(editingRenewal.tenantPhone || '');
        setRenewalStatus(editingRenewal.renewalStatus || 'Review Pending');
        setLeaseStartDate(editingRenewal.leaseStartDate || '2025-10-01');
        setCurrentMonthlyRent(editingRenewal.currentMonthlyRent || 895);
        setProposedMonthlyRent(editingRenewal.proposedMonthlyRent || 930);
        setTenantResponseNotes(editingRenewal.tenantResponseNotes || '');
        setInternalNotes(editingRenewal.internalNotes || '');
      } else {
        const r = rooms.find(room => room.id === defaultRoomId);
        const rent = r?.monthlyRent || 895;
        const start = r?.leaseStartDate || '2025-10-01';
        setTenantName(r?.currentTenantName || '');
        setTenantEmail(r?.currentTenantEmail || 'resident@moyercoliving.com');
        setTenantPhone(r?.currentTenantPhone || '(303) 555-0100');
        setRenewalStatus('Review Pending');
        setLeaseStartDate(start);
        setCurrentMonthlyRent(rent);
        setProposedMonthlyRent(Math.round(rent * 1.04));
        setTenantResponseNotes('');
        setInternalNotes('');
      }
    }
  }, [isOpen, editingRenewal, rooms]);

  if (!isOpen) return null;

  const selectedRoom = rooms.find(r => r.id === roomId);
  const selectedProperty = properties.find(p => p.id === (selectedRoom?.propertyId || editingRenewal?.propertyId));

  // When room changes, auto populate current rent and tenant
  const handleRoomChange = (newRoomId: string) => {
    setRoomId(newRoomId);
    const r = rooms.find(room => room.id === newRoomId);
    if (r) {
      if (!editingRenewal || !tenantName) {
        setTenantName(r.currentTenantName || '');
        setTenantEmail(r.currentTenantEmail || 'resident@moyercoliving.com');
        setTenantPhone(r.currentTenantPhone || '(303) 555-0100');
      }
      setCurrentMonthlyRent(r.monthlyRent);
      setProposedMonthlyRent(Math.round(r.monthlyRent * 1.04));
      if (r.leaseStartDate) {
        setLeaseStartDate(r.leaseStartDate);
      }
    }
  };

  const handleApplyPercent = (pct: number) => {
    setProposedMonthlyRent(Math.round(currentMonthlyRent * (1 + pct / 100)));
  };

  const handleDeleteCurrentRenewal = () => {
    if (!editingRenewal || !onDelete) return;
    onDelete(editingRenewal.id);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!roomId || !selectedRoom || !selectedProperty) {
      setErrorMessage('Please select a room associated with a valid property.');
      return;
    }

    if (!tenantName.trim()) {
      setErrorMessage('Please provide a tenant name.');
      return;
    }

    // Days until anniversary
    const end = new Date(milestones.anniversaryDate).getTime();
    const today = new Date().getTime();
    const daysUntil = Math.max(0, Math.ceil((end - today) / (1000 * 60 * 60 * 24)));

    const newRenewal: LeaseRenewal = {
      id: editingRenewal?.id || `ren-${Date.now()}`,
      tenantId: editingRenewal?.tenantId || selectedRoom.currentTenantId || `tenant-${Date.now()}`,
      tenantName: tenantName.trim(),
      tenantEmail: tenantEmail.trim() || 'resident@moyercoliving.com',
      tenantPhone: tenantPhone.trim() || '(303) 555-0100',
      propertyId: selectedProperty.id,
      propertyName: selectedProperty.name,
      roomId: selectedRoom.id,
      roomName: selectedRoom.name,
      leaseStartDate: leaseStartDate,
      currentLeaseEndDate: editingRenewal?.currentLeaseEndDate || milestones.anniversaryDate,
      anniversaryDate: milestones.anniversaryDate,
      negotiationStartDate: milestones.negotiationsStartDate,
      decisionDeadline: milestones.decisionDeadline,
      daysUntilExpiration: daysUntil,
      currentMonthlyRent: Number(currentMonthlyRent) || 850,
      proposedMonthlyRent: Number(proposedMonthlyRent) || 895,
      renewalStatus,
      renewalTermMonths: 12,
      proposedTermMonths: 12,
      leaseType: 'Month-to-Month',
      tenantResponseNotes: tenantResponseNotes.trim(),
      internalNotes: internalNotes.trim() || (editingRenewal?.internalNotes || 'Generated via 1-Year Anniversary Rate Review engine'),
      noticeToVacate: editingRenewal?.noticeToVacate
    };

    onSave(newRenewal);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-lg w-full shadow-2xl border border-zinc-200 overflow-hidden my-8">
        <div className="bg-zinc-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-indigo-600 flex items-center justify-center font-bold text-white shadow-xs">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">
                {editingRenewal ? `Edit Lease Renewal Card: ${editingRenewal.tenantName}` : 'Record 1-Year Rate Increase Review'}
              </h2>
              <p className="text-[11px] text-zinc-400">Month-to-Month Tenancy • 1-Year Anniversary Rate Adjustment</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs max-h-[720px] overflow-y-auto">
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-md flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Room & Property Selection */}
          <div>
            <label className="block font-bold text-zinc-700 mb-1">Select Bedroom / Property *</label>
            <select
              value={roomId}
              onChange={(e) => handleRoomChange(e.target.value)}
              className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
            >
              {occupiedRooms.map(r => (
                <option key={r.id} value={r.id}>
                  {r.propertyName} - {r.name} (Tenant: {r.currentTenantName || 'Occupied'})
                </option>
              ))}
            </select>
          </div>

          {/* Tenant Contact Details */}
          <div className="bg-zinc-50 p-3.5 rounded-md border border-zinc-200 space-y-3">
            <div className="flex items-center gap-1.5 font-bold text-zinc-800 text-xs">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              <span>Tenant Information</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] text-zinc-600 mb-1">Resident Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Miller"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  className="w-full p-2 bg-white border border-zinc-300 rounded-md font-semibold text-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-600 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="resident@email.com"
                  value={tenantEmail}
                  onChange={(e) => setTenantEmail(e.target.value)}
                  className="w-full p-2 bg-white border border-zinc-300 rounded-md text-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-600 mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="(303) 555-0100"
                  value={tenantPhone}
                  onChange={(e) => setTenantPhone(e.target.value)}
                  className="w-full p-2 bg-white border border-zinc-300 rounded-md text-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-zinc-700 mb-1">Original Lease Start Date *</label>
            <input
              type="date"
              required
              value={leaseStartDate}
              onChange={(e) => setLeaseStartDate(e.target.value)}
              className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Engine Milestones Card */}
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-md p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-indigo-900 text-xs uppercase tracking-tight">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>1-Year Anniversary Milestones (Auto-Calculated)</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
              <div className="bg-white p-2 rounded border border-indigo-100">
                <span className="text-zinc-500 block text-[10px] uppercase font-bold">2-Mo Negotiation:</span>
                <strong className="font-mono text-zinc-900">{milestones.negotiationsStartDate}</strong>
              </div>
              <div className="bg-white p-2 rounded border border-indigo-100">
                <span className="text-rose-600 block text-[10px] uppercase font-bold">Mo 12 Deadline:</span>
                <strong className="font-mono text-rose-700">{milestones.decisionDeadline}</strong>
              </div>
              <div className="bg-white p-2 rounded border border-indigo-100">
                <span className="text-emerald-700 block text-[10px] uppercase font-bold">1-Yr Rate Effective:</span>
                <strong className="font-mono text-emerald-800">{milestones.anniversaryDate}</strong>
              </div>
            </div>
          </div>

          {/* Rent Adjuster Box */}
          <div className="bg-zinc-50 p-3.5 rounded-md border border-zinc-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-800 text-xs">Anniversary Rate Calculator</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleApplyPercent(3.0)}
                  className="px-2 py-0.5 rounded bg-white border border-zinc-300 text-[11px] font-bold text-indigo-700 hover:bg-indigo-50"
                >
                  +3%
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPercent(4.5)}
                  className="px-2 py-0.5 rounded bg-white border border-zinc-300 text-[11px] font-bold text-indigo-700 hover:bg-indigo-50"
                >
                  +4.5%
                </button>
                <button
                  type="button"
                  onClick={() => setProposedMonthlyRent(currentMonthlyRent + 50)}
                  className="px-2 py-0.5 rounded bg-white border border-zinc-300 text-[11px] font-bold text-indigo-700 hover:bg-indigo-50"
                >
                  +$50
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-zinc-500 mb-1">Current Rent ($/mo)</label>
                <input
                  type="number"
                  value={currentMonthlyRent}
                  onChange={(e) => setCurrentMonthlyRent(Number(e.target.value))}
                  className="w-full p-2 bg-white border border-zinc-300 rounded-md font-mono font-bold text-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-500 mb-1">Proposed Anniversary Rent ($/mo)</label>
                <input
                  type="number"
                  value={proposedMonthlyRent}
                  onChange={(e) => setProposedMonthlyRent(Number(e.target.value))}
                  className="w-full p-2 bg-white border border-emerald-400 text-emerald-800 rounded-md font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-zinc-700 mb-1">Annual Review Status</label>
            <select
              value={renewalStatus}
              onChange={(e) => setRenewalStatus(e.target.value as any)}
              className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="Auto-Renewing Month-to-Month">Auto-Renewing Month-to-Month</option>
              <option value="Review Pending">Review Pending (In 2-Month Window)</option>
              <option value="Notice Sent">Notice Sent (Rate Increase Proposed)</option>
              <option value="Negotiating Terms">Negotiating Terms</option>
              <option value="Tenant Accepted">Tenant Accepted (Rate Scheduled)</option>
              <option value="Notice to Vacate Given">Notice to Vacate Given (21-Day Rule)</option>
              <option value="Tenant Declined (Vacating)">Tenant Declined (Vacating)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-zinc-700 mb-1">Tenant Feedback / Communication Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Discussed annual rate adjustment on call, resident requested new mattress and accepted +$35/mo."
              value={tenantResponseNotes}
              onChange={(e) => setTenantResponseNotes(e.target.value)}
              className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-zinc-700 mb-1">Internal Management Notes</label>
            <textarea
              rows={2}
              placeholder="Internal tracking notes, payment history, lease modifications..."
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-[11px]"
            />
          </div>

          <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-zinc-200">
            {editingRenewal && onDelete ? (
              showDeleteConfirm ? (
                <div className="flex items-center gap-1.5 bg-rose-50 p-1.5 rounded border border-rose-200">
                  <span className="text-[11px] font-bold text-rose-800">Confirm deletion?</span>
                  <button
                    type="button"
                    onClick={handleDeleteCurrentRenewal}
                    className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold"
                  >
                    Yes, Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-2 py-1 border border-zinc-300 text-zinc-700 bg-white rounded text-[10px]"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3.5 py-2 rounded-md border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold flex items-center gap-1.5 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Card</span>
                </button>
              )
            ) : (
              <div></div>
            )}

            <div className="flex items-center gap-2">
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
                {editingRenewal ? 'Save Changes' : 'Record Review'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
