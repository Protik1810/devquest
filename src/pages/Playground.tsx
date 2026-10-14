import { useState } from 'react';
import type { CodeLang } from '../content/types';
import { LANG_META } from '../content/langMeta';
import { execMode, execute, modeLabel, type ExecResult } from '../engine/execute';
import { useTools } from '../engine/localRun';
import { useAIReady } from '../engine/ai';
import { useGame } from '../engine/store';
import { useLessonCtx } from '../engine/lessonCtx';
import { Terminal } from '../components/Terminal';
import { Editor, WebPreview } from '../components/Editor';
import { ResultView } from '../components/ResultView';
import { AIReview } from '../components/AIReview';

const SAMPLES: Record<CodeLang, string> = {
  python: 'def fib(n):\n    a, b = 0, 1\n    for _ in range(n):\n        a, b = b, a + b\n    return a\n\nprint([fib(i) for i in range(10)])\n',
  javascript: 'const words = ["devquest", "is", "fun"];\nconsole.log(words.map(w => w.toUpperCase()).join(" "));\n',
  typescript: 'type Hero = { name: string; level: number };\nconst heroes: Hero[] = [{ name: "Ada", level: 7 }, { name: "Linus", level: 5 }];\nconst best = heroes.reduce((a, b) => (a.level > b.level ? a : b));\nconsole.log(`Top hero: ${best.name}`);\n',
  sql: "CREATE TABLE langs (name TEXT, year INT);\nINSERT INTO langs VALUES ('C', 1972), ('Python', 1991), ('Rust', 2015);\nSELECT * FROM langs WHERE year > 1980 ORDER BY year;\n",
  web: '<!doctype html>\n<html>\n<head>\n<style>\n  body { font-family: system-ui; display: grid; place-items: center; height: 90vh; background: linear-gradient(135deg, #7c5cff, #ec4899); color: white; }\n  button { font-size: 1.2rem; padding: 10px 20px; border-radius: 10px; border: 0; cursor: pointer; }\n</style>\n</head>\n<body>\n  <div>\n    <h1 id="msg">Hello, web!</h1>\n    <button onclick="document.getElementById(\'msg\').textContent = \'You clicked! 🎉\'">Click me</button>\n  </div>\n</body>\n</html>\n',
  lua: 'local scores = { ada = 90, linus = 75 }\nfor name, score in pairs(scores) do\n  print(name .. " scored " .. score)\nend\n',
  postgres: "-- Real PostgreSQL, running inside DevQuest\nCREATE TABLE langs (name text PRIMARY KEY, year int, tags jsonb);\nINSERT INTO langs VALUES\n  ('C', 1972, '[\"systems\"]'),\n  ('Python', 1991, '[\"data\", \"web\"]'),\n  ('Rust', 2015, '[\"systems\", \"web\"]');\n\nSELECT name, year,\n       rank() OVER (ORDER BY year DESC) AS newest,\n       tags ? 'web' AS for_web\nFROM langs;\n",
  mysql: "-- MySQL syntax, running inside DevQuest\nCREATE TABLE langs (\n  id INT AUTO_INCREMENT PRIMARY KEY,\n  name VARCHAR(50) NOT NULL,\n  year SMALLINT UNSIGNED,\n  kind ENUM('compiled', 'interpreted')\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\nINSERT INTO langs (name, year, kind) VALUES ('C', 1972, 'compiled'), ('Python', 1991, 'interpreted'), ('Rust', 2015, 'compiled');\n\nSELECT kind, GROUP_CONCAT(name ORDER BY year SEPARATOR ' → ') AS timeline, COUNT(*) AS n\nFROM langs\nGROUP BY kind;\n",
  redis: "# redis-cli commands, running inside DevQuest\nSET greeting \"Hello, Redis\"\nGET greeting\nINCR visits\nINCR visits\nRPUSH queue job1 job2 job3\nLPOP queue\nZADD leaderboard 120 ada 95 linus 150 grace\nZREVRANGE leaderboard 0 1 WITHSCORES\nSET session:42 active EX 60\nTTL session:42\n",
  mongodb: "// A MongoDB shell, running inside DevQuest\ndb.langs.insertMany([\n  { name: 'C', year: 1972, tags: ['systems'] },\n  { name: 'Python', year: 1991, tags: ['data', 'web'] },\n  { name: 'Rust', year: 2015, tags: ['systems', 'web'] },\n]);\n\ndb.langs.find({ tags: 'web' }, { _id: 0, name: 1, year: 1 }).sort({ year: -1 }).forEach(printjson);\n\nprintjson(db.langs.aggregate([\n  { $unwind: '$tags' },\n  { $group: { _id: '$tags', count: { $sum: 1 } } },\n  { $sort: { count: -1, _id: 1 } },\n]).toArray());\n",
  go: 'package main\n\nimport "fmt"\n\nfunc main() {\n\tfor i := 1; i <= 3; i++ {\n\t\tfmt.Println("Hello from Go", i)\n\t}\n}\n',
  rust: 'fn main() {\n    let langs = vec!["Rust", "is", "fast"];\n    println!("{}", langs.join(" "));\n}\n',
  c: '#include <stdio.h>\n\nint main(void) {\n    for (int i = 1; i <= 3; i++) printf("Hello from C %d\\n", i);\n    return 0;\n}\n',
  cpp: '#include <iostream>\n#include <vector>\n\nint main() {\n    std::vector<int> v{3, 1, 2};\n    int sum = 0;\n    for (int x : v) sum += x;\n    std::cout << "Sum: " << sum << std::endl;\n}\n',
  java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Java " + Runtime.version().feature());\n    }\n}\n',
  kotlin: 'fun main() {\n    val langs = listOf("Kotlin", "Java", "Scala")\n    println(langs.filter { it.length > 4 })\n}\n',
  swift: 'let langs = ["Swift", "Kotlin", "Dart"]\nfor lang in langs where lang.count > 4 {\n    print("I like \\(lang)")\n}\n',
  csharp: 'var nums = new[] { 1, 2, 3, 4, 5 };\nvar evens = nums.Where(n => n % 2 == 0);\nConsole.WriteLine($"Evens: {string.Join(", ", evens)}");\n',
  dart: 'void main() {\n  final langs = ["Dart", "Flutter"];\n  for (final l in langs) {\n    print("Hello from $l");\n  }\n}\n',
  ruby: 'langs = %w[Ruby Rails Sinatra]\nlangs.each_with_index { |l, i| puts "#{i + 1}. #{l}" }\n',
  php: '<?php\n$langs = ["PHP", "Laravel"];\nforeach ($langs as $i => $l) {\n    echo ($i + 1) . ". $l\\n";\n}\n',
  r: 'scores <- c(ada = 90, linus = 75, grace = 88)\nprint(mean(scores))\nprint(names(scores)[scores > 80])\n',
  bash: '#!/usr/bin/env bash\nfor lang in bash zsh fish; do\n  echo "Shell: $lang"\ndone\n',
  powershell: '$langs = "PowerShell", "C#", "Python"\n$langs | ForEach-Object { "Language: $_" }\n',
  solidity: '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.20;\n\ncontract Counter {\n    uint public count;\n\n    function increment() public {\n        count += 1;\n    }\n}\n',
};

