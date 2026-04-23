import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/serverless';

const isTunnel = process.env.npm_lifecycle_event === 'dev:bitrix';

export default defineConfig({
  output: 'hybrid',
  adapter: vercel(),
  vite: {
    server: {
      allowedHosts: ['.moreclix.co', '.trycloudflare.com'],
      ...(isTunnel ? { hmr: { clientPort: 443 } } : {}),
    },
  },
});
