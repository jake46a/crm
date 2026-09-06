// Square API Request & Response Diagnostic Interceptor
// Intercepts all outgoing Square API requests, logs full request headers and payload
// to the browser console and keeps an internal activity buffer specifically to troubleshoot
// HTTP 405 (Method Not Allowed) and other edge proxy or routing errors.

export interface SquareApiActivityRecord {
  id: string;
  timestamp: string;
  isoTime: string;
  durationMs: number;
  method: string;
  endpoint: string;
  fullUrl: string;
  requestHeaders: Record<string, string>;
  requestPayload: any;
  responseStatus: number;
  responseStatusText: string;
  responseHeaders: Record<string, string>;
  responsePayload: any;
  error?: string;
  is405Error: boolean;
  isHtmlSpaFallback?: boolean;
  diagnostics405?: {
    cause: string;
    explanation: string;
    allowedMethods?: string;
    suggestedFix: string;
    fallbackTriggered?: boolean;
    fallbackResult?: string;
  };
}

const STORAGE_KEY = 'moyer_square_api_activity_logs';
const SETTINGS_KEY = 'moyer_square_interceptor_settings';
const MAX_LOG_ENTRIES = 100;

// Internal in-memory log cache
let inMemoryLogs: SquareApiActivityRecord[] = [];
const subscribers = new Set<(logs: SquareApiActivityRecord[]) => void>();

// Load from sessionStorage
try {
  const cached = sessionStorage.getItem(STORAGE_KEY);
  if (cached) {
    const parsed = JSON.parse(cached);
    if (Array.isArray(parsed)) {
      inMemoryLogs = parsed;
    }
  }
} catch {
  // ignore storage errors
}

// Settings
interface InterceptorSettings {
  enabled: boolean;
  consoleLogging: boolean;
}

let settings: InterceptorSettings = {
  enabled: true,
  consoleLogging: true
};

try {
  const savedSettings = localStorage.getItem(SETTINGS_KEY);
  if (savedSettings) {
    settings = { ...settings, ...JSON.parse(savedSettings) };
  }
} catch {
  // ignore
}

function persistLogs() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(inMemoryLogs.slice(0, MAX_LOG_ENTRIES)));
  } catch {}
}

function notifySubscribers() {
  const logsSnapshot = [...inMemoryLogs];
  subscribers.forEach(cb => {
    try {
      cb(logsSnapshot);
    } catch (e) {
      console.error('[Square Interceptor] Subscriber error:', e);
    }
  });
}

export function getApiActivityLogs(): SquareApiActivityRecord[] {
  return [...inMemoryLogs];
}

export function subscribeToApiActivity(callback: (logs: SquareApiActivityRecord[]) => void): () => void {
  subscribers.add(callback);
  callback([...inMemoryLogs]);
  return () => {
    subscribers.delete(callback);
  };
}

export function clearApiActivityLogs(): void {
  inMemoryLogs = [];
  persistLogs();
  notifySubscribers();
  if (settings.consoleLogging) {
    console.info('%c[Square API Interceptor] Activity log cleared.', 'color: #38bdf8; font-weight: bold;');
  }
}

export function isInterceptorEnabled(): boolean {
  return settings.enabled;
}

export function setInterceptorEnabled(val: boolean): void {
  settings.enabled = val;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}

export function isConsoleLoggingEnabled(): boolean {
  return settings.consoleLogging;
}

export function setConsoleLoggingEnabled(val: boolean): void {
  settings.consoleLogging = val;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}

/**
 * Diagnostic analysis specifically tailored to HTTP 405 Method Not Allowed and Edge SPA HTML Fallbacks
 */
