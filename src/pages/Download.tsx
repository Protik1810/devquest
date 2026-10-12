import { useEffect, useMemo, useState } from 'react';
import { APP_VERSION } from '../engine/platform';

type Platform = 'windows' | 'linux' | 'android' | 'mac' | 'ios' | 'chromeos' | 'unknown';
type DownloadFile = { platform: 'windows' | 'linux' | 'android'; kind: string; label: string; note: string; name: string; size: number; sha256: string; updated: string; /** Absolute URL (e.g. a GitHub Release asset); default: ./downloads/<name> */ url?: string };
type Manifest = { version: string; generated: string; files: DownloadFile[] };

/** Best guess at the visitor's operating system (Client Hints when available, else the user-agent string). */
export function detectPlatform(): { platform: Platform; arm: boolean } {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const hint = nav.userAgentData?.platform?.toLowerCase() ?? '';
  const ua = navigator.userAgent.toLowerCase();
  const arm = /arm|aarch64/.test(ua);
  if (/android/.test(hint) || /android/.test(ua)) return { platform: 'android', arm };
  if (/iphone|ipad|ipod/.test(ua) || (/macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return { platform: 'ios', arm };
  if (/chrome os|cros/.test(hint) || /cros/.test(ua)) return { platform: 'chromeos', arm };
  if (/windows/.test(hint) || /windows/.test(ua)) return { platform: 'windows', arm };
  if (/mac/.test(hint) || /macintosh|mac os x/.test(ua)) return { platform: 'mac', arm };
  if (/linux/.test(hint) || /linux|x11/.test(ua)) return { platform: 'linux', arm };
  return { platform: 'unknown', arm };
}

const NAMES: Record<Platform, string> = { windows: 'Windows', linux: 'Linux', android: 'Android', mac: 'macOS', ios: 'iPhone / iPad', chromeos: 'ChromeOS', unknown: 'your device' };
const ICONS: Record<string, string> = { windows: '🪟', linux: '🐧', android: '🤖' };

const mb = (n: number) => `${(n / 1024 / 1024).toFixed(0)} MB`;

const INSTALL: Record<DownloadFile['platform'], string[]> = {
  windows: [
    'Run the installer (or the portable .exe).',
    'Windows SmartScreen may warn "Windows protected your PC" because the app isn\'t code-signed yet: choose More info → Run anyway, after checking the SHA-256 below if you like.',
    'Compiled languages (Go, Rust, Java…) run on compilers installed on your PC; Settings → Local compilers shows what was found.',
  ],
  linux: ['Extract: tar -xzf devquest-*.tar.gz', 'Run: ./devquest (inside the extracted folder)', 'Optional: install the languages you want to practise (go, rustc, java…); the app finds them on your PATH.'],
  android: [
    'Open the downloaded APK. Android asks you to allow installs from this source (your browser or Files app) once.',
    'Tap Install. Updates install over the old version and keep your progress.',
    'Local AI servers on your PC (Ollama, LM Studio) are reached over Wi-Fi using the PC\'s IP address.',
  ],
};

function FileCard({ f, primary }: { f: DownloadFile; primary?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className={`card download-file ${primary ? 'primary-file' : ''}`}>
      <div className="row">
        <span className="dl-icon" aria-hidden="true">{ICONS[f.platform]}</span>
        <div className="grow">
          <b>{f.label}</b>
          <div className="muted small">{f.note}</div>
          <div className="muted small">{f.name} · {mb(f.size)}</div>
        </div>
        <a className={primary ? 'primary-btn' : 'btn-link'} href={f.url ?? `./downloads/${encodeURIComponent(f.name)}`} download={f.name} rel="noopener">
          ⬇ Download
        </a>
      </div>
      <details className="small">
        <summary>SHA-256 checksum</summary>
        <code className="mono-path">{f.sha256}</code>{' '}
        <button
          className="ghost small"
          onClick={() => {
            void navigator.clipboard?.writeText(f.sha256).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            });
          }}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
        <div className="muted">
          Check it with <code>{f.platform === 'windows' ? `Get-FileHash "${f.name}"` : `sha256sum ${f.name}`}</code>
        </div>
      </details>
    </div>
  );
}

export function Download() {
  const { platform, arm } = useMemo(detectPlatform, []);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('./downloads/manifest.json', { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((m: Manifest) => setManifest(m))
      .catch(() => setError(true));
  }, []);

  const files = manifest?.files ?? [];
  const mine = files.filter((f) => f.platform === platform);
  const others = files.filter((f) => f.platform !== platform);
  const unsupported = platform === 'mac' || platform === 'ios' || platform === 'chromeos' || platform === 'unknown';

  return (
    <div className="download-page">
      <div className="page-hero" style={{ backgroundImage: 'url(./art/hero-guide.webp)' }}>
        <div>
          <h1>⬇ Get the DevQuest app</h1>
          <p>
            The apps work fully offline, keep a save file on your device, and the desktop app runs compiled languages on your own compilers. Your web progress can move over with Settings → Export save.
          </p>
          <div className="muted small">Detected: <b>{NAMES[platform]}</b>{arm ? ' (ARM)' : ''} · Version {manifest?.version ?? APP_VERSION}</div>
        </div>
      </div>

      {error && (
        <div className="card" role="status">
          <b>No downloads are published on this server yet.</b>
          <p className="muted small">The person hosting this site can publish them with <code>npm run build:web</code> (or by running the dev server next to a built <code>release/</code> folder).</p>
        </div>
      )}

      {manifest && unsupported && (
        <div className="card" role="status">
          <b>There's no {NAMES[platform]} app yet.</b>
          <p className="muted small">
            You can keep using DevQuest right here in the browser: it works on every device{platform === 'ios' ? ', and you can add it to your Home Screen from the Share menu' : ''}. The builds for other systems are below.
          </p>
        </div>
      )}

      {manifest && !unsupported && mine.length === 0 && (
        <div className="card" role="status">
          <b>The {NAMES[platform]} build isn't published on this server yet.</b>
        </div>
      )}

      {mine.length > 0 && (
        <section>
          <h2>Recommended for {NAMES[platform]}</h2>
          {platform === 'windows' && arm && <p className="small muted">This is an x64 build; on Windows on ARM it runs through Windows' built-in emulation.</p>}
          {mine.map((f, i) => <FileCard key={f.name} f={f} primary={i === 0} />)}
          <div className="card">
            <b>Install</b>
            <ol className="small">{INSTALL[mine[0].platform].map((s) => <li key={s}>{s}</li>)}</ol>
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section>
          <h2>Other platforms</h2>
          {others.map((f) => <FileCard key={f.name} f={f} />)}
        </section>
      )}

      {manifest && (
        <p className="muted small">
          Builds are made by Protik. Published {new Date(manifest.files[0]?.updated ?? manifest.generated).toLocaleDateString()}. The web version you're using now stays free to use in any browser.
        </p>
      )}
    </div>
  );
}
