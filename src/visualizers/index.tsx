import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { C } from '../illustrations/kit';

// ---------- Big-O race ----------
const CURVES: [string, (n: number) => number, string][] = [
  ['O(1)', () => 1, C.green],
  ['O(log n)', (n) => Math.log2(Math.max(n, 1)), C.cyan],
  ['O(n)', (n) => n, C.blue],
  ['O(n log n)', (n) => n * Math.log2(Math.max(n, 1)), C.amber],
  ['O(n²)', (n) => n * n, C.red],
  ['O(2ⁿ)', (n) => 2 ** n, C.purple],
];

function BigO() {
  const [n, setN] = useState(16);
  const W = 560;
  const H = 240;
  const maxY = n * n * 1.05;
  const pts = (f: (x: number) => number) =>
    Array.from({ length: 61 }, (_, i) => {
      const x = (i / 60) * n;
      const y = Math.min(f(x), maxY);
      return `${(x / n) * W},${H - (y / maxY) * H}`;
    }).join(' ');
  return (
    <div className="viz">
      <div className="viz-controls">
        <label>
          n = <b>{n}</b>
          <input type="range" min={2} max={64} value={n} onChange={(e) => setN(+e.target.value)} />
        </label>
      </div>
      <svg viewBox={`-10 -10 ${W + 20} ${H + 20}`} className="viz-svg">
        <line x1={0} y1={H} x2={W} y2={H} stroke="var(--ill-line)" />
        <line x1={0} y1={0} x2={0} y2={H} stroke="var(--ill-line)" />
        {CURVES.map(([name, f, col]) => (
          <polyline key={name} points={pts(f)} fill="none" stroke={col} strokeWidth={3} />
        ))}
      </svg>
      <table className="viz-table">
        <tbody>
          {CURVES.map(([name, f, col]) => (
            <tr key={name}>
              <td style={{ color: col, fontWeight: 700 }}>{name}</td>
              <td>{Math.round(f(n)).toLocaleString()} steps</td>
              <td style={{ width: '50%' }}>
                <div className="bar" style={{ width: `${Math.min(100, (f(n) / (n * n)) * 100)}%`, background: col }} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------- Stack & queue ----------
function StackQueue() {
  const [stack, setStack] = useState<number[]>([3, 8]);
  const [queue, setQueue] = useState<number[]>([5, 1]);
  const [msg, setMsg] = useState('Push and pop to see the difference!');
  const next = useRef(10);
  const rnd = () => (next.current = (next.current * 7 + 3) % 97);
  return (
    <div className="viz">
      <div className="sq-grid">
        <div>
          <h4>Stack (LIFO)</h4>
          <div className="viz-controls">
            <button onClick={() => { const v = rnd(); setStack([...stack, v]); setMsg(`push(${v}) → added on top`); }}>push</button>
            <button disabled={!stack.length} onClick={() => { setMsg(`pop() → ${stack[stack.length - 1]} (last in, first out)`); setStack(stack.slice(0, -1)); }}>pop</button>
          </div>
          <div className="stack-col">
            {stack.map((v, i) => (
              <div key={`${i}-${v}`} className={`cell pop-in ${i === stack.length - 1 ? 'top' : ''}`}>{v}</div>
            ))}
          </div>
        </div>
        <div>
          <h4>Queue (FIFO)</h4>
          <div className="viz-controls">
            <button onClick={() => { const v = rnd(); setQueue([...queue, v]); setMsg(`enqueue(${v}) → joins the back`); }}>enqueue</button>
            <button disabled={!queue.length} onClick={() => { setMsg(`dequeue() → ${queue[0]} (first in, first out)`); setQueue(queue.slice(1)); }}>dequeue</button>
          </div>
          <div className="queue-row">
            <span className="muted">front →</span>
            {queue.map((v, i) => (
              <div key={`${i}-${v}`} className={`cell pop-in ${i === 0 ? 'top' : ''}`}>{v}</div>
            ))}
            <span className="muted">← back</span>
          </div>
        </div>
      </div>
      <p className="viz-msg">{msg}</p>
    </div>
  );
}

// ---------- Binary search ----------
function BinarySearch() {
  const items = useMemo(() => Array.from({ length: 16 }, (_, i) => i * 6 + 3), []);
  const [target, setTarget] = useState(57);
  const [state, setState] = useState({ lo: 0, hi: 15, mid: -1, found: -1, steps: 0, done: false });
  const reset = (t = target) => {
    setTarget(t);
    setState({ lo: 0, hi: 15, mid: -1, found: -1, steps: 0, done: false });
  };
  const step = () => {
    const { lo, hi, steps } = state;
    if (state.done) return;
    if (lo > hi) return setState({ ...state, done: true });
    const mid = Math.floor((lo + hi) / 2);
    if (items[mid] === target) return setState({ lo, hi, mid, found: mid, steps: steps + 1, done: true });
    if (items[mid] < target) setState({ lo: mid + 1, hi, mid, found: -1, steps: steps + 1, done: mid + 1 > hi });
    else setState({ lo, hi: mid - 1, mid, found: -1, steps: steps + 1, done: lo > mid - 1 });
  };
  return (
    <div className="viz">
      <div className="viz-controls">
        <label>
          target
          <select value={target} onChange={(e) => reset(+e.target.value)}>
            {[...items, 50].sort((a, b) => a - b).map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <button onClick={step} disabled={state.done}>step ▶</button>
        <button onClick={() => reset()}>reset</button>
        <span className="muted">steps: {state.steps}</span>
      </div>
      <div className="bs-row">
        {items.map((v, i) => {
          const out = i < state.lo || i > state.hi;
          const cls = i === state.found ? 'found' : i === state.mid ? 'mid' : out ? 'out' : '';
          return (
            <div key={i} className={`cell ${cls}`}>
              <div>{v}</div>
              <small>{i}</small>
            </div>
          );
        })}
      </div>
      <p className="viz-msg">
        {state.found >= 0
          ? `🎯 Found ${target} at index ${state.found} in ${state.steps} steps (linear search could take up to 16).`
          : state.done
            ? `❌ ${target} is not in the list. Gave up after ${state.steps} steps.`
            : state.mid >= 0
              ? `Checked index ${state.mid} (${items[state.mid]}): ${items[state.mid] < target ? 'too small → search right half' : 'too big → search left half'}`
              : 'Press step: look at the middle element and discard half each time.'}
      </p>
    </div>
  );
}

// ---------- Sorting ----------
type Frame = { arr: number[]; hl: number[]; sorted: number[] };

function sortFrames(algo: string, input: number[]): Frame[] {
  const a = [...input];
  const frames: Frame[] = [];
  const sorted = new Set<number>();
  const push = (hl: number[]) => frames.push({ arr: [...a], hl, sorted: [...sorted] });
  const n = a.length;
  if (algo === 'bubble') {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        push([j, j + 1]);
        if (a[j] > a[j + 1]) [a[j], a[j + 1]] = [a[j + 1], a[j]];
      }
      sorted.add(n - i - 1);
    }
  } else if (algo === 'selection') {
    for (let i = 0; i < n; i++) {
      let m = i;
      for (let j = i + 1; j < n; j++) {
        push([m, j]);
        if (a[j] < a[m]) m = j;
      }
      [a[i], a[m]] = [a[m], a[i]];
      sorted.add(i);
    }
  } else if (algo === 'insertion') {
    for (let i = 1; i < n; i++) {
      let j = i;
      while (j > 0 && a[j - 1] > a[j]) {
        push([j - 1, j]);
        [a[j - 1], a[j]] = [a[j], a[j - 1]];
        j--;
      }
      push([j]);
    }
  } else if (algo === 'merge') {
    const ms = (lo: number, hi: number) => {
      if (hi - lo < 1) return;
      const mid = (lo + hi) >> 1;
      ms(lo, mid);
      ms(mid + 1, hi);
      const merged: number[] = [];
      let i = lo;
      let j = mid + 1;
      while (i <= mid || j <= hi) {
        push([i <= mid ? i : -1, j <= hi ? j : -1]);
        if (j > hi || (i <= mid && a[i] <= a[j])) merged.push(a[i++]);
        else merged.push(a[j++]);
      }
      for (let k = 0; k < merged.length; k++) {
        a[lo + k] = merged[k];
        push([lo + k]);
      }
    };
    ms(0, n - 1);
  } else {
    const qs = (lo: number, hi: number) => {
      if (lo >= hi) {
        if (lo === hi) sorted.add(lo);
        return;
      }
      const pivot = a[hi];
      let i = lo;
      for (let j = lo; j < hi; j++) {
        push([j, hi, i]);
        if (a[j] < pivot) {
          [a[i], a[j]] = [a[j], a[i]];
          i++;
        }
      }
      [a[i], a[hi]] = [a[hi], a[i]];
      sorted.add(i);
      push([i]);
      qs(lo, i - 1);
      qs(i + 1, hi);
    };
    qs(0, n - 1);
  }
  for (let i = 0; i < n; i++) sorted.add(i);
  push([]);
  return frames;
}

function Sorting() {
  const [algo, setAlgo] = useState('bubble');
  const [seed, setSeed] = useState(1);
  const input = useMemo(() => {
    let s = seed * 9301 + 49297;
    return Array.from({ length: 24 }, () => ((s = (s * 9301 + 49297) % 233280), 5 + Math.floor((s / 233280) * 95)));
  }, [seed]);
  const frames = useMemo(() => sortFrames(algo, input), [algo, input]);
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(40);
  useEffect(() => {
    setI(0);
  }, [frames]);
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setI((x) => (x >= frames.length - 1 ? (setPlaying(false), x) : x + 1)), 1000 / speed);
    return () => clearInterval(t);
  }, [playing, speed, frames.length]);
  const f = frames[Math.min(i, frames.length - 1)];
  return (
    <div className="viz">
      <div className="viz-controls">
        <select value={algo} onChange={(e) => { setAlgo(e.target.value); setPlaying(false); }}>
          <option value="bubble">Bubble sort</option>
          <option value="selection">Selection sort</option>
          <option value="insertion">Insertion sort</option>
          <option value="merge">Merge sort</option>
          <option value="quick">Quicksort</option>
        </select>
        <button onClick={() => (i >= frames.length - 1 ? (setI(0), setPlaying(true)) : setPlaying(!playing))}>{playing ? '⏸ pause' : '▶ play'}</button>
        <button onClick={() => { setPlaying(false); setI(Math.min(i + 1, frames.length - 1)); }}>step</button>
        <button onClick={() => { setPlaying(false); setSeed(seed + 1); }}>🔀 shuffle</button>
        <label>
          speed
          <input type="range" min={5} max={200} value={speed} onChange={(e) => setSpeed(+e.target.value)} />
        </label>
        <span className="muted">
          step {i + 1}/{frames.length}
        </span>
      </div>
      <div className="bars">
        {f.arr.map((v, k) => (
          <div key={k} className="sbar" style={{ height: `${v}%`, background: f.hl.includes(k) ? C.amber : f.sorted.includes(k) ? C.green : C.blue }} />
        ))}
      </div>
      <p className="viz-msg">Comparisons/moves recorded: {frames.length}. Try every algorithm on the same data and compare the step counts!</p>
    </div>
  );
}

// ---------- BST ----------
type BNode = { v: number; l?: BNode; r?: BNode };

function insertBst(n: BNode | undefined, v: number): BNode {
  if (!n) return { v };
  if (v < n.v) return { ...n, l: insertBst(n.l, v) };
  if (v > n.v) return { ...n, r: insertBst(n.r, v) };
  return n;
}

function Bst() {
  const [root, setRoot] = useState<BNode | undefined>(() => [50, 30, 70, 20, 40, 60, 80].reduce<BNode | undefined>((r, v) => insertBst(r, v), undefined));
  const [val, setVal] = useState('45');
  const [path, setPath] = useState<number[]>([]);
  const nodes: { v: number; x: number; y: number; px?: number; py?: number }[] = [];
  const walk = (n: BNode | undefined, x: number, y: number, dx: number, px?: number, py?: number) => {
    if (!n) return;
    nodes.push({ v: n.v, x, y, px, py });
    walk(n.l, x - dx, y + 60, dx / 2, x, y);
    walk(n.r, x + dx, y + 60, dx / 2, x, y);
  };
  walk(root, 320, 30, 150);
  const inorder: number[] = [];
  const io = (n?: BNode): void => {
    if (!n) return;
    io(n.l);
    inorder.push(n.v);
    io(n.r);
  };
  io(root);
  const height = Math.max(0, ...nodes.map((n) => n.y)) + 40;
  const trace = (v: number) => {
    const p: number[] = [];
    let n = root;
    while (n) {
      p.push(n.v);
      if (v === n.v) break;
      n = v < n.v ? n.l : n.r;
    }
    return p;
  };
  const add = () => {
    const v = parseInt(val, 10);
    if (Number.isNaN(v)) return;
    setPath(trace(v));
    setRoot(insertBst(root, v));
    setVal(String(Math.floor(Math.random() * 99) + 1));
  };
  return (
    <div className="viz">
      <div className="viz-controls">
        <input value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} style={{ width: 70 }} />
        <button onClick={add}>insert</button>
        <button onClick={() => setPath(trace(parseInt(val, 10)))}>search</button>
        <button onClick={() => { setRoot(undefined); setPath([]); }}>clear</button>
      </div>
      <svg viewBox={`0 0 640 ${Math.max(height, 100)}`} className="viz-svg">
        {nodes.map((n) => n.px !== undefined && <line key={`l${n.v}`} x1={n.px} y1={n.py} x2={n.x} y2={n.y} stroke="var(--ill-line)" strokeWidth={2} />)}
        {nodes.map((n) => (
          <g key={n.v} className="pop-in">
            <circle cx={n.x} cy={n.y} r={18} fill={path.includes(n.v) ? C.amber : C.purple} fillOpacity={0.3} stroke={path.includes(n.v) ? C.amber : C.purple} strokeWidth={2} />
            <text x={n.x} y={n.y + 5} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--ill-text)">{n.v}</text>
          </g>
        ))}
      </svg>
      <p className="viz-msg">
        {path.length ? `Path visited: ${path.join(' → ')} (${path.length} comparisons). ` : ''}In-order traversal: <code>{inorder.join(', ') || '(empty)'}</code>
      </p>
    </div>
  );
}

