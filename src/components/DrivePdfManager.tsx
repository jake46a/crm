import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Upload,
  HardDrive,
  Printer,
  ExternalLink,
  Edit3,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  DoorOpen,
  Building2,
  User,
  Tag,
  Clock,
  Download,
  Copy,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react';
import { Property, Room, Contact, TenantLead } from '../types';
import {
  DrivePdfRecord,
  GoogleWorkspaceService,
} from '../services/googleWorkspace';
import { PdfTagRenameModal } from './modals/PdfTagRenameModal';
import {
  MasterPdfWorkflowModal,
  MasterPdfTemplate,
} from './modals/MasterPdfWorkflowModal';
import { EditMasterTemplateModal } from './modals/EditMasterTemplateModal';

interface DrivePdfManagerProps {
  properties: Property[];
  rooms: Room[];
  contacts?: Contact[];
  leads?: TenantLead[];
  token: string | null;
  onConnectGoogle: () => void;
  userEmail?: string;
}

// Built-in Standard Master Forms in Drive for 1070 Yank St and Colorado Property Management
const STANDARD_MASTER_TEMPLATES: MasterPdfTemplate[] = [
  {
    id: 'tpl-jdf101',
    name: 'jdf101-Master.pdf',
    category: 'Colorado Eviction / Demand Notice',
    description: 'JDF 101 - 10-Day Demand for Compliance or Right to Possession Notice (Colorado Judicial Department statutory notice).',
    isCourtForm: true,
  },
  {
    id: 'tpl-jdf102',
    name: 'jdf102-Master.pdf',
    category: 'Colorado Lease Termination',
    description: 'JDF 102 - Notice to Terminate Tenancy (Colorado Judicial Department notice to quit / non-renewal).',
    isCourtForm: true,
  },
  {
    id: 'tpl-jdf99',
    name: 'jdf99-Master.pdf',
    category: 'Colorado Court Complaint & Incident',
    description: 'JDF 99 - Incident & Lease Breach Documentation / Verification Report.',
    isCourtForm: true,
  },
  {
    id: 'tpl-lease-master',
    name: 'Colorado-Residential-Lease-Master.pdf',
    category: 'Standard Residential Lease',
    description: 'Colorado Room & Board Master Lease Agreement with individual room liability covenants and utility split terms.',
  },
  {
    id: 'tpl-inspection-master',
    name: 'Move-In-Condition-Checklist-Master.pdf',
    category: 'Condition & Inspection',
    description: 'Room and common area pre-occupancy damage verification and inventory checklist.',
  },
  {
    id: 'tpl-lead-master',
    name: 'Lead-Based-Paint-Disclosure-Master.pdf',
    category: 'Statutory Disclosure',
    description: 'Federal EPA Lead Hazard Disclosure and Pamphlet Acknowledgement.',
  },
  {
    id: 'tpl-rules-master',
    name: 'House-Rules-Addendum-Master.pdf',
    category: 'Shared Living Rules',
    description: '1070 Yank Street Shared Space, Quiet Hours, Parking, and Kitchen Cleanup Addendum.',
  },
];

