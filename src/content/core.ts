import type { Track } from './types';

const SHOP_FLAT = `
CREATE TABLE orders_flat (order_id INTEGER, customer_id INTEGER, customer_name TEXT, customer_city TEXT, product TEXT, price REAL);
INSERT INTO orders_flat VALUES
 (1, 10, 'Ada', 'London', 'Keyboard', 80),
 (2, 10, 'Ada', 'London', 'Mouse', 25),
 (3, 11, 'Linus', 'Helsinki', 'Laptop', 1200),
 (4, 12, 'Grace', 'New York', 'Monitor', 250),
 (5, 11, 'Linus', 'Helsinki', 'Mouse', 25);
`;

const USERS_DB = `
CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT, name TEXT, country TEXT);
INSERT INTO users (email, name, country) VALUES ('ada@x.dev','Ada','UK'),('linus@x.dev','Linus','FI'),('grace@x.dev','Grace','US');
`;

export const databases: Track = {
  id: 'databases',
  title: 'Database Systems',
  icon: '🏛️',
  tier: 6,
  color: '#0891b2',
  kind: 'core',
  blurb: 'How databases really work: normalisation, indexes and B-trees, transactions and isolation, NoSQL modelling, and building your own store.',
  depth: 'full',
  lessons: [
    {
      id: 'db-normal',
      title: 'Data modelling & normalisation',
      xp: 50,
      body: `
Good schemas store **each fact exactly once**. Duplicated data drifts out of sync, which causes *update anomalies*.

Here's a "flat" table that mixes customers and orders:

| order_id | customer_id | customer_name | customer_city | product |
|---|---|---|---|---|
| 1 | 10 | Ada | London | Keyboard |
| 2 | 10 | Ada | London | Mouse |

If Ada moves city, we must update many rows; miss one and the data contradicts itself.

**Normal forms** (the practical summary):
- **1NF**: atomic values, no repeating groups (no "tags: a,b,c" columns).
- **2NF**: every non-key column depends on the *whole* key.
- **3NF**: non-key columns depend *only* on the key, not on other non-key columns (\`customer_city\` depends on \`customer_id\`, not on the order).

So we split into \`customers(id, name, city)\` and \`orders(id, customer_id, product, price)\`, linked by a **foreign key**.

**Entity-Relationship (ER) modelling:** entities (Customer, Order, Product), relationships (one-to-many, many-to-many via a join table), and cardinalities. Analytics databases sometimes **denormalise on purpose** (star schemas) to make reads fast.
`,
      exercise: {
        kind: 'code',
        lang: 'sql',
        prompt: 'Extract the **customers** entity from the flat table: one row per customer with `customer_id`, `customer_name`, `customer_city`, ordered by `customer_id`.',
        starter: 'SELECT\n',
        solution: 'SELECT DISTINCT customer_id, customer_name, customer_city FROM orders_flat ORDER BY customer_id;',
        hints: ['SELECT DISTINCT removes duplicate rows.', 'ORDER BY customer_id'],
        check: { type: 'sql', setup: SHOP_FLAT, expected: 'SELECT DISTINCT customer_id, customer_name, customer_city FROM orders_flat ORDER BY customer_id;', ordered: true },
      },
      cards: [
        { front: 'Third normal form (3NF)', back: 'Every non-key column depends on the key, the whole key, and nothing but the key.' },
        { front: 'Update anomaly', back: 'The same fact stored in many rows gets updated in some but not others, so the data contradicts itself.' },
      ],
    },
    {
      id: 'db-indexes',
      title: 'Indexes, B-trees & query plans',
      xp: 55,
      body: `
Without an index, \`WHERE email = ?\` must read **every row** (a *full table scan*, O(n)). An index is a separate sorted structure, almost always a **B-tree**, that finds rows in O(log n):

{{ill:hashmap}}

A **B-tree** is a balanced tree where each node holds *many* keys (hundreds), matching disk pages. A billion rows need only ~4 levels, so ~4 disk reads per lookup.

Ask the database how it will run a query:

~~~sql
EXPLAIN QUERY PLAN SELECT * FROM users WHERE email = 'ada@x.dev';
-- SCAN users                                           ← no index: reads everything
CREATE INDEX idx_users_email ON users(email);
-- SEARCH users USING INDEX idx_users_email (email=?)   ← index lookup
~~~

**Trade-offs:** every index speeds up reads on its columns but **slows down writes** (it must be updated too) and uses storage. **Composite indexes** \`(country, name)\` help queries filtering by \`country\`, or by \`country\` *and* \`name\` (leftmost-prefix rule), but not by \`name\` alone.
`,
      exercise: {
        kind: 'code',
        lang: 'sql',
        prompt: 'Create an index named `idx_users_email` on `users(email)`, then run `EXPLAIN QUERY PLAN SELECT name FROM users WHERE email = \'ada@x.dev\';` so the plan shows an index **SEARCH** instead of a **SCAN**.',
        starter: "EXPLAIN QUERY PLAN SELECT name FROM users WHERE email = 'ada@x.dev';\n",
        solution: "CREATE INDEX idx_users_email ON users(email);\nEXPLAIN QUERY PLAN SELECT name FROM users WHERE email = 'ada@x.dev';",
        hints: ['CREATE INDEX idx_users_email ON users(email);', 'Put the CREATE INDEX before the EXPLAIN.'],
        check: { type: 'sql', setup: USERS_DB, expected: "CREATE INDEX idx_users_email ON users(email); EXPLAIN QUERY PLAN SELECT name FROM users WHERE email = 'ada@x.dev';" },
      },
      cards: [
        { front: 'Why B-trees for indexes?', back: 'Balanced, sorted, with many keys per node, so very few disk reads per lookup; also supports range scans.' },
        { front: 'Leftmost-prefix rule', back: 'A composite index (a, b) helps filters on a, or a and b, but not on b alone.' },
      ],
    },
    {
      id: 'db-transactions',
      title: 'Transactions, ACID & isolation',
      xp: 60,
      body: `
A **transaction** groups operations so they succeed or fail together. Databases guarantee **ACID**:

| | Meaning |
|---|---|
| **Atomicity** | all or nothing: a failure rolls back every change |
| **Consistency** | constraints (foreign keys, CHECKs) always hold |
| **Isolation** | concurrent transactions don't see each other's half-done work |
| **Durability** | once committed, data survives crashes (write-ahead log) |

**Isolation levels** trade correctness for concurrency:

| Level | Prevents |
|---|---|
| Read uncommitted | nothing |
| Read committed (Postgres default) | dirty reads |
| Repeatable read | + non-repeatable reads |
| Serializable | + phantoms: behaves as if transactions ran one at a time |

The classic bug is the **lost update**: two requests read \`stock = 5\`, both write \`4\`, and one sale vanishes. Fix it with a transaction plus \`UPDATE … SET stock = stock - 1 WHERE stock > 0\` (atomic), or row locks (\`SELECT … FOR UPDATE\`).
`,
      exercise: {
        kind: 'code',
        lang: 'python',
        prompt: 'Using Python\'s built-in `sqlite3`, implement `transfer(conn, src, dst, amount)` that moves money **atomically**: if `src` lacks funds, raise `ValueError("insufficient funds")` and leave both balances unchanged. Use `with conn:` (commits on success, rolls back on exceptions).',
        starter: 'import sqlite3\n\ndef setup():\n    conn = sqlite3.connect(":memory:")\n    conn.execute("CREATE TABLE accounts (id TEXT PRIMARY KEY, balance INTEGER)")\n    conn.executemany("INSERT INTO accounts VALUES (?, ?)", [("ada", 100), ("bob", 50)])\n    conn.commit()\n    return conn\n\ndef transfer(conn, src, dst, amount):\n    pass\n\ndef balance(conn, who):\n    return conn.execute("SELECT balance FROM accounts WHERE id = ?", (who,)).fetchone()[0]\n',
        solution: 'import sqlite3\n\ndef setup():\n    conn = sqlite3.connect(":memory:")\n    conn.execute("CREATE TABLE accounts (id TEXT PRIMARY KEY, balance INTEGER)")\n    conn.executemany("INSERT INTO accounts VALUES (?, ?)", [("ada", 100), ("bob", 50)])\n    conn.commit()\n    return conn\n\ndef transfer(conn, src, dst, amount):\n    with conn:\n        conn.execute("UPDATE accounts SET balance = balance + ? WHERE id = ?", (amount, dst))\n        (bal,) = conn.execute("SELECT balance FROM accounts WHERE id = ?", (src,)).fetchone()\n        if bal < amount:\n            raise ValueError("insufficient funds")\n        conn.execute("UPDATE accounts SET balance = balance - ? WHERE id = ?", (amount, src))\n\ndef balance(conn, who):\n    return conn.execute("SELECT balance FROM accounts WHERE id = ?", (who,)).fetchone()[0]\n',
        hints: ['with conn: … starts a transaction that commits on success and rolls back if an exception escapes.', 'Raise ValueError inside the with block so the partial update is rolled back.'],
        check: {
          type: 'tests',
          code: 'c = setup()\ntransfer(c, "ada", "bob", 30)\nassert (balance(c, "ada"), balance(c, "bob")) == (70, 80), (balance(c, "ada"), balance(c, "bob"))\ntry:\n    transfer(c, "bob", "ada", 500)\n    assert False, "expected ValueError"\nexcept ValueError:\n    pass\nassert (balance(c, "ada"), balance(c, "bob")) == (70, 80), "a failed transfer must not change any balance (atomicity)"\n',
        },
      },
      cards: [
        { front: 'ACID', back: 'Atomicity, Consistency, Isolation, Durability' },
        { front: 'Lost update', back: 'Two transactions read the same value and both write back, so one change silently disappears.' },
      ],
    },
    {
      id: 'db-nosql',
      title: 'NoSQL, CAP & choosing a data model',
      xp: 50,
      body: `
Relational databases aren't the only option. Each **NoSQL** family models data differently:

| Model | Shape | Examples | Great for |
|---|---|---|---|
| Document | nested JSON documents | MongoDB, Firestore, CouchDB | flexible records read as a whole (profiles, products) |
| Key-value | key → blob | Redis, DynamoDB | caching, sessions, counters |
| Wide-column | rows with dynamic columns, partitioned | Cassandra, ScyllaDB, Bigtable | huge write volumes, time series |
| Graph | nodes + edges | Neo4j, Neptune | relationships (social graphs, fraud) |
| Search | inverted index | Elasticsearch, OpenSearch | full-text search, logs |
| Vector | embeddings | pgvector, Pinecone, Qdrant | semantic search, RAG |

**Document modelling rule:** *design for your queries*. Embed data that's read together (an order with its line items); reference data that's shared or unbounded (users ↔ orders).

**CAP theorem:** during a network partition, a distributed database chooses **Consistency** (refuse some requests) or **Availability** (answer with possibly stale data). Many NoSQL systems offer **eventual consistency** for availability and scale.
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'You store blog posts that are always read with their comments, and comments are small and bounded. In a document DB you should…', options: ['Put every comment in a separate collection and join', 'Embed comments inside the post document', 'Use a graph database', 'Store comments in Redis only'], answer: 1, explain: 'Data read together and bounded in size is a good candidate for embedding.' },
          { q: 'Best fit for "people you may know" recommendations?', options: ['Key-value store', 'Graph database', 'Spreadsheet', 'Wide-column store'], answer: 1 },
          { q: 'Under a network partition, an AP system will…', options: ['Refuse all writes', 'Keep answering, possibly with stale data', 'Lose data permanently', 'Switch to SQL'], answer: 1 },
          { q: 'Session tokens with expiry and very fast lookups:', options: ['Neo4j', 'Redis', 'Elasticsearch', 'A CSV file'], answer: 1 },
          { q: 'Semantic search over AI embeddings needs a…', options: ['Vector index', 'B-tree on text', 'Message queue', 'Graph only'], answer: 0 },
        ],
      },
      cards: [{ front: 'Eventual consistency', back: 'Replicas may disagree briefly but converge to the same value if no new writes arrive.' }],
    },
    {
      id: 'db-kvstore',
      title: '🛠️ Build a key-value store with a write-ahead log',
      xp: 90,
      body: `
How do databases survive crashes? Before changing data, they append the change to a **write-ahead log (WAL)**. After a crash, they **replay the log** to rebuild the state. Postgres, SQLite, Kafka and Redis (AOF) all use this idea.

Build a tiny KV store where:
- every \`set\`/\`delete\` is first appended to \`self.log\` (a list standing in for a file),
- \`recover(log)\` rebuilds the data by replaying the log,
- \`compact()\` rewrites the log to the minimal set of operations (otherwise logs grow forever).
`,
      exercise: {
        kind: 'code',
        lang: 'python',
        prompt: 'Implement `KVStore` with `set(key, value)`, `get(key, default=None)`, `delete(key)`, `recover(log)` (class method returning a new store) and `compact()`. Each log entry is a tuple: `("set", key, value)` or `("del", key)`.',
        starter: 'class KVStore:\n    def __init__(self):\n        self.data = {}\n        self.log = []\n\n    def set(self, key, value):\n        pass\n\n    def get(self, key, default=None):\n        pass\n\n    def delete(self, key):\n        pass\n\n    @classmethod\n    def recover(cls, log):\n        pass\n\n    def compact(self):\n        pass\n',
        solution: 'class KVStore:\n    def __init__(self):\n        self.data = {}\n        self.log = []\n\n    def _apply(self, entry):\n        if entry[0] == "set":\n            self.data[entry[1]] = entry[2]\n        else:\n            self.data.pop(entry[1], None)\n\n    def set(self, key, value):\n        entry = ("set", key, value)\n        self.log.append(entry)\n        self._apply(entry)\n\n    def get(self, key, default=None):\n        return self.data.get(key, default)\n\n    def delete(self, key):\n        entry = ("del", key)\n        self.log.append(entry)\n        self._apply(entry)\n\n    @classmethod\n    def recover(cls, log):\n        store = cls()\n        for entry in log:\n            store.log.append(entry)\n            store._apply(entry)\n        return store\n\n    def compact(self):\n        self.log = [("set", k, v) for k, v in self.data.items()]\n',
        hints: ['Write the log entry FIRST, then apply it to self.data.', 'recover: create a store and replay each entry in order.', 'compact: the current data as a list of ("set", k, v) entries.'],
        check: {
          type: 'tests',
          code: 's = KVStore()\ns.set("a", 1); s.set("b", 2); s.set("a", 3); s.delete("b"); s.set("c", 4)\nassert s.get("a") == 3 and s.get("b") is None and s.get("c") == 4\nassert s.get("zzz", "none") == "none"\nassert len(s.log) == 5, f"every write must be logged, got {len(s.log)} entries"\nr = KVStore.recover(list(s.log))\nassert r.data == {"a": 3, "c": 4}, f"recovery should rebuild the data, got {r.data}"\ns.compact()\nassert sorted(s.log) == [("set", "a", 3), ("set", "c", 4)], s.log\nassert KVStore.recover(s.log).data == s.data\n',
        },
      },
      cards: [{ front: 'Write-ahead log (WAL)', back: 'Changes are appended to a durable log before being applied; replaying the log recovers state after a crash.' }],
    },
  ],
};

