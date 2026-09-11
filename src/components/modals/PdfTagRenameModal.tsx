import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Building2,
  DoorOpen,
  User,
  Tag,
  Check,
  ExternalLink,
  Printer,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  HardDrive,
  Edit2,
} from 'lucide-react';
import { Property, Room, Contact, TenantLead } from '../../types';
import {
  DrivePdfRecord,
  GoogleWorkspaceService,
} from '../../services/googleWorkspace';

interface PdfTagRenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfRecord: DrivePdfRecord | null;
  properties: Property[];
  rooms: Room[];
  contacts?: Contact[];
  leads?: TenantLead[];
  token: string | null;
  onSuccess: (updatedRecord: DrivePdfRecord) => void;
  onConnectGoogle?: () => void;
}

const DOC_TYPES = [
  { label: 'Signed Lease Agreement', value: 'Signed Lease Agreement' },
  { label: 'Move-In / Out Condition Inspection', value: 'Move-In Inspection Report' },
  { label: 'Tenant ID & Verification Scan', value: 'Tenant ID Verification' },
  { label: 'Payment Proof / Rent Receipt', value: 'Rent Payment Receipt' },
  { label: 'House Rules & Addendum', value: 'House Rules Addendum' },
  { label: 'Pet Agreement & Deposit', value: 'Pet Agreement' },
  { label: 'Notice to Vacate / Eviction Demand', value: 'Notice to Vacate' },
  { label: 'Utility Reconciliation Statement', value: 'Utility Split Statement' },
  { label: 'General / Custom Document', value: 'Property Document' },
];

