import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  X, 
  UserCheck, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  Phone, 
  MessageSquare, 
  Key, 
  Clock, 
  Building, 
  CheckSquare, 
  ListChecks, 
  AlertCircle,
  Plus
} from 'lucide-react';
import { WorkOrder, Contact, Property, Room } from '../../types';
import { QuickSmsModal, QuickSmsRecipient } from './QuickSmsModal';

interface AssignVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrder | null;
  contacts: Contact[];
  properties?: Property[];
  rooms?: Room[];
  onAssignVendor: (
    workOrder: WorkOrder, 
    vendor: Contact, 
    scheduledDate?: string, 
    dispatchNote?: string,
    estimatedCost?: number
  ) => void;
  onOpenNewContactModal?: () => void;
}

export const AssignVendorModal: React.FC<AssignVendorModalProps> = ({
  isOpen,
  onClose,
  workOrder,
  contacts,
  properties = [],
  rooms = [],
  onAssignVendor,
  onOpenNewContactModal
}) => {
  const vendors = contacts.filter(c => c.type === 'Vendor / Contractor');

  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [estimatedCost, setEstimatedCost] = useState<number>(195);
  const [dispatchNote, setDispatchNote] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [smsRecipient, setSmsRecipient] = useState<QuickSmsRecipient | null>(null);

  useEffect(() => {
    if (isOpen && workOrder) {
      setErrorMessage('');
      setSelectedVendorId(workOrder.assignedVendorId || (vendors.length > 0 ? vendors[0].id : ''));
      setEstimatedCost(workOrder.estimatedCost || 195);
      
      // Default scheduled date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setScheduledDate(workOrder.dateScheduled || tomorrow.toISOString().split('T')[0]);
      
      setDispatchNote('');
    }
  }, [isOpen, workOrder]);

  if (!isOpen || !workOrder) return null;

  const property = properties.find(p => p.id === workOrder.propertyId);
  const selectedVendor = vendors.find(v => v.id === selectedVendorId);

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendorId) {
      setErrorMessage('Please select a vendor / contractor to assign this work order.');
      return;
    }

    const vendor = vendors.find(v => v.id === selectedVendorId);
    if (!vendor) {
      setErrorMessage('Selected vendor was not found in contacts.');
      return;
    }

    onAssignVendor(workOrder, vendor, scheduledDate, dispatchNote, estimatedCost);
    onClose();
  };

  const handleQuickSms = () => {
    if (!selectedVendor) return;
    const itemsCount = workOrder.turnoverTasks?.length || 0;
    const taskSummary = workOrder.turnoverTasks 
      ? workOrder.turnoverTasks.map(t => `- ${t.task}`).slice(0, 4).join('\n')
      : workOrder.description;

    const prefill = `Hi ${selectedVendor.name}, you have been assigned Work Order ${workOrder.ticketNumber} for ${workOrder.propertyName} (${workOrder.roomName || 'Room'}). Tasks (${itemsCount}):\n${taskSummary}\nScheduled: ${scheduledDate}. Keypad code: ${property?.keypadMasterCode || 'Provided at check-in'}. Please reply to confirm!`;

    setSmsRecipient({
      name: selectedVendor.name,
      phone: selectedVendor.phone,
      property: workOrder.propertyName,
      room: workOrder.roomName,
      templateText: prefill
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-white rounded-lg max-w-xl w-full shadow-2xl border border-zinc-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="bg-zinc-900 text-white p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-amber-600 flex items-center justify-center font-bold text-white shadow-xs">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-sm text-white">
                    Assign Vendor to Work Order
                  </h2>
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono text-[10px] px-2 py-0.5 rounded font-bold">
                    {workOrder.ticketNumber}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  {workOrder.propertyName} • {workOrder.roomName || 'Common Area'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="text-zinc-400 hover:text-white p-1 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {errorMessage && (
            <div className="m-5 mb-0 p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleAssign} className="p-5 space-y-4 text-xs max-h-[750px] overflow-y-auto">
            {/* Work Order Brief Box */}
            <div className="bg-zinc-50 rounded-md border border-zinc-200 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-900 text-xs">{workOrder.title}</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                  {workOrder.category}
                </span>
              </div>
              
              {property?.keypadMasterCode && (
                <div className="flex items-center gap-2 text-[11px] text-zinc-600 font-mono bg-white p-2 rounded border border-zinc-200">
                  <Key className="w-3.5 h-3.5 text-amber-600" />
                  <span>Master Keypad Access: <strong>{property.keypadMasterCode}</strong></span>
                </div>
              )}

              {/* Items Needed To Be Done Checklist */}
              {workOrder.turnoverTasks && workOrder.turnoverTasks.length > 0 ? (
                <div className="mt-2.5 pt-2.5 border-t border-zinc-200">
                  <div className="flex items-center gap-1.5 font-bold text-zinc-700 text-[11px] uppercase tracking-wider mb-2">
                    <ListChecks className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Turnover Items Needed To Be Done ({workOrder.turnoverTasks.length} tasks)</span>
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {workOrder.turnoverTasks.map((task, idx) => (
                      <div 
                        key={task.id || idx}
                        className="flex items-start gap-2 text-[11px] text-zinc-700 bg-white p-1.5 rounded border border-zinc-100"
                      >
                        <CheckSquare className="w-3.5 h-3.5 text-zinc-400 mt-0.5 shrink-0" />
                        <span className="leading-tight">{task.task}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-zinc-600 line-clamp-3 italic">
                  {workOrder.description}
                </p>
              )}
            </div>

            {/* Vendor Selection */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-zinc-700 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-zinc-600" />
                  <span>Select Vendor / Contractor *</span>
                </label>
                {onOpenNewContactModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenNewContactModal();
                    }}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Add New Vendor</span>
                  </button>
                )}
              </div>

              {vendors.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-[11px]">
                  No vendor/contractor contacts found in the directory. Please add a vendor in the Contacts tab or click "+ Add New Vendor".
                </div>
              ) : (
                <div className="space-y-2">
                  <select
                    value={selectedVendorId}
                    onChange={(e) => setSelectedVendorId(e.target.value)}
                    className="w-full bg-white border border-zinc-300 rounded-md p-2.5 text-zinc-800 font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">-- Choose a Vendor / Contractor --</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name} {v.company ? `(${v.company})` : ''} {v.roleOrSpecialty ? `• ${v.roleOrSpecialty}` : ''}
                      </option>
                    ))}
                  </select>

                  {/* Selected Vendor Card Preview with Quick Contact Actions */}
                  {selectedVendor && (
                    <div className="bg-indigo-50/70 border border-indigo-200 rounded-md p-3 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-indigo-950 text-xs">
                          {selectedVendor.name} {selectedVendor.company && <span className="font-normal text-indigo-700">({selectedVendor.company})</span>}
                        </div>
                        <div className="text-[11px] text-indigo-800/80 font-mono mt-0.5">
                          📞 {selectedVendor.phone} {selectedVendor.email && `• ✉️ ${selectedVendor.email}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleQuickSms}
                          className="px-2.5 py-1 bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-300 rounded text-[11px] font-semibold flex items-center gap-1 transition"
                          title="Compose SMS Dispatch"
                        >
                          <MessageSquare className="w-3 h-3 text-indigo-600" />
                          <span>SMS</span>
                        </button>
                        <a
                          href={`tel:${selectedVendor.phone}`}
                          className="p-1.5 bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-300 rounded text-[11px] font-semibold flex items-center transition"
                          title="Call Vendor"
                        >
                          <Phone className="w-3 h-3 text-emerald-600" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Scheduling & Cost Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-zinc-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Scheduled Date</span>
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full bg-white border border-zinc-300 rounded-md p-2 text-zinc-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Estimated Cost ($)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(Number(e.target.value))}
                  className="w-full bg-white border border-zinc-300 rounded-md p-2 text-zinc-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono"
                  placeholder="195"
                />
              </div>
            </div>

            {/* Dispatch Instructions / Notes */}
            <div>
              <label className="block font-bold text-zinc-700 mb-1">
                Dispatch Instructions / Notes to Vendor (Optional)
              </label>
              <textarea
                rows={2}
                value={dispatchNote}
                onChange={(e) => setDispatchNote(e.target.value)}
                placeholder="e.g. Park in driveway, clean carpet thoroughly, text manager once lock code is reprogrammed."
                className="w-full bg-white border border-zinc-300 rounded-md p-2 text-zinc-800 placeholder-zinc-400 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-zinc-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 border border-zinc-300 rounded-md text-zinc-600 hover:bg-zinc-100 font-semibold transition text-xs"
              >
                Assign Later
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={!selectedVendorId}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-md font-bold transition flex items-center gap-1.5 shadow-sm text-xs"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Assign & Dispatch Work Order</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {smsRecipient && (
        <QuickSmsModal
          isOpen={true}
          onClose={() => setSmsRecipient(null)}
          recipient={smsRecipient}
        />
      )}
    </>
  );
};
