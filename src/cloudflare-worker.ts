/**
 * Cloudflare Pages Advanced Mode Worker (_worker.js)
 * 
 * Provides an edge handler for Cloudflare Pages that routes /api/* to our
 * API handlers while proxying all other requests to static assets (env.ASSETS).
 * This eliminates "405 Method Not Allowed" errors on Cloudflare Pages,
 * supporting both Git-based deployments and Direct Uploads.
 */
import { onRequest } from '../functions/api/[[path]]';

export default {
  async fetch(request: Request, env: any, context: any): Promise<Response> {
    const url = new URL(request.url);

    // Explicitly handle CORS preflight for all /api/ paths to guarantee 204
    if (url.pathname.startsWith('/api/') && request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-square-access-token, Square-Version',
          'Access-Control-Max-Age': '86400',
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        }
      });
    }

    // Route all /api/* endpoints to the edge API handler
    if (url.pathname.startsWith('/api/')) {
      try {
        const response = await onRequest({
          request,
          env,
          params: { path: url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean) }
        });
        return response;
      } catch (err: any) {
        return new Response(JSON.stringify({
          error: err?.message || 'Internal Edge Worker Error',
          source: 'cloudflare_worker_edge'
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
          }
        });
      }
    }

    // Pass all other requests to Cloudflare Pages static assets
    if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      return env.ASSETS.fetch(request);
    }

    // Fallback if not running on Cloudflare Pages
    return new Response('Not Found', { status: 404 });
  }
};