export const PdfTagRenameModal: React.FC<PdfTagRenameModalProps> = ({
  isOpen,
  onClose,
  pdfRecord,
  properties,
  rooms,
  leads = [],
  token,
  onSuccess,
  onConnectGoogle,
}) => {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [tenantNameInput, setTenantNameInput] = useState<string>('');
  const [docType, setDocType] = useState<string>('Signed Lease Agreement');
  const [customSuffix, setCustomSuffix] = useState<string>('');
  const [customFilenameOverride, setCustomFilenameOverride] = useState<string>('');
  const [isManualFilenameMode, setIsManualFilenameMode] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [isRenaming, setIsRenaming] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Initialize from existing record or defaults
  useEffect(() => {
    if (isOpen && pdfRecord) {
      setErrorMsg(null);
      setSuccessMsg(null);
      setIsManualFilenameMode(false);

      // Property
      const propId = pdfRecord.propertyId || properties.find(p => p.id === 'prop-1070-yank' || p.name?.includes('1070 Yank'))?.id || properties[0]?.id || '';
      setSelectedPropertyId(propId);

      // Room
      setSelectedRoomId(pdfRecord.roomId || '');

      // Tenant
      setTenantNameInput(pdfRecord.tenantName || '');

      // Doc Type
      setDocType(pdfRecord.docCategory || 'Signed Lease Agreement');

      // Notes
      setNotes(pdfRecord.notes || '');

      setCustomSuffix('');
      setCustomFilenameOverride(pdfRecord.name || '');
    }
  }, [isOpen, pdfRecord, properties]);

  if (!isOpen || !pdfRecord) return null;

  // Filtered rooms for selected property
  const propertyRooms = rooms.filter(r => r.propertyId === selectedPropertyId);
  const currentProperty = properties.find(p => p.id === selectedPropertyId);
  const currentRoom = rooms.find(r => r.id === selectedRoomId);

  // Suggested tenants from current room occupant + leads
  const suggestedTenants = new Set<string>();
  if (currentRoom?.tenant?.name) {
    suggestedTenants.add(currentRoom.tenant.name);
  }
  leads.forEach(l => {
    if (l.name) suggestedTenants.add(l.name);
  });
  // Also collect tenants from all rooms of this property
  propertyRooms.forEach(r => {
    if (r.tenant?.name) suggestedTenants.add(r.tenant.name);
  });

  // Calculate formatted standard filename
  const autoFormattedName = GoogleWorkspaceService.formatStandardPdfName({
    propertyName: currentProperty?.name,
    roomName: currentRoom?.name,
    tenantName: tenantNameInput,
    docType,
    customSuffix,
  });

  const activeFilename = isManualFilenameMode
    ? customFilenameOverride.trim() || autoFormattedName
    : autoFormattedName;

  // Handle Save and Rename in Google Drive
  const handleSaveAndRename = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const finalName = activeFilename.toLowerCase().endsWith('.pdf')
      ? activeFilename
      : `${activeFilename}.pdf`;

    if (!token) {
      // If offline or no Google token, update local record only
      const updated: DrivePdfRecord = {
        ...pdfRecord,
        name: finalName,
        propertyId: selectedPropertyId,
        propertyName: currentProperty?.name,
        roomId: selectedRoomId,
        roomName: currentRoom?.name,
        tenantName: tenantNameInput.trim(),
        docCategory: docType,
        notes: notes.trim(),
        lastRenamedAt: new Date().toISOString(),
        status: 'renamed',
      };
      GoogleWorkspaceService.updateDrivePdfRecord(pdfRecord.id, updated);
      onSuccess(updated);
      setSuccessMsg('Information saved locally! Connect Google Drive to rename in the cloud.');
      setTimeout(() => onClose(), 1200);
      return;
    }

    setIsRenaming(true);
    try {
      // 1. Rename file in Google Drive via API
      let driveResponse: any = null;
      if (pdfRecord.driveFileId) {
        driveResponse = await GoogleWorkspaceService.renameDriveFile(
          pdfRecord.driveFileId,
          finalName,
          token
        );
      }

      // 2. Update local tracking record
      const updated: DrivePdfRecord = {
        ...pdfRecord,
        name: finalName,
        propertyId: selectedPropertyId,
        propertyName: currentProperty?.name,
        roomId: selectedRoomId,
        roomName: currentRoom?.name,
        tenantName: tenantNameInput.trim(),
        docCategory: docType,
        notes: notes.trim(),
        webViewLink: driveResponse?.webViewLink || pdfRecord.webViewLink,
        lastRenamedAt: new Date().toISOString(),
        status: 'renamed',
      };

      GoogleWorkspaceService.updateDrivePdfRecord(pdfRecord.id, updated);
      setSuccessMsg(`File successfully renamed in Google Drive to: "${finalName}"`);
      onSuccess(updated);
      setTimeout(() => onClose(), 1400);
    } catch (err: any) {
      console.error('Error renaming file in Drive:', err);
      setErrorMsg(err.message || 'Failed to rename file in Google Drive.');
    } finally {
      setIsRenaming(false);
    }
  };

  // Open in Chrome / Drive viewer
  const handleOpenInChrome = () => {
    const url = pdfRecord.webViewLink || `https://drive.google.com/file/d/${pdfRecord.driveFileId}/view`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Print PDF directly
  const handlePrint = () => {
    const printUrl = `https://drive.google.com/file/d/${pdfRecord.driveFileId}/preview`;
    window.open(printUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      id="pdf-tag-rename-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
    >
      <div
        id="pdf-tag-rename-modal-card"
        className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-zinc-200 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-100 text-rose-700 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">
                Tag & Rename PDF in Google Drive
              </h3>
              <p className="text-xs text-zinc-500">
                Assign unit and tenant info to rename the file in your Google Drive.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveAndRename} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Status feedback */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Current File Banner with Quick Actions */}
          <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-between gap-3 text-xs">
            <div className="overflow-hidden">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                Current Drive File
              </span>
              <p className="font-semibold text-zinc-800 truncate" title={pdfRecord.name}>
                {pdfRecord.name}
              </p>
              <span className="text-[10px] text-zinc-400">
                Uploaded: {new Date(pdfRecord.uploadedAt).toLocaleDateString()}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                id="btn-open-pdf-chrome"
                onClick={handleOpenInChrome}
                className="px-2.5 py-1.5 bg-white hover:bg-zinc-100 text-blue-700 border border-zinc-300 rounded-md font-semibold text-xs flex items-center gap-1 transition shadow-2xs"
                title="Open in Chrome / Google Drive viewer"
              >
                <span>Open in Chrome</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                id="btn-print-pdf-direct"
                onClick={handlePrint}
                className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-900 text-white rounded-md font-semibold text-xs flex items-center gap-1 transition shadow-2xs"
                title="Print PDF in Chrome"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
            </div>
          </div>

          {/* Property & Room / Unit Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                Property
              </label>
              <select
                id="select-pdf-property"
                value={selectedPropertyId}
                onChange={(e) => {
                  setSelectedPropertyId(e.target.value);
                  setSelectedRoomId('');
                }}
                className="w-full p-2.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1 flex items-center gap-1">
                <DoorOpen className="w-3.5 h-3.5 text-zinc-500" />
                Unit / Designated Room
              </label>
              <select
                id="select-pdf-room"
                value={selectedRoomId}
                onChange={(e) => {
                  const rId = e.target.value;
                  setSelectedRoomId(rId);
                  const roomObj = rooms.find(r => r.id === rId);
                  if (roomObj?.tenant?.name && !tenantNameInput) {
                    setTenantNameInput(roomObj.tenant.name);
                  }
                }}
                className="w-full p-2.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">-- Whole Property / Common Area --</option>
                {propertyRooms.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} {r.tenant?.name ? `(${r.tenant.name})` : '(Vacant)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tenant Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-zinc-500" />
                Resident / Tenant Name
              </span>
              {currentRoom?.tenant?.name && (
                <button
                  type="button"
                  onClick={() => setTenantNameInput(currentRoom.tenant.name)}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold"
                >
                  Use Room Resident: {currentRoom.tenant.name}
                </button>
              )}
            </label>
            <input
              type="text"
              id="input-pdf-tenant-name"
              value={tenantNameInput}
              onChange={(e) => setTenantNameInput(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full p-2.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />

            {/* Quick Suggestion Chips */}
            {Array.from(suggestedTenants).length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap mt-2">
                <span className="text-[10px] text-zinc-400 font-medium">Suggestions:</span>
                {Array.from(suggestedTenants).slice(0, 4).map(name => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setTenantNameInput(name)}
                    className="px-2 py-0.5 bg-zinc-100 hover:bg-blue-50 hover:text-blue-700 text-zinc-700 text-[10px] font-semibold rounded transition"
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Document Type & Purpose */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-zinc-500" />
                Document Purpose / Label
              </label>
              <select
                id="select-pdf-doc-type"
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full p-2.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {DOC_TYPES.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                Optional Detail / Period
              </label>
              <input
                type="text"
                value={customSuffix}
                onChange={(e) => setCustomSuffix(e.target.value)}
                placeholder="e.g. 2026-2027 or Signed"
                className="w-full p-2.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Standardized Filename Preview & Override */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-blue-700" />
                Renamed Google Drive Filename
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsManualFilenameMode(!isManualFilenameMode);
                  if (!isManualFilenameMode) {
                    setCustomFilenameOverride(autoFormattedName);
                  }
                }}
                className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 underline"
              >
                <Edit2 className="w-3 h-3" />
                {isManualFilenameMode ? 'Reset to Auto Standard' : 'Manual Tweak'}
              </button>
            </div>

            {isManualFilenameMode ? (
              <input
                type="text"
                id="input-manual-filename"
                value={customFilenameOverride}
                onChange={(e) => setCustomFilenameOverride(e.target.value)}
                className="w-full p-2 bg-white border border-blue-300 rounded font-mono text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            ) : (
              <p className="font-mono text-xs font-bold text-blue-950 bg-white p-2.5 rounded border border-blue-200 break-all shadow-2xs">
                {autoFormattedName}
              </p>
            )}

            <p className="text-[10px] text-blue-700">
              This will directly rename the file in your Google Drive cloud storage.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-zinc-200 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-semibold transition-colors"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                title="Print this PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
              <button
                type="submit"
                id="btn-save-rename-drive"
                disabled={isRenaming}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {isRenaming ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving to Drive...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save & Rename in Drive</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
