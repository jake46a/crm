import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FileText,
  Trash2,
  Save,
  ExternalLink,
  Upload,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  HardDrive,
  Tag,
  AlignLeft,
  Link2,
} from 'lucide-react';
import { MasterPdfTemplate } from './MasterPdfWorkflowModal';
import { GoogleWorkspaceService } from '../../services/googleWorkspace';

interface EditMasterTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: MasterPdfTemplate | null;
  token: string | null;
  onSave: (updated: MasterPdfTemplate) => void;
  onDelete: (templateId: string) => void;
}

const CATEGORY_OPTIONS = [
  'Colorado Eviction / Demand Notice',
  'Colorado Lease Termination',
  'Colorado Court Complaint & Incident',
  'Standard Residential Lease',
  'Condition & Inspection',
  'Statutory Disclosure',
  'Shared Living Rules',
  'Rent & Utility Statement',
  'Custom Master Template',
];

export const EditMasterTemplateModal: React.FC<EditMasterTemplateModalProps> = ({
  isOpen,
  onClose,
  template,
  token,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [driveFileId, setDriveFileId] = useState<string>('');
  const [isCourtForm, setIsCourtForm] = useState<boolean>(false);

  // Replacement file upload
  const [replacementFile, setReplacementFile] = useState<File | null>(null);
  const [isUploadingReplacement, setIsUploadingReplacement] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && template) {
      setName(template.name || '');
      const isKnown = CATEGORY_OPTIONS.includes(template.category);
      if (isKnown) {
        setCategory(template.category);
        setCustomCategory('');
      } else {
        setCategory('custom');
        setCustomCategory(template.category || '');
      }
      setDescription(template.description || '');
      setDriveFileId(template.driveFileId || '');
      setIsCourtForm(!!template.isCourtForm);
      setReplacementFile(null);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, template]);

  if (!isOpen || !template) return null;

  const driveUrl = driveFileId
    ? `https://drive.google.com/file/d/${driveFileId}/view`
    : template.driveLink || null;

  const handleSave = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    let cleanName = name.trim();
    if (!cleanName) {
      setErrorMsg('Template name is required.');
      return;
    }
    if (!cleanName.toLowerCase().endsWith('.pdf')) {
      cleanName = `${cleanName}.pdf`;
    }

    const finalCategory = category === 'custom' ? customCategory.trim() || 'General' : category;

    let finalDriveFileId = driveFileId.trim();

    // If a replacement file was chosen and token is present, upload to Drive
    if (replacementFile) {
      setIsUploadingReplacement(true);
      try {
        if (token) {
          const uploadRes = await GoogleWorkspaceService.uploadPdfToDrive(
            replacementFile,
            cleanName,
            token
          );
          finalDriveFileId = uploadRes.id || finalDriveFileId;
        }
      } catch (err: any) {
        console.warn('Replacement upload error:', err);
        setErrorMsg(`Failed to upload replacement PDF to Drive: ${err.message}`);
        setIsUploadingReplacement(false);
        return;
      }
      setIsUploadingReplacement(false);
    }

    const updated: MasterPdfTemplate = {
      ...template,
      name: cleanName,
      category: finalCategory,
      description: description.trim(),
      driveFileId: finalDriveFileId || undefined,
      driveLink: finalDriveFileId ? `https://drive.google.com/file/d/${finalDriveFileId}/view` : template.driveLink,
      isCourtForm,
    };

    onSave(updated);
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete the master template "${template.name}"? This will remove it from your master forms list.`)) {
      onDelete(template.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-zinc-900 text-white p-5 flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-600 text-white shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Edit Master PDF Template</h2>
              <p className="text-xs text-zinc-400 mt-0.5 font-mono truncate max-w-xs sm:max-w-md">
                {template.name}
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

        {/* Error / Success Notifications */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border-b border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Master File Name */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">
              Master PDF Filename
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. jdf101-Master.pdf"
                className="w-full p-2.5 bg-white border border-zinc-300 rounded-lg text-xs font-mono text-zinc-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              Tip: Standard master files usually end with <code className="text-zinc-600">-Master.pdf</code>.
            </p>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-zinc-700 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-zinc-400" />
              <span>Category / Form Type</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 font-semibold focus:ring-2 focus:ring-rose-500 focus:outline-none"
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              <option value="custom">Other / Custom Category...</option>
            </select>

            {category === 'custom' && (
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Enter custom category name..."
                className="w-full p-2 bg-zinc-50 border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none"
              />
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1 flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5 text-zinc-400" />
              <span>Description / Statutory Context</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this master form..."
              className="w-full p-2.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          {/* Court Form Toggle */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isCourtFormToggle"
              checked={isCourtForm}
              onChange={(e) => setIsCourtForm(e.target.checked)}
              className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-zinc-300 cursor-pointer"
            />
            <label htmlFor="isCourtFormToggle" className="text-xs font-bold text-zinc-800 cursor-pointer">
              Tag as Colorado Judicial Department Court Form (e.g. JDF 101, JDF 102)
            </label>
          </div>

          {/* Google Drive Link & File ID */}
          <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-blue-600" />
                <span>Google Drive Integration</span>
              </label>

              {driveUrl && (
                <a
                  href={driveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
                >
                  <span>Open in Google Drive</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div>
              <span className="text-[11px] text-zinc-500 block mb-1">
                Google Drive File ID (Optional - links directly to cloud file)
              </span>
              <input
                type="text"
                value={driveFileId}
                onChange={(e) => setDriveFileId(e.target.value)}
                placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                className="w-full p-2 bg-white border border-zinc-300 rounded-lg text-xs font-mono text-zinc-800 focus:outline-none"
              />
            </div>
          </div>

          {/* Replace Master PDF File */}
          <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-2">
            <label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-zinc-500" />
              <span>Replace Master PDF Binary (Optional)</span>
            </label>
            <p className="text-[11px] text-zinc-500">
              Upload an updated blank form from the Colorado court or landlord association to update this master template.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setReplacementFile(e.target.files[0]);
                }
              }}
              accept=".pdf,application/pdf"
              className="hidden"
            />

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-300 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{replacementFile ? 'Choose Different File' : 'Select New PDF File'}</span>
              </button>

              {replacementFile && (
                <span className="text-xs font-medium text-emerald-700 flex items-center gap-1 truncate max-w-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                  <span className="truncate">{replacementFile.name}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleDelete}
            className="px-3.5 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-rose-200 transition flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Master Form</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-800 bg-white hover:bg-zinc-100 rounded-lg border border-zinc-200 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isUploadingReplacement}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              {isUploadingReplacement ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
