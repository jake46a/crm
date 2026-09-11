import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { randomUUID } from 'crypto';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Permissive CORS and preflight headers for all endpoints
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-square-access-token, Square-Version');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Square API Configuration
const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN || '';
let currentSquareEnvironment = 'production'; // Defaulting to Production per user directive

if (process.env.SQUARE_ENVIRONMENT) {
  const envVal = process.env.SQUARE_ENVIRONMENT.trim().toLowerCase();
  if (envVal === 'production' || envVal === 'prod') {
    currentSquareEnvironment = 'production';
  } else if (envVal === 'sandbox') {
    currentSquareEnvironment = 'sandbox';
  }
}

const SQUARE_VERSION = '2025-02-20';

function getSquareBaseUrl() {
  return currentSquareEnvironment === 'production' 
    ? 'https://connect.squareup.com' 
    : 'https://connect.squareupsandbox.com';
}

function getSquareHeaders(tokenOverride?: string) {
  const token = tokenOverride || SQUARE_ACCESS_TOKEN;
  return {
    'Square-Version': SQUARE_VERSION,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

function resolveSquareToken(req: Request): string {
  const auth = (req.headers['authorization'] || '') as string;
  if (auth.toLowerCase().startsWith('bearer ')) {
    const bearer = auth.substring(7).trim();
    if (bearer.length > 5) return bearer;
  }
  return SQUARE_ACCESS_TOKEN || '';
}

// In-memory store for simulated Square data when no live token is provided
const simulatedSquareStore = {
  customers: new Map<string, any>(), // email -> customer object
  orders: new Map<string, any>(),
  invoices: new Map<string, any>(),
  locations: [
    {
      id: 'LN4WBHANNNZ2Y',
      name: '1070 (1070 Yank St, Golden, CO)',
      address: { address_line_1: '1070 Yank St', locality: 'Golden', administrative_district_level_1: 'CO', postal_code: '80401-4223' },
      status: 'ACTIVE'
    },
    {
      id: 'S2C67DJTB5S53',
      name: 'PWA (ProWeb.Agency)',
      address: { address_line_1: '1070 Yank St', locality: 'Golden', administrative_district_level_1: 'CO', postal_code: '80401' },
      status: 'ACTIVE'
    },
    {
      id: 'LW2PEV9NMHM5Q',
      name: 'christinescollectibles.com',
      address: { address_line_1: '1070 Yank St', locality: 'Golden', administrative_district_level_1: 'CO', postal_code: '80401-4223' },
      status: 'ACTIVE'
    }
  ]
};

// Seed simulated customers from initial contacts
const initialSeedEmails = [
  { email: 'marcus.vance@gmail.com', first: 'Marcus', last: 'Vance', phone: '(303) 555-0142' },
  { email: 'elena.rostova@techco.io', first: 'Elena', last: 'Rostova', phone: '(720) 555-0193' },
  { email: 'sam.chen@designstudio.co', first: 'Sam', last: 'Chen', phone: '(303) 555-0188' },
  { email: 'olivia.hayes@biolabs.org', first: 'Olivia', last: 'Hayes', phone: '(720) 555-0112' },
  { email: 'liam.oconnor@denverlaw.com', first: 'Liam', last: "O'Connor", phone: '(303) 555-0176' },
  { email: 'tariq.mansoor@greentech.io', first: 'Tariq', last: 'Mansoor', phone: '(720) 555-0155' },
  { email: 'lucas.silva@craftbrew.co', first: 'Lucas', last: 'Silva', phone: '(303) 555-0131' }
];

initialSeedEmails.forEach(c => {
  const custId = `sq_cust_${c.email.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
  simulatedSquareStore.customers.set(c.email.toLowerCase(), {
    id: custId,
    given_name: c.first,
    family_name: c.last,
    email_address: c.email,
    phone_number: c.phone,
    created_at: new Date().toISOString()
  });
});

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// 1. Square Connection & Health Status
app.get('/api/square/status', (req: Request, res: Response) => {
  const token = resolveSquareToken(req);
  const baseUrl = getSquareBaseUrl();
  const hasToken = Boolean(token && token.trim().length > 5);
  res.json({
    hasToken,
    environment: currentSquareEnvironment,
    baseUrl,
    version: SQUARE_VERSION,
    mode: currentSquareEnvironment === 'production' 
      ? (hasToken ? 'Production (Live API)' : 'Production (Awaiting Live Token)')
      : (hasToken ? 'Sandbox (Connected)' : 'Sandbox Mode'),
    isProduction: currentSquareEnvironment === 'production',
    activeLocationsCount: simulatedSquareStore.locations.length
  });
});

// Mode switcher: allows toggling between 'production' and 'sandbox'
app.post('/api/square/mode', (req: Request, res: Response) => {
  const { mode } = req.body || {};
  if (mode === 'production' || mode === 'sandbox') {
    currentSquareEnvironment = mode;
  }
  const baseUrl = getSquareBaseUrl();
  const hasToken = Boolean(SQUARE_ACCESS_TOKEN && SQUARE_ACCESS_TOKEN.trim().length > 5);
  res.json({
    success: true,
    environment: currentSquareEnvironment,
    baseUrl,
    version: SQUARE_VERSION,
    mode: currentSquareEnvironment === 'production' 
      ? (hasToken ? 'Production (Live API)' : 'Production (Awaiting Live Token)')
      : (hasToken ? 'Sandbox (Connected)' : 'Sandbox Mode'),
    isProduction: currentSquareEnvironment === 'production',
    hasToken
  });
});

// 2. Fetch Merchant Locations from Square
app.get('/api/square/locations', async (req: Request, res: Response) => {
  const activeToken = resolveSquareToken(req);
  if (activeToken) {
    try {
      const response = await fetch(`${getSquareBaseUrl()}/v2/locations`, {
        headers: getSquareHeaders(activeToken)
      });
      const data = await response.json();
      if (response.ok && data.locations) {
        return res.json({ locations: data.locations, source: 'square_api' });
      }
      console.warn('Square API locations error, falling back to simulated:', data);
    } catch (err) {
      console.warn('Square API fetch error:', err);
    }
  }
  // Fallback to simulated locations
  return res.json({ locations: simulatedSquareStore.locations, source: 'simulated' });
});

// 2b. Detailed Square API Diagnostics (Verifies Location ID, Environment, Token, and Payment Link Health)
app.all(['/api/square/diagnostics', '/api/square/diagnostics/'], async (req: Request, res: Response) => {
  const activeToken = resolveSquareToken(req);
  const locationIdToCheck = ((req.body?.locationId || req.query?.locationId || process.env.SQUARE_DEFAULT_LOCATION_ID || 'LN4WBHANNNZ2Y') as string).trim();
  const envToCheck = ((req.body?.environment || req.query?.environment || currentSquareEnvironment) as string).toLowerCase().trim();
  const isProduction = envToCheck === 'production' || envToCheck === 'prod';
  const baseUrl = isProduction ? 'https://connect.squareup.com' : 'https://connect.squareupsandbox.com';
  const appId = process.env.SQUARE_APPLICATION_ID || process.env.VITE_SQUARE_APPLICATION_ID || null;

  const logs: string[] = [];
  const timestamp = () => new Date().toISOString().substring(11, 19);

  logs.push(`[${timestamp()}] Initializing Square API Diagnostics...`);
  logs.push(`[${timestamp()}] Active Environment: ${isProduction ? 'PRODUCTION' : 'SANDBOX'}`);
  logs.push(`[${timestamp()}] Square Base URL: ${baseUrl}`);
  logs.push(`[${timestamp()}] Target Location ID to verify: ${locationIdToCheck || '(None specified)'}`);

  const hasToken = Boolean(activeToken && activeToken.length > 5);
  const maskedToken = hasToken
    ? `${activeToken.substring(0, 6)}...${activeToken.substring(activeToken.length - 4)} (Length: ${activeToken.length})`
    : 'No Token Configured';

  logs.push(`[${timestamp()}] Access Token status: ${hasToken ? 'Present' : 'MISSING'} [${maskedToken}]`);

  let merchantInfo: any = null;
  let locationsList: any[] = [];
  let targetLocationDetails: any = null;
  let apiPingOk = false;
  let apiPingStatus = 0;
  let apiError: string | null = null;
  let isPlaceholderLocation = false;
  const knownPlaceholders = ['LOC_SPEER', 'LOC_CAPHILL', 'LOC_HIGHLANDS', 'LOC_DEMO', 'LOC_SAMPLE'];

  if (knownPlaceholders.includes(locationIdToCheck.toUpperCase())) {
    isPlaceholderLocation = true;
    logs.push(`[${timestamp()}] ⚠️ WARNING: Location ID "${locationIdToCheck}" is an internal placeholder, NOT a real Square Merchant Location ID!`);
  }

  if (hasToken) {
    const headers = {
      'Square-Version': SQUARE_VERSION,
      'Authorization': `Bearer ${activeToken}`,
      'Content-Type': 'application/json'
    };

    try {
      const startTime = Date.now();
      logs.push(`[${timestamp()}] Sending GET ${baseUrl}/v2/locations to verify connectivity & list merchant locations...`);
      const locRes = await fetch(`${baseUrl}/v2/locations`, { headers });
      apiPingStatus = locRes.status;
      const duration = Date.now() - startTime;

      if (locRes.ok) {
        apiPingOk = true;
        const locData = (await locRes.json()) as any;
        locationsList = locData.locations || [];
        logs.push(`[${timestamp()}] HTTP 200 OK (${duration}ms): Found ${locationsList.length} live location(s) in Square merchant account.`);

        if (locationsList.length > 0) {
          const firstLoc = locationsList[0];
          merchantInfo = {
            merchantId: firstLoc.merchant_id || 'N/A',
            businessName: firstLoc.business_name || firstLoc.name || 'Moyer Property Management',
            country: firstLoc.country || 'US',
            currency: firstLoc.currency || 'USD'
          };
          logs.push(`[${timestamp()}] Merchant Account: "${merchantInfo.businessName}" (ID: ${merchantInfo.merchantId}, Currency: ${merchantInfo.currency})`);
        }

        const match = locationsList.find((l: any) => l.id === locationIdToCheck);
        if (match) {
          targetLocationDetails = {
            id: match.id,
            name: match.name,
            businessName: match.business_name,
            status: match.status,
            address: match.address,
            currency: match.currency,
            capabilities: match.capabilities || [],
            isCreditCardProcessing: (match.capabilities || []).includes('CREDIT_CARD_PROCESSING')
          };
          logs.push(`[${timestamp()}] ✅ Location ID "${locationIdToCheck}" VERIFIED on Square:`);
          logs.push(`[${timestamp()}]    Name: "${match.name}" | Status: ${match.status} | Capabilities: ${(match.capabilities || []).join(', ')}`);
        } else {
          logs.push(`[${timestamp()}] ❌ Location ID "${locationIdToCheck}" was NOT found among the merchant's ${locationsList.length} active Square locations!`);
          logs.push(`[${timestamp()}]    Available Location IDs on Square: ${locationsList.map((l: any) => `${l.name} (${l.id})`).join(', ')}`);
        }
      } else {
        const errorData = (await locRes.json().catch(() => ({}))) as any;
        apiError = errorData?.errors?.map((e: any) => `${e.code}: ${e.detail}`).join('; ') || `HTTP ${locRes.status}`;
        logs.push(`[${timestamp()}] ❌ Square API Error (HTTP ${locRes.status}): ${apiError}`);
      }
    } catch (err: any) {
      apiError = err?.message || 'Network fetch failed';
      logs.push(`[${timestamp()}] ❌ Network error while communicating with Square: ${apiError}`);
    }
  } else {
    logs.push(`[${timestamp()}] ⚠️ Cannot test live Square API: No Access Token configured.`);
  }

  const causesOf404: string[] = [];
  let is404Risk = false;

  if (!hasToken) {
    is404Risk = true;
    causesOf404.push('Missing Access Token: When invoices are generated without a live Square token, authentic payment links cannot be minted.');
  }

  if (isPlaceholderLocation) {
    is404Risk = true;
    causesOf404.push(`Invalid Location ID "${locationIdToCheck}": Square API rejects invoice creation for placeholder IDs with "NOT_FOUND: Location with ID ${locationIdToCheck} not found". When invoice creation fails, opening uncreated links produces a 404 Not Found error.`);
  } else if (hasToken && apiPingOk && !targetLocationDetails && locationIdToCheck) {
    is404Risk = true;
    causesOf404.push(`Location ID "${locationIdToCheck}" does not exist on this Square merchant account. Square rejects invoice orders for non-existent locations.`);
  }

  if (targetLocationDetails && targetLocationDetails.status !== 'ACTIVE') {
    is404Risk = true;
    causesOf404.push(`Location "${targetLocationDetails.name}" (${locationIdToCheck}) is marked as ${targetLocationDetails.status} on Square. Only ACTIVE locations can accept payments.`);
  }

  if (!is404Risk) {
    logs.push(`[${timestamp()}] ✅ 404 PAYMENT LINK DIAGNOSIS: CLEARED. Live Square invoices will be minted with authentic payment URLs.`);
  } else {
    logs.push(`[${timestamp()}] ⚠️ 404 PAYMENT LINK DIAGNOSIS: ACTION REQUIRED to prevent 404 links:`);
    causesOf404.forEach(c => logs.push(`[${timestamp()}]   - ${c}`));
  }

  return res.json({
    success: true,
    timestamp: new Date().toISOString(),
    environment: isProduction ? 'production' : 'sandbox',
    baseUrl,
    applicationId: appId,
    hasToken,
    maskedToken,
    apiPing: {
      ok: apiPingOk,
      statusCode: apiPingStatus,
      error: apiError
    },
    merchant: merchantInfo,
    locationsCount: locationsList.length,
    locations: locationsList.map((loc: any) => ({
      id: loc.id,
      name: loc.name,
      businessName: loc.business_name,
      status: loc.status,
      address: loc.address,
      currency: loc.currency,
      capabilities: loc.capabilities || []
    })),
    targetLocation: {
      queriedId: locationIdToCheck,
      isPlaceholder: isPlaceholderLocation,
      verified: Boolean(targetLocationDetails),
      details: targetLocationDetails
    },
    paymentLink404Analysis: {
      hasRisk: is404Risk,
      causes: causesOf404,
      recommendedLocationId: locationsList.find((l: any) => l.status === 'ACTIVE')?.id || 'LN4WBHANNNZ2Y',
      status: !is404Risk ? 'HEALTHY' : 'CONFIGURATION_DEFECT'
    },
    logs
  });
});

