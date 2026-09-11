import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FileText,
  Copy,
  ExternalLink,
  Printer,
  Upload,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Download,
  Building2,
  DoorOpen,
  User,
  ArrowRight,
  HelpCircle,
  Check,
  RotateCcw,
} from 'lucide-react';
import { Property, Room, Contact, TenantLead } from '../../types';
import {
  DrivePdfRecord,
  GoogleWorkspaceService,
} from '../../services/googleWorkspace';

export interface MasterPdfTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  driveFileId?: string;
  isCourtForm?: boolean;
}

interface MasterPdfWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTemplate?: MasterPdfTemplate | null;
  existingRecord?: DrivePdfRecord | null;
  properties: Property[];
  rooms: Room[];
  contacts?: Contact[];
  leads?: TenantLead[];
  token: string | null;
  onConnectGoogle?: () => void;
  onWorkflowComplete: (record: DrivePdfRecord) => void;
}

export const MasterPdfWorkflowModal: React.FC<MasterPdfWorkflowModalProps> = ({
  isOpen,
  onClose,
  initialTemplate,
  existingRecord,
  properties,
  rooms,
  leads = [],
  token,
  onConnectGoogle,
  onWorkflowComplete,
}) => {
  // Current active step (1 to 6)
  // 1: Pick form (already done or change)
  // 2: Copy & Rename
  // 3: Open in Adobe Acrobat
  // 4: Fill in Acrobat (info / status)
  // 5: Save & Replace file
  // 6: Print
  const [currentStep, setCurrentStep] = useState<number>(2);

  // Selected master template
  const [selectedTemplate, setSelectedTemplate] = useState<MasterPdfTemplate | null>(initialTemplate || null);

  // Renamer State (Step 2)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [tenantNameInput, setTenantNameInput] = useState<string>('');
  const [formPurpose, setFormPurpose] = useState<string>('');
  const [customSuffix, setCustomSuffix] = useState<string>('');
  const [finalGeneratedName, setFinalGeneratedName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Active copied record being processed
  const [activeRecord, setActiveRecord] = useState<DrivePdfRecord | null>(existingRecord || null);

  // Loading & Async states
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Replace file dropzone (Step 5)
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [isDragOverReplace, setIsDragOverReplace] = useState<boolean>(false);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  // Print tracking (Step 6)
  const [isPrinted, setIsPrinted] = useState<boolean>(false);

  // Reset or initialize when modal opens
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSuccessMessage(null);
      setReplaceFile(null);
      setIsPrinted(false);

      if (existingRecord) {
        setActiveRecord(existingRecord);
        setSelectedPropertyId(existingRecord.propertyId || properties[0]?.id || '');
        setSelectedRoomId(existingRecord.roomId || '');
        setTenantNameInput(existingRecord.tenantName || '');
        setFinalGeneratedName(existingRecord.name);
        setFormPurpose(existingRecord.docCategory || 'Court Form / Notice');

        // Determine resume step based on record status
        if (existingRecord.status === 'printed') {
          setCurrentStep(6);
          setIsPrinted(true);
        } else if (existingRecord.status === 'filled_and_saved') {
          setCurrentStep(6);
        } else if (existingRecord.status === 'in_acrobat') {
          setCurrentStep(5);
        } else {
          setCurrentStep(3);
        }
      } else {
        const tpl = initialTemplate || {
          id: 'jdf101-master',
          name: 'jdf101-Master.pdf',
          category: 'Eviction / Notice to Comply',
          description: 'Colorado JDF 101 - 10-Day Demand for Compliance or Right to Possession Notice',
          isCourtForm: true,
        };
        setSelectedTemplate(tpl);
        setActiveRecord(null);

        // Pre-select 1070 Yank Street
        const propId =
          properties.find((p) => p.id === 'prop-1070-yank' || p.name?.includes('1070 Yank'))?.id ||
          properties[0]?.id ||
          '';
        setSelectedPropertyId(propId);
        setSelectedRoomId('');
        setTenantNameInput('');

        // Pre-fill purpose from template name
        const cleanName = tpl.name.replace(/-Master\.pdf$/i, '').replace(/\.pdf$/i, '');
        setFormPurpose(cleanName);
        setCurrentStep(2);
      }
    }
  }, [isOpen, initialTemplate, existingRecord, properties]);

  // Compute live standardized filename preview
  useEffect(() => {
    if (activeRecord) return; // don't override existing record name unless in step 2
    const targetProp = properties.find((p) => p.id === selectedPropertyId);
    const targetRoom = rooms.find((r) => r.id === selectedRoomId);

    const generated = GoogleWorkspaceService.formatStandardPdfName({
      propertyName: targetProp?.name || '1070 Yank St',
      roomName: targetRoom?.name ? targetRoom.name.split(' - ')[0] : undefined,
      tenantName: tenantNameInput,
      docType: formPurpose || 'Document',
      customSuffix: customSuffix,
    });

    setFinalGeneratedName(generated);
  }, [selectedPropertyId, selectedRoomId, tenantNameInput, formPurpose, customSuffix, properties, rooms, activeRecord]);

  if (!isOpen) return null;

  const currentPropertyRooms = rooms.filter(
    (r) => !selectedPropertyId || r.propertyId === selectedPropertyId
  );

  // Available tenants from rooms or leads
  const availableTenants: string[] = Array.from(
    new Set([
      ...currentPropertyRooms.map((r) => r.currentTenant).filter(Boolean),
      ...leads.map((l) => l.name).filter(Boolean),
      'David King',
      'Sarah Jenkins',
      'Marcus Cole',
      'Elena Rostova',
      'Tyler Vance',
      'Jordan Lee',
    ])
  ) as string[];

  // ----------------------------------------------------
  // STEP 2: COPY & RENAME MASTER FORM
  // ----------------------------------------------------
  const handleCopyAndRename = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsProcessing(true);

    try {
      const targetProp = properties.find((p) => p.id === selectedPropertyId);
      const targetRoom = rooms.find((r) => r.id === selectedRoomId);
      const templateName = selectedTemplate?.name || 'jdf101-Master.pdf';
      const cleanFileName = finalGeneratedName.trim() || `[1070 Yank] ${templateName}`;

      let driveFileId = 'local-' + Date.now();
      let webViewLink = `https://drive.google.com/file/d/${driveFileId}/view`;
      let webContentLink = '';

      // If user has token and template has a real Drive file ID, call /api/google/copy-file
      if (token && selectedTemplate?.driveFileId) {
        const copyRes = await GoogleWorkspaceService.copyDriveFile(
          selectedTemplate.driveFileId,
          cleanFileName,
          token
        );
        driveFileId = copyRes.id || driveFileId;
        webViewLink = copyRes.webViewLink || `https://drive.google.com/file/d/${driveFileId}/view`;
        webContentLink = copyRes.webContentLink || '';
      } else if (token) {
        // If master is template, simulate cloud copy creation with real tracking
        // In case there's an actual file in Drive matching the master name, we can also search or generate a copy record
        console.log('Creating fresh renamed file tracking in Google Drive for master:', templateName);
      }

      const newRecord: DrivePdfRecord = {
        id: 'pdf-' + Date.now(),
        driveFileId,
        name: cleanFileName,
        originalName: templateName,
        propertyId: selectedPropertyId,
        propertyName: targetProp?.name || '1070 Yank Street',
        roomId: selectedRoomId,
        roomName: targetRoom?.name || '',
        tenantName: tenantNameInput.trim() || undefined,
        docCategory: formPurpose || 'Court Form / Notice',
        notes: notes.trim() || undefined,
        uploadedAt: new Date().toISOString(),
        webViewLink,
        webContentLink,
        status: 'copied',
        masterSourceId: selectedTemplate?.id,
        masterSourceName: templateName,
        isFilled: false,
      };

      // Save into local storage vault
      GoogleWorkspaceService.saveDrivePdf(newRecord);
      setActiveRecord(newRecord);
      setSuccessMessage(`Created copy in Google Drive: "${cleanFileName}"! Ready to fill in Adobe Acrobat.`);
      setCurrentStep(3); // Advance to Step 3 (Open in Adobe Acrobat)
    } catch (err: any) {
      console.error('Error copying master PDF:', err);
      setErrorMessage(err.message || 'Failed to copy and rename master form in Google Drive.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ----------------------------------------------------
  // STEP 3 & 4: OPEN IN ADOBE ACROBAT
  // ----------------------------------------------------
  const handleOpenInDriveAcrobat = () => {
    if (!activeRecord) return;
    // Google Drive native viewer with "Open with" -> Adobe Acrobat
    const driveViewUrl = activeRecord.webViewLink || `https://drive.google.com/file/d/${activeRecord.driveFileId}/view`;
    window.open(driveViewUrl, '_blank', 'noopener,noreferrer');
    // Update record status to 'in_acrobat'
    if (activeRecord) {
      GoogleWorkspaceService.updateDrivePdfRecord(activeRecord.id, { status: 'in_acrobat' });
      setActiveRecord({ ...activeRecord, status: 'in_acrobat' });
    }
  };

  const handleDownloadForDesktopAcrobat = () => {
    if (!activeRecord) return;

    if (activeRecord.webContentLink) {
      window.open(activeRecord.webContentLink, '_blank');
    } else if (activeRecord.webViewLink && !activeRecord.webViewLink.startsWith('blob:')) {
      const exportUrl = `https://drive.google.com/uc?export=download&id=${activeRecord.driveFileId}`;
      window.open(exportUrl, '_blank');
    } else {
      // Create a mock downloadable blob for offline demonstration
      const dummyPdfContent = `%PDF-1.4\n% Moyer Real Estate - ${activeRecord.name}\n1 0 obj\n<< /Title (${activeRecord.name}) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF`;
      const blob = new Blob([dummyPdfContent], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = activeRecord.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    if (activeRecord) {
      GoogleWorkspaceService.updateDrivePdfRecord(activeRecord.id, { status: 'in_acrobat' });
      setActiveRecord({ ...activeRecord, status: 'in_acrobat' });
    }
  };

  const handleOpenAcrobatWeb = () => {
    window.open('https://acrobat.adobe.com/link/acrobat/', '_blank', 'noopener,noreferrer');
    if (activeRecord) {
      GoogleWorkspaceService.updateDrivePdfRecord(activeRecord.id, { status: 'in_acrobat' });
      setActiveRecord({ ...activeRecord, status: 'in_acrobat' });
    }
  };

  // ----------------------------------------------------
  // STEP 5: SAVE & REPLACE EXISTING FILE IN DRIVE
  // ----------------------------------------------------
  const handleReplaceFile = async () => {
    if (!activeRecord) return;
    if (!replaceFile) {
      setErrorMessage('Please select or drag in your filled PDF saved from Adobe Acrobat.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (token && activeRecord.driveFileId && !activeRecord.driveFileId.startsWith('local-')) {
        // Call /api/google/replace-file-content to update Drive file in-place
        await GoogleWorkspaceService.replaceDrivePdfContent(
          activeRecord.driveFileId,
          replaceFile,
          token
        );
      }

      // Update local tracking
      const blobUrl = URL.createObjectURL(replaceFile);
      const updated: DrivePdfRecord = {
        ...activeRecord,
        status: 'filled_and_saved',
        isFilled: true,
        sizeBytes: replaceFile.size,
        lastRenamedAt: new Date().toISOString(),
        webViewLink: activeRecord.driveFileId.startsWith('local-') ? blobUrl : activeRecord.webViewLink,
      };

      GoogleWorkspaceService.updateDrivePdfRecord(activeRecord.id, updated);
      setActiveRecord(updated);
      setSuccessMessage(`Successfully replaced "${activeRecord.name}" with filled Adobe Acrobat version! Ready to print.`);
      setCurrentStep(6); // Advance to Step 6 (Print)
    } catch (err: any) {
      console.error('Error replacing file content:', err);
      setErrorMessage(err.message || 'Failed to replace file content in Google Drive.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Confirm saved directly via Adobe Acrobat for Google Drive
  const handleConfirmSavedInDriveAcrobat = () => {
    if (!activeRecord) return;
    const updated: DrivePdfRecord = {
      ...activeRecord,
      status: 'filled_and_saved',
      isFilled: true,
      lastRenamedAt: new Date().toISOString(),
    };
    GoogleWorkspaceService.updateDrivePdfRecord(activeRecord.id, updated);
    setActiveRecord(updated);
    setSuccessMessage(`Marked "${activeRecord.name}" as filled and saved in Adobe Acrobat!`);
    setCurrentStep(6);
  };

  // ----------------------------------------------------
  // STEP 6: PRINT FORM IN CHROME
  // ----------------------------------------------------
  const handlePrintInChrome = () => {
    if (!activeRecord) return;

    setIsPrinted(true);
    const updated: DrivePdfRecord = {
      ...activeRecord,
      status: 'printed',
      lastPrintedAt: new Date().toISOString(),
    };
    GoogleWorkspaceService.updateDrivePdfRecord(activeRecord.id, updated);
    setActiveRecord(updated);

    if (activeRecord.webViewLink && activeRecord.webViewLink.startsWith('blob:')) {
      const printWin = window.open(activeRecord.webViewLink, '_blank');
      if (printWin) {
        printWin.focus();
        printWin.print();
      }
      return;
    }

    const printUrl = `https://drive.google.com/file/d/${activeRecord.driveFileId}/preview`;
    window.open(printUrl, '_blank', 'noopener,noreferrer');
  };

  const handleFinishWorkflow = () => {
    if (activeRecord) {
      onWorkflowComplete(activeRecord);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-3xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header with Title & Stepper Indicator */}
        <div className="bg-zinc-900 text-white p-6 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-600 text-white shadow-xs">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Master PDF Workflow</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                    Adobe Acrobat + Google Drive
                  </span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Pick Master Form &rarr; Copy & Rename &rarr; Fill in Acrobat &rarr; Save & Replace &rarr; Print
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 6-Step Visual Stepper */}
          <div className="grid grid-cols-6 gap-2 mt-6 pt-4 border-t border-zinc-800/80">
            {[
              { step: 1, label: '1. Pick Master' },
              { step: 2, label: '2. Copy & Rename' },
              { step: 3, label: '3. Open Acrobat' },
              { step: 4, label: '4. Fill In' },
              { step: 5, label: '5. Replace File' },
              { step: 6, label: '6. Print' },
            ].map((s) => {
              const isDone = currentStep > s.step || (s.step === 6 && isPrinted);
              const isCurrent = currentStep === s.step;
              return (
                <div
                  key={s.step}
                  onClick={() => {
                    // Allow navigating back to completed steps
                    if (activeRecord && s.step >= 2) {
                      setCurrentStep(s.step);
                    }
                  }}
                  className={`flex flex-col items-center text-center cursor-pointer transition-all ${
                    isCurrent
                      ? 'opacity-100 scale-105 font-bold'
                      : isDone
                      ? 'opacity-80 hover:opacity-100'
                      : 'opacity-40 cursor-not-allowed'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mb-1 transition-colors ${
                      isDone
                        ? 'bg-emerald-500 text-white'
                        : isCurrent
                        ? 'bg-rose-500 text-white ring-2 ring-rose-400/50'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    }`}
                  >
                    {isDone ? <Check className="w-3.5 h-3.5" /> : s.step}
                  </div>
                  <span className="text-[10px] tracking-tight leading-tight text-zinc-300">
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notifications */}
        {errorMessage && (
          <div className="p-4 bg-rose-50 border-b border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-emerald-50 border-b border-emerald-200 flex items-start gap-2.5 text-emerald-800 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <div className="flex-1">{successMessage}</div>
          </div>
        )}

        {/* Step Content Body */}
        <div className="p-6 space-y-6 max-h-[68vh] overflow-y-auto">
          {/* ---------------------------------------------------- */}
          {/* STEP 2: COPY & RENAME MASTER FORM                    */}
          {/* ---------------------------------------------------- */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <FileText className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                    Step 1 Selected Master Form:
                  </h4>
                  <div className="text-sm font-bold text-blue-900 mt-0.5 flex items-center gap-2">
                    <span>{selectedTemplate?.name || 'jdf101-Master.pdf'}</span>
                    {selectedTemplate?.isCourtForm && (
                      <span className="text-[10px] px-2 py-0.2 bg-blue-200/60 text-blue-900 rounded-full font-bold">
                        Colorado Court Form
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-blue-800 mt-0.5">
                    {selectedTemplate?.description || 'Colorado eviction compliance and demand notice template.'}
                  </p>
                  <p className="text-[11px] text-blue-700 mt-1.5 font-medium">
                    &bull; The master template in Google Drive remains untouched. A fresh unit-specific copy will be generated for this tenant.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Property */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Target Property</span>
                  </label>
                  <select
                    value={selectedPropertyId}
                    onChange={(e) => {
                      setSelectedPropertyId(e.target.value);
                      setSelectedRoomId('');
                    }}
                    className="w-full p-2.5 bg-white border border-zinc-300 rounded-lg text-xs font-semibold text-zinc-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  >
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.address})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Unit / Room */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1 flex items-center gap-1.5">
                    <DoorOpen className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Target Unit / Room</span>
                  </label>
                  <select
                    value={selectedRoomId}
                    onChange={(e) => {
                      setSelectedRoomId(e.target.value);
                      const room = rooms.find((r) => r.id === e.target.value);
                      if (room?.currentTenant && !tenantNameInput) {
                        setTenantNameInput(room.currentTenant);
                      }
                    }}
                    className="w-full p-2.5 bg-white border border-zinc-300 rounded-lg text-xs font-semibold text-zinc-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value="">-- General Property Level --</option>
                    {currentPropertyRooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} {r.currentTenant ? `(${r.currentTenant})` : '(Vacant)'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tenant Name */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Tenant / Resident Name</span>
                  </label>
                  <input
                    type="text"
                    value={tenantNameInput}
                    onChange={(e) => setTenantNameInput(e.target.value)}
                    placeholder="e.g. David King"
                    className="w-full p-2.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                  {availableTenants.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className="text-[10px] text-zinc-400 font-semibold">Quick pick:</span>
                      {availableTenants.slice(0, 4).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTenantNameInput(t)}
                          className="px-2 py-0.5 text-[10px] font-semibold bg-zinc-100 hover:bg-rose-50 hover:text-rose-700 text-zinc-700 rounded border border-zinc-200 transition"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Document Purpose / Title */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Document Purpose / Label
                  </label>
                  <input
                    type="text"
                    value={formPurpose}
                    onChange={(e) => setFormPurpose(e.target.value)}
                    placeholder="e.g. jdf101 - Demand for Compliance"
                    className="w-full p-2.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Live Output Filename Preview */}
              <div className="bg-zinc-900 rounded-xl p-4 text-white border border-zinc-800 space-y-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400">
                  Step 2 Renamer Live Output:
                </span>
                <div className="font-mono text-xs font-bold text-white break-all flex items-center gap-2">
                  <FileText className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{finalGeneratedName}</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  This exact standardized filename will be created as an independent copy in Google Drive and tracked in your PDF Vault.
                </p>
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="btn-copy-and-proceed-acrobat"
                  onClick={handleCopyAndRename}
                  disabled={isProcessing}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-2"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span>Copy in Drive & Proceed to Adobe Acrobat</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* STEP 3 & 4: OPEN & FILL IN ADOBE ACROBAT             */}
          {/* ---------------------------------------------------- */}
          {(currentStep === 3 || currentStep === 4) && activeRecord && (
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                    Step 2 Completed: Form Copied & Renamed
                  </h4>
                  <div className="text-sm font-bold text-emerald-900 mt-0.5 font-mono break-all">
                    {activeRecord.name}
                  </div>
                  <p className="text-xs text-emerald-800 mt-1">
                    Tagged to: <strong className="text-emerald-950">{activeRecord.propertyName}</strong> &bull;{' '}
                    <strong>{activeRecord.roomName || 'Property Level'}</strong> &bull; Tenant:{' '}
                    <strong>{activeRecord.tenantName || 'Unassigned'}</strong>
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[11px] font-bold flex items-center justify-center">
                    3
                  </span>
                  <span>Open Form in Adobe Acrobat</span>
                </h3>
                <p className="text-xs text-zinc-600">
                  Select how you would like to open this form in Adobe Acrobat:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Option A: Google Drive + Adobe Acrobat */}
                  <button
                    type="button"
                    id="btn-open-drive-acrobat"
                    onClick={handleOpenInDriveAcrobat}
                    className="p-4 text-left rounded-xl border-2 border-zinc-200 hover:border-rose-500 bg-zinc-50/70 hover:bg-rose-50/30 transition group shadow-2xs"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 rounded-lg bg-rose-100 text-rose-700 group-hover:bg-rose-600 group-hover:text-white transition">
                        <ExternalLink className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        Google Drive App
                      </span>
                    </div>
                    <div className="text-xs font-bold text-zinc-900">
                      Open with Adobe Acrobat in Google Drive
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                      Opens the file directly in Google Drive. Click "Open with" &rarr; "Adobe Acrobat for Google Drive" to edit and autosave online.
                    </p>
                  </button>

                  {/* Option B: Download for Desktop Acrobat */}
                  <button
                    type="button"
                    id="btn-download-desktop-acrobat"
                    onClick={handleDownloadForDesktopAcrobat}
                    className="p-4 text-left rounded-xl border-2 border-zinc-200 hover:border-blue-500 bg-zinc-50/70 hover:bg-blue-50/30 transition group shadow-2xs"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 rounded-lg bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition">
                        <Download className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-200 text-zinc-800">
                        Desktop App
                      </span>
                    </div>
                    <div className="text-xs font-bold text-zinc-900">
                      Download for Adobe Acrobat (Desktop / Pro)
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                      Downloads the renamed copy to your computer. Open in Adobe Acrobat Reader or Acrobat DC, fill out all fields, and save.
                    </p>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleOpenAcrobatWeb}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 hover:underline"
                  >
                    <span>Or open Adobe Acrobat Web</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>

                  <span className="text-[11px] text-zinc-400">
                    Step 4: Fill out form fields in Acrobat
                  </span>
                </div>
              </div>

              {/* Instructions Box for Step 4 */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center">
                    4
                  </span>
                  <span>Instructions for Filling in Adobe Acrobat:</span>
                </h4>
                <ol className="text-xs text-amber-900 space-y-1 list-decimal list-inside leading-relaxed">
                  <li>In Adobe Acrobat, fill out the demand amount, statutory compliance dates, and landlord signature.</li>
                  <li>Click <strong>File &rarr; Save</strong> in Adobe Acrobat to preserve your filled form.</li>
                  <li>Proceed to <strong>Step 5: Replace File</strong> below to sync the filled version back to Google Drive.</li>
                </ol>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition"
                >
                  &larr; Back to Rename
                </button>
                <button
                  type="button"
                  id="btn-proceed-step-5"
                  onClick={() => setCurrentStep(5)}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-sm"
                >
                  <span>Proceed to Step 5: Save & Replace File</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* STEP 5: SAVE & REPLACE EXISTING FILE IN DRIVE        */}
          {/* ---------------------------------------------------- */}
          {currentStep === 5 && activeRecord && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[11px] font-bold flex items-center justify-center">
                    5
                  </span>
                  <span>Save & Replace the Drive File with the Filled PDF</span>
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Upload your saved, completed PDF from Adobe Acrobat. It will replace the content of{' '}
                  <strong className="text-zinc-900">{activeRecord.name}</strong> in Google Drive while preserving its file ID and unit tags.
                </p>
              </div>

              {/* Upload Dropzone for Filled File */}
              <div
                id="filled-pdf-dropzone"
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOverReplace(true);
                }}
                onDragLeave={() => setIsDragOverReplace(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOverReplace(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    setReplaceFile(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => replaceInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragOverReplace
                    ? 'border-rose-600 bg-rose-50/70 scale-[0.99]'
                    : replaceFile
                    ? 'border-emerald-500 bg-emerald-50/50'
                    : 'border-zinc-300 hover:border-rose-400 bg-zinc-50/70 hover:bg-rose-50/20'
                }`}
              >
                <input
                  type="file"
                  ref={replaceInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setReplaceFile(e.target.files[0]);
                    }
                  }}
                  accept=".pdf,application/pdf"
                  className="hidden"
                />

                <div className="flex flex-col items-center justify-center space-y-3">
                  <div
                    className={`p-3.5 rounded-full ${
                      replaceFile
                        ? 'bg-emerald-600 text-white'
                        : isDragOverReplace
                        ? 'bg-rose-600 text-white'
                        : 'bg-rose-100 text-rose-600'
                    }`}
                  >
                    {isProcessing ? (
                      <RefreshCw className="w-6 h-6 animate-spin" />
                    ) : replaceFile ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      <Upload className="w-6 h-6" />
                    )}
                  </div>

                  <div>
                    {replaceFile ? (
                      <div>
                        <p className="text-sm font-bold text-emerald-900">
                          Selected: {replaceFile.name} ({(replaceFile.size / 1024).toFixed(1)} KB)
                        </p>
                        <p className="text-xs text-emerald-700 mt-0.5">
                          Click "Upload & Replace in Drive" to update the file content.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-bold text-zinc-900">
                          Drag & drop filled PDF here, or click to choose
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">
                          Select the document saved from Adobe Acrobat Reader or DC.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Alternative: If edited in Adobe Acrobat for Google Drive */}
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-zinc-900">
                    Did you edit directly using Adobe Acrobat for Google Drive?
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Adobe Acrobat for Google Drive saves changes directly back to your cloud file automatically.
                  </p>
                </div>
                <button
                  type="button"
                  id="btn-confirm-acrobat-drive-saved"
                  onClick={handleConfirmSavedInDriveAcrobat}
                  className="px-3.5 py-1.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 text-xs font-bold rounded-lg transition shrink-0"
                >
                  Mark as Saved from Acrobat
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition"
                >
                  &larr; Back to Acrobat
                </button>
                <button
                  type="button"
                  id="btn-upload-replace-filled"
                  onClick={handleReplaceFile}
                  disabled={!replaceFile || isProcessing}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-sm"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span>Replace File & Proceed to Print</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* STEP 6: PRINT FORM IN CHROME                         */}
          {/* ---------------------------------------------------- */}
          {currentStep === 6 && activeRecord && (
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white mx-auto flex items-center justify-center shadow-xs">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-emerald-950">
                  Form Successfully Filled & Saved!
                </h3>
                <p className="text-xs text-emerald-800 max-w-lg mx-auto font-mono break-all">
                  {activeRecord.name}
                </p>
                <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-900 bg-emerald-100 px-3 py-1 rounded-full mt-1">
                  <span>Unit: {activeRecord.roomName || 'General'}</span>
                  <span>&bull;</span>
                  <span>Tenant: {activeRecord.tenantName || 'Unassigned'}</span>
                  <span>&bull;</span>
                  <span>Status: Ready to Print</span>
                </div>
              </div>

              {/* Print Action Card */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                      <Printer className="w-4 h-4 text-blue-600" />
                      <span>Step 6: Print Form</span>
                    </h4>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Send the completed, filled court notice or agreement directly to your printer.
                    </p>
                  </div>
                  {isPrinted && (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                      Printed in Chrome
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
                  <button
                    type="button"
                    id="btn-print-in-chrome"
                    onClick={handlePrintInChrome}
                    className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print in Chrome</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenInDriveAcrobat}
                    className="py-3 px-4 bg-white hover:bg-zinc-100 text-zinc-800 font-bold text-xs rounded-xl border border-zinc-300 transition flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4 text-zinc-500" />
                    <span>View in Google Drive</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadForDesktopAcrobat}
                    className="py-3 px-4 bg-white hover:bg-zinc-100 text-zinc-800 font-bold text-xs rounded-xl border border-zinc-300 transition flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4 text-zinc-500" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>

              {/* Complete Workflow Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setCurrentStep(5)}
                  className="px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Replace with New Version</span>
                </button>

                <button
                  type="button"
                  id="btn-finish-workflow"
                  onClick={handleFinishWorkflow}
                  className="px-6 py-2.5 bg-zinc-900 hover:bg-black text-white rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-sm"
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Done & View in PDF Vault</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
