import Anthropic from '@anthropic-ai/sdk';
import { cfgFor, providerDef, type ProviderCfg, type ProviderId } from './providers';
import { appFetch, hasNativeFetch } from './nativeFetch';

export type ChatMsg = { role: 'user' | 'assistant'; content: string };

export const TUTOR_SYSTEM = `You are "Owl", the friendly Socratic coding tutor inside DevQuest, a gamified app that teaches software engineering.
Rules:
- Guide the learner to the answer with questions and small nudges. Never paste a complete solution to the current exercise, even if asked; offer the next step instead.
- Keep replies short (under 150 words) unless the learner asks for a deeper explanation.
- Use simple analogies and small code snippets (a few lines) in fenced code blocks.
- If the learner's code has a bug, point at the line or concept and ask what they expect it to do.
- Be encouraging, never condescending.`;

export class TutorError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}

type AskOpts = {
  provider: ProviderId;
  cfg: ProviderCfg;
  system: string;
  history: ChatMsg[];
  onText: (delta: string) => void;
  signal?: AbortSignal;
  /** Ask for a JSON object reply (used for reviews and grading). */
  json?: boolean;
  /** Reasoning effort where the provider supports it. */
  effort?: 'low' | 'medium' | 'high';
};

/** Stream a reply from whichever provider is selected. */
export async function askLLM(opts: AskOpts): Promise<void> {
  const def = providerDef(opts.provider);
  const cfg = cfgFor(opts.provider, opts.cfg);
  if (def.kind === 'anthropic') return askAnthropic(cfg, opts);
  if (def.kind === 'gemini') return askGemini(cfg, opts);
  return askOpenAICompatible(cfg, opts);
}

/** Tutor wrapper: adds the Owl persona and the current lesson context. */
export function askTutor(opts: Omit<AskOpts, 'system'> & { context: string }) {
  return askLLM({ ...opts, system: `${TUTOR_SYSTEM}\n\nCurrent lesson context:\n${opts.context}` });
}

// ---------- Anthropic ----------
async function askAnthropic(cfg: ProviderCfg, o: AskOpts) {
  const client = new Anthropic({ apiKey: cfg.apiKey, baseURL: cfg.baseUrl, dangerouslyAllowBrowser: true });
  const params = {
    model: cfg.model,
    max_tokens: o.json ? 16000 : 4000,
    system: o.system,
    messages: o.history,
    output_config: { effort: o.effort ?? 'low' },
    // If a safety classifier declines, the server retries on a suitable fallback model
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
  };
  try {
    const stream = client.beta.messages.stream(params as unknown as Parameters<typeof client.beta.messages.stream>[0], { signal: o.signal });
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') o.onText(event.delta.text);
    }
    const final = await stream.finalMessage();
    if (final.stop_reason === 'refusal') o.onText('\n\n_(The tutor could not answer that one. Try rephrasing your question.)_');
  } catch (e) {
    if (e instanceof Anthropic.APIError) throw new TutorError(e.message, e.status);
    throw e;
  }
}

// ---------- shared SSE reader ----------
export async function readSSE(res: Response, onData: (json: unknown) => void) {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split(/\r?\n/);
    buf = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (!data || data === '[DONE]') continue;
      try {
        onData(JSON.parse(data));
      } catch {
        /* ignore keep-alive or partial lines */
      }
    }
  }
}

export async function httpError(res: Response, provider: string) {
  let detail = '';
  try {
    const body = await res.text();
    const j = JSON.parse(body);
    detail = j.error?.message ?? j.message ?? j.error ?? body;
  } catch {
    /* body was not JSON */
  }
  return new TutorError(`${provider} returned HTTP ${res.status}${detail ? `: ${String(detail).slice(0, 300)}` : ''}`, res.status);
}

export async function safeFetch(url: string, init: RequestInit, provider: string, local: boolean) {
  try {
    return await appFetch(url, init, local);
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    throw new TutorError(
      local
        ? `Couldn't reach ${provider} at ${new URL(url).origin}. Is it running${hasNativeFetch ? '' : ', and does it allow requests from this app (CORS)? The desktop app avoids CORS problems'}?`
        : `Couldn't reach ${provider}. Check your internet connection.`,
    );
  }
}