export const DrivePdfManager: React.FC<DrivePdfManagerProps> = ({
  properties,
  rooms,
  contacts = [],
  leads = [],
  token,
  onConnectGoogle,
  userEmail,
}) => {
  const [pdfRecords, setPdfRecords] = useState<DrivePdfRecord[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Master Forms state with local storage persistence
  const STORAGE_KEY_MASTER_TEMPLATES = 'moyer_crm_master_pdf_templates';
  const [masterTemplates, setMasterTemplates] = useState<MasterPdfTemplate[]>(() => {
    try {
      const raw = localStorage.getItem('moyer_crm_master_pdf_templates');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not parse stored master templates', e);
    }
    return STANDARD_MASTER_TEMPLATES;
  });

  const saveMasterTemplates = (templates: MasterPdfTemplate[]) => {
    setMasterTemplates(templates);
    try {
      localStorage.setItem(STORAGE_KEY_MASTER_TEMPLATES, JSON.stringify(templates));
    } catch (e) {
      console.warn('Could not save master templates to localStorage', e);
    }
  };

  const [isSearchingDriveTemplates, setIsSearchingDriveTemplates] = useState<boolean>(false);
  const [driveSearchQuery, setDriveSearchQuery] = useState<string>('');
  const [driveSearchStatus, setDriveSearchStatus] = useState<string | null>(null);

  // Master Template Edit Modal State
  const [isEditMasterModalOpen, setIsEditMasterModalOpen] = useState<boolean>(false);
  const [selectedTemplateForEdit, setSelectedTemplateForEdit] = useState<MasterPdfTemplate | null>(null);

  // Workflow Modal State
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState<boolean>(false);
  const [selectedWorkflowTemplate, setSelectedWorkflowTemplate] = useState<MasterPdfTemplate | null>(null);
  const [selectedWorkflowRecord, setSelectedWorkflowRecord] = useState<DrivePdfRecord | null>(null);

  // Tag & Rename modal state (legacy / direct edit)
  const [isTagModalOpen, setIsTagModalOpen] = useState<boolean>(false);
  const [selectedPdfForTagging, setSelectedPdfForTagging] = useState<DrivePdfRecord | null>(null);

  // Filter & Search state for Vault
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterPropertyId, setFilterPropertyId] = useState<string>('all');
  const [filterRoomId, setFilterRoomId] = useState<string>('all');
  const [filterWorkflowStatus, setFilterWorkflowStatus] = useState<string>('all');

  // Drag over state for general upload
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [showGeneralUpload, setShowGeneralUpload] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const masterUploadInputRef = useRef<HTMLInputElement>(null);

  // Load saved PDFs on mount
  useEffect(() => {
    loadSavedPdfs();
  }, []);

  const loadSavedPdfs = () => {
    let list = GoogleWorkspaceService.getSavedDrivePdfs();
    // If empty, initialize with realistic sample records for 1070 Yank Street
    if (list.length === 0) {
      const initialSeed: DrivePdfRecord[] = [
        {
          id: 'pdf-seed-1',
          driveFileId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
          name: '[1070 Yank - Room 1] [David King] jdf101 - Demand for Compliance.pdf',
          originalName: 'jdf101-Master.pdf',
          propertyId: 'prop-1070-yank',
          propertyName: '1070 Yank Street',
          roomId: 'room-1-main',
          roomName: 'Room 1 - Main Floor Master',
          tenantName: 'David King',
          docCategory: 'Colorado Eviction / Demand Notice',
          uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
          webViewLink: 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view',
          status: 'filled_and_saved',
          isFilled: true,
          masterSourceName: 'jdf101-Master.pdf',
        },
        {
          id: 'pdf-seed-2',
          driveFileId: '1zU3z4tP9m8Q7r6w5e4r3t2y1u0i9o8p',
          name: '[1070 Yank - Room 2] [Sarah Jenkins] Move-In Condition Inspection.pdf',
          originalName: 'Move-In-Condition-Checklist-Master.pdf',
          propertyId: 'prop-1070-yank',
          propertyName: '1070 Yank Street',
          roomId: 'room-2-upper',
          roomName: 'Room 2 - Upper West',
          tenantName: 'Sarah Jenkins',
          docCategory: 'Move-In Inspection Report',
          uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
          webViewLink: 'https://drive.google.com/file/d/1zU3z4tP9m8Q7r6w5e4r3t2y1u0i9o8p/view',
          status: 'printed',
          isFilled: true,
          masterSourceName: 'Move-In-Condition-Checklist-Master.pdf',
        },
        {
          id: 'pdf-seed-3',
          driveFileId: '1q2w3e4r5t6y7u8i9o0p_id_verification',
          name: '[1070 Yank - Room 3] [Marcus Cole] Colorado Residential Lease.pdf',
          originalName: 'Colorado-Residential-Lease-Master.pdf',
          propertyId: 'prop-1070-yank',
          propertyName: '1070 Yank Street',
          roomId: 'room-3-garden',
          roomName: 'Room 3 - Garden Level Studio',
          tenantName: 'Marcus Cole',
          docCategory: 'Standard Residential Lease',
          uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
          webViewLink: 'https://drive.google.com/file/d/1q2w3e4r5t6y7u8i9o0p_id_verification/view',
          status: 'in_acrobat',
          isFilled: false,
          masterSourceName: 'Colorado-Residential-Lease-Master.pdf',
        },
      ];
      initialSeed.forEach((item) => GoogleWorkspaceService.saveDrivePdf(item));
      list = initialSeed;
    }
    setPdfRecords(list);
  };

  // Search user's Google Drive for master PDF forms
  const handleSearchDriveForMasterPdfs = async () => {
    if (!token) {
      onConnectGoogle();
      return;
    }

    setIsSearchingDriveTemplates(true);
    setDriveSearchStatus('Searching your Google Drive for PDF templates...');

    try {
      const results = await GoogleWorkspaceService.searchDrivePdfs(token, driveSearchQuery || 'Master');
      if (results.length > 0) {
        const mapped: MasterPdfTemplate[] = results.map((f) => ({
          id: f.id,
          name: f.name,
          category: f.name.toLowerCase().includes('jdf') ? 'Colorado Court Form' : 'Drive Master Template',
          description: `Found in your Google Drive (Modified: ${new Date(f.modifiedTime || f.createdTime).toLocaleDateString()})`,
          driveFileId: f.id,
          isCourtForm: f.name.toLowerCase().includes('jdf'),
        }));

        // Merge without duplicates
        const existingIds = new Set(masterTemplates.map((p) => p.name));
        const newOnes = mapped.filter((m) => !existingIds.has(m.name));
        const updatedTemplates = [...newOnes, ...masterTemplates];
        saveMasterTemplates(updatedTemplates);

        setDriveSearchStatus(`Found ${results.length} PDF form(s) in your Google Drive!`);
      } else {
        setDriveSearchStatus('No additional Master PDFs found in Drive matching your search. Standard court templates are shown below.');
      }
    } catch (err: any) {
      console.warn('Drive search error:', err);
      setDriveSearchStatus('Could not search Drive directly. Using verified templates list.');
    } finally {
      setIsSearchingDriveTemplates(false);
    }
  };

  // Start workflow from a Master Form (Step 1 -> Step 2)
  const handlePickMasterForm = (tpl: MasterPdfTemplate) => {
    setSelectedWorkflowTemplate(tpl);
    setSelectedWorkflowRecord(null);
    setIsWorkflowModalOpen(true);
  };

  // Resume workflow for an existing record
  const handleResumeWorkflowForRecord = (record: DrivePdfRecord) => {
    setSelectedWorkflowTemplate(null);
    setSelectedWorkflowRecord(record);
    setIsWorkflowModalOpen(true);
  };

  // Open Edit Master Template Modal
  const handleOpenEditMasterTemplate = (tpl: MasterPdfTemplate) => {
    setSelectedTemplateForEdit(tpl);
    setIsEditMasterModalOpen(true);
  };

  // Save changes to a Master Template
  const handleSaveMasterTemplate = (updated: MasterPdfTemplate) => {
    const updatedList = masterTemplates.map((t) => (t.id === updated.id ? updated : t));
    saveMasterTemplates(updatedList);
    setUploadSuccess(`Master template "${updated.name}" updated successfully.`);
  };

  // Delete a Master Template
  const handleDeleteMasterTemplate = async (templateId: string) => {
    const target = masterTemplates.find((t) => t.id === templateId);
    if (!target) return;

    if (!window.confirm(`Are you sure you want to delete "${target.name}" from your master forms?`)) {
      return;
    }

    // If it has a remote Drive file ID, optionally remove from Drive
    if (token && target.driveFileId && !target.id.startsWith('tpl-')) {
      try {
        await GoogleWorkspaceService.deleteDriveFile(target.driveFileId, token);
      } catch (err) {
        console.warn('Could not delete master file from Drive:', err);
      }
    }

    const updatedList = masterTemplates.filter((t) => t.id !== templateId);
    saveMasterTemplates(updatedList);
    setUploadSuccess(`Master template "${target.name}" removed from library.`);
  };

  // Restore Default Colorado Court & Lease Master Templates
  const handleRestoreDefaultMasterTemplates = () => {
    if (
      window.confirm(
        'Restore default master templates list (jdf101, jdf102, jdf99, Colorado residential lease, condition checklist, rules)?'
      )
    ) {
      saveMasterTemplates(STANDARD_MASTER_TEMPLATES);
      setUploadSuccess('Default Colorado master templates restored.');
    }
  };

  // Upload a new master PDF to Drive
  const handleUploadNewMasterPdf = async (files: FileList | null) => {
    if (!files || !files[0]) return;
    const file = files[0];
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please select a PDF document.');
      return;
    }

    try {
      let fileId = 'master-' + Date.now();
      if (token) {
        const uploadRes = await GoogleWorkspaceService.uploadPdfToDrive(file, file.name, token);
        fileId = uploadRes.id || fileId;
      }
      const newTpl: MasterPdfTemplate = {
        id: fileId,
        name: file.name,
        category: 'Custom Master Template',
        description: 'Uploaded directly to Google Drive as a reusable master form.',
        driveFileId: fileId,
        isCourtForm: file.name.toLowerCase().includes('jdf'),
      };
      saveMasterTemplates([newTpl, ...masterTemplates]);
      setUploadSuccess(`Uploaded "${file.name}" to Master Templates in Google Drive!`);
    } catch (err: any) {
      console.error('Error uploading master PDF:', err);
      setUploadError(err.message || 'Failed to upload master PDF to Google Drive.');
    }
  };

  // General Upload handler (for signed scans, ad-hoc tenant files)
  const handleUploadGeneralFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError(null);
    setUploadSuccess(null);
    setIsUploading(true);

    const file = files[0];
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setUploadError('Please select a valid PDF file.');
      setIsUploading(false);
      return;
    }

    try {
      const defaultProp =
        properties.find((p) => p.id === 'prop-1070-yank' || p.name?.includes('1070 Yank')) ||
        properties[0];
      let driveFileId = 'local-' + Date.now();
      let webViewLink = URL.createObjectURL(file);
      let webContentLink = '';

      if (token) {
        try {
          const uploadRes = await GoogleWorkspaceService.uploadPdfToDrive(file, file.name, token);
          driveFileId = uploadRes.id || driveFileId;
          webViewLink = uploadRes.webViewLink || `https://drive.google.com/file/d/${driveFileId}/view`;
          webContentLink = uploadRes.webContentLink || '';
        } catch (uploadErr: any) {
          console.warn('Google Drive proxy upload error, saving locally:', uploadErr);
          setUploadError(`Drive Upload Notice: ${uploadErr.message}. Saved to local vault.`);
        }
      }

      const newRecord: DrivePdfRecord = {
        id: 'pdf-' + Date.now(),
        driveFileId,
        name: file.name,
        originalName: file.name,
        propertyId: defaultProp?.id,
        propertyName: defaultProp?.name || '1070 Yank Street',
        uploadedAt: new Date().toISOString(),
        webViewLink,
        webContentLink,
        sizeBytes: file.size,
        status: token && !driveFileId.startsWith('local-') ? 'uploaded' : 'local',
      };

      const updated = GoogleWorkspaceService.saveDrivePdf(newRecord);
      setPdfRecords(updated);

      setSelectedPdfForTagging(newRecord);
      setIsTagModalOpen(true);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload PDF.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Open PDF in Chrome
  const handleOpenInChrome = (record: DrivePdfRecord) => {
    const url = record.webViewLink || `https://drive.google.com/file/d/${record.driveFileId}/view`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Print PDF in Chrome
  const handlePrintPdf = (record: DrivePdfRecord) => {
    if (record.webViewLink && record.webViewLink.startsWith('blob:')) {
      const printWin = window.open(record.webViewLink, '_blank');
      if (printWin) {
        printWin.focus();
        printWin.print();
      }
      return;
    }
    const printUrl = `https://drive.google.com/file/d/${record.driveFileId}/preview`;
    window.open(printUrl, '_blank', 'noopener,noreferrer');

    // Update status to printed
    const updated = GoogleWorkspaceService.updateDrivePdfRecord(record.id, {
      status: 'printed',
      lastPrintedAt: new Date().toISOString(),
    });
    setPdfRecords(updated);
  };

  // Delete PDF record
  const handleDeletePdf = async (record: DrivePdfRecord) => {
    if (!window.confirm(`Are you sure you want to remove "${record.name}" from your vault?`)) return;

    if (token && record.driveFileId && !record.driveFileId.startsWith('local-')) {
      try {
        await GoogleWorkspaceService.deleteDriveFile(record.driveFileId, token);
      } catch (err) {
        console.warn('Could not delete from Drive remote:', err);
      }
    }

    const updated = GoogleWorkspaceService.deleteDrivePdfRecord(record.id);
    setPdfRecords(updated);
  };

  // Filtered PDF list for Vault
  const filteredPdfs = pdfRecords.filter((item) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        item.name.toLowerCase().includes(q) ||
        item.originalName.toLowerCase().includes(q) ||
        (item.tenantName && item.tenantName.toLowerCase().includes(q)) ||
        (item.roomName && item.roomName.toLowerCase().includes(q)) ||
        (item.docCategory && item.docCategory.toLowerCase().includes(q));
      if (!match) return false;
    }

    if (filterPropertyId !== 'all' && item.propertyId !== filterPropertyId) {
      return false;
    }

    if (filterRoomId !== 'all' && item.roomId !== filterRoomId) {
      return false;
    }

    if (filterWorkflowStatus !== 'all') {
      if (filterWorkflowStatus === 'needs_fill' && item.status !== 'copied' && item.status !== 'in_acrobat') return false;
      if (filterWorkflowStatus === 'filled' && item.status !== 'filled_and_saved') return false;
      if (filterWorkflowStatus === 'printed' && item.status !== 'printed') return false;
    }

    return true;
  });

  const propertyRooms = rooms.filter((r) => filterPropertyId === 'all' || r.propertyId === filterPropertyId);

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------- */}
      {/* SECTION 1: MASTER PDF FORMS LIBRARY (STEP 1 OF FLOW)  */}
      {/* ---------------------------------------------------- */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="p-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <h3 className="text-base font-bold text-zinc-900">
                  Step 1: Pick a Master Form Saved in Google Drive
                </h3>
              </div>
              <p className="text-xs text-zinc-500 mt-1 max-w-2xl leading-relaxed">
                Choose a saved master template (e.g. <span className="font-mono text-zinc-800 font-bold">jdf101-Master.pdf</span>).
                The system will automatically copy and rename it for your unit/tenant, open it in Adobe Acrobat for form filling, save & replace the file in Google Drive, and prepare it for printing.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              {!token ? (
                <button
                  type="button"
                  id="btn-connect-drive-pdf"
                  onClick={onConnectGoogle}
                  className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                >
                  <HardDrive className="w-4 h-4 text-blue-600" />
                  <span>Connect Google Drive</span>
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Google Drive Connected</span>
                </span>
              )}

              <input
                type="file"
                ref={masterUploadInputRef}
                onChange={(e) => handleUploadNewMasterPdf(e.target.files)}
                accept=".pdf,application/pdf"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => masterUploadInputRef.current?.click()}
                className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-semibold transition border border-zinc-200 flex items-center gap-1.5"
                title="Upload a new blank master PDF to your Google Drive templates"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Master PDF</span>
              </button>

              <button
                type="button"
                onClick={handleRestoreDefaultMasterTemplates}
                className="px-2.5 py-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg text-xs font-semibold transition border border-zinc-200 flex items-center gap-1"
                title="Restore default Colorado court forms and residential lease templates"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset Defaults</span>
              </button>
            </div>
          </div>

          {/* Search Drive for Master PDFs Bar */}
          <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-zinc-400 shrink-0" />
              <input
                type="text"
                value={driveSearchQuery}
                onChange={(e) => setDriveSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearchDriveForMasterPdfs();
                }}
                placeholder="Search Drive for Master PDFs (e.g. jdf101, lease, master)..."
                className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-1.5 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-rose-500 font-medium"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-scan-drive-master-pdfs"
                onClick={handleSearchDriveForMasterPdfs}
                disabled={isSearchingDriveTemplates}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-900 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs shrink-0"
              >
                {isSearchingDriveTemplates ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <HardDrive className="w-3.5 h-3.5 text-rose-400" />
                )}
                <span>Search Drive for PDFs</span>
              </button>
            </div>
          </div>

          {driveSearchStatus && (
            <div className="mb-4 text-xs font-semibold text-zinc-600 bg-zinc-100 p-2.5 rounded-lg border border-zinc-200 flex items-center justify-between">
              <span>{driveSearchStatus}</span>
              <button
                type="button"
                onClick={() => setDriveSearchStatus(null)}
                className="text-zinc-400 hover:text-zinc-700 text-xs"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Master Form Templates Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {masterTemplates.map((tpl) => {
              const driveUrl = tpl.driveFileId
                ? `https://drive.google.com/file/d/${tpl.driveFileId}/view`
                : tpl.driveLink || null;

              return (
                <div
                  key={tpl.id}
                  id={`master-tpl-${tpl.id}`}
                  className="bg-white border-2 border-zinc-200 hover:border-rose-500 rounded-xl p-4 transition-all shadow-2xs hover:shadow-md flex flex-col justify-between group cursor-pointer"
                  onClick={() => handlePickMasterForm(tpl)}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="p-2 rounded-lg bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition">
                        <FileText className="w-5 h-5" />
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {tpl.isCourtForm && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Colorado Court Form
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
                          Drive Master
                        </span>

                        {/* Top quick action buttons for Edit and Delete */}
                        <div className="flex items-center gap-0.5 ml-1">
                          <button
                            type="button"
                            id={`btn-edit-master-${tpl.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditMasterTemplate(tpl);
                            }}
                            className="p-1 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                            title="Edit master file details and link"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            id={`btn-delete-master-${tpl.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMasterTemplate(tpl.id);
                            }}
                            className="p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                            title="Delete master file"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 group-hover:text-rose-700 transition font-mono break-all">
                        {tpl.name}
                      </h4>
                      <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                        {tpl.description}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Action */}
                  <div className="pt-3 mt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-zinc-500 truncate max-w-[100px]" title={tpl.category}>
                      {tpl.category}
                    </span>

                    <div className="flex items-center gap-2 shrink-0">
                      {driveUrl && (
                        <a
                          href={driveUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                          title="Open master file in Google Drive"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span className="hidden sm:inline">Drive</span>
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditMasterTemplate(tpl);
                        }}
                        className="text-xs font-semibold text-zinc-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                        title="Edit master file details, category, or replace PDF"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMasterTemplate(tpl.id);
                        }}
                        className="text-xs font-semibold text-zinc-400 hover:text-rose-600 hover:underline flex items-center gap-1"
                        title="Delete master form from library"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePickMasterForm(tpl);
                        }}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                      >
                        <span>Use Form</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 6-Step Visual Flow Banner */}
          <div className="mt-6 pt-5 border-t border-zinc-200 bg-zinc-50/70 p-4 rounded-xl">
            <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-rose-500" />
              <span>Standard 6-Step PDF Workflow:</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-zinc-200 font-semibold text-zinc-800 shadow-2xs">
                <span className="text-rose-600 font-bold block text-[11px]">Step 1</span>
                Pick Master Form
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-zinc-200 font-semibold text-zinc-800 shadow-2xs">
                <span className="text-rose-600 font-bold block text-[11px]">Step 2</span>
                Copy & Rename
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-zinc-200 font-semibold text-zinc-800 shadow-2xs">
                <span className="text-rose-600 font-bold block text-[11px]">Step 3</span>
                Open in Acrobat
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-zinc-200 font-semibold text-zinc-800 shadow-2xs">
                <span className="text-rose-600 font-bold block text-[11px]">Step 4</span>
                Fill in Acrobat
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-zinc-200 font-semibold text-zinc-800 shadow-2xs">
                <span className="text-rose-600 font-bold block text-[11px]">Step 5</span>
                Save & Replace
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-zinc-200 font-semibold text-zinc-800 shadow-2xs">
                <span className="text-rose-600 font-bold block text-[11px]">Step 6</span>
                Print in Chrome
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* SECTION 2: UNIT DOCUMENTS & IN-PROGRESS PDF VAULT    */}
      {/* ---------------------------------------------------- */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>Unit Documents & Filled PDF Vault</span>
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                All unit-specific copied forms, leases, and inspection documents tracked by property, unit, and tenant.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowGeneralUpload(!showGeneralUpload)}
                className="px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg border border-zinc-300 transition flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5 text-zinc-500" />
                <span>Upload Other PDF Scan</span>
                {showGeneralUpload ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Optional Collapsible General Drop Area */}
          {showGeneralUpload && (
            <div className="mb-5 p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
              <div className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>Ad-Hoc PDF Upload (Signed Paper Leases, ID Scans, Rent Receipts)</span>
              </div>
              <div
                id="pdf-drop-zone"
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  handleUploadGeneralFiles(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-blue-600 bg-blue-50/70 scale-[0.99]'
                    : 'border-zinc-300 hover:border-blue-400 bg-white hover:bg-blue-50/20'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleUploadGeneralFiles(e.target.files)}
                  accept=".pdf,application/pdf"
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className={`p-2.5 rounded-full ${isDragOver ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'}`}>
                    {isUploading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-900">
                      {isUploading ? 'Uploading to Google Drive...' : 'Drag & drop signed PDF here, or click to browse'}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      Auto-uploads to Google Drive and prompts unit / tenant tagging.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Feedback messages */}
          {uploadError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}
          {uploadSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{uploadSuccess}</span>
              </div>
              <button
                type="button"
                onClick={() => setUploadSuccess(null)}
                className="text-xs text-emerald-700 hover:text-emerald-900 font-bold"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Filter & Search Bar */}
          <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs mb-4">
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  id="search-drive-pdfs"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by file name, tenant, or unit..."
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* Property selector */}
              <select
                value={filterPropertyId}
                onChange={(e) => {
                  setFilterPropertyId(e.target.value);
                  setFilterRoomId('all');
                }}
                className="p-1.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-800 focus:outline-none font-medium"
              >
                <option value="all">All Properties</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              {/* Room / Unit selector */}
              <select
                value={filterRoomId}
                onChange={(e) => setFilterRoomId(e.target.value)}
                className="p-1.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-800 focus:outline-none font-medium"
              >
                <option value="all">All Units / Rooms</option>
                {propertyRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>

              {/* Workflow Status Filter */}
              <select
                value={filterWorkflowStatus}
                onChange={(e) => setFilterWorkflowStatus(e.target.value)}
                className="p-1.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-800 focus:outline-none font-medium"
              >
                <option value="all">All Workflow States</option>
                <option value="needs_fill">Needs Acrobat Fill</option>
                <option value="filled">Filled & Saved</option>
                <option value="printed">Printed in Chrome</option>
              </select>
            </div>

            <div className="flex items-center gap-2 self-end md:self-auto">
              <span className="text-zinc-500 font-medium text-[11px]">
                Showing <strong className="text-zinc-800">{filteredPdfs.length}</strong> PDF documents
              </span>
              <button
                type="button"
                onClick={loadSavedPdfs}
                className="p-1.5 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200 rounded-lg transition"
                title="Refresh list"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* PDF Documents Grid */}
          {filteredPdfs.length === 0 ? (
            <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-12 text-center">
              <FileText className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-zinc-800">No PDF documents found</h4>
              <p className="text-xs text-zinc-500 mt-1">
                Pick a master template above (like <span className="font-mono">jdf101-Master.pdf</span>) to start the 6-step flow!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPdfs.map((pdf) => {
                const isReadyToPrint = pdf.status === 'filled_and_saved' || pdf.status === 'printed' || pdf.isFilled;
                const isInAcrobat = pdf.status === 'copied' || pdf.status === 'in_acrobat';

                return (
                  <div
                    key={pdf.id}
                    id={`drive-pdf-card-${pdf.id}`}
                    className="bg-white rounded-xl border border-zinc-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                  >
                    {/* Card Top */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="p-2 bg-rose-50 text-rose-600 rounded-lg shrink-0 group-hover:bg-rose-100 transition">
                          <FileText className="w-5 h-5" />
                        </div>

                        {/* Workflow Status Badge */}
                        <div className="flex items-center gap-1">
                          {pdf.status === 'printed' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                              Printed
                            </span>
                          ) : isReadyToPrint ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Filled & Ready</span>
                            </span>
                          ) : isInAcrobat ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              Fill in Acrobat
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
                              Drive Vault
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Title & Click to Open */}
                      <div>
                        <button
                          type="button"
                          onClick={() => handleOpenInChrome(pdf)}
                          className="text-left font-bold text-xs text-zinc-900 hover:text-blue-700 transition leading-snug line-clamp-2 block group-hover:underline"
                          title="Click to open PDF in Chrome"
                        >
                          {pdf.name}
                        </button>
                        {pdf.masterSourceName && (
                          <p className="text-[10px] text-zinc-400 truncate mt-1">
                            From Master: <span className="font-mono">{pdf.masterSourceName}</span>
                          </p>
                        )}
                      </div>

                      {/* Badges: Unit, Tenant, Category */}
                      <div className="space-y-1.5 pt-1">
                        {/* Unit / Room */}
                        <div className="flex items-center gap-1.5 text-xs text-zinc-700">
                          <DoorOpen className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span className="font-semibold truncate">
                            {pdf.roomName || 'Whole Property / Common'}
                          </span>
                        </div>

                        {/* Tenant */}
                        {pdf.tenantName && (
                          <div className="flex items-center gap-1.5 text-xs text-zinc-700">
                            <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                            <span className="font-semibold text-blue-900 truncate">
                              {pdf.tenantName}
                            </span>
                          </div>
                        )}

                        {/* Document Category */}
                        {pdf.docCategory && (
                          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                            <Tag className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                            <span className="truncate">{pdf.docCategory}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Footer: Step Actions */}
                    <div className="p-3 bg-zinc-50/80 border-t border-zinc-100 flex items-center justify-between gap-2 text-xs">
                      {/* Left Action: Workflow / Acrobat Modal */}
                      <button
                        type="button"
                        onClick={() => handleResumeWorkflowForRecord(pdf)}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md font-bold text-xs flex items-center gap-1 transition shadow-2xs"
                        title="Resume 6-step workflow or open in Adobe Acrobat"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Acrobat Flow</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        {/* Print Button (Step 6) */}
                        <button
                          type="button"
                          onClick={() => handlePrintPdf(pdf)}
                          className={`px-2.5 py-1 rounded-md font-bold text-xs flex items-center gap-1 transition shadow-2xs ${
                            isReadyToPrint
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-zinc-800 hover:bg-zinc-900 text-white'
                          }`}
                          title="Step 6: Print form in Chrome"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Print</span>
                        </button>

                        {/* Tag & Rename */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPdfForTagging(pdf);
                            setIsTagModalOpen(true);
                          }}
                          className="p-1.5 text-zinc-500 hover:text-blue-700 hover:bg-blue-50 rounded transition"
                          title="Edit unit/tenant tags"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleDeletePdf(pdf)}
                          className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                          title="Remove PDF"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 6-Step Master PDF Workflow Modal */}
      <MasterPdfWorkflowModal
        isOpen={isWorkflowModalOpen}
        onClose={() => {
          setIsWorkflowModalOpen(false);
          setSelectedWorkflowTemplate(null);
          setSelectedWorkflowRecord(null);
        }}
        initialTemplate={selectedWorkflowTemplate}
        existingRecord={selectedWorkflowRecord}
        properties={properties}
        rooms={rooms}
        contacts={contacts}
        leads={leads}
        token={token}
        onConnectGoogle={onConnectGoogle}
        onWorkflowComplete={(updatedRecord) => {
          setPdfRecords((prev) => {
            const idx = prev.findIndex((r) => r.id === updatedRecord.id);
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = updatedRecord;
              return updated;
            }
            return [updatedRecord, ...prev];
          });
        }}
      />

      {/* Direct Tag & Rename Modal */}
      <PdfTagRenameModal
        isOpen={isTagModalOpen}
        onClose={() => {
          setIsTagModalOpen(false);
          setSelectedPdfForTagging(null);
        }}
        pdfRecord={selectedPdfForTagging}
        properties={properties}
        rooms={rooms}
        contacts={contacts}
        leads={leads}
        token={token}
        onSuccess={(updated) => {
          setPdfRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        }}
        onConnectGoogle={onConnectGoogle}
      />

      {/* Edit Master Template Modal */}
      <EditMasterTemplateModal
        isOpen={isEditMasterModalOpen}
        onClose={() => {
          setIsEditMasterModalOpen(false);
          setSelectedTemplateForEdit(null);
        }}
        template={selectedTemplateForEdit}
        token={token}
        onSave={handleSaveMasterTemplate}
        onDelete={handleDeleteMasterTemplate}
      />
    </div>
  );
};
