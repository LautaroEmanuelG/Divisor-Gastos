export const prerender = false;

import type { APIRoute } from 'astro';
import { h } from 'preact';
import { ImageResponse } from '@vercel/og';

const WIDTH = 1200;
const HEIGHT = 630;

const buildDefaultImage = (iconUrl: string) => {
  return new ImageResponse(
    h(
      'div',
      {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          background:
            'radial-gradient(circle at 15% 20%, #ffffff 0%, #f1eeff 40%, #e9e3ff 100%)',
          color: '#1e1b3a',
          fontFamily:
            'ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, Inter, sans-serif',
          padding: '52px',
          overflow: 'hidden',
        },
      },
      h('div', {
        style: {
          position: 'absolute',
          top: '-120px',
          right: '-100px',
          width: '420px',
          height: '420px',
          borderRadius: '50%',
          background: 'rgba(108, 92, 231, 0.18)',
        },
      }),
      h('div', {
        style: {
          position: 'absolute',
          bottom: '-140px',
          left: '-120px',
          width: '380px',
          height: '380px',
          borderRadius: '50%',
          background: 'rgba(162, 155, 254, 0.22)',
        },
      }),
      h(
        'div',
        {
          style: {
            zIndex: 2,
            width: '100%',
            borderRadius: '34px',
            border: '2px solid #e4e0f8',
            background: 'rgba(255,255,255,0.92)',
            boxShadow: '0 18px 42px rgba(108,92,231,0.18)',
            display: 'flex',
            flexDirection: 'column',
            padding: '36px 42px',
            justifyContent: 'center',
            gap: '28px',
          },
        },
        h(
          'div',
          { style: { display: 'flex', alignItems: 'center', gap: '16px' } },
          h('img', {
            src: iconUrl,
            width: '72',
            height: '72',
            style: { borderRadius: '20px', border: '2px solid #d6cffb' },
          }),
          h(
            'div',
            {
              style: {
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              },
            },
            h(
              'div',
              {
                style: {
                  fontSize: '54px',
                  fontWeight: 700,
                  color: '#1e1b3a',
                  letterSpacing: '-1px',
                },
              },
              'La jodita',
            ),
          ),
        ),
        h(
          'div',
          {
            style: {
              fontSize: '42px',
              color: '#5a4fcc',
              fontWeight: 800,
              letterSpacing: '-1px',
            },
          },
          '💸 🍻 🧉',
        ),
        h(
          'div',
          {
            style: {
              fontSize: '18px',
              color: '#7c7a9a',
              marginTop: '12px',
            },
          },
          'Dividí gastos entre amigos de forma simple, rápida y visual',
        ),
      ),
    ),
    {
      width: WIDTH,
      height: HEIGHT,
    },
  );
};

export const GET: APIRoute = async ({ url }) => {
  try {
    const iconUrl = `${url.origin}/icon/la-jodita.svg`;

    const image = buildDefaultImage(iconUrl);

    // Cache headers: 7 days in CDN
    image.headers.set(
      'Cache-Control',
      'public, max-age=600, s-maxage=604800, immutable',
    );
    image.headers.set('Content-Type', 'image/png');
    image.headers.set('CDN-Cache-Control', 'max-age=604800');

    return image;
  } catch (error) {
    console.error('[GET /api/og/default.png]', error);
    return new Response('Error', { status: 500 });
  }
};
