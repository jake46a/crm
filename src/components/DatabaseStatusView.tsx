import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  DownloadCloud,
  Play,
  Terminal,
  Activity,
  Layers,
  Table,
  Zap,
  Gauge,
  Check,
  Copy,
  Clock,
  HardDrive,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';
import { D1ClientService } from '../services/d1Client';
import {
  D1StatusResponse,
  Property,
  Room,
  LeaseRenewal,
  WorkOrder,
  TenantLead,
  Contact,
  ActivityLog,
  NavigationTab
} from '../types';

interface QueryLogItem {
  id: string;
  sql: string;
  durationMs: number;
  rowsCount: number;
  rowsRead?: number;
  rowsWritten?: number;
  timestamp: string;
  status: 'success' | 'error';
  error?: string;
}

interface BenchmarkItem {
  name: string;
  description: string;
  sql: string;
  latencyMs?: number;
  rowsRead?: number;
  status?: 'pending' | 'running' | 'success' | 'error';
  error?: string;
}

interface DatabaseStatusViewProps {
  properties: Property[];
  rooms: Room[];
  renewals: LeaseRenewal[];
  workOrders: WorkOrder[];
  leads: TenantLead[];
  contacts: Contact[];
  activityLogs: ActivityLog[];
  onDataLoadedFromD1: (data: {
    properties: Property[];
    rooms: Room[];
    renewals: LeaseRenewal[];
    workOrders: WorkOrder[];
    leads: TenantLead[];
    contacts: Contact[];
    activityLogs: ActivityLog[];
  }) => void;
  onShowToast: (msg: string) => void;
  onSelectTab: (tab: NavigationTab) => void;
}

