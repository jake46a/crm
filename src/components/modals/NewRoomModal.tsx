import React, { useState, useEffect } from 'react';
import { Home, Plus, X, Building, DollarSign, Trash2, AlertCircle, PlusCircle } from 'lucide-react';
import { Room, RoomStatus, RoomBathroomType, Property } from '../../types';

interface NewRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
  onSave: (room: Room) => void;
  editingRoom?: Room | null;
  defaultPropertyId?: string;
  onDeleteRoom?: (roomId: string) => void;
  onOpenNewPropertyModal?: () => void;
}

export const NewRoomModal: React.FC<NewRoomModalProps> = ({
  isOpen,
  onClose,
  properties,
  onSave,
  editingRoom,
  defaultPropertyId,
  onDeleteRoom,
  onOpenNewPropertyModal
}) => {
  const [propertyId, setPropertyId] = useState<string>('');
  const [roomNumber, setRoomNumber] = useState<string>('101');
  const [name, setName] = useState<string>('Room 101 - Primary Suite');
  const [floor, setFloor] = useState<number>(1);
  const [sqft, setSqft] = useState<number>(200);
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

  // Form error state
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setIsSubmitting(false);

      if (editingRoom) {
        setPropertyId(editingRoom.propertyId);
        setRoomNumber(editingRoom.roomNumber || '101');
        setName(editingRoom.name || 'Room 101');
        setFloor(editingRoom.floor ?? 1);
        setSqft(editingRoom.sqft ?? 200);
        setMonthlyRent(editingRoom.monthlyRent ?? 895);
        setSecurityDeposit(editingRoom.securityDeposit ?? 895);
        setBathroomType(editingRoom.bathroomType || 'Private Ensuite');
        setIsFurnished(editingRoom.isFurnished ?? true);
        setStatus(editingRoom.status || 'Available');
        setCurrentTenantName(editingRoom.currentTenantName || '');
        setCurrentTenantPhone(editingRoom.currentTenantPhone || '');
        setLeaseEndDate(editingRoom.leaseEndDate || '');
        setAmenities(
          editingRoom.amenities?.join(', ') ||
          'Queen Bed, Desk & Ergonomic Chair, Walk-in Closet, Blackout Blinds'
        );
      } else {
        const initialPropId = defaultPropertyId && properties.some(p => p.id === defaultPropertyId)
          ? defaultPropertyId 
          : (properties.length > 0 ? properties[0].id : '');
        
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
    setErrorMessage('');

    if (properties.length === 0) {
      setErrorMessage('Please create a property first before adding room rentals.');
      return;
    }

    const selectedProp = properties.find(p => p.id === propertyId) || properties[0];
    if (!selectedProp) {
      setErrorMessage('Please select a valid parent property.');
      return;
    }

    if (!name.trim()) {
      setErrorMessage('Please enter a room name or title.');
      return;
    }

    if (!roomNumber.trim()) {
      setErrorMessage('Please enter a room number.');
      return;
    }

    setIsSubmitting(true);

    try {
      const sanitizedMonthlyRent = Math.max(0, Number(monthlyRent) || 0);
      const sanitizedDeposit = Math.max(0, Number(securityDeposit) || 0);
      const sanitizedSqft = Math.max(1, Number(sqft) || 180);
      const sanitizedFloor = Math.max(0, Number(floor) || 1);

      const parsedAmenities = amenities
        ? amenities.split(',').map(a => a.trim()).filter(Boolean)
        : ['High-Speed Fiber Wi-Fi', 'Keyless Entry'];

      const newRoom: Room = {
        id: editingRoom?.id || `room-${Date.now()}`,
        propertyId: selectedProp.id,
        propertyName: selectedProp.name,
        roomNumber: roomNumber.trim(),
        name: name.trim(),
        floor: sanitizedFloor,
        sqft: sanitizedSqft,
        monthlyRent: sanitizedMonthlyRent,
        securityDeposit: sanitizedDeposit,
        bathroomType,
        isFurnished,
        status,
        utilitiesIncluded: editingRoom?.utilitiesIncluded || [
          'High-Speed Fiber Wi-Fi',
          'Water & Sewer',
          'Gas & Electric',
          'Trash & Recycling'
        ],
        roomFeatures: editingRoom?.roomFeatures || [
          'Keyless Entry Door Code',
          'Large Window with Natural Light',
          'Hardwood Flooring',
          'Walk-in Closet'
        ],
        amenities: parsedAmenities,
        turnoverChecklist: editingRoom?.turnoverChecklist || [
          { id: 't-1', task: 'Digital keycode reset & test door deadbolt', isDone: false },
          { id: 't-2', task: 'Professional room & ensuite deep clean and sanitize', isDone: false },
          { id: 't-3', task: 'Mattress encasement inspection & wash bedding', isDone: false },
          { id: 't-4', task: 'Paint touch-ups & baseboard dusting', isDone: false },
          { id: 't-5', task: 'Welcome move-in coliving house packet placed', isDone: false }
        ]
      };

      // Only assign tenancy info if status is Occupied
      if (status === 'Occupied') {
        newRoom.currentTenantId = editingRoom?.currentTenantId || `tenant-${Date.now()}`;
        if (currentTenantName.trim()) newRoom.currentTenantName = currentTenantName.trim();
        if (currentTenantPhone.trim()) newRoom.currentTenantPhone = currentTenantPhone.trim();
        if (leaseEndDate.trim()) newRoom.leaseEndDate = leaseEndDate.trim();
      }

      onSave(newRoom);
      onClose();
    } catch (err: any) {
      console.error('Error in room save:', err);
      setErrorMessage(err?.message || 'Failed to save room. Please check values and try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center font-bold text-slate-950">
              <Home className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">
                {editingRoom ? `Edit ${editingRoom.name}` : 'Add Rental Room to Property'}
              </h2>
              <p className="text-[11px] text-slate-400">Configure room rent, bathroom configuration, and tenancy</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1 rounded-sm transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs max-h-[750px] overflow-y-auto">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-start gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* No Properties Warning / Creator */}
          {properties.length === 0 ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
              <div className="flex items-start gap-2.5">
                <Building className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-amber-900 text-xs">No Properties Found</h3>
                  <p className="text-amber-800 text-[11px] mt-0.5">
                    Room rentals must belong to a property. Please create your first coliving property before adding individual rooms.
                  </p>
                </div>
              </div>
              {onOpenNewPropertyModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenNewPropertyModal();
                  }}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Create Property First</span>
                </button>
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-slate-700">Parent Coliving Property *</label>
                {onOpenNewPropertyModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenNewPropertyModal();
                    }}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                  >
                    <PlusCircle className="w-3 h-3" />
                    + New Property
                  </button>
                )}
              </div>
              <select
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                required
              >
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.address}, {p.city})</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Room Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. 101 or Unit B"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none font-medium"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Descriptive Room Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Room 101 - Primary Suite"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Monthly Rent ($) *</label>
              <input
                type="number"
                required
                min="0"
                step="5"
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Security Deposit ($)</label>
              <input
                type="number"
                min="0"
                step="5"
                value={securityDeposit}
                onChange={(e) => setSecurityDeposit(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Size (Sq Ft)</label>
              <input
                type="number"
                min="1"
                value={sqft}
                onChange={(e) => setSqft(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Floor Level</label>
              <input
                type="number"
                min="0"
                value={floor}
                onChange={(e) => setFloor(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Bathroom Setup</label>
              <select
                value={bathroomType}
                onChange={(e) => setBathroomType(e.target.value as RoomBathroomType)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
              >
                <option value="Private Ensuite">Private Ensuite</option>
                <option value="1 Shared Bathroom">1 Shared Bathroom</option>
                <option value="2 Shared Bathrooms">2 Shared Bathrooms</option>
                <option value="Jack & Jill Shared">Jack & Jill Shared</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as RoomStatus)}
                className={`w-full p-2.5 border rounded-lg font-bold outline-none focus:ring-2 focus:ring-blue-500 ${
                  status === 'Occupied' 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                    : status === 'Available'
                    ? 'bg-blue-50 border-blue-300 text-blue-800'
                    : 'bg-amber-50 border-amber-300 text-amber-800'
                }`}
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
              Furnished Room (Includes Bed Frame, Mattress & Desk)
            </label>
          </div>

          {status === 'Occupied' && (
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5 animate-in fade-in duration-150">
              <span className="font-bold text-slate-800 text-xs block">Active Resident Details</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-500">Tenant Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Alex Morgan"
                    value={currentTenantName}
                    onChange={(e) => setCurrentTenantName(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500">Tenant Phone</label>
                  <input
                    type="tel"
                    placeholder="e.g. (303) 555-0145"
                    value={currentTenantPhone}
                    onChange={(e) => setCurrentTenantPhone(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
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
              placeholder="Queen Bed, Walk-in Closet, Blackout Curtains, Smart TV"
              value={amenities}
              onChange={(e) => setAmenities(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
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
                disabled={isSubmitting || properties.length === 0}
                className={`w-full sm:w-auto px-5 py-2 rounded-lg font-bold text-white shadow-md transition-colors ${
                  properties.length === 0
                    ? 'bg-slate-400 cursor-not-allowed'
                    : 'bg-slate-900 hover:bg-slate-800'
                }`}
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
