import React, { useState } from 'react';
import { Wrench, Plus, X, Building, AlertTriangle } from 'lucide-react';
import { WorkOrder, WorkOrderPriority, WorkOrderCategory, Property, Room, Contact } from '../../types';

interface NewWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
  rooms: Room[];
  contacts: Contact[];
  onSave: (workOrder: WorkOrder) => void;
  editingWorkOrder?: WorkOrder | null;
  defaultRoom?: Room | null;
}

export const NewWorkOrderModal: React.FC<NewWorkOrderModalProps> = ({
  isOpen,
  onClose,
  properties,
  rooms,
  contacts,
  onSave,
  editingWorkOrder,
  defaultRoom
}) => {
  const contractors = contacts.filter(c => c.type === 'Vendor / Contractor');

  const [title, setTitle] = useState<string>(editingWorkOrder?.title || '');
  const [description, setDescription] = useState<string>(editingWorkOrder?.description || '');
  const [propertyId, setPropertyId] = useState<string>(
    editingWorkOrder?.propertyId || defaultRoom?.propertyId || properties[0]?.id || ''
  );
  const [roomId, setRoomId] = useState<string>(
    editingWorkOrder?.roomId || defaultRoom?.id || 'common'
  );
  const [category, setCategory] = useState<WorkOrderCategory>(
    editingWorkOrder?.category || 'Plumbing'
  );
  const [priority, setPriority] = useState<WorkOrderPriority>(
    editingWorkOrder?.priority || 'Medium'
  );
  const [assignedVendorId, setAssignedVendorId] = useState<string>(
    editingWorkOrder?.assignedVendorId || ''
  );
  const [estimatedCost, setEstimatedCost] = useState<number>(
    editingWorkOrder?.estimatedCost || 120
  );
  const [actualCost, setActualCost] = useState<number | undefined>(
    editingWorkOrder?.actualCost
  );
  const [status, setStatus] = useState<any>(editingWorkOrder?.status || 'New');
  const [accessInstructions, setAccessInstructions] = useState<string>(
    editingWorkOrder?.accessInstructions || ''
  );
  const [entryPermission, setEntryPermission] = useState<boolean>(
    editingWorkOrder?.entryPermission ?? true
  );
  const [resolutionSummary, setResolutionSummary] = useState<string>(
    editingWorkOrder?.resolutionSummary || ''
  );

  if (!isOpen) return null;

  const propertyRooms = rooms.filter(r => r.propertyId === propertyId);
  const selectedProperty = properties.find(p => p.id === propertyId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !propertyId) return;

    const prop = properties.find(p => p.id === propertyId);
    const roomObj = roomId !== 'common' ? rooms.find(r => r.id === roomId) : undefined;
    const vendorObj = contractors.find(c => c.id === assignedVendorId);

    const newTicket: WorkOrder = {
      id: editingWorkOrder?.id || `wo-${Date.now()}`,
      ticketNumber: editingWorkOrder?.ticketNumber || `WO-${Math.floor(1000 + Math.random() * 9000)}`,
      title,
      description,
      propertyId,
      propertyName: prop?.name || 'Property',
      roomId: roomObj ? roomObj.id : undefined,
      roomName: roomObj ? roomObj.name : 'Common Area',
      isCommonArea: roomId === 'common',
      tenantId: roomObj?.currentTenantId,
      reportedByName: roomObj?.currentTenantName || 'Moyer Operations Dispatch',
      reportedByPhone: roomObj?.currentTenantPhone || '(303) 555-0100',
      category,
      priority,
      status: status || (assignedVendorId ? 'Assigned' : 'New'),
      assignedVendorId: vendorObj?.id,
      assignedVendorName: vendorObj ? `${vendorObj.name} (${vendorObj.company || 'Contractor'})` : undefined,
      assignedVendorPhone: vendorObj?.phone,
      estimatedCost: Number(estimatedCost) || 0,
      actualCost: actualCost !== undefined ? Number(actualCost) : undefined,
      dateReported: editingWorkOrder?.dateReported || new Date().toISOString().split('T')[0],
      accessInstructions: accessInstructions || (selectedProperty?.keypadMasterCode ? `Keypad Master Code: ${selectedProperty.keypadMasterCode}` : undefined),
      entryPermission,
      photos: editingWorkOrder?.photos,
      timeline: editingWorkOrder?.timeline || [
        {
          id: `tl-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          status: status || 'New',
          note: `Work order logged: ${title}`,
          author: 'Moyer Property Staff'
        }
      ],
      comments: editingWorkOrder?.comments || [
        {
          id: `c-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          author: 'Moyer Dispatch',
          isTenant: false,
          message: description || 'Work order logged.'
        }
      ],
      resolutionSummary
    };

    onSave(newTicket);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center font-bold">
              <Wrench className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">
                {editingWorkOrder ? `Manage Work Order ${editingWorkOrder.ticketNumber}` : 'Create Maintenance Work Order'}
              </h2>
              <p className="text-[11px] text-slate-400">Log repair, room fixture, or common area ticket</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs max-h-[700px] overflow-y-auto">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Issue Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Master Bedroom Shower Faucet Dripping"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Property *</label>
              <select
                value={propertyId}
                onChange={(e) => {
                  setPropertyId(e.target.value);
                  setRoomId('common');
                }}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
              >
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Specific Room or Area *</label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
              >
                <option value="common">🏠 Shared Commons (Kitchen / Living / Yard)</option>
                {propertyRooms.map(r => (
                  <option key={r.id} value={r.id}>{r.name} ({r.status})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
              >
                <option value="Plumbing">Plumbing</option>
                <option value="HVAC / Heating">HVAC / Heating</option>
                <option value="Electrical">Electrical</option>
                <option value="Appliance">Appliance</option>
                <option value="Locks & Access">Locks & Access</option>
                <option value="Common Area">Common Area</option>
                <option value="Room Fixtures">Room Fixtures</option>
                <option value="Pest Control">Pest Control</option>
                <option value="Deep Cleaning">Deep Cleaning</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
                <option value="Emergency">🚨 Emergency (Immediate Dispatch)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Problem Description</label>
            <textarea
              rows={3}
              placeholder="Describe symptoms, noise, water leak location, or tenant report..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Assign Vendor / Contractor</label>
              <select
                value={assignedVendorId}
                onChange={(e) => setAssignedVendorId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
              >
                <option value="">-- Leave Unassigned --</option>
                {contractors.map(c => (
                  <option key={c.id} value={c.id}>{c.name} - {c.roleOrSpecialty}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Estimated Cost ($)</label>
              <input
                type="number"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {editingWorkOrder && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Ticket Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                >
                  <option value="New">New</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Awaiting Parts">Awaiting Parts</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Actual Final Cost ($)</label>
                <input
                  type="number"
                  placeholder="Invoiced cost"
                  value={actualCost !== undefined ? actualCost : ''}
                  onChange={(e) => setActualCost(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          )}

          {editingWorkOrder && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">Resolution Summary</label>
              <input
                type="text"
                placeholder="e.g. Replaced P-trap and tested flow for 5 minutes without leaks"
                value={resolutionSummary}
                onChange={(e) => setResolutionSummary(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
          )}

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
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-md transition"
            >
              {editingWorkOrder ? 'Save Changes' : 'Create Work Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