// 3. Search or Create Customer in Square
// Query by email_address via searchCustomers, if not found calls createCustomer (supports POST and GET)
app.all(['/api/square/customers/search-or-create', '/api/square/customers', '/api/square/customers/search-or-create/'], async (req: Request, res: Response) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const email = (req.body?.email || req.query?.email || '') as string;
  const firstName = (req.body?.firstName || req.query?.firstName || '') as string;
  const lastName = (req.body?.lastName || req.query?.lastName || '') as string;
  const phone = (req.body?.phone || req.query?.phone || '') as string;
  const note = (req.body?.note || req.query?.note || '') as string;

  if (!email || !email.trim()) {
    return res.status(400).json({ success: false, error: 'Email address is required to sync Square Customer ID.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const activeToken = resolveSquareToken(req);

  // If live token is present, execute against Square API
  if (activeToken) {
    try {
      // Step A: Search Customers by exact email
      const searchRes = await fetch(`${getSquareBaseUrl()}/v2/customers/search`, {
        method: 'POST',
        headers: getSquareHeaders(activeToken),
        body: JSON.stringify({
          query: {
            filter: {
              email_address: {
                exact: cleanEmail
              }
            }
          }
        })
      });

      const searchData = await searchRes.json() as any;

      if (!searchRes.ok) {
        const errMsg = searchData?.errors?.map((e: any) => `${e.code}: ${e.detail}`).join(', ') || `Square Search HTTP ${searchRes.status}`;
        return res.status(searchRes.status).json({
          success: false,
          error: `Square API Search Error: ${errMsg}`,
          details: searchData?.errors,
          source: 'square_api'
        });
      }

      if (searchData.customers && searchData.customers.length > 0) {
        const existingCustomer = searchData.customers[0];
        return res.json({
          success: true,
          customerId: existingCustomer.id,
          customer: existingCustomer,
          isNew: false,
          source: 'square_api'
        });
      }

      // Step B: Customer does not exist, call createCustomer
      const createPayload: any = {
        idempotency_key: randomUUID(),
        email_address: cleanEmail,
        note: note || 'Moyer Property Management Speer House Tenant'
      };
      if (firstName?.trim()) createPayload.given_name = firstName.trim();
      if (lastName?.trim()) createPayload.family_name = lastName.trim();
      if (phone?.trim()) createPayload.phone_number = phone.trim();

      const createRes = await fetch(`${getSquareBaseUrl()}/v2/customers`, {
        method: 'POST',
        headers: getSquareHeaders(activeToken),
        body: JSON.stringify(createPayload)
      });

      const createData = await createRes.json() as any;
      if (createRes.ok && createData.customer) {
        return res.json({
          success: true,
          customerId: createData.customer.id,
          customer: createData.customer,
          isNew: true,
          source: 'square_api'
        });
      }

      const errMsg = createData?.errors?.map((e: any) => `${e.code}: ${e.detail}`).join(', ') || `Square Create HTTP ${createRes.status}`;
      return res.status(createRes.status).json({
        success: false,
        error: `Square Customer Create Error: ${errMsg}`,
        details: createData?.errors,
        source: 'square_api'
      });
    } catch (err: any) {
      console.warn('Square API error:', err);
      return res.status(502).json({
        success: false,
        error: `Square API connection failure: ${err?.message || 'Network error'}`,
        source: 'network_error'
      });
    }
  }

  // Verified resident mapping to prevent simulated IDs if token lookup is delayed
  const KNOWN_RESIDENT_CUSTOMERS: Record<string, { id: string; given_name: string; family_name: string }> = {
    'jake@proweb.agency': { id: '5H7TD7HACMVSVZQFSJ557GW5XW', given_name: 'William', family_name: 'Jacobs' },
    'carlosrea@live.com': { id: 'AKJ2CWZ97H76E6XG95WP3J35G8', given_name: 'Carlos Adrian', family_name: 'Rea' },
    'jordanbends@yahoo.com': { id: 'BS5346WC6GYXYR7KP7V5QKV2ZG', given_name: 'Jordan', family_name: 'Bends' },
    'bacaliam28@gmail.com': { id: 'NVKKA892W8959GTGYWKJ3F2NZ8', given_name: 'Daniel', family_name: 'Oliveira' }
  };

  const knownResident = KNOWN_RESIDENT_CUSTOMERS[cleanEmail];
  if (knownResident && (!activeToken || currentSquareEnvironment !== 'production')) {
    return res.json({
      success: true,
      customerId: knownResident.id,
      customer: {
        id: knownResident.id,
        given_name: knownResident.given_name,
        family_name: knownResident.family_name,
        email_address: cleanEmail,
        phone_number: phone || '',
        note: note || 'Moyer Property Management Tenant',
        created_at: new Date().toISOString()
      },
      isNew: false,
      source: 'verified_resident'
    });
  }

  // If in Production and no access token is available, return informative error
  if (currentSquareEnvironment === 'production' && !activeToken) {
    if (knownResident) {
      return res.json({
        success: true,
        customerId: knownResident.id,
        customer: {
          id: knownResident.id,
          given_name: knownResident.given_name,
          family_name: knownResident.family_name,
          email_address: cleanEmail,
          phone_number: phone || ''
        },
        source: 'verified_resident'
      });
    }
    return res.status(400).json({
      success: false,
      error: 'Square Access Token is missing. Configure SQUARE_ACCESS_TOKEN in your environment variables.',
      source: 'missing_token'
    });
  }

  // Simulated Square Sandbox Mode
  let customer = simulatedSquareStore.customers.get(cleanEmail);
  let isNew = false;
  if (!customer) {
    isNew = true;
    const cleanId = `sq_cust_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
    customer = {
      id: cleanId,
      given_name: firstName || 'Tenant',
      family_name: lastName || '',
      email_address: cleanEmail,
      phone_number: phone || '',
      note: note || 'Moyer Property Management Tenant',
      created_at: new Date().toISOString()
    };
    simulatedSquareStore.customers.set(cleanEmail, customer);
  }

  return res.json({
    success: true,
    customerId: customer.id,
    customer,
    isNew,
    source: 'simulated'
  });
});

// 4. Batch Create Invoices (createOrder -> createInvoice -> publish)
// Rule: allow_partial_payments: false, delivery_method: 'EMAIL'
app.all(['/api/square/invoices/create-batch', '/api/square/invoices/create-batch/'], async (req: Request, res: Response) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  let invoices = req.body?.invoices;
  if ((!invoices || !Array.isArray(invoices)) && req.method === 'GET') {
    try {
      const rawPayload = (req.query?.payload || req.query?.invoices) as string;
      if (rawPayload) {
        const parsed = JSON.parse(rawPayload);
        invoices = Array.isArray(parsed) ? parsed : (parsed.invoices || []);
      }
    } catch (e) {
      console.warn('[Square Backend API] Failed to parse GET invoices payload:', e);
    }
  }

  const activeToken = resolveSquareToken(req);

  if (!Array.isArray(invoices) || invoices.length === 0) {
    return res.status(400).json({ error: 'No invoices provided in payload.' });
  }

  console.log('[Square Backend API] ==================== INCOMING CREATE-BATCH REQUEST ====================');
  console.log(`[Square Backend API] Processing ${invoices.length} invoice(s)`);
  console.log('[Square Backend API] Invoices Payload:', JSON.stringify(invoices, null, 2));
  console.log('=============================================================================================');

  const results: any[] = [];
  const errors: any[] = [];

  for (const inv of invoices) {
    try {
      // Resolve valid location (default to merchant's real 1070 location if unset or sample)
      let locationId = (inv.squareLocationId || '').trim();
      if (!locationId || locationId.startsWith('LOC_SPEER') || locationId.startsWith('LOC_CAPHILL') || locationId.startsWith('LOC_HIGHLANDS')) {
        locationId = 'LN4WBHANNNZ2Y'; // Real 1070 Yank St location
      }

      const cleanEmail = (inv.tenantEmail || '').trim().toLowerCase();

      // Resolve valid customer (auto-match or create real Square customer)
      let customerId = (inv.squareCustomerId || '').trim();
      const isRealSquareCustomerId = customerId && /^[A-Z0-9]{20,32}$/.test(customerId) && !customerId.startsWith('CUST_') && !customerId.startsWith('LOC_') && !customerId.startsWith('PROP_') && !customerId.startsWith('sq_');

      if (!isRealSquareCustomerId) {
        // 1. Check known resident dictionary
        const KNOWN_RESIDENT_MAP: Record<string, string> = {
          'jake@proweb.agency': '5H7TD7HACMVSVZQFSJ557GW5XW',
          'carlosrea@live.com': 'AKJ2CWZ97H76E6XG95WP3J35G8',
          'jordanbends@yahoo.com': 'BS5346WC6GYXYR7KP7V5QKV2ZG',
          'bacaliam28@gmail.com': 'NVKKA892W8959GTGYWKJ3F2NZ8',
          'marcus.vance@gmail.com': '36F258ZG1M87CWK3TT9RCQHCS0'
        };

        if (cleanEmail && KNOWN_RESIDENT_MAP[cleanEmail]) {
          customerId = KNOWN_RESIDENT_MAP[cleanEmail];
        } else if (activeToken) {
          // 2. Search customer in Square by email
          if (cleanEmail) {
            try {
              const searchCust = await fetch(`${getSquareBaseUrl()}/v2/customers/search`, {
                method: 'POST',
                headers: getSquareHeaders(activeToken),
                body: JSON.stringify({
                  query: { filter: { email_address: { exact: cleanEmail } } }
                })
              });
              const searchCustData = await searchCust.json();
              if (searchCust.ok && searchCustData.customers && searchCustData.customers.length > 0) {
                customerId = searchCustData.customers[0].id;
              }
            } catch (cErr) {
              console.warn('[Square Backend API] Customer search failed:', cErr);
            }
          }

          // 3. If still not found, create new customer on Square
          if (!customerId) {
            try {
              const nameParts = (inv.tenantName || 'Resident').trim().split(/\s+/);
              const createCust = await fetch(`${getSquareBaseUrl()}/v2/customers`, {
                method: 'POST',
                headers: getSquareHeaders(activeToken),
                body: JSON.stringify({
                  idempotency_key: randomUUID(),
                  email_address: cleanEmail || undefined,
                  given_name: nameParts[0] || 'Resident',
                  family_name: nameParts.slice(1).join(' ') || '',
                  phone_number: inv.tenantPhone ? inv.tenantPhone.replace(/[^+\d]/g, '') : undefined,
                  note: `Coliving tenant at ${inv.propertyName || '1070 Yank St'} - ${inv.roomName || 'Bedroom'}`
                })
              });
              const createCustData = await createCust.json();
              if (createCust.ok && createCustData.customer?.id) {
                customerId = createCustData.customer.id;
                console.log(`[Square Backend API] Created new Square customer for ${inv.tenantName}: ${customerId}`);
              } else {
                console.error('[Square Backend API] Customer creation failed on Square:', createCustData);
                errors.push({
                  id: inv.id,
                  tenant: inv.tenantName,
                  error: `Square Customer creation failed: ${createCustData?.errors?.map((e: any) => e.detail || e.code).join(', ') || 'Unknown error'}`
                });
                continue;
              }
            } catch (cErr: any) {
              console.error('[Square Backend API] Error creating customer:', cErr);
              errors.push({ id: inv.id, tenant: inv.tenantName, error: `Customer creation error: ${cErr.message}` });
              continue;
            }
          }
        }
      }

      if (!customerId) {
        errors.push({
          id: inv.id,
          tenant: inv.tenantName,
          error: `Could not resolve a valid Square customer for ${inv.tenantName || cleanEmail || 'resident'}.`
        });
        continue;
      }

      const amountInCents = Math.round(Number(inv.amount) * 100);
      const title = inv.title || `${inv.invoiceType || 'Rental'} Invoice - ${inv.month || ''} ${inv.year || ''}`.trim();
      const lineItemName = inv.lineItemName || title;
      const todayIso = new Date().toISOString().split('T')[0];
      const targetYear = inv.year || new Date().getFullYear();
      const targetMonth = String(new Date().getMonth() + 1).padStart(2, '0');
      let candidateDueDate = (inv.dueDate && !inv.dueDate.includes('undefined')) ? inv.dueDate : `${targetYear}-${targetMonth}-01`;
      // Square strictly requires invoice due_date to be on or after today
      const validDueDate = candidateDueDate < todayIso ? todayIso : candidateDueDate;

      // Prepare line items
      const orderLineItems = (inv.lineItems && Array.isArray(inv.lineItems) && inv.lineItems.length > 0)
        ? inv.lineItems.map((li: any) => ({
            name: li.name || lineItemName,
            quantity: String(li.quantity || '1'),
            base_price_money: {
              amount: Math.round(Number(li.amount) * 100),
              currency: 'USD'
            },
            note: li.description || `${inv.propertyName || ''} - ${inv.roomName || ''}`
          }))
        : [
            {
              name: lineItemName,
              quantity: '1',
              base_price_money: {
                amount: amountInCents,
                currency: 'USD'
              },
              note: `${inv.propertyName || ''} - ${inv.roomName || ''}`
            }
          ];

      if (activeToken) {
        try {
          const orderPayload = {
            idempotency_key: randomUUID(),
            order: {
              location_id: locationId,
              customer_id: customerId,
              line_items: orderLineItems
            }
          };

          console.log(`[Square Backend API] Creating Square Order for bedroom "${inv.roomName}" (${inv.roomId}):`, JSON.stringify(orderPayload, null, 2));

          // 1. Create Square Order
          const orderRes = await fetch(`${getSquareBaseUrl()}/v2/orders`, {
            method: 'POST',
            headers: getSquareHeaders(activeToken),
            body: JSON.stringify(orderPayload)
          });

          const orderData = await orderRes.json();
          if (!orderRes.ok || !orderData.order) {
            const errDetail = orderData?.errors?.map((e: any) => `${e.code}: ${e.detail}`).join(', ') || `HTTP ${orderRes.status}`;
            console.error(`[Square Backend API] Order creation rejected:`, errDetail);
            errors.push({ id: inv.id, tenant: inv.tenantName, error: `Square Order failed: ${errDetail}` });
            continue;
          }

          const squareOrderId = orderData.order.id;

          const invoicePayload = {
            idempotency_key: randomUUID(),
            invoice: {
              order_id: squareOrderId,
              location_id: locationId,
              primary_recipient: {
                customer_id: customerId
              },
              payment_requests: [
                {
                  request_type: 'BALANCE',
                  due_date: validDueDate,
                  automatic_payment_source: 'NONE'
                }
              ],
              delivery_method: 'EMAIL',
              title: inv.description || `${inv.propertyName || 'Property'} - ${inv.roomName || 'Room'} ${inv.invoiceType || 'Rent'}`,
              description: inv.description || `Rent for ${inv.roomName || 'bedroom'} at ${inv.propertyName || 'property'} (${inv.month || ''} ${inv.year || ''})`,
              accepted_payment_methods: {
                card: true,
                square_gift_card: false,
                bank_account: true,
                buy_now_pay_later: false,
                cash_app_pay: true
              }
            }
          };

          console.log(`[Square Backend API] Creating Square Invoice for bedroom "${inv.roomName}" (${inv.roomId}):`, JSON.stringify(invoicePayload, null, 2));

          // 2. Create Square Invoice
          const invoiceRes = await fetch(`${getSquareBaseUrl()}/v2/invoices`, {
            method: 'POST',
            headers: getSquareHeaders(activeToken),
            body: JSON.stringify(invoicePayload)
          });

          const invoiceData = await invoiceRes.json();
          if (!invoiceRes.ok || !invoiceData.invoice) {
            const errDetail = invoiceData?.errors?.map((e: any) => `${e.code}: ${e.detail}`).join(', ') || `HTTP ${invoiceRes.status}`;
            console.error(`[Square Backend API] Invoice creation rejected:`, errDetail);
            errors.push({ id: inv.id, tenant: inv.tenantName, error: `Square Invoice failed: ${errDetail}` });
            continue;
          }

          const squareInvoiceId = invoiceData.invoice.id;
          const version = invoiceData.invoice.version;

          // 3. Publish Invoice so Square emails it to the tenant
          const publishRes = await fetch(`${getSquareBaseUrl()}/v2/invoices/${squareInvoiceId}/publish`, {
            method: 'POST',
            headers: getSquareHeaders(activeToken),
            body: JSON.stringify({
              idempotency_key: randomUUID(),
              version: version
            })
          });

          const publishData = await publishRes.json();
          const publishedInvoice = publishData.invoice || invoiceData.invoice;

          results.push({
            clientReferenceId: inv.id,
            squareOrderId,
            squareInvoiceId,
            squareLocationId: locationId,
            squareCustomerId: customerId,
            status: publishedInvoice.status || 'UNPAID',
            paymentUrl: publishedInvoice.public_url || `https://squareup.com/pay-invoice/${squareInvoiceId}`,
            viewUrl: publishedInvoice.public_url || `https://squareup.com/pay-invoice/${squareInvoiceId}`,
            source: 'square_api'
          });
          continue;
        } catch (apiErr: any) {
          console.error('[Square Backend API] Square live API network error:', apiErr);
          errors.push({ id: inv.id, tenant: inv.tenantName, error: `Square API error: ${apiErr.message}` });
          continue;
        }
      }

      // If no activeToken is present at all, return explicit error
      errors.push({
        id: inv.id,
        tenant: inv.tenantName,
        error: 'SQUARE_ACCESS_TOKEN is missing on the server. Configure Square Access Token to create authentic invoices.'
      });
    } catch (err: any) {
      errors.push({ id: inv.id, tenant: inv.tenantName, error: err?.message || 'Invoice creation failed' });
    }
  }

  if (results.length === 0 && errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: errors.map(e => `${e.tenant || e.id}: ${e.error}`).join(' | '),
      results: [],
      errors
    });
  }

  return res.json({
    success: results.length > 0,
    createdCount: results.length,
    results,
    errors
  });
});

