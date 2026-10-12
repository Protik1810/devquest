/** LLM providers the tutor can talk to. Everything except Anthropic and Gemini speaks the OpenAI-compatible chat API. */
export type ProviderKind = 'anthropic' | 'gemini' | 'openai-compatible';

export type ProviderId = 'anthropic' | 'openai' | 'gemini' | 'openrouter' | 'groq' | 'mistral' | 'deepseek' | 'ollama' | 'lmstudio' | 'solframe' | 'custom';

export type ProviderDef = {
  id: ProviderId;
  name: string;
  kind: ProviderKind;
  local: boolean;
  needsKey: boolean;
  baseUrl: string;
  /** Suggested model; users can type any ID or fetch the live list. */
  model: string;
  keyUrl?: string;
  note?: string;
  /** Accepts response_format: json_object */
  jsonMode?: boolean;
};

export type ProviderCfg = { apiKey: string; model: string; baseUrl: string };

export const PROVIDERS: ProviderDef[] = [
  { id: 'anthropic', name: 'Anthropic Claude', kind: 'anthropic', local: false, needsKey: true, baseUrl: 'https://api.anthropic.com', model: 'claude-opus-5-5', keyUrl: 'https://console.anthropic.com/' },
  { id: 'openai', jsonMode: true, name: 'OpenAI', kind: 'openai-compatible', local: false, needsKey: true, baseUrl: 'https://api.openai.com/v1', model: 'gpt-4.1-mini', keyUrl: 'https://platform.openai.com/api-keys' },
  { id: 'gemini', name: 'Google Gemini', kind: 'gemini', local: false, needsKey: true, baseUrl: 'https://generativelanguage.googleapis.com/v1beta', model: 'gemini-2.5-flash', keyUrl: 'https://aistudio.google.com/apikey' },
  { id: 'openrouter', jsonMode: true, name: 'OpenRouter (hundreds of models)', kind: 'openai-compatible', local: false, needsKey: true, baseUrl: 'https://openrouter.ai/api/v1', model: 'openrouter/auto', keyUrl: 'https://openrouter.ai/keys' },
  { id: 'groq', jsonMode: true, name: 'Groq', kind: 'openai-compatible', local: false, needsKey: true, baseUrl: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile', keyUrl: 'https://console.groq.com/keys' },
  { id: 'mistral', jsonMode: true, name: 'Mistral AI', kind: 'openai-compatible', local: false, needsKey: true, baseUrl: 'https://api.mistral.ai/v1', model: 'mistral-small-latest', keyUrl: 'https://console.mistral.ai/api-keys' },
  { id: 'deepseek', jsonMode: true, name: 'DeepSeek', kind: 'openai-compatible', local: false, needsKey: true, baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat', keyUrl: 'https://platform.deepseek.com/api_keys' },
  {
    id: 'ollama', jsonMode: true, name: 'Ollama (local)', kind: 'openai-compatible', local: true, needsKey: false, baseUrl: 'http://localhost:11434/v1', model: 'llama3.2',
    note: 'Install Ollama, then run `ollama pull llama3.2` (or qwen2.5-coder, gemma3, deepseek-r1…). It must be running in the background.',
  },
  {
    id: 'lmstudio', name: 'LM Studio (local)', kind: 'openai-compatible', local: true, needsKey: false, baseUrl: 'http://localhost:1234/v1', model: '',
    note: 'In LM Studio, load a model, open the Developer tab, start the server and enable CORS.',
  },
  {
    id: 'solframe', name: 'Solframe Studio (local)', kind: 'openai-compatible', local: true, needsKey: true, baseUrl: 'http://127.0.0.1:8765/v1', model: '',
    note: 'In Solframe Studio, turn on the Agent Server and paste its API key here. Click "Fetch models" and pick a chat model (a coder or instruct model works best). Use the DevQuest desktop app, because the Solframe server blocks requests from web pages (CORS).',
  },
  {
    id: 'custom', name: 'Custom OpenAI-compatible server', kind: 'openai-compatible', local: true, needsKey: false, baseUrl: 'http://localhost:8080/v1', model: '',
    note: 'Works with llama.cpp server, vLLM, Jan, LocalAI, text-generation-webui, or any hosted OpenAI-compatible API. The API key is optional.',
  },
];

export const providerDef = (id: string) => PROVIDERS.find((p) => p.id === id) ?? PROVIDERS[0];

export const defaultCfg = (id: ProviderId): ProviderCfg => {
  const d = providerDef(id);
  return { apiKey: '', model: d.model, baseUrl: d.baseUrl };
};

/** Merge saved settings over the provider's defaults. */
export const cfgFor = (id: ProviderId, saved?: Partial<ProviderCfg>): ProviderCfg => {
  const d = defaultCfg(id);
  return { apiKey: saved?.apiKey ?? d.apiKey, model: saved?.model || d.model, baseUrl: (saved?.baseUrl || d.baseUrl).replace(/\/+$/, '') };
};

/** Ready to chat: has a model, and a key when the provider requires one. */
export const isConfigured = (id: ProviderId, cfg: ProviderCfg) => {
  const d = providerDef(id);
  return (!d.needsKey || !!cfg.apiKey.trim()) && !!cfg.baseUrl && (d.id === 'lmstudio' || d.id === 'custom' || !!cfg.model);
};
