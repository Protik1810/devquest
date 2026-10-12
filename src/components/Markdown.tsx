import { useEffect, useMemo } from 'react';
import { marked } from 'marked';
import { ILLUSTRATIONS } from '../illustrations';
import { VISUALIZERS } from '../visualizers';
import { useGame } from '../engine/store';

marked.setOptions({ gfm: true });

import { safeMarked } from '../engine/safeMarkdown';

export function Markdown({ source, untrusted = false }: { source: string; untrusted?: boolean }) {
  const parts = useMemo(() => (untrusted ? [source] : source.split(/^\s*\{\{((?:ill|viz):[\w-]+)\}\}\s*$/m)), [source, untrusted]);
  return (
    <div className="md">
      {parts.map((part, i) => {
        if (i % 2 === 1) {
          const [kind, name] = part.split(':');
          if (kind === 'viz') return <VizEmbed key={i} name={name} />;
          const Ill = ILLUSTRATIONS[name];
          return Ill ? <Ill key={i} /> : <p key={i}>[missing illustration: {name}]</p>;
        }
        // Lesson content is authored in-app (trusted); AI text goes through the escaping renderer
        return <div key={i} dangerouslySetInnerHTML={{ __html: (untrusted ? safeMarked : marked).parse(part) as string }} />;
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