export const methodology: Track = {
  id: 'methodology',
  title: 'Software Engineering Practice',
  icon: '🧭',
  tier: 8,
  color: '#16a34a',
  kind: 'core',
  blurb: 'How professional teams build software: SDLC, Agile & Scrum, requirements, testing, debugging, code review, design patterns and documentation.',
  depth: 'full',
  lessons: [
    {
      id: 'se-sdlc',
      title: 'The software development lifecycle & Agile',
      xp: 45,
      body: `
Every project moves through the same stages, the **SDLC**: *requirements → design → implementation → testing → deployment → maintenance*. Methodologies differ in how they sequence them.

| | Waterfall | Agile |
|---|---|---|
| Flow | each phase once, in order | short cycles repeating all phases |
| Change | expensive late | expected and welcomed |
| Feedback | at the end | every iteration (1–4 weeks) |
| Good for | fixed, well-known requirements (regulated, hardware) | most software products |

**Scrum** (the most common Agile framework):
- **Roles:** Product Owner (what & why, owns the backlog), Scrum Master (process coach), Developers (how).
- **Events:** Sprint (1–4 weeks), Sprint Planning, Daily Scrum (15 min), Sprint Review (demo), Retrospective (improve the process).
- **Artifacts:** Product Backlog, Sprint Backlog, Increment (working software).

**Kanban:** continuous flow on a board (To do → Doing → Done) with **WIP limits** to avoid juggling too much at once.

**DevOps culture** extends Agile to operations: automate builds, tests and deployments, and measure (DORA metrics: deployment frequency, lead time, change failure rate, time to restore).
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'Who decides the order of items in the Product Backlog?', options: ['Scrum Master', 'Product Owner', 'The newest developer', 'The CEO, every day'], answer: 1 },
          { q: 'What is the purpose of a Sprint Retrospective?', options: ['Demo features to customers', 'Improve how the team works', 'Assign blame for bugs', 'Write documentation'], answer: 1 },
          { q: 'A Kanban WIP limit of 3 on "In progress" means…', options: ['Only 3 tasks per sprint', 'No more than 3 tasks in progress at once', '3 developers maximum', 'Tasks take 3 days'], answer: 1 },
          { q: 'Waterfall is most suitable when…', options: ['Requirements change weekly', 'Requirements are fixed and well understood', 'You need fast feedback', 'Building a startup MVP'], answer: 1 },
          { q: 'Which is a DORA metric?', options: ['Lines of code per day', 'Deployment frequency', 'Number of meetings', 'Story points per developer'], answer: 1 },
        ],
      },
      cards: [
        { front: 'Scrum events', back: 'Sprint, Sprint Planning, Daily Scrum, Sprint Review, Sprint Retrospective.' },
        { front: 'WIP limit', back: 'Kanban cap on items in a column, which forces finishing work before starting more.' },
      ],
    },
    {
      id: 'se-requirements',
      title: 'Requirements, user stories & estimation',
      xp: 45,
      body: `
Most failed projects fail on **unclear requirements**, not code.

**User stories** describe value from a user's view:
> *As a* **returning customer**, *I want* **to save my card**, *so that* **checkout is faster**.

**Acceptance criteria** make a story testable, often written as *Given / When / Then*:
> Given I'm logged in with a saved card, when I check out, then the card is pre-selected.

**INVEST** checklist for good stories: Independent, Negotiable, Valuable, Estimable, Small, Testable.

**Functional vs non-functional requirements:** *what* the system does (send a password reset email) vs *how well* (responds in < 300 ms, 99.9% uptime, GDPR compliant).

**Estimation:** teams estimate relative size (story points, T-shirt sizes) rather than hours, because relative comparisons are more accurate. *Planning poker* surfaces disagreement early. **Definition of Done** (tests pass, reviewed, documented, deployed to staging) keeps "done" honest.
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'Which is a non-functional requirement?', options: ['Users can reset their password', 'The search page loads in under 1 second', 'Admins can ban users', 'Orders can be cancelled'], answer: 1 },
          { q: 'What makes a user story "Testable"?', options: ['It mentions a programming language', 'It has clear acceptance criteria', 'It is written by a tester', 'It takes one day'], answer: 1 },
          { q: 'Why estimate in relative story points?', options: ['Managers like points', 'People compare sizes more accurately than they predict hours', 'Points are required by law', 'Hours are illegal in Scrum'], answer: 1 },
          { q: '"Given a full cart, when I apply code SAVE10, then the total drops 10%" is…', options: ['A user story', 'An acceptance criterion', 'A bug report', 'A sprint goal'], answer: 1 },
        ],
      },
      cards: [{ front: 'INVEST', back: 'Good user stories are Independent, Negotiable, Valuable, Estimable, Small, Testable.' }],
    },
    {
      id: 'se-testing',
      title: '🛠️ Testing: write tests that catch bugs',
      xp: 70,
      body: `
A test is only useful if it **fails when the code is wrong**. Good tests cover:
- the **happy path** (normal input),
- **edge cases** (empty, zero, boundaries like exactly 100),
- **error cases** (invalid input raises).

**Test types:** unit (one function, fast), integration (components together, e.g. API + DB), end-to-end (the real UI). Aim for many unit tests, fewer integration, few E2E: the **testing pyramid**.

**TDD** (test-driven development): write a failing test → make it pass → refactor.

In this exercise *you* are the tester. DevQuest will run your test against a correct \`discount\` function (it must pass) and against **three buggy versions** (it must catch every bug). The rules:
- orders of 100 or more get 10% off,
- negative totals raise \`ValueError\`,
- the result is rounded to 2 decimals.
`,
      exercise: {
        kind: 'code',
        lang: 'python',
        prompt: 'Write `test_discount(discount)` using `assert` statements that checks the rules above. It receives the function to test as a parameter.',
        starter: 'def test_discount(discount):\n    # call discount(...) and assert on the results\n    assert discount(50) == 50\n',
        solution: 'def test_discount(discount):\n    assert discount(50) == 50\n    assert discount(99.99) == 99.99\n    assert discount(100) == 90\n    assert discount(250) == 225\n    assert discount(123.45) == 111.11\n    try:\n        discount(-1)\n        assert False, "negative totals must raise"\n    except ValueError:\n        pass\n',
        hints: ['Test the boundary: exactly 100 should get the discount.', 'Check rounding with a value like 123.45 (10% off → 111.105 → 111.11).', 'Use try/except ValueError to check the error case, and fail if no error happens.'],
        check: {
          type: 'tests',
          code: 'def correct(total):\n    if total < 0:\n        raise ValueError("negative")\n    return round(total * 0.9, 2) if total >= 100 else total\n\ndef bug_boundary(total):\n    if total < 0:\n        raise ValueError("negative")\n    return round(total * 0.9, 2) if total > 100 else total\n\ndef bug_no_error(total):\n    return round(total * 0.9, 2) if total >= 100 else total\n\ndef bug_no_round(total):\n    if total < 0:\n        raise ValueError("negative")\n    return total * 0.9 if total >= 100 else total\n\ntry:\n    test_discount(correct)\nexcept AssertionError as e:\n    raise AssertionError(f"your test fails on the CORRECT function: {e}")\nfor name, bad in [("discount at exactly 100", bug_boundary), ("negative totals raise ValueError", bug_no_error), ("rounding to 2 decimals", bug_no_round)]:\n    caught = False\n    try:\n        test_discount(bad)\n    except Exception:\n        caught = True\n    assert caught, f"your test did not catch a bug in: {name}"\n',
        },
      },
      cards: [
        { front: 'Testing pyramid', back: 'Many fast unit tests, fewer integration tests, few slow end-to-end tests.' },
        { front: 'What makes a test valuable?', back: 'It fails when the behaviour is wrong (including edge cases), and passes when it is right.' },
      ],
    },
    {
      id: 'se-debugging',
      title: '🛠️ Debugging systematically',
      xp: 60,
      body: `
Debugging is a **scientific method**, not guessing:
1. **Reproduce** the bug reliably (smallest input that fails).
2. **Read the error**: the message and stack trace usually point at the line.
3. **Form a hypothesis** ("the list is empty here"), then **test it** with a print, a log, a debugger breakpoint or an assertion.
4. **Fix the root cause**, not the symptom.
5. **Add a regression test** so the bug never returns.

Tools: debuggers (breakpoints, stepping, watching variables), logging, \`git bisect\` (binary-search the commit that introduced a bug), and rubber-duck explanations.

The function below has **three bugs**. The tests describe the correct behaviour. Find and fix them.
`,
      exercise: {
        kind: 'code',
        lang: 'python',
        prompt: '`average_scores(records)` should return a dict mapping each student to their average score (rounded to 1 decimal), skipping records whose score is `None`. Fix the three bugs.',
        starter: 'def average_scores(records):\n    totals = {}\n    counts = {}\n    for name, score in records:\n        totals[name] = totals.get(name, 0) + score\n        counts[name] = counts.get(name, 1) + 1\n    return {name: round(totals[name] / counts[name]) for name in totals}\n',
        solution: 'def average_scores(records):\n    totals = {}\n    counts = {}\n    for name, score in records:\n        if score is None:\n            continue\n        totals[name] = totals.get(name, 0) + score\n        counts[name] = counts.get(name, 0) + 1\n    return {name: round(totals[name] / counts[name], 1) for name in totals}\n',
        hints: ['Bug 1: None scores crash the addition. Skip them.', 'Bug 2: look at the starting value for counts.get(name, …).', 'Bug 3: round(x) rounds to a whole number; you need one decimal.'],
        check: {
          type: 'tests',
          code: 'r = average_scores([("ada", 90), ("bob", 70), ("ada", 85), ("bob", None), ("ada", 80)])\nassert r == {"ada": 85.0, "bob": 70.0}, r\nassert average_scores([("cy", 7), ("cy", 8)]) == {"cy": 7.5}, average_scores([("cy", 7), ("cy", 8)])\nassert average_scores([]) == {}\n',
        },
      },
      cards: [{ front: 'Regression test', back: 'A test added when fixing a bug, so the same bug is caught if it ever comes back.' }],
    },
    {
      id: 'se-review',
      title: 'Clean code, refactoring & code review',
      xp: 60,
      body: `
**Refactoring** improves structure *without changing behaviour*, safely, because tests prove nothing broke.

Common **code smells** and fixes:

| Smell | Refactoring |
|---|---|
| Long function doing many things | Extract function |
| Duplicated code | Extract and reuse |
| Magic numbers (\`0.2\`, \`86400\`) | Named constants |
| Deep nesting | Guard clauses / early return |
| Long parameter lists | Group into an object |
| Unclear names (\`d\`, \`tmp2\`) | Rename to intent (\`days_overdue\`) |

**Code review** checklist: correctness and edge cases · tests · readability and naming · security (input validation, secrets) · performance only where it matters · consistent style. Be kind and specific: comment on the code, not the person, and suggest instead of command.

Refactor the shipping function below. The tests check the behaviour stays identical. The AI review will judge readability.
`,
      exercise: {
        kind: 'code',
        lang: 'python',
        prompt: 'Refactor `shipping_cost` with a guard clause and named constants (define at least `EXPRESS_MULTIPLIER` and `INTERNATIONAL_BASE_FEE`) without changing its behaviour. Then click **🤖 Get AI code review** to compare readability.',
        starter: 'def shipping_cost(weight, country, express):\n    if weight > 0:\n        if country == "US":\n            if express:\n                return round(5 + weight * 1.5 * 2, 2)\n            else:\n                return round(5 + weight * 1.5, 2)\n        else:\n            if express:\n                return round(15 + weight * 3 * 2, 2)\n            else:\n                return round(15 + weight * 3, 2)\n    else:\n        raise ValueError("weight must be positive")\n',
        solution: 'BASE_FEE = {"US": 5}\nPER_KG = {"US": 1.5}\nINTERNATIONAL_BASE_FEE = 15\nINTERNATIONAL_PER_KG = 3\nEXPRESS_MULTIPLIER = 2\n\n\ndef shipping_cost(weight, country, express):\n    if weight <= 0:\n        raise ValueError("weight must be positive")\n    base = BASE_FEE.get(country, INTERNATIONAL_BASE_FEE)\n    per_kg = PER_KG.get(country, INTERNATIONAL_PER_KG)\n    multiplier = EXPRESS_MULTIPLIER if express else 1\n    return round(base + weight * per_kg * multiplier, 2)\n',
        hints: ['Start with a guard clause: if weight <= 0: raise …', 'Express only doubles the per-kg part: base + weight * rate * multiplier.'],
        check: {
          type: 'tests',
          code: 'assert EXPRESS_MULTIPLIER == 2 and INTERNATIONAL_BASE_FEE == 15, "define the named constants EXPRESS_MULTIPLIER and INTERNATIONAL_BASE_FEE"\ncases = [(2, "US", False, 8.0), (2, "US", True, 11.0), (2, "FR", False, 21.0), (2, "FR", True, 27.0), (0.5, "US", False, 5.75), (3.3, "JP", True, 34.8)]\nfor w, c, e, want in cases:\n    got = shipping_cost(w, c, e)\n    assert got == want, f"shipping_cost({w}, {c!r}, {e}) = {got}, expected {want}"\nfor bad in (0, -1):\n    try:\n        shipping_cost(bad, "US", False)\n        assert False, "expected ValueError"\n    except ValueError:\n        pass\n',
        },
      },
      cards: [{ front: 'Guard clause', back: 'Handle invalid/special cases first and return/raise early, keeping the main path un-nested.' }],
    },
    {
      id: 'se-patterns',
      title: '🛠️ Design patterns in practice',
      xp: 70,
      body: `
Design patterns are named, reusable solutions. Two you'll use constantly:

**Strategy:** swap an algorithm at runtime behind one interface (payment methods, pricing rules, sorting):

~~~python
class PercentOff:
    def __init__(self, pct): self.pct = pct
    def apply(self, total): return total * (1 - self.pct / 100)
~~~

**Observer:** subscribers get notified when something happens (UI events, webhooks, React state, message queues):

~~~python
class EventBus:
    def __init__(self): self.subs = {}
    def subscribe(self, event, fn): self.subs.setdefault(event, []).append(fn)
    def publish(self, event, data): [fn(data) for fn in self.subs.get(event, [])]
~~~

Others worth knowing: Factory, Adapter, Decorator, Repository, Dependency Injection.
`,
      exercise: {
        kind: 'code',
        lang: 'python',
        prompt: 'Implement pricing **strategies** `NoDiscount`, `PercentOff(pct)` and `BuyXGetYFree(x, y)` (each has `apply(prices) -> total`), and an `Order` that accepts a strategy and **notifies observers** with the final total when `checkout()` is called.',
        starter: 'class NoDiscount:\n    def apply(self, prices):\n        pass\n\nclass PercentOff:\n    def __init__(self, pct):\n        pass\n    def apply(self, prices):\n        pass\n\nclass BuyXGetYFree:\n    """For every x+y items, the y cheapest in that group are free (sort prices descending, then group)."""\n    def __init__(self, x, y):\n        pass\n    def apply(self, prices):\n        pass\n\nclass Order:\n    def __init__(self, prices, strategy):\n        pass\n    def subscribe(self, fn):\n        pass\n    def checkout(self):\n        pass\n',
        solution: 'class NoDiscount:\n    def apply(self, prices):\n        return round(sum(prices), 2)\n\nclass PercentOff:\n    def __init__(self, pct):\n        self.pct = pct\n    def apply(self, prices):\n        return round(sum(prices) * (1 - self.pct / 100), 2)\n\nclass BuyXGetYFree:\n    """For every x+y items, the y cheapest in that group are free (sort prices descending, then group)."""\n    def __init__(self, x, y):\n        self.x, self.y = x, y\n    def apply(self, prices):\n        ordered = sorted(prices, reverse=True)\n        group = self.x + self.y\n        total = 0\n        for i, p in enumerate(ordered):\n            if i % group < self.x:\n                total += p\n        return round(total, 2)\n\nclass Order:\n    def __init__(self, prices, strategy):\n        self.prices = prices\n        self.strategy = strategy\n        self.observers = []\n    def subscribe(self, fn):\n        self.observers.append(fn)\n    def checkout(self):\n        total = self.strategy.apply(self.prices)\n        for fn in self.observers:\n            fn(total)\n        return total\n',
        hints: ['Each strategy just needs an apply(prices) method: that is the shared interface.', 'BuyXGetYFree: sort descending; within each group of x+y, the first x are paid.', 'Order.checkout computes the total with the strategy, then calls every observer.'],
        check: {
          type: 'tests',
          code: 'p = [10, 20, 30, 40]\nassert NoDiscount().apply(p) == 100\nassert PercentOff(25).apply(p) == 75\nassert BuyXGetYFree(2, 1).apply([10, 20, 30, 40, 50, 60]) == 160, BuyXGetYFree(2, 1).apply([10, 20, 30, 40, 50, 60])\nassert BuyXGetYFree(1, 1).apply([5, 5, 5]) == 10\nseen = []\no = Order(p, PercentOff(10))\no.subscribe(seen.append)\no.subscribe(lambda t: seen.append(f"email:{t:g}"))\nassert o.checkout() == 90\nassert seen == [90, "email:90"], seen\no.strategy = NoDiscount()\nassert o.checkout() == 100, "strategies must be swappable at runtime"\n',
        },
      },
      cards: [
        { front: 'Strategy pattern', back: 'Interchangeable algorithms behind one interface, selected at runtime.' },
        { front: 'Observer pattern', back: 'Subjects keep a list of subscribers and notify them of events.' },
      ],
    },
    {
      id: 'se-collab',
      title: 'Version control workflow, docs & releases',
      xp: 45,
      body: `
How teams ship together without chaos:

**Branching strategies**
- **Trunk-based development:** small branches merged to \`main\` daily, hidden behind *feature flags*. Used by most high-performing teams.
- **GitHub flow:** branch → PR → review → merge → deploy.
- **Git flow:** long-lived \`develop\`/\`release\` branches (heavier; for versioned products).

**Commit messages:** imperative mood, explain *why* (\`Fix race in cart checkout\`). *Conventional commits* (\`feat:\`, \`fix:\`, \`docs:\`) enable automatic changelogs.

**Semantic versioning** \`MAJOR.MINOR.PATCH\`: breaking change → major, new feature → minor, bug fix → patch.

**Documentation that gets read:** a README (what, why, how to run), architecture decision records (*ADRs*: why we chose Postgres), API docs generated from code (OpenAPI), and runbooks for on-call.

**Continuous Integration:** every push builds and tests automatically; \`main\` stays always releasable.
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'Your library adds a new optional parameter without breaking existing code. Version 2.3.1 becomes…', options: ['3.0.0', '2.4.0', '2.3.2', '2.3.1-new'], answer: 1 },
          { q: 'Which commit message is best?', options: ['stuff', 'Fixed', 'Fix crash when the cart is empty', 'final final v2'], answer: 2 },
          { q: 'Feature flags let you…', options: ['Skip code review', 'Merge unfinished features safely, turned off', 'Avoid writing tests', 'Delete branches'], answer: 1 },
          { q: 'An ADR records…', options: ['Daily standup notes', 'Why an architectural decision was made', 'API keys', 'Test results'], answer: 1 },
        ],
      },
      cards: [{ front: 'Semantic versioning', back: 'MAJOR (breaking) . MINOR (new features, compatible) . PATCH (bug fixes).' }],
    },
  ],
};