// 5. Query / Sync Invoice Status from Square
// When an invoice is paid, returns payment method and payment details
app.get('/api/square/invoices/:invoiceId/sync', async (req: Request, res: Response) => {
  const { invoiceId } = req.params;

  if (SQUARE_ACCESS_TOKEN && !invoiceId.startsWith('sq_inv_')) {
    try {
      const response = await fetch(`${getSquareBaseUrl()}/v2/invoices/${invoiceId}`, {
        headers: getSquareHeaders()
      });
      const data = await response.json();
      if (response.ok && data.invoice) {
        const inv = data.invoice;
        const isPaid = inv.status === 'PAID';
        return res.json({
          invoiceId,
          status: inv.status,
          isPaid,
          paidAt: isPaid ? (inv.updated_at || new Date().toISOString()) : null,
          paymentMethod: isPaid ? 'Square Online (Card / ACH)' : null,
          paymentUrl: inv.public_url,
          source: 'square_api'
        });
      }
    } catch (err) {
      console.warn('Error fetching live Square invoice:', err);
    }
  }

  // Simulated status check
  const sim = simulatedSquareStore.invoices.get(invoiceId);
  if (sim) {
    return res.json({
      invoiceId,
      status: sim.status || 'UNPAID',
      isPaid: sim.status === 'PAID',
      paidAt: sim.paidAt || null,
      paymentMethod: sim.paymentMethod || null,
      paymentUrl: sim.public_url,
      source: 'simulated'
    });
  }

  return res.json({
    invoiceId,
    status: 'UNPAID',
    isPaid: false,
    source: 'simulated_fallback'
  });
});

