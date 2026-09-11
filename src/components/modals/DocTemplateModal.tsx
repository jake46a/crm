import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  ExternalLink,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  HardDrive,
  RefreshCw,
  Sparkles,
  Link2,
  Unlink,
  CheckCircle2,
} from 'lucide-react';
import {
  DocumentTemplateConfig,
  DocumentTemplateType,
  extractGoogleDocId,
  getGoogleDocUrl,
  isValidGoogleDocId,
  GoogleWorkspaceService,
} from '../../services/googleWorkspace';

interface DocTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: DocumentTemplateConfig) => void;
  editingTemplate?: DocumentTemplateConfig | null;
  onDelete?: (templateId: string) => void;
  token?: string | null;
  onConnectGoogle?: () => void;
}

const COMMON_TAGS = [
  '{{tenant_name}}',
  '{{tenant_phone}}',
  '{{tenant_email}}',
  '{{property_name}}',
  '{{property_address}}',
  '{{room_name}}',
  '{{monthly_rent}}',
  '{{security_deposit}}',
  '{{lease_start_date}}',
  '{{lease_end_date}}',
  '{{today_date}}',
  '{{manager_name}}',
  '{{manager_phone}}',
  '{{manager_email}}',
  '{{past_due_amount}}',
  '{{late_fee_amount}}',
  '{{total_owed}}',
  '{{utility_divisor}}',
  '{{tenant_share_amount}}',
  '{{vacate_deadline_date}}',
  '{{violation_reason}}',
];

const TEMPLATE_CATEGORIES: { type: DocumentTemplateType; label: string; iconLabel: string }[] = [
  { type: 'lease', label: 'Room Rental Lease', iconLabel: '📄' },
  { type: 'late_notice', label: 'Payment Demand / Late Notice', iconLabel: '⚠️' },
  { type: 'eviction', label: 'Notice to Vacate / Eviction', iconLabel: '🚨' },
  { type: 'utility_statement', label: 'Shared Utility Split Statement', iconLabel: '⚡' },
  { type: 'addendum', label: 'Lease Addendum & Rules', iconLabel: '📝' },
  { type: 'checklist', label: 'Move-In / Condition Checklist', iconLabel: '📋' },
  { type: 'custom', label: 'Custom Document', iconLabel: '✨' },
];

