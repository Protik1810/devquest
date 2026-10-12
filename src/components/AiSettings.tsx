import { secretsBackend } from '../engine/secrets';
import { useEffect, useState } from 'react';
import { useGame } from '../engine/store';
import { PROVIDERS, cfgFor, providerDef, type ProviderId } from '../engine/providers';
import { askLLM, listModels } from '../engine/tutor';
import { toast } from '../engine/toast';
import { isNativeApp } from '../engine/platform';

type Status = { kind: 'idle' | 'busy' | 'ok' | 'err'; text: string };

export function AiSettings() {
  const provider = useGame((s) => s.settings.provider);
  const providers = useGame((s) => s.settings.providers);
  const updateSettings = useGame((s) => s.updateSettings);
  const updateProvider = useGame((s) => s.updateProvider);
  const def = providerDef(provider);
  const saved = cfgFor(provider, providers[provider]);
  const [draft, setDraft] = useState(saved);
  const [models, setModels] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>({ kind: 'idle', text: '' });

  // Load the selected provider's saved config whenever the provider changes
  useEffect(() => {
    setDraft(cfgFor(provider, useGame.getState().settings.providers[provider]));
    setModels([]);
    setStatus({ kind: 'idle', text: '' });
  }, [provider]);

  const dirty = draft.apiKey !== saved.apiKey || draft.model !== saved.model || draft.baseUrl !== saved.baseUrl;

  const save = () => {
    updateProvider(provider, { apiKey: draft.apiKey.trim(), model: draft.model.trim(), baseUrl: draft.baseUrl.trim() });
    toast({ kind: 'info', title: `🦉 Tutor set to ${def.name}` });
  };

  const fetchModels = async () => {
    setStatus({ kind: 'busy', text: 'Fetching models…' });
    try {
      const list = await listModels(provider, draft);
      setModels(list);
      if (!draft.model && list[0]) setDraft({ ...draft, model: list[0] });
      setStatus({ kind: list.length ? 'ok' : 'err', text: list.length ? `Found ${list.length} model${list.length > 1 ? 's' : ''}. Pick one from the model field.` : 'No models found. Pull or load a model first.' });
    } catch (e) {
      setStatus({ kind: 'err', text: (e as Error).message });
    }
  };

  const test = async () => {
    setStatus({ kind: 'busy', text: 'Sending a test message…' });
    let reply = '';
    try {
      await askLLM({ provider, cfg: draft, system: 'Reply in at most 8 words.', history: [{ role: 'user', content: 'Say hello to a new programmer.' }], onText: (d) => (reply += d) });
      setStatus({ kind: 'ok', text: `✅ Connected! Reply: "${reply.trim().slice(0, 120)}"` });
    } catch (e) {
      setStatus({ kind: 'err', text: `❌ ${(e as Error).message}` });
    }
  };

  const cloud = PROVIDERS.filter((p) => !p.local);
  const local = PROVIDERS.filter((p) => p.local);

  return (
    <section className="card">
      <h3>🦉 AI tutor (optional)</h3>
      <p className="muted small">
        Owl can run on a cloud model with your own API key, or on a <b>free, private model on your computer</b>. Keys are stored only on this device and sent only to the provider you choose. Cloud usage is billed to your account with that provider.
      </p>
      <label className="field">
        Provider
        <select value={provider} onChange={(e) => updateSettings({ provider: e.target.value as ProviderId })}>
          <optgroup label="☁️ Cloud (API key)">
            {cloud.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </optgroup>
          <optgroup label="💻 Local (free, offline, private)">
            {local.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </optgroup>
        </select>
      </label>
      {def.note && <div className="hint small">{def.note}</div>}
      {isNativeApp && def.local && (
        <div className="hint small">
          📱 On your phone, <code>localhost</code> means the phone itself. Replace it with your computer's IP address on the same Wi-Fi (e.g. <code>http://192.168.1.20:11434/v1</code>), and let the server accept network connections (Ollama: set <code>OLLAMA_HOST=0.0.0.0</code>; Solframe/LM Studio: listen on all interfaces).
        </div>
      )}

      {(def.needsKey || def.id === 'custom') && (
        <label className="field">
          API key {!def.needsKey && <span className="muted small">(optional)</span>}
          {def.keyUrl && (
            <a href={def.keyUrl} target="_blank" rel="noreferrer" className="small">
              get a key ↗
            </a>
          )}
          <input type="password" placeholder={def.needsKey ? 'paste your API key' : 'optional'} value={draft.apiKey} onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })} autoComplete="off" />
          <span className="muted small">
            {secretsBackend === 'os-keychain'
              ? "🔐 Stored encrypted by your operating system's keychain. Never written to save files or exports."
              : secretsBackend === 'android-keystore'
                ? '🔐 Stored encrypted with the Android Keystore. Never written to save files or backups.'
                : '🔑 Stored only in this browser (not in save files or exports). For encrypted storage, use the desktop or Android app.'}
          </span>
        </label>
      )}

      <label className="field">
        Base URL
        <input value={draft.baseUrl} onChange={(e) => setDraft({ ...draft, baseUrl: e.target.value })} spellCheck={false} />
      </label>

      <label className="field">
        Model
        <div className="row">
          <input className="grow" list="model-list" value={draft.model} placeholder={def.local ? 'leave empty to use the loaded model' : 'model ID'} onChange={(e) => setDraft({ ...draft, model: e.target.value })} spellCheck={false} />
          <datalist id="model-list">
            {models.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
          <button onClick={fetchModels} disabled={status.kind === 'busy' || (def.needsKey && !draft.apiKey)}>
            ⟳ Fetch models
          </button>
        </div>
      </label>

      <div className="row">
        <button className="primary" onClick={save} disabled={!dirty}>
          {dirty ? 'Save' : 'Saved ✓'}
        </button>
        <button onClick={test} disabled={status.kind === 'busy' || (def.needsKey && !draft.apiKey)}>
          🔌 Test connection
        </button>
      </div>
      {status.text && <div className={`feedback ${status.kind === 'err' ? 'bad' : status.kind === 'ok' ? 'ok' : ''} small`}>{status.text}</div>}

      {def.local && (
        <details className="small muted">
          <summary>Local model tips</summary>
          <ul>
            <li><b>Ollama</b>: install from ollama.com, then <code>ollama pull qwen2.5-coder:7b</code> (great for code) or <code>llama3.2</code> (small and fast).</li>
            <li><b>Ollama CORS</b>: the desktop app and localhost are allowed by default. If you host the web app elsewhere, set <code>OLLAMA_ORIGINS=*</code> before starting Ollama.</li>
            <li><b>LM Studio</b>: Developer tab → Start server → enable CORS.</li>
            <li>Small models (1–3B) run on most laptops; 7–8B need ~8 GB RAM; bigger models give better explanations.</li>
          </ul>
        </details>
      )}
    </section>
  );
}