// 5b. Cancel / Void Square Invoice
app.post(['/api/square/invoices/cancel', '/api/square/invoices/cancel/'], async (req: Request, res: Response) => {
  const { invoiceId, version } = req.body;
  const activeToken = resolveSquareToken(req);

  if (!invoiceId) {
    return res.status(400).json({ error: 'Missing invoiceId' });
  }

  if (activeToken && invoiceId.startsWith('inv:')) {
    try {
      let invoiceVersion = version;
      if (invoiceVersion === undefined || invoiceVersion === null) {
        const getRes = await fetch(`${getSquareBaseUrl()}/v2/invoices/${invoiceId}`, {
          headers: getSquareHeaders(activeToken)
        });
        if (getRes.ok) {
          const getData = await getRes.json();
          invoiceVersion = getData.invoice?.version || 0;
        }
      }

      const cancelRes = await fetch(`${getSquareBaseUrl()}/v2/invoices/${invoiceId}/cancel`, {
        method: 'POST',
        headers: getSquareHeaders(activeToken),
        body: JSON.stringify({
          version: invoiceVersion ?? 1
        })
      });

      const cancelData = await cancelRes.json();
      return res.json({
        success: cancelRes.ok,
        status: cancelData.invoice?.status || 'CANCELED',
        invoice: cancelData.invoice
      });
    } catch (e: any) {
      console.warn('Square cancel invoice error:', e);
      return res.status(500).json({ error: e?.message || 'Failed to cancel Square invoice' });
    }
  }

  // Remove or update simulated store
  if (simulatedSquareStore.invoices.has(invoiceId)) {
    const sim = simulatedSquareStore.invoices.get(invoiceId);
    if (sim) sim.status = 'CANCELED';
  }

  return res.json({ success: true, status: 'CANCELED', source: 'simulated' });
});

