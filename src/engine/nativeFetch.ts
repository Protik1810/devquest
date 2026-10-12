import { Capacitor, CapacitorHttp } from '@capacitor/core';

/** Desktop bridge (electron/preload.cjs) that performs requests in the main process, free of browser CORS. */
type Native = {
  start: (req: { url: string; method?: string; headers?: Record<string, string>; body?: string }) => Promise<{ id: number; status: number; statusText: string; headers: [string, string][] }>;
  read: (id: number) => Promise<Uint8Array | null>;
  abort: (id: number) => Promise<void>;
};

const native = (globalThis as { devquestNative?: Native }).devquestNative;

export const hasNativeFetch = !!native || Capacitor.isNativePlatform();

const abortError = () => new DOMException('The request was aborted.', 'AbortError');

/** Android: Capacitor's native HTTP (no CORS or mixed-content limits). It buffers the whole reply instead of streaming. */
async function androidFetch(url: string, init: RequestInit): Promise<Response> {
  if (init.signal?.aborted) throw abortError();
  const headers = Object.fromEntries(new Headers(init.headers).entries());
  const isJson = (headers['content-type'] ?? '').includes('json');
  const raw = typeof init.body === 'string' ? init.body : undefined;
  const res = await CapacitorHttp.request({
    url,
    method: init.method ?? 'GET',
    headers,
    data: raw && isJson ? JSON.parse(raw) : raw,
    responseType: 'text',
    connectTimeout: 15000,
    readTimeout: 300000,
  });
  if (init.signal?.aborted) throw abortError();
  const text = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
  return new Response(text, { status: res.status, headers: res.headers });
}

/** True for hosts on this device or the local network (loopback, RFC 1918 private ranges, link-local, *.local). */
export function isLocalHost(host: string) {
  const h = host.replace(/^\[|\]$/g, '').toLowerCase();
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h === '::1') return true;
  const m = h.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return /^f[cd][0-9a-f]{2}:|^fe80:/.test(h);
  const [a, b] = [+m[1], +m[2]];
  return a === 127 || a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254);
}

/** Unencrypted http:// is only allowed to the learner's own machines (local AI servers); everything else must be https. */
export function checkUrl(url: string) {
  const u = new URL(url);
  if (u.protocol === 'https:') return;
  if (u.protocol === 'http:' && isLocalHost(u.hostname)) return;
  throw new TypeError(`Refusing to connect to ${u.origin}: use https:// (plain http:// is only allowed for servers on this device or your local network).`);
}

/**
 * Same shape as fetch(). Desktop: always via the main-process bridge (streams, no CORS).
 * Android: native HTTP for local/LAN servers (`preferNative`), normal streaming fetch for cloud APIs.
 */
export async function appFetch(url: string, init: RequestInit = {}, preferNative = false): Promise<Response> {
  checkUrl(url);
  if (!native) return Capacitor.isNativePlatform() && preferNative ? androidFetch(url, init) : fetch(url, init);
  const signal = init.signal ?? undefined;
  if (signal?.aborted) throw abortError();
  const meta = await native.start({
    url,
    method: init.method ?? 'GET',
    headers: Object.fromEntries(new Headers(init.headers).entries()),
    body: typeof init.body === 'string' ? init.body : undefined,
  });
  signal?.addEventListener('abort', () => void native.abort(meta.id), { once: true });
  const nullBody = [101, 204, 205, 304].includes(meta.status);
  const stream = nullBody
    ? null
    : new ReadableStream<Uint8Array>({
        async pull(ctrl) {
          try {
            const chunk = await native.read(meta.id);
            if (chunk) ctrl.enqueue(chunk);
            else ctrl.close();
          } catch (e) {
            ctrl.error(signal?.aborted ? abortError() : e);
          }
        },
        cancel() {
          void native.abort(meta.id);
        },
      });
  return new Response(stream, { status: meta.status, statusText: meta.statusText, headers: meta.headers });
}