const ORDER: CodeLang[] = ['python', 'javascript', 'typescript', 'sql', 'postgres', 'mysql', 'mongodb', 'redis', 'web', 'lua', 'go', 'rust', 'c', 'cpp', 'java', 'kotlin', 'swift', 'csharp', 'dart', 'ruby', 'php', 'r', 'bash', 'powershell', 'solidity'];

export function Playground() {
  const [lang, setLang] = useState<CodeLang | 'shell'>('python');
  const [code, setCode] = useState<Record<CodeLang, string>>(SAMPLES);
  const [result, setResult] = useState<ExecResult | null>(null);
  const [running, setRunning] = useState(false);
  /** Lines typed into input() (Python) */
  const [stdin, setStdin] = useState('');
  const bump = useGame((s) => s.bump);
  const setCtx = useLessonCtx((s) => s.set);
  useTools((s) => s.langs);
  useAIReady();

  const run = async () => {
    if (lang === 'shell') return;
    setRunning(true);
    bump('runs');
    setCtx({ title: `Playground (${LANG_META[lang].label})`, prompt: 'Free experimentation', code: code[lang] });
    try {
      setResult(await execute(lang, code[lang], undefined, '', {}, lang === 'python' ? stdin : undefined));
    } catch (e) {
      setResult({ ok: false, output: '', error: (e as Error).message, mode: execMode(lang) });
    }
    setRunning(false);
  };

  const mode = lang === 'shell' ? null : execMode(lang);
  const label = lang === 'shell' ? null : modeLabel(lang);

  return (
    <div>
      <h1>🧪 Playground</h1>
      <p className="muted">Experiment freely in any of {ORDER.length} languages. Nothing is graded. Ask the 🦉 tutor or get an AI code review whenever you like.</p>
      <div className="row playground-bar">
        <select aria-label="Language" value={lang} onChange={(e) => { const v = e.target.value as CodeLang | 'shell'; setLang(v === 'shell' || ORDER.includes(v) ? v : 'python'); setResult(null); }}>
          {ORDER.map((l) => (
            <option key={l} value={l}>{LANG_META[l].icon} {LANG_META[l].label}</option>
          ))}
          <option value="shell">🐚 Linux terminal (simulated)</option>
        </select>
        {label && <span className={`exec-mode m-${mode}`}>{label.icon} {label.text}</span>}
      </div>
      {lang === 'shell' ? (
        <div className="card">
          <Terminal />
        </div>
      ) : (
        <div className="card">
          <Editor lang={lang} value={code[lang]} onChange={(v) => setCode({ ...code, [lang]: v })} height="340px" onRun={run} />
          {lang === 'web' && <WebPreview code={code.web} height={360} />}
          {lang === 'python' && (
            <label className="stdin-box small">
              ⌨️ Typed input: what a user would type into <code>input()</code>, one line per call
              <textarea rows={2} value={stdin} onChange={(e) => setStdin(e.target.value)} placeholder="e.g. Sam" spellCheck={false} />
            </label>
          )}
          <div className="ex-actions">
            {lang !== 'web' && mode !== 'self' && (
              <button className="primary" onClick={run} disabled={running}>
                {running ? '⏳ Running…' : mode === 'ai' ? '🤖 Predict output with AI' : '▶ Run (Ctrl+Enter)'}
              </button>
            )}
            <button className="ghost" onClick={() => setCode({ ...code, [lang]: SAMPLES[lang] })}>↺ Reset sample</button>
          </div>
          {result && <ResultView result={result} lang={lang} code={code[lang]} />}
          <AIReview key={lang} title="Playground experiment" prompt="Free-form code written in the playground; review it for correctness and style." lang={lang} code={code[lang]} output={result?.error ?? result?.output} />
        </div>
      )}
    </div>
  );
}
