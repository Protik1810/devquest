import type { Track } from './types';

export const javascript: Track = {
  id: 'javascript',
  title: 'JavaScript & TypeScript',
  icon: '🟨',
  tier: 1,
  color: '#eab308',
  blurb: 'The language of the web: values, functions, arrays, objects, async and the event loop, then TypeScript.',
  depth: 'full',
  lessons: [
    {
      id: 'js-basics',
      title: 'JavaScript basics',
      xp: 35,
      body: `
JavaScript runs in **every browser**, on servers (**Node.js**, Deno, Bun), in desktop apps (Electron, which runs this app!) and mobile apps (React Native).

~~~js
console.log("Hello!");        // print
const name = "Ada";           // can't be reassigned
let level = 1;                // can be reassigned
level += 1;
// var is the old way: avoid it (function-scoped, hoisting surprises)

typeof 42;          // "number" (ints & floats are both number)
typeof "hi";        // "string"
typeof true;        // "boolean"
typeof undefined;   // "undefined"
typeof null;        // "object"  ← a famous historical bug!

\`\${name} is level \${level}\`;   // template literal
~~~

⚠️ Always use **strict equality** \`===\`. The loose \`==\` converts types: \`"5" == 5\` is \`true\`, \`0 == ""\` is \`true\` 😱.
`,
      exercise: {
        kind: 'code',
        lang: 'javascript',
        prompt: 'Declare a `const` named `hero` with value `"Grace"` and a `let` named `xp` = 100. Add 50 to `xp`, then log exactly: `Grace has 150 XP` using a template literal.',
        starter: '// your code\n',
        solution: 'const hero = "Grace";\nlet xp = 100;\nxp += 50;\nconsole.log(`${hero} has ${xp} XP`);\n',
        hints: ['let xp = 100; xp += 50;', 'console.log(`${hero} has ${xp} XP`)'],
        check: { type: 'stdout', expected: 'Grace has 150 XP' },
      },
      cards: [
        { front: 'const vs let', back: 'const cannot be reassigned; let can. Both are block-scoped.' },
        { front: '=== vs ==', back: '=== compares without type conversion. Always prefer ===.' },
      ],
    },
    {
      id: 'js-functions',
      title: 'Functions, arrows & closures',
      xp: 45,
      body: `
~~~js
function add(a, b) { return a + b; }          // declaration
const mul = (a, b) => a * b;                   // arrow function
const square = x => x * x;                     // one param, implicit return
const greet = (name = "friend") => \`Hi \${name}\`; // default param
~~~

**Closures**: a function remembers the variables from where it was *created*, even after that outer function returns:

~~~js
function makeCounter() {
  let count = 0;
  return () => ++count;
}
const next = makeCounter();
next(); // 1
next(); // 2   ← count lives on, privately, inside the closure
~~~

Closures power callbacks, event handlers, React hooks and data privacy.
`,
      exercise: {
        kind: 'code',
        lang: 'javascript',
        prompt: 'Write `makeMultiplier(n)` that returns a function which multiplies its argument by `n`. Example: `makeMultiplier(3)(5)` → `15`.',
        starter: 'function makeMultiplier(n) {\n  // return a function\n}\n',
        solution: 'function makeMultiplier(n) {\n  return (x) => x * n;\n}\n',
        hints: ['Return an arrow function: return (x) => ...', 'The inner function can use n because of the closure.'],
        check: {
          type: 'tests',
          code: 'const t = makeMultiplier(3);\nif (t(5) !== 15) throw new Error("makeMultiplier(3)(5) should be 15");\nif (makeMultiplier(0)(9) !== 0) throw new Error("makeMultiplier(0)(9) should be 0");\nif (makeMultiplier(-2)(4) !== -8) throw new Error("makeMultiplier(-2)(4) should be -8");',
        },
      },
      cards: [{ front: 'Closure', back: 'A function bundled with the variables of the scope where it was created.' }],
    },
    {
      id: 'js-arrays',
      title: 'Arrays & objects',
      xp: 45,
      body: `
~~~js
const nums = [1, 2, 3, 4];
nums.push(5);                          // add to end
nums.map(n => n * 2);                  // [2, 4, 6, 8, 10]
nums.filter(n => n % 2 === 0);         // [2, 4]
nums.reduce((sum, n) => sum + n, 0);   // 15
nums.find(n => n > 2);                 // 3
nums.includes(3);                      // true

const user = { name: "Ada", langs: ["JS", "Python"] };
user.name;                  // "Ada"
user["age"] = 36;
const { name, age } = user; // destructuring
const copy = { ...user, age: 37 };  // spread: shallow copy + override
Object.keys(user);          // ["name", "langs", "age"]
JSON.stringify(user);       // to JSON text
JSON.parse('{"a":1}');      // from JSON text
~~~

\`map\`/\`filter\`/\`reduce\` return **new** arrays and don't mutate the original. Prefer them over manual loops for readable data transformations.
`,
      exercise: {
        kind: 'code',
        lang: 'javascript',
        prompt: 'Write `totalByCategory(items)` that takes `[{category, price}]` and returns an object mapping each category to the sum of its prices.',
        starter: 'function totalByCategory(items) {\n  // hint: reduce\n}\n',
        solution: 'function totalByCategory(items) {\n  return items.reduce((acc, { category, price }) => {\n    acc[category] = (acc[category] ?? 0) + price;\n    return acc;\n  }, {});\n}\n',
        hints: ['Start with an empty object accumulator: items.reduce((acc, item) => ..., {})', 'acc[item.category] = (acc[item.category] ?? 0) + item.price; return acc;'],
        check: {
          type: 'tests',
          code: 'const r = totalByCategory([{category:"food",price:5},{category:"tech",price:100},{category:"food",price:7}]);\nif (JSON.stringify(r) !== JSON.stringify({food:12,tech:100})) throw new Error("got " + JSON.stringify(r));\nif (JSON.stringify(totalByCategory([])) !== "{}") throw new Error("empty input should give {}");',
        },
      },
      cards: [{ front: 'map / filter / reduce', back: 'Transform each item / keep matching items / fold into one value.' }],
    },
    {
      id: 'js-async',
      title: 'Async JavaScript & the event loop',
      xp: 55,
      body: `
JavaScript is **single-threaded**: one call stack. So how does it wait for network requests without freezing? The **event loop**.

{{ill:eventloop}}

1. Slow work (timers, network, file I/O) is handed to the browser/Node **runtime**.
2. When it finishes, its callback is put in a **queue**.
3. Whenever the call stack is empty, the event loop moves the next callback onto the stack.

**Promises** represent a value that will arrive later; **async/await** makes them read like normal code:

~~~js
async function loadUser(id) {
  try {
    const res = await fetch(\`https://api.example.com/users/\${id}\`);
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
    return await res.json();
  } catch (err) {
    console.error("Failed:", err.message);
  }
}

// run several in parallel:
const [a, b] = await Promise.all([loadUser(1), loadUser(2)]);
~~~

Quiz yourself: what does this print?

~~~js
console.log("A");
setTimeout(() => console.log("B"), 0);
Promise.resolve().then(() => console.log("C"));
console.log("D");
~~~
*Answer: A D C B. Promise callbacks (**microtasks**) run before timers (**macrotasks**).*
`,
      exercise: {
        kind: 'code',
        lang: 'javascript',
        prompt: 'Write an `async` function `fetchAll(ids, fetcher)` that calls the async `fetcher(id)` for every id **in parallel** and returns the array of results in the same order.',
        starter: 'async function fetchAll(ids, fetcher) {\n  // your code\n}\n',
        solution: 'async function fetchAll(ids, fetcher) {\n  return Promise.all(ids.map((id) => fetcher(id)));\n}\n',
        hints: ['ids.map(fetcher) gives you an array of promises.', 'Promise.all(arrayOfPromises) resolves to an array of results in order.'],
        check: {
          type: 'tests',
          code: 'const fake = (id) => new Promise(r => setTimeout(() => r("user" + id), (5 - id) * 20));\nconst t0 = Date.now();\nconst out = await fetchAll([1, 2, 3], fake);\nif (JSON.stringify(out) !== JSON.stringify(["user1","user2","user3"])) throw new Error("got " + JSON.stringify(out));\nif (Date.now() - t0 > 150) throw new Error("too slow: did you run them one after another instead of in parallel?");',
        },
      },
      cards: [
        { front: 'Event loop', back: 'Moves queued callbacks onto the call stack whenever the stack is empty.' },
        { front: 'Microtask vs macrotask', back: 'Promise callbacks (microtasks) run before setTimeout callbacks (macrotasks).' },
      ],
    },
    {
      id: 'js-ts',
      title: 'TypeScript: JavaScript with types',
      xp: 45,
      body: `
**TypeScript** adds static types to JavaScript. The compiler catches bugs *before* you run the code, and your editor gets great autocompletion. It compiles to plain JS. This app is written in TypeScript!

~~~ts
let level: number = 5;
const names: string[] = ["Ada", "Linus"];

type User = {
  id: number;
  name: string;
  email?: string;           // optional
  role: "admin" | "user";   // union of literal types
};

function greet(user: User): string {
  return \`Hello \${user.name}\`;
}

greet({ id: 1, name: "Ada", role: "guest" });
//                          ~~~~ Error: '"guest"' is not assignable to '"admin" | "user"'

// Generics: reusable, type-safe code
function first<T>(items: T[]): T | undefined {
  return items[0];
}
~~~

Key ideas: **type inference** (TS figures out most types itself), **interfaces/types** describe object shapes, **unions** (\`A | B\`) and **narrowing** (\`if (typeof x === "string")\`), **generics** (\`<T>\`).
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'When does TypeScript report type errors?', options: ['At run time in the browser', 'At compile time, before running', 'Never', 'Only in production'], answer: 1 },
          { q: 'What does `email?: string` mean?', options: ['email is required', 'email is optional', 'email can be any type', 'email is private'], answer: 1 },
          { q: 'What do browsers actually run?', options: ['TypeScript directly', 'JavaScript compiled from TS', 'Java bytecode', 'Python'], answer: 1 },
          { q: '`function first<T>(items: T[]): T` is an example of…', options: ['A union', 'A generic', 'An enum', 'A decorator'], answer: 1 },
        ],
      },
      cards: [{ front: 'Generic <T>', back: 'A type parameter: lets a function or type work with any type while staying type-safe.' }],
    },
  ],
};

export const git: Track = {
  id: 'git',
  title: 'Git & Version Control',
  icon: '🌿',
  tier: 2,
  color: '#f97316',
  blurb: 'Commits, branches, merging, remotes and pull requests: how teams collaborate on code.',
  depth: 'full',
  lessons: [
    {
      id: 'git-basics',
      title: 'Commits: snapshots of your project',
      xp: 40,
      body: `
**Git** records the history of your project as a series of **commits**, each a snapshot with a message, author, timestamp and a unique **hash** (like \`a1b2c3d\`).

Files move through three areas:

{{ill:gitareas}}

~~~bash
git init                       # start a repo
git status                     # what changed?
git add main.py                # stage a file   (git add . = everything)
git commit -m "Add login form" # snapshot the staged changes
git log --oneline              # history
git diff                       # unstaged changes, line by line
git restore file.py            # discard local changes to a file
~~~

**Good commit messages** use the imperative mood and explain *why*: \`Fix crash when cart is empty\`, not \`stuff\`.

\`.gitignore\` lists files Git should never track: \`node_modules/\`, \`.env\` (secrets!), build output.
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'Which command moves changes into the staging area?', options: ['git commit', 'git add', 'git push', 'git stage-all'], answer: 1 },
          { q: 'What uniquely identifies a commit?', options: ['Its message', 'Its hash', 'The date', 'The branch name'], answer: 1 },
          { q: 'Where should .env files with secrets go?', options: ['Commit them', 'In .gitignore', 'In the README', 'In the commit message'], answer: 1 },
        ],
      },
      cards: [{ front: 'Git three areas', back: 'Working directory → (git add) → staging area → (git commit) → repository' }],
    },
    {
      id: 'git-branches',
      title: 'Branches & merging',
      xp: 45,
      body: `
A **branch** is just a movable pointer to a commit. Branches let you work on a feature without disturbing \`main\`.

{{ill:gitgraph}}

~~~bash
git switch -c feature/login    # create & switch to a branch
# ...commit work...
git switch main
git merge feature/login        # bring the work into main
git branch -d feature/login    # delete the merged branch
~~~

**Merge conflicts** happen when both branches changed the same lines. Git marks them:

~~~
<<<<<<< HEAD
color = "blue"
=======
color = "green"
>>>>>>> feature/theme
~~~
Edit the file to the version you want, remove the markers, then \`git add\` + \`git commit\`.

**Rebase** (\`git rebase main\`) replays your commits on top of another branch for a linear history. ⚠️ Never rebase commits you've already shared with others.
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'What is a branch in Git?', options: ['A full copy of the repo', 'A movable pointer to a commit', 'A folder', 'A remote server'], answer: 1 },
          { q: 'Create and switch to a new branch called fix:', options: ['git branch fix --go', 'git switch -c fix', 'git new fix', 'git checkout fix --create'], answer: 1 },
          { q: 'A merge conflict means…', options: ['Git crashed', 'Both branches changed the same lines', 'The branch was deleted', 'You need to push'], answer: 1 },
        ],
      },
      cards: [{ front: 'Merge vs rebase', back: 'Merge joins histories with a merge commit; rebase replays commits on top for a linear history.' }],
    },
    {
      id: 'git-remote',
      title: 'Remotes, GitHub & pull requests',
      xp: 45,
      body: `
A **remote** is a copy of the repo on a server (GitHub, GitLab, Bitbucket). \`origin\` is the default name.

~~~bash
git clone https://github.com/user/repo.git
git remote -v                  # list remotes
git push -u origin feature/x   # upload your branch
git pull                       # fetch + merge others' changes
git fetch                      # download without merging
~~~

**The team workflow (GitHub flow):**
1. Pull the latest \`main\`
2. Create a branch for your change
3. Commit in small steps, push the branch
4. Open a **pull request (PR)**: teammates review, CI runs tests
5. Address feedback, then **merge** to main → deploy

**Lifesavers:**
- \`git stash\` / \`git stash pop\`: shelve unfinished work temporarily
- \`git log --graph --oneline --all\`: visualize branches
- \`git reflog\`: find "lost" commits after a bad reset
- \`git bisect\`: binary-search the history to find which commit introduced a bug
- \`git revert <hash>\`: safely undo a commit by adding a new inverse commit
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'What does `git pull` do?', options: ['Uploads commits', 'Fetches and merges remote changes', 'Deletes a branch', 'Creates a PR'], answer: 1 },
          { q: 'Temporarily shelve uncommitted changes:', options: ['git stash', 'git save', 'git hide', 'git park'], answer: 0 },
          { q: 'Safely undo a commit that is already pushed:', options: ['git reset --hard', 'git revert <hash>', 'Delete the repo', 'git rm'], answer: 1 },
          { q: 'Which tool binary-searches history to find a bug?', options: ['git blame', 'git bisect', 'git grep', 'git log'], answer: 1 },
        ],
      },
      cards: [
        { front: 'git fetch vs git pull', back: 'fetch downloads remote commits; pull = fetch + merge.' },
        { front: 'git revert', back: 'Creates a new commit that undoes a previous one. Safe for shared history.' },
      ],
    },
  ],
};
