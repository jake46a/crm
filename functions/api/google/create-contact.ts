// Cloudflare Pages Function: /api/google/create-contact
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
};

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      ...corsHeaders,
    },
  });
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestPost(context: { request: Request }): Promise<Response> {
  const { request } = context;

  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace(/^bearer\s+/i, '').trim();

  if (!token) {
    return jsonResponse({
      error: 'Google Workspace access token is required. Please authenticate with Google Contacts.',
      source: 'cloudflare_pages_api',
    }, 401);
  }

  try {
    const body = (await request.json().catch(() => ({}))) as any;
    if (!body || !body.names?.length) {
      return jsonResponse({ error: 'Valid contact payload with names is required.' }, 400);
    }

    const peopleRes = await fetch('https://people.googleapis.com/v1/people:createContact', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = (await peopleRes.json().catch(() => ({}))) as any;
    if (!peopleRes.ok) {
      return jsonResponse({
        error: data?.error?.message || `Google People API error (${peopleRes.status})`,
        details: data?.error,
        source: 'cloudflare_pages_api',
      }, peopleRes.status);
    }

    return jsonResponse(data, 200);
  } catch (err: any) {
    return jsonResponse({ error: err.message || 'Failed to create Google Contact.', source: 'cloudflare_pages_api' }, 500);
  }
}

export const onRequest = onRequestPost;
