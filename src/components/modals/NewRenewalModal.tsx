import React, { useState, useEffect } from 'react';
import { FileText, Plus, X, Building, DollarSign, Sparkles, AlertCircle } from 'lucide-react';
import { LeaseRenewal, LeaseRenewalStatus, Property, Room } from '../../types';

interface NewRenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
  rooms: Room[];
  onSave: (renewal: LeaseRenewal) => void;
  editingRenewal?: LeaseRenewal | null;
}

export const NewRenewalModal: React.FC<NewRenewalModalProps> = ({
  isOpen,
  onClose,
  properties,
  rooms,
  onSave,
  editingRenewal
}) => {
  const occupiedRooms = rooms.filter(r => r.status === 'Occupied' || r.id === editingRenewal?.roomId);

  const [roomId, setRoomId] = useState<string>('');
  const [renewalStatus, setRenewalStatus] = useState<LeaseRenewalStatus>('Review Pending');
  const [currentLeaseEndDate, setCurrentLeaseEndDate] = useState<string>('2026-09-30');
  const [currentMonthlyRent, setCurrentMonthlyRent] = useState<number>(895);
  const [proposedMonthlyRent, setProposedMonthlyRent] = useState<number>(930);
  const [proposedTermMonths, setProposedTermMonths] = useState<number>(12);
  const [decisionDeadline, setDecisionDeadline] = useState<string>('2026-08-31');
  const [tenantResponseNotes, setTenantResponseNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      const defaultRoomId = editingRenewal?.roomId || occupiedRooms[0]?.id || (rooms.length > 0 ? rooms[0].id : '');
      setRoomId(defaultRoomId);

      if (editingRenewal) {
        setRenewalStatus(editingRenewal.renewalStatus || 'Review Pending');
        setCurrentLeaseEndDate(editingRenewal.currentLeaseEndDate || '2026-09-30');
        setCurrentMonthlyRent(editingRenewal.currentMonthlyRent || 895);
        setProposedMonthlyRent(editingRenewal.proposedMonthlyRent || 930);
        setProposedTermMonths(editingRenewal.proposedTermMonths || 12);
        setDecisionDeadline(editingRenewal.decisionDeadline || '2026-08-31');
        setTenantResponseNotes(editingRenewal.tenantResponseNotes || '');
      } else {
        const r = rooms.find(room => room.id === defaultRoomId);
        const rent = r?.monthlyRent || 895;
        setRenewalStatus('Review Pending');
        setCurrentLeaseEndDate(r?.leaseEndDate || '2026-09-30');
        setCurrentMonthlyRent(rent);
        setProposedMonthlyRent(Math.round(rent * 1.04));
        setProposedTermMonths(12);
        setDecisionDeadline('2026-08-31');
        setTenantResponseNotes('');
      }
    }
  }, [isOpen, editingRenewal, rooms]);

  if (!isOpen) return null;

  const selectedRoom = rooms.find(r => r.id === roomId);
  const selectedProperty = properties.find(p => p.id === selectedRoom?.propertyId);

  // When room changes, auto populate current rent and tenant
  const handleRoomChange = (newRoomId: string) => {
    setRoomId(newRoomId);
    const r = rooms.find(room => room.id === newRoomId);
    if (r) {
      setCurrentMonthlyRent(r.monthlyRent);
      setProposedMonthlyRent(Math.round(r.monthlyRent * 1.04));
      if (r.leaseEndDate) {
        setCurrentLeaseEndDate(r.leaseEndDate);
      }
    }
  };

  const handleApplyPercent = (pct: number) => {
    setProposedMonthlyRent(Math.round(currentMonthlyRent * (1 + pct / 100)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!roomId || !selectedRoom || !selectedProperty) {
      setErrorMessage('Please select a room associated with a valid property.');
      return;
    }

    // Calculate days until expiration
    const end = new Date(currentLeaseEndDate).getTime();
    const today = new Date().getTime();
    const daysUntil = Math.max(0, Math.ceil((end - today) / (1000 * 60 * 60 * 24)));

    const newRenewal: LeaseRenewal = {
      id: editingRenewal?.id || `ren-${Date.now()}`,
      tenantId: selectedRoom.currentTenantId || `tenant-${Date.now()}`,
      tenantName: selectedRoom.currentTenantName || 'Tenant Name',
      tenantEmail: selectedRoom.currentTenantEmail || 'resident@moyercoliving.com',
      tenantPhone: selectedRoom.currentTenantPhone || '(303) 555-0100',
      propertyId: selectedProperty.id,
      propertyName: selectedProperty.name,
      roomId: selectedRoom.id,
      roomName: selectedRoom.name,
      leaseStartDate: selectedRoom.leaseStartDate || new Date().toISOString().split('T')[0],
      currentLeaseEndDate,
      daysUntilExpiration: daysUntil,
      currentMonthlyRent: Number(currentMonthlyRent) || 850,
      proposedMonthlyRent: Number(proposedMonthlyRent) || 895,
      renewalStatus,
      renewalTermMonths: Number(proposedTermMonths) || 12,
      proposedTermMonths: Number(proposedTermMonths) || 12,
      decisionDeadline,
      tenantResponseNotes,
      internalNotes: editingRenewal?.internalNotes || 'Generated via Lease Renewal manager'
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
                {editingRenewal ? `Edit Lease Renewal: ${editingRenewal.tenantName}` : 'Record Lease Renewal Agreement'}
              </h2>
              <p className="text-[11px] text-zinc-400">Track expiration date, rate increase, and tenant decision</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs max-h-[700px] overflow-y-auto">
          <div>
            <label className="block font-bold text-zinc-700 mb-1">Select Occupied Room / Resident *</label>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Current Lease End Date *</label>
              <input
                type="date"
                required
                value={currentLeaseEndDate}
                onChange={(e) => setCurrentLeaseEndDate(e.target.value)}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-zinc-700 mb-1">Decision Deadline</label>
              <input
                type="date"
                value={decisionDeadline}
                onChange={(e) => setDecisionDeadline(e.target.value)}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Rent Adjuster Box */}
          <div className="bg-zinc-50 p-3.5 rounded-md border border-zinc-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-800 text-xs">Rent Adjustment Calculator</span>
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
                <label className="block text-[11px] text-zinc-500 mb-1">Proposed Renewal Rent ($/mo)</label>
                <input
                  type="number"
                  value={proposedMonthlyRent}
                  onChange={(e) => setProposedMonthlyRent(Number(e.target.value))}
                  className="w-full p-2 bg-white border border-emerald-400 text-emerald-800 rounded-md font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Renewal Status</label>
              <select
                value={renewalStatus}
                onChange={(e) => setRenewalStatus(e.target.value as any)}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="Review Pending">Review Pending</option>
                <option value="Notice Sent">Notice Sent</option>
                <option value="Negotiating Terms">Negotiating Terms</option>
                <option value="Tenant Accepted">Tenant Accepted</option>
                <option value="Tenant Declined (Vacating)">Tenant Declined (Vacating)</option>
                <option value="Renewed Signed">Renewed Signed</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-zinc-700 mb-1">Term Length (Months)</label>
              <select
                value={proposedTermMonths}
                onChange={(e) => setProposedTermMonths(Number(e.target.value))}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value={12}>12 Months (Standard)</option>
                <option value={6}>6 Months</option>
                <option value={9}>9 Months (Academic)</option>
                <option value={1}>Month-to-Month</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-zinc-700 mb-1">Tenant Feedback / Communication Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Tenant requested renewed paint touch-up and accepted +$35/mo."
              value={tenantResponseNotes}
              onChange={(e) => setTenantResponseNotes(e.target.value)}
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
              {editingRenewal ? 'Save Changes' : 'Record Renewal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
