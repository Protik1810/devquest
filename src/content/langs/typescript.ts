import { lesson, langTrack } from './helpers';

export const typescript = langTrack({
  id: 'typescript',
  title: 'TypeScript',
  icon: '🔷',
  color: '#3178c6',
  lang: 'typescript',
  blurb: 'JavaScript with types: catch bugs before running, autocomplete everything. The standard for modern web apps.',
  fields: ['Frontend', 'Full-Stack', 'Backend (Node.js)'],
  lessons: [
    lesson(
      'ts-basics',
      'Types: the basics',
      `
TypeScript is **JavaScript plus a type system**. The compiler checks your types, then removes them, leaving plain JavaScript that runs anywhere.

~~~ts
let title: string = "DevQuest";
let level: number = 3;          // ints and floats are both number
let active: boolean = true;
let tags: string[] = ["web", "ts"];
let pair: [string, number] = ["xp", 120];   // tuple

let score = 10;      // type inference: TS knows this is a number
score = "ten";       // ❌ Error: Type 'string' is not assignable to type 'number'
~~~

**Coming from JavaScript?** Every JS program is valid TS. You add types gradually where they help.

> ℹ️ In DevQuest, TypeScript runs after its types are removed, so type errors don't stop it. In a real project, \`tsc\` or your editor reports them before you run anything.
`,
      {
        prompt: 'Declare `name: string = "Ada"`, `year: number = 1843` and `langs: string[]` containing `"Python"` and `"TS"`. Print `Ada (1843) knows 2 languages`, using the variables.',
        starter: '// declare the typed variables here\n\nconsole.log();\n',
        solution: 'const name: string = "Ada";\nconst year: number = 1843;\nconst langs: string[] = ["Python", "TS"];\n\nconsole.log(`${name} (${year}) knows ${langs.length} languages`);\n',
        expected: 'Ada (1843) knows 2 languages',
        hints: ['Annotate with a colon: const year: number = 1843;', 'Use a template literal with langs.length.'],
      },
      [['Type inference', 'TypeScript works out a variable\'s type from its initial value, so you rarely need to annotate locals.']],
    ),
    lesson(
      'ts-functions',
      'Typed functions',
      `
Annotate **parameters** and the **return type**:

~~~ts
function area(w: number, h: number): number {
  return w * h;
}

const greet = (name: string, excited = false): string =>
  excited ? \`Hi \${name}!\` : \`Hi \${name}\`;

function log(msg: string, level?: "info" | "warn"): void {   // optional + union of literals
  console.log(\`[\${level ?? "info"}] \${msg}\`);
}
~~~

- \`?\` makes a parameter optional (its type becomes \`T | undefined\`).
- \`void\` means "returns nothing useful".
- **Union types** like \`"info" | "warn"\` restrict values to a fixed set. The compiler rejects typos.
`,
      {
        prompt: 'Write `function clamp(value: number, min: number, max: number): number` that limits `value` to the range. Print `clamp(15, 0, 10)`, `clamp(-3, 0, 10)` and `clamp(4, 0, 10)` on separate lines.',
        starter: 'function clamp(value: number, min: number, max: number): number {\n  // your code\n}\n\nconsole.log(clamp(15, 0, 10));\nconsole.log(clamp(-3, 0, 10));\nconsole.log(clamp(4, 0, 10));\n',
        solution: 'function clamp(value: number, min: number, max: number): number {\n  return Math.min(max, Math.max(min, value));\n}\n\nconsole.log(clamp(15, 0, 10));\nconsole.log(clamp(-3, 0, 10));\nconsole.log(clamp(4, 0, 10));\n',
        expected: '10\n0\n4',
        hints: ['Math.max(min, value) raises low values; Math.min(max, …) lowers high ones.'],
      },
      [['Union type', 'A value that can be one of several types or literals, e.g. "info" | "warn" or string | number.']],
    ),
    lesson(
      'ts-objects',
      'Interfaces & object types',
      `
Describe the **shape** of objects with \`type\` or \`interface\`:

~~~ts
interface User {
  id: number;
  name: string;
  email?: string;              // optional
  readonly createdAt: string;  // can't be reassigned
}

type Point = { x: number; y: number };

function describe(u: User): string {
  return \`\${u.name} <\${u.email ?? "no email"}>\`;
}
~~~

Interfaces can **extend** each other: \`interface Admin extends User { permissions: string[] }\`.

**Structural typing:** TS checks the *shape*, not the name. Any object with the right properties fits, which suits JSON from APIs.
`,
      {
        prompt: 'Create `interface Product { name: string; price: number; tags?: string[] }`. Given the `items` array, print the total price, then the names of products tagged `"sale"` joined by `, `.',
        starter: 'interface Product {\n  // define the fields\n}\n\nconst items: Product[] = [\n  { name: "Keyboard", price: 80, tags: ["sale"] },\n  { name: "Mouse", price: 25 },\n  { name: "Monitor", price: 250, tags: ["sale", "new"] },\n];\n\n// print the total, then the sale items\n',
        solution: 'interface Product {\n  name: string;\n  price: number;\n  tags?: string[];\n}\n\nconst items: Product[] = [\n  { name: "Keyboard", price: 80, tags: ["sale"] },\n  { name: "Mouse", price: 25 },\n  { name: "Monitor", price: 250, tags: ["sale", "new"] },\n];\n\nconst total = items.reduce((sum, p) => sum + p.price, 0);\nconsole.log(total);\nconsole.log(items.filter((p) => p.tags?.includes("sale")).map((p) => p.name).join(", "));\n',
        expected: '355\nKeyboard, Monitor',
        hints: ['items.reduce((sum, p) => sum + p.price, 0)', 'Optional chaining: p.tags?.includes("sale")'],
      },
      [['interface vs type', 'Both describe object shapes; interfaces can be extended/merged, type aliases can also name unions and primitives.']],
    ),
    lesson(
      'ts-generics',
      'Generics',
      `
**Generics** let a function or type work with *any* type while staying type-safe. \`T\` is a type parameter:

~~~ts
function first<T>(items: T[]): T | undefined {
  return items[0];
}
first([1, 2, 3]);        // number | undefined
first(["a", "b"]);       // string | undefined

interface ApiResponse<T> {
  ok: boolean;
  data: T;
}
const res: ApiResponse<{ id: number }> = { ok: true, data: { id: 7 } };
~~~

Built-in generics you'll use daily: \`Array<T>\`, \`Promise<T>\`, \`Map<K, V>\`, \`Record<K, V>\`, \`Partial<T>\`, \`Pick<T, K>\`.
`,
      {
        prompt: 'Write a generic `function groupBy<T>(items: T[], key: (item: T) => string): Record<string, T[]>`. Use it to group the words by first letter and print the result with `JSON.stringify`.',
        starter: 'function groupBy<T>(items: T[], key: (item: T) => string): Record<string, T[]> {\n  const out: Record<string, T[]> = {};\n  // your code\n  return out;\n}\n\nconst words = ["apple", "avocado", "banana", "blueberry", "cherry"];\nconsole.log(JSON.stringify(groupBy(words, (w) => w[0])));\n',
        solution: 'function groupBy<T>(items: T[], key: (item: T) => string): Record<string, T[]> {\n  const out: Record<string, T[]> = {};\n  for (const item of items) {\n    const k = key(item);\n    (out[k] ??= []).push(item);\n  }\n  return out;\n}\n\nconst words = ["apple", "avocado", "banana", "blueberry", "cherry"];\nconsole.log(JSON.stringify(groupBy(words, (w) => w[0])));\n',
        expected: '{"a":["apple","avocado"],"b":["banana","blueberry"],"c":["cherry"]}',
        hints: ['Loop over items, compute k = key(item).', '(out[k] ??= []).push(item) creates the array the first time.'],
      },
      [['Generic type parameter', 'A placeholder like <T> that the caller\'s actual type fills in, keeping code reusable and type-safe.']],
    ),
    lesson(
      'ts-narrowing',
      'Unions, narrowing & discriminated unions',
      `
When a value can be several types, **narrow** it with checks. TypeScript understands \`typeof\`, \`in\`, equality and \`instanceof\`:

~~~ts
function len(x: string | string[]): number {
  if (typeof x === "string") return x.length;   // x is string here
  return x.length;                               // x is string[] here
}
~~~

**Discriminated unions** model "one of several shapes" safely, the standard pattern for state and events:

~~~ts
type Shape =
  | { kind: "circle"; r: number }
  | { kind: "rect"; w: number; h: number };

function area(s: Shape): number {
  switch (s.kind) {
    case "circle": return Math.PI * s.r ** 2;
    case "rect":   return s.w * s.h;
  }
}
~~~
`,
      {
        prompt: 'Complete `describe(e: Event)` for the discriminated union: `click` → `click at (x, y)`, `key` → `key Enter`, `scroll` → `scroll 120px`. Print each event in `events`.',
        starter: 'type Event =\n  | { type: "click"; x: number; y: number }\n  | { type: "key"; key: string }\n  | { type: "scroll"; delta: number };\n\nfunction describe(e: Event): string {\n  // switch on e.type\n  return "";\n}\n\nconst events: Event[] = [\n  { type: "click", x: 10, y: 20 },\n  { type: "key", key: "Enter" },\n  { type: "scroll", delta: 120 },\n];\nfor (const e of events) console.log(describe(e));\n',
        solution: 'type Event =\n  | { type: "click"; x: number; y: number }\n  | { type: "key"; key: string }\n  | { type: "scroll"; delta: number };\n\nfunction describe(e: Event): string {\n  switch (e.type) {\n    case "click":\n      return `click at (${e.x}, ${e.y})`;\n    case "key":\n      return `key ${e.key}`;\n    case "scroll":\n      return `scroll ${e.delta}px`;\n  }\n}\n\nconst events: Event[] = [\n  { type: "click", x: 10, y: 20 },\n  { type: "key", key: "Enter" },\n  { type: "scroll", delta: 120 },\n];\nfor (const e of events) console.log(describe(e));\n',
        expected: 'click at (10, 20)\nkey Enter\nscroll 120px',
        hints: ['switch (e.type) { case "click": ... }', 'Inside each case TS knows exactly which fields exist.'],
      },
      [['Discriminated union', 'A union of object types sharing a literal "tag" field (like kind/type) that TypeScript uses to narrow.']],
    ),
    lesson(
      'ts-project',
      '🛠️ Mini project: Typed task store',
      `
Put it together: a small **typed state store** like the ones inside React apps and backends.

You'll use an interface, a union type for status, generics-free classes, and array methods. Typed code like this is easy to refactor: rename a field and the compiler shows every place to update.
`,
      {
        prompt: 'Implement `TaskStore` with `add(title)` (returns the new id, starting at 1), `setStatus(id, status)`, and `summary()` returning a string like `todo: 1, doing: 1, done: 1`. Run the given script.',
        starter: 'type Status = "todo" | "doing" | "done";\n\ninterface Task {\n  id: number;\n  title: string;\n  status: Status;\n}\n\nclass TaskStore {\n  private tasks: Task[] = [];\n\n  add(title: string): number {\n    return 0;\n  }\n\n  setStatus(id: number, status: Status): void {}\n\n  summary(): string {\n    return "";\n  }\n}\n\nconst store = new TaskStore();\nconst a = store.add("Write tests");\nconst b = store.add("Fix bug");\nstore.add("Ship it");\nstore.setStatus(a, "done");\nstore.setStatus(b, "doing");\nconsole.log(store.summary());\n',
        solution: 'type Status = "todo" | "doing" | "done";\n\ninterface Task {\n  id: number;\n  title: string;\n  status: Status;\n}\n\nclass TaskStore {\n  private tasks: Task[] = [];\n\n  add(title: string): number {\n    const task: Task = { id: this.tasks.length + 1, title, status: "todo" };\n    this.tasks.push(task);\n    return task.id;\n  }\n\n  setStatus(id: number, status: Status): void {\n    const task = this.tasks.find((t) => t.id === id);\n    if (task) task.status = status;\n  }\n\n  summary(): string {\n    const statuses: Status[] = ["todo", "doing", "done"];\n    return statuses.map((s) => `${s}: ${this.tasks.filter((t) => t.status === s).length}`).join(", ");\n  }\n}\n\nconst store = new TaskStore();\nconst a = store.add("Write tests");\nconst b = store.add("Fix bug");\nstore.add("Ship it");\nstore.setStatus(a, "done");\nstore.setStatus(b, "doing");\nconsole.log(store.summary());\n',
        expected: 'todo: 1, doing: 1, done: 1',
        hints: ['add: push { id: this.tasks.length + 1, title, status: "todo" }', 'summary: map over ["todo", "doing", "done"] and count matching tasks.'],
      },
      [],
      80,
    ),
  ],
});
