// Cloudflare Pages Function: /api/google/replace-file-content
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
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

function parseBase64ToBytes(base64String: string): Uint8Array {
  const clean = base64String.includes(',') ? base64String.split(',')[1] : base64String;
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestPatch(context: { request: Request }): Promise<Response> {
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
    const body = (await request.json().catch(() => ({}))) as any;
    const { fileId, base64Data, mimeType = 'application/pdf' } = body;
    if (!fileId) {
      return jsonResponse({ error: 'fileId is required.' }, 400);
    }
    if (!base64Data) {
      return jsonResponse({ error: 'No PDF file data provided.' }, 400);
    }

    const fileBytes = parseBase64ToBytes(base64Data);

    const driveRes = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fileId)}?uploadType=media&fields=id,name,webViewLink,webContentLink,modifiedTime`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': mimeType,
          'Content-Length': String(fileBytes.length),
        },
        body: fileBytes,
      }
    );

    const data = (await driveRes.json().catch(() => ({}))) as any;
    if (!driveRes.ok) {
      return jsonResponse({
        error: data?.error?.message || `Failed to update file in Google Drive (${driveRes.status})`,
        source: 'cloudflare_pages_api',
      }, driveRes.status);
    }

    return jsonResponse(data, 200);
  } catch (err: any) {
    return jsonResponse({ error: err.message || 'Failed to replace file content in Google Drive.', source: 'cloudflare_pages_api' }, 500);
  }
}

export const onRequest = onRequestPatch;
export const onRequestPost = onRequestPatch;
