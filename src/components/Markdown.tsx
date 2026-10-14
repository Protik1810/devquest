import { useEffect, useMemo } from 'react';
import { marked } from 'marked';
import { ILLUSTRATIONS } from '../illustrations';
import { VISUALIZERS } from '../visualizers';
import { useGame } from '../engine/store';
import type { CodeLang, QuizQuestion } from '../content/types';
import { parseQuestions } from '../content/lessonFile';
import { InlineCheck, RUNNABLE, RunnableCode } from './RunnableCode';

marked.setOptions({ gfm: true });

import { safeMarked } from '../engine/safeMarkdown';

type Segment =
  | { kind: 'md'; text: string }
  | { kind: 'ill'; name: string }
  | { kind: 'viz'; name: string }
  | { kind: 'code'; lang: CodeLang; code: string; earlier: string[] }
  | { kind: 'check'; questions: QuizQuestion[] };

const EMBED = /^\s*\{\{((?:ill|viz):[\w-]+)\}\}\s*$/m;
/** A fenced block: ```lang or ~~~lang, closed by the same fence on its own line. */
const FENCE = /^(```|~~~)([\w-]*)[ \t]*\n([\s\S]*?)^\1[ \t]*$/gm;

function embeds(text: string): Segment[] {
  return text.split(EMBED).map((part, i): Segment => {
    if (i % 2 === 0) return { kind: 'md', text: part };
    const [kind, name] = part.split(':');
    return kind === 'viz' ? { kind: 'viz', name } : { kind: 'ill', name };
  });
}

/** Lesson text with its interactive parts pulled out: runnable examples and "pause and predict" checks. */
function segments(source: string, interactive: boolean): Segment[] {
  if (!interactive) return embeds(source);
  const out: Segment[] = [];
  const seen: Partial<Record<CodeLang, string[]>> = {};
  let pending = '';
  let at = 0;
  for (const m of source.matchAll(FENCE)) {
    const [whole, fence, info, body] = m;
    const lang = fence === '```' || fence === '~~~' ? RUNNABLE[info.toLowerCase()] : undefined;
    const check = fence === '~~~' && info === 'check';
    if (!lang && !check) continue; // stays ordinary markdown
    pending += source.slice(at, m.index);
    at = m.index! + whole.length;
    out.push(...embeds(pending));
    pending = '';
    if (check) out.push({ kind: 'check', questions: parseQuestions('lesson text', body) });
    else if (lang) {
      const earlier = seen[lang] ?? [];
      out.push({ kind: 'code', lang, code: body, earlier: [...earlier] });
      seen[lang] = [...earlier, body];
    }
  }
  out.push(...embeds(pending + source.slice(at)));
  return out;
}

/**
 * Renders markdown. `untrusted` text (from the AI) goes through the escaping renderer. `interactive` lesson text
 * gets runnable code examples (▶ Run, edit, step through) and ~~~check blocks as inline questions.
 */
export function Markdown({ source, untrusted = false, interactive = false }: { source: string; untrusted?: boolean; interactive?: boolean }) {
  const parts = useMemo(() => (untrusted ? [{ kind: 'md', text: source } as Segment] : segments(source, interactive)), [source, untrusted, interactive]);
  return (
    <div className="md">
      {parts.map((part, i) => {
        if (part.kind === 'viz') return <VizEmbed key={i} name={part.name} />;
        if (part.kind === 'ill') {
          const Ill = ILLUSTRATIONS[part.name];
          return Ill ? <Ill key={i} /> : <p key={i}>[missing illustration: {part.name}]</p>;
        }
        if (part.kind === 'code') return <RunnableCode key={`${i}:${part.code.length}`} lang={part.lang} code={part.code} earlier={part.earlier} />;
        if (part.kind === 'check') return <InlineCheck key={i} questions={part.questions} />;
        // Lesson content is authored in-app (trusted); AI text goes through the escaping renderer
        return <div key={i} dangerouslySetInnerHTML={{ __html: (untrusted ? safeMarked : marked).parse(part.text) as string }} />;
      })}
    </div>
  );
}

export function VizEmbed({ name }: { name: string }) {
  const bump = useGame((s) => s.bump);
  useEffect(() => {
    bump('vizOpened');
  }, [bump, name]);
  const Viz = VISUALIZERS[name];
  return Viz ? <Viz /> : <p>[missing visualizer: {name}]</p>;
}
