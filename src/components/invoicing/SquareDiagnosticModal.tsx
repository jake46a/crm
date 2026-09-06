import React, { useState, useEffect } from 'react';
import {
  X,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  Terminal,
  Server,
  MapPin,
  Key,
  ShieldCheck,
  ShieldAlert,
  Building2,
  HelpCircle,
  ExternalLink,
  Code,
  ArrowRight
} from 'lucide-react';
import {
  SquareService,
  SquareDiagnosticResult,
  logDiagnosticReportToConsole,
  getSavedSquareLocationId,
  getSavedSquareEnvironment
} from '../../services/squareService';

interface SquareDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLocationId?: string;
  initialEnvironment?: 'production' | 'sandbox';
  selectedPropertyName?: string;
  selectedPropertyId?: string;
  onAssignLocationToProperty?: (propertyId: string, newLocationId: string) => Promise<void> | void;
}

export const SquareDiagnosticModal: React.FC<SquareDiagnosticModalProps> = ({
  isOpen,
  onClose,
  initialLocationId,
  initialEnvironment,
  selectedPropertyName,
  selectedPropertyId,
  onAssignLocationToProperty
}) => {
  const [testLocationId, setTestLocationId] = useState<string>(
    initialLocationId || getSavedSquareLocationId() || 'LN4WBHANNNZ2Y'
  );
  const [testEnvironment, setTestEnvironment] = useState<'production' | 'sandbox'>(
    initialEnvironment || (getSavedSquareEnvironment() as 'production' | 'sandbox') || 'production'
  );
  const [report, setReport] = useState<SquareDiagnosticResult | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedLogs, setCopiedLogs] = useState<boolean>(false);
  const [consoleLogged, setConsoleLogged] = useState<boolean>(false);
  const [assigningLocation, setAssigningLocation] = useState<boolean>(false);
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null);

  // Sync testLocationId when prop changes
  useEffect(() => {
    if (initialLocationId) {
      setTestLocationId(initialLocationId);
    }
  }, [initialLocationId]);

  const executeDiagnostic = async (targetLocId?: string, targetEnv?: 'production' | 'sandbox') => {
    const loc = targetLocId !== undefined ? targetLocId : testLocationId;
    const env = targetEnv !== undefined ? targetEnv : testEnvironment;

    setIsRunning(true);
    setAssignSuccess(null);
    try {
      const result = await SquareService.runDiagnostics(loc, env);
      setReport(result);
      setConsoleLogged(true);
      setTimeout(() => setConsoleLogged(false), 3000);
    } catch (err) {
      console.error('Failed to run Square diagnostics:', err);
    } finally {
      setIsRunning(false);
    }
  };

  // Run automatically when modal opens
  useEffect(() => {
    if (isOpen) {
      executeDiagnostic();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyReport = () => {
    if (!report) return;
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLogs = () => {
    if (!report?.logs) return;
    navigator.clipboard.writeText(report.logs.join('\n'));
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  const handlePrintConsole = () => {
    if (report) {
      logDiagnosticReportToConsole(report);
      setConsoleLogged(true);
      setTimeout(() => setConsoleLogged(false), 3000);
    }
  };

  const handleAssignRecommendedLocation = async (recLocId: string) => {
    if (!selectedPropertyId || !onAssignLocationToProperty) return;
    setAssigningLocation(true);
    try {
      await onAssignLocationToProperty(selectedPropertyId, recLocId);
      setTestLocationId(recLocId);
      setAssignSuccess(`Assigned verified Location ID "${recLocId}" to ${selectedPropertyName || 'selected property'}!`);
      // Re-run diagnostic with new location
      await executeDiagnostic(recLocId, testEnvironment);
    } catch (err: any) {
      alert(`Error updating property location ID: ${err?.message || err}`);
    } finally {
      setAssigningLocation(false);
    }
  };

  const isHealthy = report?.paymentLink404Analysis?.status === 'HEALTHY';
  const targetVerified = report?.targetLocation?.verified;
  const isPlaceholder = report?.targetLocation?.isPlaceholder;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div 
        id="square-diagnostic-modal"
        className="bg-zinc-900 border border-zinc-700/80 rounded-xl shadow-2xl max-w-4xl w-full my-8 text-zinc-100 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isHealthy ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800' : 'bg-amber-950/80 text-amber-400 border border-amber-800'}`}>
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">Square API Diagnostic & 404 Verification</h2>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                  report?.environment === 'production' 
                    ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50' 
                    : 'bg-amber-900/60 text-amber-300 border border-amber-700/50'
                }`}>
                  {report?.environment || testEnvironment}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Verifies credentials, live API reachability, merchant account, and location ID to diagnose 404 payment links.
              </p>
            </div>
          </div>

          <button
            id="btn-close-square-diagnostic"
            onClick={onClose}
            className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action / Parameter Bar */}
        <div className="px-6 py-3 bg-zinc-950/50 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs flex-1 min-w-[280px]">
            <span className="text-zinc-400 font-medium whitespace-nowrap">Location ID:</span>
            <input
              id="input-diagnostic-location-id"
              type="text"
              value={testLocationId}
              onChange={(e) => setTestLocationId(e.target.value.trim())}
              placeholder="e.g. LN4WBHANNNZ2Y"
              className="px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 font-mono text-xs w-56 focus:outline-hidden focus:border-indigo-500"
            />

            <select
              id="select-diagnostic-environment"
              value={testEnvironment}
              onChange={(e) => {
                const newEnv = e.target.value as 'production' | 'sandbox';
                setTestEnvironment(newEnv);
                executeDiagnostic(testLocationId, newEnv);
              }}
              className="px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 text-xs focus:outline-hidden focus:border-indigo-500"
            >
              <option value="production">Production API</option>
              <option value="sandbox">Sandbox API</option>
            </select>

            <button
              id="btn-run-diagnostic"
              onClick={() => executeDiagnostic()}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium text-xs shadow-xs transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Checking...' : 'Run Diagnostics'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-log-to-console"
              onClick={handlePrintConsole}
              disabled={!report}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded text-xs transition-colors"
              title="Prints structured tables and groups to browser DevTools console"
            >
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>{consoleLogged ? 'Logged to Console!' : 'Log to DevTools'}</span>
            </button>

            <button
              id="btn-copy-diagnostic-report"
              onClick={handleCopyReport}
              disabled={!report}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded text-xs transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied JSON!' : 'Copy Report'}</span>
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 overflow-y-auto grow">
          {/* Status Alert Banner */}
          {report && (
            <div
              className={`p-4 rounded-lg border flex items-start gap-3.5 ${
                isHealthy
                  ? 'bg-emerald-950/30 border-emerald-800/80 text-emerald-200'
                  : 'bg-amber-950/30 border-amber-800/80 text-amber-200'
              }`}
            >
              {isHealthy ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div className="grow">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">
                    {isHealthy
                      ? 'Square API Communication Healthy: Payment Links Ready'
                      : 'Configuration Defect Detected: Risk of 404 Payment Links'}
                  </p>
                  <span className="text-[11px] font-mono opacity-75">
                    {new Date(report.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-xs text-zinc-300 mt-1">
                  {isHealthy
                    ? `Active connection to Square Production (${report.baseUrl}). Verified merchant account "${report.merchant?.businessName || 'Square Merchant'}" and active location "${report.targetLocation.details?.name || report.targetLocation.queriedId}". Generated invoices will create authentic Square payment links.`
                    : 'The current configuration will cause Square API to reject invoice creation, leading to 404 Not Found payment links. Review the root-cause analysis below.'}
                </p>

                {assignSuccess && (
                  <div className="mt-2.5 p-2 bg-emerald-900/40 border border-emerald-700/60 rounded text-xs text-emerald-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{assignSuccess}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4 Pillar Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Card 1: API & Base URL */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3.5">
              <div className="flex items-center justify-between text-zinc-400 text-xs mb-1.5">
                <span className="font-medium">Square API Status</span>
                <Server className="w-3.5 h-3.5 text-zinc-400" />
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${report?.apiPing?.ok ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                <span className="font-semibold text-sm text-zinc-100">
                  {report?.apiPing?.ok ? `HTTP ${report.apiPing.statusCode} OK` : (report?.apiPing?.error || 'Checking...')}
                </span>
              </div>
              <p className="text-[11px] font-mono text-zinc-400 mt-1 truncate" title={report?.baseUrl}>
                {report?.baseUrl ? report.baseUrl.replace('https://', '') : 'connect.squareup.com'}
              </p>
            </div>

            {/* Card 2: Access Token */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3.5">
              <div className="flex items-center justify-between text-zinc-400 text-xs mb-1.5">
                <span className="font-medium">Access Token</span>
                <Key className="w-3.5 h-3.5 text-zinc-400" />
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${report?.hasToken ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                <span className="font-semibold text-sm text-zinc-100">
                  {report?.hasToken ? 'Configured & Active' : 'Missing Token'}
                </span>
              </div>
              <p className="text-[11px] font-mono text-zinc-400 mt-1 truncate" title={report?.maskedToken}>
                {report?.maskedToken || 'No token detected'}
              </p>
            </div>

            {/* Card 3: Merchant Account */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3.5">
              <div className="flex items-center justify-between text-zinc-400 text-xs mb-1.5">
                <span className="font-medium">Square Merchant</span>
                <Building2 className="w-3.5 h-3.5 text-zinc-400" />
              </div>
              <p className="font-semibold text-sm text-zinc-100 truncate" title={report?.merchant?.businessName}>
                {report?.merchant?.businessName || '1070YankStreet.com'}
              </p>
              <p className="text-[11px] font-mono text-zinc-400 mt-1">
                ID: {report?.merchant?.merchantId || '3QSNAY5ZWKYRP'} • {report?.merchant?.currency || 'USD'}
              </p>
            </div>

            {/* Card 4: Location ID Status */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3.5">
              <div className="flex items-center justify-between text-zinc-400 text-xs mb-1.5">
                <span className="font-medium">Target Location ID</span>
                <MapPin className="w-3.5 h-3.5 text-zinc-400" />
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${targetVerified ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                <span className={`font-semibold text-sm ${targetVerified ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {targetVerified ? 'Verified on Square' : (isPlaceholder ? 'Placeholder ID' : 'Not Found')}
                </span>
              </div>
              <p className="text-[11px] font-mono text-zinc-400 mt-1 truncate" title={testLocationId}>
                {testLocationId || 'None'}
              </p>
            </div>
          </div>

          {/* 404 Payment Link Root-Cause Diagnostic Panel */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">404 Payment Link Root-Cause Analysis</h3>
              </div>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded font-semibold ${
                isHealthy ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
              }`}>
                {report?.paymentLink404Analysis?.status || 'ANALYZING'}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {/* Checklist */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {/* Item 1 */}
                <div className="p-2.5 bg-zinc-900 border border-zinc-800/80 rounded-md flex items-start gap-2.5">
                  {report?.hasToken ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-semibold text-zinc-200">1. Production Access Token</span>
                    <p className="text-zinc-400 text-[11px] mt-0.5">
                      {report?.hasToken 
                        ? 'Token present and authorized to mint Square invoices.' 
                        : 'Token missing. Set SQUARE_ACCESS_TOKEN in Cloudflare Pages.'}
                    </p>
                  </div>
                </div>

                {/* Item 2 */}
                <div className="p-2.5 bg-zinc-900 border border-zinc-800/80 rounded-md flex items-start gap-2.5">
                  {targetVerified ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-semibold text-zinc-200">2. Real Merchant Location ID</span>
                    <p className="text-zinc-400 text-[11px] mt-0.5">
                      {targetVerified 
                        ? `"${testLocationId}" matches live Square location: ${report?.targetLocation?.details?.name || '1070'}.`
                        : isPlaceholder
                        ? `"${testLocationId}" is a simulated string (e.g. LOC_SPEER). Square returns NOT_FOUND, causing 404 links!`
                        : `"${testLocationId}" was not found on this Square merchant account.`}
                    </p>
                  </div>
                </div>

                {/* Item 3 */}
                <div className="p-2.5 bg-zinc-900 border border-zinc-800/80 rounded-md flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-zinc-200">3. Environment Alignment</span>
                    <p className="text-zinc-400 text-[11px] mt-0.5">
                      Endpoint ({report?.baseUrl}) matches credentials and merchant account.
                    </p>
                  </div>
                </div>

                {/* Item 4 */}
                <div className="p-2.5 bg-zinc-900 border border-zinc-800/80 rounded-md flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-zinc-200">4. Square Invoice URL Standard</span>
                    <p className="text-zinc-400 text-[11px] mt-0.5">
                      Invoices generate official <code className="text-indigo-300">squareup.com/pay-invoice/...</code> URLs instead of dead <code className="text-rose-300">checkout.square.site/...</code> slugs.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action item if placeholder or invalid location */}
              {(!targetVerified || isPlaceholder) && report?.paymentLink404Analysis?.recommendedLocationId && (
                <div className="p-3 bg-amber-950/40 border border-amber-800/80 rounded-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-2">
                  <div>
                    <p className="font-semibold text-amber-200">
                      Recommended Fix: Use verified Location ID <code className="font-mono bg-zinc-900 px-1.5 py-0.5 rounded text-white">{report.paymentLink404Analysis.recommendedLocationId}</code> (1070)
                    </p>
                    <p className="text-zinc-400 text-[11px] mt-0.5">
                      {selectedPropertyName ? `Assigning this to "${selectedPropertyName}" will ensure all future invoices generate live, working payment links.` : 'Set this location ID on your properties to resolve 404 payment link errors.'}
                    </p>
                  </div>

                  {selectedPropertyId && onAssignLocationToProperty && (
                    <button
                      id="btn-assign-recommended-location"
                      onClick={() => handleAssignRecommendedLocation(report.paymentLink404Analysis.recommendedLocationId)}
                      disabled={assigningLocation}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium text-xs flex items-center gap-1.5 shrink-0 shadow-sm transition-colors disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{assigningLocation ? 'Updating Property...' : `Assign to ${selectedPropertyName || 'Property'}`}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Live Square Merchant Locations Table */}
          {report?.locations && report.locations.length > 0 && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-white">
                    Live Square Locations Registered on Account ({report.locations.length})
                  </h3>
                </div>
                <span className="text-[11px] text-zinc-400">Click &quot;Test Location&quot; to test any ID</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-zinc-900 text-zinc-400 border-b border-zinc-800">
                    <tr>
                      <th className="px-3 py-2 font-medium">Location Name</th>
                      <th className="px-3 py-2 font-medium">Location ID</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                      <th className="px-3 py-2 font-medium">Address</th>
                      <th className="px-3 py-2 font-medium">Credit Card Processing</th>
                      <th className="px-3 py-2 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {report.locations.map((loc) => {
                      const isCurrentlyTested = loc.id === testLocationId;
                      const hasCardProcessing = (loc.capabilities || []).includes('CREDIT_CARD_PROCESSING');
                      return (
                        <tr key={loc.id} className={isCurrentlyTested ? 'bg-indigo-950/20' : 'hover:bg-zinc-900/40'}>
                          <td className="px-3 py-2.5 font-medium text-white flex items-center gap-2">
                            {isCurrentlyTested && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                            <span>{loc.name}</span>
                          </td>
                          <td className="px-3 py-2.5 font-mono text-zinc-300">
                            {loc.id}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              loc.status === 'ACTIVE' 
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                                : 'bg-zinc-800 text-zinc-400'
                            }`}>
                              {loc.status}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-zinc-400 truncate max-w-[200px]">
                            {loc.address?.address_line_1 ? `${loc.address.address_line_1}, ${loc.address.locality || ''} ${loc.address.administrative_district_level_1 || ''}` : 'No address specified'}
                          </td>
                          <td className="px-3 py-2.5">
                            {hasCardProcessing ? (
                              <span className="text-emerald-400 flex items-center gap-1">
                                <Check className="w-3 h-3" /> Enabled
                              </span>
                            ) : (
                              <span className="text-zinc-500">Not Enabled</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setTestLocationId(loc.id);
                                  executeDiagnostic(loc.id, testEnvironment);
                                }}
                                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                                  isCurrentlyTested 
                                    ? 'bg-indigo-600 text-white font-semibold' 
                                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                                }`}
                              >
                                {isCurrentlyTested ? 'Testing Now' : 'Test Location'}
                              </button>

                              {selectedPropertyId && onAssignLocationToProperty && loc.id !== testLocationId && (
                                <button
                                  onClick={() => handleAssignRecommendedLocation(loc.id)}
                                  disabled={assigningLocation}
                                  className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded text-[11px] transition-colors"
                                  title={`Assign ${loc.name} (${loc.id}) to ${selectedPropertyName || 'current property'}`}
                                >
                                  Assign
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Monospace Execution Trace & Logs */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-semibold text-zinc-300">Square Diagnostic Execution Trace</h3>
              </div>
              <button
                onClick={handleCopyLogs}
                className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                {copiedLogs ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedLogs ? 'Copied Trace' : 'Copy Trace'}</span>
              </button>
            </div>

            <div className="bg-black/80 border border-zinc-800 rounded-md p-3 font-mono text-[11px] text-zinc-300 max-h-48 overflow-y-auto space-y-1 select-all">
              {report?.logs && report.logs.length > 0 ? (
                report.logs.map((logLine, idx) => {
                  const isError = logLine.includes('❌') || logLine.includes('HTTP 40') || logLine.includes('HTTP 50');
                  const isSuccess = logLine.includes('✅') || logLine.includes('HTTP 200');
                  const isWarning = logLine.includes('⚠️');
                  return (
                    <div
                      key={idx}
                      className={`${
                        isError
                          ? 'text-rose-400 font-semibold'
                          : isSuccess
                          ? 'text-emerald-300'
                          : isWarning
                          ? 'text-amber-300 font-semibold'
                          : 'text-zinc-400'
                      }`}
                    >
                      {logLine}
                    </div>
                  );
                })
              ) : (
                <div className="text-zinc-500 italic">No logs generated yet. Click &quot;Run Diagnostics&quot; above.</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between shrink-0 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span>Environment Target:</span>
            <span className="font-mono text-zinc-200">
              {report?.environment === 'production' ? 'https://connect.squareup.com' : 'https://connect.squareupsandbox.com'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded font-medium transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
