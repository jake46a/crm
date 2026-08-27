import React, { useState } from 'react';
import { 
  Building2, 
  Home, 
  Wifi, 
  Key, 
  Sparkles, 
  CheckSquare, 
  Square, 
  Plus, 
  Wrench, 
  UserCheck, 
  ShieldAlert, 
  DollarSign, 
  Filter, 
  CheckCircle2, 
  ExternalLink,
  Edit2,
  Trash2
} from 'lucide-react';
import { Property, Room, RoomStatus, RoomBathroomType, TenantLead } from '../types';
import { RoomStatusBadge, BathroomTypeBadge } from './common/Badges';

interface PropertiesRoomsViewProps {
  properties: Property[];
  rooms: Room[];
  leads: TenantLead[];
  onUpdateRoom: (room: Room) => void;
  onOpenNewRoomModal: (defaultPropertyId?: string) => void;
  onOpenNewPropertyModal: () => void;
  onOpenDeletePropertyModal: (property?: Property) => void;
  onOpenWorkOrderForRoom: (room: Room) => void;
  onOpenAssignLeadModal: (room: Room) => void;
  onOpenEditRoomModal: (room: Room) => void;
  onOpenEditPropertyModal: (property: Property) => void;
  onDeleteRoom?: (roomId: string) => void;
}