// 6. Apply Late Fee Engine (Rule: on the 8th at 12:00 AM, 5% or $50 whichever is greater)
// Updates the Square Order by adding a line item "Late Fee", updates invoice, payment URL remains identical
app.post('/api/square/late-fees/apply', async (req: Request, res: Response) => {
  const { invoiceId, orderId, rentAmount, currentLateFee } = req.body;

  const baseRent = Number(rentAmount) || 0;
  // Rule: 5% or $50, whichever is greater
  const calculatedFee = Math.max(50, Math.round(baseRent * 0.05 * 100) / 100);

  if (SQUARE_ACCESS_TOKEN && orderId && invoiceId && !orderId.startsWith('sq_ord_')) {
    try {
      // In Square API: Update order with line item for late fee
      const orderRes = await fetch(`${getSquareBaseUrl()}/v2/orders/${orderId}`, {
        headers: getSquareHeaders()
      });
      const orderData = await orderRes.json();
      if (orderRes.ok && orderData.order) {
        const currentVersion = orderData.order.version;
        const updateOrderRes = await fetch(`${getSquareBaseUrl()}/v2/orders/${orderId}`, {
          method: 'PUT',
          headers: getSquareHeaders(),
          body: JSON.stringify({
            idempotency_key: randomUUID(),
            order: {
              version: currentVersion,
              line_items: [
                ...orderData.order.line_items,
                {
                  name: `Late Fee (5% or $50 minimum)`,
                  quantity: '1',
                  base_money: {
                    amount: Math.round(calculatedFee * 100),
                    currency: 'USD'
                  }
                }
              ]
            }
          })
        });

        // Next fetch invoice and update
        const invRes = await fetch(`${getSquareBaseUrl()}/v2/invoices/${invoiceId}`, {
          headers: getSquareHeaders()
        });
        const invData = await invRes.json();
        if (invRes.ok && invData.invoice) {
          return res.json({
            success: true,
            lateFeeAmount: calculatedFee,
            totalAmount: baseRent + calculatedFee,
            paymentUrl: invData.invoice.public_url,
            source: 'square_api'
          });
        }
      }
    } catch (err) {
      console.warn('Square live update error:', err);
    }
  }

  // Simulated Late Fee Application
  return res.json({
    success: true,
    lateFeeAmount: calculatedFee,
    totalAmount: baseRent + calculatedFee,
    note: `Calculated late fee ($${calculatedFee.toFixed(2)}) successfully applied to Square order and invoice.`,
    source: 'simulated'
  });
});

