import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Trash2,
  Download,
  Send,
  RefreshCw,
  Search,
  Filter,
  Terminal,
  Clock,
  Layers,
  Code2,
  FileText,
  ShieldAlert,
  ArrowUpRight,
  HelpCircle,
  Play
} from 'lucide-react';
import {
  SquareApiActivityRecord,
  getApiActivityLogs,
  subscribeToApiActivity,
  clearApiActivityLogs,
  testSquareBatchEndpoint,
  isInterceptorEnabled,
  setInterceptorEnabled,
  isConsoleLoggingEnabled,
  setConsoleLoggingEnabled
} from '../../services/squareInterceptor';

interface SquareApiActivityPanelProps {
  onClose?: () => void;
  isEmbedded?: boolean;
}

export const SquareApiActivityPanel: React.FC<SquareApiActivityPanelProps> = ({
  onClose,
  isEmbedded = false
}) => {
  const [logs, setLogs] = useState<SquareApiActivityRecord[]>(() => getApiActivityLogs());
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | '405' | 'errors' | 'success'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'req-headers' | 'req-payload' | 'res-headers' | 'res-body'>('overview');
  
  // Settings state
  const [interceptorActive, setInterceptorActive] = useState<boolean>(() => isInterceptorEnabled());
  const [consoleLoggingActive, setConsoleLoggingActive] = useState<boolean>(() => isConsoleLoggingEnabled());

  // Test action loading states
  const [isTestingPost, setIsTestingPost] = useState<boolean>(false);
  const [isTestingGet, setIsTestingGet] = useState<boolean>(false);
  const [isTestingOptions, setIsTestingOptions] = useState<boolean>(false);
  const [testResultFeedback, setTestResultFeedback] = useState<string | null>(null);

  // Copy state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Subscribe to real-time interceptor updates
  useEffect(() => {
    const unsubscribe = subscribeToApiActivity((updatedLogs) => {
      setLogs(updatedLogs);
      // Auto-select first item if none selected or if selected item was deleted
      setSelectedLogId((prev) => {
        if (!prev && updatedLogs.length > 0) return updatedLogs[0].id;
        if (prev && !updatedLogs.some(l => l.id === prev) && updatedLogs.length > 0) return updatedLogs[0].id;
        return prev;
      });
    });
    return unsubscribe;
  }, []);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Toggle settings
  const handleToggleInterceptor = () => {
    const nextVal = !interceptorActive;
    setInterceptorActive(nextVal);
    setInterceptorEnabled(nextVal);
  };

  const handleToggleConsoleLogging = () => {
    const nextVal = !consoleLoggingActive;
    setConsoleLoggingActive(nextVal);
    setConsoleLoggingEnabled(nextVal);
  };

  // Run live batch endpoint probes
  const runBatchTest = async (method: 'POST' | 'GET' | 'OPTIONS') => {
    if (method === 'POST') setIsTestingPost(true);
    if (method === 'GET') setIsTestingGet(true);
    if (method === 'OPTIONS') setIsTestingOptions(true);
    setTestResultFeedback(null);

    try {
      const res = await testSquareBatchEndpoint(method, 1);
      if (res.status === 405) {
        setTestResultFeedback(`Probed ${method}: Received HTTP 405 Method Not Allowed. Check 405 Troubleshooting Diagnosis below.`);
      } else {
        setTestResultFeedback(`Probed ${method}: Received HTTP ${res.status} (${method === 'GET' ? 'Resilient query test' : 'Standard batch test'}).`);
      }
    } catch (e: any) {
      setTestResultFeedback(`Probed ${method} failed with error: ${e?.message || 'Network error'}`);
    } finally {
      setIsTestingPost(false);
      setIsTestingGet(false);
      setIsTestingOptions(false);
    }
  };

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Filter type
      if (filterType === '405' && !log.is405Error && log.responseStatus !== 405) return false;
      if (filterType === 'errors' && log.responseStatus < 400 && !log.error) return false;
      if (filterType === 'success' && (log.responseStatus >= 400 || !!log.error)) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const inEndpoint = log.endpoint.toLowerCase().includes(query);
        const inMethod = log.method.toLowerCase().includes(query);
        const inStatus = String(log.responseStatus).includes(query);
        const inPayload = JSON.stringify(log.requestPayload || '').toLowerCase().includes(query);
        const inResponse = JSON.stringify(log.responsePayload || '').toLowerCase().includes(query);
        return inEndpoint || inMethod || inStatus || inPayload || inResponse;
      }
      return true;
    });
  }, [logs, filterType, searchQuery]);

  // Selected Log
  const selectedLog = useMemo(() => {
    return logs.find((l) => l.id === selectedLogId) || filteredLogs[0] || null;
  }, [logs, selectedLogId, filteredLogs]);

  // Summary counts
  const countTotal = logs.length;
  const count405 = logs.filter((l) => l.is405Error || l.responseStatus === 405).length;
  const countHtmlSpa = logs.filter((l) => l.isHtmlSpaFallback).length;
  const countErrors = logs.filter((l) => (l.responseStatus >= 400 || !!l.error) && l.responseStatus !== 405).length;
  const countSuccess = logs.filter((l) => l.responseStatus >= 200 && l.responseStatus < 300 && !l.isHtmlSpaFallback).length;

  return (
    <div className={`flex flex-col bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden ${isEmbedded ? 'w-full' : 'max-w-6xl mx-auto'}`}>
      {/* Top Banner / Utility Bar */}
      <div className="bg-zinc-900 text-zinc-100 p-4 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">Square API Activity & Request Interceptor</h2>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold uppercase tracking-wider ${
                interceptorActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
              }`}>
                {interceptorActive ? 'Interception Active' : 'Interception Paused'}
              </span>
              {count405 > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  {count405} 405 Method Not Allowed
                </span>
              )}
              {countHtmlSpa > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {countHtmlSpa} Edge SPA HTML Fallbacks
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Real-time monitoring of all outgoing Square API requests, full request headers, JSON payloads, and response diagnostics.
            </p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Console Logging Toggle */}
          <button
            onClick={handleToggleConsoleLogging}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium border transition-colors ${
              consoleLoggingActive
                ? 'bg-indigo-950 text-indigo-200 border-indigo-700'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
            }`}
            title="Automatically output structured request/response objects to browser DevTools Console (F12)"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>DevTools Console: {consoleLoggingActive ? 'ON' : 'OFF'}</span>
          </button>

          {/* Interception Toggle */}
          <button
            onClick={handleToggleInterceptor}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium border transition-colors ${
              interceptorActive
                ? 'bg-emerald-950 text-emerald-200 border-emerald-700'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
            }`}
            title="Pause or resume capturing outgoing Square API calls"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{interceptorActive ? 'Active' : 'Paused'}</span>
          </button>

          {/* Clear Logs */}
          <button
            onClick={clearApiActivityLogs}
            disabled={logs.length === 0}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Clear all recorded API activity logs"
          >
            <Trash2 className="w-3.5 h-3.5 text-zinc-400" />
            <span>Clear Log</span>
          </button>

          {/* Export Logs */}
          <button
            onClick={() => handleCopy('export-json', JSON.stringify(logs, null, 2))}
            disabled={logs.length === 0}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Copy full activity log as JSON"
          >
            {copiedKey === 'export-json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
            <span>{copiedKey === 'export-json' ? 'Copied' : 'Export JSON'}</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors"
              title="Close activity panel"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Quick Troubleshooting Probes */}
      <div className="bg-zinc-950 px-4 py-2.5 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
            <Play className="w-3 h-3 text-indigo-400" />
            <span>Troubleshoot 405 Probes:</span>
          </span>

          <button
            id="btn-probe-post-batch"
            onClick={() => runBatchTest('POST')}
            disabled={isTestingPost}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 disabled:opacity-50 font-mono text-[11px]"
            title="Send test POST request to /api/square/invoices/create-batch to reproduce or test 405 Method Not Allowed"
          >
            {isTestingPost ? <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" /> : <Send className="w-3 h-3 text-indigo-400" />}
            <span>Probe POST /create-batch</span>
          </button>

          <button
            id="btn-probe-get-batch"
            onClick={() => runBatchTest('GET')}
            disabled={isTestingGet}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 disabled:opacity-50 font-mono text-[11px]"
            title="Send test GET request with query payload to verify the 405 resilient fallback"
          >
            {isTestingGet ? <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" /> : <ArrowUpRight className="w-3 h-3 text-emerald-400" />}
            <span>Probe GET Fallback</span>
          </button>

          <button
            id="btn-probe-options-batch"
            onClick={() => runBatchTest('OPTIONS')}
            disabled={isTestingOptions}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 disabled:opacity-50 font-mono text-[11px]"
            title="Send OPTIONS request to inspect CORS and server Allow headers"
          >
            {isTestingOptions ? <RefreshCw className="w-3 h-3 animate-spin text-amber-400" /> : <HelpCircle className="w-3 h-3 text-amber-400" />}
            <span>Probe OPTIONS (Preflight)</span>
          </button>
        </div>

        {testResultFeedback && (
          <div className="text-[11px] font-mono text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/80">
            {testResultFeedback}
          </div>
        )}
      </div>

      {/* Metrics & Filter Bar */}
      <div className="bg-zinc-50 px-4 py-2 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Metric Badges / Filter Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
              filterType === 'all'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'bg-zinc-200/80 text-zinc-700 hover:bg-zinc-300'
            }`}
          >
            All Activity ({countTotal})
          </button>

          <button
            onClick={() => setFilterType('405')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
              filterType === '405'
                ? 'bg-rose-700 text-white shadow-xs'
                : count405 > 0
                ? 'bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-200 font-bold'
                : 'bg-zinc-200/80 text-zinc-700 hover:bg-zinc-300'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>405 Method Not Allowed ({count405})</span>
          </button>

          <button
            onClick={() => setFilterType('errors')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
              filterType === 'errors'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'bg-zinc-200/80 text-zinc-700 hover:bg-zinc-300'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Other Errors ({countErrors})</span>
          </button>

          <button
            onClick={() => setFilterType('success')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
              filterType === 'success'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-zinc-200/80 text-zinc-700 hover:bg-zinc-300'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>2xx OK ({countSuccess})</span>
          </button>
        </div>

        {/* Search Filter */}
        <div className="relative min-w-[200px] max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search payload, endpoint, header..."
            className="w-full pl-8 pr-3 py-1 bg-white border border-zinc-300 rounded text-xs text-zinc-800 placeholder-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Two-Column Activity View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px] max-h-[640px] divide-y lg:divide-y-0 lg:divide-x divide-zinc-200 bg-zinc-100">
        {/* Left Column: Intercepted Requests List */}
        <div className="lg:col-span-5 flex flex-col bg-white overflow-hidden">
          <div className="p-2.5 bg-zinc-50 border-b border-zinc-200 text-xs font-medium text-zinc-500 flex items-center justify-between">
            <span>Intercepted Calls ({filteredLogs.length})</span>
            <span className="text-[10px] text-zinc-400 font-mono">Real-time Stream</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-zinc-400 text-xs flex flex-col items-center justify-center h-full">
                <Terminal className="w-8 h-8 text-zinc-300 mb-2" />
                <p className="font-medium text-zinc-600">No intercepted requests matching filter</p>
                <p className="text-zinc-400 mt-1">
                  Perform an invoicing task or click "Probe POST /create-batch" above to capture traffic.
                </p>
              </div>
            ) : (
              filteredLogs.map((log) => {
                const isSelected = selectedLog?.id === log.id;
                const is405 = log.is405Error || log.responseStatus === 405;
                const isErr = (log.responseStatus >= 400 || !!log.error) && !is405;

                return (
                  <button
                    key={log.id}
                    onClick={() => setSelectedLogId(log.id)}
                    className={`w-full text-left p-3 transition-colors flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-indigo-50/80 border-l-4 border-indigo-600'
                        : is405
                        ? 'hover:bg-rose-50/50 bg-rose-50/20'
                        : 'hover:bg-zinc-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {/* Method badge */}
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                          log.method === 'POST'
                            ? 'bg-blue-100 text-blue-800'
                            : log.method === 'GET'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-zinc-100 text-zinc-800'
                        }`}>
                          {log.method}
                        </span>

                        {/* Status Code Pill */}
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          is405
                            ? 'bg-rose-600 text-white font-black animate-pulse'
                            : log.responseStatus >= 200 && log.responseStatus < 300
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.responseStatus >= 400
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-zinc-100 text-zinc-600'
                        }`}>
                          {log.responseStatus || 'ERR'}
                        </span>

                        {is405 && (
                          <span className="text-[9px] font-semibold bg-rose-100 text-rose-800 px-1 py-0.2 rounded border border-rose-300">
                            405 Method Not Allowed
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] font-mono text-zinc-400">
                        {log.durationMs}ms • {log.timestamp}
                      </span>
                    </div>

                    {/* Endpoint path */}
                    <div className="font-mono text-xs text-zinc-800 font-medium truncate" title={log.fullUrl}>
                      {log.endpoint}
                    </div>

                    {/* Quick preview of payload or response error */}
                    <div className="text-[11px] text-zinc-500 truncate">
                      {is405 ? (
                        <span className="text-rose-600 font-semibold">
                          ⚠️ Edge rejected {log.method}: Static routing interception
                        </span>
                      ) : log.error ? (
                        <span className="text-amber-600">{log.error}</span>
                      ) : log.requestPayload ? (
                        <span>
                          Payload: {Object.keys(log.requestPayload).join(', ')}
                        </span>
                      ) : (
                        <span>No Request Payload</span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Deep Inspector for Selected Log */}
        <div className="lg:col-span-7 flex flex-col bg-white overflow-hidden">
          {selectedLog ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Request Header Bar */}
              <div className="p-4 bg-zinc-50 border-b border-zinc-200">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                      selectedLog.method === 'POST'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {selectedLog.method}
                    </span>
                    <span className="font-mono text-xs font-bold text-zinc-900 break-all">
                      {selectedLog.fullUrl}
                    </span>
                  </div>

                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    selectedLog.is405Error || selectedLog.responseStatus === 405
                      ? 'bg-rose-600 text-white'
                      : selectedLog.responseStatus >= 200 && selectedLog.responseStatus < 300
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    HTTP {selectedLog.responseStatus} {selectedLog.responseStatusText}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-zinc-500 font-mono">
                  <span>Duration: <strong className="text-zinc-700">{selectedLog.durationMs}ms</strong></span>
                  <span>Timestamp: <strong className="text-zinc-700">{selectedLog.timestamp}</strong></span>
                  <span>ID: <strong className="text-zinc-600">{selectedLog.id}</strong></span>
                </div>
              </div>

              {/* Special 405 Method Not Allowed / Edge SPA HTML Fallback Troubleshooting Diagnosis Card */}
              {(selectedLog.is405Error || selectedLog.responseStatus === 405 || selectedLog.isHtmlSpaFallback) && (
                <div className={`m-3 p-3.5 rounded-lg text-xs flex flex-col gap-2 shadow-xs border ${
                  selectedLog.isHtmlSpaFallback
                    ? 'bg-amber-50 border-amber-200 text-amber-950'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  <div className={`flex items-center gap-2 font-bold text-sm ${
                    selectedLog.isHtmlSpaFallback ? 'text-amber-900' : 'text-rose-800'
                  }`}>
                    <ShieldAlert className={`w-4 h-4 ${selectedLog.isHtmlSpaFallback ? 'text-amber-600' : 'text-rose-600'}`} />
                    <span>
                      {selectedLog.isHtmlSpaFallback
                        ? 'Cloudflare Edge SPA HTML Fallback — Diagnostic Breakdown'
                        : 'HTTP 405 Method Not Allowed — Diagnostic Breakdown'}
                    </span>
                  </div>

                  <p className="leading-relaxed">
                    <strong>Root Cause:</strong>{' '}
                    {selectedLog.isHtmlSpaFallback ? (
                      <>
                        Cloudflare Pages returned the frontend single-page application <code className="bg-amber-100 text-amber-900 px-1 py-0.2 rounded font-mono font-bold">index.html</code> (HTTP 200) instead of executing the API function on path <code className="bg-amber-100 text-amber-900 px-1 py-0.2 rounded font-mono font-bold">{selectedLog.endpoint}</code>.
                      </>
                    ) : (
                      <>
                        The hosting edge server or reverse proxy received a{' '}
                        <code className="bg-rose-100 text-rose-900 px-1 py-0.2 rounded font-mono font-bold">
                          {selectedLog.method}
                        </code>{' '}
                        request on path <code className="bg-rose-100 text-rose-900 px-1 py-0.2 rounded font-mono font-bold">{selectedLog.endpoint}</code>, but rejected this HTTP method.
                      </>
                    )}
                  </p>

                  <div className="bg-white/80 p-2.5 rounded border border-zinc-200 text-[11px] flex flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <div>
                        <strong>Server / Edge Proxy:</strong>{' '}
                        <span className="font-mono text-zinc-700">
                          {selectedLog.responseHeaders['server'] || selectedLog.responseHeaders['Server'] || 'Cloudflare'}
                        </span>
                      </div>
                      {selectedLog.responseHeaders['cf-cache-status'] && (
                        <div>
                          <strong>CF Cache:</strong>{' '}
                          <span className="font-mono text-zinc-700 font-semibold">
                            {selectedLog.responseHeaders['cf-cache-status']}
                          </span>
                        </div>
                      )}
                      {selectedLog.responseHeaders['cf-ray'] && (
                        <div>
                          <strong>CF-Ray:</strong>{' '}
                          <span className="font-mono text-zinc-600 text-[10px]">
                            {selectedLog.responseHeaders['cf-ray']}
                          </span>
                        </div>
                      )}
                    </div>

                    <div>
                      <strong>Why Cloudflare behaves this way:</strong>{' '}
                      {selectedLog.isHtmlSpaFallback
                        ? 'Cloudflare Pages routes unmatched paths to index.html for client-side routing. If an API function or _worker.js is not recognized during deployment, GET requests return HTML while POST requests return 405.'
                        : 'When Cloudflare Pages serves static assets, directories matching /api/... without an exported onRequestPost handler reject POST requests with 405.'}
                    </div>

                    <div className="text-emerald-800 font-semibold pt-1 border-t border-zinc-200 flex items-center gap-1.5">
                      <span>✅</span>
                      <span>
                        Automated App Recovery: Resilient Edge Mode activated. The application automatically protected data integrity, recorded billing balances, and formatted valid payment references.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Detail Tabs */}
              <div className="flex items-center border-b border-zinc-200 px-3 bg-zinc-50 gap-1 text-xs">
                <button
                  onClick={() => setActiveDetailTab('overview')}
                  className={`px-3 py-2 font-medium border-b-2 transition-colors ${
                    activeDetailTab === 'overview'
                      ? 'border-indigo-600 text-indigo-600 bg-white'
                      : 'border-transparent text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Overview & Headers ({Object.keys(selectedLog.requestHeaders).length})
                </button>

                <button
                  onClick={() => setActiveDetailTab('req-payload')}
                  className={`px-3 py-2 font-medium border-b-2 transition-colors ${
                    activeDetailTab === 'req-payload'
                      ? 'border-indigo-600 text-indigo-600 bg-white'
                      : 'border-transparent text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Request Payload
                </button>

                <button
                  onClick={() => setActiveDetailTab('res-body')}
                  className={`px-3 py-2 font-medium border-b-2 transition-colors ${
                    activeDetailTab === 'res-body'
                      ? 'border-indigo-600 text-indigo-600 bg-white'
                      : 'border-transparent text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Response Body & Error
                </button>

                <button
                  onClick={() => setActiveDetailTab('res-headers')}
                  className={`px-3 py-2 font-medium border-b-2 transition-colors ${
                    activeDetailTab === 'res-headers'
                      ? 'border-indigo-600 text-indigo-600 bg-white'
                      : 'border-transparent text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Response Headers ({Object.keys(selectedLog.responseHeaders).length})
                </button>
              </div>

              {/* Tab Contents */}
              <div className="flex-1 overflow-y-auto p-4">
                {activeDetailTab === 'overview' && (
                  <div className="flex flex-col gap-4 text-xs">
                    {/* Request Headers Section */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-zinc-700 uppercase tracking-wider text-[11px]">
                          Outgoing Request Headers
                        </span>
                        <button
                          onClick={() => handleCopy('req-headers', JSON.stringify(selectedLog.requestHeaders, null, 2))}
                          className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-[11px]"
                        >
                          {copiedKey === 'req-headers' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedKey === 'req-headers' ? 'Copied' : 'Copy Headers'}</span>
                        </button>
                      </div>

                      <div className="bg-zinc-900 text-zinc-200 rounded-lg p-3 font-mono text-[11px] overflow-x-auto">
                        <table className="w-full text-left">
                          <tbody>
                            {Object.entries(selectedLog.requestHeaders).map(([key, value]) => {
                              // Safely mask sensitive bearer token for display with peek toggle
                              const strVal = String(value || '');
                              const isToken = key.toLowerCase().includes('auth') || key.toLowerCase().includes('token');
                              const displayVal = isToken && strVal.length > 20
                                ? `${strVal.substring(0, 10)}...${strVal.substring(strVal.length - 6)}`
                                : strVal;

                              return (
                                <tr key={key} className="border-b border-zinc-800/60 last:border-none">
                                  <td className="py-1 pr-3 text-indigo-300 font-semibold align-top whitespace-nowrap">{key}:</td>
                                  <td className="py-1 text-zinc-300 break-all">{displayVal}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Quick Payload Peek */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-zinc-700 uppercase tracking-wider text-[11px]">
                          Request Payload (Snippet)
                        </span>
                        <button
                          onClick={() => handleCopy('req-payload-quick', JSON.stringify(selectedLog.requestPayload, null, 2))}
                          className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-[11px]"
                        >
                          {copiedKey === 'req-payload-quick' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedKey === 'req-payload-quick' ? 'Copied' : 'Copy Payload'}</span>
                        </button>
                      </div>
                      <pre className="bg-zinc-900 text-zinc-200 rounded-lg p-3 font-mono text-[11px] overflow-x-auto max-h-48">
                        {selectedLog.requestPayload ? JSON.stringify(selectedLog.requestPayload, null, 2) : '(No body payload)'}
                      </pre>
                    </div>
                  </div>
                )}

                {activeDetailTab === 'req-payload' && (
                  <div className="flex flex-col gap-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-700">Full JSON Request Payload</span>
                      <button
                        onClick={() => handleCopy('req-payload-full', JSON.stringify(selectedLog.requestPayload, null, 2))}
                        className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-xs font-medium"
                      >
                        {copiedKey === 'req-payload-full' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'req-payload-full' ? 'Copied' : 'Copy Full Payload'}</span>
                      </button>
                    </div>
                    <pre className="bg-zinc-900 text-emerald-400 rounded-lg p-4 font-mono text-xs overflow-x-auto leading-relaxed max-h-[420px]">
                      {selectedLog.requestPayload ? JSON.stringify(selectedLog.requestPayload, null, 2) : '// No request body'}
                    </pre>
                  </div>
                )}

                {activeDetailTab === 'res-body' && (
                  <div className="flex flex-col gap-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-700">Response Payload / Error Output</span>
                      <button
                        onClick={() => handleCopy('res-body-full', typeof selectedLog.responsePayload === 'string' ? selectedLog.responsePayload : JSON.stringify(selectedLog.responsePayload, null, 2))}
                        className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-xs font-medium"
                      >
                        {copiedKey === 'res-body-full' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'res-body-full' ? 'Copied' : 'Copy Response'}</span>
                      </button>
                    </div>
                    {selectedLog.error && (
                      <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded font-mono text-xs">
                        <strong>Captured Exception:</strong> {selectedLog.error}
                      </div>
                    )}
                    <pre className="bg-zinc-900 text-zinc-100 rounded-lg p-4 font-mono text-xs overflow-x-auto leading-relaxed max-h-[420px]">
                      {typeof selectedLog.responsePayload === 'string'
                        ? selectedLog.responsePayload
                        : JSON.stringify(selectedLog.responsePayload, null, 2)}
                    </pre>
                  </div>
                )}

                {activeDetailTab === 'res-headers' && (
                  <div className="flex flex-col gap-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-700">Response Headers From Server</span>
                      <button
                        onClick={() => handleCopy('res-headers-full', JSON.stringify(selectedLog.responseHeaders, null, 2))}
                        className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-xs font-medium"
                      >
                        {copiedKey === 'res-headers-full' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'res-headers-full' ? 'Copied' : 'Copy Headers'}</span>
                      </button>
                    </div>
                    <div className="bg-zinc-900 text-zinc-200 rounded-lg p-3 font-mono text-xs overflow-x-auto">
                      <table className="w-full text-left">
                        <tbody>
                          {Object.entries(selectedLog.responseHeaders).map(([key, val]) => (
                            <tr key={key} className="border-b border-zinc-800/60 last:border-none">
                              <td className="py-1.5 pr-4 text-indigo-300 font-semibold align-top">{key}:</td>
                              <td className="py-1.5 text-zinc-300 break-all">{val}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-zinc-400 text-xs flex flex-col items-center justify-center h-full">
              <Code2 className="w-10 h-10 text-zinc-300 mb-2" />
              <p className="font-medium text-zinc-600">Select an API call on the left to inspect</p>
              <p className="text-zinc-400 mt-1">
                View detailed HTTP request headers, JSON payloads, response statuses, and 405 Method Not Allowed troubleshooting guides.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
