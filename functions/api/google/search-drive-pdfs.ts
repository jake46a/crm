// Cloudflare Pages Function: /api/google/search-drive-pdfs
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

  if (!token) {
    return jsonResponse({
      error: 'Google Workspace access token is required. Please authenticate with Google Drive.',
      source: 'cloudflare_pages_api',
    }, 401);
  }

  try {
    const url = new URL(request.url);
    const keyword = (url.searchParams.get('keyword') || '').trim();
    let queryClause = "mimeType = 'application/pdf' and trashed = false";
    if (keyword) {
      const escaped = keyword.replace(/'/g, "\\'");
      queryClause += ` and name contains '${escaped}'`;
    }

    const driveRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(queryClause)}&fields=files(id,name,webViewLink,webContentLink,size,createdTime,modifiedTime)&pageSize=50&orderBy=modifiedTime desc`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = (await driveRes.json().catch(() => ({}))) as any;
    if (!driveRes.ok) {
      return jsonResponse({
        error: data?.error?.message || `Failed to search Google Drive (${driveRes.status})`,
        source: 'cloudflare_pages_api',
      }, driveRes.status);
    }

    return jsonResponse(data, 200);
  } catch (err: any) {
    return jsonResponse({ error: err.message || 'Failed to search Google Drive files.', source: 'cloudflare_pages_api' }, 500);
  }
}

export const onRequest = onRequestGet;
export const onRequestPost = onRequestGet;