export const DocTemplateModal: React.FC<DocTemplateModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTemplate,
  onDelete,
  token,
  onConnectGoogle,
}) => {
  const [name, setName] = useState<string>('');
  const [type, setType] = useState<DocumentTemplateType>('lease');
  const [rawDocInput, setRawDocInput] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [placeholders, setPlaceholders] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState<string>('');
  const [isCreatingInDrive, setIsCreatingInDrive] = useState<boolean>(false);
  const [driveCreateSuccess, setDriveCreateSuccess] = useState<string | null>(null);
  const [driveCreateError, setDriveCreateError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Initialize form state when opening
  useEffect(() => {
    if (isOpen) {
      setFormError(null);
      setDriveCreateSuccess(null);
      setDriveCreateError(null);

      if (editingTemplate) {
        setName(editingTemplate.name || '');
        setType(editingTemplate.type || 'lease');
        setRawDocInput(
          editingTemplate.googleDocId
            ? getGoogleDocUrl(editingTemplate.googleDocId) || editingTemplate.googleDocId
            : ''
        );
        setDescription(editingTemplate.description || '');
        setPlaceholders(editingTemplate.placeholders || COMMON_TAGS.slice(0, 10));
      } else {
        setName('');
        setType('lease');
        setRawDocInput('');
        setDescription('');
        setPlaceholders([
          '{{tenant_name}}',
          '{{tenant_phone}}',
          '{{tenant_email}}',
          '{{property_name}}',
          '{{property_address}}',
          '{{room_name}}',
          '{{monthly_rent}}',
          '{{lease_start_date}}',
          '{{today_date}}',
          '{{manager_name}}',
        ]);
      }
    }
  }, [isOpen, editingTemplate]);

  if (!isOpen) return null;

  const extractedDocId = extractGoogleDocId(rawDocInput);
  const hasValidDocId = isValidGoogleDocId(extractedDocId);
  const googleDocUrl = hasValidDocId ? getGoogleDocUrl(extractedDocId) : '';

  // Toggle placeholder tag
  const handleToggleTag = (tag: string) => {
    if (placeholders.includes(tag)) {
      setPlaceholders(placeholders.filter(p => p !== tag));
    } else {
      setPlaceholders([...placeholders, tag]);
    }
  };

  // Add custom tag
  const handleAddCustomTag = () => {
    let tag = customTagInput.trim();
    if (!tag) return;
    if (!tag.startsWith('{{')) tag = `{{${tag}`;
    if (!tag.endsWith('}}')) tag = `${tag}}}`;

    if (!placeholders.includes(tag)) {
      setPlaceholders([...placeholders, tag]);
    }
    setCustomTagInput('');
  };

  // 1-Click Create Starter Document in Drive
  const handleCreateStarterDocInDrive = async () => {
    if (!token) {
      onConnectGoogle?.();
      return;
    }

    setIsCreatingInDrive(true);
    setDriveCreateError(null);
    setDriveCreateSuccess(null);

    try {
      const docTitle = `[TEMPLATE] 1070 Yank St - ${name.trim() || 'New Template'}`;
      const starterBody = GoogleWorkspaceService.getStarterTemplateContent(type);
      const newDoc = await GoogleWorkspaceService.createGoogleDoc(docTitle, starterBody, token);

      const docId = newDoc.documentId;
      setRawDocInput(getGoogleDocUrl(docId));
      setDriveCreateSuccess(`Created "${docTitle}" in your Google Drive!`);
    } catch (err: any) {
      console.error('Error creating starter doc in Drive:', err);
      setDriveCreateError(err.message || 'Failed to create starter Google Doc in Drive.');
    } finally {
      setIsCreatingInDrive(false);
    }
  };

  // Handle Save
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setFormError('Please enter a template name.');
      return;
    }

    const templateId = editingTemplate?.id || `tpl_custom_${Date.now()}`;
    const cleanDocId = extractGoogleDocId(rawDocInput);

    const updatedTemplate: DocumentTemplateConfig = {
      id: templateId,
      name: cleanName,
      type,
      googleDocId: cleanDocId,
      description: description.trim(),
      placeholders: placeholders.length > 0 ? placeholders : COMMON_TAGS.slice(0, 8),
      isCustom: editingTemplate ? editingTemplate.isCustom : true,
      createdAt: editingTemplate?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(updatedTemplate);
    onClose();
  };

  return (
    <div
      id="doc-template-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
    >
      <div
        id="doc-template-modal-card"
        className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-zinc-200 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">
                {editingTemplate ? 'Edit Google Doc Template & Link' : 'Add New Google Doc Template'}
              </h3>
              <p className="text-xs text-zinc-500">
                Configure your document template, Google Doc link, and data placeholders.
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-template-modal"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Template Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                Template Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="input-template-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Move-In Room Condition Inspection"
                className="w-full p-2.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                Document Category / Type
              </label>
              <select
                id="select-template-category"
                value={type}
                onChange={(e) => setType(e.target.value as DocumentTemplateType)}
                className="w-full p-2.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {TEMPLATE_CATEGORIES.map((cat) => (
                  <option key={cat.type} value={cat.type}>
                    {cat.iconLabel} {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
              Description / Notes
            </label>
            <textarea
              id="input-template-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Brief summary of when and how this document is used..."
              className="w-full p-2.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Section: Google Doc Link & ID */}
          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-800 flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-blue-600" />
                Google Doc Link / Document ID
              </label>
              {hasValidDocId && (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Valid Doc ID
                </span>
              )}
            </div>

            <p className="text-xs text-zinc-500">
              Paste the full Google Doc sharing link or the document ID from Google Drive.
            </p>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  id="input-google-doc-link"
                  value={rawDocInput}
                  onChange={(e) => setRawDocInput(e.target.value)}
                  placeholder="https://docs.google.com/document/d/1a2b3c4d5e.../edit or Doc ID"
                  className="flex-1 p-2.5 bg-white border border-zinc-300 rounded-lg font-mono text-xs text-zinc-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                {rawDocInput && (
                  <button
                    type="button"
                    onClick={() => setRawDocInput('')}
                    className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Clear Link"
                  >
                    <Unlink className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Detected Doc ID and Quick Actions */}
              {hasValidDocId && (
                <div className="p-2.5 bg-white border border-zinc-200 rounded-lg flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="font-mono text-[11px] text-zinc-600 truncate">
                      ID: {extractedDocId}
                    </span>
                  </div>
                  <a
                    href={googleDocUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-blue-600 hover:text-blue-800 font-semibold text-xs flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                  >
                    <span>Test / Open Doc</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* 1-Click Create Starter Doc in Drive Helper */}
              <div className="pt-2 border-t border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[11px] text-zinc-500">
                  Don't have a Google Doc ready yet?
                </span>
                <button
                  type="button"
                  id="btn-create-starter-drive"
                  onClick={handleCreateStarterDocInDrive}
                  disabled={isCreatingInDrive}
                  className="self-start sm:self-auto px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isCreatingInDrive ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Creating in Drive...
                    </>
                  ) : (
                    <>
                      <HardDrive className="w-3.5 h-3.5" />
                      Create Starter Doc in Google Drive
                    </>
                  )}
                </button>
              </div>

              {driveCreateSuccess && (
                <p className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{driveCreateSuccess}</span>
                </p>
              )}

              {driveCreateError && (
                <p className="text-xs text-rose-700 bg-rose-50 p-2 rounded border border-rose-200 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{driveCreateError}</span>
                </p>
              )}
            </div>
          </div>

          {/* Section: Data Placeholders */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-800">
                  Data Placeholders ({placeholders.length})
                </label>
                <p className="text-[11px] text-zinc-500">
                  Tags in your Google Doc will be automatically replaced with live tenant/property info.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPlaceholders(COMMON_TAGS)}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold"
              >
                Select All Common Tags
              </button>
            </div>

            {/* Common Tags Chips */}
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 bg-zinc-50 border border-zinc-200 rounded-lg">
              {COMMON_TAGS.map((tag) => {
                const isSelected = placeholders.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    className={`px-2 py-1 rounded text-[11px] font-mono transition-colors flex items-center gap-1 ${
                      isSelected
                        ? 'bg-blue-600 text-white font-semibold shadow-xs'
                        : 'bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                    {tag}
                  </button>
                );
              })}
            </div>

            {/* Custom Tag Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomTag();
                  }
                }}
                placeholder="Add custom tag (e.g. {{pet_deposit}} or pet_deposit)"
                className="flex-1 p-2 bg-white border border-zinc-300 rounded-lg font-mono text-xs text-zinc-900"
              />
              <button
                type="button"
                onClick={handleAddCustomTag}
                className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Tag
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-zinc-200 flex items-center justify-between gap-3">
            <div>
              {editingTemplate?.isCustom && onDelete && (
                <button
                  type="button"
                  id="btn-delete-template"
                  onClick={() => {
                    if (
                      window.confirm(
                        `Are you sure you want to delete the template "${editingTemplate.name}"?`
                      )
                    ) {
                      onDelete(editingTemplate.id);
                      onClose();
                    }
                  }}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Template
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-cancel-template"
                onClick={onClose}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="btn-save-template"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                {editingTemplate ? 'Save Template & Link' : 'Add Template'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
