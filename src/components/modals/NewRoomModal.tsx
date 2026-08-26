import React, { useState, useEffect } from 'react';
import { Home, Plus, X, Building, DollarSign, Trash2 } from 'lucide-react';
import { Room, RoomStatus, RoomBathroomType, Property } from '../../types';

interface NewRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
  onSave: (room: Room) => void;
  editingRoom?: Room | null;
  defaultPropertyId?: string;
  onDeleteRoom?: (roomId: string) => void;
}

export const NewRoomModal: React.FC<NewRoomModalProps> = ({
  isOpen,
  onClose,
  properties,
  onSave,
  editingRoom,
  defaultPropertyId,
  onDeleteRoom
}) => {
  const [propertyId, setPropertyId] = useState<string>('');
  const [roomNumber, setRoomNumber] = useState<string>('101');
  const [name, setName] = useState<string>('Room 101 - Primary Suite');
  const [floor, setFloor] = useState<number>(1);
  const [sqft, setSqft] = useState<number>(210);
  const [monthlyRent, setMonthlyRent] = useState<number>(895);
  const [securityDeposit, setSecurityDeposit] = useState<number>(895);
  const [bathroomType, setBathroomType] = useState<RoomBathroomType>('Private Ensuite');
  const [isFurnished, setIsFurnished] = useState<boolean>(true);
  const [status, setStatus] = useState<RoomStatus>('Available');
  
  // Tenancy if occupied
  const [currentTenantName, setCurrentTenantName] = useState<string>('');
  const [currentTenantPhone, setCurrentTenantPhone] = useState<string>('');
  const [leaseEndDate, setLeaseEndDate] = useState<string>('');
  const [amenities, setAmenities] = useState<string>(
    'Queen Bed, Desk & Ergonomic Chair, Walk-in Closet, Blackout Blinds'
  );

  useEffect(() => {
    if (isOpen) {
      if (editingRoom) {
        setPropertyId(editingRoom.propertyId);
        setRoomNumber(editingRoom.roomNumber);
        setName(editingRoom.name);
        setFloor(editingRoom.floor);
        setSqft(editingRoom.sqft);
        setMonthlyRent(editingRoom.monthlyRent);
        setSecurityDeposit(editingRoom.securityDeposit);
        setBathroomType(editingRoom.bathroomType);
        setIsFurnished(editingRoom.isFurnished);
        setStatus(editingRoom.status);
        setCurrentTenantName(editingRoom.currentTenantName || '');
        setCurrentTenantPhone(editingRoom.currentTenantPhone || '');
        setLeaseEndDate(editingRoom.leaseEndDate || '');
        setAmenities(
          editingRoom.amenities?.join(', ') ||
          'Queen Bed, Desk & Ergonomic Chair, Walk-in Closet, Blackout Blinds'
        );
      } else {
        const initialPropId = defaultPropertyId || (properties.length > 0 ? properties[0].id : '');
        setPropertyId(initialPropId);
        setRoomNumber('101');
        setName('Room 101 - Primary Suite');
        setFloor(1);
        setSqft(200);
        setMonthlyRent(895);
        setSecurityDeposit(895);
        setBathroomType('Private Ensuite');
        setIsFurnished(true);
        setStatus('Available');
        setCurrentTenantName('');
        setCurrentTenantPhone('');
        setLeaseEndDate('');
        setAmenities('Queen Bed, Desk & Ergonomic Chair, Walk-in Closet, Blackout Blinds');
      }
    }
  }, [isOpen, editingRoom, defaultPropertyId, properties]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !propertyId) return;

    const prop = properties.find(p => p.id === propertyId);

    const newRoom: Room = {
      id: editingRoom?.id || `room-${Date.now()}`,
      propertyId,
      propertyName: prop?.name || 'Property',
      roomNumber,
      name,
      floor: Number(floor) || 1,
      sqft: Number(sqft) || 180,
      monthlyRent: Number(monthlyRent) || 850,
      securityDeposit: Number(securityDeposit) || 850,
      bathroomType,
      isFurnished,
      status,
      utilitiesIncluded: editingRoom?.utilitiesIncluded || ['High-Speed Fiber Wi-Fi', 'Water & Sewer', 'Gas & Electric', 'Trash & Recycling'],
      roomFeatures: editingRoom?.roomFeatures || ['Keyless Entry Door Code', 'Large Window with Mountain Views', 'Hardwood Flooring', 'Walk-in Closet'],
      currentTenantId: status === 'Occupied' ? (editingRoom?.currentTenantId || `tenant-${Date.now()}`) : undefined,
      currentTenantName: status === 'Occupied' ? currentTenantName : undefined,
      currentTenantPhone: status === 'Occupied' ? currentTenantPhone : undefined,
      leaseEndDate: status === 'Occupied' ? leaseEndDate : undefined,
      amenities: amenities.split(',').map(a => a.trim()).filter(Boolean),
      turnoverChecklist: editingRoom?.turnoverChecklist || [
        { id: 't-1', task: 'Digital keycode reset & test door deadbolt', isDone: false },
        { id: 't-2', task: 'Professional room & ensuite deep clean and sanitize', isDone: false },
        { id: 't-3', task: 'Mattress encasement inspection & wash bedding', isDone: false },
        { id: 't-4', task: 'Paint touch-ups & baseboard dusting', isDone: false },
        { id: 't-5', task: 'Welcome move-in coliving house packet placed', isDone: false }
      ]
    };

    onSave(newRoom);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center font-bold text-slate-950">
              <Home className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">
                {editingRoom ? `Edit ${editingRoom.name}` : 'Add Rental Room to Property'}
              </h2>
              <p className="text-[11px] text-slate-400">Configure room rent, bath configuration, and lease details</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs max-h-[700px] overflow-y-auto">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Parent Coliving Property *</label>
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-medium"
            >
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.address})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Room Number *</label>
              <input
                type="text"
                required
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Descriptive Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Monthly Rent ($) *</label>
              <input
                type="number"
                required
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Security Deposit ($)</label>
              <input
                type="number"
                value={securityDeposit}
                onChange={(e) => setSecurityDeposit(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Size (Sq Ft)</label>
              <input
                type="number"
                value={sqft}
                onChange={(e) => setSqft(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Bathroom Configuration</label>
              <select
                value={bathroomType}
                onChange={(e) => setBathroomType(e.target.value as RoomBathroomType)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-blue-500"
              >
                <option value="Private Ensuite">Private Ensuite</option>
                <option value="1 Shared Bathroom">1 Shared Bathroom</option>
                <option value="2 Shared Bathrooms">2 Shared Bathrooms</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Occupancy Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold"
              >
                <option value="Available">Available</option>
                <option value="Occupied">Occupied</option>
                <option value="Under Turnover">Under Turnover</option>
                <option value="Reserved">Reserved</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isFurnished"
              checked={isFurnished}
              onChange={(e) => setIsFurnished(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="isFurnished" className="font-semibold text-slate-800 select-none cursor-pointer">
              Furnished Room (Includes Bed and Dresser)
            </label>
          </div>

          {status === 'Occupied' && (
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
              <span className="font-bold text-slate-800 text-xs block">Active Resident Details</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-500">Tenant Name</label>
                  <input
                    type="text"
                    value={currentTenantName}
                    onChange={(e) => setCurrentTenantName(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500">Tenant Phone</label>
                  <input
                    type="tel"
                    value={currentTenantPhone}
                    onChange={(e) => setCurrentTenantPhone(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-slate-500">Lease Expiration Date</label>
                <input
                  type="date"
                  value={leaseEndDate}
                  onChange={(e) => setLeaseEndDate(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">Room Amenities (comma separated)</label>
            <input
              type="text"
              value={amenities}
              onChange={(e) => setAmenities(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-slate-200">
            {editingRoom && onDeleteRoom ? (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete room "${editingRoom.name}"?`)) {
                    onDeleteRoom(editingRoom.id);
                    onClose();
                  }
                }}
                className="w-full sm:w-auto px-3.5 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Room</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold shadow-md transition-colors"
              >
                {editingRoom ? 'Save Room' : 'Add Room'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
