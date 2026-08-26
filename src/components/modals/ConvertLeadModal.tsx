import React, { useState } from 'react';
import { UserCheck, Check, Building, DollarSign, Calendar, X } from 'lucide-react';
import { TenantLead, Room, Property, Contact, LeaseRenewal } from '../../types';

interface ConvertLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: TenantLead | null;
  rooms: Room[];
  properties: Property[];
  onConvert: (
    lead: TenantLead,
    selectedRoom: Room,
    leaseStartDate: string,
    leaseEndDate: string,
    agreedRent: number,
    securityDeposit: number
  ) => void;
}

export const ConvertLeadModal: React.FC<ConvertLeadModalProps> = ({
  isOpen,
  onClose,
  lead,
  rooms,
  properties,
  onConvert
}) => {
  if (!isOpen || !lead) return null;

  // Available or Turnover rooms
  const eligibleRooms = rooms.filter(r => r.status === 'Available' || r.status === 'Under Turnover' || r.status === 'Reserved');

  const [selectedRoomId, setSelectedRoomId] = useState<string>(eligibleRooms[0]?.id || rooms[0]?.id || '');
  const [leaseStartDate, setLeaseStartDate] = useState<string>(
    lead.targetMoveInDate || new Date().toISOString().split('T')[0]
  );
  
  // Default 12 months later
  const nextYear = new Date(leaseStartDate || Date.now());
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  const [leaseEndDate, setLeaseEndDate] = useState<string>(nextYear.toISOString().split('T')[0]);

  const chosenRoom = rooms.find(r => r.id === selectedRoomId);
  const [agreedRent, setAgreedRent] = useState<number>(chosenRoom?.monthlyRent || 895);
  const [securityDeposit, setSecurityDeposit] = useState<number>(chosenRoom?.securityDeposit || 895);

  const handleRoomSelect = (id: string) => {
    setSelectedRoomId(id);
    const r = rooms.find(room => room.id === id);
    if (r) {
      setAgreedRent(r.monthlyRent);
      setSecurityDeposit(r.securityDeposit);
    }
  };

  const handleConfirmConvert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chosenRoom) return;

    onConvert(
      lead,
      chosenRoom,
      leaseStartDate,
      leaseEndDate,
      agreedRent,
      securityDeposit
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-emerald-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold">
              <UserCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">
                Convert Prospect to Active Tenant
              </h2>
              <p className="text-[11px] text-emerald-200">Applicant: {lead.name} (Score: ★{lead.score})</p>
            </div>
          </div>
          <button onClick={onClose} className="text-emerald-300 hover:text-white">✕</button>
        </div>

        <form onSubmit={handleConfirmConvert} className="p-5 space-y-4 text-xs">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-1">
            <p className="font-bold text-emerald-950 text-xs">✨ Roommate & Applicant Verification Passed</p>
            <p className="text-emerald-800 text-[11px]">
              Converting this lead will automatically update room occupancy, generate a new lease tracking record, and add {lead.name} to the active tenant directory.
            </p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Assign Rental Room *</label>
            <select
              value={selectedRoomId}
              onChange={(e) => handleRoomSelect(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-900"
            >
              {eligibleRooms.map(r => (
                <option key={r.id} value={r.id}>
                  {r.propertyName} - {r.name} (${r.monthlyRent}/mo, {r.status}, {r.bathroomType})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Lease Start (Move-in) *</label>
              <input
                type="date"
                required
                value={leaseStartDate}
                onChange={(e) => setLeaseStartDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Lease End Date *</label>
              <input
                type="date"
                required
                value={leaseEndDate}
                onChange={(e) => setLeaseEndDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Agreed Monthly Rent ($)</label>
              <input
                type="number"
                value={agreedRent}
                onChange={(e) => setAgreedRent(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Security Deposit ($)</label>
              <input
                type="number"
                value={securityDeposit}
                onChange={(e) => setSecurityDeposit(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>
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
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow-md transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Finalize & Assign Room</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
