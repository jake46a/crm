import React, { useState, useEffect } from 'react';
import { Wrench, Plus, X, Building, AlertTriangle, Trash2, AlertCircle, Printer, MessageSquare } from 'lucide-react';
import { WorkOrder, WorkOrderPriority, WorkOrderCategory, Property, Room, Contact } from '../../types';
import { getTenantFullName } from '../../utils/nameUtils';
import { QuickSmsModal, QuickSmsRecipient } from './QuickSmsModal';

interface NewWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
  rooms: Room[];
  contacts: Contact[];
  onSave: (workOrder: WorkOrder) => void;
  editingWorkOrder?: WorkOrder | null;
  defaultRoom?: Room | null;
  onDelete?: (workOrderId: string) => void;
  onPrint?: (workOrder: WorkOrder) => void;
}

export const NewWorkOrderModal: React.FC<NewWorkOrderModalProps> = ({
  isOpen,
  onClose,
  properties,
  rooms,
  contacts,
  onSave,
  editingWorkOrder,
  defaultRoom,
  onDelete,
  onPrint
}) => {
  const contractors = contacts.filter(c => c.type === 'Vendor / Contractor');

  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [propertyId, setPropertyId] = useState<string>('');
  const [roomId, setRoomId] = useState<string>('common');
  const [category, setCategory] = useState<WorkOrderCategory>('Plumbing');
  const [priority, setPriority] = useState<WorkOrderPriority>('Medium');
  const [assignedVendorId, setAssignedVendorId] = useState<string>('');
  const [estimatedCost, setEstimatedCost] = useState<number>(120);
  const [actualCost, setActualCost] = useState<number | undefined>(undefined);
  const [status, setStatus] = useState<any>('New');
  const [accessInstructions, setAccessInstructions] = useState<string>('');
  const [entryPermission, setEntryPermission] = useState<boolean>(true);
  const [resolutionSummary, setResolutionSummary] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState<boolean>(false);
  const [smsTarget, setSmsTarget] = useState<QuickSmsRecipient | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setIsConfirmingDelete(false);
      
      const initialPropId = editingWorkOrder?.propertyId || defaultRoom?.propertyId || (properties.length > 0 ? properties[0].id : '');
      const initialRoomId = editingWorkOrder?.roomId || defaultRoom?.id || 'common';

      if (editingWorkOrder) {
        setTitle(editingWorkOrder.title || '');
        setDescription(editingWorkOrder.description || '');
        setPropertyId(editingWorkOrder.propertyId || initialPropId);
        setRoomId(editingWorkOrder.roomId || initialRoomId);
        setCategory(editingWorkOrder.category || 'Plumbing');
        setPriority(editingWorkOrder.priority || 'Medium');
        setAssignedVendorId(editingWorkOrder.assignedVendorId || '');
        setEstimatedCost(editingWorkOrder.estimatedCost ?? 120);
        setActualCost(editingWorkOrder.actualCost);
        setStatus(editingWorkOrder.status || 'New');
        setAccessInstructions(editingWorkOrder.accessInstructions || '');
        setEntryPermission(editingWorkOrder.entryPermission ?? true);
        setResolutionSummary(editingWorkOrder.resolutionSummary || '');
      } else {
        setTitle('');
        setDescription('');
        setPropertyId(initialPropId);
        setRoomId(initialRoomId);
        setCategory('Plumbing');
        setPriority('Medium');
        setAssignedVendorId('');
        setEstimatedCost(120);
        setActualCost(undefined);
        setStatus('New');
        setAccessInstructions('');
        setEntryPermission(true);
        setResolutionSummary('');
      }
    }
  }, [isOpen, editingWorkOrder, defaultRoom, properties]);

  if (!isOpen) return null;

  const propertyRooms = rooms.filter(r => r.propertyId === propertyId);
  const selectedProperty = properties.find(p => p.id === propertyId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!title.trim()) {
      setErrorMessage('Please enter an issue title.');
      return;
    }

    if (!propertyId && properties.length > 0) {
      setPropertyId(properties[0].id);
    }

    const effectivePropertyId = propertyId || (properties.length > 0 ? properties[0].id : `prop-${Date.now()}`);
    const prop = properties.find(p => p.id === effectivePropertyId);
    const roomObj = roomId !== 'common' ? rooms.find(r => r.id === roomId) : undefined;
    const vendorObj = contractors.find(c => c.id === assignedVendorId);

    const newTicket: WorkOrder = {
      id: editingWorkOrder?.id || `wo-${Date.now()}`,
      ticketNumber: editingWorkOrder?.ticketNumber || `WO-${Math.floor(1000 + Math.random() * 9000)}`,
      title: title.trim(),
      description: description.trim(),
      propertyId: effectivePropertyId,
      propertyName: prop?.name || editingWorkOrder?.propertyName || 'Managed Property',
      roomId: roomObj ? roomObj.id : (roomId !== 'common' ? roomId : undefined),
      roomName: roomObj ? roomObj.name : (roomId === 'common' ? 'Shared Commons (Kitchen / Living / Yard)' : 'Specific Area'),
      isCommonArea: roomId === 'common',
      tenantId: roomObj?.currentTenantId || editingWorkOrder?.tenantId,
      reportedByFirstName: roomObj?.currentTenantFirstName || editingWorkOrder?.reportedByFirstName,
      reportedByLastName: roomObj?.currentTenantLastName || editingWorkOrder?.reportedByLastName,
      reportedByName: roomObj ? getTenantFullName(roomObj) : (editingWorkOrder?.reportedByName || 'Moyer Operations Dispatch'),
      reportedByPhone: roomObj?.currentTenantPhone || editingWorkOrder?.reportedByPhone || '(303) 555-0100',
      category,
      priority,
      status: status || (assignedVendorId ? 'Assigned' : 'New'),
      assignedVendorId: vendorObj?.id || (assignedVendorId || undefined),
      assignedVendorName: vendorObj ? `${vendorObj.name} (${vendorObj.company || 'Contractor'})` : editingWorkOrder?.assignedVendorName,
      assignedVendorPhone: vendorObj?.phone || editingWorkOrder?.assignedVendorPhone,
      estimatedCost: Number(estimatedCost) || 0,
      actualCost: actualCost !== undefined && actualCost !== null && !isNaN(Number(actualCost)) ? Number(actualCost) : undefined,
      dateReported: editingWorkOrder?.dateReported || new Date().toISOString().split('T')[0],
      accessInstructions: accessInstructions || (selectedProperty?.keypadMasterCode ? `Keypad Master Code: ${selectedProperty.keypadMasterCode}` : undefined),
      entryPermission,
      photos: editingWorkOrder?.photos,
      timeline: editingWorkOrder?.timeline || [
        {
          id: `tl-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          status: status || 'New',
          note: `Work order logged: ${title.trim()}`,
          author: 'Moyer Property Staff'
        }
      ],
      comments: editingWorkOrder?.comments || [
        {
          id: `c-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          author: 'Moyer Dispatch',
          isTenant: false,
          message: description.trim() || 'Work order logged.'
        }
      ],
      resolutionSummary: resolutionSummary.trim() || undefined
    };

    onSave(newTicket);
    onClose();
  };

  const handleDelete = () => {
    if (editingWorkOrder && onDelete) {
      onDelete(editingWorkOrder.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-lg w-full shadow-2xl border border-zinc-200 overflow-hidden my-8">
        <div className="bg-zinc-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-indigo-600 flex items-center justify-center font-bold text-white shadow-xs">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">
                {editingWorkOrder ? `Manage Work Order ${editingWorkOrder.ticketNumber}` : 'Create Maintenance Work Order'}
              </h2>
              <p className="text-[11px] text-zinc-400">Log repair, room fixture, or common area ticket</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1">✕</button>
        </div>

        {errorMessage && (
          <div className="m-5 mb-0 p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs max-h-[700px] overflow-y-auto">
          <div>
            <label className="block font-bold text-zinc-700 mb-1">Issue Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Master Bedroom Shower Faucet Dripping"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Property *</label>
              {properties.length === 0 ? (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-[11px]">
                  No properties created yet. A default property tag will be assigned.
                </div>
              ) : (
                <select
                  value={propertyId}
                  onChange={(e) => {
                    setPropertyId(e.target.value);
                    setRoomId('common');
                  }}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block font-bold text-zinc-700 mb-1">Specific Room or Area *</label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
              <label className="block font-bold text-zinc-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
              <label className="block font-bold text-zinc-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
                <option value="Emergency">🚨 Emergency (Immediate Dispatch)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-zinc-700 mb-1">Problem Description</label>
            <textarea
              rows={3}
              placeholder="Describe symptoms, noise, water leak location, or tenant report..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-zinc-700">Assign Vendor / Contractor</label>
                {assignedVendorId && (
                  <button
                    type="button"
                    onClick={() => {
                      const vendor = contractors.find(c => c.id === assignedVendorId);
                      if (vendor && vendor.phone) {
                        const targetProp = properties.find(p => p.id === propertyId);
                        setSmsTarget({
                          id: vendor.id,
                          firstName: vendor.firstName,
                          lastName: vendor.lastName,
                          name: vendor.name,
                          phone: vendor.phone,
                          email: vendor.email,
                          roleOrType: 'Vendor / Contractor',
                          propertyName: targetProp?.name || 'Property',
                          workOrderTitle: title,
                          ticketNumber: editingWorkOrder?.ticketNumber || 'New Work Order'
                        });
                      }
                    }}
                    className="text-[10px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                    title="Send Dispatch SMS via Google Voice or Mobile"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>SMS Dispatch</span>
                  </button>
                )}
              </div>
              <select
                value={assignedVendorId}
                onChange={(e) => setAssignedVendorId(e.target.value)}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">-- Leave Unassigned --</option>
                {contractors.map(c => (
                  <option key={c.id} value={c.id}>{c.name} - {c.roleOrSpecialty || c.company || 'Contractor'}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-zinc-700 mb-1">Estimated Cost ($)</label>
              <input
                type="number"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(Number(e.target.value))}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          {editingWorkOrder && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-200">
              <div>
                <label className="block font-bold text-zinc-700 mb-1">Ticket Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="New">New</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Awaiting Parts">Awaiting Parts</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">Actual Final Cost ($)</label>
                <input
                  type="number"
                  placeholder="Invoiced cost"
                  value={actualCost !== undefined ? actualCost : ''}
                  onChange={(e) => setActualCost(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                />
              </div>
            </div>
          )}

          {editingWorkOrder && (
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Resolution Summary</label>
              <input
                type="text"
                placeholder="e.g. Replaced P-trap and tested flow for 5 minutes without leaks"
                value={resolutionSummary}
                onChange={(e) => setResolutionSummary(e.target.value)}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          )}

          <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-zinc-200">
            <div className="flex items-center gap-2">
              {editingWorkOrder && onPrint && (
                <button
                  type="button"
                  onClick={() => onPrint(editingWorkOrder)}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-md font-bold text-[11px] flex items-center gap-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-700" />
                  <span>Print Ticket</span>
                </button>
              )}

              {editingWorkOrder && onDelete && (
                <div>
                  {isConfirmingDelete ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md font-bold text-[11px] transition"
                      >
                        Confirm Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsConfirmingDelete(false)}
                        className="px-2 py-1.5 text-zinc-500 hover:text-zinc-700 text-[11px]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(true)}
                      className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-md font-medium text-[11px] flex items-center gap-1 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              )}
            </div>

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
                {editingWorkOrder ? 'Save Changes' : 'Create Work Order'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Quick SMS Modal for Dispatching Vendor via Google Voice or Mobile */}
      <QuickSmsModal
        isOpen={Boolean(smsTarget)}
        onClose={() => setSmsTarget(null)}
        recipient={smsTarget}
        defaultTemplateId="maintenance_update"
      />
    </div>
  );
};