function analyze405Error(
  method: string,
  endpoint: string,
  responseHeaders: Record<string, string>,
  responsePayload: any,
  status: number = 405
) {
  const isHtml = typeof responsePayload === 'string' && (responsePayload.trim().startsWith('<!doctype') || responsePayload.includes('<html'));
  const allowHeader = responseHeaders['allow'] || responseHeaders['Allow'] || '';
  const serverHeader = responseHeaders['server'] || responseHeaders['Server'] || '';
  const cfRay = responseHeaders['cf-ray'] || responseHeaders['cf-cache-status'] || '';
  const isCloudflare = cfRay || serverHeader.toLowerCase().includes('cloudflare');
  const cacheStatus = responseHeaders['cf-cache-status'] || '';

  let cause = `The server rejected HTTP method ${method} on endpoint "${endpoint}".`;
  let explanation = `HTTP 405 indicates that the target URL exists, but does not permit requests with the ${method} verb.`;
  let suggestedFix = `Verify route exports in Cloudflare Pages functions or use the resilient edge mode.`;

  if (isHtml) {
    cause = `Cloudflare Pages returned frontend SPA "index.html" (HTTP ${status}) instead of executing API function on "${endpoint}".`;
    explanation = `When Cloudflare Pages receives a request for an API path that lacks an active Pages Function or _worker.js, its static routing rules serve index.html (SPA fallback) with HTTP 200.${cacheStatus ? ` The edge cache returned "${cacheStatus}".` : ''}`;
    suggestedFix = `Deploy with the bundled "dist/_worker.js" and "_routes.json" or ensure Cloudflare Pages Functions is active for the repository. In the meantime, the application seamlessly operates in Resilient Edge Mode.`;
  } else if (status === 405) {
    if (isCloudflare) {
      cause += ' (Cloudflare edge static proxy detected)';
      explanation = 'Cloudflare Pages serves static assets first. If an API path is matched as a static asset or directory rather than an exported function handler, Cloudflare returns 405 Method Not Allowed to POST and OPTIONS requests.';
      suggestedFix = 'Ensure the Cloudflare Pages deployment contains dist/_worker.js with _routes.json configured for /api/*, or use the resilient query fallback / Cloud Run backend gateway.';
    }
  }

  return {
    cause,
    explanation,
    allowedMethods: allowHeader || (isHtml ? 'SPA Fallback (HTML index)' : 'Not specified by server'),
    suggestedFix,
    fallbackTriggered: true,
    fallbackResult: 'Client-side resilience fallback active'
  };
}

/**
 * Intercept and record an outgoing API request and response
 */
export function recordApiActivity(data: {
  durationMs: number;
  method: string;
  endpoint: string;
  fullUrl: string;
  requestHeaders: Record<string, string>;
  requestPayload: any;
  responseStatus: number;
  responseStatusText: string;
  responseHeaders: Record<string, string>;
  responsePayload: any;
  error?: string;
}): SquareApiActivityRecord {
  const is405 = data.responseStatus === 405;
  const isHtmlSpaFallback = (data.responseStatus === 200 || data.responseStatus === 405) &&
    typeof data.responsePayload === 'string' &&
    (data.responsePayload.trim().startsWith('<!doctype') || data.responsePayload.includes('<html'));
  const now = new Date();

  const errorMessage = data.error || (
    is405
      ? 'Cloudflare Pages edge static 405 Method Not Allowed detected'
      : isHtmlSpaFallback
      ? 'Cloudflare Pages served static SPA index.html fallback instead of API function response'
      : undefined
  );

  const record: SquareApiActivityRecord = {
    id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
    isoTime: now.toISOString(),
    durationMs: Math.round(data.durationMs),
    method: data.method.toUpperCase(),
    endpoint: data.endpoint,
    fullUrl: data.fullUrl,
    requestHeaders: data.requestHeaders,
    requestPayload: data.requestPayload,
    responseStatus: data.responseStatus,
    responseStatusText: data.responseStatusText || (is405 ? 'Method Not Allowed' : ''),
    responseHeaders: data.responseHeaders,
    responsePayload: data.responsePayload,
    error: errorMessage,
    is405Error: is405,
    isHtmlSpaFallback,
    ...(is405 || isHtmlSpaFallback ? {
      diagnostics405: analyze405Error(
        data.method,
        data.endpoint,
        data.responseHeaders,
        data.responsePayload,
        data.responseStatus
      )
    } : {})
  };

  inMemoryLogs.unshift(record);
  if (inMemoryLogs.length > MAX_LOG_ENTRIES) {
    inMemoryLogs.pop();
  }

  persistLogs();
  notifySubscribers();

  // Print rich output to the browser console if enabled
  if (settings.consoleLogging) {
    logToBrowserConsole(record);
  }

  return record;
}

/**
 * Rich browser console formatting for developer troubleshooting
 */
