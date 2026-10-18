import type { Lesson, Tier, Track } from './types';
import { exercisesOf } from './exercises';
import { foundations } from './foundations';
import { git } from './git';
import { shell } from './shell';
import { dsa } from './dsa';
import { systems, networking, web, devops, architecture } from './overviews';
import { polyglot, ai, career } from './polyglot';
import { LABS } from './labs';
import { databases, methodology } from './core';
import { parseTrackFile } from './lessonFile';
import programmingSrc from './tracks/programming.txt?raw';
import postgresqlSrc from './tracks/postgresql.txt?raw';
import mongodbSrc from './tracks/mongodb.txt?raw';
import mysqlSrc from './tracks/mysql.txt?raw';
import redisSrc from './tracks/redis.txt?raw';

/** Tracks written as plain-text lesson files (see lessonFile.ts). */
export const programming = parseTrackFile(programmingSrc);
export const postgresql = parseTrackFile(postgresqlSrc);
export const mongodb = parseTrackFile(mongodbSrc);
export const mysql = parseTrackFile(mysqlSrc);
export const redis = parseTrackFile(redisSrc);
/** The Python course spans one lesson file per module (tracks/python/NN-*.txt), read in file-name order. */
const pythonFiles = import.meta.glob<string>('./tracks/python/*.txt', { query: '?raw', import: 'default', eager: true });
export const python = parseTrackFile(...Object.keys(pythonFiles).sort().map((f) => pythonFiles[f]));
/** The JavaScript course, likewise one file per module (tracks/javascript/NN-*.txt). */
const javascriptFiles = import.meta.glob<string>('./tracks/javascript/*.txt', { query: '?raw', import: 'default', eager: true });
export const javascript = parseTrackFile(...Object.keys(javascriptFiles).sort().map((f) => javascriptFiles[f]));
/** The Java course (tracks/java/NN-*.txt); programs run on the learner's own JDK in the desktop app. */
const javaFiles = import.meta.glob<string>('./tracks/java/*.txt', { query: '?raw', import: 'default', eager: true });
export const java = parseTrackFile(...Object.keys(javaFiles).sort().map((f) => javaFiles[f]));
/** The Go course (tracks/go/NN-*.txt); programs run on the learner's own Go toolchain in the desktop app. */
const goFiles = import.meta.glob<string>('./tracks/go/*.txt', { query: '?raw', import: 'default', eager: true });
export const go = parseTrackFile(...Object.keys(goFiles).sort().map((f) => goFiles[f]));
/** The C# course (tracks/csharp/NN-*.txt); programs run on the learner's own .NET SDK in the desktop app. */
const csharpFiles = import.meta.glob<string>('./tracks/csharp/*.txt', { query: '?raw', import: 'default', eager: true });
export const csharp = parseTrackFile(...Object.keys(csharpFiles).sort().map((f) => csharpFiles[f]));
/** The SQL course (tracks/sql/NN-*.txt), on PostgreSQL with the sample databases in tracks/sql/datasets. */
const sqlFiles = import.meta.glob<string>('./tracks/sql/*.txt', { query: '?raw', import: 'default', eager: true });
export const sql = parseTrackFile(...Object.keys(sqlFiles).sort().map((f) => sqlFiles[f]));
/** The TypeScript course (tracks/typescript/NN-*.txt). */
const typescriptFiles = import.meta.glob<string>('./tracks/typescript/*.txt', { query: '?raw', import: 'default', eager: true });
export const typescript = parseTrackFile(...Object.keys(typescriptFiles).sort().map((f) => typescriptFiles[f]));
import { SKILL_TRACKS } from './skills';
import { kotlin } from './langs/kotlin';
import { rust } from './langs/rust';
import { c } from './langs/c';
import { cpp } from './langs/cpp';
import { swift } from './langs/swift';
import { dart } from './langs/dart';
import { ruby } from './langs/ruby';
import { php } from './langs/php';
import { r } from './langs/r';
import { lua } from './langs/lua';
import { bash } from './langs/bash';
import { powershell } from './langs/powershell';
import { solidity } from './langs/solidity';

