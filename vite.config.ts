/// <reference types="vitest/config" />
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// W `npm run dev` obsługuje /api/live/<nazwa> tymi samymi handlerami co Worker (rejestr server/live/index.ts).
function apiDev(env: Record<string, string>): Plugin {
  return {
    name: 'api-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const m = req.url?.match(/^\/api\/live\/([a-z]+)/);
        if (!m) return next();
        try {
          const { handlery } = await server.ssrLoadModule('/server/live/index.ts');
          const handler = handlery[m[1]];
          if (!handler) throw new Error('brak handlera');
          const r: Response = await handler(new Request(`http://localhost${req.url}`), env);
          res.statusCode = r.status;
          r.headers.forEach((v, k) => res.setHeader(k, v));
          res.end(Buffer.from(await r.arrayBuffer()));
        } catch {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ blad: `brak handlera ${m[1]}` }));
        }
      });
    },
  };
}

// Wersja tylko online (src/offline/tryb.ts) nie rejestruje service workera. Ten sw.js dostaje tylko stary service worker
// z wcześniejszej wizyty przy aktualizacji: wyrejestrowuje się, czyści cache i odświeża kartę.
const SW_SAMOUSUWAJACY = `self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(
  self.registration.unregister()
    .then(() => caches.keys()).then((k) => Promise.all(k.map((n) => caches.delete(n))))
    .then(() => self.clients.matchAll()).then((c) => c.forEach((w) => w.navigate(w.url)))));
`;

function swSamousuwajacy(): Plugin {
  return {
    name: 'sw-samousuwajacy',
    apply: 'build',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: SW_SAMOUSUWAJACY });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      apiDev(env),
      env.VITE_TYLKO_ONLINE === '1' ? swSamousuwajacy() : VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
          globIgnores: ['pack/**', 'map/**'],
          maximumFileSizeToCacheInBytes: 5_000_000,
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [
            { urlPattern: /\/pack\//, handler: 'CacheFirst', options: { cacheName: 'pack' } },
            { urlPattern: /\/map\/(fonts|sprites)\//, handler: 'CacheFirst', options: { cacheName: 'map-assets' } },
          ],
        },
        manifest: {
          name: 'Warszawa w trybie kryzysowym',
          short_name: 'WawaKryzys',
          lang: 'pl',
          theme_color: '#b91c1c',
          background_color: '#ffffff',
          display: 'standalone',
          icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }],
        },
      }),
    ],
    test: { environment: 'jsdom', include: ['src/**/*.test.{ts,tsx}', 'server/**/*.test.ts'] },
  };
});