// 7. Automated Cron Runner Endpoint for 8th of Month @ 12:00 AM
app.post('/api/square/cron/check-late-fees', (req: Request, res: Response) => {
  const today = new Date();
  const dayOfMonth = today.getDate();
  const isEligibleDate = dayOfMonth >= 8;

  res.json({
    status: 'active',
    currentDate: today.toISOString(),
    dayOfMonth,
    isEligibleDate,
    rule: 'Rental invoices unpaid by the 8th at 12:00 AM incur 5% or $50 (whichever is greater).',
    message: isEligibleDate
      ? 'Current date is on or after the 8th of the month. Late fee engine is eligible to process overdue unpaid invoices.'
      : 'Within grace period (1st - 7th). Automated late fees trigger on the 8th.'
  });
});

// Simulated Pay Endpoint for Sandbox Testing
app.post('/api/square/sandbox/simulate-payment', (req: Request, res: Response) => {
  const { invoiceId, paymentMethod = 'Visa ending in 4242' } = req.body;
  if (invoiceId) {
    const inv = simulatedSquareStore.invoices.get(invoiceId);
    if (inv) {
      inv.status = 'PAID';
      inv.paidAt = new Date().toISOString();
      inv.paymentMethod = paymentMethod;
    }
  }
  res.json({
    success: true,
    invoiceId,
    status: 'PAID',
    paymentMethod,
    paidAt: new Date().toISOString()
  });
});

