import Anthropic from '@anthropic-ai/sdk';
import { cfgFor, providerDef, type ProviderCfg, type ProviderId } from '../providers';
import { askLLM, httpError, listModels, openaiHeaders, readSSE, safeFetch, TutorError, type ChatMsg } from '../tutor';

/**
 * Provider-neutral tool calling for the Agent Lab.
 * - Anthropic: Messages API tool use (streamed)
 * - Gemini: functionDeclarations
 * - Everything else: OpenAI-compatible function calling (OpenAI, OpenRouter, Groq, Mistral, DeepSeek, Ollama, LM Studio…)
 * - "text" protocol: for models without native tool support, tools are described in the prompt and called with
 *   <tool>{"name": …, "input": {…}}</tool> blocks, which works with any chat model.
 */

export type ToolSpec = { name: string; description: string; parameters: { type: 'object'; properties: Record<string, unknown>; required?: string[] } };
export type ToolCall = { id: string; name: string; input: Record<string, unknown> };
export type ToolResult = { id: string; name: string; output: string; isError?: boolean };
/** Provider-specific assistant content (e.g. thinking blocks, Gemini thought signatures) replayed verbatim on the next turn. */
export type RawTurn = { kind: 'anthropic' | 'gemini' | 'openai' | 'text'; data: unknown };

export type AgentMsg =
  | { role: 'user'; text: string; /** What the chat shows when `text` also carries workspace context for the model. */ display?: string }
  | { role: 'assistant'; text: string; calls: ToolCall[]; raw?: RawTurn }
  | { role: 'tool'; results: ToolResult[] };

export type Protocol = 'native' | 'text';

export class ToolsUnsupported extends Error {}

type CallOpts = {
  provider: ProviderId;
  cfg: ProviderCfg;
  system: string;
  messages: AgentMsg[];
  tools: ToolSpec[];
  protocol: Protocol;
  signal?: AbortSignal;
  onText: (delta: string) => void;
};

export type Usage = { input: number; output: number };
export type ModelTurn = { text: string; calls: ToolCall[]; raw: RawTurn; truncated?: boolean; usage?: Usage };

let callSeq = 0;
const newId = () => `call_${Date.now().toString(36)}_${(callSeq++).toString(36)}`;

export async function callModel(o: CallOpts): Promise<ModelTurn> {
  const cfg = cfgFor(o.provider, o.cfg);
  if (o.protocol === 'text') return callText({ ...o, cfg });
  const kind = providerDef(o.provider).kind;
  if (kind === 'anthropic') return callAnthropic({ ...o, cfg });
  if (kind === 'gemini') return callGemini({ ...o, cfg });
  return callOpenAI({ ...o, cfg });
}

// ---------- Anthropic ----------
function toAnthropic(messages: AgentMsg[]) {
  return messages.map((m) => {
    if (m.role === 'user') return { role: 'user' as const, content: m.text };
    if (m.role === 'tool')
      return {
        role: 'user' as const,
        content: m.results.map((r) => ({ type: 'tool_result' as const, tool_use_id: r.id, content: r.output || '(no output)', is_error: !!r.isError })),
      };
    if (m.raw?.kind === 'anthropic') return { role: 'assistant' as const, content: m.raw.data };
    const blocks: unknown[] = [];
    if (m.text.trim()) blocks.push({ type: 'text', text: m.text });
    for (const c of m.calls) blocks.push({ type: 'tool_use', id: c.id, name: c.name, input: c.input });
    return { role: 'assistant' as const, content: blocks.length ? blocks : [{ type: 'text', text: '(continuing)' }] };
  });
}

