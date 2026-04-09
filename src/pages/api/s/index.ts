// POST /api/s  → guarda sesión, devuelve { id: "a3x9k2" }
export const prerender = false;

import type { APIRoute } from 'astro';

function shortId() {
  // 6 chars base36 → "?s=a3x9k2" = 9 chars total, siempre < 15
  return Math.random().toString(36).slice(2, 8);
}

const TTL_SECONDS = 60 * 60 * 24 * 30; // 30 días

export const POST: APIRoute = async ({ request }) => {
  try {
    const text = await request.text();
    let body: unknown;
    try { body = JSON.parse(text); } catch {
      return json({ error: 'JSON inválido' }, 400);
    }
    const s = body as Record<string, unknown>;
    if (!Array.isArray(s.participants) || !Array.isArray(s.expenses)) {
      return json({ error: 'Datos inválidos' }, 400);
    }

    const { kv } = await import('@vercel/kv');
    const id = shortId();
    await kv.set(`s:${id}`, text, { ex: TTL_SECONDS });

    return json({ id });
  } catch (err) {
    console.error('[POST /api/s]', err);
    return json({ error: String(err) }, 500);
  }
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
