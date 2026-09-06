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

export async function handleCustomerSearchOrCreate(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

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

  let email = '';
  let firstName = '';
  let lastName = '';
  let phone = '';
  let note = '';

  if (request.method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as any;
    email = (body.email || '').trim();
    firstName = (body.firstName || '').trim();
    lastName = (body.lastName || '').trim();
    phone = (body.phone || '').trim();
    note = (body.note || '').trim();
  } else {
    email = (url.searchParams.get('email') || '').trim();
    firstName = (url.searchParams.get('firstName') || '').trim();
    lastName = (url.searchParams.get('lastName') || '').trim();
    phone = (url.searchParams.get('phone') || '').trim();
    note = (url.searchParams.get('note') || '').trim();
  }

  if (!email) {
    return jsonResponse({ success: false, error: 'Email address is required.' }, 400);
  }

  const cleanEmail = email.toLowerCase();

  // If in Production and no access token is available, return informative error or fallback
  if (!accessToken) {
    if (isProduction) {
      return jsonResponse({
        success: false,
        error: 'Square Access Token not found in Cloudflare Pages. Please add SQUARE_ACCESS_TOKEN under Cloudflare Pages Settings > Environment variables.',
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
    if (firstName) createPayload.given_name = firstName;
    if (lastName) createPayload.family_name = lastName;
    if (phone) createPayload.phone_number = phone;

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

export async function onRequestGet(context: { request: Request; env: Env }): Promise<Response> {
  const url = new URL(context.request.url);
  if (!url.searchParams.get('email')) {
    return jsonResponse({
      status: 'online',
      endpoint: '/api/square/customers/search-or-create',
      method: 'GET or POST',
      description: 'Searches Square customer by email or creates a new customer. Supply ?email=...'
    });
  }
  return handleCustomerSearchOrCreate(context.request, context.env);
}

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  return handleCustomerSearchOrCreate(context.request, context.env);
}

export const onRequest = onRequestPost;