// ---------- Graph BFS / DFS ----------
const G_NODES: Record<string, [number, number]> = { A: [80, 60], B: [220, 30], C: [220, 140], D: [370, 50], E: [370, 160], F: [520, 100], G: [520, 200], H: [80, 190] };
const G_EDGES: [string, string][] = [['A', 'B'], ['A', 'C'], ['A', 'H'], ['B', 'D'], ['C', 'D'], ['C', 'E'], ['D', 'F'], ['E', 'F'], ['E', 'G'], ['H', 'C']];

function traversal(kind: 'bfs' | 'dfs', start: string) {
  const adj: Record<string, string[]> = {};
  for (const [a, b] of G_EDGES) {
    (adj[a] ??= []).push(b);
    (adj[b] ??= []).push(a);
  }
  for (const k in adj) adj[k].sort();
  const order: string[] = [];
  const frontier: string[][] = [];
  const seen = new Set([start]);
  const box = [start];
  while (box.length) {
    frontier.push([...box]);
    const n = kind === 'bfs' ? box.shift()! : box.pop()!;
    order.push(n);
    const nbs = kind === 'bfs' ? adj[n] : [...adj[n]].reverse();
    for (const nb of nbs) if (!seen.has(nb)) (seen.add(nb), box.push(nb));
  }
  return { order, frontier };
}

