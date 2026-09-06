// Cloudflare Pages Function: /api/square/invoices/create-batch
import { onRequest as handleCreateBatch } from '../../[[path]]';

export const onRequestPost = handleCreateBatch;
export const onRequest = handleCreateBatch;

export async function onRequestGet(context: any): Promise<Response> {
  const url = new URL(context.request.url);
  if (url.searchParams.has('payload') || url.searchParams.has('invoices')) {
    return handleCreateBatch(context);
  }
  return new Response(JSON.stringify({
    status: 'online',
    endpoint: '/api/square/invoices/create-batch',
    methods: ['POST', 'GET'],
    description: 'Generates and publishes a batch of Square invoices'
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Square-Version, x-square-access-token',
    }
  });
}