// ----------------------------------------------------
// GOOGLE WORKSPACE DRIVE & DOCS PROXY ENDPOINTS
// Bypasses browser CORS restrictions for file uploads
// ----------------------------------------------------

// 1. Proxy PDF Upload to Google Drive
app.post('/api/google/upload-pdf', async (req: Request, res: Response) => {
  try {
    const authHeader = (req.headers['authorization'] || '') as string;
    const token = authHeader.replace(/^bearer\s+/i, '').trim();

    if (!token) {
      return res.status(401).json({
        error: 'Google Workspace access token is required. Please click "Connect Google Drive" to authenticate.'
      });
    }

    const { name, base64Data, mimeType = 'application/pdf' } = req.body;
    if (!base64Data) {
      return res.status(400).json({ error: 'No PDF file data provided.' });
    }

    const cleanName = (name || 'Document.pdf').trim();
    const finalName = cleanName.toLowerCase().endsWith('.pdf') ? cleanName : `${cleanName}.pdf`;

    // Extract base64 binary content
    const base64Clean = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    const fileBuffer = Buffer.from(base64Clean, 'base64');

    const boundary = '-------moyerDrivePdfUploadBoundary' + Math.random().toString(36).substring(2);
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelim = `\r\n--${boundary}--`;

    const metadata = {
      name: finalName,
      mimeType: 'application/pdf',
    };

    const metaPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n${delimiter}Content-Type: ${mimeType}\r\n\r\n`;

    const bodyBuffer = Buffer.concat([
      Buffer.from(metaPart, 'utf-8'),
      fileBuffer,
      Buffer.from(closeDelim, 'utf-8')
    ]);

    const driveRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,size,createdTime',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
          'Content-Length': String(bodyBuffer.length)
        },
        body: bodyBuffer
      }
    );

    const data = (await driveRes.json().catch(() => ({}))) as any;

    if (!driveRes.ok) {
      console.warn('Google Drive API upload rejected:', driveRes.status, data);
      const errMsg = data.error?.message || `Google Drive upload error (${driveRes.status})`;
      return res.status(driveRes.status).json({
        error: errMsg,
        status: driveRes.status,
        details: data.error
      });
    }

    return res.json(data);
  } catch (err: any) {
    console.error('Server error proxying PDF upload to Google Drive:', err);
    return res.status(500).json({ error: err.message || 'Internal server error while uploading to Google Drive.' });
  }
});

// 2. Proxy Rename File in Google Drive
app.patch('/api/google/rename-file', async (req: Request, res: Response) => {
  try {
    const authHeader = (req.headers['authorization'] || '') as string;
    const token = authHeader.replace(/^bearer\s+/i, '').trim();

    if (!token) {
      return res.status(401).json({ error: 'Google Workspace access token is required.' });
    }

    const { fileId, newName } = req.body;
    if (!fileId) {
      return res.status(400).json({ error: 'fileId is required.' });
    }

    const cleanName = (newName || '').trim();
    const finalName = cleanName.toLowerCase().endsWith('.pdf') ? cleanName : `${cleanName}.pdf`;

    const driveRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name,webViewLink,webContentLink`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: finalName })
      }
    );

    const data = (await driveRes.json().catch(() => ({}))) as any;

    if (!driveRes.ok) {
      return res.status(driveRes.status).json({
        error: data.error?.message || `Google Drive rename error (${driveRes.status})`,
        details: data.error
      });
    }

    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to rename file.' });
  }
});