function GraphViz() {
  const [kind, setKind] = useState<'bfs' | 'dfs'>('bfs');
  const [step, setStep] = useState(0);
  const { order, frontier } = useMemo(() => traversal(kind, 'A'), [kind]);
  useEffect(() => {
    setStep(0);
  }, [kind]);
  const visited = order.slice(0, step);
  return (
    <div className="viz">
      <div className="viz-controls">
        <button className={kind === 'bfs' ? 'active' : ''} onClick={() => setKind('bfs')}>BFS (queue)</button>
        <button className={kind === 'dfs' ? 'active' : ''} onClick={() => setKind('dfs')}>DFS (stack)</button>
        <button onClick={() => setStep(Math.min(step + 1, order.length))} disabled={step >= order.length}>step ▶</button>
        <button onClick={() => setStep(0)}>reset</button>
      </div>
      <svg viewBox="0 0 600 240" className="viz-svg">
        {G_EDGES.map(([a, b]) => (
          <line key={a + b} x1={G_NODES[a][0]} y1={G_NODES[a][1]} x2={G_NODES[b][0]} y2={G_NODES[b][1]} stroke="var(--ill-line)" strokeWidth={2} />
        ))}
        {Object.entries(G_NODES).map(([n, [x, y]]) => {
          const idx = visited.indexOf(n);
          const col = idx === visited.length - 1 && idx >= 0 ? C.amber : idx >= 0 ? C.green : C.slate;
          return (
            <g key={n}>
              <circle cx={x} cy={y} r={20} fill={col} fillOpacity={0.3} stroke={col} strokeWidth={2} />
              <text x={x} y={y + 5} textAnchor="middle" fontWeight={700} fill="var(--ill-text)">{n}</text>
              {idx >= 0 && <text x={x + 22} y={y - 16} fontSize={11} fill={C.amber} fontWeight={700}>{idx + 1}</text>}
            </g>
          );
        })}
      </svg>
      <p className="viz-msg">
        Visit order: <b>{visited.join(' → ') || '(start at A)'}</b>
        <br />
        {kind === 'bfs' ? 'Queue' : 'Stack'} before this step: <code>[{(frontier[step] ?? []).join(', ')}]</code>
      </p>
    </div>
  );
}

export const VISUALIZERS: Record<string, () => ReactElement> = {
  bigo: BigO,
  stackqueue: StackQueue,
  binarysearch: BinarySearch,
  sorting: Sorting,
  bst: Bst,
  graph: GraphViz,
};

export const VISUALIZER_INFO: { id: string; name: string; emoji: string; desc: string }[] = [
  { id: 'sorting', name: 'Sorting Algorithms', emoji: '📊', desc: 'Bubble, selection, insertion, merge and quicksort, animated.' },
  { id: 'bigo', name: 'Big-O Race', emoji: '🏎️', desc: 'Watch complexity curves explode as n grows.' },
  { id: 'binarysearch', name: 'Binary Search', emoji: '🎯', desc: 'Halve the search space each step.' },
  { id: 'bst', name: 'Binary Search Tree', emoji: '🌳', desc: 'Insert values and watch the tree grow.' },
  { id: 'graph', name: 'Graph BFS vs DFS', emoji: '🕸️', desc: 'Compare breadth-first and depth-first exploration.' },
  { id: 'stackqueue', name: 'Stack & Queue', emoji: '🥞', desc: 'LIFO vs FIFO, hands on.' },
];
