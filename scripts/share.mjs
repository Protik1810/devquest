// Optional: share the web app on http://localhost:5173 through an ngrok tunnel.
//   npm run share
// If a dev server is already running on 5173 (npm run dev) it's reused; otherwise one is started.
// The ngrok authtoken is NOT stored in this project: ngrok reads it from its own config
// (`ngrok config add-authtoken …`, done once) or from the NGROK_AUTHTOKEN environment variable.
// Optional environment variables:
//   NGROK_DOMAIN       your reserved/static ngrok domain (e.g. devquest-ada.ngrok-free.app)
//   NGROK_BASIC_AUTH   "user:password" to require a login (recommended: a dev server exposes the source code)
import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = 5173;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const procs = [];

function kill(p) {
  if (p.exitCode !== null || p.killed) return;
  // On Windows, kill the whole process tree so nothing (like ngrok) keeps running
  if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(p.pid), '/T', '/F'], { stdio: 'ignore' });
  else p.kill('SIGTERM');
}
function shutdown(code = 0) {
  for (const p of procs) kill(p);
  process.exit(code);
}
process.on('SIGINT', () => shutdown());
process.on('SIGTERM', () => shutdown());
process.on('exit', () => procs.forEach(kill));

function start(cmd, args, env = {}) {
  const p = spawn(cmd, args, { cwd: root, stdio: ['ignore', 'inherit', 'inherit'], env: { ...process.env, ...env } });
  procs.push(p);
  p.on('error', (e) => {
    console.error(`Could not start ${cmd}: ${e.message}`);
    shutdown(1);
  });
  p.on('exit', (code) => {
    if (code) console.error(`\n${path.basename(cmd)} exited with code ${code}`);
    shutdown(code ?? 0);
  });
  return p;
}

async function up(url) {
  try {
    const r = await fetch(url);
    return r.status < 500 ? r : null;
  } catch {
    return null;
  }
}
async function waitFor(url, seconds) {
  for (let i = 0; i < seconds; i++) {
    const r = await up(url);
    if (r) return r;
    await new Promise((res) => setTimeout(res, 1000));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

if (await up(`http://localhost:${PORT}/`)) {
  console.log(`Using the dev server already running on http://localhost:${PORT}`);
} else {
  start(process.execPath, [path.join(root, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', String(PORT), '--strictPort'], { DEVQUEST_TUNNEL: '1' });
  await waitFor(`http://localhost:${PORT}/`, 60);
}

const args = ['http', String(PORT), '--log', 'false'];
if (process.env.NGROK_DOMAIN) args.push('--url', process.env.NGROK_DOMAIN);
if (process.env.NGROK_BASIC_AUTH) args.push('--basic-auth', process.env.NGROK_BASIC_AUTH);
start('ngrok', args);

try {
  // ngrok's local agent API lists the public URL
  const r = await waitFor('http://127.0.0.1:4040/api/tunnels', 30);
  const { tunnels } = await r.json();
  const url = tunnels.find((t) => t.public_url?.startsWith('https'))?.public_url ?? tunnels[0]?.public_url;
  console.log(`\n🌍 DevQuest is public at: ${url}`);
  console.log(`   (local: http://localhost:${PORT}, ngrok inspector: http://127.0.0.1:4040)`);
  if (!process.env.NGROK_BASIC_AUTH) console.log('   ⚠️  Anyone with the link can open it. Set NGROK_BASIC_AUTH="user:password" to require a login.');
  console.log('   Press Ctrl+C to stop sharing.\n');
} catch {
  console.error('Could not read the tunnel URL. Is ngrok signed in? Run once: ngrok config add-authtoken <your token>');
  shutdown(1);
}
