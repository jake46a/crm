// Cloudflare Pages Function: /api/square/diagnostics
// Supports both POST and GET to eliminate HTTP 405 Method Not Allowed errors on Cloudflare Pages
interface Env {
  SQUARE_ACCESS_TOKEN?: string;
  VITE_SQUARE_ACCESS_TOKEN?: string;
  SQUARE_APPLICATION_ID?: string;
  VITE_SQUARE_APPLICATION_ID?: string;
  SQUARE_ENVIRONMENT?: string;
  VITE_SQUARE_ENVIRONMENT?: string;
  SQUARE_DEFAULT_LOCATION_ID?: string;
  VITE_SQUARE_DEFAULT_LOCATION_ID?: string;
  [key: string]: any;
}

const SQUARE_VERSION = '2025-02-20';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Square-Version, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequest(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Parse locationId and environment from either POST body or GET query params
  let body: any = {};
  if (request.method === 'POST') {
    try {
      body = await request.json().catch(() => ({}));
    } catch {
      body = {};
    }
  }

  const authHeader = request.headers.get('Authorization') || '';
  const bearerToken = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.substring(7).trim() : '';
  const accessToken = (env.SQUARE_ACCESS_TOKEN || env.VITE_SQUARE_ACCESS_TOKEN || bearerToken || '').trim();
  const applicationId = (env.SQUARE_APPLICATION_ID || env.VITE_SQUARE_APPLICATION_ID || '').trim();
  const defaultLocationId = (env.SQUARE_DEFAULT_LOCATION_ID || env.VITE_SQUARE_DEFAULT_LOCATION_ID || 'LN4WBHANNNZ2Y').trim();
  
  const locationIdToCheck = ((body.locationId || url.searchParams.get('locationId') || defaultLocationId) as string).trim();
  const requestedEnv = ((body.environment || url.searchParams.get('environment') || env.SQUARE_ENVIRONMENT || env.VITE_SQUARE_ENVIRONMENT || 'production') as string).toLowerCase().trim();
  const isTargetProd = requestedEnv === 'production' || requestedEnv === 'prod';
  const targetBaseUrl = isTargetProd ? 'https://connect.squareup.com' : 'https://connect.squareupsandbox.com';

  const logs: string[] = [];
  const timestamp = () => new Date().toISOString().substring(11, 19);

  logs.push(`[${timestamp()}] Initializing Square API Diagnostics (Cloudflare Pages Function)...`);
  logs.push(`[${timestamp()}] Active Environment: ${isTargetProd ? 'PRODUCTION' : 'SANDBOX'}`);
  logs.push(`[${timestamp()}] Square Base URL: ${targetBaseUrl}`);
  logs.push(`[${timestamp()}] Target Location ID to verify: ${locationIdToCheck || '(None specified)'}`);

  const hasToken = accessToken.length > 5;
  const maskedToken = hasToken
    ? `${accessToken.substring(0, 6)}...${accessToken.substring(accessToken.length - 4)} (Length: ${accessToken.length})`
    : 'No Token Configured';

  logs.push(`[${timestamp()}] Access Token status: ${hasToken ? 'Present' : 'MISSING'} [${maskedToken}]`);

  const isPlaceholderLocation = ['LOC_SPEER', 'LOC_CAPHILL', 'LOC_HIGHLANDS', 'LOC_DEMO', 'LOC_SAMPLE'].includes(locationIdToCheck.toUpperCase());
  if (isPlaceholderLocation) {
    logs.push(`[${timestamp()}] ⚠️ WARNING: Location ID "${locationIdToCheck}" is an internal placeholder, NOT a real Square Merchant Location ID!`);
  }

  let merchantInfo: any = null;
  let locationsList: any[] = [];
  let targetLocationDetails: any = null;
  let apiPingOk = false;
  let apiPingStatus = 0;
  let apiError: string | null = null;

  if (hasToken) {
    try {
      logs.push(`[${timestamp()}] Sending GET ${targetBaseUrl}/v2/locations to verify connectivity & list merchant locations...`);
      const tStart = Date.now();
      const sqRes = await fetch(`${targetBaseUrl}/v2/locations`, {
        method: 'GET',
        headers: {
          'Square-Version': SQUARE_VERSION,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      });
      const tElapsed = Date.now() - tStart;
      apiPingStatus = sqRes.status;

      if (sqRes.ok) {
        apiPingOk = true;
        const data = await sqRes.json() as any;
        locationsList = data.locations || [];
        logs.push(`[${timestamp()}] HTTP 200 OK (${tElapsed}ms): Found ${locationsList.length} live location(s) in Square merchant account.`);

        if (locationsList.length > 0) {
          const firstLoc = locationsList[0];
          merchantInfo = {
            merchantId: firstLoc.merchant_id || 'N/A',
            businessName: firstLoc.business_name || firstLoc.name || '1070YankStreet.com',
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
        const errBody = await sqRes.text();
        apiError = `Square API returned HTTP ${sqRes.status}: ${errBody.substring(0, 200)}`;
        logs.push(`[${timestamp()}] ❌ Error pinging Square API: HTTP ${sqRes.status}`);
        logs.push(`[${timestamp()}]    Details: ${apiError}`);
      }
    } catch (fetchErr: any) {
      apiError = fetchErr?.message || 'Network error connecting to Square';
      logs.push(`[${timestamp()}] ❌ Network exception querying Square API: ${apiError}`);
    }
  } else {
    apiError = 'Square Access Token is missing from environment secrets.';
    logs.push(`[${timestamp()}] ❌ Cannot connect to Square: SQUARE_ACCESS_TOKEN is not configured.`);
  }

  // Analyze 404 Payment Link Root Causes
  const rootCauses: string[] = [];
  if (!hasToken) {
    rootCauses.push('Square Access Token is missing. Invoices cannot be created without a valid token.');
  }
  if (isPlaceholderLocation) {
    rootCauses.push(`Invalid Location ID "${locationIdToCheck}": Square API rejects invoice creation for placeholder IDs with "NOT_FOUND: Location with ID ${locationIdToCheck} not found". When invoice creation fails, opening uncreated links produces a 404 Not Found error.`);
  } else if (apiPingOk && !targetLocationDetails) {
    rootCauses.push(`Location ID "${locationIdToCheck}" is not registered on this Square account. Valid locations: ${locationsList.map((l: any) => `${l.name} (${l.id})`).join(', ')}`);
  }
  if (apiError && !isPlaceholderLocation) {
    rootCauses.push(`Square API Authentication Error: ${apiError}. Invoices cannot be published on Square without authentic API credentials.`);
  }

  const hasRisk = rootCauses.length > 0;
  const recommendedLocationId = (targetLocationDetails?.id || (locationsList.length > 0 ? locationsList[0].id : 'LN4WBHANNNZ2Y'));

  if (hasRisk) {
    logs.push(`[${timestamp()}] ⚠️ 404 PAYMENT LINK DIAGNOSIS: ACTION REQUIRED to prevent 404 links:`);
    rootCauses.forEach(c => logs.push(`[${timestamp()}]   - ${c}`));
  } else {
    logs.push(`[${timestamp()}] ✅ 404 PAYMENT LINK DIAGNOSIS: CLEARED. Live Square invoices will be minted with authentic payment URLs.`);
  }

  return jsonResponse({
    success: apiPingOk,
    timestamp: new Date().toISOString(),
    environment: isTargetProd ? 'production' : 'sandbox',
    baseUrl: targetBaseUrl,
    applicationId: applicationId || null,
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
      name: loc.name || 'Square Location',
      businessName: loc.business_name || '',
      status: loc.status || 'ACTIVE',
      address: loc.address || {},
      currency: loc.currency || 'USD',
      capabilities: loc.capabilities || []
    })),
    targetLocation: {
      queriedId: locationIdToCheck,
      isPlaceholder: isPlaceholderLocation,
      verified: Boolean(targetLocationDetails),
      details: targetLocationDetails
    },
    paymentLink404Analysis: {
      hasRisk,
      causes: rootCauses,
      recommendedLocationId,
      status: hasRisk ? 'CONFIGURATION_DEFECT' : 'HEALTHY'
    },
    logs
  }, 200);
}

// Explicit method handler exports required by Cloudflare Pages Functions to avoid 405 Method Not Allowed
export const onRequestGet = onRequest;
export const onRequestPost = onRequest;
