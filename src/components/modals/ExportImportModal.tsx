import React, { useState } from 'react';
import { Database, Download, Upload, RotateCcw, Check, AlertCircle, X } from 'lucide-react';
import { StorageService } from '../../services/storage';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataReload: () => void;
  onOpenCloudflareD1?: () => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  onDataReload,
  onOpenCloudflareD1
}) => {
  const [importJson, setImportJson] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

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

  const handleClearAllData = () => {
    if (window.confirm('Are you sure you want to permanently clear all properties, rooms, renewals, work orders, leads, and contacts?')) {
      StorageService.resetAll();
      StorageService.saveProperties([]);
      StorageService.saveRooms([]);
      StorageService.saveRenewals([]);
      StorageService.saveWorkOrders([]);
      StorageService.saveLeads([]);
      StorageService.saveContacts([]);
      StorageService.saveActivityLogs([]);
      setStatusMsg({ text: 'All CRM records cleared! Database is now empty.', type: 'success' });
      setTimeout(() => {
        onDataReload();
        onClose();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center font-bold text-slate-950">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">
                Portfolio Data & Backup Manager
              </h2>
              <p className="text-[11px] text-slate-400">Export, import, or reset room rentals and lease database</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {statusMsg && (
            <div className={`p-3 rounded-lg font-semibold flex items-center gap-2 ${
              statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {statusMsg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Cloudflare D1 Integration Banner */}
          {onOpenCloudflareD1 && (
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  D1
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <span>Cloudflare D1 SQL Database</span>
                    <span className="text-[10px] bg-orange-200 text-orange-800 px-1.5 py-0.2 rounded font-semibold uppercase">Edge SQL</span>
                  </h3>
                  <p className="text-[11px] text-slate-600">Sync, push, and query live SQLite tables hosted on Cloudflare</p>
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenCloudflareD1();
                }}
                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold text-xs shadow-xs transition shrink-0"
              >
                Open D1 Manager
              </button>
            </div>
          )}

          {/* Export section */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-xs">Export Complete CRM State</h3>
                <p className="text-[11px] text-slate-500">Download all properties, rooms, renewals, work orders, and contacts as JSON</p>
              </div>
              <button
                onClick={handleExport}
                className="flex items-center gap-1 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold shadow-xs transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>
            </div>
          </div>

          {/* Import section */}
          <div className="border border-slate-200 p-4 rounded-xl space-y-2">
            <h3 className="font-bold text-slate-900 text-xs">Import JSON Backup</h3>
            <textarea
              rows={4}
              placeholder="Paste previously exported CRM JSON payload here..."
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-[11px]"
            />
            <div className="flex justify-end">
              <button
                onClick={handleImport}
                disabled={!importJson.trim()}
                className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 rounded-lg font-bold shadow-xs transition"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Restore from JSON</span>
              </button>
            </div>
          </div>

          {/* Reset section */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800">Clear All CRM Data</span>
              <p className="text-[11px] text-slate-400">Permanently empty all properties, rooms, contacts & records</p>
            </div>
            <button
              onClick={handleClearAllData}
              className="flex items-center gap-1 px-3 py-1.5 border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg font-semibold transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Database</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