export const DatabaseStatusView: React.FC<DatabaseStatusViewProps> = ({
  properties,
  rooms,
  renewals,
  workOrders,
  leads,
  contacts,
  activityLogs,
  onDataLoadedFromD1,
  onShowToast,
  onSelectTab
}) => {
  const [status, setStatus] = useState<D1StatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [autoPoll, setAutoPoll] = useState<boolean>(false);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Active view tab inside Database Status
  const [activeSection, setActiveSection] = useState<'overview' | 'queries' | 'benchmark' | 'tables' | 'sync'>('overview');

  // Query console state
  const [customSql, setCustomSql] = useState<string>('SELECT name FROM sqlite_master WHERE type="table";');
  const [queryResult, setQueryResult] = useState<{ rows?: any[]; meta?: any; error?: string; durationMs?: number } | null>(null);
  const [runningQuery, setRunningQuery] = useState<boolean>(false);
  const [queryLogs, setQueryLogs] = useState<QueryLogItem[]>([]);

  // Benchmarks state
  const [benchmarks, setBenchmarks] = useState<BenchmarkItem[]>([
    {
      name: 'Ping & Server Clock',
      description: 'Single-row edge ping measuring cold/warm round-trip latency',
      sql: "SELECT 1 as ping, datetime('now') as server_utc;"
    },
    {
      name: 'SQLite Master Index Scan',
      description: 'Reads schema metadata for all user-created tables and indexes',
      sql: "SELECT type, name, tbl_name FROM sqlite_master WHERE type IN ('table', 'index') AND name NOT LIKE 'sqlite_%';"
    },
    {
      name: 'Properties & Rooms Aggregation',
      description: 'Executes relational join query between properties and rooms table',
      sql: 'SELECT p.name as property_name, count(r.id) as room_count, avg(r.target_rent) as avg_rent FROM properties p LEFT JOIN rooms r ON p.id = r.property_id GROUP BY p.id;'
    },
    {
      name: 'Work Orders Status Breakdown',
      description: 'Groups maintenance tickets by priority and current resolution state',
      sql: 'SELECT priority, status, count(*) as ticket_count FROM work_orders GROUP BY priority, status;'
    },
    {
      name: 'Leads Stage Pipeline Funnel',
      description: 'Scans leads pipeline distribution and calculates average max budget',
      sql: 'SELECT stage, count(*) as count, round(avg(budget_max), 2) as avg_budget FROM leads GROUP BY stage;'
    }
  ]);
  const [runningBenchmark, setRunningBenchmark] = useState<boolean>(false);

  // Fetch status callback
  const fetchStatus = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const res = await D1ClientService.checkStatus();
    setStatus(res);
    setLastCheckedAt(new Date());
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Auto-polling effect (every 15 seconds if enabled)
  useEffect(() => {
    if (!autoPoll) return;
    const interval = setInterval(() => {
      fetchStatus(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [autoPoll, fetchStatus]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleInitSchema = async () => {
    setSyncing(true);
    const startTime = performance.now();
    const res = await D1ClientService.initSchema();
    const durationMs = Math.round(performance.now() - startTime);

    if (res.success) {
      onShowToast('Cloudflare D1 tables initialized successfully!');
      setQueryLogs(prev => [
        {
          id: Math.random().toString(36).substring(2, 9),
          sql: 'CREATE TABLE IF NOT EXISTS [7 schema tables] ...',
          durationMs,
          rowsCount: 7,
          timestamp: new Date().toLocaleTimeString(),
          status: 'success'
        },
        ...prev
      ]);
      await fetchStatus();
    } else {
      alert(`Schema Init Failed: ${res.error}`);
    }
    setSyncing(false);
  };

  const handleRunQuery = async (overrideSql?: string) => {
    const queryToRun = (overrideSql || customSql).trim();
    if (!queryToRun) return;

    setRunningQuery(true);
    setQueryResult(null);
    const startTime = performance.now();

    const res = await D1ClientService.runQuery(queryToRun);
    const durationMs = Math.round(performance.now() - startTime);

    if (res.success) {
      const rows = res.rows || [];
      const meta = res.meta || {};
      setQueryResult({ rows, meta, durationMs });

      setQueryLogs(prev => [
        {
          id: Math.random().toString(36).substring(2, 9),
          sql: queryToRun,
          durationMs,
          rowsCount: rows.length,
          rowsRead: meta.rows_read,
          rowsWritten: meta.rows_written,
          timestamp: new Date().toLocaleTimeString(),
          status: 'success'
        },
        ...prev.slice(0, 49) // Keep last 50 queries
      ]);
    } else {
      setQueryResult({ error: res.error || 'Query failed', durationMs });
      setQueryLogs(prev => [
        {
          id: Math.random().toString(36).substring(2, 9),
          sql: queryToRun,
          durationMs,
          rowsCount: 0,
          timestamp: new Date().toLocaleTimeString(),
          status: 'error',
          error: res.error
        },
        ...prev.slice(0, 49)
      ]);
    }
    setRunningQuery(false);
  };

  const handleRunAllBenchmarks = async () => {
    if (!status?.connected) {
      alert('Please ensure Cloudflare D1 is connected before running performance benchmarks.');
      return;
    }

    setRunningBenchmark(true);
    const updated = [...benchmarks];

    for (let i = 0; i < updated.length; i++) {
      updated[i].status = 'running';
      setBenchmarks([...updated]);

      const startTime = performance.now();
      const res = await D1ClientService.runQuery(updated[i].sql);
      const duration = Math.round(performance.now() - startTime);

      if (res.success) {
        updated[i].status = 'success';
        updated[i].latencyMs = duration;
        updated[i].rowsRead = res.meta?.rows_read ?? (res.rows?.length || 0);
        updated[i].error = undefined;
      } else {
        updated[i].status = 'error';
        updated[i].latencyMs = duration;
        updated[i].error = res.error || 'Execution failed';
      }
      setBenchmarks([...updated]);
    }

    setRunningBenchmark(false);
    onShowToast('Performance benchmarks completed successfully!');
  };

  const handlePushToD1 = async () => {
    if (!confirm('Push all current CRM records into your Cloudflare D1 database?')) return;
    setSyncing(true);
    const res = await D1ClientService.pushDataset({
      properties,
      rooms,
      renewals,
      workOrders,
      leads,
      contacts,
      activityLogs
    });

    if (res.success) {
      onShowToast('Pushed all CRM data to Cloudflare D1!');
      await fetchStatus();
    } else {
      alert(`Sync to D1 Failed: ${res.error}`);
    }
    setSyncing(false);
  };

  const handlePullFromD1 = async () => {
    if (!confirm('Pull and overwrite local CRM state with data from Cloudflare D1?')) return;
    setSyncing(true);
    const res = await D1ClientService.pullDataset();
    if (res.success && res.data) {
      onDataLoadedFromD1(res.data);
      onShowToast('Successfully synced state from Cloudflare D1!');
      await fetchStatus();
    } else {
      alert(`Pull from D1 Failed: ${res.error}`);
    }
    setSyncing(false);
  };

  // Table Definitions
  const tableDefinitions = [
    { name: 'properties', label: 'Properties & Estates', localCount: properties.length, description: 'Master property portfolios, rules, and financials' },
    { name: 'rooms', label: 'Coliving Rooms & Suites', localCount: rooms.length, description: 'Individual room units, rents, utilities & occupancy' },
    { name: 'renewals', label: 'Lease Renewals Engine', localCount: renewals.length, description: 'Lease expiration schedules, proposed terms, and notices' },
    { name: 'work_orders', label: 'Maintenance Work Orders', localCount: workOrders.length, description: 'Repair tickets, contractor dispatches, and costings' },
    { name: 'leads', label: 'Tenant Leads Pipeline', localCount: leads.length, description: 'Prospective tenant inquiries, stages, and budgets' },
    { name: 'contacts', label: 'Contacts & Contractors', localCount: contacts.length, description: 'Directory of vendors, agents, tenants, and staff' },
    { name: 'activity_logs', label: 'Audit & Activity Logs', localCount: activityLogs.length, description: 'Operational change history and timestamps' }
  ];

  const totalD1Rows = status?.tableCounts
    ? (Object.values(status.tableCounts) as number[]).reduce((acc, curr) => (acc || 0) + (curr || 0), 0)
    : 0;

  const totalLocalRows =
    properties.length +
    rooms.length +
    renewals.length +
    workOrders.length +
    leads.length +
    contacts.length +
    activityLogs.length;

  const presetQueries = [
    { label: 'List All Tables', sql: "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';" },
    { label: 'Active Properties', sql: 'SELECT id, name, address, city, total_rooms FROM properties LIMIT 10;' },
    { label: 'Available Rooms', sql: "SELECT room_number, room_name, property_name, target_rent, status FROM rooms WHERE status='Available';" },
    { label: 'High Priority Work Orders', sql: "SELECT ticket_number, title, priority, status, category FROM work_orders WHERE priority IN ('Emergency', 'High');" },
    { label: 'Upcoming Renewals', sql: 'SELECT tenant_name, property_name, room_number, lease_end_date, days_until_expiration, proposed_rent FROM renewals ORDER BY days_until_expiration ASC LIMIT 10;' },
    { label: 'Recent Activity Logs', sql: 'SELECT actor, action, timestamp FROM activity_logs ORDER BY timestamp DESC LIMIT 10;' }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Header */}
      <div className="bg-slate-900 text-white p-6 rounded-sm border border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-sm bg-orange-500/20 border border-orange-500/30 text-orange-300 text-[10px] font-bold uppercase tracking-wider mb-2">
            <Database className="w-3.5 h-3.5" />
            <span>Cloudflare D1 Serverless SQL Telemetry</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <span>Database Status & Performance</span>
            {status?.connected && (
              <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Edge Active
              </span>
            )}
          </h1>
          <p className="text-slate-400 text-xs mt-1 max-w-2xl">
            Real-time query performance metrics, edge latency telemetry, table schemas, and two-way synchronisation between Moyer CRM and Cloudflare D1.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setAutoPoll(!autoPoll)}
            className={`px-3 py-1.5 rounded-sm text-xs font-semibold border flex items-center gap-1.5 transition ${
              autoPoll
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="Toggle continuous 15s edge health check"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Auto-Poll {autoPoll ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => fetchStatus(false)}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-sm text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white flex items-center gap-1.5 shadow-xs transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Probing...' : 'Refresh Status'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white p-2 rounded-sm shadow-2xs overflow-x-auto">
        <button
          onClick={() => setActiveSection('overview')}
          className={`px-3.5 py-2 text-xs font-bold rounded-sm flex items-center gap-2 transition ${
            activeSection === 'overview'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Gauge className="w-4 h-4" />
          <span>Status & Metrics</span>
        </button>

        <button
          onClick={() => setActiveSection('benchmark')}
          className={`px-3.5 py-2 text-xs font-bold rounded-sm flex items-center gap-2 transition ${
            activeSection === 'benchmark'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Performance Benchmarks</span>
        </button>

        <button
          onClick={() => setActiveSection('queries')}
          className={`px-3.5 py-2 text-xs font-bold rounded-sm flex items-center gap-2 transition ${
            activeSection === 'queries'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Query Console & Logs</span>
        </button>

        <button
          onClick={() => setActiveSection('tables')}
          className={`px-3.5 py-2 text-xs font-bold rounded-sm flex items-center gap-2 transition ${
            activeSection === 'tables'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Table className="w-4 h-4" />
          <span>Tables & Schema</span>
        </button>

        <button
          onClick={() => setActiveSection('sync')}
          className={`px-3.5 py-2 text-xs font-bold rounded-sm flex items-center gap-2 transition ${
            activeSection === 'sync'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          <span>Sync & Replication</span>
        </button>
      </div>

      {/* SECTION 1: OVERVIEW & PERFORMANCE METRICS */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          {/* Top Edge Health Banner */}
          <div
            className={`p-5 rounded-sm border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
              status?.connected
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                : status?.configured
                ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`w-12 h-12 rounded-sm flex items-center justify-center shrink-0 ${
                  status?.connected
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : status?.configured
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-slate-500 text-white shadow-xs'
                }`}
              >
                {status?.connected ? (
                  <CheckCircle2 className="w-7 h-7" />
                ) : status?.configured ? (
                  <AlertTriangle className="w-7 h-7" />
                ) : (
                  <Database className="w-7 h-7" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="font-bold text-base">
                    {status?.connected
                      ? 'Cloudflare D1 Database Online & Operational'
                      : status?.configured
                      ? 'D1 Configuration Detected — Connection Issue'
                      : 'Cloudflare D1 Ready to Connect'}
                  </h2>
                  {status?.connected && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Ping: {status.latencyMs} ms
                    </span>
                  )}
                  {status?.schemaReady && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                      Schema Verified (7 Tables)
                    </span>
                  )}
                </div>
                <p className="text-xs mt-1 text-slate-600">
                  {status?.connected
                    ? `Active edge node connection to database UUID: ${status.databaseId}. Server UTC time: ${status.serverTime}`
                    : status?.error ||
                      'Configure CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_DATABASE_ID, and CLOUDFLARE_API_TOKEN in environment variables.'}
                </p>
                {lastCheckedAt && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Last probe: {lastCheckedAt.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {status?.connected ? (
                <button
                  onClick={handleInitSchema}
                  disabled={syncing}
                  className="px-3.5 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-sm transition flex items-center gap-1.5 shadow-xs"
                >
                  <Layers className="w-4 h-4" />
                  <span>{syncing ? 'Verifying...' : 'Verify Schema'}</span>
                </button>
              ) : (
                <button
                  onClick={() => setActiveSection('sync')}
                  className="px-3.5 py-2 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-sm transition flex items-center gap-1.5 shadow-xs"
                >
                  <Info className="w-4 h-4" />
                  <span>Fix Authorization</span>
                </button>
              )}
            </div>
          </div>

          {/* Diagnostic Box for Cloudflare Error 7403 / Auth Errors */}
          {status?.error && (
            <div className="p-5 bg-amber-50/90 border border-amber-200 rounded-sm space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>How to Resolve Cloudflare Error 7403 (Unauthorized / Invalid Account)</span>
              </div>
              <div className="text-xs text-amber-950/90 space-y-2">
                <p>
                  Cloudflare returned error <strong>7403</strong>: <em>The given account is not valid or is not authorized to access this service</em>. This occurs when your API Token or Account ID does not match:
                </p>
                <ol className="list-decimal list-inside space-y-1.5 pl-1 text-[11px] leading-relaxed">
                  <li>
                    <strong>Verify Account ID</strong>: In the Cloudflare Dashboard URL or sidebar, copy the 32-character hexadecimal <strong>Account ID</strong> (e.g. <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">dash.cloudflare.com/&lt;ACCOUNT_ID&gt;</code>) and ensure it matches <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">CLOUDFLARE_ACCOUNT_ID</code> without extra spaces or quotes.
                  </li>
                  <li>
                    <strong>Check API Token Permissions</strong>: Go to <strong>My Profile &rarr; API Tokens &rarr; Create Custom Token</strong>:
                    <ul className="list-disc list-inside pl-4 mt-0.5 text-amber-900 font-medium">
                      <li>Permissions: <code className="bg-amber-100 px-1 rounded">Account &gt; D1 &gt; Edit</code></li>
                      <li>Account Resources: <code className="bg-amber-100 px-1 rounded">Include &gt; All accounts</code> (or select your specific account name)</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Verify Database UUID</strong>: Ensure <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">CLOUDFLARE_DATABASE_ID</code> is the UUID shown on the D1 Database details page.
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Ping & Response Speed */}
            <div className="p-4 bg-white border border-slate-200 rounded-sm shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Edge Ping Latency</span>
                <Clock className="w-4 h-4 text-orange-500" />
              </div>
              <p className="text-2xl font-light text-slate-900 mt-1">
                {status?.connected ? `${status.latencyMs} ms` : '—'}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                <CheckCircle2 className="w-3 h-3" />
                <span>Sub-150ms HTTP/3 Edge Routing</span>
              </div>
            </div>

            {/* D1 Table Sync Count */}
            <div className="p-4 bg-white border border-slate-200 rounded-sm shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Schema Tables</span>
                <Table className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-light text-slate-900 mt-1">
                {status?.tables ? `${status.tables.length} / 7` : '0 / 7'}
              </p>
              <p className="text-[11px] text-slate-500">
                {status?.schemaReady ? 'All 7 CRM tables active' : 'Run Schema Init to provision'}
              </p>
            </div>

            {/* Total Cloud Rows */}
            <div className="p-4 bg-white border border-slate-200 rounded-sm shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">D1 Stored Records</span>
                <HardDrive className="w-4 h-4 text-indigo-500" />
              </div>
              <p className="text-2xl font-light text-slate-900 mt-1">{totalD1Rows}</p>
              <p className="text-[11px] text-slate-500">
                Local CRM State: <span className="font-semibold text-slate-700">{totalLocalRows} records</span>
              </p>
            </div>

            {/* Query Engine Health */}
            <div className="p-4 bg-white border border-slate-200 rounded-sm shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Database Engine</span>
                <Database className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-base font-bold text-slate-900 mt-1 truncate">SQLite 3 / D1 Edge</p>
              <p className="text-[11px] text-slate-500 truncate">
                ID: {status?.databaseId ? `${status.databaseId.slice(0, 12)}...` : 'Not connected'}
              </p>
            </div>
          </div>

          {/* Quick Performance Benchmark & Query Preview Bento */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Quick Benchmark Card */}
            <div className="bg-white border border-slate-200 rounded-sm p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-500" />
                  <h3 className="font-bold text-slate-900 text-sm">Edge Query Latency Benchmarks</h3>
                </div>
                <button
                  onClick={handleRunAllBenchmarks}
                  disabled={runningBenchmark || !status?.connected}
                  className="px-2.5 py-1 text-xs font-bold bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-sm transition flex items-center gap-1 border border-orange-200 disabled:opacity-50"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>{runningBenchmark ? 'Running...' : 'Run All Tests'}</span>
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Measures read/write performance across key relational entities and sqlite metadata.
              </p>

              <div className="space-y-2">
                {benchmarks.slice(0, 3).map((bm) => (
                  <div
                    key={bm.name}
                    className="p-3 bg-slate-50 border border-slate-100 rounded-sm flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">{bm.name}</span>
                      <p className="text-[11px] text-slate-400">{bm.description}</p>
                    </div>

                    <div className="text-right shrink-0">
                      {bm.status === 'running' ? (
                        <span className="text-orange-600 font-mono font-bold animate-pulse">Running...</span>
                      ) : bm.latencyMs !== undefined ? (
                        <span className="font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-sm">
                          {bm.latencyMs} ms
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono">Not Tested</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setActiveSection('benchmark')}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-sm text-xs font-bold transition flex items-center justify-center gap-1"
                >
                  <span>View Full Benchmark Suite & Telemetry</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Right: Quick D1 Table Inspector */}
            <div className="bg-white border border-slate-200 rounded-sm p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Table className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-bold text-slate-900 text-sm">Tables & Row Distribution</h3>
                </div>
                <button
                  onClick={() => setActiveSection('tables')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Inspect Schema &rarr;
                </button>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {tableDefinitions.slice(0, 5).map((tbl) => {
                  const d1Count = status?.tableCounts?.[tbl.name];
                  const exists = status?.tables?.includes(tbl.name);

                  return (
                    <div key={tbl.name} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${exists ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span className="font-mono font-bold text-slate-800">{tbl.name}</span>
                        <span className="text-slate-400 text-[11px]">({tbl.label})</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 text-[11px]">
                          Local: <strong className="text-slate-700">{tbl.localCount}</strong>
                        </span>
                        <span className="font-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded-sm text-[11px] font-bold">
                          D1: {exists ? d1Count ?? 0 : 'None'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={handlePushToD1}
                  disabled={syncing || !status?.connected}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Push to D1</span>
                </button>
                <button
                  onClick={handlePullFromD1}
                  disabled={syncing || !status?.connected}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
                >
                  <DownloadCloud className="w-3.5 h-3.5" />
                  <span>Pull from D1</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: PERFORMANCE BENCHMARK SUITE */}
      {activeSection === 'benchmark' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-500" />
                  <span>Cloudflare D1 Query Performance Suite</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Execute systematic queries across index trees, schema caches, and relational aggregations to test cloud query latency.
                </p>
              </div>

              <button
                onClick={handleRunAllBenchmarks}
                disabled={runningBenchmark || !status?.connected}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-sm text-xs font-bold flex items-center gap-2 shadow-xs transition disabled:opacity-50 shrink-0"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{runningBenchmark ? 'Executing Benchmarks...' : 'Run Full Benchmark Suite'}</span>
              </button>
            </div>

            {/* Benchmark Test Table */}
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-sm overflow-hidden bg-white">
              {benchmarks.map((bm, idx) => (
                <div key={bm.name} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{idx + 1}. {bm.name}</span>
                      {bm.status === 'success' && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-sm">
                          PASSED
                        </span>
                      )}
                      {bm.status === 'error' && (
                        <span className="text-[10px] bg-red-100 text-red-800 font-bold px-1.5 py-0.2 rounded-sm">
                          FAILED
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{bm.description}</p>
                    <code className="block p-1.5 bg-slate-900 text-emerald-400 font-mono rounded-xs text-[11px] overflow-x-auto">
                      {bm.sql}
                    </code>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {bm.status === 'running' ? (
                      <div className="flex items-center gap-1.5 text-xs text-orange-600 font-bold">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Measuring...</span>
                      </div>
                    ) : bm.latencyMs !== undefined ? (
                      <div className="text-right">
                        <div className="text-sm font-mono font-bold text-emerald-700">
                          {bm.latencyMs} ms
                        </div>
                        {bm.rowsRead !== undefined && (
                          <div className="text-[10px] text-slate-400">
                            {bm.rowsRead} rows processed
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 font-mono">Not Tested</span>
                    )}

                    <button
                      onClick={() => handleRunQuery(bm.sql)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-sm text-xs font-semibold transition"
                      title="Run this query in console"
                    >
                      Run Query
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: SQL QUERY CONSOLE & LOGS */}
      {activeSection === 'queries' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-orange-500" />
                  <span>Interactive SQL Query Console</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Execute direct queries against Cloudflare D1 distributed SQLite database with real-time performance telemetry.
                </p>
              </div>

              {/* Presets */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                {presetQueries.map((pq) => (
                  <button
                    key={pq.label}
                    onClick={() => {
                      setCustomSql(pq.sql);
                      handleRunQuery(pq.sql);
                    }}
                    className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-sm font-medium transition shrink-0"
                  >
                    {pq.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Editor Area */}
            <div className="relative">
              <textarea
                value={customSql}
                onChange={(e) => setCustomSql(e.target.value)}
                rows={4}
                placeholder="SELECT * FROM properties LIMIT 10;"
                className="w-full p-3.5 font-mono text-xs bg-slate-900 text-emerald-400 rounded-sm border border-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 leading-relaxed"
              />
              <button
                onClick={() => handleRunQuery()}
                disabled={runningQuery || !status?.connected}
                className="absolute right-3 bottom-3.5 px-4 py-2 rounded-sm text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{runningQuery ? 'Running...' : 'Run Query'}</span>
              </button>
            </div>

            {/* Query Output */}
            {queryResult && (
              <div className="border border-slate-200 rounded-sm overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">Query Output</span>
                    {queryResult.durationMs !== undefined && (
                      <span className="font-mono text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-sm text-[11px]">
                        Latency: {queryResult.durationMs} ms
                      </span>
                    )}
                  </div>
                  {queryResult.meta && (
                    <span className="text-slate-500 text-[11px] font-mono">
                      Read: {queryResult.meta.rows_read || 0} rows • Written: {queryResult.meta.rows_written || 0} rows
                    </span>
                  )}
                </div>

                {queryResult.error ? (
                  <div className="p-4 bg-red-50 text-red-700 text-xs font-mono">
                    <strong>Error:</strong> {queryResult.error}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-950 text-slate-200 font-mono text-xs max-h-72 overflow-auto">
                    <pre>{JSON.stringify(queryResult.rows, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}

            {/* Recent Query Execution History */}
            {queryLogs.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Recent Query Execution History ({queryLogs.length})
                </h3>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-sm max-h-56 overflow-y-auto">
                  {queryLogs.map((log) => (
                    <div key={log.id} className="p-2.5 flex items-center justify-between text-xs bg-white hover:bg-slate-50">
                      <div className="flex items-center gap-2 truncate max-w-xl">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            log.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'
                          }`}
                        />
                        <code className="font-mono text-[11px] text-slate-800 truncate">{log.sql}</code>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 text-[11px] text-slate-500">
                        <span className="font-mono font-bold text-slate-700">{log.durationMs}ms</span>
                        <span>{log.rowsCount} rows</span>
                        <span className="text-slate-400">{log.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 4: TABLES & SCHEMA INSPECTION */}
      {activeSection === 'tables' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Table className="w-5 h-5 text-indigo-500" />
                  <span>Cloudflare D1 Schema & Table Catalog</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Detailed breakdown of tables, schema integrity, and stored records comparing D1 edge vs local workspace state.
                </p>
              </div>

              <button
                onClick={handleInitSchema}
                disabled={syncing || !status?.connected}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm text-xs font-bold flex items-center gap-2 shadow-xs transition disabled:opacity-50 shrink-0"
              >
                <Layers className="w-4 h-4" />
                <span>{syncing ? 'Provisioning...' : 'Provision / Verify Schema'}</span>
              </button>
            </div>

            {/* Tables Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tableDefinitions.map((tbl) => {
                const existsInD1 = status?.tables?.includes(tbl.name);
                const d1Count = status?.tableCounts?.[tbl.name] ?? 0;

                return (
                  <div
                    key={tbl.name}
                    className="p-4 border border-slate-200 rounded-sm bg-slate-50/50 hover:bg-slate-50 transition space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${
                            existsInD1 ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        />
                        <span className="font-mono font-bold text-slate-900 text-xs">{tbl.name}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500">{tbl.label}</span>
                    </div>

                    <p className="text-xs text-slate-500">{tbl.description}</p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 text-[11px]">
                          Local: <strong className="text-slate-800">{tbl.localCount}</strong>
                        </span>
                        <span className="text-slate-500 text-[11px]">
                          D1 Cloud: <strong className="text-emerald-700 font-mono">{existsInD1 ? d1Count : 'Not Created'}</strong>
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          const sql = `SELECT * FROM ${tbl.name} LIMIT 10;`;
                          setCustomSql(sql);
                          setActiveSection('queries');
                          handleRunQuery(sql);
                        }}
                        className="px-2 py-1 text-[11px] bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-sm font-semibold transition"
                      >
                        Query Table
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: SYNC & REPLICATION */}
      {activeSection === 'sync' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-2xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-indigo-600" />
                <span>Cloudflare D1 Synchronisation & Cloud Replication</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Maintain seamless consistency between local browser state and your remote Cloudflare D1 distributed database.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Push Box */}
              <div className="p-5 border border-slate-200 rounded-sm bg-slate-50 space-y-4">
                <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm">
                  <UploadCloud className="w-5 h-5 text-indigo-600" />
                  <span>Push Local State to Cloudflare D1</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Uploads all local CRM records ({totalLocalRows} total rows) to the remote D1 SQLite database, updating existing records and inserting new ones.
                </p>
                <button
                  onClick={handlePushToD1}
                  disabled={syncing || !status?.connected}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition disabled:opacity-50"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>{syncing ? 'Pushing Data...' : 'Sync Local CRM Data to D1'}</span>
                </button>
              </div>

              {/* Pull Box */}
              <div className="p-5 border border-slate-200 rounded-sm bg-slate-50 space-y-4">
                <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm">
                  <DownloadCloud className="w-5 h-5 text-emerald-600" />
                  <span>Pull Cloudflare D1 into Local State</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Fetches all records stored in Cloudflare D1 ({totalD1Rows} remote rows) and hydrates the local CRM state with the cloud database.
                </p>
                <button
                  onClick={handlePullFromD1}
                  disabled={syncing || !status?.connected}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition disabled:opacity-50"
                >
                  <DownloadCloud className="w-4 h-4" />
                  <span>{syncing ? 'Pulling Data...' : 'Load CRM State from D1'}</span>
                </button>
              </div>
            </div>

            {/* Quick Setup Information */}
            <div className="p-4 bg-orange-50/70 border border-orange-200 rounded-sm text-xs text-orange-950 space-y-2">
              <div className="flex items-center gap-2 font-bold text-orange-900">
                <Info className="w-4 h-4 text-orange-600" />
                <span>Environment Secrets Reference</span>
              </div>
              <p className="text-orange-900/80">
                Ensure the following environment variables are present in your workspace secrets (.env):
              </p>
              <pre className="p-2.5 bg-slate-900 text-amber-300 font-mono rounded-xs text-[11px]">
{`CLOUDFLARE_ACCOUNT_ID="your-account-id"
CLOUDFLARE_DATABASE_ID="your-d1-database-uuid"
CLOUDFLARE_API_TOKEN="your-d1-api-token"`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
