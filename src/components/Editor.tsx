import { useEffect, useMemo, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';
import { MySQL, PostgreSQL, sql } from '@codemirror/lang-sql';
import { html } from '@codemirror/lang-html';
import { php } from '@codemirror/lang-php';
import { HighlightStyle, StreamLanguage, syntaxHighlighting, type LanguageSupport, type StreamParser } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { Prec } from '@codemirror/state';
import { tags } from '@lezer/highlight';
import { c, cpp, csharp, dart, java, kotlin } from '@codemirror/legacy-modes/mode/clike';
import { go } from '@codemirror/legacy-modes/mode/go';
import { rust } from '@codemirror/legacy-modes/mode/rust';
import { swift } from '@codemirror/legacy-modes/mode/swift';
import { ruby } from '@codemirror/legacy-modes/mode/ruby';
import { lua } from '@codemirror/legacy-modes/mode/lua';
import { r } from '@codemirror/legacy-modes/mode/r';
import { shell } from '@codemirror/legacy-modes/mode/shell';
import { powerShell } from '@codemirror/legacy-modes/mode/powershell';
import { LANG_META, langLabel } from '../content/langMeta';
import { oneDark } from '@codemirror/theme-one-dark';
import type { CodeLang } from '../content/types';
import { useGame } from '../engine/store';
import { ensureVendors, instrumentHtml } from '../engine/runners';

export const LANG_LABEL = new Proxy({} as Record<CodeLang, string>, { get: (_t, k) => (typeof k === 'string' && k in LANG_META ? langLabel(k as CodeLang) : undefined) });

const legacy = (mode: StreamParser<unknown>) => StreamLanguage.define(mode);

// One Dark's comment grey and keyword purple dip below 4.5:1 on the active line; use lighter shades
const readableComments = Prec.highest(syntaxHighlighting(HighlightStyle.define([{ tag: [tags.comment, tags.lineComment, tags.blockComment], color: '#9aa3b5', fontStyle: 'italic' }, { tag: [tags.keyword, tags.controlKeyword, tags.operatorKeyword, tags.definitionKeyword, tags.moduleKeyword], color: '#d19bea' }])));

/** CodeMirror language support for each exercise language (legacy modes for the less common ones). */
function extensionFor(lang: CodeLang): LanguageSupport | StreamLanguage<unknown> {
  switch (lang) {
    case 'python': return python();
    case 'sql': return sql();
    case 'postgres': return sql({ dialect: PostgreSQL });
    case 'mongodb': return javascript();
    case 'mysql': return sql({ dialect: MySQL });
    case 'redis': return legacy(shell);
    case 'web': return html();
    case 'typescript': return javascript({ typescript: true });
    case 'php': return php();
    case 'c': return legacy(c);
    case 'cpp': return legacy(cpp);
    case 'java': return legacy(java);
    case 'kotlin': return legacy(kotlin);
    case 'csharp': return legacy(csharp);
    case 'dart': return legacy(dart);
    case 'solidity': return legacy(java);
    case 'go': return legacy(go);
    case 'rust': return legacy(rust);
    case 'swift': return legacy(swift);
    case 'ruby': return legacy(ruby);
    case 'lua': return legacy(lua);
    case 'r': return legacy(r);
    case 'bash': return legacy(shell);
    case 'powershell': return legacy(powerShell);
    default: return javascript();
  }
}

export function Editor({ lang, value, onChange, height = '280px', onRun }: { lang: CodeLang; value: string; onChange: (v: string) => void; height?: string; onRun?: () => void }) {
  const theme = useGame((s) => s.settings.theme);
  const ext = useMemo(() => extensionFor(lang), [lang]);
  // Screen readers announce the editor by name (it's a contenteditable textbox)
  const a11y = useMemo(() => EditorView.contentAttributes.of({ 'aria-label': `${langLabel(lang)} code editor` }), [lang]);
  return (
    <div
      className="editor"
      onKeyDown={(e) => {
        if (onRun && e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          onRun();
        }
      }}
    >
      <CodeMirror value={value} height={height} theme={theme === 'light' ? 'light' : oneDark} extensions={theme === 'light' ? [ext, a11y] : [ext, a11y, readableComments]} onChange={onChange} basicSetup={{ tabSize: ['python', 'java', 'kotlin', 'csharp', 'c', 'cpp', 'rust', 'swift', 'php', 'powershell'].includes(lang) ? 4 : 2 }} />
    </div>
  );
}

/** Live, sandboxed render of an HTML document; updates shortly after the code stops changing. */
export function WebPreview({ code, height = 300 }: { code: string; height?: number }) {
  const [doc, setDoc] = useState('');
  useEffect(() => {
    let live = true;
    // Load bundled library copies (React lessons) first, so the preview can inline them
    const t = setTimeout(() => void ensureVendors(code).catch(() => undefined).then(() => live && setDoc(code)), 500);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [code]);
  return (
    <div className="web-preview">
      <div className="web-preview-bar">
        <span className="dot r" />
        <span className="dot y" />
        <span className="dot g" />
        <span className="muted small">live preview</span>
      </div>
      <iframe title="preview" sandbox="allow-scripts allow-modals allow-forms" srcDoc={instrumentHtml(doc)} style={{ height }} />
    </div>
  );
}
