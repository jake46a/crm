import React, { useState, useEffect } from 'react';
import { 
  X, 
  DoorClosed, 
  DoorOpen, 
  Building, 
  Check, 
  Calendar, 
  DollarSign, 
  UserMinus, 
  AlertTriangle,
  UserCheck,
  Bed,
  Key
} from 'lucide-react';
import { Contact, Property, Room } from '../../types';
import { formatFullName } from '../../utils/nameUtils';
import { formatPhoneNumber } from '../../utils/phoneUtils';

interface AssignRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact | null;
  properties: Property[];
  rooms: Room[];
  onAssignRoom: (
    contact: Contact,
    selectedProperty: Property | null,
    selectedRoom: Room | null,
    leaseDetails?: {
      startDate?: string;
      endDate?: string;
      rent?: number;
      updateRoomOccupancy?: boolean;
    }
  ) => void;
}

export const AssignRoomModal: React.FC<AssignRoomModalProps> = ({
  isOpen,
  onClose,
  contact,
  properties,
  rooms,
  onAssignRoom
}) => {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [leaseStartDate, setLeaseStartDate] = useState<string>('');
  const [leaseEndDate, setLeaseEndDate] = useState<string>('');
  const [agreedRent, setAgreedRent] = useState<number>(0);
  const [updateRoomOccupancy, setUpdateRoomOccupancy] = useState<boolean>(true);
  const [isConfirmingUnassign, setIsConfirmingUnassign] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && contact) {
      setIsConfirmingUnassign(false);
      
      // Default to current property if assigned, or first property
      const currentPropId = contact.propertyId || (properties.length > 0 ? properties[0].id : '');
      setSelectedPropertyId(currentPropId);

      // Default to currently assigned room if exists
      const currentRoomId = contact.roomId || '';
      setSelectedRoomId(currentRoomId);

      // Find current room or default
      const assignedRoom = rooms.find(r => r.id === currentRoomId);
      
      const todayStr = new Date().toISOString().split('T')[0];
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      const nextYearStr = nextYear.toISOString().split('T')[0];

      setLeaseStartDate(assignedRoom?.leaseStartDate || todayStr);
      setLeaseEndDate(assignedRoom?.leaseEndDate || nextYearStr);
      setAgreedRent(assignedRoom?.monthlyRent || 0);
      setUpdateRoomOccupancy(true);
    }
  }, [isOpen, contact, properties, rooms]);

  if (!isOpen || !contact) return null;

  const currentAssignedRoom = rooms.find(r => r.id === contact.roomId);
  const currentAssignedProperty = properties.find(p => p.id === contact.propertyId);

  // Filter rooms by selected property
  const propertyRooms = rooms.filter(r => r.propertyId === selectedPropertyId);
  const targetRoom = propertyRooms.find(r => r.id === selectedRoomId);

  const handlePropertyChange = (newPropId: string) => {
    setSelectedPropertyId(newPropId);
    // Auto-select first available room or reset
    const roomsInNewProp = rooms.filter(r => r.propertyId === newPropId);
    const firstAvailable = roomsInNewProp.find(r => r.status === 'Available');
    if (firstAvailable) {
      setSelectedRoomId(firstAvailable.id);
      setAgreedRent(firstAvailable.monthlyRent);
    } else if (roomsInNewProp.length > 0) {
      setSelectedRoomId(roomsInNewProp[0].id);
      setAgreedRent(roomsInNewProp[0].monthlyRent);
    } else {
      setSelectedRoomId('');
      setAgreedRent(0);
    }
  };

  const handleRoomSelect = (room: Room) => {
    setSelectedRoomId(room.id);
    setAgreedRent(room.monthlyRent);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId) return;

    const prop = properties.find(p => p.id === selectedPropertyId) || null;
    const room = rooms.find(r => r.id === selectedRoomId) || null;

    if (!room) return;

    onAssignRoom(contact, prop, room, {
      startDate: leaseStartDate,
      endDate: leaseEndDate,
      rent: agreedRent > 0 ? agreedRent : room.monthlyRent,
      updateRoomOccupancy
    });

    onClose();
  };

  const handleUnassignRoom = () => {
    onAssignRoom(contact, null, null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-md max-w-xl w-full shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-zinc-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-indigo-600 flex items-center justify-center">
              <DoorClosed className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-sm leading-snug">
                {contact.roomId ? 'Change Room Assignment' : 'Assign Room to Contact'}
              </h2>
              <p className="text-xs text-zinc-400">
                Coliving residence and occupancy management
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Contact Identity Summary */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-sm p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-sm flex items-center justify-center text-white font-bold text-xs shadow-xs ${contact.avatarBg}`}>
                {(() => {
                  const f = contact.firstName || contact.name.split(' ')[0] || '';
                  const l = contact.lastName || (contact.name.split(' ').length > 1 ? contact.name.split(' ')[contact.name.split(' ').length - 1] : '');
                  return `${f ? f[0] : ''}${l ? l[0] : ''}`.toUpperCase() || 'C';
                })()}
              </div>
              <div>
                <div className="font-bold text-zinc-900 text-sm">
                  {formatFullName(contact.firstName, contact.lastName, contact.name)}
                </div>
                <div className="text-zinc-500 flex items-center gap-2 flex-wrap">
                  <span className="font-mono">{formatPhoneNumber(contact.phone)}</span>
                  {contact.email && <span>• {contact.email}</span>}
                  <span className="bg-zinc-200 text-zinc-700 px-1.5 py-0.2 rounded text-[10px] font-semibold">
                    {contact.type}
                  </span>
                </div>
              </div>
            </div>

            {/* Current status pill */}
            <div className="text-right shrink-0">
              <div className="text-[10px] uppercase font-bold text-zinc-400">Current Room</div>
              {contact.roomName ? (
                <div className="font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded text-[11px] mt-0.5">
                  {contact.propertyName ? `${contact.propertyName} • ` : ''}{contact.roomName}
                </div>
              ) : (
                <span className="text-zinc-400 italic text-[11px]">Unassigned</span>
              )}
            </div>
          </div>

          {/* Form */}
          <form id="assign-room-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Step 1: Select Property */}
            <div>
              <label className="block font-bold text-zinc-800 text-xs mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-zinc-600" />
                  <span>1. Select Property</span>
                </span>
                <span className="text-zinc-400 font-normal text-[11px]">
                  {properties.length} properties in portfolio
                </span>
              </label>
              <select
                value={selectedPropertyId}
                onChange={(e) => handlePropertyChange(e.target.value)}
                required
                className="w-full p-2 bg-zinc-50 border border-zinc-300 rounded-sm text-xs font-semibold text-zinc-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {properties.map(p => {
                  const propRooms = rooms.filter(r => r.propertyId === p.id);
                  const availCount = propRooms.filter(r => r.status === 'Available').length;
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name} ({availCount} available / {propRooms.length} rooms)
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Step 2: Select Room */}
            <div>
              <label className="block font-bold text-zinc-800 text-xs mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <DoorOpen className="w-3.5 h-3.5 text-zinc-600" />
                  <span>2. Select Room</span>
                </span>
                <span className="text-zinc-400 font-normal text-[11px]">
                  {propertyRooms.length} rooms in selected property
                </span>
              </label>

              {propertyRooms.length === 0 ? (
                <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-sm text-center text-zinc-500">
                  No rooms found for this property.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                  {propertyRooms.map(room => {
                    const isSelected = room.id === selectedRoomId;
                    const isCurrent = room.id === contact.roomId;
                    const isAvailable = room.status === 'Available';
                    const isTurnover = room.status === 'Under Turnover';
                    const isOccupied = room.status === 'Occupied' && !isCurrent;

                    return (
                      <button
                        type="button"
                        key={room.id}
                        onClick={() => handleRoomSelect(room)}
                        className={`p-2.5 rounded-sm border text-left transition relative flex flex-col justify-between ${
                          isSelected 
                            ? 'border-indigo-600 bg-indigo-50/80 ring-1 ring-indigo-600' 
                            : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <span className="font-bold text-zinc-900 truncate">
                            {room.name}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-tight ${
                            isCurrent
                              ? 'bg-indigo-100 text-indigo-800'
                              : isAvailable 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : isTurnover 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-zinc-100 text-zinc-700'
                          }`}>
                            {isCurrent ? 'Current' : room.status}
                          </span>
                        </div>

                        <div className="text-[11px] text-zinc-500 space-y-0.5">
                          <div>{room.floor} • {room.bathroomType}</div>
                          <div className="flex items-center justify-between font-mono pt-1 text-zinc-700 font-semibold">
                            <span>${room.monthlyRent}/mo</span>
                            {room.currentTenantName && !isCurrent && (
                              <span className="text-[10px] text-zinc-400 truncate max-w-[90px]" title={room.currentTenantName}>
                                Occ: {room.currentTenantName}
                              </span>
                            )}
                          </div>
                        </div>

                        {isSelected && (
                          <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-600" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 3: Lease & Occupancy Details */}
            {targetRoom && (
              <div className="bg-zinc-50 border border-zinc-200 rounded-sm p-3.5 space-y-3">
                <div className="font-bold text-zinc-800 text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-600" />
                    <span>3. Lease & Rental Terms</span>
                  </span>
                  <span className="text-zinc-500 font-mono text-[11px]">
                    Room standard: ${targetRoom.monthlyRent}/mo
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-zinc-600 font-medium mb-1">
                      Monthly Rent ($)
                    </label>
                    <div className="relative">
                      <DollarSign className="w-3 h-3 text-zinc-400 absolute left-2 top-2.5" />
                      <input
                        type="number"
                        min="0"
                        value={agreedRent || ''}
                        onChange={(e) => setAgreedRent(Number(e.target.value))}
                        className="w-full pl-6 pr-2 py-1.5 bg-white border border-zinc-300 rounded-sm text-xs font-mono font-semibold text-zinc-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-600 font-medium mb-1">
                      Lease Start Date
                    </label>
                    <input
                      type="date"
                      value={leaseStartDate}
                      onChange={(e) => setLeaseStartDate(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-zinc-300 rounded-sm text-xs font-mono text-zinc-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-600 font-medium mb-1">
                      Lease End Date
                    </label>
                    <input
                      type="date"
                      value={leaseEndDate}
                      onChange={(e) => setLeaseEndDate(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-zinc-300 rounded-sm text-xs font-mono text-zinc-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-200/80 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="update-occupancy-check"
                    checked={updateRoomOccupancy}
                    onChange={(e) => setUpdateRoomOccupancy(e.target.checked)}
                    className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="update-occupancy-check" className="text-zinc-700 text-[11px] cursor-pointer">
                    Update room status to <strong className="text-zinc-900">Occupied</strong> and link contact as active resident
                  </label>
                </div>
              </div>
            )}
          </form>

          {/* Unassign Confirmation Box */}
          {isConfirmingUnassign && (
            <div className="bg-rose-50 border border-rose-200 rounded-sm p-3 space-y-2 animate-in fade-in duration-150">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-rose-900 text-xs">Unassign Room from Contact?</div>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    This will disconnect {formatFullName(contact.firstName, contact.lastName, contact.name)} from {contact.roomName || 'their assigned room'}. The room status will be reset to Available.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsConfirmingUnassign(false)}
                  className="px-2.5 py-1 text-zinc-600 hover:text-zinc-800 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUnassignRoom}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-sm text-xs font-bold transition shadow-xs flex items-center gap-1"
                >
                  <UserMinus className="w-3.5 h-3.5" />
                  <span>Confirm Unassign</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-zinc-50 border-t border-zinc-200 p-3.5 px-5 flex items-center justify-between gap-3">
          <div>
            {contact.roomId && !isConfirmingUnassign && (
              <button
                type="button"
                onClick={() => setIsConfirmingUnassign(true)}
                className="text-rose-600 hover:text-rose-800 text-xs font-semibold flex items-center gap-1 transition"
              >
                <UserMinus className="w-3.5 h-3.5" />
                <span>Unassign Room</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-100 rounded-sm text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="assign-room-form"
              disabled={!selectedRoomId}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-sm text-xs font-bold transition shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{contact.roomId ? 'Update Assignment' : 'Assign Room'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
