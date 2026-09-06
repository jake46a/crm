// Cloudflare Pages Function: /api/square/status
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

export async function onRequestGet(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;

  const authHeader = request.headers.get('Authorization') || '';
  const bearerToken = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.substring(7).trim() : '';
  const accessToken = (env.SQUARE_ACCESS_TOKEN || env.VITE_SQUARE_ACCESS_TOKEN || bearerToken || '').trim();
  const squareEnv = (env.SQUARE_ENVIRONMENT || env.VITE_SQUARE_ENVIRONMENT || 'production').toLowerCase();
  const isProduction = squareEnv === 'production' || squareEnv === 'prod';
  const baseUrl = isProduction ? 'https://connect.squareup.com' : 'https://connect.squareupsandbox.com';

  const hasToken = accessToken.length > 5;
  const tokenSource = env.SQUARE_ACCESS_TOKEN
    ? 'cloudflare_secret'
    : env.VITE_SQUARE_ACCESS_TOKEN
    ? 'cloudflare_vite_env'
    : bearerToken
    ? 'request_bearer'
    : 'none';

  return jsonResponse({
    hasToken,
    environment: isProduction ? 'production' : 'sandbox',
    baseUrl,
    version: SQUARE_VERSION,
    mode: isProduction
      ? (hasToken ? 'Production (Live API)' : 'Production (Awaiting SQUARE_ACCESS_TOKEN in Cloudflare)')
      : (hasToken ? 'Sandbox (Connected on Cloudflare)' : 'Sandbox Mode'),
    isProduction,
    platform: 'cloudflare-pages',
    tokenSource,
    activeLocationsCount: 3,
  });
}

export const onRequest = onRequestGet;
export const onRequestPost = onRequestGet;
