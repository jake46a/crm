// Cloudflare Pages Function: /api/square/customers/search-or-create

interface Env {
  SQUARE_ACCESS_TOKEN?: string;
  SQUARE_ENVIRONMENT?: string;
  VITE_SQUARE_ACCESS_TOKEN?: string;
  VITE_SQUARE_ENVIRONMENT?: string;
  SQUARE_DEFAULT_LOCATION_ID?: string;
}

const SQUARE_VERSION = '2025-02-20';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Square-Version',
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

export async function onRequestGet(): Promise<Response> {
  return jsonResponse({
    status: 'online',
    endpoint: '/api/square/customers/search-or-create',
    method: 'POST',
    description: 'Searches Square customer by email or creates a new customer.'
  });
}

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;

  const authHeader = request.headers.get('Authorization') || '';
  const bearerToken = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.substring(7).trim() : '';
  const accessToken = (env.SQUARE_ACCESS_TOKEN || env.VITE_SQUARE_ACCESS_TOKEN || bearerToken || '').trim();
  const squareEnv = (env.SQUARE_ENVIRONMENT || env.VITE_SQUARE_ENVIRONMENT || 'production').toLowerCase();
  const isProduction = squareEnv === 'production' || squareEnv === 'prod';
  const baseUrl = isProduction ? 'https://connect.squareup.com' : 'https://connect.squareupsandbox.com';

  const squareHeaders = {
    'Square-Version': SQUARE_VERSION,
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  const body = (await request.json().catch(() => ({}))) as any;
  const { email, firstName, lastName, phone, note } = body;

  if (!email || !email.trim()) {
    return jsonResponse({ success: false, error: 'Email address is required.' }, 400);
  }

  const cleanEmail = email.trim().toLowerCase();

  // If in Production and no access token is available, return informative error
  if (!accessToken) {
    if (isProduction) {
      return jsonResponse({
        success: false,
        error: 'Square Access Token not found in Cloudflare Pages. Please add SQUARE_ACCESS_TOKEN under Cloudflare Pages Settings > Environment variables (for both Production and Preview) and retry deployment.',
        source: 'missing_token'
      }, 400);
    }

    const fallbackId = `sq_cust_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
    return jsonResponse({
      success: true,
      customerId: fallbackId,
      customer: {
        id: fallbackId,
        given_name: firstName || 'Tenant',
        family_name: lastName || '',
        email_address: cleanEmail,
        phone_number: phone || ''
      },
      isNew: true,
      source: 'simulated',
      warning: 'Sandbox simulated ID generated (no token configured).'
    });
  }

  try {
    // Step A: Search by exact email
    const searchRes = await fetch(`${baseUrl}/v2/customers/search`, {
      method: 'POST',
      headers: squareHeaders,
      body: JSON.stringify({
        query: {
          filter: {
            email_address: { exact: cleanEmail }
          }
        }
      })
    });

    const searchData = (await searchRes.json()) as any;

    if (!searchRes.ok) {
      const errMsg = searchData?.errors?.map((e: any) => `${e.code}: ${e.detail}`).join(', ') || `Square Search HTTP ${searchRes.status}`;
      return jsonResponse({
        success: false,
        error: `Square Customers API Search Error: ${errMsg}`,
        details: searchData?.errors,
        source: 'square_api_error'
      }, searchRes.status);
    }

    if (searchData.customers && searchData.customers.length > 0) {
      const customer = searchData.customers[0];
      return jsonResponse({
        success: true,
        customerId: customer.id,
        customer,
        isNew: false,
        source: 'square_live_api'
      });
    }

    // Step B: Customer not found, create new customer in Square
    const createPayload: any = {
      idempotency_key: crypto.randomUUID(),
      email_address: cleanEmail,
      note: note || 'Moyer Property Management Speer House Tenant'
    };
    if (firstName?.trim()) createPayload.given_name = firstName.trim();
    if (lastName?.trim()) createPayload.family_name = lastName.trim();
    if (phone?.trim()) createPayload.phone_number = phone.trim();

    const createRes = await fetch(`${baseUrl}/v2/customers`, {
      method: 'POST',
      headers: squareHeaders,
      body: JSON.stringify(createPayload)
    });

    const createData = (await createRes.json()) as any;

    if (!createRes.ok) {
      const errMsg = createData?.errors?.map((e: any) => `${e.code}: ${e.detail}`).join(', ') || `Square Customer Create HTTP ${createRes.status}`;
      return jsonResponse({
        success: false,
        error: `Square Customer Create Error: ${errMsg}`,
        details: createData?.errors,
        source: 'square_api_error'
      }, createRes.status);
    }

    if (createData.customer) {
      return jsonResponse({
        success: true,
        customerId: createData.customer.id,
        customer: createData.customer,
        isNew: true,
        source: 'square_live_api'
      });
    }

    return jsonResponse({
      success: false,
      error: 'Customer creation succeeded on Square but did not return a customer record.',
      source: 'square_api_error'
    }, 500);

  } catch (err: any) {
    console.warn('Square customer sync network issue on Cloudflare:', err);
    return jsonResponse({
      success: false,
      error: `Square API connection failure: ${err?.message || 'Network error'}`,
      source: 'network_error'
    }, 502);
  }
}

export const onRequest = onRequestPost;
