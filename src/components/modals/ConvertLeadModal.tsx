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
    <div className="fixed inset-0 bg-zinc-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-lg w-full shadow-2xl border border-zinc-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-zinc-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-emerald-600 flex items-center justify-center font-bold text-white shadow-xs">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">
                Convert Prospect to Active Tenant
              </h2>
              <p className="text-[11px] text-zinc-400">Applicant: {lead.name} (Score: ★{lead.score})</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1">✕</button>
        </div>

        <form onSubmit={handleConfirmConvert} className="p-5 space-y-4 text-xs">
          <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3.5 space-y-1">
            <p className="font-bold text-emerald-950 text-xs">✨ Roommate & Applicant Verification Passed</p>
            <p className="text-emerald-800 text-[11px]">
              Converting this lead will automatically update room occupancy, generate a new lease tracking record, and add {lead.name} to the active tenant directory.
            </p>
          </div>

          <div>
            <label className="block font-bold text-zinc-700 mb-1">Assign Rental Room *</label>
            <select
              value={selectedRoomId}
              onChange={(e) => handleRoomSelect(e.target.value)}
              className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md font-semibold text-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
              <label className="block font-bold text-zinc-700 mb-1">Lease Start (Move-in) *</label>
              <input
                type="date"
                required
                value={leaseStartDate}
                onChange={(e) => setLeaseStartDate(e.target.value)}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-zinc-700 mb-1">Lease End Date *</label>
              <input
                type="date"
                required
                value={leaseEndDate}
                onChange={(e) => setLeaseEndDate(e.target.value)}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Agreed Monthly Rent ($)</label>
              <input
                type="number"
                value={agreedRent}
                onChange={(e) => setAgreedRent(Number(e.target.value))}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md font-mono font-bold text-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-zinc-700 mb-1">Security Deposit ($)</label>
              <input
                type="number"
                value={securityDeposit}
                onChange={(e) => setSecurityDeposit(Number(e.target.value))}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md font-mono font-bold text-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
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
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-bold shadow-xs transition flex items-center gap-1.5"
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