// ---------- OpenAI-compatible (OpenAI, OpenRouter, Groq, Mistral, DeepSeek, Ollama, LM Studio, llama.cpp…) ----------
export function openaiHeaders(cfg: ProviderCfg): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (cfg.apiKey) h.Authorization = `Bearer ${cfg.apiKey}`;
  return h;
}

async function askOpenAICompatible(cfg: ProviderCfg, o: AskOpts) {
  const def = providerDef(o.provider);
  let model = cfg.model;
  // Local servers often have exactly one model loaded; use it when none is configured
  if (!model) model = (await listModels(o.provider, cfg))[0] ?? '';
  if (!model) throw new TutorError(`No model selected for ${def.name}. Load or pull a model first.`);
  const send = (jsonMode: boolean) =>
    safeFetch(
      `${cfg.baseUrl}/chat/completions`,
      {
        method: 'POST',
        headers: openaiHeaders(cfg),
        signal: o.signal,
        body: JSON.stringify({
          model,
          stream: true,
          messages: [{ role: 'system', content: o.system }, ...o.history],
          ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
        }),
      },
      def.name,
      def.local,
    );
  const wantJson = !!o.json && !!def.jsonMode;
  let res = await send(wantJson);
  // Some servers reject response_format; the prompt already asks for JSON, so retry without it
  if (!res.ok && wantJson && res.status === 400) res = await send(false);
  if (!res.ok) throw await httpError(res, def.name);
  await readSSE(res, (j) => {
    const delta = (j as { choices?: { delta?: { content?: string } }[] }).choices?.[0]?.delta?.content;
    if (delta) o.onText(delta);
  });
}

// ---------- Google Gemini ----------
async function askGemini(cfg: ProviderCfg, o: AskOpts) {
  const res = await safeFetch(
    `${cfg.baseUrl}/models/${encodeURIComponent(cfg.model)}:streamGenerateContent?alt=sse`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cfg.apiKey },
      signal: o.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: o.system }] },
        contents: o.history.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
        ...(o.json ? { generationConfig: { responseMimeType: 'application/json' } } : {}),
      }),
    },
    'Gemini',
    false,
  );
  if (!res.ok) throw await httpError(res, 'Gemini');
  let blocked = false;
  await readSSE(res, (j) => {
    const r = j as { candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[]; promptFeedback?: { blockReason?: string } };
    if (r.promptFeedback?.blockReason) blocked = true;
    for (const p of r.candidates?.[0]?.content?.parts ?? []) if (p.text) o.onText(p.text);
    if (r.candidates?.[0]?.finishReason === 'SAFETY') blocked = true;
  });
  if (blocked) o.onText('\n\n_(Gemini declined to answer that one. Try rephrasing your question.)_');
}

// ---------- model listing ----------
export async function listModels(provider: ProviderId, saved: ProviderCfg): Promise<string[]> {
  const def = providerDef(provider);
  const cfg = cfgFor(provider, saved);
  if (def.kind === 'anthropic') {
    const client = new Anthropic({ apiKey: cfg.apiKey, baseURL: cfg.baseUrl, dangerouslyAllowBrowser: true });
    const ids: string[] = [];
    try {
      for await (const m of client.models.list()) ids.push(m.id);
    } catch (e) {
      if (e instanceof Anthropic.APIError) throw new TutorError(e.message, e.status);
      throw e;
    }
    return ids;
  }
  if (def.kind === 'gemini') {
    const res = await safeFetch(`${cfg.baseUrl}/models?pageSize=200`, { headers: { 'x-goog-api-key': cfg.apiKey } }, 'Gemini', false);
    if (!res.ok) throw await httpError(res, 'Gemini');
    const j = (await res.json()) as { models?: { name: string; supportedGenerationMethods?: string[] }[] };
    return (j.models ?? []).filter((m) => m.supportedGenerationMethods?.includes('generateContent')).map((m) => m.name.replace(/^models\//, ''));
  }
  const res = await safeFetch(`${cfg.baseUrl}/models`, { headers: openaiHeaders(cfg) }, def.name, def.local);
  if (!res.ok) throw await httpError(res, def.name);
  const j = (await res.json()) as { data?: { id: string }[] };
  return (j.data ?? []).map((m) => m.id).sort();
}