function logToBrowserConsole(record: SquareApiActivityRecord) {
  const is405 = record.is405Error;
  const isError = record.responseStatus >= 400 || !!record.error;

  const badgeStyle = is405
    ? 'background: #991b1b; color: #fef2f2; font-weight: bold; padding: 2px 6px; border-radius: 4px;'
    : isError
    ? 'background: #92400e; color: #fef3c7; font-weight: bold; padding: 2px 6px; border-radius: 4px;'
    : 'background: #065f46; color: #ecfdf5; font-weight: bold; padding: 2px 6px; border-radius: 4px;';

  const titleStyle = 'font-weight: bold; color: #1e293b;';

  console.groupCollapsed(
    `%c[Square API Interceptor] %c${record.method} ${record.endpoint} %c➔ ${record.responseStatus} ${record.responseStatusText || ''} (${record.durationMs}ms)`,
    'background: #3b82f6; color: white; padding: 2px 5px; border-radius: 3px; font-weight: bold;',
    titleStyle,
    badgeStyle
  );

  console.log('%cTimestamp:', 'font-weight: bold; color: #64748b;', `${record.timestamp} (${record.isoTime})`);
  console.log('%cTarget URL:', 'font-weight: bold; color: #64748b;', record.fullUrl);
  console.log('%cHTTP Method:', 'font-weight: bold; color: #64748b;', record.method);

  console.group('%cRequest Headers (Full)', 'font-weight: bold; color: #0284c7;');
  console.table(record.requestHeaders);
  console.groupEnd();

  console.group('%cRequest Payload', 'font-weight: bold; color: #0284c7;');
  if (record.requestPayload !== undefined && record.requestPayload !== null) {
    console.log(record.requestPayload);
  } else {
    console.log('(Empty / No Body)');
  }
  console.groupEnd();

  console.group('%cResponse Status & Headers', isError ? 'font-weight: bold; color: #dc2626;' : 'font-weight: bold; color: #16a34a;');
  console.log(`Status Code: ${record.responseStatus} ${record.responseStatusText}`);
  console.table(record.responseHeaders);
  console.groupEnd();

  console.group('%cResponse Payload / Error', isError ? 'font-weight: bold; color: #dc2626;' : 'font-weight: bold; color: #16a34a;');
  console.log(record.responsePayload);
  if (record.error) {
    console.error('Error detail:', record.error);
  }
  console.groupEnd();

  if (is405 && record.diagnostics405) {
    console.warn(
      '%c⚠️ [Square Interceptor: 405 Method Not Allowed Diagnosis]',
      'background: #fee2e2; color: #b91c1c; font-weight: bold; font-size: 13px; padding: 4px 8px; border-radius: 4px;'
    );
    console.warn('Cause:', record.diagnostics405.cause);
    console.warn('Explanation:', record.diagnostics405.explanation);
    console.warn('Allowed Methods Header:', record.diagnostics405.allowedMethods);
    console.warn('Suggested Action:', record.diagnostics405.suggestedFix);
  }

  console.groupEnd();
}

/**
 * Helper to test the batch invoice endpoint on demand for troubleshooting 405 errors
 */
export async function testSquareBatchEndpoint(
  method: 'POST' | 'GET' | 'OPTIONS' = 'POST',
  sampleInvoiceCount: number = 1
): Promise<{ status: number; text: string; data: any }> {
  const dummyInvoices = Array.from({ length: sampleInvoiceCount }).map((_, idx) => ({
    id: `test_diag_${Date.now()}_${idx + 1}`,
    propertyName: 'Diagnostic Test Property',
    tenantName: 'Diagnostic Resident',
    tenantEmail: 'diagnostic@example.com',
    amount: 100.0,
    totalAmount: 100.0,
    month: 'Diagnostic',
    year: new Date().getFullYear(),
    dueDate: new Date().toISOString().split('T')[0],
    description: 'Diagnostic 405 Troubleshooting Probe'
  }));

  const payload = { invoices: dummyInvoices };
  const endpoint = '/api/square/invoices/create-batch';

  const token = typeof localStorage !== 'undefined' ? (localStorage.getItem('moyer_square_access_token') || '') : '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}`, 'x-square-access-token': token } : {})
  };

  let targetUrl = endpoint;
  const init: RequestInit = {
    method,
    headers
  };

  if (method === 'POST') {
    init.body = JSON.stringify(payload);
  } else if (method === 'GET') {
    targetUrl = `${endpoint}?payload=${encodeURIComponent(JSON.stringify(payload))}`;
  }

  const startTime = performance.now();
  let res: Response;
  let rawText = '';
  let parsedJson: any = null;

  try {
    res = await fetch(targetUrl, init);
    const duration = performance.now() - startTime;
    rawText = await res.text();
    try {
      parsedJson = JSON.parse(rawText);
    } catch {
      parsedJson = rawText;
    }

    // Extract headers
    const respHeaders: Record<string, string> = {};
    res.headers.forEach((val, key) => {
      respHeaders[key] = val;
    });

    recordApiActivity({
      durationMs: duration,
      method,
      endpoint,
      fullUrl: targetUrl,
      requestHeaders: headers,
      requestPayload: method === 'POST' ? payload : { queryParam: targetUrl },
      responseStatus: res.status,
      responseStatusText: res.statusText,
      responseHeaders: respHeaders,
      responsePayload: parsedJson
    });

    return {
      status: res.status,
      text: rawText,
      data: parsedJson
    };
  } catch (err: any) {
    const duration = performance.now() - startTime;
    recordApiActivity({
      durationMs: duration,
      method,
      endpoint,
      fullUrl: targetUrl,
      requestHeaders: headers,
      requestPayload: method === 'POST' ? payload : { queryParam: targetUrl },
      responseStatus: 0,
      responseStatusText: 'Network / CORS Error',
      responseHeaders: {},
      responsePayload: null,
      error: err.message
    });
    throw err;
  }
}
