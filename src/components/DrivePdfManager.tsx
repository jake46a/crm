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
  Eye,
} from 'lucide-react';
import { Property, Room, Contact, TenantLead } from '../types';
import {
  DrivePdfRecord,
  GoogleWorkspaceService,
} from '../services/googleWorkspace';
import { PdfTagRenameModal } from './modals/PdfTagRenameModal';

interface DrivePdfManagerProps {
  properties: Property[];
  rooms: Room[];
  contacts?: Contact[];
  leads?: TenantLead[];
  token: string | null;
  onConnectGoogle: () => void;
  userEmail?: string;
}

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

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterPropertyId, setFilterPropertyId] = useState<string>('all');
  const [filterRoomId, setFilterRoomId] = useState<string>('all');
  const [filterDocCategory, setFilterDocCategory] = useState<string>('all');

  // Tag & Rename modal state
  const [isTagModalOpen, setIsTagModalOpen] = useState<boolean>(false);
  const [selectedPdfForTagging, setSelectedPdfForTagging] = useState<DrivePdfRecord | null>(null);

  // Drag over state
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          name: '[1070 Yank - Room 1] [David King] Signed Lease Agreement.pdf',
          originalName: 'Lease_Scan_Room1_signed.pdf',
          propertyId: 'prop-1070-yank',
          propertyName: '1070 Yank Street',
          roomId: 'room-1-main',
          roomName: 'Room 1 - Main Floor Master',
          tenantName: 'David King',
          docCategory: 'Signed Lease Agreement',
          uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
          webViewLink: 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view',
          status: 'renamed',
        },
        {
          id: 'pdf-seed-2',
          driveFileId: '1zU3z4tP9m8Q7r6w5e4r3t2y1u0i9o8p',
          name: '[1070 Yank - Room 2] [Sarah Jenkins] Move-In Condition Inspection.pdf',
          originalName: 'Room2_Inspection_Photos_Checklist.pdf',
          propertyId: 'prop-1070-yank',
          propertyName: '1070 Yank Street',
          roomId: 'room-2-upper',
          roomName: 'Room 2 - Upper West',
          tenantName: 'Sarah Jenkins',
          docCategory: 'Move-In Inspection Report',
          uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
          webViewLink: 'https://drive.google.com/file/d/1zU3z4tP9m8Q7r6w5e4r3t2y1u0i9o8p/view',
          status: 'renamed',
        },
        {
          id: 'pdf-seed-3',
          driveFileId: '1q2w3e4r5t6y7u8i9o0p_id_verification',
          name: '[1070 Yank - Room 3] [Marcus Cole] Tenant ID Verification.pdf',
          originalName: 'IMG_DL_Scan_Marcus.pdf',
          propertyId: 'prop-1070-yank',
          propertyName: '1070 Yank Street',
          roomId: 'room-3-garden',
          roomName: 'Room 3 - Garden Level Studio',
          tenantName: 'Marcus Cole',
          docCategory: 'Tenant ID Verification',
          uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
          webViewLink: 'https://drive.google.com/file/d/1q2w3e4r5t6y7u8i9o0p_id_verification/view',
          status: 'renamed',
        },
      ];
      initialSeed.forEach(item => GoogleWorkspaceService.saveDrivePdf(item));
      list = initialSeed;
    }
    setPdfRecords(list);
  };

  // Upload handler (supports both real Google Drive API and offline fallback)
  const handleUploadFiles = async (files: FileList | null) => {
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
      let driveFileId = 'local-' + Date.now();
      let webViewLink = '';
      let driveFileName = file.name;
      let isSyncedToDrive = false;
      let driveNotice = '';

      // If connected with Google Workspace Token, upload to Google Drive via server proxy
      if (token) {
        try {
          const driveUploadRes = await GoogleWorkspaceService.uploadPdfToDrive(file, file.name, token);
          driveFileId = driveUploadRes.id;
          driveFileName = driveUploadRes.name || file.name;
          webViewLink = driveUploadRes.webViewLink || `https://drive.google.com/file/d/${driveFileId}/view`;
          isSyncedToDrive = true;
          driveNotice = `Successfully uploaded "${driveFileName}" to Google Drive!`;
        } catch (driveErr: any) {
          console.warn('Google Drive direct upload failed, preserving in local vault:', driveErr);
          driveNotice = `Saved "${file.name}" to Vault (${driveErr.message || 'Google Drive sync pending'}).`;
          webViewLink = URL.createObjectURL(file);
        }
      } else {
        webViewLink = URL.createObjectURL(file);
        driveNotice = `Uploaded "${file.name}" to Vault! Connect Google Drive to sync to cloud.`;
      }

      // Default property to 1070 Yank Street or first property
      const defaultProp = properties.find(p => p.id === 'prop-1070-yank' || p.name?.includes('1070 Yank')) || properties[0];

      // Create new record
      const newRecord: DrivePdfRecord = {
        id: 'pdf-' + Date.now(),
        driveFileId,
        name: driveFileName,
        originalName: file.name,
        propertyId: defaultProp?.id,
        propertyName: defaultProp?.name,
        sizeBytes: file.size,
        uploadedAt: new Date().toISOString(),
        webViewLink,
        status: isSyncedToDrive ? 'uploaded' : 'local',
      };

      // Save locally
      const updatedList = GoogleWorkspaceService.saveDrivePdf(newRecord);
      setPdfRecords(updatedList);

      setUploadSuccess(driveNotice);

      // Automatically open Tag & Rename modal for this file so user can enter unit and tenant info
      setSelectedPdfForTagging(newRecord);
      setIsTagModalOpen(true);
    } catch (err: any) {
      console.error('Upload to Drive failed:', err);
      setUploadError(err.message || 'Failed to upload PDF.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
  };

  // Delete PDF record
  const handleDeletePdf = async (record: DrivePdfRecord) => {
    if (!window.confirm(`Are you sure you want to remove "${record.name}"?`)) return;

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

  // Filtered PDF list
  const filteredPdfs = pdfRecords.filter(item => {
    // Search
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

    // Property
    if (filterPropertyId !== 'all' && item.propertyId !== filterPropertyId) {
      return false;
    }

    // Room
    if (filterRoomId !== 'all' && item.roomId !== filterRoomId) {
      return false;
    }

    // Category
    if (filterDocCategory !== 'all' && item.docCategory !== filterDocCategory) {
      return false;
    }

    return true;
  });

  const propertyRooms = rooms.filter(r => filterPropertyId === 'all' || r.propertyId === filterPropertyId);

  return (
    <div className="space-y-6">
      {/* Upload Zone & Actions Banner */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-blue-600" />
                Upload PDF to Google Drive & Tag by Unit / Tenant
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Drop your signed leases, inspection checklists, or tenant ID scans here. They will be uploaded to Google Drive, renamed with unit and tenant metadata, and can be viewed or printed in Chrome.
              </p>
            </div>

            {!token && (
              <button
                type="button"
                id="btn-connect-drive-pdf"
                onClick={onConnectGoogle}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 self-start md:self-auto shadow-2xs"
              >
                <HardDrive className="w-4 h-4 text-blue-600" />
                <span>Connect Google Drive</span>
              </button>
            )}
          </div>

          {/* Upload Drop Area */}
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
              handleUploadFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-blue-600 bg-blue-50/70 scale-[0.99]'
                : 'border-zinc-300 hover:border-blue-400 bg-zinc-50/60 hover:bg-blue-50/20'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleUploadFiles(e.target.files)}
              accept=".pdf,application/pdf"
              className="hidden"
            />

            <div className="max-w-md mx-auto flex flex-col items-center justify-center space-y-3">
              <div className={`p-3 rounded-full ${isDragOver ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'}`}>
                {isUploading ? (
                  <RefreshCw className="w-6 h-6 animate-spin" />
                ) : (
                  <Upload className="w-6 h-6" />
                )}
              </div>

              <div>
                <p className="text-sm font-bold text-zinc-900">
                  {isUploading ? 'Uploading to Google Drive...' : 'Drag & drop PDF here, or click to browse'}
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Supported format: .pdf up to 50MB (Signed Leases, Tenant Scans, Move-In Checklists, Rent Receipts)
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-600 bg-white px-2.5 py-1 rounded-full border border-zinc-200 shadow-2xs">
                  <FileText className="w-3.5 h-3.5 text-rose-600" />
                  PDF Auto-Upload
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-600 bg-white px-2.5 py-1 rounded-full border border-zinc-200 shadow-2xs">
                  <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                  Unit / Tenant Renamer
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-600 bg-white px-2.5 py-1 rounded-full border border-zinc-200 shadow-2xs">
                  <Printer className="w-3.5 h-3.5 text-emerald-600" />
                  Chrome Print Ready
                </span>
              </div>
            </div>
          </div>

          {/* Feedback messages */}
          {uploadError && (
            <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}
          {uploadSuccess && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center justify-between gap-2">
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
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="search-drive-pdfs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by file name, tenant, or unit..."
              className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Property selector */}
          <select
            value={filterPropertyId}
            onChange={(e) => {
              setFilterPropertyId(e.target.value);
              setFilterRoomId('all');
            }}
            className="p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-800 focus:outline-none"
          >
            <option value="all">All Properties</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Room / Unit selector */}
          <select
            value={filterRoomId}
            onChange={(e) => setFilterRoomId(e.target.value)}
            className="p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-800 focus:outline-none"
          >
            <option value="all">All Units / Rooms</option>
            {propertyRooms.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <span className="text-zinc-500 font-medium">
            Showing <strong className="text-zinc-800">{filteredPdfs.length}</strong> PDF documents
          </span>
          <button
            type="button"
            onClick={loadSavedPdfs}
            className="p-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg transition"
            title="Refresh list"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* PDF Document Cards Grid */}
      {filteredPdfs.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center">
          <FileText className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-zinc-800">No PDF documents match your search</h4>
          <p className="text-xs text-zinc-500 mt-1">
            Drag and drop a PDF above or clear your search filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPdfs.map((pdf) => {
            return (
              <div
                key={pdf.id}
                id={`drive-pdf-card-${pdf.id}`}
                className="bg-white rounded-xl border border-zinc-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Card Top / Header */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="p-2 bg-rose-50 text-rose-600 rounded-lg shrink-0 group-hover:bg-rose-100 transition">
                      <FileText className="w-5 h-5" />
                    </div>

                    <div className="flex items-center gap-1">
                      {pdf.status === 'local' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Vault PDF
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                          Drive Cloud
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Click to Open in Chrome */}
                  <div>
                    <button
                      type="button"
                      onClick={() => handleOpenInChrome(pdf)}
                      className="text-left font-bold text-xs text-zinc-900 hover:text-blue-700 transition leading-snug line-clamp-2 block group-hover:underline"
                      title="Click to open PDF in Chrome"
                    >
                      {pdf.name}
                    </button>
                    {pdf.originalName && pdf.originalName !== pdf.name && (
                      <p className="text-[10px] text-zinc-400 truncate mt-1">
                        Original: {pdf.originalName}
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

                {/* Card Footer: Open in Chrome, Print, Tag & Rename */}
                <div className="p-3 bg-zinc-50/80 border-t border-zinc-100 flex items-center justify-between gap-2 text-xs">
                  {/* Left: Open in Chrome */}
                  <button
                    type="button"
                    onClick={() => handleOpenInChrome(pdf)}
                    className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-zinc-200 rounded-md font-bold text-xs flex items-center gap-1 transition shadow-2xs"
                    title="Open in Chrome / Google Drive viewer"
                  >
                    <span>Open</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>

                  <div className="flex items-center gap-1.5">
                    {/* Print */}
                    <button
                      type="button"
                      onClick={() => handlePrintPdf(pdf)}
                      className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-900 text-white rounded-md font-semibold text-xs flex items-center gap-1 transition shadow-2xs"
                      title="Print PDF in Chrome"
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
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold text-xs flex items-center gap-1 transition shadow-2xs"
                      title="Edit unit/tenant and rename in Google Drive"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Tag & Rename</span>
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDeletePdf(pdf)}
                      className="p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
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

      {/* Tag & Rename Modal */}
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
          setPdfRecords(prev => prev.map(r => r.id === updated.id ? updated : r));
        }}
        onConnectGoogle={onConnectGoogle}
      />
    </div>
  );
};
