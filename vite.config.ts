import fs from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
// @ts-expect-error plain ESM script without type declarations
import { buildManifest, resolveDownload } from './scripts/downloads.mjs';

/**
 * Dev server: serve the app builds in release/ at /downloads/ for the web app's Download page
 * (production web deploys copy them next to the site instead: npm run build:web).
 * Only files listed in the manifest can be fetched.
 */
function downloads(): Plugin {
  return {
    name: 'devquest-downloads',
    configureServer(server) {
      server.middlewares.use('/downloads', (req, res, next) => {
        const name = decodeURIComponent((req.url ?? '/').split('?')[0].replace(/^\/+/, ''));
        if (name === 'manifest.json') {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-cache');
          res.end(JSON.stringify(buildManifest()));
          return;
        }
        const file = resolveDownload(name) as string | null;
        if (!file) return next();
        const size = fs.statSync(file).size;
        res.setHeader('Content-Type', name.endsWith('.apk') ? 'application/vnd.android.package-archive' : 'application/octet-stream');
        res.setHeader('Content-Length', String(size));
        res.setHeader('Content-Disposition', `attachment; filename="${name.replace(/"/g, '')}"`);
        res.setHeader('X-Content-Type-Options', 'nosniff');
        fs.createReadStream(file).pipe(res);
      });
    },
  };
}

// Optional public tunnel (npm run share → scripts/share.mjs): Vite rejects requests for unknown host names
// (DNS-rebinding protection), so ngrok's domains are allowed explicitly. With DEVQUEST_TUNNEL=1 (a dev server
// started by the share script) hot reload is also routed through the HTTPS tunnel.
const tunnel = process.env.DEVQUEST_TUNNEL === '1';
const NGROK_HOSTS = ['.ngrok-free.app', '.ngrok-free.dev', '.ngrok.app', '.ngrok.dev', '.ngrok.io'];

// base './' so the built files load from app:// / file:// inside Electron and Capacitor
export default defineConfig({
  base: './',
  plugins: [react(), downloads()],
  server: { port: 5173, allowedHosts: NGROK_HOSTS, ...(tunnel ? { strictPort: true, hmr: { clientPort: 443 } } : {}) },
  build: {
    // The lesson-content chunk is mostly text (about a third of its size once gzipped)
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        // Big libraries in their own long-cacheable chunks, loaded only by the pages that need them
        manualChunks(id) {
          // Lesson text changes on a different schedule from the app code, so cache it separately
          if (/[\/]src[\/]content[\/]/.test(id)) return 'content';
          if (!id.includes('node_modules')) return undefined;
          if (/@codemirror|@lezer|@uiw|codemirror/.test(id)) return 'editor';
          if (id.includes('@anthropic-ai')) return 'anthropic';
          if (/sql\.js|@electric-sql/.test(id)) return 'sql';
          if (/marked/.test(id)) return 'markdown';
          if (/react-dom|react-router|scheduler|[\/]react[\/]/.test(id)) return 'react';
          return undefined;
        },
      },
    },
  },
});
