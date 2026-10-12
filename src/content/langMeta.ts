import type { CodeLang } from './types';

/** Display name and icon for every exercise language. */
export const LANG_META: Record<CodeLang, { label: string; icon: string }> = {
  python: { label: 'Python', icon: '🐍' },
  javascript: { label: 'JavaScript', icon: '🟨' },
  typescript: { label: 'TypeScript', icon: '🔷' },
  sql: { label: 'SQL (SQLite)', icon: '🗄️' },
  web: { label: 'HTML · CSS · JS', icon: '🌐' },
  lua: { label: 'Lua', icon: '🌙' },
  postgres: { label: 'PostgreSQL', icon: '🐘' },
  mongodb: { label: 'MongoDB', icon: '🍃' },
  mysql: { label: 'MySQL', icon: '🐬' },
  redis: { label: 'Redis', icon: '🟥' },
  go: { label: 'Go', icon: '🐹' },
  rust: { label: 'Rust', icon: '🦀' },
  c: { label: 'C', icon: '🔧' },
  cpp: { label: 'C++', icon: '➕' },
  java: { label: 'Java', icon: '☕' },
  kotlin: { label: 'Kotlin', icon: '🟧' },
  swift: { label: 'Swift', icon: '🐦' },
  csharp: { label: 'C#', icon: '🟪' },
  dart: { label: 'Dart', icon: '🎯' },
  ruby: { label: 'Ruby', icon: '💎' },
  php: { label: 'PHP', icon: '🐘' },
  r: { label: 'R', icon: '📈' },
  bash: { label: 'Bash', icon: '🐚' },
  powershell: { label: 'PowerShell', icon: '🪟' },
  solidity: { label: 'Solidity', icon: '⛓️' },
};

export const langLabel = (l: CodeLang) => `${LANG_META[l].icon} ${LANG_META[l].label}`;
