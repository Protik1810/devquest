import type { ProjectGrade } from '../engine/ai';
import { Ring } from './Ring';

const gradeColor = (s: number) => (s >= 85 ? 'var(--good)' : s >= 65 ? 'var(--warn)' : 'var(--bad)');

export function GradeReport({ grade }: { grade: ProjectGrade }) {
  return (
    <div className="grade-report">
      <div className="row">
        <Ring pct={grade.score / 100} size={86} color={gradeColor(grade.score)} label={grade.letter} />
        <div className="grow">
          <div className="big">{grade.score}/100</div>
          <div className="small">{grade.summary}</div>
          <div className="muted small">
            Graded {new Date(grade.at).toLocaleString()} · {grade.model}
          </div>
        </div>
      </div>
      {grade.tests && (
        <div className={`feedback ${grade.tests.passed ? 'ok' : 'bad'} small`}>
          {grade.tests.passed ? '✅ Automated tests passed' : `❌ Automated tests failed: ${grade.tests.message}`}
          {!grade.tests.passed && ' (score capped at 70 until the tests pass)'}
        </div>
      )}
      <div className="criteria">
        {grade.criteria.map((c) => (
          <div key={c.criterion} className="criterion">
            <div className="row">
              <b className="grow">{c.criterion}</b>
              <span className="small">
                {c.score}/{c.max}
              </span>
            </div>
            <div className="qbar">
              <div style={{ width: `${(c.score / c.max) * 100}%`, background: gradeColor((c.score / c.max) * 100) }} />
            </div>
            <div className="muted small">{c.comment}</div>
          </div>
        ))}
      </div>
      <div className="grid-2 tight">
        {grade.strengths.length > 0 && (
          <div>
            <b className="small">👍 Strengths</b>
            <ul className="small">{grade.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
          </div>
        )}
        {grade.improvements.length > 0 && (
          <div>
            <b className="small">🎯 Next improvements</b>
            <ul className="small">{grade.improvements.map((s, i) => <li key={i}>{s}</li>)}</ul>
          </div>
        )}
      </div>
    </div>
  );
}
