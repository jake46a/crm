import React from 'react';
import { Trash2, AlertTriangle, Wrench, Users2, ShieldAlert } from 'lucide-react';
import { Contact, WorkOrder, TenantLead } from '../../types';

interface DeleteContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact | null;
  workOrders?: WorkOrder[];
  leads?: TenantLead[];
  onConfirmDelete: (contactId: string) => void;
}

export const DeleteContactModal: React.FC<DeleteContactModalProps> = ({
  isOpen,
  onClose,
  contact,
  workOrders = [],
  leads = [],
  onConfirmDelete
}) => {
  if (!isOpen || !contact) return null;

  const isVendor = contact.type === 'Vendor / Contractor';
  const isAgent = contact.type === 'Leasing Agent';

  const assignedWorkOrders = workOrders.filter(
    w => w.assignedVendorId === contact.id || w.assignedVendorName === contact.name
  );
  const activeWorkOrders = assignedWorkOrders.filter(
    w => w.status !== 'Completed' && w.status !== 'Cancelled'
  );

  const assignedLeads = leads.filter(
    l => l.assignedAgent === contact.name
  );
  const activeLeads = assignedLeads.filter(
    l => l.stage !== 'Lease Signed' && l.stage !== 'Signed / Converted' && l.stage !== 'Lost / Archived'
  );

  const typeLabel = isVendor ? 'Vendor / Contractor' : isAgent ? 'Leasing Agent' : contact.type;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-red-600 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-bold">
              <Trash2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">Delete {typeLabel}</h2>
              <p className="text-[11px] text-red-100">Permanently remove from CRM directory</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-red-200 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Target Entity Card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0 ${contact.avatarBg}`}>
              {contact.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <h3 className="font-bold text-slate-900 text-xs truncate">{contact.name}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-sm font-bold uppercase tracking-tight bg-slate-200 text-slate-700 shrink-0">
                  {contact.type}
                </span>
              </div>
              {contact.company && (
                <p className="text-[11px] text-slate-500 font-medium truncate">{contact.company}</p>
              )}
              <p className="text-[11px] text-slate-600 font-mono mt-0.5 truncate">{contact.phone} • {contact.email}</p>
            </div>
          </div>

          {/* Dependency & Impact Warnings */}
          {isVendor && activeWorkOrders.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-xs text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Active Work Order Warning ({activeWorkOrders.length})</span>
              </div>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                This contractor is currently assigned to {activeWorkOrders.length} active maintenance ticket(s). Deleting them will unassign the vendor from these work orders.
              </p>
            </div>
          )}

          {isAgent && activeLeads.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-xs text-amber-800">
                <Users2 className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Active Pipeline Leads Warning ({activeLeads.length})</span>
              </div>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                This leasing agent is currently managing {activeLeads.length} active prospect lead(s). Their assignment on those leads will be cleared.
              </p>
            </div>
          )}

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-[11px] leading-relaxed">
            <p>
              Are you sure you want to delete <strong className="text-slate-900">{contact.name}</strong>? This action will remove their contact records, rate information, and trade dispatch info from the directory.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirmDelete(contact.id);
                onClose();
              }}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-md transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Confirm Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
