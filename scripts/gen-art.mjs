// Generates DevQuest artwork through a local Solframe Studio agent server (OpenAI-compatible images API).
// Usage: SOLFRAME_KEY=sk-... node scripts/gen-art.mjs [--only name1,name2] [--force]
// Writes PNGs to scripts/.art-raw/; run scripts/to-webp.py afterwards to produce public/art/*.webp.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.SOLFRAME_URL ?? 'http://127.0.0.1:8765';
const KEY = process.env.SOLFRAME_KEY;
// PIPELINE=flux uses the multi-file FLUX stack (diffusion model + LLM text encoder + VAE), otherwise one SDXL checkpoint
const FLUX = process.env.PIPELINE === 'flux';
const MODEL = process.env.SOLFRAME_MODEL ?? (FLUX ? 'flux-2-klein-4b-fp8-official.safetensors' : 'Juggernaut_RunDiffusionPhoto2_Lightning_4Steps.safetensors');
const GEN = FLUX
  ? { pipeline: 'flux', unet_model: MODEL, clip_model: process.env.FLUX_LLM ?? 'qwen3-4b-heretic_fp8_e4m3fn.safetensors', vae_model: process.env.FLUX_VAE ?? 'flux2-vae.safetensors', steps: 30, cfg_scale: 3.4, sampling_method: 'dpm++2m' }
  : { model: MODEL, steps: 6, cfg_scale: 1.5 };
if (!KEY) throw new Error('Set SOLFRAME_KEY to your Solframe agent server API key');

const manifest = JSON.parse(fs.readFileSync(path.join(here, 'art-manifest.json'), 'utf8'));
const outDir = path.join(here, process.env.OUT_DIR ?? '.art-raw');
fs.mkdirSync(outDir, { recursive: true });

const args = process.argv.slice(2);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1].split(',') : null;
const force = args.includes('--force');
const headers = { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

for (const [i, item] of manifest.items.entries()) {
  if (only && !only.includes(item.name)) continue;
  const file = path.join(outDir, `${item.name}.png`);
  if (!force && fs.existsSync(file)) continue;
  const prompt = item.raw ? item.prompt : `${item.prompt}, ${manifest.style}`;
  const t0 = Date.now();
  const res = await fetch(`${BASE}/v1/images/generations`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ ...GEN, prompt, negative_prompt: manifest.negative, size: `${item.w}x${item.h}`, width: item.w, height: item.h, n: 1, seed: 1000 + i + Number(process.env.SEED_OFFSET ?? 0) }),
  });
  if (!res.ok) {
    console.error(`✗ ${item.name}: HTTP ${res.status} ${await res.text()}`);
    continue;
  }
  const { data } = await res.json();
  const d = data[0];
  const buf = d.b64_json ? Buffer.from(d.b64_json, 'base64') : Buffer.from(await (await fetch(new URL(d.url, BASE), { headers })).arrayBuffer());
  fs.writeFileSync(file, buf);
  console.log(`✓ ${item.name} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
}
console.log('done');
