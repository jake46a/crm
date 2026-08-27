import React, { useState } from 'react';
import { Database, Download, Upload, Trash2, Check, AlertCircle, X } from 'lucide-react';
import { StorageService } from '../../services/storage';
import { FirebaseService } from '../../services/firebase';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataReload: () => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  onDataReload
}) => {
  const [importJson, setImportJson] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isClearing, setIsClearing] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleExport = () => {
    const data = StorageService.exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Moyer_Property_Management_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatusMsg({ text: 'CRM portfolio exported successfully!', type: 'success' });
  };

  const handleImport = () => {
    if (!importJson.trim()) return;
    const ok = StorageService.importData(importJson);
    if (ok) {
      setStatusMsg({ text: 'Data imported and synced successfully!', type: 'success' });
      setTimeout(() => {
        onDataReload();
        onClose();
      }, 1000);
    } else {
      setStatusMsg({ text: 'Invalid JSON format. Please verify the backup structure.', type: 'error' });
    }
  };

  const handleDeleteAllData = async () => {
    if (window.confirm('Are you sure you want to delete ALL data? This will permanently wipe all properties, rooms, lease renewals, work orders, leads, and contacts from both local storage and the database.')) {
      setIsClearing(true);
      try {
        StorageService.clearAll();
        await FirebaseService.clearAllData();
        setStatusMsg({ text: 'All sample data deleted successfully!', type: 'success' });
        setTimeout(() => {
          onDataReload();
          onClose();
        }, 800);
      } catch (err) {
        console.error('Error clearing data:', err);
        setStatusMsg({ text: 'Cleared local data, but encounter an error with cloud sync.', type: 'error' });
        onDataReload();
      } finally {
        setIsClearing(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-lg w-full shadow-2xl border border-zinc-200 overflow-hidden my-8">
        <div className="bg-zinc-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-amber-500 flex items-center justify-center font-bold text-zinc-950 shadow-xs">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">
                Portfolio Data & Backup Manager
              </h2>
              <p className="text-[11px] text-zinc-400">Export, import, or delete room rentals and lease database</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1">✕</button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {statusMsg && (
            <div className={`p-3 rounded-md font-semibold flex items-center gap-2 ${
              statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {statusMsg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Export section */}
          <div className="bg-zinc-50 p-4 rounded-md border border-zinc-200 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-zinc-900 text-xs">Export Complete CRM State</h3>
                <p className="text-[11px] text-zinc-500">Download all properties, rooms, renewals, work orders, and contacts as JSON</p>
              </div>
              <button
                onClick={handleExport}
                className="flex items-center gap-1 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-md font-bold shadow-xs transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>
            </div>
          </div>

          {/* Import section */}
          <div className="border border-zinc-200 p-4 rounded-md space-y-2">
            <h3 className="font-bold text-zinc-900 text-xs">Import JSON Backup</h3>
            <textarea
              rows={4}
              placeholder="Paste previously exported CRM JSON payload here..."
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md font-mono text-[11px] focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <div className="flex justify-end">
              <button
                onClick={handleImport}
                disabled={!importJson.trim()}
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-md font-bold shadow-xs transition"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Restore from JSON</span>
              </button>
            </div>
          </div>

          {/* Delete all data section */}
          <div className="pt-3 border-t border-zinc-200 flex items-center justify-between bg-rose-50/50 p-3 rounded-md border border-rose-100">
            <div>
              <span className="font-bold text-rose-900 text-xs">Delete All Sample / CRM Data</span>
              <p className="text-[11px] text-rose-600">Permanently wipes all properties, rooms, leads, and work orders</p>
            </div>
            <button
              onClick={handleDeleteAllData}
              disabled={isClearing}
              className="flex items-center gap-1 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-md font-bold text-xs shadow-xs transition whitespace-nowrap"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isClearing ? 'Deleting...' : 'Delete All Data'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