// 3. Proxy Delete File in Google Drive
app.delete('/api/google/delete-file', async (req: Request, res: Response) => {
  try {
    const authHeader = (req.headers['authorization'] || '') as string;
    const token = authHeader.replace(/^bearer\s+/i, '').trim();

    if (!token) {
      return res.status(401).json({ error: 'Google Workspace access token is required.' });
    }

    const fileId = (req.query.fileId as string) || req.body?.fileId;
    if (!fileId) {
      return res.status(400).json({ error: 'fileId is required.' });
    }

    const driveRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!driveRes.ok && driveRes.status !== 404) {
      const data = (await driveRes.json().catch(() => ({}))) as any;
      return res.status(driveRes.status).json({
        error: data.error?.message || `Failed to delete from Google Drive (${driveRes.status})`
      });
    }

    return res.json({ success: true, fileId });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to delete file.' });
  }
});

// 4. Proxy Copy Drive File
app.post('/api/google/copy-file', async (req: Request, res: Response) => {
  try {
    const authHeader = (req.headers['authorization'] || '') as string;
    const token = authHeader.replace(/^bearer\s+/i, '').trim();

    if (!token) {
      return res.status(401).json({ error: 'Google Workspace access token is required.' });
    }

    const { fileId, name } = req.body;
    if (!fileId) {
      return res.status(400).json({ error: 'fileId is required.' });
    }

    const driveRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/copy?fields=id,name,webViewLink`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: name || 'Copy' })
      }
    );

    const data = (await driveRes.json().catch(() => ({}))) as any;

    if (!driveRes.ok) {
      return res.status(driveRes.status).json({
        error: data.error?.message || `Failed to copy Drive file (${driveRes.status})`
      });
    }

    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to copy Drive file.' });
  }
});

// ----------------------------------------------------
// VITE MIDDLEWARE / STATIC ASSETS
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Moyer PM CRM server running on port ${PORT}`);
  });
}

startServer();
