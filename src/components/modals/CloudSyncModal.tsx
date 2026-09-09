import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  CloudCheck, 
  RefreshCw, 
  UploadCloud, 
  DownloadCloud, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ShieldCheck, 
  LogIn, 
  LogOut,
  Database,
  Layers,
  Server
} from 'lucide-react';
import { useFirebase } from '../../context/FirebaseContext';
import { FirebaseService, testFirestoreConnection } from '../../services/firebase';
import { StorageService } from '../../services/storage';
import firebaseConfig from '../../../firebase-applet-config.json';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataReload?: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  onDataReload
}) => {
  const { user, isFirebaseConnected, syncStatus, signIn, signOut } = useFirebase();
  const [isPushing, setIsPushing] = useState<boolean>(false);
  const [isPulling, setIsPulling] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [localCounts, setLocalCounts] = useState({
    properties: 0,
    rooms: 0,
    renewals: 0,
    workOrders: 0,
    leads: 0,
    contacts: 0,
    invoices: 0
  });

  const loadCounts = () => {
    setLocalCounts({
      properties: StorageService.getProperties().length,
      rooms: StorageService.getRooms().length,
      renewals: StorageService.getRenewals().length,
      workOrders: StorageService.getWorkOrders().length,
      leads: StorageService.getTenantLeads().length,
      contacts: StorageService.getContacts().length,
      invoices: StorageService.getInvoices().length
    });
  };

  useEffect(() => {
    if (isOpen) {
      loadCounts();
      setActionMessage(null);
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const ok = await testFirestoreConnection();
      if (ok) {
        setTestResult({ ok: true, msg: 'Connected to Firestore successfully! Real-time syncing is active.' });
      } else {
        setTestResult({ ok: false, msg: 'Unable to reach Firestore database. Check network or firewall.' });
      }
    } catch (err: any) {
      setTestResult({ ok: false, msg: err?.message || 'Connection test failed.' });
    } finally {
      setIsTesting(false);
    }
  };

  const handlePushToCloud = async () => {
    setIsPushing(true);
    setActionMessage(null);
    try {
      const data = {
        properties: StorageService.getProperties(),
        rooms: StorageService.getRooms(),
        renewals: StorageService.getRenewals(),
        workOrders: StorageService.getWorkOrders(),
        leads: StorageService.getTenantLeads(),
        contacts: StorageService.getContacts(),
        invoices: StorageService.getInvoices(),
        activityLogs: StorageService.getActivityLogs()
      };

      const result = await FirebaseService.syncAllLocalToFirestore(data);
      if (result.success) {
        setActionMessage({
          type: 'success',
          text: `Successfully synced ${result.counts.properties} properties, ${result.counts.rooms} rooms, ${result.counts.renewals} renewals, ${result.counts.workOrders} work orders, and ${result.counts.contacts} contacts to Cloud Firestore!`
        });
        onDataReload?.();
      }
    } catch (err: any) {
      console.error("Error pushing to cloud:", err);
      setActionMessage({
        type: 'error',
        text: `Sync error: ${err?.message || 'Failed to push data to cloud Firestore.'}`
      });
    } finally {
      setIsPushing(false);
    }
  };

  const handlePullFromCloud = async () => {
    setIsPulling(true);
    setActionMessage(null);
    try {
      const cloudData = await FirebaseService.pullAllFromFirestore();
      
      if (cloudData.properties.length > 0) StorageService.saveProperties(cloudData.properties);
      if (cloudData.rooms.length > 0) StorageService.saveRooms(cloudData.rooms);
      if (cloudData.renewals.length > 0) StorageService.saveLeaseRenewals(cloudData.renewals);
      if (cloudData.workOrders.length > 0) StorageService.saveWorkOrders(cloudData.workOrders);
      if (cloudData.leads.length > 0) StorageService.saveTenantLeads(cloudData.leads);
      if (cloudData.contacts.length > 0) StorageService.saveContacts(cloudData.contacts);
      if (cloudData.invoices.length > 0) StorageService.saveInvoices(cloudData.invoices);

      loadCounts();
      setActionMessage({
        type: 'success',
        text: `Restored ${cloudData.properties.length} properties and ${cloudData.rooms.length} rooms directly from Cloud Firestore!`
      });
      onDataReload?.();
    } catch (err: any) {
      console.error("Error pulling from cloud:", err);
      setActionMessage({
        type: 'error',
        text: `Pull error: ${err?.message || 'Failed to fetch latest data from cloud.'}`
      });
    } finally {
      setIsPulling(false);
    }
  };

  const dbId = (firebaseConfig as any).firestoreDatabaseId || 'default';
  const projectId = (firebaseConfig as any).projectId || '';

  return (
    <div className="fixed inset-0 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-lg w-full shadow-2xl border border-zinc-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-zinc-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-indigo-600 flex items-center justify-center font-bold text-white shadow-xs">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">
                Cloud Firestore Synchronization
              </h2>
              <p className="text-[11px] text-zinc-400">Google Cloud Firestore database connection & real-time sync</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Connection Status Banner */}
          <div className={`p-3.5 rounded-md border flex items-center justify-between ${
            syncStatus === 'connected' || isFirebaseConnected
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : syncStatus === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className={`w-2.5 h-2.5 rounded-full ${
                syncStatus === 'connected' || isFirebaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`} />
              <div>
                <p className="font-bold text-xs">
                  {syncStatus === 'connected' || isFirebaseConnected ? 'Real-Time Cloud Sync Active' : 'Connecting to Cloud...'}
                </p>
                <p className="text-[11px] opacity-80">
                  {syncStatus === 'connected' || isFirebaseConnected
                    ? 'All changes are automatically synchronized with Cloud Firestore'
                    : 'Changes are cached locally and will sync as soon as connected'}
                </p>
              </div>
            </div>
            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-zinc-200 hover:bg-zinc-50 rounded text-zinc-700 shadow-2xs transition disabled:opacity-50 flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
              <span>Test</span>
            </button>
          </div>

          {/* Test or Action Message */}
          {testResult && (
            <div className={`p-3 rounded-md font-medium flex items-center gap-2 ${
              testResult.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {testResult.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
              <span>{testResult.msg}</span>
            </div>
          )}

          {actionMessage && (
            <div className={`p-3 rounded-md font-medium flex items-center gap-2 ${
              actionMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {actionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
              <span>{actionMessage.text}</span>
            </div>
          )}

          {/* Cloud Database Info */}
          <div className="bg-zinc-50 rounded-md p-3.5 border border-zinc-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 font-medium">Firestore Database ID:</span>
              <span className="font-mono font-semibold text-zinc-800 text-[11px] truncate max-w-[260px]">{dbId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 font-medium">Google Cloud Project:</span>
              <span className="font-mono text-zinc-700 text-[11px]">{projectId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 font-medium">Transport Protocol:</span>
              <span className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Auto-Detect Long Polling + WebChannel
              </span>
            </div>
          </div>

          {/* Current Local & Cloud Counts Summary */}
          <div className="border border-zinc-200 rounded-md p-3">
            <h4 className="font-bold text-zinc-700 text-xs mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              Synced Data Collections
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-center text-[11px]">
              <div className="bg-zinc-50 p-2 rounded border border-zinc-100">
                <p className="font-bold text-zinc-900 text-sm">{localCounts.properties}</p>
                <p className="text-zinc-500">Properties</p>
              </div>
              <div className="bg-zinc-50 p-2 rounded border border-zinc-100">
                <p className="font-bold text-zinc-900 text-sm">{localCounts.rooms}</p>
                <p className="text-zinc-500">Rooms</p>
              </div>
              <div className="bg-zinc-50 p-2 rounded border border-zinc-100">
                <p className="font-bold text-zinc-900 text-sm">{localCounts.renewals}</p>
                <p className="text-zinc-500">Renewals</p>
              </div>
              <div className="bg-zinc-50 p-2 rounded border border-zinc-100">
                <p className="font-bold text-zinc-900 text-sm">{localCounts.workOrders}</p>
                <p className="text-zinc-500">Work Orders</p>
              </div>
              <div className="bg-zinc-50 p-2 rounded border border-zinc-100">
                <p className="font-bold text-zinc-900 text-sm">{localCounts.leads}</p>
                <p className="text-zinc-500">Leads</p>
              </div>
              <div className="bg-zinc-50 p-2 rounded border border-zinc-100">
                <p className="font-bold text-zinc-900 text-sm">{localCounts.contacts}</p>
                <p className="text-zinc-500">Contacts</p>
              </div>
              <div className="bg-zinc-50 p-2 rounded border border-zinc-100">
                <p className="font-bold text-zinc-900 text-sm">{localCounts.invoices}</p>
                <p className="text-zinc-500">Invoices</p>
              </div>
            </div>
          </div>

          {/* Sync Action Buttons */}
          <div className="pt-1 flex flex-col sm:flex-row gap-2">
            <button
              onClick={handlePushToCloud}
              disabled={isPushing || isPulling}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-3 rounded-md flex items-center justify-center gap-2 shadow-xs transition disabled:opacity-50"
            >
              <UploadCloud className={`w-4 h-4 ${isPushing ? 'animate-bounce' : ''}`} />
              <span>{isPushing ? 'Pushing to Cloud...' : 'Sync Now (Push to Cloud)'}</span>
            </button>
            <button
              onClick={handlePullFromCloud}
              disabled={isPushing || isPulling}
              className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold py-2.5 px-3 rounded-md flex items-center justify-center gap-2 border border-zinc-200 transition disabled:opacity-50"
            >
              <DownloadCloud className={`w-4 h-4 ${isPulling ? 'animate-spin' : ''}`} />
              <span>{isPulling ? 'Pulling from Cloud...' : 'Pull from Cloud'}</span>
            </button>
          </div>

          {/* Auth Section */}
          <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
            <div>
              <p className="font-semibold text-zinc-800">
                {user ? (user.displayName || user.email) : 'Not signed in'}
              </p>
              <p className="text-[10px] text-zinc-500">
                {user ? 'Google Firebase Account Active' : 'Sign in to access user-specific operations'}
              </p>
            </div>
            {user ? (
              <button
                onClick={signOut}
                className="text-rose-600 hover:text-rose-700 font-medium text-xs flex items-center gap-1 p-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                onClick={signIn}
                className="bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs px-2.5 py-1.5 rounded flex items-center gap-1.5 transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In with Google</span>
              </button>
            )}
          </div>
        </div>

        <div className="bg-zinc-50 p-3 border-t border-zinc-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded font-semibold text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