// Classify the original tracks: languages vs core engineering vs specializations
Object.assign(python, { kind: 'language', lang: 'python', fields: ['Backend', 'Data & AI', 'Automation', 'Security'] });
Object.assign(javascript, { kind: 'language', lang: 'javascript', fields: ['Frontend', 'Full-Stack', 'Backend (Node.js)'] });
Object.assign(typescript, { kind: 'language', lang: 'typescript', fields: ['Frontend', 'Full-Stack', 'Backend (Node.js)'] });
Object.assign(java, { kind: 'language', lang: 'java', fields: ['Backend (enterprise)', 'Android', 'Big data'] });
Object.assign(go, { kind: 'language', lang: 'go', fields: ['Backend', 'DevOps & Cloud', 'CLI tools'] });
Object.assign(csharp, { kind: 'language', lang: 'csharp', fields: ['Game dev (Unity)', 'Backend (.NET)', 'Desktop apps'] });
Object.assign(sql, { kind: 'language', lang: 'sql', fields: ['Backend', 'Data', 'Every developer'] });
for (const t of [foundations, shell, git, dsa, systems, networking, web, devops, architecture, career]) t.kind = 'core';
for (const t of [polyglot, ai]) t.kind = 'skill';
polyglot.title = 'Language Tour: Compare Languages';

// Splice the hands-on labs into their tracks, right after the lesson they build on
for (const { track, after, lesson } of LABS) {
  const t = [foundations, python, javascript, shell, git, dsa, systems, networking, web, sql, devops, architecture, polyglot, ai, career].find((x) => x.id === track)!;
  if (t.lessons.some((l) => l.id === lesson.id)) continue;
  const at = t.lessons.findIndex((l) => l.id === after);
  t.lessons.splice(at < 0 ? t.lessons.length : at + 1, 0, lesson);
}

export const TIERS: Tier[] = [
  { tier: 0, name: 'Foundations', subtitle: 'How computers think' },
  { tier: 1, name: 'First Languages', subtitle: 'Learn to code' },
  { tier: 2, name: 'Developer Tools', subtitle: 'Terminal & Git' },
  { tier: 3, name: 'Computer Science', subtitle: 'Algorithms & data structures' },
  { tier: 4, name: 'Systems', subtitle: 'Memory, OS & networks' },
  { tier: 5, name: 'The Web', subtitle: 'Frontend, backend & security' },
  { tier: 6, name: 'Data', subtitle: 'Databases & SQL' },
  { tier: 7, name: 'Operations', subtitle: 'Containers, cloud & CI/CD' },
  { tier: 8, name: 'Architecture', subtitle: 'Designing systems' },
  { tier: 9, name: 'Specializations', subtitle: 'More languages & AI' },
  { tier: 10, name: 'Career', subtitle: 'Become a pro' },
];

export const LANGUAGE_TRACKS: Track[] = [python, javascript, typescript, sql, go, java, csharp, kotlin, swift, dart, rust, c, cpp, php, ruby, r, lua, bash, powershell, solidity];

export const TRACKS: Track[] = [
  foundations, programming, shell, git, dsa, systems, networking, web, databases, postgresql, mysql, mongodb, redis, devops, architecture, methodology, career,
  ...LANGUAGE_TRACKS,
  ...SKILL_TRACKS, ai, polyglot,
];

export const trackById = (id: string) => TRACKS.find((t) => t.id === id);

export function findLesson(lessonId: string): { track: Track; lesson: Lesson; index: number } | null {
  for (const track of TRACKS) {
    const index = track.lessons.findIndex((l) => l.id === lessonId);
    if (index >= 0) return { track, lesson: track.lessons[index], index };
  }
  return null;
}

export const ALL_LESSONS = TRACKS.flatMap((t) => t.lessons.map((l) => ({ track: t, lesson: l })));

export const ALL_CARDS = ALL_LESSONS.flatMap(({ track, lesson }) =>
  (lesson.cards ?? []).map((c, i) => ({ id: `${lesson.id}#${i}`, ...c, track, lesson })),
);

/** Tracks that mix illustrated lessons with some hands-on labs. */
export const hasLabs = (t: Track) => t.lessons.some((l) => exercisesOf(l).some((e) => e.kind !== 'quiz'));

export const trackArt = (id: string) => `./art/track-${id}.webp`;

export const lessonXp = (l: Lesson) => l.xp ?? 40;