export const PropertiesRoomsView: React.FC<PropertiesRoomsViewProps> = ({
  properties,
  rooms,
  leads,
  onUpdateRoom,
  onOpenNewRoomModal,
  onOpenNewPropertyModal,
  onOpenDeletePropertyModal,
  onOpenWorkOrderForRoom,
  onOpenAssignLeadModal,
  onOpenEditRoomModal,
  onOpenEditPropertyModal,
  onDeleteRoom
}) => {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [bathFilter, setBathFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // If the selected property was deleted, reset to 'all'
  const selectedProperty = selectedPropertyId !== 'all' 
    ? properties.find(p => p.id === selectedPropertyId) || null
    : null;

  // Filtered rooms
  const filteredRooms = rooms.filter(room => {
    if (selectedPropertyId !== 'all' && room.propertyId !== selectedPropertyId) return false;
    if (statusFilter !== 'all' && room.status !== statusFilter) return false;
    if (bathFilter === 'private' && !room.bathroomType.includes('Private')) return false;
    if (bathFilter === 'shared' && !room.bathroomType.includes('Shared')) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        room.name.toLowerCase().includes(q) ||
        room.roomNumber.toLowerCase().includes(q) ||
        room.propertyName.toLowerCase().includes(q) ||
        (room.currentTenantName && room.currentTenantName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Toggle turnover task item
  const handleToggleTurnoverTask = (room: Room, taskId: string) => {
    const updatedChecklist = room.turnoverChecklist.map(item => 
      item.id === taskId ? { ...item, isDone: !item.isDone } : item
    );
    
    // If all tasks are completed and room was Under Turnover, optionally suggest moving to Available
    const allDone = updatedChecklist.every(t => t.isDone);
    const newStatus = (allDone && room.status === 'Under Turnover') ? 'Available' : room.status;

    onUpdateRoom({
      ...room,
      turnoverChecklist: updatedChecklist,
      status: newStatus
    });
  };

  // Quick change room status
  const handleQuickStatusChange = (room: Room, newStatus: RoomStatus) => {
    onUpdateRoom({
      ...room,
      status: newStatus,
      // If setting to available, clear current tenant
      ...(newStatus === 'Available' ? { currentTenantId: undefined, currentTenantName: undefined, currentTenantPhone: undefined } : {})
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Property Filter Row */}
      <div className="bg-white rounded-sm p-5 border border-zinc-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Home className="w-4 h-4 text-indigo-600" />
            <h1 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
              Coliving Properties & Room Inventory
            </h1>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Manage individual room leases, private/shared bathrooms, keycodes, and turnover workflows.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onOpenNewPropertyModal()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-zinc-300 text-zinc-700 bg-white hover:bg-zinc-50 text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            <Building2 className="w-3.5 h-3.5 text-zinc-600" />
            <span>+ Add Property</span>
          </button>

          <button
            onClick={() => onOpenDeletePropertyModal(selectedProperty || undefined)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-rose-200 text-rose-700 bg-rose-50/70 hover:bg-rose-100 text-xs font-semibold uppercase tracking-wider transition-colors"
            title="Remove property and delete all its associated rooms"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Remove Property</span>
          </button>

          <button
            onClick={() => onOpenNewRoomModal(selectedPropertyId !== 'all' ? selectedPropertyId : undefined)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ Add Rental Room</span>
          </button>
        </div>
      </div>

      {/* Property Selector Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedPropertyId('all')}
          className={`px-3.5 py-1.5 rounded-sm text-xs font-bold transition-colors whitespace-nowrap border uppercase tracking-tight ${
            selectedPropertyId === 'all'
              ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
              : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
          }`}
        >
          All Properties ({rooms.length} Rooms)
        </button>

        {properties.map(prop => {
          const propRooms = rooms.filter(r => r.propertyId === prop.id);
          const occupied = propRooms.filter(r => r.status === 'Occupied').length;
          return (
            <button
              key={prop.id}
              onClick={() => setSelectedPropertyId(prop.id)}
              className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-colors whitespace-nowrap border flex items-center gap-2 uppercase tracking-tight ${
                selectedPropertyId === prop.id
                  ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                  : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              <span>{prop.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-sm font-mono ${
                selectedPropertyId === prop.id ? 'bg-indigo-500 text-white font-bold' : 'bg-zinc-100 text-zinc-600'
              }`}>
                {occupied}/{propRooms.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Property Detail Card (When a specific property is filtered) */}
      {selectedProperty && (
        <div className="bg-zinc-950 text-white rounded-sm p-6 shadow-xs border border-zinc-800">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-bold text-white uppercase tracking-tight">{selectedProperty.name}</h2>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-sm font-bold uppercase tracking-wider">
                  {selectedProperty.propertyType}
                </span>
                <span className="text-xs text-zinc-400 font-mono">Built {selectedProperty.yearBuilt}</span>
              </div>
              
              <p className="text-xs text-zinc-300">
                {selectedProperty.address}, {selectedProperty.city}, {selectedProperty.state} {selectedProperty.zip}
              </p>

              {/* Wi-Fi & Lock Codes info */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {selectedProperty.wifiNetwork && (
                  <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-sm text-xs">
                    <Wifi className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Wi-Fi: <strong className="text-zinc-200 font-mono">{selectedProperty.wifiNetwork}</strong></span>
                    <span className="text-zinc-400 font-mono">({selectedProperty.wifiPassword})</span>
                  </div>
                )}
                {selectedProperty.keypadMasterCode && (
                  <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-sm text-xs">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    <span>Keypad Code: <strong className="text-amber-300 font-mono">{selectedProperty.keypadMasterCode}</strong></span>
                  </div>
                )}
              </div>

              {/* House Rules */}
              <div className="pt-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Coliving House Rules:</p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {selectedProperty.houseRules.map((rule, idx) => (
                    <span key={idx} className="text-[11px] bg-zinc-900 text-zinc-300 px-2.5 py-0.5 rounded-sm border border-zinc-800">
                      • {rule}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Owner & Financial summary */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-4 min-w-[280px] text-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Property Management</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenEditPropertyModal(selectedProperty)}
                    className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold text-xs transition-colors"
                    title="Edit property information, rules, and owner details"
                  >
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                  <span className="text-zinc-600">|</span>
                  <button
                    onClick={() => onOpenDeletePropertyModal(selectedProperty)}
                    className="text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold text-xs transition-colors"
                    title="Delete this property and all its rooms"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase text-zinc-400 font-bold tracking-wider">Owner</p>
                <p className="font-bold text-zinc-200 text-sm mt-0.5">{selectedProperty.ownerName}</p>
                <p className="text-zinc-400 font-mono text-[11px]">{selectedProperty.ownerPhone}</p>
                <p className="text-zinc-400 text-[11px] truncate">{selectedProperty.ownerEmail}</p>
              </div>

              <div className="pt-2 border-t border-zinc-800 flex justify-between items-center">
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-bold">Monthly Target:</span>
                  <span className="font-bold text-emerald-400 font-mono text-sm">${selectedProperty.monthlyRevenueEstimate.toLocaleString()}/mo</span>
                </div>
                <button
                  onClick={() => onOpenNewRoomModal(selectedProperty.id)}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-sm font-semibold text-[11px] uppercase tracking-tight flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Room</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Room Filters & Search */}
      <div className="bg-white rounded-sm p-4 border border-zinc-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-zinc-500 uppercase tracking-tight text-[11px] flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded-sm text-xs font-semibold uppercase tracking-tight transition-colors ${statusFilter === 'all' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'}`}
          >
            All ({rooms.length})
          </button>
          <button
            onClick={() => setStatusFilter('Occupied')}
            className={`px-2.5 py-1 rounded-sm text-xs font-semibold uppercase tracking-tight transition-colors ${statusFilter === 'Occupied' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
          >
            Occupied ({rooms.filter(r => r.status === 'Occupied').length})
          </button>
          <button
            onClick={() => setStatusFilter('Available')}
            className={`px-2.5 py-1 rounded-sm text-xs font-semibold uppercase tracking-tight transition-colors ${statusFilter === 'Available' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}
          >
            Available ({rooms.filter(r => r.status === 'Available').length})
          </button>
          <button
            onClick={() => setStatusFilter('Under Turnover')}
            className={`px-2.5 py-1 rounded-sm text-xs font-semibold uppercase tracking-tight transition-colors ${statusFilter === 'Under Turnover' ? 'bg-amber-700 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
          >
            Turnover ({rooms.filter(r => r.status === 'Under Turnover').length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={bathFilter}
            onChange={(e) => setBathFilter(e.target.value)}
            className="text-xs bg-zinc-50 border border-zinc-300 rounded-sm px-2.5 py-1.5 text-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Bath Types</option>
            <option value="private">Private Ensuite Only</option>
            <option value="shared">Shared Bath Only</option>
          </select>

          <input
            type="text"
            placeholder="Filter room or tenant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-xs bg-zinc-50 border border-zinc-300 rounded-sm px-3 py-1.5 text-zinc-700 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44"
          />
        </div>
      </div>

      {/* Room Grid Cards */}
      {filteredRooms.length === 0 ? (
        <div className="bg-white rounded-sm border border-zinc-200 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-zinc-100 text-zinc-400 mx-auto flex items-center justify-center">
            <Home className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-zinc-800 text-sm">No Rooms Found</h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1">
              {properties.length === 0 
                ? "You don't have any properties yet. Start by creating a coliving property, then add individual rooms."
                : rooms.length === 0
                ? "No rooms have been added to your inventory yet. Click below to add your first room."
                : "No rooms match the selected filters or search keyword."}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            {properties.length === 0 ? (
              <button
                onClick={() => onOpenNewPropertyModal()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Property</span>
              </button>
            ) : (
              <button
                onClick={() => onOpenNewRoomModal(selectedPropertyId !== 'all' ? selectedPropertyId : undefined)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Rental Room</span>
              </button>
            )}
            {(statusFilter !== 'all' || bathFilter !== 'all' || searchTerm) && (
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setBathFilter('all');
                  setSearchTerm('');
                  setSelectedPropertyId('all');
                }}
                className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-sm text-xs font-semibold transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRooms.map(room => (
          <div 
            key={room.id}
            className={`bg-white rounded-sm border shadow-xs flex flex-col justify-between transition-colors ${
              room.status === 'Available' 
                ? 'border-indigo-400' 
                : room.status === 'Under Turnover' 
                ? 'border-amber-300' 
                : 'border-zinc-200'
            }`}
          >
            {/* Card Header */}
            <div className="p-4 border-b border-zinc-100">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    {room.propertyName}
                  </span>
                  <h3 className="font-bold text-zinc-900 text-sm mt-0.5">{room.name}</h3>
                </div>
                <RoomStatusBadge status={room.status} />
              </div>

              {/* Room Stats */}
              <div className="flex items-center justify-between mt-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-light text-zinc-900 font-mono">${room.monthlyRent}</span>
                  <span className="text-zinc-500 text-[11px]">/month</span>
                </div>
                <div className="text-right text-zinc-500 text-[11px]">
                  {room.floor && (
                    <span className="font-semibold text-zinc-700">
                      {typeof room.floor === 'number' ? `Floor ${room.floor}` : room.floor} •{' '}
                    </span>
                  )}
                  <span className="font-mono">{room.sqft} sqft</span>
                </div>
              </div>

              {/* Bath and Furnished Badges */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                <BathroomTypeBadge type={room.bathroomType} />
                <span className="text-[10px] px-2 py-0.5 rounded-sm bg-zinc-100 text-zinc-700 border border-zinc-200 font-semibold uppercase tracking-tight">
                  {room.isFurnished ? 'Furnished' : 'Unfurnished'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-sm bg-zinc-100 text-zinc-600 border border-zinc-200 font-mono">
                  Dep: ${room.securityDeposit}
                </span>
              </div>
            </div>

            {/* Middle: Tenancy or Availability Details */}
            <div className="p-4 space-y-3 bg-zinc-50/50 flex-1">
              {room.status === 'Occupied' ? (
                <div className="bg-white p-3 rounded-sm border border-zinc-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-900 flex items-center gap-1">
                      {room.currentTenantName}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-sm border border-emerald-200 uppercase">
                      Active Lease
                    </span>
                  </div>
                  <p className="text-zinc-500 text-[11px] font-mono">{room.currentTenantPhone}</p>
                  <div className="pt-1.5 border-t border-zinc-100 flex justify-between text-[11px]">
                    <span className="text-zinc-500">Lease Ends:</span>
                    <strong className="text-zinc-900 font-mono">{room.leaseEndDate}</strong>
                  </div>
                </div>
              ) : room.status === 'Available' ? (
                <div className="bg-indigo-50/80 p-3 rounded-sm border border-indigo-200 text-xs">
                  <p className="font-bold text-indigo-900 uppercase tracking-tight text-[11px]">
                    Ready for Immediate Move-in
                  </p>
                  <p className="text-indigo-700 text-[11px] mt-1">
                    Turnover complete. Keycode reset and staged.
                  </p>
                  <button
                    onClick={() => onOpenAssignLeadModal(room)}
                    className="mt-2 w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs"
                  >
                    Match / Assign Lead
                  </button>
                </div>
              ) : room.status === 'Under Turnover' ? (
                <div className="bg-amber-50/90 p-3 rounded-sm border border-amber-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 text-xs uppercase tracking-tight">Turnover Checklist</span>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-200/70 px-1.5 py-0.5 rounded-sm font-mono">
                      {room.turnoverChecklist.filter(t => t.isDone).length}/{room.turnoverChecklist.length} Done
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {room.turnoverChecklist.map(item => (
                      <div 
                        key={item.id}
                        onClick={() => handleToggleTurnoverTask(room, item.id)}
                        className="flex items-center gap-2 cursor-pointer text-[11px] text-zinc-700 hover:text-zinc-900 select-none"
                      >
                        {item.isDone ? (
                          <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        )}
                        <span className={item.isDone ? 'line-through text-zinc-400' : 'font-medium'}>
                          {item.task}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-purple-50 p-3 rounded-sm border border-purple-200 text-xs">
                  <p className="font-bold text-purple-900 uppercase tracking-tight text-[11px]">Reserved for Approved Lead</p>
                  <p className="text-purple-700 text-[11px] mt-1">Pending deposit verification and lease signing.</p>
                </div>
              )}

              {/* Room amenities pills */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Features:</span>
                <div className="flex flex-wrap gap-1">
                  {room.amenities.slice(0, 3).map((am, i) => (
                    <span key={i} className="text-[10px] bg-white border border-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded-sm font-medium">
                      {am}
                    </span>
                  ))}
                  {room.amenities.length > 3 && (
                    <span className="text-[10px] text-zinc-400 self-center">+{room.amenities.length - 3} more</span>
                  )}
                </div>
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="p-3 bg-white border-t border-zinc-100 flex items-center justify-between text-xs gap-2">
              <select
                value={room.status}
                onChange={(e) => handleQuickStatusChange(room, e.target.value as RoomStatus)}
                className="text-[11px] bg-zinc-50 border border-zinc-200 rounded-sm px-2 py-1 text-zinc-700 focus:outline-none font-medium"
              >
                <option value="Occupied">Occupied</option>
                <option value="Available">Available</option>
                <option value="Under Turnover">Under Turnover</option>
                <option value="Reserved">Reserved</option>
              </select>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onOpenWorkOrderForRoom(room)}
                  className="p-1.5 text-zinc-500 hover:text-indigo-600 hover:bg-zinc-100 rounded-sm transition-colors"
                  title="Create Work Order for this room"
                >
                  <Wrench className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onOpenEditRoomModal(room)}
                  className="px-2 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-sm font-medium text-[11px] transition-colors uppercase tracking-tight"
                >
                  Edit
                </button>
                {onDeleteRoom && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete room "${room.name}"?`)) {
                        onDeleteRoom(room.id);
                      }
                    }}
                    className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-sm transition-colors"
                    title="Delete Room"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
};
