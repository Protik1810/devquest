// Builds the list of downloadable app builds (for the web app's Download page) from release/.
//   node scripts/downloads.mjs                 print the manifest
//   node scripts/downloads.mjs --copy <dir>    copy the files + manifest.json into <dir> (e.g. dist/downloads)
//   node scripts/downloads.mjs --release-base <url> --out <file>
//                                              write a manifest whose files point at <url><name> (GitHub Release assets)
// The dev server serves the same manifest and files at /downloads/ (see vite.config.ts).
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const RELEASE_DIR = path.join(root, 'release');

/** Which release files to offer, by platform. `{v}` is the app version. */
const FILES = [
  { platform: 'windows', kind: 'installer', label: 'Windows installer', pattern: 'DevQuest Setup {v}.exe', note: 'Installs DevQuest with Start-menu and desktop shortcuts.' },
  { platform: 'windows', kind: 'portable', label: 'Windows portable', pattern: 'DevQuest {v}.exe', note: 'Runs without installing; keep it in any folder.' },
  { platform: 'linux', kind: 'archive', label: 'Linux (x64, tar.gz)', pattern: 'devquest-{v}.tar.gz', note: 'Extract and run ./devquest.' },
  { platform: 'android', kind: 'apk', label: 'Android APK', pattern: 'DevQuest-{v}-android.apk', note: 'Signed release build for Android 7+.' },
];

const hashCache = new Map(); // path → { mtimeMs, size, sha256 }

function sha256(file) {
  const st = fs.statSync(file);
  const hit = hashCache.get(file);
  if (hit && hit.mtimeMs === st.mtimeMs && hit.size === st.size) return hit.sha256;
  const h = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  hashCache.set(file, { mtimeMs: st.mtimeMs, size: st.size, sha256: h });
  return h;
}

export function buildManifest(dir = RELEASE_DIR) {
  const { version } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const files = [];
  for (const f of FILES) {
    const name = f.pattern.replace('{v}', version);
    const full = path.join(dir, name);
    if (!fs.existsSync(full)) continue;
    const st = fs.statSync(full);
    files.push({ platform: f.platform, kind: f.kind, label: f.label, note: f.note, name, size: st.size, sha256: sha256(full), updated: st.mtime.toISOString() });
  }
  return { version, generated: new Date().toISOString(), files };
}

/** File name used for GitHub Release assets: no spaces. */
export const assetName = (name) => name.replace(/\s+/g, '-');

/** Only files listed in the manifest may be served (no path tricks). */
export function resolveDownload(name, dir = RELEASE_DIR) {
  const m = buildManifest(dir);
  const entry = m.files.find((f) => f.name === name);
  return entry ? path.join(dir, entry.name) : null;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf('--copy');
  const r = process.argv.indexOf('--release-base');
  const stage = process.argv.indexOf('--stage');
  if (stage > 0) {
    // Copy this version's builds into a folder with release-asset names, ready for `gh release upload`
    const out = path.resolve(root, process.argv[stage + 1] ?? '.cache/release-assets');
    fs.rmSync(out, { recursive: true, force: true });
    fs.mkdirSync(out, { recursive: true });
    for (const f of buildManifest().files) fs.copyFileSync(path.join(RELEASE_DIR, f.name), path.join(out, assetName(f.name)));
    console.log(`staged ${fs.readdirSync(out).length} assets in ${path.relative(root, out)}`);
    process.exit(0);
  }
  const manifest = buildManifest();
  if (r > 0) {
    const base = process.argv[r + 1].replace(/\/?$/, '/');
    // GitHub turns spaces in asset names into dots, so release assets use dashes (see --stage)
    for (const f of manifest.files) {
      f.name = assetName(f.name);
      f.url = base + encodeURIComponent(f.name);
    }
    const o = process.argv.indexOf('--out');
    const out = path.resolve(root, o > 0 ? process.argv[o + 1] : 'deploy/downloads.json');
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, JSON.stringify(manifest, null, 2) + '\n');
    console.log(`wrote ${path.relative(root, out)} (${manifest.files.length} files → ${base})`);
  } else if (i > 0) {
    const out = path.resolve(root, process.argv[i + 1] ?? 'dist/downloads');
    fs.mkdirSync(out, { recursive: true });
    for (const f of manifest.files) fs.copyFileSync(path.join(RELEASE_DIR, f.name), path.join(out, f.name));
    fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 2));
    console.log(`copied ${manifest.files.length} downloads (v${manifest.version}) to ${path.relative(root, out)}`);
  } else console.log(JSON.stringify(manifest, null, 2));
}
