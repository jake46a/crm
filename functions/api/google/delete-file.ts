// Cloudflare Pages Function: /api/google/delete-file
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
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

export async function onRequestDelete(context: { request: Request }): Promise<Response> {
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
    let fileId = url.searchParams.get('fileId') || '';
    if (!fileId) {
      const body = (await request.json().catch(() => ({}))) as any;
      fileId = body?.fileId || '';
    }

    if (!fileId) {
      return jsonResponse({ error: 'fileId is required.' }, 400);
    }

    const driveRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!driveRes.ok && driveRes.status !== 404) {
      const data = (await driveRes.json().catch(() => ({}))) as any;
      return jsonResponse({
        error: data?.error?.message || `Failed to delete from Google Drive (${driveRes.status})`,
        source: 'cloudflare_pages_api',
      }, driveRes.status);
    }

    return jsonResponse({ success: true, fileId }, 200);
  } catch (err: any) {
    return jsonResponse({ error: err.message || 'Failed to delete file.', source: 'cloudflare_pages_api' }, 500);
  }
}

export const onRequest = onRequestDelete;
export const onRequestPost = onRequestDelete;