async function callAnthropic(o: CallOpts): Promise<ModelTurn> {
  const client = new Anthropic({ apiKey: o.cfg.apiKey, baseURL: o.cfg.baseUrl, dangerouslyAllowBrowser: true });
  const params = {
    model: o.cfg.model,
    max_tokens: 16000,
    system: o.system,
    messages: toAnthropic(o.messages),
    tools: o.tools.map((t) => ({ name: t.name, description: t.description, input_schema: t.parameters })),
    output_config: { effort: 'medium' },
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
  };
  try {
    const stream = client.beta.messages.stream(params as unknown as Parameters<typeof client.beta.messages.stream>[0], { signal: o.signal });
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') o.onText(event.delta.text);
    }
    const final = await stream.finalMessage();
    const content = final.content as unknown as { type: string; text?: string; id?: string; name?: string; input?: Record<string, unknown> }[];
    const text = content.filter((b) => b.type === 'text').map((b) => b.text).join('');
    const calls = content.filter((b) => b.type === 'tool_use').map((b) => ({ id: b.id!, name: b.name!, input: b.input ?? {} }));
    const refusal = final.stop_reason === 'refusal';
    return {
      text: refusal ? text + '\n\n_(The model declined this request.)_' : text,
      calls: refusal ? [] : calls,
      raw: { kind: 'anthropic', data: content },
      truncated: final.stop_reason === 'max_tokens',
      usage: final.usage ? { input: final.usage.input_tokens ?? 0, output: final.usage.output_tokens ?? 0 } : undefined,
    };
  } catch (e) {
    if (e instanceof Anthropic.APIError) throw new TutorError(e.message, e.status);
    throw e;
  }
}

// ---------- OpenAI-compatible ----------
function toOpenAI(system: string, messages: AgentMsg[]) {
  const out: unknown[] = [{ role: 'system', content: system }];
  for (const m of messages) {
    if (m.role === 'user') out.push({ role: 'user', content: m.text });
    else if (m.role === 'tool') for (const r of m.results) out.push({ role: 'tool', tool_call_id: r.id, content: r.output || '(no output)' });
    else
      out.push({
        role: 'assistant',
        content: m.text || null,
        ...(m.calls.length ? { tool_calls: m.calls.map((c) => ({ id: c.id, type: 'function', function: { name: c.name, arguments: JSON.stringify(c.input) } })) } : {}),
      });
  }
  return out;
}

type OAChunk = {
  choices?: { delta?: { content?: string | null; tool_calls?: { index?: number; id?: string; function?: { name?: string; arguments?: string } }[] }; finish_reason?: string | null }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number } | null;
};

/** Streams text live and assembles tool calls from their deltas (OpenAI streaming format). */
async function callOpenAI(o: CallOpts): Promise<ModelTurn> {
  const def = providerDef(o.provider);
  let model = o.cfg.model;
  if (!model) model = (await listModels(o.provider, o.cfg))[0] ?? '';
  if (!model) throw new TutorError(`No model selected for ${def.name}. Load or pull a model first.`);
  const res = await safeFetch(
    `${o.cfg.baseUrl}/chat/completions`,
    {
      method: 'POST',
      headers: openaiHeaders(o.cfg),
      signal: o.signal,
      body: JSON.stringify({
        model,
        stream: true,
        // Cloud APIs report token usage in the last chunk when asked; some local servers reject the option
        ...(def.local ? {} : { stream_options: { include_usage: true } }),
        messages: toOpenAI(o.system, o.messages),
        tools: o.tools.map((t) => ({ type: 'function', function: { name: t.name, description: t.description, parameters: t.parameters } })),
        tool_choice: 'auto',
      }),
    },
    def.name,
    def.local,
  );
  if (!res.ok) {
    const err = await httpError(res, def.name);
    // e.g. Ollama: "model does not support tools"; some servers reject the tools field entirely
    if ((res.status === 400 || res.status === 404 || res.status === 422 || res.status === 500) && /tool|function/i.test(err.message)) throw new ToolsUnsupported(err.message);
    throw err;
  }
  let text = '';
  let finish = '';
  let usage: Usage | undefined;
  const parts: { id?: string; name: string; args: string }[] = [];
  const handle = (j: OAChunk) => {
    const ch = j.choices?.[0];
    if (ch?.delta?.content) {
      text += ch.delta.content;
      o.onText(ch.delta.content);
    }
    for (const tc of ch?.delta?.tool_calls ?? []) {
      const i = tc.index ?? parts.length;
      parts[i] ??= { name: '', args: '' };
      if (tc.id) parts[i].id = tc.id;
      if (tc.function?.name) parts[i].name += tc.function.name;
      if (tc.function?.arguments) parts[i].args += tc.function.arguments;
    }
    if (ch?.finish_reason) finish = ch.finish_reason;
    if (j.usage) usage = { input: j.usage.prompt_tokens ?? 0, output: j.usage.completion_tokens ?? 0 };
  };
  if ((res.headers.get('content-type') ?? '').includes('json')) {
    // A server that ignored stream:true and answered in one piece
    const j = (await res.json()) as { choices?: { message?: { content?: string | null; tool_calls?: { id?: string; function?: { name?: string; arguments?: string } }[] }; finish_reason?: string }[]; usage?: OAChunk['usage'] };
    const msg = j.choices?.[0]?.message;
    handle({ choices: [{ delta: { content: msg?.content, tool_calls: msg?.tool_calls?.map((c, index) => ({ index, ...c })) }, finish_reason: j.choices?.[0]?.finish_reason }], usage: j.usage });
  } else {
    await readSSE(res, (j) => handle(j as OAChunk));
  }
  const calls = parts.filter((p) => p?.name).map((p) => ({ id: p.id || newId(), name: p.name, input: parseArgs(p.args) }));
  return { text, calls, raw: { kind: 'openai', data: null }, truncated: finish === 'length', usage };
}

