export const prerender = false;

import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.join(process.cwd(), 'data');

export const GET: APIRoute = ({ params }) => {
  const id = params.id ?? '';
  if (!/^[\w-]{1,20}$/.test(id)) {
    return new Response('Not found', { status: 404 });
  }

  const file = path.join(DATA_DIR, `${id}.json`);
  if (!fs.existsSync(file)) {
    return new Response('Not found', { status: 404 });
  }

  return new Response(fs.readFileSync(file, 'utf-8'), {
    headers: { 'Content-Type': 'application/json' },
  });
};
