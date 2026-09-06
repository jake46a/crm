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

    // Route all /api/* endpoints to the edge API handler
    if (url.pathname.startsWith('/api/')) {
      return onRequest({
        request,
        env,
        params: { path: url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean) }
      });
    }

    // Pass all other requests to Cloudflare Pages static assets
    if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      return env.ASSETS.fetch(request);
    }

    // Fallback if not running on Cloudflare Pages
    return new Response('Not Found', { status: 404 });
  }
};
