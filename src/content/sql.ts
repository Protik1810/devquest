import type { Track } from './types';

const SHOP_DB = `
CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, country TEXT, age INTEGER);
CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER, product TEXT, amount REAL);
INSERT INTO users VALUES (1,'Ada','UK',36),(2,'Linus','FI',28),(3,'Grace','US',45),(4,'Alan','UK',41),(5,'Margaret','US',33);
INSERT INTO orders VALUES (1,1,'Keyboard',80),(2,1,'Monitor',250),(3,2,'Mouse',25),(4,3,'Laptop',1200),(5,3,'Mouse',25),(6,3,'Desk',300),(7,5,'Chair',150);
`;

const tableNote = `
**Tables in this lesson's database:**

\`users(id, name, country, age)\`: Ada (UK, 36), Linus (FI, 28), Grace (US, 45), Alan (UK, 41), Margaret (US, 33)

\`orders(id, user_id, product, amount)\`: 7 orders. Alan has none.
`;

export const sql: Track = {
  id: 'sql',
  title: 'SQL & Databases',
  icon: '🗄️',
  tier: 6,
  color: '#06b6d4',
  blurb: 'Query real databases: SELECT, WHERE, JOIN, GROUP BY, indexes, transactions and NoSQL.',
  depth: 'full',
  lessons: [
    {
      id: 'sql-intro',
      title: 'Relational databases & SELECT',
      xp: 40,
      body: `
A **relational database** (PostgreSQL, MySQL, SQLite, SQL Server) stores data in **tables**: rows are records, columns are fields. Every row has a unique **primary key**. **SQL** (Structured Query Language) is how you ask questions.

~~~sql
SELECT name, age FROM users;           -- some columns
SELECT * FROM users;                   -- all columns
SELECT name AS person FROM users;      -- rename a column
SELECT DISTINCT country FROM users;    -- unique values
~~~

SQL is **declarative**: you describe *what* you want, and the database's **query planner** figures out *how* to get it.
${tableNote}`,
      exercise: {
        kind: 'code',
        lang: 'sql',
        prompt: 'Select the `name` and `country` of every user.',
        starter: '-- write your query\n',
        solution: 'SELECT name, country FROM users;',
        hints: ['SELECT column1, column2 FROM table;'],
        check: { type: 'sql', setup: SHOP_DB, expected: 'SELECT name, country FROM users;' },
      },
      cards: [{ front: 'Primary key', back: 'A column (or set) that uniquely identifies each row.' }],
    },
    {
      id: 'sql-where',
      title: 'Filtering & sorting: WHERE, ORDER BY, LIMIT',
      xp: 45,
      body: `
~~~sql
SELECT * FROM users WHERE age > 30;
SELECT * FROM users WHERE country = 'UK' AND age < 40;
SELECT * FROM users WHERE country IN ('US', 'FI');
SELECT * FROM users WHERE name LIKE 'A%';      -- starts with A
SELECT * FROM users WHERE age BETWEEN 30 AND 40;
SELECT * FROM users WHERE email IS NULL;

SELECT * FROM users ORDER BY age DESC;          -- sort
SELECT * FROM users ORDER BY age LIMIT 3;       -- first 3
~~~

Strings use **single quotes**. \`NULL\` means "unknown", so you must use \`IS NULL\`, not \`= NULL\`.
${tableNote}`,
      exercise: {
        kind: 'code',
        lang: 'sql',
        prompt: 'Return the `name` and `age` of users **older than 30**, oldest first.',
        starter: 'SELECT\n',
        solution: 'SELECT name, age FROM users WHERE age > 30 ORDER BY age DESC;',
        hints: ['Filter with WHERE age > 30', 'Sort with ORDER BY age DESC'],
        check: { type: 'sql', setup: SHOP_DB, expected: 'SELECT name, age FROM users WHERE age > 30 ORDER BY age DESC;', ordered: true },
      },
      cards: [{ front: 'Testing for NULL in SQL', back: 'Use IS NULL / IS NOT NULL (never = NULL).' }],
    },
    {
      id: 'sql-agg',
      title: 'Aggregates & GROUP BY',
      xp: 50,
      body: `
**Aggregate functions** summarize many rows into one: \`COUNT\`, \`SUM\`, \`AVG\`, \`MIN\`, \`MAX\`.

~~~sql
SELECT COUNT(*) FROM orders;                  -- 7
SELECT AVG(amount) FROM orders;

SELECT country, COUNT(*) AS people            -- one row per group
FROM users
GROUP BY country;

SELECT user_id, SUM(amount) AS spent
FROM orders
GROUP BY user_id
HAVING SUM(amount) > 100;                     -- filter groups
~~~

**WHERE** filters rows *before* grouping; **HAVING** filters groups *after*.

Logical order of a query: \`FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT\`.
${tableNote}`,
      exercise: {
        kind: 'code',
        lang: 'sql',
        prompt: 'For each `product`, return the product name and how many times it was ordered (column name `times`).',
        starter: 'SELECT\n',
        solution: 'SELECT product, COUNT(*) AS times FROM orders GROUP BY product;',
        hints: ['GROUP BY product', 'SELECT product, COUNT(*) AS times ...'],
        check: { type: 'sql', setup: SHOP_DB, expected: 'SELECT product, COUNT(*) AS times FROM orders GROUP BY product;' },
      },
      cards: [{ front: 'WHERE vs HAVING', back: 'WHERE filters rows before grouping; HAVING filters groups after aggregation.' }],
    },
    {
      id: 'sql-join',
      title: 'JOINs: combining tables',
      xp: 55,
      body: `
Data is split across tables to avoid duplication (**normalization**). \`orders.user_id\` is a **foreign key** pointing to \`users.id\`. **JOIN** stitches them back together.

{{ill:join}}

~~~sql
-- INNER JOIN: only rows with a match on both sides
SELECT users.name, orders.product
FROM users
JOIN orders ON orders.user_id = users.id;

-- LEFT JOIN: every user, with NULLs where there's no order
SELECT u.name, o.product
FROM users u
LEFT JOIN orders o ON o.user_id = u.id;
~~~

| Join | Keeps |
|---|---|
| INNER | only matches |
| LEFT | all left rows + matches |
| RIGHT | all right rows + matches |
| FULL OUTER | everything |
${tableNote}`,
      exercise: {
        kind: 'code',
        lang: 'sql',
        prompt: 'Return each user\'s `name` and their total spending as `total`, **including users with no orders** (their total should be NULL or 0). Order doesn\'t matter.',
        starter: 'SELECT u.name, SUM(o.amount) AS total\nFROM users u\n',
        solution: 'SELECT u.name, SUM(o.amount) AS total\nFROM users u\nLEFT JOIN orders o ON o.user_id = u.id\nGROUP BY u.id;',
        hints: ['You need a LEFT JOIN so Alan (no orders) still appears.', 'LEFT JOIN orders o ON o.user_id = u.id GROUP BY u.id'],
        check: { type: 'sql', setup: SHOP_DB, expected: 'SELECT u.name, SUM(o.amount) AS total FROM users u LEFT JOIN orders o ON o.user_id = u.id GROUP BY u.id;' },
      },
      cards: [
        { front: 'Foreign key', back: 'A column that references the primary key of another table.' },
        { front: 'LEFT JOIN', back: 'All rows from the left table, plus matching right rows (NULL when none).' },
      ],
    },
    {
      id: 'sql-write',
      title: 'Changing data: INSERT, UPDATE, DELETE',
      xp: 45,
      body: `
~~~sql
INSERT INTO users (name, country, age) VALUES ('Ken', 'US', 30);
UPDATE users SET age = age + 1 WHERE name = 'Ada';
DELETE FROM orders WHERE amount < 30;

CREATE TABLE posts (
  id INTEGER PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  title TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
~~~

⚠️ \`UPDATE\` or \`DELETE\` **without WHERE** affects **every row**. Classic production disaster!

**Transactions** group changes so they all succeed or all fail:

~~~sql
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;   -- or ROLLBACK;
~~~

Transactions guarantee **ACID**: **A**tomicity (all or nothing), **C**onsistency (rules hold), **I**solation (concurrent transactions don't interfere), **D**urability (committed = saved, even after a crash).

🔐 **Never build SQL by gluing strings with user input.** That's how **SQL injection** happens. Always use **parameterized queries**: \`cursor.execute("SELECT * FROM users WHERE name = ?", (name,))\`.
${tableNote}`,
      exercise: {
        kind: 'code',
        lang: 'sql',
        prompt: 'Give every **UK** user a birthday (age + 1), then select `name, age` of all users.',
        starter: 'UPDATE users\n\n;\nSELECT name, age FROM users;',
        solution: "UPDATE users SET age = age + 1 WHERE country = 'UK';\nSELECT name, age FROM users;",
        hints: ['UPDATE users SET age = age + 1 WHERE ...', "WHERE country = 'UK' (single quotes!)"],
        check: { type: 'sql', setup: SHOP_DB, expected: "UPDATE users SET age = age + 1 WHERE country = 'UK'; SELECT name, age FROM users;" },
      },
      cards: [
        { front: 'ACID', back: 'Atomicity, Consistency, Isolation, Durability' },
        { front: 'Prevent SQL injection', back: 'Use parameterized queries / prepared statements, never string concatenation.' },
      ],
    },
    {
      id: 'sql-indexes',
      title: 'Indexes, NoSQL & choosing a database',
      xp: 45,
      body: `
**Indexes** make reads fast. Without one, \`WHERE email = 'x'\` scans every row (O(n)). An index (usually a **B-tree**) keeps a sorted structure pointing to rows, so lookups take O(log n).

~~~sql
CREATE INDEX idx_users_email ON users(email);
EXPLAIN QUERY PLAN SELECT * FROM users WHERE email = 'a@b.c';
~~~

Trade-off: indexes speed up reads but **slow down writes** and use disk space. Index the columns you filter, join and sort on.

**NoSQL databases** relax the relational model for specific needs:

| Type | Examples | Great for |
|---|---|---|
| Document | MongoDB, Firestore | flexible JSON-like records |
| Key-value | Redis, DynamoDB | caching, sessions, ultra-fast lookups |
| Wide-column | Cassandra, ScyllaDB | massive write-heavy scale |
| Graph | Neo4j | relationships (social, recommendations) |
| Search | Elasticsearch, OpenSearch | full-text search, logs |
| Vector | pgvector, Pinecone | AI embeddings / semantic search |

**Default choice:** start with **PostgreSQL**. It's relational, rock-solid, and handles JSON, full-text search and vectors via extensions. Reach for others when you have a specific problem.
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'What data structure do most database indexes use?', options: ['Linked list', 'B-tree', 'Stack', 'Queue'], answer: 1 },
          { q: 'A downside of adding many indexes is…', options: ['Slower reads', 'Slower writes and more storage', 'Data loss', 'No more JOINs'], answer: 1 },
          { q: 'Best fit for caching session data?', options: ['Neo4j', 'Redis', 'Cassandra', 'CSV files'], answer: 1 },
          { q: 'Storing AI embeddings for similarity search needs a…', options: ['Vector database', 'Spreadsheet', 'Graph DB only', 'Message queue'], answer: 0 },
        ],
      },
      cards: [{ front: 'Index trade-off', back: 'Faster reads, slower writes, more storage.' }],
    },
  ],
};
