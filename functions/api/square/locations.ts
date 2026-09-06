// Cloudflare Pages Function: /api/square/locations
interface Env {
  SQUARE_ACCESS_TOKEN?: string;
  VITE_SQUARE_ACCESS_TOKEN?: string;
  SQUARE_ENVIRONMENT?: string;
  VITE_SQUARE_ENVIRONMENT?: string;
  [key: string]: any;
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

export async function onRequest(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const authHeader = request.headers.get('Authorization') || '';
  const bearerToken = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.substring(7).trim() : '';
  const accessToken = (env.SQUARE_ACCESS_TOKEN || env.VITE_SQUARE_ACCESS_TOKEN || bearerToken || '').trim();
  const squareEnv = (env.SQUARE_ENVIRONMENT || env.VITE_SQUARE_ENVIRONMENT || 'production').toLowerCase();
  const isProduction = squareEnv === 'production' || squareEnv === 'prod';
  const baseUrl = isProduction ? 'https://connect.squareup.com' : 'https://connect.squareupsandbox.com';

  if (accessToken) {
    try {
      const sqRes = await fetch(`${baseUrl}/v2/locations`, {
        method: 'GET',
        headers: {
          'Square-Version': SQUARE_VERSION,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      });
      const data = await sqRes.json() as any;
      if (sqRes.ok && data.locations) {
        return jsonResponse({
          locations: data.locations.map((loc: any) => ({
            id: loc.id,
            name: loc.name || 'Square Merchant Location',
            businessName: loc.business_name || '',
            address: loc.address || {},
            status: loc.status || 'ACTIVE',
            currency: loc.currency || 'USD',
            capabilities: loc.capabilities || []
          })),
          source: 'square_live_api'
        });
      }
    } catch (err) {
      console.warn('Square locations fetch failed on Cloudflare, using fallback:', err);
    }
  }

  return jsonResponse({
    locations: [
      { id: 'LN4WBHANNNZ2Y', name: '1070 (1070 Yank St, Golden, CO)', address: { address_line_1: '1070 Yank St', locality: 'Golden', administrative_district_level_1: 'CO', postal_code: '80401-4223' }, status: 'ACTIVE' },
      { id: 'S2C67DJTB5S53', name: 'PWA (ProWeb.Agency)', address: { address_line_1: '1070 Yank St', locality: 'Golden', administrative_district_level_1: 'CO', postal_code: '80401' }, status: 'ACTIVE' },
      { id: 'LW2PEV9NMHM5Q', name: 'christinescollectibles.com', address: { address_line_1: '1070 Yank St', locality: 'Golden', administrative_district_level_1: 'CO', postal_code: '80401-4223' }, status: 'ACTIVE' }
    ],
    source: 'simulated'
  });
}

export const onRequestGet = onRequest;
export const onRequestPost = onRequest;
