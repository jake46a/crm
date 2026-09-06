import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Activity,
  Terminal,
  Clock,
  Send,
  RefreshCw,
  Search,
  Filter,
  Copy,
  Check,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Code2,
  FileJson,
  Eye,
  EyeOff,
  ArrowUpRight,
  HelpCircle,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import {
  SquareApiActivityRecord,
  getApiActivityLogs,
  subscribeToApiActivity,
  clearApiActivityLogs,
  testSquareBatchEndpoint,
  isInterceptorEnabled,
  setInterceptorEnabled
} from '../../services/squareInterceptor';

interface ApiActivityLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiActivityLogModal: React.FC<ApiActivityLogModalProps> = ({
  isOpen,
  onClose
}) => {
  const [logs, setLogs] = useState<SquareApiActivityRecord[]>(() => getApiActivityLogs());
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [selectedPayloadTab, setSelectedPayloadTab] = useState<'payload' | 'headers' | 'response'>('payload');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | '405' | 'ERRORS' | 'SUCCESS'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showMaskedTokens, setShowMaskedTokens] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Live test probes
  const [isProbing, setIsProbing] = useState<boolean>(false);
  const [probeFeedback, setProbeFeedback] = useState<string | null>(null);

  // Subscribe to real-time interceptor updates
  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = subscribeToApiActivity((updatedLogs) => {
      setLogs(updatedLogs);
      // Auto-expand first item if none expanded and logs exist
      setExpandedLogId((prev) => {
        if (!prev && updatedLogs.length > 0) return updatedLogs[0].id;
        return prev;
      });
    });

    return unsubscribe;
  }, [isOpen]);

  // Handle escape key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Run a quick probe to generate live real-time API activity immediately
  const handleRunProbe = async (method: 'POST' | 'GET' = 'POST') => {
    setIsProbing(true);
    setProbeFeedback(null);
    try {
      const res = await testSquareBatchEndpoint(method, 1);
      if (res.status === 405) {
        setProbeFeedback(`Probed ${method}: Received HTTP 405 Method Not Allowed (Edge Static Routing)`);
      } else {
        setProbeFeedback(`Probed ${method}: Received HTTP ${res.status} OK`);
      }
    } catch (err: any) {
      setProbeFeedback(`Probe failed: ${err?.message || 'Network error'}`);
    } finally {
      setIsProbing(false);
    }
  };

  // Filter logs based on search, method, and status
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Method filter
      if (methodFilter !== 'ALL' && log.method.toUpperCase() !== methodFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === '405' && !log.is405Error && log.responseStatus !== 405) {
        return false;
      }
      if (statusFilter === 'ERRORS' && log.responseStatus < 400 && !log.error) {
        return false;
      }
      if (statusFilter === 'SUCCESS' && (log.responseStatus >= 400 || !!log.error)) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const inEndpoint = log.endpoint.toLowerCase().includes(query);
        const inMethod = log.method.toLowerCase().includes(query);
        const inStatus = String(log.responseStatus).includes(query);
        const inPayload = JSON.stringify(log.requestPayload || '').toLowerCase().includes(query);
        const inHeaders = JSON.stringify(log.requestHeaders || '').toLowerCase().includes(query);
        const inResponse = JSON.stringify(log.responsePayload || '').toLowerCase().includes(query);
        return inEndpoint || inMethod || inStatus || inPayload || inHeaders || inResponse;
      }

      return true;
    });
  }, [logs, methodFilter, statusFilter, searchQuery]);

  // Statistics
  const totalCount = logs.length;
  const count405 = logs.filter((l) => l.is405Error || l.responseStatus === 405).length;
  const countErrors = logs.filter((l) => (l.responseStatus >= 400 || !!l.error) && l.responseStatus !== 405).length;
  const countSuccess = logs.filter((l) => l.responseStatus >= 200 && l.responseStatus < 300).length;

  // Selected or expanded log record
  const activeLog = useMemo(() => {
    return logs.find((l) => l.id === expandedLogId) || filteredLogs[0] || null;
  }, [logs, expandedLogId, filteredLogs]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-xl shadow-2xl border border-zinc-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="api-activity-modal-title"
      >
        {/* Modal Header */}
        <div className="bg-zinc-900 text-zinc-100 px-5 py-3.5 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 id="api-activity-modal-title" className="text-base font-bold text-white tracking-tight">
                  API Activity Log
                </h2>
                <span className="flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Real-Time Interceptor
                </span>
                {count405 > 0 && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/50 flex items-center gap-1 animate-pulse">
                    <ShieldAlert className="w-3 h-3" />
                    {count405} 405 Method Not Allowed
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Real-time monitor of outgoing Square API calls with full headers, payloads, timings, and HTTP diagnostics.
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Quick Probe Test Button */}
            <button
              id="btn-probe-test-call"
              onClick={() => handleRunProbe('POST')}
              disabled={isProbing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50 shadow-xs"
              title="Send a sample POST request to /api/square/invoices/create-batch to test edge response in real-time"
            >
              {isProbing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Test API Call</span>
            </button>

            {/* Clear Log */}
            <button
              id="btn-clear-api-activity"
              onClick={clearApiActivityLogs}
              disabled={logs.length === 0}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 disabled:opacity-40 transition-colors"
              title="Clear all recorded API activity"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>

            {/* Export JSON */}
            <button
              id="btn-export-api-json"
              onClick={() => handleCopy('all-logs', JSON.stringify(logs, null, 2))}
              disabled={logs.length === 0}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 disabled:opacity-40 transition-colors"
              title="Copy entire activity log to clipboard as JSON"
            >
              {copiedKey === 'all-logs' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedKey === 'all-logs' ? 'Copied' : 'Export'}</span>
            </button>

            {/* Close Button */}
            <button
              id="btn-close-activity-modal"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors ml-1"
              title="Close modal (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Probe Feedback Banner */}
        {probeFeedback && (
          <div className="bg-indigo-950/80 border-b border-indigo-800/60 px-5 py-2 flex items-center justify-between text-xs text-indigo-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
              <span>{probeFeedback}</span>
            </div>
            <button
              onClick={() => setProbeFeedback(null)}
              className="text-indigo-400 hover:text-indigo-200 text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Filters and Search Toolbar */}
        <div className="bg-zinc-50 border-b border-zinc-200 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Status Filter Badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-zinc-500 font-medium mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-zinc-400" />
              <span>Status:</span>
            </span>

            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'bg-zinc-200/70 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              All ({totalCount})
            </button>

            <button
              onClick={() => setStatusFilter('405')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                statusFilter === '405'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : count405 > 0
                  ? 'bg-rose-100 text-rose-800 hover:bg-rose-200 font-bold border border-rose-300'
                  : 'bg-zinc-200/70 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              <ShieldAlert className="w-3 h-3" />
              <span>405 Not Allowed ({count405})</span>
            </button>

            <button
              onClick={() => setStatusFilter('ERRORS')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                statusFilter === 'ERRORS'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'bg-zinc-200/70 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Errors ({countErrors})</span>
            </button>

            <button
              onClick={() => setStatusFilter('SUCCESS')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                statusFilter === 'SUCCESS'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-zinc-200/70 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>2xx OK ({countSuccess})</span>
            </button>

            {/* Method Filter Dropdown */}
            <div className="ml-2 pl-2 border-l border-zinc-300 flex items-center gap-1.5">
              <span className="text-zinc-500 font-medium">Method:</span>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="bg-white border border-zinc-300 rounded px-2 py-0.5 text-xs text-zinc-800 font-medium focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">All Methods</option>
                <option value="POST">POST</option>
                <option value="GET">GET</option>
                <option value="OPTIONS">OPTIONS</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[220px] max-w-sm flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search endpoint, payload, headers..."
              className="w-full pl-8 pr-7 py-1 bg-white border border-zinc-300 rounded-md text-xs text-zinc-800 placeholder-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
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

        {/* Modal Body: Split Table & Troubleshooting Payload Viewer */}
        <div className="flex-1 min-h-[460px] max-h-[62vh] grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-zinc-100">
          {/* Left / Top: Real-Time Table of Recent Square API Calls */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col bg-white border-r border-zinc-200 overflow-hidden">
            <div className="overflow-x-auto overflow-y-auto flex-1">
              <table className="w-full text-left border-collapse text-xs">
                {/* Table Header */}
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-3 w-28 whitespace-nowrap">Timestamp</th>
                    <th className="py-2.5 px-2.5 w-16 whitespace-nowrap">Method</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Requested Endpoint</th>
                    <th className="py-2.5 px-2.5 w-24 whitespace-nowrap">Status Code</th>
                    <th className="py-2.5 px-3 w-20 text-right whitespace-nowrap">Payload</th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-zinc-100">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-zinc-400">
                        <Terminal className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                        <p className="font-semibold text-zinc-700">No API calls recorded</p>
                        <p className="text-zinc-400 text-xs mt-1 max-w-sm mx-auto">
                          {logs.length === 0
                            ? 'No Square API requests have been made yet in this session. Click "Test API Call" above to probe an endpoint now.'
                            : 'No API calls matched your current filter criteria.'}
                        </p>
                        {logs.length === 0 && (
                          <button
                            onClick={() => handleRunProbe('POST')}
                            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-medium text-xs hover:bg-indigo-500 shadow-xs"
                          >
                            <Send className="w-3 h-3" />
                            <span>Probe POST /create-batch</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => {
                      const isSelected = activeLog?.id === log.id;
                      const is405 = log.is405Error || log.responseStatus === 405;
                      const isError = (log.responseStatus >= 400 || !!log.error) && !is405;
                      const isSuccess = log.responseStatus >= 200 && log.responseStatus < 300;

                      return (
                        <tr
                          key={log.id}
                          onClick={() => setExpandedLogId(log.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-indigo-50/90 font-medium'
                              : is405
                              ? 'bg-rose-50/40 hover:bg-rose-50/70'
                              : 'hover:bg-zinc-50'
                          }`}
                        >
                          {/* Column 1: Timestamp */}
                          <td className="py-2.5 px-3 whitespace-nowrap align-top">
                            <div className="font-mono text-zinc-800 text-[11px] font-semibold flex items-center gap-1">
                              <Clock className="w-3 h-3 text-zinc-400" />
                              <span>{log.timestamp}</span>
                            </div>
                            <span className="text-[10px] text-zinc-400 font-mono">
                              {log.durationMs}ms
                            </span>
                          </td>

                          {/* Column 2: Method */}
                          <td className="py-2.5 px-2.5 whitespace-nowrap align-top">
                            <span className={`inline-block text-[10px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                              log.method === 'POST'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : log.method === 'GET'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : log.method === 'OPTIONS'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : log.method === 'DELETE'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-zinc-100 text-zinc-800 border border-zinc-200'
                            }`}>
                              {log.method}
                            </span>
                          </td>

                          {/* Column 3: Requested Endpoint */}
                          <td className="py-2.5 px-3 align-top">
                            <div className="font-mono text-xs text-zinc-900 font-semibold truncate max-w-xs" title={log.fullUrl}>
                              {log.endpoint}
                            </div>
                            <div className="text-[11px] text-zinc-500 truncate max-w-xs">
                              {is405 ? (
                                <span className="text-rose-600 font-medium flex items-center gap-1">
                                  <ShieldAlert className="w-3 h-3" />
                                  Edge 405 Method Not Allowed
                                </span>
                              ) : log.error ? (
                                <span className="text-amber-600 truncate">{log.error}</span>
                              ) : log.requestPayload ? (
                                <span className="text-zinc-500 font-mono text-[10px]">
                                  {typeof log.requestPayload === 'object'
                                    ? Object.keys(log.requestPayload).slice(0, 3).join(', ') + (Object.keys(log.requestPayload).length > 3 ? '...' : '')
                                    : 'String payload'}
                                </span>
                              ) : (
                                <span className="text-zinc-400 text-[10px]">No body sent</span>
                              )}
                            </div>
                          </td>

                          {/* Column 4: Status Code */}
                          <td className="py-2.5 px-2.5 whitespace-nowrap align-top">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                              is405
                                ? 'bg-rose-600 text-white font-black shadow-xs'
                                : isSuccess
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : isError
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-zinc-200 text-zinc-700'
                            }`}>
                              {is405 && <ShieldAlert className="w-3 h-3" />}
                              {isSuccess && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                              {isError && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                              <span>{log.responseStatus || 'ERR'}</span>
                            </span>
                          </td>

                          {/* Column 5: Action / Payload Inspect */}
                          <td className="py-2.5 px-3 text-right whitespace-nowrap align-top">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedLogId(log.id);
                              }}
                              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                                isSelected
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                              }`}
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer with Summary Status */}
            <div className="bg-zinc-50 px-4 py-2 border-t border-zinc-200 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
              <span>Showing {filteredLogs.length} of {totalCount} calls</span>
              <span>Click any row to inspect full troubleshooting payload</span>
            </div>
          </div>

          {/* Right / Bottom: Troubleshooting Payload & Header Inspector */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col bg-white overflow-hidden">
            {activeLog ? (
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Selected Request Header Banner */}
                <div className="p-3.5 bg-zinc-900 text-zinc-100 border-b border-zinc-800">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                        activeLog.method === 'POST'
                          ? 'bg-blue-600 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}>
                        {activeLog.method}
                      </span>
                      <span className="font-mono text-xs font-bold text-white truncate" title={activeLog.fullUrl}>
                        {activeLog.endpoint}
                      </span>
                    </div>

                    <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                      activeLog.is405Error || activeLog.responseStatus === 405
                        ? 'bg-rose-600 text-white font-black'
                        : activeLog.responseStatus >= 200 && activeLog.responseStatus < 300
                        ? 'bg-emerald-500 text-white'
                        : 'bg-amber-600 text-white'
                    }`}>
                      HTTP {activeLog.responseStatus} {activeLog.responseStatusText}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-mono">
                    <span>Duration: <strong className="text-zinc-200">{activeLog.durationMs}ms</strong></span>
                    <span>Time: <strong className="text-zinc-200">{activeLog.timestamp}</strong></span>
                    <span>ID: <strong className="text-zinc-300">{activeLog.id}</strong></span>
                  </div>
                </div>

                {/* HTTP 405 Method Not Allowed Troubleshooting Diagnosis Banner */}
                {(activeLog.is405Error || activeLog.responseStatus === 405) && (
                  <div className="p-3 bg-rose-50 border-b border-rose-200 text-rose-900 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-rose-800">
                      <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>405 Troubleshooting Diagnosis: Cloudflare Edge Static Routing</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-rose-800">
                      Cloudflare Pages static edge rejected HTTP <code>{activeLog.method}</code> on <code>{activeLog.endpoint}</code>.
                      Server Allowed Methods: <code className="font-mono font-bold">{activeLog.responseHeaders['allow'] || activeLog.responseHeaders['Allow'] || 'None specified'}</code>.
                    </p>
                    <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 p-1.5 rounded border border-emerald-200">
                      Automated Recovery: The app routes through the live Cloud Run backend gateway or executes the resilient GET query fallback to complete operations seamlessly.
                    </div>
                  </div>
                )}

                {/* Inspector Tabs */}
                <div className="flex items-center border-b border-zinc-200 bg-zinc-50 px-3 text-xs gap-1">
                  <button
                    onClick={() => setSelectedPayloadTab('payload')}
                    className={`px-3 py-2 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                      selectedPayloadTab === 'payload'
                        ? 'border-indigo-600 text-indigo-600 bg-white'
                        : 'border-transparent text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    <FileJson className="w-3.5 h-3.5" />
                    <span>Full Request Payload</span>
                  </button>

                  <button
                    onClick={() => setSelectedPayloadTab('headers')}
                    className={`px-3 py-2 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                      selectedPayloadTab === 'headers'
                        ? 'border-indigo-600 text-indigo-600 bg-white'
                        : 'border-transparent text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Headers ({Object.keys(activeLog.requestHeaders).length})</span>
                  </button>

                  <button
                    onClick={() => setSelectedPayloadTab('response')}
                    className={`px-3 py-2 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                      selectedPayloadTab === 'response'
                        ? 'border-indigo-600 text-indigo-600 bg-white'
                        : 'border-transparent text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Response Body</span>
                  </button>
                </div>

                {/* Inspector Tab Content */}
                <div className="flex-1 overflow-y-auto p-3.5">
                  {/* TAB 1: FULL REQUEST PAYLOAD SENT */}
                  {selectedPayloadTab === 'payload' && (
                    <div className="flex flex-col h-full gap-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                          <FileJson className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Sent Payload Body (JSON)</span>
                        </span>
                        <button
                          onClick={() => handleCopy('active-payload', JSON.stringify(activeLog.requestPayload, null, 2))}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-medium transition-colors"
                          title="Copy payload to clipboard"
                        >
                          {copiedKey === 'active-payload' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedKey === 'active-payload' ? 'Copied' : 'Copy Payload'}</span>
                        </button>
                      </div>

                      {activeLog.requestPayload ? (
                        <pre className="bg-zinc-900 text-emerald-400 rounded-lg p-3 font-mono text-[11px] overflow-x-auto leading-relaxed flex-1 max-h-[380px] border border-zinc-800">
                          {JSON.stringify(activeLog.requestPayload, null, 2)}
                        </pre>
                      ) : (
                        <div className="p-8 text-center text-zinc-400 bg-zinc-50 rounded-lg border border-zinc-200">
                          <Code2 className="w-6 h-6 mx-auto mb-1.5 text-zinc-300" />
                          <p className="font-medium text-zinc-600">No Request Body Sent</p>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            This {activeLog.method} request did not send a JSON body payload.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: REQUEST HEADERS */}
                  {selectedPayloadTab === 'headers' && (
                    <div className="flex flex-col gap-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Request Headers</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setShowMaskedTokens(!showMaskedTokens)}
                            className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-medium transition-colors"
                            title={showMaskedTokens ? 'Hide sensitive auth tokens' : 'Reveal full token values'}
                          >
                            {showMaskedTokens ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            <span>{showMaskedTokens ? 'Mask Tokens' : 'Reveal Tokens'}</span>
                          </button>
                          <button
                            onClick={() => handleCopy('active-headers', JSON.stringify(activeLog.requestHeaders, null, 2))}
                            className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-medium transition-colors"
                          >
                            {copiedKey === 'active-headers' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedKey === 'active-headers' ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>

                      <div className="bg-zinc-900 text-zinc-200 rounded-lg p-3 font-mono text-[11px] overflow-x-auto border border-zinc-800">
                        <table className="w-full text-left">
                          <tbody>
                            {Object.entries(activeLog.requestHeaders).map(([k, v]) => {
                              const strVal = String(v || '');
                              const isToken = k.toLowerCase().includes('auth') || k.toLowerCase().includes('token');
                              const displayVal = !showMaskedTokens && isToken && strVal.length > 20
                                ? `${strVal.substring(0, 10)}...${strVal.substring(strVal.length - 6)}`
                                : strVal;

                              return (
                                <tr key={k} className="border-b border-zinc-800/60 last:border-none">
                                  <td className="py-1.5 pr-3 text-indigo-300 font-semibold align-top whitespace-nowrap">{k}:</td>
                                  <td className="py-1.5 text-zinc-300 break-all">{displayVal}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: RESPONSE BODY & STATUS */}
                  {selectedPayloadTab === 'response' && (
                    <div className="flex flex-col gap-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                          <Code2 className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Server Response Body</span>
                        </span>
                        <button
                          onClick={() => handleCopy('active-response', typeof activeLog.responsePayload === 'string' ? activeLog.responsePayload : JSON.stringify(activeLog.responsePayload, null, 2))}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-medium transition-colors"
                        >
                          {copiedKey === 'active-response' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedKey === 'active-response' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>

                      {activeLog.error && (
                        <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg font-mono text-xs">
                          <strong>Captured Error:</strong> {activeLog.error}
                        </div>
                      )}

                      <pre className="bg-zinc-900 text-zinc-100 rounded-lg p-3 font-mono text-[11px] overflow-x-auto leading-relaxed max-h-[380px] border border-zinc-800">
                        {typeof activeLog.responsePayload === 'string'
                          ? activeLog.responsePayload
                          : JSON.stringify(activeLog.responsePayload, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-zinc-400 text-xs flex flex-col items-center justify-center h-full">
                <Code2 className="w-8 h-8 text-zinc-300 mb-2" />
                <p className="font-semibold text-zinc-600">Select an API call on the left</p>
                <p className="text-zinc-400 mt-1">
                  Inspect the full request payload, outgoing headers, response codes, and diagnostic advice.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-zinc-50 px-5 py-3 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-zinc-500 font-medium">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span>All outgoing Square requests are automatically recorded and analyzed for 405 Method Not Allowed errors.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 font-medium text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
