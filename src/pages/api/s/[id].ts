// GET /api/s/[id]  → devuelve la sesión guardada
export const prerender = false;

import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params }) => {
  const id = params.id ?? '';
  if (!/^[a-z0-9]{4,10}$/.test(id)) {
    return new Response('Not found', { status: 404 });
  }
  try {
    const { kv } = await import('@vercel/kv');
    const data = await kv.get<string>(`s:${id}`);
    if (!data) return new Response('Not found', { status: 404 });

    const body = typeof data === 'string' ? data : JSON.stringify(data);
    return new Response(body, {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[GET /api/s]', err);
    return new Response('Error', { status: 500 });
  }
};
