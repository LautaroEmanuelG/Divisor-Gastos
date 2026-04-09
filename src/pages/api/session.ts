export const prerender = false;

import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const DATA_DIR = path.join(process.cwd(), 'data');
const MAX_FILES = 20;

export const POST: APIRoute = async ({ request }) => {
  try {
    const text = await request.text();
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      return new Response(JSON.stringify({ error: 'JSON inválido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const session = body as Record<string, unknown>;
    if (!Array.isArray(session.participants) || !Array.isArray(session.expenses)) {
      return new Response(JSON.stringify({ error: 'Datos de sesión inválidos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    fs.mkdirSync(DATA_DIR, { recursive: true });

    const id = crypto.randomBytes(6).toString('hex');
    fs.writeFileSync(path.join(DATA_DIR, `${id}.json`), JSON.stringify(body), 'utf-8');

    // Eliminar archivos viejos si supera el límite
    const files = fs.readdirSync(DATA_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => ({ name: f, mtime: fs.statSync(path.join(DATA_DIR, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime);

    if (files.length > MAX_FILES) {
      files.slice(MAX_FILES).forEach(f => fs.unlinkSync(path.join(DATA_DIR, f.name)));
    }

    return new Response(JSON.stringify({ id }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[/api/session POST]', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
