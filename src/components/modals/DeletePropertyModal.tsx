import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Trash2, 
  AlertTriangle, 
  Home, 
  Users, 
  DollarSign, 
  CheckCircle2, 
  X,
  Layers
} from 'lucide-react';
import { Property, Room } from '../../types';

interface DeletePropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
  rooms: Room[];
  selectedPropertyId?: string;
  onDeleteProperty: (propertyId: string) => void;
}

export const DeletePropertyModal: React.FC<DeletePropertyModalProps> = ({
  isOpen,
  onClose,
  properties,
  rooms,
  selectedPropertyId: initialSelectedPropertyId,
  onDeleteProperty
}) => {
  const [chosenPropertyId, setChosenPropertyId] = useState<string>('');
  const [confirmText, setConfirmText] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (initialSelectedPropertyId && initialSelectedPropertyId !== 'all') {
        setChosenPropertyId(initialSelectedPropertyId);
      } else if (properties.length > 0) {
        setChosenPropertyId(properties[0].id);
      }
      setConfirmText('');
    }
  }, [isOpen, initialSelectedPropertyId, properties]);

  if (!isOpen) return null;

  const currentProp = properties.find(p => p.id === chosenPropertyId);
  const propRooms = currentProp ? rooms.filter(r => r.propertyId === currentProp.id) : [];
  const occupiedRooms = propRooms.filter(r => r.status === 'Occupied');
  const totalRent = propRooms.reduce((sum, r) => sum + r.monthlyRent, 0);

  const handleDelete = () => {
    if (!currentProp) return;
    onDeleteProperty(currentProp.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-rose-200 overflow-hidden my-8 animate-in fade-in zoom-in duration-150">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-rose-900 to-slate-900 text-white p-5 flex items-center justify-between border-b border-rose-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600/30 border border-rose-500/50 flex items-center justify-center text-rose-300 font-bold">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white flex items-center gap-2">
                <span>Remove / Delete Property</span>
                <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Cascade Deletion
                </span>
              </h2>
              <p className="text-xs text-rose-200/80">
                Choose a property to remove. All associated rooms will be permanently deleted.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Step 1: Choose Property */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              1. Choose Property to Delete:
            </label>
            {properties.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-50 border rounded-lg">No properties available to delete.</p>
            ) : (
              <select
                value={chosenPropertyId}
                onChange={(e) => {
                  setChosenPropertyId(e.target.value);
                  setConfirmText('');
                }}
                className="w-full p-2.5 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:border-rose-500 focus:ring-0 focus:outline-none"
              >
                {properties.map(p => {
                  const pRoomCount = rooms.filter(r => r.propertyId === p.id).length;
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.address}, {p.city}) — {pRoomCount} room(s)
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          {currentProp && (
            <>
              {/* Cascade Warning Banner */}
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 text-rose-900">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-rose-950">
                    Important: All {propRooms.length} room(s) in this property will be deleted!
                  </p>
                  <p className="text-rose-800 leading-relaxed">
                    Deleting <strong>{currentProp.name}</strong> will also permanently delete all individual room records, keycodes, turnover checklists, and associated lease assignments.
                  </p>
                </div>
              </div>

              {/* Property Summary Cards */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Rooms</span>
                  <span className="text-lg font-bold text-slate-900 font-mono flex items-center justify-center gap-1 mt-0.5">
                    <Layers className="w-4 h-4 text-slate-600" />
                    {propRooms.length}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Active Tenants</span>
                  <span className={`text-lg font-bold font-mono flex items-center justify-center gap-1 mt-0.5 ${occupiedRooms.length > 0 ? 'text-amber-700' : 'text-slate-700'}`}>
                    <Users className="w-4 h-4" />
                    {occupiedRooms.length}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Monthly Revenue</span>
                  <span className="text-lg font-bold text-slate-900 font-mono flex items-center justify-center gap-0.5 mt-0.5">
                    ${totalRent.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* List of rooms to be deleted */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Rooms that will be deleted ({propRooms.length}):
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Owner: {currentProp.ownerName}
                  </span>
                </div>
                
                {propRooms.length === 0 ? (
                  <p className="text-xs text-slate-500 p-3 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-center">
                    This property has 0 rooms configured.
                  </p>
                ) : (
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/50">
                    {propRooms.map(room => (
                      <div key={room.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-white transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-rose-100 text-rose-700 font-bold text-[10px] flex items-center justify-center font-mono">
                            {room.roomNumber}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800">{room.name}</span>
                            <span className="text-slate-500 text-[11px] ml-1.5">
                              ({room.bathroomType} • {room.sqft} sqft)
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {room.currentTenantName ? (
                            <span className="text-[11px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md font-semibold">
                              Tenant: {room.currentTenantName}
                            </span>
                          ) : (
                            <span className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium">
                              {room.status}
                            </span>
                          )}
                          <span className="font-bold text-slate-900 font-mono">${room.monthlyRent}/mo</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!currentProp}
              onClick={handleDelete}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-md transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>
                Delete &quot;{currentProp?.name || 'Property'}&quot; &amp; All {propRooms.length} Room(s)
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