function parseArgs(s?: string): Record<string, unknown> {
  if (!s) return {};
  try {
    const v = parseLooseJson(s);
    return v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
  } catch {
    return { _invalid_json: s.slice(0, 500) };
  }
}

// ---------- Gemini ----------
type GeminiPart = { text?: string; thought?: boolean; functionCall?: { name: string; args?: Record<string, unknown> }; functionResponse?: unknown };

function toGemini(messages: AgentMsg[]) {
  return messages.map((m) => {
    if (m.role === 'user') return { role: 'user', parts: [{ text: m.text }] };
    if (m.role === 'tool') return { role: 'user', parts: m.results.map((r) => ({ functionResponse: { name: r.name, response: { output: r.output, ...(r.isError ? { error: true } : {}) } } })) };
    if (m.raw?.kind === 'gemini') return { role: 'model', parts: m.raw.data as GeminiPart[] };
    const parts: GeminiPart[] = [];
    if (m.text) parts.push({ text: m.text });
    for (const c of m.calls) parts.push({ functionCall: { name: c.name, args: c.input } });
    return { role: 'model', parts: parts.length ? parts : [{ text: '(continuing)' }] };
  });
}

/** Streams text live; function calls and thought signatures are kept in order for the next turn. */
async function callGemini(o: CallOpts): Promise<ModelTurn> {
  const res = await safeFetch(
    `${o.cfg.baseUrl}/models/${encodeURIComponent(o.cfg.model)}:streamGenerateContent?alt=sse`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': o.cfg.apiKey },
      signal: o.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: o.system }] },
        contents: toGemini(o.messages),
        tools: [{ functionDeclarations: o.tools.map((t) => ({ name: t.name, description: t.description, parameters: t.parameters })) }],
      }),
    },
    'Gemini',
    false,
  );
  if (!res.ok) throw await httpError(res, 'Gemini');
  const parts: GeminiPart[] = [];
  let text = '';
  let finish = '';
  let usage: Usage | undefined;
  await readSSE(res, (j) => {
    const r = j as { candidates?: { content?: { parts?: GeminiPart[] }; finishReason?: string }[]; usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number } };
    for (const p of r.candidates?.[0]?.content?.parts ?? []) {
      parts.push(p);
      if (p.text && !p.thought) {
        text += p.text;
        o.onText(p.text);
      }
    }
    if (r.candidates?.[0]?.finishReason) finish = r.candidates[0].finishReason;
    if (r.usageMetadata) usage = { input: r.usageMetadata.promptTokenCount ?? 0, output: r.usageMetadata.candidatesTokenCount ?? 0 };
  });
  const calls = parts.filter((p) => p.functionCall).map((p) => ({ id: newId(), name: p.functionCall!.name, input: p.functionCall!.args ?? {} }));
  const blocked = finish === 'SAFETY';
  return { text: blocked ? text + '\n\n_(Gemini declined this request.)_' : text, calls, raw: { kind: 'gemini', data: parts }, truncated: finish === 'MAX_TOKENS', usage };
}

