// Cloudflare Pages Function: /api/square/invoices/create-batch
import { onRequestPost as handleCreateBatch } from '../../[[path]]';

export const onRequestPost = handleCreateBatch;
export const onRequest = handleCreateBatch;

export async function onRequestGet(): Promise<Response> {
  return new Response(JSON.stringify({
    status: 'online',
    endpoint: '/api/square/invoices/create-batch',
    method: 'POST',
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

