import { Link, useParams } from 'react-router-dom';
import { VISUALIZER_INFO } from '../visualizers';
import { ILLUSTRATIONS } from '../illustrations';
import { VizEmbed } from '../components/Markdown';

const GALLERY: [string, string][] = [
  ['computer', 'Parts of a computer'],
  ['binary', 'Binary bit flipper'],
  ['compile', 'Compiled vs interpreted'],
  ['os-layers', 'Operating system layers'],
  ['memory', 'Stack & heap'],
  ['threads', 'Processes & threads'],
  ['eventloop', 'JavaScript event loop'],
  ['hashmap', 'Hash map buckets'],
  ['osi', 'Network layers'],
  ['tcp', 'TCP handshake'],
  ['dns', 'DNS resolution'],
  ['http', 'HTTP request/response'],
  ['gitgraph', 'Git branches'],
  ['docker', 'VMs vs containers'],
  ['k8s', 'Kubernetes'],
  ['sysdesign', 'Scalable architecture'],
  ['neural', 'Neural network'],
];

export function Lab() {
  const { id } = useParams();
  const info = VISUALIZER_INFO.find((v) => v.id === id);
  const Ill = id ? ILLUSTRATIONS[id] : undefined;

  if (info || Ill)
    return (
      <div>
        <Link to="/lab" className="muted small">← Visual Lab</Link>
        <h1>{info ? `${info.emoji} ${info.name}` : GALLERY.find((g) => g[0] === id)?.[1]}</h1>
        {info && <p className="muted">{info.desc}</p>}
        <div className="card">{info ? <VizEmbed name={info.id} /> : Ill && <Ill />}</div>
      </div>
    );

  return (
    <div>
      <h1>🔬 Visual Lab</h1>
      <p className="muted">Interactive visualizers and animated diagrams from across the curriculum, all in one place.</p>
      <h2>Interactive visualizers</h2>
      <div className="lab-grid">
        {VISUALIZER_INFO.map((v) => (
          <Link key={v.id} to={`/lab/${v.id}`} className="card lab-card">
            <div className="big-emoji">{v.emoji}</div>
            <b>{v.name}</b>
            <div className="muted small">{v.desc}</div>
          </Link>
        ))}
      </div>
      <h2>Illustrated concepts</h2>
      <div className="lab-grid">
        {GALLERY.map(([k, name]) => (
          <Link key={k} to={`/lab/${k}`} className="card lab-card">
            <b>{name}</b>
          </Link>
        ))}
      </div>
    </div>
  );
}
