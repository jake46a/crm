// Cloudflare Pages Function: /api/google/status
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

export async function onRequestGet(context: { request: Request }): Promise<Response> {
  const { request } = context;
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace(/^bearer\s+/i, '').trim();

  return jsonResponse({
    status: 'online',
    platform: 'cloudflare-pages',
    hasToken: Boolean(token && token.length > 5),
    endpoints: [
      '/api/google/upload-pdf',
      '/api/google/copy-file',
      '/api/google/rename-file',
      '/api/google/delete-file',
      '/api/google/search-drive-pdfs',
      '/api/google/replace-file-content',
    ],
  });
}

export const onRequest = onRequestGet;
export const onRequestPost = onRequestGet;