// ---------- text protocol (any chat model) ----------
export function textProtocolPrompt(tools: ToolSpec[]) {
  const list = tools
    .map((t) => {
      const props = Object.entries(t.parameters.properties)
        .map(([k, v]) => `    - ${k}${t.parameters.required?.includes(k) ? '' : ' (optional)'}: ${(v as { description?: string }).description ?? ''}`)
        .join('\n');
      return `- ${t.name}: ${t.description}\n${props}`;
    })
    .join('\n');
  return `

# Using tools
You can call tools. To call one, write a block exactly like this (valid JSON, strings escaped):
<tool>{"name": "write_file", "input": {"path": "main.py", "content": "print('hi')\\n"}}</tool>
You may write a short sentence before the blocks and call several tools in one reply. After your tool blocks, STOP and wait: the results arrive in the next message. When you are done and need no tools, reply normally with no <tool> block.

Available tools:
${list}`;
}

const TOOL_RE = /<tool>\s*([\s\S]*?)\s*<\/tool>/g;

/** JSON.parse that also accepts raw newlines/tabs inside strings (small local models often emit them). */
export function parseLooseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const ESCAPES: Record<string, string> = { '\n': '\\n', '\r': '\\r', '\t': '\\t' };
    let out = '';
    let inString = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inString && ch === '\\') {
        out += ch + (text[++i] ?? '');
        continue;
      }
      if (ch === '"') inString = !inString;
      out += inString && ESCAPES[ch] ? ESCAPES[ch] : ch;
    }
    return JSON.parse(out);
  }
}

function toText(messages: AgentMsg[]): ChatMsg[] {
  return messages.map((m) => {
    if (m.role === 'user') return { role: 'user', content: m.text };
    if (m.role === 'tool')
      return { role: 'user', content: 'Tool results:\n' + m.results.map((r) => `<result name="${r.name}"${r.isError ? ' error="true"' : ''}>\n${r.output}\n</result>`).join('\n') };
    if (m.raw?.kind === 'text') return { role: 'assistant', content: String(m.raw.data) };
    return { role: 'assistant', content: m.text + m.calls.map((c) => `\n<tool>${JSON.stringify({ name: c.name, input: c.input })}</tool>`).join('') };
  });
}

async function callText(o: CallOpts): Promise<ModelTurn> {
  let full = '';
  let shown = 0;
  await askLLM({
    provider: o.provider,
    cfg: o.cfg,
    system: o.system + textProtocolPrompt(o.tools),
    history: toText(o.messages),
    signal: o.signal,
    effort: 'medium',
    onText: (d) => {
      full += d;
      // Show prose live, but not the tool-call JSON
      const cut = full.indexOf('<tool>');
      const visible = cut >= 0 ? full.slice(0, cut) : full.replace(/<[a-z]*$/, '');
      if (visible.length > shown) {
        o.onText(visible.slice(shown));
        shown = visible.length;
      }
    },
  });
  const calls: ToolCall[] = [];
  for (const m of full.matchAll(TOOL_RE)) {
    try {
      const j = parseLooseJson(m[1]) as { name?: string; input?: Record<string, unknown>; arguments?: Record<string, unknown> };
      if (j.name) calls.push({ id: newId(), name: j.name, input: j.input ?? j.arguments ?? {} });
    } catch {
      calls.push({ id: newId(), name: 'invalid_tool_call', input: { raw: m[1].slice(0, 400) } });
    }
  }
  const text = full.replace(TOOL_RE, '').trim();
  return { text, calls, raw: { kind: 'text', data: full } };
}
