import type { ReactNode } from 'react';

/** Shared SVG building blocks so every illustration looks consistent in light and dark themes. */

export const C = {
  blue: '#3b82f6',
  green: '#22c55e',
  amber: '#f59e0b',
  red: '#ef4444',
  purple: '#a855f7',
  pink: '#ec4899',
  cyan: '#06b6d4',
  slate: '#64748b',
};

export function Svg({ w, h, children, caption }: { w: number; h: number; children: ReactNode; caption?: string }) {
  return (
    <figure className="ill">
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={caption}>
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="var(--ill-line)" />
          </marker>
        </defs>
        {children}
      </svg>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

export function Box({ x, y, w, h, label, sub, color = C.blue, r = 10, fs = 15 }: { x: number; y: number; w: number; h: number; label?: ReactNode; sub?: ReactNode; color?: string; r?: number; fs?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={r} fill={color} fillOpacity={0.16} stroke={color} strokeWidth={2} />
      {label !== undefined && (
        <text x={x + w / 2} y={y + h / 2 + (sub ? -4 : 5)} textAnchor="middle" fontSize={fs} fontWeight={700} fill="var(--ill-text)">
          {label}
        </text>
      )}
      {sub && (
        <text x={x + w / 2} y={y + h / 2 + 14} textAnchor="middle" fontSize={11} fill="var(--ill-muted)">
          {sub}
        </text>
      )}
    </g>
  );
}

export function Arrow({ x1, y1, x2, y2, label, dashed, color, curve = 0 }: { x1: number; y1: number; x2: number; y2: number; label?: string; dashed?: boolean; color?: string; curve?: number }) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 - curve;
  const d = curve ? `M${x1},${y1} Q${mx},${my} ${x2},${y2}` : `M${x1},${y1} L${x2},${y2}`;
  return (
    <g>
      <path d={d} stroke={color ?? 'var(--ill-line)'} strokeWidth={2} fill="none" markerEnd="url(#arrow)" strokeDasharray={dashed ? '6 5' : undefined} />
      {label && (
        <text x={mx} y={my - 7} textAnchor="middle" fontSize={12} fill="var(--ill-muted)" fontWeight={600}>
          {label}
        </text>
      )}
    </g>
  );
}

export function T({ x, y, children, size = 13, anchor = 'middle', bold, color, mono }: { x: number; y: number; children: ReactNode; size?: number; anchor?: 'start' | 'middle' | 'end'; bold?: boolean; color?: string; mono?: boolean }) {
  return (
    <text x={x} y={y} fontSize={size} textAnchor={anchor} fontWeight={bold ? 700 : 400} fill={color ?? 'var(--ill-text)'} fontFamily={mono ? 'var(--mono)' : undefined}>
      {children}
    </text>
  );
}

/** A dot that travels along a path forever: used to show data flowing. */
export function Packet({ path, color = C.amber, dur = 3, delay = 0, r = 6 }: { path: string; color?: string; dur?: number; delay?: number; r?: number }) {
  return (
    <circle r={r} fill={color}>
      <animateMotion dur={`${dur}s`} repeatCount="indefinite" path={path} begin={`${-delay}s`} />
    </circle>
  );
}
