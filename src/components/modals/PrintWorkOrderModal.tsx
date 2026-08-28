import React, { useState } from 'react';
import { 
  Printer, 
  Copy, 
  Check, 
  X, 
  Wrench, 
  AlertTriangle, 
  ShieldCheck, 
  MapPin, 
  Key, 
  User, 
  Phone, 
  DollarSign, 
  Calendar,
  Download,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { WorkOrder, Property, Room, Contact } from '../../types';
import { printHtmlDocument, downloadHtmlSlip } from '../../utils/printUtils';

interface PrintWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrder | null;
  properties: Property[];
  rooms: Room[];
  contacts: Contact[];
}

export const PrintWorkOrderModal: React.FC<PrintWorkOrderModalProps> = ({
  isOpen,
  onClose,
  workOrder,
  properties,
  rooms,
  contacts
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  if (!isOpen || !workOrder) return null;

  const prop = properties.find(p => p.id === workOrder.propertyId);
  const room = workOrder.roomId ? rooms.find(r => r.id === workOrder.roomId) : undefined;
  const vendor = workOrder.assignedVendorId ? contacts.find(c => c.id === workOrder.assignedVendorId) : undefined;

  const formattedPrintDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const getHtmlSlipContent = () => {
    return `
      <!-- Header -->
      <div class="border-b-thick pb-4 mb-4">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <div style="font-size: 16px; font-weight: 900; letter-spacing: -0.5px; color: #09090b;">
              MOYER PROPERTY MANAGEMENT
            </div>
            <div style="font-size: 11px; color: #52525b; margin-top: 2px;">
              Coliving & Residential Maintenance Dispatch Ticket
            </div>
            <div style="font-size: 10px; color: #71717a; margin-top: 2px;">
              1000 Speer Blvd, Denver, CO 80204 • Operations Hotline: (303) 555-0100
            </div>
          </div>
          <div style="text-align: right; background-color: #f4f4f5; padding: 8px 12px; border: 1px solid #e4e4e7; border-radius: 4px;">
            <div style="font-size: 10px; font-weight: bold; color: #71717a; text-transform: uppercase;">Ticket #</div>
            <div style="font-family: monospace; font-size: 16px; font-weight: 900; color: #09090b;">${workOrder.ticketNumber}</div>
            <div style="margin-top: 4px;">
              <span style="font-size: 10px; font-weight: bold; text-transform: uppercase; padding: 2px 6px; border-radius: 3px; background-color: ${
                workOrder.priority === 'Emergency' ? '#ffe4e6; color: #9f1239; border: 1px solid #fecdd3;' :
                workOrder.priority === 'High' ? '#fef3c7; color: #92400e; border: 1px solid #fde68a;' :
                '#e4e4e7; color: #27272a;'
              }">
                PRIORITY: ${workOrder.priority}
              </span>
            </div>
            <div style="font-size: 9px; color: #71717a; margin-top: 4px; font-family: monospace;">
              Printed: ${formattedPrintDate}
            </div>
          </div>
        </div>
      </div>

      <!-- Location & Access Details -->
      <div class="grid-2">
        <div class="col">
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 10px;">
            <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #334155; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 6px;">
              📍 Property & Location
            </div>
            <div style="font-size: 13px; font-weight: bold; color: #0f172a;">${workOrder.propertyName}</div>
            <div style="font-size: 11px; color: #475569;">
              ${prop?.address || '1000 Speer Blvd'}, ${prop?.city || 'Denver'}, ${prop?.state || 'CO'} ${prop?.zip || '80204'}
            </div>
            <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #e2e8f0; font-size: 11px;">
              <span style="color: #64748b;">Assigned Area / Unit:</span>
              <strong style="color: #1e1b4b; background-color: #e0e7ff; padding: 2px 6px; border-radius: 3px; margin-left: 4px;">
                ${workOrder.roomName || 'Common Area / Shared Facilities'}
              </strong>
            </div>
          </div>
        </div>

        <div class="col">
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 10px;">
            <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #334155; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 6px;">
              🔑 Access & Permissions
            </div>
            <div style="font-size: 11px; margin-bottom: 4px;">
              <span style="color: #64748b;">Entry Permission:</span>
              <strong style="padding: 2px 6px; border-radius: 3px; font-size: 10px; background-color: ${workOrder.entryPermission ? '#d1fae5; color: #065f46;' : '#ffe4e6; color: #9f1239;'}">
                ${workOrder.entryPermission ? '✓ YES - Permission Granted to Enter' : '⚠️ NO - Resident Must Be Present'}
              </strong>
            </div>
            <div style="font-size: 11px; margin-bottom: 4px;">
              <span style="color: #64748b;">Master Keypad Code:</span>
              <strong style="font-family: monospace; background-color: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 3px; border: 1px solid #fde68a;">
                ${prop?.keypadMasterCode ? prop.keypadMasterCode : 'Lockbox on Site'}
              </strong>
            </div>
            <div style="font-size: 10px; color: #475569; background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 3px; padding: 4px 6px; margin-top: 4px;">
              <strong>Access Notes:</strong> ${workOrder.accessInstructions || 'Ring buzzer / knock twice before entering. Secure front door upon exit.'}
            </div>
          </div>
        </div>
      </div>

      <!-- Resident & Contractor Contacts -->
      <div class="grid-2">
        <div class="col">
          <div style="border: 1px solid #e4e4e7; border-radius: 4px; padding: 8px 10px;">
            <div style="font-size: 9px; font-weight: bold; text-transform: uppercase; color: #71717a; margin-bottom: 2px;">
              👤 Resident / Reporter Information
            </div>
            <div style="font-size: 11px; font-weight: bold; color: #18181b;">${workOrder.reportedByName || 'Moyer Operations Dispatch'}</div>
            <div style="font-size: 11px; font-family: monospace; color: #52525b;">${workOrder.reportedByPhone || '(303) 555-0100'}</div>
          </div>
        </div>

        <div class="col">
          <div style="border: 1px solid #e4e4e7; border-radius: 4px; padding: 8px 10px;">
            <div style="font-size: 9px; font-weight: bold; text-transform: uppercase; color: #71717a; margin-bottom: 2px;">
              🛠️ Assigned Contractor / Technician
            </div>
            <div style="font-size: 11px; font-weight: bold; color: #18181b;">${workOrder.assignedVendorName || 'In-House Maintenance Team'}</div>
            <div style="font-size: 11px; font-family: monospace; color: #52525b;">${workOrder.assignedVendorPhone || vendor?.phone || '(303) 555-0100'}</div>
          </div>
        </div>
      </div>

      <!-- Scope of Work & Problem Description -->
      <div style="border: 2px solid #d4d4d8; border-radius: 4px; padding: 12px; background-color: #fafafa; margin-bottom: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e4e4e7; padding-bottom: 6px; margin-bottom: 8px;">
          <div>
            <span style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #71717a;">Issue Title:</span>
            <strong style="font-size: 14px; color: #09090b; margin-left: 6px;">${workOrder.title}</strong>
          </div>
          <span style="background-color: #e4e4e7; color: #18181b; font-family: monospace; font-size: 10px; font-weight: bold; padding: 2px 8px; border-radius: 3px;">
            ${workOrder.category}
          </span>
        </div>

        <div style="font-size: 11px; line-height: 1.5; color: #27272a; margin-bottom: 10px; white-space: pre-wrap;">
${workOrder.description || 'No detailed issue description provided.'}
        </div>

        <div style="display: flex; justify-content: space-between; border-top: 1px solid #e4e4e7; padding-top: 6px; font-size: 10px; color: #52525b;">
          <span>Date Logged: <strong style="color: #18181b; font-family: monospace;">${workOrder.dateReported}</strong></span>
          <span>Target / Estimated Budget Cap: <strong style="color: #09090b; font-family: monospace;">$${workOrder.estimatedCost}</strong></span>
        </div>
      </div>

      <!-- Field Sign-Off & Resolution -->
      <div class="border-dashed-t pt-3" style="margin-top: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #18181b;">
            Technician Field Sign-Off & Work Completed
          </div>
          <div style="font-size: 10px; font-family: monospace; color: #52525b;">
            <span class="checkbox-box"></span> Complete &nbsp;&nbsp;
            <span class="checkbox-box"></span> Awaiting Parts &nbsp;&nbsp;
            <span class="checkbox-box"></span> No Access
          </div>
        </div>

        <!-- Action notes -->
        <div style="margin-bottom: 10px;">
          <div style="font-size: 9px; font-weight: bold; text-transform: uppercase; color: #71717a; margin-bottom: 2px;">
            Diagnosis & Action Taken:
          </div>
          <div style="height: 52px; border: 1px solid #d4d4d8; border-radius: 3px; background-color: #ffffff;"></div>
        </div>

        <!-- Materials & Labor -->
        <div class="grid-2" style="margin-bottom: 10px;">
          <div class="col">
            <div style="border: 1px solid #d4d4d8; border-radius: 3px; padding: 6px 8px; font-size: 10px;">
              <div style="font-weight: bold; color: #71717a; text-transform: uppercase; margin-bottom: 4px;">Materials / Parts:</div>
              <div style="border-bottom: 1px solid #e4e4e7; height: 18px;"></div>
              <div style="border-bottom: 1px solid #e4e4e7; height: 18px; margin-top: 2px;"></div>
            </div>
          </div>
          <div class="col">
            <div style="border: 1px solid #d4d4d8; border-radius: 3px; padding: 6px 8px; font-size: 10px;">
              <div style="font-weight: bold; color: #71717a; text-transform: uppercase; margin-bottom: 4px;">Labor & Cost Totals:</div>
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e4e4e7; padding-bottom: 2px;">
                <span>Labor Hours: _______ hrs</span>
                <span>Parts: $_________</span>
              </div>
              <div style="margin-top: 4px; font-weight: bold; color: #09090b;">
                Total Cost Charged: $_________________
              </div>
            </div>
          </div>
        </div>

        <!-- Signatures -->
        <div class="grid-2">
          <div class="col">
            <div style="font-size: 10px; color: #71717a;">Technician Signature:</div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between; font-size: 9px; color: #a1a1aa;">
              <span>Print Name</span>
              <span>Date</span>
            </div>
          </div>
          <div class="col">
            <div style="font-size: 10px; color: #71717a;">Resident / Manager Acknowledgment:</div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between; font-size: 9px; color: #a1a1aa;">
              <span>Signature</span>
              <span>Date</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Notice -->
      <div style="text-align: center; font-size: 9px; color: #a1a1aa; margin-top: 14px; border-top: 1px solid #e4e4e7; padding-top: 6px;">
        Moyer Property Management Operations • Submit signed maintenance slips to Denver HQ office or photo to maintenance@moyercoliving.com
      </div>
    `;
  };

  const handlePrint = () => {
    setIsPrinting(true);
    const title = `Work Order ${workOrder.ticketNumber} - ${workOrder.propertyName}`;
    const content = getHtmlSlipContent();
    printHtmlDocument(title, content);
    setTimeout(() => setIsPrinting(false), 1000);
  };

  const handleDownload = () => {
    const filename = `WorkOrder_${workOrder.ticketNumber}_${workOrder.propertyName.replace(/\s+/g, '_')}`;
    const title = `Work Order ${workOrder.ticketNumber} - ${workOrder.propertyName}`;
    const content = getHtmlSlipContent();
    downloadHtmlSlip(filename, title, content);
  };

  const plainTextSlip = `======================================================
MOYER PROPERTY MANAGEMENT - MAINTENANCE DISPATCH SLIP
======================================================
TICKET #: ${workOrder.ticketNumber}
DATE REPORTED: ${workOrder.dateReported}
PRIORITY: ${workOrder.priority.toUpperCase()}
STATUS: ${workOrder.status}
CATEGORY: ${workOrder.category}

LOCATION & PROPERTY:
--------------------
Property: ${workOrder.propertyName}
Address: ${prop?.address || '1000 Speer Blvd'}, ${prop?.city || 'Denver'}, ${prop?.state || 'CO'} ${prop?.zip || '80204'}
Unit / Area: ${workOrder.roomName || 'Common Area'}
Property Type: ${prop?.type || 'Coliving Residence'}

ACCESS & SECURITY INSTRUCTIONS:
-------------------------------
Entry Permission: ${workOrder.entryPermission ? 'YES - Permission Granted to Enter if Unoccupied' : 'NO - Call First / Resident Must Be Present'}
Master Keypad Code: ${prop?.keypadMasterCode ? prop.keypadMasterCode : 'N/A (Keys via Lockbox)'}
Access Notes: ${workOrder.accessInstructions || 'Standard tenant notice given. Ring buzzer / knock before entry.'}

RESIDENT CONTACT:
-----------------
Reported By: ${workOrder.reportedByName || 'Management Dispatch'}
Resident Phone: ${workOrder.reportedByPhone || '(303) 555-0100'}

ISSUE DESCRIPTION & SCOPE:
--------------------------
Title: ${workOrder.title}
Details: ${workOrder.description || 'No additional details provided.'}
Estimated Budget: $${workOrder.estimatedCost}

ASSIGNED TECHNICIAN / VENDOR:
-----------------------------
Assigned To: ${workOrder.assignedVendorName || 'In-House Maintenance Dispatch'}
Contractor Phone: ${workOrder.assignedVendorPhone || vendor?.phone || '(303) 555-0100'}

------------------------------------------------------
FIELD COMPLETION & MAINTENANCE SIGN-OFF (PAPER COPY)
------------------------------------------------------
Work Performed / Notes:
______________________________________________________
______________________________________________________

Materials & Parts Used:
1. ____________________________  Cost: $_____________
2. ____________________________  Cost: $_____________

Labor Hours: _________ hrs     Total Cost: $__________

Status: [ ] Completed   [ ] Needs Parts   [ ] No Access

Tech Signature: _______________________ Date: ________
Tenant Acknowledgment: ________________ Date: ________
======================================================`;

  const handleCopy = () => {
    navigator.clipboard.writeText(plainTextSlip);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-3xl w-full shadow-2xl border border-zinc-200 overflow-hidden my-4 sm:my-8">
        
        {/* Modal Top Control Bar (Hidden on print) */}
        <div className="bg-zinc-900 text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-amber-500 flex items-center justify-center font-bold text-zinc-950 shrink-0 shadow-xs">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white flex items-center gap-2">
                <span>Print Maintenance Work Order</span>
                <span className="font-mono text-xs px-2 py-0.5 bg-zinc-800 text-amber-400 rounded-sm border border-zinc-700">
                  {workOrder.ticketNumber}
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">Handable printout for contractors & on-site maintenance technicians</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={handleCopy}
              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-md text-xs font-semibold flex items-center gap-1.5 border border-zinc-700 transition"
              title="Copy slip as text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-md text-xs font-semibold flex items-center gap-1.5 border border-zinc-700 transition"
              title="Download standalone HTML slip"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Download</span>
            </button>

            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-md text-xs flex items-center gap-1.5 shadow-xs transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isPrinting ? 'Opening Print...' : 'Print Slip'}</span>
            </button>

            <button 
              onClick={onClose} 
              className="text-zinc-400 hover:text-white p-1 ml-1"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Container */}
        <div className="p-4 sm:p-6 bg-zinc-100 max-h-[80vh] overflow-y-auto">
          <div 
            id="printable-work-order" 
            className="bg-white p-6 sm:p-8 rounded-md shadow-xs border border-zinc-300 text-zinc-900 font-sans text-xs space-y-5"
          >
            {/* Slip Header */}
            <div className="border-b-2 border-zinc-900 pb-4 flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-zinc-900 text-white rounded flex items-center justify-center font-bold text-xs">
                    M
                  </div>
                  <span className="font-extrabold text-sm tracking-tight text-zinc-900">
                    MOYER PROPERTY MANAGEMENT
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-0.5">Coliving & Residential Maintenance Dispatch</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">1000 Speer Blvd, Denver, CO 80204 • Operations: (303) 555-0100</p>
              </div>

              <div className="text-left sm:text-right bg-zinc-50 p-2.5 rounded-sm border border-zinc-200 min-w-[200px]">
                <div className="flex items-center justify-between sm:justify-end gap-2">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Ticket #</span>
                  <span className="font-mono text-sm font-black text-zinc-900">{workOrder.ticketNumber}</span>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-2 mt-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Priority:</span>
                  <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] uppercase font-mono ${
                    workOrder.priority === 'Emergency'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : workOrder.priority === 'High'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-zinc-200 text-zinc-800'
                  }`}>
                    {workOrder.priority}
                  </span>
                </div>
                <div className="text-[10px] text-zinc-500 font-mono mt-1 text-right">
                  Printed: {formattedPrintDate}
                </div>
              </div>
            </div>

            {/* Critical Access & Location Banner */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Location */}
              <div className="bg-zinc-50 p-3.5 rounded-sm border border-zinc-200 space-y-1.5">
                <div className="flex items-center gap-1.5 text-zinc-800 font-bold text-[11px] uppercase tracking-wider border-b border-zinc-200 pb-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Property & Location</span>
                </div>
                <div>
                  <p className="font-bold text-zinc-900 text-sm">{workOrder.propertyName}</p>
                  <p className="text-zinc-600 text-[11px]">
                    {prop?.address || '1000 Speer Blvd'}, {prop?.city || 'Denver'}, {prop?.state || 'CO'} {prop?.zip || '80204'}
                  </p>
                  <div className="mt-2 pt-1 border-t border-zinc-200/80 flex items-center justify-between">
                    <span className="text-zinc-500 font-medium">Specific Area / Unit:</span>
                    <span className="font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {workOrder.roomName || 'Common Area / Shared Facilities'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Access & Permission */}
              <div className="bg-zinc-50 p-3.5 rounded-sm border border-zinc-200 space-y-1.5">
                <div className="flex items-center gap-1.5 text-zinc-800 font-bold text-[11px] uppercase tracking-wider border-b border-zinc-200 pb-1">
                  <Key className="w-3.5 h-3.5 text-amber-600" />
                  <span>Access & Entry Permissions</span>
                </div>
                
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Entry Permission:</span>
                    <span className={`font-bold px-1.5 py-0.5 rounded ${
                      workOrder.entryPermission 
                        ? 'bg-emerald-100 text-emerald-800 font-mono' 
                        : 'bg-rose-100 text-rose-800 font-mono'
                    }`}>
                      {workOrder.entryPermission ? '✓ YES (Permission Granted)' : '⚠️ Call First (Must be Present)'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Master Keypad Code:</span>
                    <span className="font-mono font-bold text-zinc-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      {prop?.keypadMasterCode ? prop.keypadMasterCode : 'Lockbox on Site'}
                    </span>
                  </div>

                  <div className="text-[10px] text-zinc-600 bg-white p-1.5 rounded border border-zinc-200 mt-1">
                    <strong>Access Notes:</strong> {workOrder.accessInstructions || 'Ring buzzer / knock twice before entering. Secure front door upon exit.'}
                  </div>
                </div>
              </div>
            </div>

            {/* Resident & Assigned Technician */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-[11px]">
              <div className="border border-zinc-200 p-3 rounded-sm">
                <p className="font-bold text-zinc-500 uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1">
                  <User className="w-3 h-3" /> Resident Information
                </p>
                <p className="font-bold text-zinc-800">{workOrder.reportedByName || 'Moyer Operations Dispatch'}</p>
                <p className="text-zinc-600 font-mono flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3 text-zinc-400" />
                  {workOrder.reportedByPhone || '(303) 555-0100'}
                </p>
              </div>

              <div className="border border-zinc-200 p-3 rounded-sm">
                <p className="font-bold text-zinc-500 uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1">
                  <Wrench className="w-3 h-3" /> Assigned Contractor / Tech
                </p>
                <p className="font-bold text-zinc-800">{workOrder.assignedVendorName || 'In-House Maintenance Team'}</p>
                <p className="text-zinc-600 font-mono flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3 text-zinc-400" />
                  {workOrder.assignedVendorPhone || vendor?.phone || '(303) 555-0100'}
                </p>
              </div>
            </div>

            {/* Scope of Work & Problem Description */}
            <div className="border-2 border-zinc-300 rounded-sm p-4 bg-zinc-50/50 space-y-2">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs uppercase text-zinc-800">Issue / Scope of Work:</span>
                  <span className="font-bold text-sm text-zinc-950">{workOrder.title}</span>
                </div>
                <span className="bg-zinc-200 text-zinc-800 px-2 py-0.5 rounded font-mono text-[10px] font-bold">
                  {workOrder.category}
                </span>
              </div>

              <div className="text-zinc-800 text-[11px] leading-relaxed pt-1 whitespace-pre-wrap">
                {workOrder.description || 'No detailed issue description provided.'}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-200 text-[11px] text-zinc-600">
                <span>Date Reported: <strong className="text-zinc-800 font-mono">{workOrder.dateReported}</strong></span>
                <span>Estimated Budget Cap: <strong className="text-zinc-900 font-mono">${workOrder.estimatedCost}</strong></span>
              </div>
            </div>

            {/* FIELD COMPLETION & PAPER SIGN-OFF SECTION */}
            <div className="border-t-2 border-dashed border-zinc-400 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold uppercase tracking-wider text-[11px] text-zinc-800">
                  Technician Field Sign-Off & Resolution
                </h3>
                <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-600">
                  <label className="flex items-center gap-1">
                    <span className="w-3 h-3 border border-zinc-400 inline-block"></span> Complete
                  </label>
                  <label className="flex items-center gap-1">
                    <span className="w-3 h-3 border border-zinc-400 inline-block"></span> Awaiting Parts
                  </label>
                  <label className="flex items-center gap-1">
                    <span className="w-3 h-3 border border-zinc-400 inline-block"></span> No Access
                  </label>
                </div>
              </div>

              {/* Notes lines */}
              <div className="space-y-1">
                <p className="text-[10px] text-zinc-500 font-bold uppercase">Diagnosis / Action Taken:</p>
                <div className="h-14 border border-zinc-300 rounded-sm bg-white p-2"></div>
              </div>

              {/* Parts table grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px]">
                <div className="border border-zinc-300 rounded-sm p-2 bg-white space-y-1">
                  <p className="font-bold text-zinc-500 uppercase">Materials / Parts Replaced:</p>
                  <div className="border-b border-zinc-200 h-5"></div>
                  <div className="border-b border-zinc-200 h-5"></div>
                </div>
                <div className="border border-zinc-300 rounded-sm p-2 bg-white space-y-1">
                  <p className="font-bold text-zinc-500 uppercase">Labor & Cost Totals:</p>
                  <div className="flex justify-between border-b border-zinc-200 pb-1">
                    <span>Labor Hours: ____________ hrs</span>
                    <span>Parts Cost: $_________</span>
                  </div>
                  <div className="flex justify-between pt-0.5 font-bold">
                    <span>Total Cost Charged: $________________</span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-6 pt-2 text-[10px]">
                <div className="space-y-1">
                  <p className="text-zinc-500">Technician Signature:</p>
                  <div className="border-b border-zinc-400 h-6"></div>
                  <div className="flex justify-between text-zinc-400 text-[9px]">
                    <span>Print Name</span>
                    <span>Date</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-zinc-500">Resident / Manager Acknowledgment:</p>
                  <div className="border-b border-zinc-400 h-6"></div>
                  <div className="flex justify-between text-zinc-400 text-[9px]">
                    <span>Signature</span>
                    <span>Date</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="text-[9px] text-zinc-400 text-center pt-2 border-t border-zinc-200">
              Please submit completed and signed work order ticket slips to the Moyer Property Operations office or email photo to maintenance@moyerpropertymanagement.com
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="bg-zinc-50 p-4 border-t border-zinc-200 flex flex-col sm:flex-row justify-between items-center gap-3 no-print">
          <span className="text-xs text-zinc-500 text-center sm:text-left">
            Print ready for letter size paper or save as PDF.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="px-3 py-2 rounded-md border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 font-semibold text-xs flex items-center gap-1.5 transition shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-zinc-600" />
              <span>Save Slip</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-zinc-300 text-zinc-700 font-medium hover:bg-zinc-100 text-xs transition"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isPrinting ? 'Opening Print...' : 'Print Slip'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
