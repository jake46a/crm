// Cloudflare Pages Function: /api/google/upload-pdf
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

function parseBase64ToBytes(base64String: string): Uint8Array {
  const clean = base64String.includes(',') ? base64String.split(',')[1] : base64String;
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function buildMultipartBody(metadata: any, fileBytes: Uint8Array, boundary: string, mimeType = 'application/pdf'): Uint8Array {
  const encoder = new TextEncoder();
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelim = `\r\n--${boundary}--`;
  const metaPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n${delimiter}Content-Type: ${mimeType}\r\n\r\n`;

  const metaBytes = encoder.encode(metaPart);
  const closeBytes = encoder.encode(closeDelim);

  const totalLength = metaBytes.length + fileBytes.length + closeBytes.length;
  const merged = new Uint8Array(totalLength);
  merged.set(metaBytes, 0);
  merged.set(fileBytes, metaBytes.length);
  merged.set(closeBytes, metaBytes.length + fileBytes.length);
  return merged;
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
      error: 'Google Workspace access token is required. Please authenticate with Google Drive.',
      source: 'cloudflare_pages_api',
    }, 401);
  }

  try {
    const body = (await request.json().catch(() => ({}))) as any;
    const { name, base64Data, mimeType = 'application/pdf' } = body;
    if (!base64Data) {
      return jsonResponse({ error: 'No PDF file data provided.' }, 400);
    }

    const cleanName = (name || 'Document.pdf').trim();
    const finalName = cleanName.toLowerCase().endsWith('.pdf') ? cleanName : `${cleanName}.pdf`;
    const fileBytes = parseBase64ToBytes(base64Data);

    const boundary = '-------moyerCfUploadBoundary' + Math.random().toString(36).substring(2);
    const metadata = { name: finalName, mimeType: 'application/pdf' };
    const multipartBody = buildMultipartBody(metadata, fileBytes, boundary, mimeType);

    const driveRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,size,createdTime',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
          'Content-Length': String(multipartBody.length),
        },
        body: multipartBody,
      }
    );

    const data = (await driveRes.json().catch(() => ({}))) as any;
    if (!driveRes.ok) {
      return jsonResponse({
        error: data?.error?.message || `Google Drive upload error (${driveRes.status})`,
        status: driveRes.status,
        details: data?.error,
        source: 'cloudflare_pages_api',
      }, driveRes.status);
    }

    return jsonResponse(data, 200);
  } catch (err: any) {
    return jsonResponse({ error: err.message || 'Edge upload failed', source: 'cloudflare_pages_api' }, 500);
  }
}

export const onRequest = onRequestPost;
