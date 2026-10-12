import type { Project, Rubric } from './types';

const rubric = (functionality: string, extra: [string, number, string][] = []): Rubric[] => {
  const base: Rubric[] = [
    { criterion: 'Functionality', points: 40, description: functionality },
    { criterion: 'Code quality', points: 25, description: 'Clear names, small focused functions, no duplicated logic, helpful comments where needed.' },
    { criterion: 'Edge cases & robustness', points: 20, description: 'Handles empty input, invalid values and boundary conditions gracefully.' },
  ];
  const rest = extra.length ? extra.map(([criterion, points, description]) => ({ criterion, points, description })) : [{ criterion: 'Design', points: 15, description: 'Sensible structure that would be easy to extend.' }];
  return [...base, ...rest];
};

export const PROJECTS: Project[] = [
  // ---------- Beginner ----------
  {
    id: 'guess-game',
    title: 'Number Guessing Game',
    emoji: '🎲',
    level: 'Beginner',
    lang: 'python',
    tracks: ['python'],
    xp: 150,
    brief: `Build the logic for a classic **"guess the number"** game. The computer picks a secret number; the player guesses and gets hints until they find it.

Because the browser can't wait for keyboard input, your game logic is written as **functions** that take the guesses as data. That's how real games are built too: the logic is separate from the input/output, which makes it testable.`,
    requirements: [
      '`check_guess(secret, guess)` returns `"too low"`, `"too high"` or `"correct"`.',
      '`play(secret, guesses)` checks each guess in order and returns the number of attempts it took to win, or `-1` if no guess was correct.',
      '`score(attempts)` returns `100` for a first-try win, minus 10 per extra attempt, never below `10`; it returns `0` for a loss (`-1`).',
      'Print a short demo game at the bottom using your functions.',
    ],
    rubric: rubric('All three functions behave as specified for normal and boundary inputs.'),
    starter: `def check_guess(secret, guess):
    """Return "too low", "too high" or "correct"."""
    pass


def play(secret, guesses):
    """Return how many attempts it took to guess the secret, or -1."""
    pass


def score(attempts):
    """100 for a first-try win, -10 per extra attempt, minimum 10. 0 for a loss."""
    pass


# Demo
if __name__ == "__main__":
    secret = 42
    guesses = [50, 25, 37, 42]
    for g in guesses:
        print(g, check_guess(secret, g))
    print("Score:", score(play(secret, guesses)))
`,
    tests: `assert check_guess(10, 5) == "too low"
assert check_guess(10, 15) == "too high"
assert check_guess(10, 10) == "correct"
assert play(42, [50, 25, 42]) == 3, play(42, [50, 25, 42])
assert play(7, [7]) == 1
assert play(7, [1, 2, 3]) == -1
assert play(7, []) == -1
assert score(1) == 100 and score(3) == 80 and score(50) == 10 and score(-1) == 0, (score(1), score(3), score(50), score(-1))
`,
    hints: ['play: loop with enumerate(guesses, start=1) and return the count when check_guess says "correct".', 'score: max(10, 100 - 10 * (attempts - 1)), but handle -1 first.'],
    solution: `def check_guess(secret, guess):
    if guess < secret:
        return "too low"
    if guess > secret:
        return "too high"
    return "correct"


def play(secret, guesses):
    for attempt, guess in enumerate(guesses, start=1):
        if check_guess(secret, guess) == "correct":
            return attempt
    return -1


def score(attempts):
    if attempts < 1:
        return 0
    return max(10, 100 - 10 * (attempts - 1))


if __name__ == "__main__":
    secret = 42
    guesses = [50, 25, 37, 42]
    for g in guesses:
        print(g, check_guess(secret, g))
    print("Score:", score(play(secret, guesses)))
`,
  },
  {
    id: 'todo-manager',
    title: 'To-Do List Manager',
    emoji: '✅',
    level: 'Beginner',
    lang: 'python',
    tracks: ['python'],
    xp: 160,
    brief: `Every developer builds a to-do app. Yours is a **class** that manages tasks with priorities.

You'll practise lists, dictionaries, classes and validation, the bread and butter of backend code.`,
    requirements: [
      '`TodoList.add(title, priority="medium")` adds a task and returns its integer id (ids start at 1 and increase). Priority must be `"low"`, `"medium"` or `"high"`, otherwise raise `ValueError`. Empty titles raise `ValueError`.',
      '`complete(task_id)` marks a task done; unknown ids raise `KeyError`.',
      '`remove(task_id)` deletes a task; unknown ids raise `KeyError`.',
      '`pending()` returns titles of unfinished tasks sorted by priority (high → low), then by id.',
      '`progress()` returns the percentage of completed tasks as an int (0 if there are no tasks).',
    ],
    rubric: rubric('All methods work, including ordering and percentage.', [['OOP design', 15, 'State is kept inside the class; methods are cohesive and reuse each other.']]),
    starter: `class TodoList:
    PRIORITIES = {"high": 0, "medium": 1, "low": 2}

    def __init__(self):
        self.tasks = {}   # id -> {"title": ..., "priority": ..., "done": False}
        self.next_id = 1

    def add(self, title, priority="medium"):
        pass

    def complete(self, task_id):
        pass

    def remove(self, task_id):
        pass

    def pending(self):
        pass

    def progress(self):
        pass


todo = TodoList()
todo.add("Learn loops", "high")
todo.add("Water plants", "low")
print(todo.pending())
`,
    tests: `t = TodoList()
assert t.progress() == 0
a = t.add("Write tests", "low"); b = t.add("Fix bug", "high"); c = t.add("Review PR"); d = t.add("Deploy", "high")
assert (a, b, c, d) == (1, 2, 3, 4), (a, b, c, d)
assert t.pending() == ["Fix bug", "Deploy", "Review PR", "Write tests"], t.pending()
t.complete(b)
assert t.pending() == ["Deploy", "Review PR", "Write tests"]
assert t.progress() == 25, t.progress()
t.remove(a)
assert t.progress() == 33, t.progress()
for bad in [lambda: t.add("x", "urgent"), lambda: t.add("   ")]:
    try:
        bad(); assert False, "expected ValueError"
    except ValueError:
        pass
for bad in [lambda: t.complete(99), lambda: t.remove(99)]:
    try:
        bad(); assert False, "expected KeyError"
    except KeyError:
        pass
`,
    hints: ['sorted(..., key=lambda tid: (self.PRIORITIES[task["priority"]], tid)) sorts by priority then id.', 'progress: done * 100 // total'],
    solution: `class TodoList:
    PRIORITIES = {"high": 0, "medium": 1, "low": 2}

    def __init__(self):
        self.tasks = {}
        self.next_id = 1

    def add(self, title, priority="medium"):
        if not title or not title.strip():
            raise ValueError("title is required")
        if priority not in self.PRIORITIES:
            raise ValueError(f"unknown priority: {priority}")
        task_id = self.next_id
        self.tasks[task_id] = {"title": title.strip(), "priority": priority, "done": False}
        self.next_id += 1
        return task_id

    def _get(self, task_id):
        if task_id not in self.tasks:
            raise KeyError(task_id)
        return self.tasks[task_id]

    def complete(self, task_id):
        self._get(task_id)["done"] = True

    def remove(self, task_id):
        self._get(task_id)
        del self.tasks[task_id]

    def pending(self):
        ids = [tid for tid, t in self.tasks.items() if not t["done"]]
        ids.sort(key=lambda tid: (self.PRIORITIES[self.tasks[tid]["priority"]], tid))
        return [self.tasks[tid]["title"] for tid in ids]

    def progress(self):
        if not self.tasks:
            return 0
        done = sum(1 for t in self.tasks.values() if t["done"])
        return done * 100 // len(self.tasks)
`,
  },
  {
    id: 'password-checker',
    title: 'Password Strength Checker',
    emoji: '🔐',
    level: 'Beginner',
    lang: 'python',
    tracks: ['python', 'web'],
    xp: 160,
    brief: `Weak passwords are one of the most common causes of hacked accounts. Build a checker that **scores** a password and explains how to improve it, like the meters you see on sign-up forms.`,
    requirements: [
      '`check_password(pw)` returns a dict `{"score": int, "strength": str, "feedback": [str]}`.',
      'One point each for: length ≥ 8, length ≥ 12, a lowercase letter, an uppercase letter, a digit, a symbol (anything not a letter/digit). Max score 6.',
      'Subtract 2 points (minimum 0) if the lowercased password is in the `COMMON` list or contains the word "password".',
      'strength: 0–2 `"weak"`, 3–4 `"medium"`, 5–6 `"strong"`.',
      '`feedback` contains one helpful message for each missing rule (and one if it is a common password). A perfect password has empty feedback.',
    ],
    rubric: rubric('Scoring, strength labels and feedback match the rules exactly.'),
    starter: `COMMON = ["123456", "qwerty", "letmein", "iloveyou", "admin", "welcome"]


def check_password(pw):
    score = 0
    feedback = []
    # TODO: apply each rule, adding points or feedback
    return {"score": score, "strength": "weak", "feedback": feedback}


for pw in ["hello", "Hello123", "C0rrect-Horse-Battery!"]:
    print(pw, "->", check_password(pw))
`,
    tests: `r = check_password("C0rrect-Horse-Battery!")
assert r["score"] == 6 and r["strength"] == "strong" and r["feedback"] == [], r
r = check_password("hello")
assert r["score"] == 1 and r["strength"] == "weak" and len(r["feedback"]) == 5, r
r = check_password("Hello123")
assert r["score"] == 4 and r["strength"] == "medium", r
r = check_password("MyPassword123!")
assert r["score"] == 4, r
assert any("common" in f.lower() for f in r["feedback"]), r["feedback"]
r = check_password("qwerty")
assert r["score"] == 0, r
r = check_password("")
assert r["score"] == 0 and r["strength"] == "weak", r
`,
    hints: ['any(c.isupper() for c in pw) checks for an uppercase letter.', 'A symbol is any character where not c.isalnum().'],
    solution: `COMMON = ["123456", "qwerty", "letmein", "iloveyou", "admin", "welcome"]

RULES = [
    (lambda p: len(p) >= 8, "Use at least 8 characters."),
    (lambda p: len(p) >= 12, "12+ characters makes it much stronger."),
    (lambda p: any(c.islower() for c in p), "Add a lowercase letter."),
    (lambda p: any(c.isupper() for c in p), "Add an uppercase letter."),
    (lambda p: any(c.isdigit() for c in p), "Add a number."),
    (lambda p: any(not c.isalnum() for c in p), "Add a symbol like ! or #."),
]


def check_password(pw):
    score = 0
    feedback = []
    for rule, tip in RULES:
        if rule(pw):
            score += 1
        else:
            feedback.append(tip)
    low = pw.lower()
    if low in COMMON or "password" in low:
        score = max(0, score - 2)
        feedback.append("This is a common password. Avoid well-known words.")
    strength = "weak" if score <= 2 else "medium" if score <= 4 else "strong"
    return {"score": score, "strength": strength, "feedback": feedback}
`,
  },
  {
    id: 'web-portfolio',
    title: 'Personal Portfolio Page',
    emoji: '🧑‍🎨',
    level: 'Beginner',
    lang: 'web',
    tracks: ['web'],
    xp: 180,
    brief: `Every developer needs a home on the web. Build a **one-page portfolio** with semantic HTML, a responsive layout and a small touch of JavaScript.

The automated checks look at structure; the AI grader also judges design, accessibility and content. Make it yours!`,
    requirements: [
      'A `<header>` with your name in an `<h1>` and a `<nav>` with at least 3 links to sections on the page (`href="#..."`).',
      'At least 3 `<section>` elements, each with an `id` matching a nav link and its own heading.',
      'A projects section containing at least 3 elements with the class `card`.',
      'Use CSS flexbox or grid for the cards, and a `@media` rule so it works on phones.',
      'A button with id `theme-toggle` that toggles a `dark` class on `<body>` when clicked.',
      'Every `<img>` (if any) has `alt` text.',
    ],
    rubric: rubric('All required elements exist and the theme toggle works.', [['Visual design & accessibility', 15, 'Readable typography, good contrast, semantic tags, alt text, responsive layout.']]),
    starter: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>My Portfolio</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; }
    /* TODO: style your page, lay out .card elements with flex or grid, add a @media rule */
  </style>
</head>
<body>
  <!-- TODO: header with h1 + nav, 3+ sections, project cards, theme toggle button -->

  <script>
    // TODO: make #theme-toggle toggle the "dark" class on <body>
  </script>
</body>
</html>
`,
    tests: `assert($('header h1'), 'Add an <h1> inside a <header>');
const links = $$('nav a[href^="#"]');
assert(links.length >= 3, 'Your <nav> needs at least 3 links like href="#about" (found ' + links.length + ')');
for (const a of links) assert(document.getElementById(a.getAttribute('href').slice(1)), 'Nav link ' + a.getAttribute('href') + ' points to a section that does not exist');
assert($$('section[id]').length >= 3, 'Add at least 3 <section> elements with ids');
assert($$('.card').length >= 3, 'Add at least 3 elements with class="card"');
const parent = $('.card').parentElement;
assert(['flex', 'grid', 'inline-flex', 'inline-grid'].includes(css(parent, 'display')), 'Lay out the cards with display: flex or grid on their container');
const cssText = [...document.styleSheets].map(s => { try { return [...s.cssRules].map(r => r.cssText).join(' '); } catch (e) { return ''; } }).join(' ');
assert(/@media/.test(cssText), 'Add a @media rule so the layout works on small screens');
const btn = $('#theme-toggle');
assert(btn, 'Add a button with id="theme-toggle"');
const before = document.body.classList.contains('dark');
click(btn);
assert(document.body.classList.contains('dark') !== before, 'Clicking #theme-toggle should toggle the "dark" class on <body>');
click(btn);
assert(document.body.classList.contains('dark') === before, 'Clicking twice should switch the theme back');
for (const img of $$('img')) assert(img.alt, 'Every <img> needs alt text');`,
    hints: ['Wrap the cards in <div class="cards"> and give .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }', "document.getElementById('theme-toggle').addEventListener('click', () => document.body.classList.toggle('dark'));"],
    solution: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Ada Lovelace · Portfolio</title>
  <style>
    :root { --bg: #fdfcff; --fg: #1d1b2f; --accent: #6d4aff; }
    body { font-family: system-ui, sans-serif; margin: 0; background: var(--bg); color: var(--fg); line-height: 1.6; }
    body.dark { --bg: #14121f; --fg: #ece9ff; }
    header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; flex-wrap: wrap; }
    nav a { margin-right: 1rem; color: var(--accent); }
    section { padding: 2rem; max-width: 960px; margin: auto; }
    .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
    .card { border: 1px solid #8884; border-radius: 12px; padding: 1rem; }
    @media (max-width: 640px) { .cards { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <header>
    <h1>Ada Lovelace</h1>
    <nav><a href="#about">About</a><a href="#projects">Projects</a><a href="#contact">Contact</a></nav>
    <button id="theme-toggle" aria-label="Toggle dark mode">🌓</button>
  </header>
  <section id="about"><h2>About me</h2><p>I write programs for engines that don't exist yet.</p></section>
  <section id="projects"><h2>Projects</h2>
    <div class="cards">
      <article class="card"><h3>Bernoulli numbers</h3><p>The first published algorithm.</p></article>
      <article class="card"><h3>Analytical notes</h3><p>Notes on Babbage's engine.</p></article>
      <article class="card"><h3>Music machine</h3><p>Composing with computation.</p></article>
    </div>
  </section>
  <section id="contact"><h2>Contact</h2><p>ada@example.com</p></section>
  <script>
    document.getElementById('theme-toggle').addEventListener('click', () => document.body.classList.toggle('dark'));
  </script>
</body>
</html>
`,
  },

  // ---------- Intermediate ----------
  {
    id: 'bank-system',
    title: 'Banking System',
    emoji: '🏦',
    level: 'Intermediate',
    lang: 'python',
    tracks: ['python'],
    xp: 250,
    brief: `Model a small bank with **accounts, transfers and a transaction history**. Banks are a classic OOP and correctness exercise: money must never be created or destroyed by a bug.`,
    requirements: [
      '`Bank.open_account(owner, initial=0)` returns a new account number (`"ACC-1"`, `"ACC-2"`, …). Negative initial deposits raise `ValueError`.',
      '`deposit(acc, amount)` and `withdraw(acc, amount)`: amounts must be positive (`ValueError`); withdrawing more than the balance raises `ValueError`; unknown accounts raise `KeyError`.',
      '`transfer(src, dst, amount)` moves money atomically: if it fails, **neither** balance changes.',
      '`balance(acc)` returns the balance; `history(acc)` returns a list of `(kind, amount)` tuples in order, e.g. `("deposit", 50)`, `("transfer_out", 20)`, `("transfer_in", 20)`.',
      '`total()` returns the sum of all balances.',
    ],
    rubric: rubric('Balances, errors and history are always correct, including failed transfers.', [['OOP design', 15, 'Responsibilities are split sensibly (e.g. an Account class), with no duplicated validation.']]),
    starter: `class Bank:
    def __init__(self):
        self.accounts = {}

    def open_account(self, owner, initial=0):
        pass

    def deposit(self, acc, amount):
        pass

    def withdraw(self, acc, amount):
        pass

    def transfer(self, src, dst, amount):
        pass

    def balance(self, acc):
        pass

    def history(self, acc):
        pass

    def total(self):
        pass
`,
    tests: `b = Bank()
a = b.open_account("Ada", 100); c = b.open_account("Linus")
assert (a, c) == ("ACC-1", "ACC-2"), (a, c)
b.deposit(c, 50); b.withdraw(a, 30)
assert b.balance(a) == 70 and b.balance(c) == 50
b.transfer(a, c, 20)
assert b.balance(a) == 50 and b.balance(c) == 70 and b.total() == 120
assert b.history(a) == [("deposit", 100), ("withdraw", 30), ("transfer_out", 20)], b.history(a)
assert b.history(c)[-1] == ("transfer_in", 20), b.history(c)
for bad in [lambda: b.deposit(a, 0), lambda: b.withdraw(a, -5), lambda: b.withdraw(a, 1000), lambda: b.open_account("X", -1), lambda: b.transfer(a, c, 999)]:
    try:
        bad(); assert False, "expected ValueError"
    except ValueError:
        pass
assert b.balance(a) == 50 and b.balance(c) == 70, "a failed transfer must not change balances"
try:
    b.transfer(a, "ACC-99", 10); assert False, "expected KeyError"
except KeyError:
    pass
assert b.balance(a) == 50, "a transfer to an unknown account must not take money"
assert b.total() == 120
`,
    hints: ['Validate everything (both accounts exist, amount valid, enough funds) BEFORE changing any balance.', 'An Account class with balance and history keeps Bank simple.'],
    solution: `class Account:
    def __init__(self, number, owner):
        self.number = number
        self.owner = owner
        self.balance = 0
        self.history = []

    def apply(self, kind, amount):
        self.balance += amount if kind in ("deposit", "transfer_in") else -amount
        self.history.append((kind, amount))


class Bank:
    def __init__(self):
        self.accounts = {}

    def _get(self, acc):
        if acc not in self.accounts:
            raise KeyError(acc)
        return self.accounts[acc]

    @staticmethod
    def _check_amount(amount):
        if amount <= 0:
            raise ValueError("amount must be positive")

    def open_account(self, owner, initial=0):
        if initial < 0:
            raise ValueError("initial deposit cannot be negative")
        number = f"ACC-{len(self.accounts) + 1}"
        self.accounts[number] = Account(number, owner)
        if initial:
            self.accounts[number].apply("deposit", initial)
        return number

    def deposit(self, acc, amount):
        self._check_amount(amount)
        self._get(acc).apply("deposit", amount)

    def withdraw(self, acc, amount):
        self._check_amount(amount)
        account = self._get(acc)
        if amount > account.balance:
            raise ValueError("insufficient funds")
        account.apply("withdraw", amount)

    def transfer(self, src, dst, amount):
        self._check_amount(amount)
        a, b = self._get(src), self._get(dst)
        if amount > a.balance:
            raise ValueError("insufficient funds")
        a.apply("transfer_out", amount)
        b.apply("transfer_in", amount)

    def balance(self, acc):
        return self._get(acc).balance

    def history(self, acc):
        return list(self._get(acc).history)

    def total(self):
        return sum(a.balance for a in self.accounts.values())
`,
  },
  {
    id: 'expense-report',
    title: 'Expense Tracker Report',
    emoji: '📊',
    level: 'Intermediate',
    lang: 'python',
    tracks: ['python', 'sql'],
    xp: 240,
    brief: `Turn raw CSV data into insight. You'll parse a CSV of expenses and produce the summaries a budgeting app would show: **totals by category, by month, and the biggest spends**. This is the daily work of data engineers.`,
    requirements: [
      '`parse(csv_text)` returns a list of dicts with keys `date` (str), `category` (str, lowercased and stripped), `amount` (float). Skip the header and blank lines; skip rows whose amount is not a number.',
      '`by_category(rows)` returns `{category: total}` with totals rounded to 2 decimals.',
      '`by_month(rows)` returns `{"YYYY-MM": total}` rounded to 2 decimals.',
      '`top(rows, n)` returns the `n` largest expenses as `(category, amount)` tuples, largest first.',
      '`report(csv_text)` returns a multi-line string summary (format is up to you; it is graded by the AI for clarity).',
    ],
    rubric: rubric('Parsing and all aggregations are correct, including dirty rows.', [['Output clarity', 15, 'The report string is well formatted and easy to read.']]),
    starter: `SAMPLE = """date,category,amount
2026-01-03,Food,12.50
2026-01-15,Transport,30
2026-02-01, food ,8.25
2026-02-10,Rent,900
2026-02-11,Fun,oops

2026-02-20,Food,20
"""


def parse(csv_text):
    pass


def by_category(rows):
    pass


def by_month(rows):
    pass


def top(rows, n=3):
    pass


def report(csv_text):
    pass


print(report(SAMPLE))
`,
    tests: `rows = parse(SAMPLE)
assert len(rows) == 5, f"expected 5 valid rows, got {len(rows)}"
assert rows[2] == {"date": "2026-02-01", "category": "food", "amount": 8.25}, rows[2]
assert by_category(rows) == {"food": 40.75, "transport": 30.0, "rent": 900.0}, by_category(rows)
assert by_month(rows) == {"2026-01": 42.5, "2026-02": 928.25}, by_month(rows)
assert top(rows, 2) == [("rent", 900.0), ("transport", 30.0)], top(rows, 2)
assert parse("date,category,amount\\n") == []
r = report(SAMPLE)
assert isinstance(r, str) and "food" in r.lower() and "\\n" in r, "report should be a multi-line string mentioning categories"
`,
    hints: ['csv_text.strip().splitlines()[1:] skips the header; line.split(",") splits fields.', 'Wrap float(amount) in try/except ValueError to skip bad rows.', 'date[:7] gives "YYYY-MM".'],
    solution: `SAMPLE = """date,category,amount
2026-01-03,Food,12.50
2026-01-15,Transport,30
2026-02-01, food ,8.25
2026-02-10,Rent,900
2026-02-11,Fun,oops

2026-02-20,Food,20
"""


def parse(csv_text):
    rows = []
    for line in csv_text.strip().splitlines()[1:]:
        if not line.strip():
            continue
        parts = [p.strip() for p in line.split(",")]
        if len(parts) != 3:
            continue
        date, category, amount = parts
        try:
            rows.append({"date": date, "category": category.lower(), "amount": float(amount)})
        except ValueError:
            continue
    return rows


def _sum_by(rows, key):
    totals = {}
    for r in rows:
        k = key(r)
        totals[k] = totals.get(k, 0) + r["amount"]
    return {k: round(v, 2) for k, v in totals.items()}


def by_category(rows):
    return _sum_by(rows, lambda r: r["category"])


def by_month(rows):
    return _sum_by(rows, lambda r: r["date"][:7])


def top(rows, n=3):
    ranked = sorted(rows, key=lambda r: r["amount"], reverse=True)
    return [(r["category"], r["amount"]) for r in ranked[:n]]


def report(csv_text):
    rows = parse(csv_text)
    lines = [f"Expenses: {len(rows)} entries, total {sum(r['amount'] for r in rows):.2f}", "", "By category:"]
    lines += [f"  {c:<12}{t:>10.2f}" for c, t in sorted(by_category(rows).items(), key=lambda x: -x[1])]
    lines += ["", "By month:"] + [f"  {m}  {t:>10.2f}" for m, t in sorted(by_month(rows).items())]
    lines += ["", "Biggest spends:"] + [f"  {c}: {a:.2f}" for c, a in top(rows)]
    return "\\n".join(lines)


print(report(SAMPLE))
`,
  },
  {
    id: 'markdown-converter',
    title: 'Markdown → HTML Converter',
    emoji: '📝',
    level: 'Intermediate',
    lang: 'python',
    tracks: ['python', 'web'],
    xp: 260,
    brief: `Static site generators (Hugo, Jekyll, Astro) all start by turning **Markdown into HTML**. Build a mini converter for the most common syntax. You'll practise string processing, state machines and a little escaping for security.`,
    requirements: [
      'Headings: `# Title` → `<h1>Title</h1>` up to `######` → `<h6>`.',
      'Paragraphs: consecutive plain lines join into one `<p>` (lines joined with a space); blank lines separate blocks.',
      'Unordered lists: lines starting with `- ` become `<ul><li>…</li></ul>` (one `<ul>` per consecutive group).',
      'Inline: `**bold**` → `<strong>`, `*italic*` → `<em>`, `` `code` `` → `<code>`, `[text](url)` → `<a href="url">text</a>`.',
      'Escape `<`, `>` and `&` in the text **before** applying inline formatting, so users can\'t inject HTML.',
      '`to_html(md)` returns the blocks joined with `\\n`.',
    ],
    rubric: rubric('Every listed syntax converts correctly, including mixed documents.', [['Security', 15, 'User text is HTML-escaped so raw tags cannot be injected.']]),
    starter: `import re


def inline(text):
    """Escape HTML, then convert **bold**, *italic*, \`code\` and [links](url)."""
    pass


def to_html(md):
    pass


print(to_html("""# Hello

This is **bold** and *italic*.
Same paragraph.

- one
- two with \`code\`
"""))
`,
    tests: `assert to_html("# Title") == "<h1>Title</h1>", to_html("# Title")
assert to_html("### Small") == "<h3>Small</h3>"
assert to_html("hello\\nworld") == "<p>hello world</p>", to_html("hello\\nworld")
assert to_html("a\\n\\nb") == "<p>a</p>\\n<p>b</p>", to_html("a\\n\\nb")
assert to_html("- x\\n- y") == "<ul><li>x</li><li>y</li></ul>", to_html("- x\\n- y")
assert inline("**b** and *i*") == "<strong>b</strong> and <em>i</em>", inline("**b** and *i*")
assert inline("use \`x = 1\`") == "use <code>x = 1</code>"
assert inline("[DevQuest](https://example.com)") == '<a href="https://example.com">DevQuest</a>', inline("[DevQuest](https://example.com)")
assert inline("<script>alert(1)</script> & co") == "&lt;script&gt;alert(1)&lt;/script&gt; &amp; co", inline("<script>alert(1)</script> & co")
doc = to_html("# T\\n\\nIntro **here**.\\n\\n- a\\n- b\\n\\nEnd")
assert doc == "<h1>T</h1>\\n<p>Intro <strong>here</strong>.</p>\\n<ul><li>a</li><li>b</li></ul>\\n<p>End</p>", doc
`,
    hints: ['Escape & first, then < and >.', 'Apply **bold** before *italic*: re.sub(r"\\*\\*(.+?)\\*\\*", r"<strong>\\1</strong>", s)', 'Walk the lines keeping a list of current paragraph lines and current list items; flush them when the block type changes.'],
    solution: `import re


def inline(text):
    s = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    s = re.sub(r"\`([^\`]+)\`", r"<code>\\1</code>", s)
    s = re.sub(r"\\*\\*(.+?)\\*\\*", r"<strong>\\1</strong>", s)
    s = re.sub(r"\\*(.+?)\\*", r"<em>\\1</em>", s)
    s = re.sub(r"\\[([^\\]]+)\\]\\(([^)\\s]+)\\)", r'<a href="\\2">\\1</a>', s)
    return s


def to_html(md):
    blocks, para, items = [], [], []

    def flush():
        if para:
            blocks.append("<p>" + inline(" ".join(para)) + "</p>")
            para.clear()
        if items:
            blocks.append("<ul>" + "".join(f"<li>{inline(i)}</li>" for i in items) + "</ul>")
            items.clear()

    for line in md.splitlines():
        stripped = line.strip()
        heading = re.match(r"^(#{1,6})\\s+(.*)$", stripped)
        if not stripped:
            flush()
        elif heading:
            flush()
            level = len(heading.group(1))
            blocks.append(f"<h{level}>{inline(heading.group(2))}</h{level}>")
        elif stripped.startswith("- "):
            if para:
                flush()
            items.append(stripped[2:])
        else:
            if items:
                flush()
            para.append(stripped)
    flush()
    return "\\n".join(blocks)
`,
  },
  {
    id: 'tic-tac-toe',
    title: 'Tic-Tac-Toe with an Unbeatable AI',
    emoji: '❌',
    level: 'Intermediate',
    lang: 'python',
    tracks: ['dsa', 'ai'],
    xp: 280,
    brief: `Build the game engine for tic-tac-toe, then an AI opponent that **never loses**, using the **minimax** algorithm: try every possible move, assume the opponent plays perfectly, and pick the move with the best guaranteed outcome. It's recursion and game trees, and the same idea powers chess engines.`,
    requirements: [
      'The board is a list of 9 cells containing `"X"`, `"O"` or `" "` (index 0 = top-left, 8 = bottom-right).',
      '`winner(board)` returns `"X"`, `"O"`, `"draw"` (full board, no winner) or `None` (game still on).',
      '`moves(board)` returns the list of empty indexes.',
      '`best_move(board, player)` returns the index of an optimal move for `player` using minimax. It must win immediately when it can, and block an immediate loss.',
      'Two `best_move` players playing each other from an empty board must always draw.',
    ],
    rubric: rubric('winner/moves are correct and the AI is unbeatable.', [['Algorithm', 15, 'Clean recursive minimax with clear scoring; optional pruning or caching is a bonus.']]),
    starter: `LINES = [(0, 1, 2), (3, 4, 5), (6, 7, 8), (0, 3, 6), (1, 4, 7), (2, 5, 8), (0, 4, 8), (2, 4, 6)]


def winner(board):
    pass


def moves(board):
    pass


def best_move(board, player):
    pass


def show(board):
    for r in range(3):
        print(" | ".join(board[r * 3:r * 3 + 3]))


board = [" "] * 9
turn = "X"
while winner(board) is None:
    board[best_move(board, turn)] = turn
    turn = "O" if turn == "X" else "X"
show(board)
print("Result:", winner(board))
`,
    tests: `assert winner(list("XXX      ")) == "X"
assert winner(list("O  O  O  ")) == "O"
assert winner(list("XOXOOXXXO")) == "draw", winner(list("XOXOOXXXO"))
assert winner(list("X        ")) is None
assert sorted(moves(list("X O      "))) == [1, 3, 4, 5, 6, 7, 8]
assert best_move(list("XX OO    "), "X") == 2, "X should take the win"
assert best_move(list("XX OO    "), "O") == 5, "O should take its own win"
assert best_move(list("XX  O    "), "O") == 2, "O must block X"
b = [" "] * 9
turn = "X"
while winner(b) is None:
    b[best_move(b, turn)] = turn
    turn = "O" if turn == "X" else "X"
assert winner(b) == "draw", "perfect play must end in a draw"
`,
    hints: ['minimax(board, to_move) returns +1 if X wins, -1 if O wins, 0 for a draw; X maximises, O minimises.', 'Prefer faster wins by scoring 10 - depth instead of 1 if you want a stylish AI.'],
    solution: `LINES = [(0, 1, 2), (3, 4, 5), (6, 7, 8), (0, 3, 6), (1, 4, 7), (2, 5, 8), (0, 4, 8), (2, 4, 6)]


def winner(board):
    for a, b, c in LINES:
        if board[a] != " " and board[a] == board[b] == board[c]:
            return board[a]
    return "draw" if " " not in board else None


def moves(board):
    return [i for i, c in enumerate(board) if c == " "]


def minimax(board, to_move, depth=0):
    w = winner(board)
    if w == "X":
        return 10 - depth
    if w == "O":
        return depth - 10
    if w == "draw":
        return 0
    scores = []
    for m in moves(board):
        board[m] = to_move
        scores.append(minimax(board, "O" if to_move == "X" else "X", depth + 1))
        board[m] = " "
    return max(scores) if to_move == "X" else min(scores)


def best_move(board, player):
    other = "O" if player == "X" else "X"
    best, best_score = None, None
    for m in moves(board):
        board[m] = player
        score = minimax(board, other, 1)
        board[m] = " "
        better = best_score is None or (score > best_score if player == "X" else score < best_score)
        if better:
            best, best_score = m, score
    return best


def show(board):
    for r in range(3):
        print(" | ".join(board[r * 3:r * 3 + 3]))


board = [" "] * 9
turn = "X"
while winner(board) is None:
    board[best_move(board, turn)] = turn
    turn = "O" if turn == "X" else "X"
show(board)
print("Result:", winner(board))
`,
  },
  {
    id: 'library-system',
    title: 'Library Management (JavaScript)',
    emoji: '📚',
    level: 'Intermediate',
    lang: 'javascript',
    tracks: ['javascript'],
    xp: 240,
    brief: `Model a library with **classes, Maps and dates** in modern JavaScript: books, members, loans and late fees. It's the kind of domain logic you'd put behind a REST API.`,
    requirements: [
      '`class Library` with `addBook(isbn, title, copies = 1)`, `addMember(id, name)`.',
      '`borrow(memberId, isbn, day)` lends a copy (days are integers). Throw an `Error` if the member or book doesn\'t exist, no copies are available, or the member already has 3 books.',
      '`returnBook(memberId, isbn, day)` returns the copy and the late fee: loans are 14 days; each late day costs 0.5. Throw if that member doesn\'t have that book.',
      '`available(isbn)` returns the number of copies on the shelf.',
      '`search(text)` returns titles containing `text` (case-insensitive), sorted alphabetically.',
    ],
    rubric: rubric('All rules (limits, fees, availability) behave correctly.', [['JavaScript idioms', 15, 'Uses classes, Map/Set, const/let, array methods and clear error messages.']]),
    starter: `class Library {
  constructor() {
    this.books = new Map();   // isbn -> { title, copies }
    this.members = new Map(); // id -> { name, loans: Map(isbn -> day) }
  }

  addBook(isbn, title, copies = 1) {}
  addMember(id, name) {}
  borrow(memberId, isbn, day) {}
  returnBook(memberId, isbn, day) {}
  available(isbn) {}
  search(text) {}
}

const lib = new Library();
lib.addBook("111", "Clean Code", 2);
lib.addMember("m1", "Ada");
console.log(lib.search("code"));
`,
    tests: `const L = new Library();
L.addBook("1", "Clean Code", 2); L.addBook("2", "The Pragmatic Programmer"); L.addBook("3", "Code Complete"); L.addBook("4", "Refactoring");
L.addMember("a", "Ada"); L.addMember("b", "Bob");
L.borrow("a", "1", 0);
if (L.available("1") !== 1) throw new Error("available('1') should be 1 after borrowing, got " + L.available("1"));
const expectThrow = (fn, why) => { let threw = false; try { fn(); } catch (e) { threw = true; } if (!threw) throw new Error("Expected an error: " + why); };
L.borrow("b", "1", 0);
expectThrow(() => L.borrow("a", "1", 1), "no copies left");
expectThrow(() => L.borrow("zz", "2", 1), "unknown member");
expectThrow(() => L.borrow("a", "99", 1), "unknown book");
L.borrow("a", "2", 0); L.borrow("a", "3", 0);
expectThrow(() => L.borrow("a", "4", 0), "member already has 3 books");
const fee1 = L.returnBook("a", "1", 10);
if (fee1 !== 0) throw new Error("on-time return should cost 0, got " + fee1);
const fee2 = L.returnBook("a", "2", 20);
if (fee2 !== 3) throw new Error("6 days late should cost 3, got " + fee2);
expectThrow(() => L.returnBook("a", "2", 21), "returning a book you don't have");
if (L.available("1") !== 1) throw new Error("returned copies go back on the shelf");
if (JSON.stringify(L.search("CODE")) !== JSON.stringify(["Clean Code", "Code Complete"])) throw new Error("search('CODE') gave " + JSON.stringify(L.search("CODE")));`,
    hints: ['Store each member\'s loans in a Map of isbn → day borrowed.', 'fee = Math.max(0, day - borrowedDay - 14) * 0.5'],
    solution: `class Library {
  constructor() {
    this.books = new Map();
    this.members = new Map();
  }

  addBook(isbn, title, copies = 1) {
    this.books.set(isbn, { title, copies });
  }

  addMember(id, name) {
    this.members.set(id, { name, loans: new Map() });
  }

  #member(id) {
    const m = this.members.get(id);
    if (!m) throw new Error(\`Unknown member \${id}\`);
    return m;
  }

  #book(isbn) {
    const b = this.books.get(isbn);
    if (!b) throw new Error(\`Unknown book \${isbn}\`);
    return b;
  }

  borrow(memberId, isbn, day) {
    const member = this.#member(memberId);
    const book = this.#book(isbn);
    if (book.copies < 1) throw new Error(\`No copies of "\${book.title}" left\`);
    if (member.loans.size >= 3) throw new Error(\`\${member.name} already has 3 books\`);
    book.copies--;
    member.loans.set(isbn, day);
  }

  returnBook(memberId, isbn, day) {
    const member = this.#member(memberId);
    if (!member.loans.has(isbn)) throw new Error(\`\${member.name} doesn't have \${isbn}\`);
    const lateDays = Math.max(0, day - member.loans.get(isbn) - 14);
    member.loans.delete(isbn);
    this.#book(isbn).copies++;
    return lateDays * 0.5;
  }

  available(isbn) {
    return this.#book(isbn).copies;
  }

  search(text) {
    const q = text.toLowerCase();
    return [...this.books.values()].map((b) => b.title).filter((t) => t.toLowerCase().includes(q)).sort();
  }
}
`,
  },
  {
    id: 'web-kanban',
    title: 'Kanban Task Board',
    emoji: '🗂️',
    level: 'Intermediate',
    lang: 'web',
    tracks: ['web', 'javascript'],
    xp: 280,
    brief: `Build a **Trello-style board** with three columns. You'll practise DOM manipulation, events, state and rendering: the core skills behind every frontend framework.`,
    requirements: [
      'Three columns with ids `todo`, `doing` and `done`, each containing a `<ul>`.',
      'An `<input id="new-task">` and a `<button id="add-task">`: clicking adds the text as a new `<li class="task">` in **To do**, then clears the input. Empty or whitespace-only text is ignored.',
      'Each task has a `.move` button that moves it to the next column (todo → doing → done); in **Done** the button is hidden or removed.',
      'Each task has a `.delete` button that removes it.',
      'An element with id `count` shows how many tasks are not done, e.g. `2 tasks left`, and updates after every change.',
    ],
    rubric: rubric('Adding, moving, deleting and the counter all work.', [['UI & UX', 15, 'Clear layout, readable cards, sensible empty states, keyboard-friendly controls.']]),
    starter: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Kanban</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 1rem; }
    .board { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
    .column { background: #f2f2f7; border-radius: 10px; padding: 0.5rem; }
  </style>
</head>
<body>
  <h1>My board</h1>
  <input id="new-task" placeholder="New task"> <button id="add-task">Add</button>
  <p id="count"></p>
  <div class="board">
    <section class="column" id="todo"><h2>To do</h2><ul></ul></section>
    <section class="column" id="doing"><h2>Doing</h2><ul></ul></section>
    <section class="column" id="done"><h2>Done</h2><ul></ul></section>
  </div>
  <script>
    // TODO: add tasks, move them between columns, delete them, update #count
  </script>
</body>
</html>
`,
    tests: `const input = $('#new-task'), add = $('#add-task');
assert(input && add, 'You need #new-task and #add-task');
type(input, 'Write tests'); click(add);
type(input, 'Ship it'); click(add);
type(input, '   '); click(add);
let tasks = $$('#todo li.task');
assert(tasks.length === 2, 'Expected 2 tasks in To do (empty input ignored), found ' + tasks.length);
assert(input.value === '', 'The input should be cleared after adding');
assert(/2/.test($('#count').textContent), '#count should say 2 tasks left, got "' + $('#count').textContent + '"');
click(tasks[0].querySelector('.move'));
assert($$('#doing li.task').length === 1, 'Clicking .move should move the task to Doing');
click($('#doing li.task .move'));
assert($$('#done li.task').length === 1, 'Clicking .move in Doing should move the task to Done');
const doneMove = $('#done li.task .move');
assert(!doneMove || doneMove.hidden || getComputedStyle(doneMove).display === 'none', 'Tasks in Done should not have a visible .move button');
assert(/1/.test($('#count').textContent), '#count should say 1 task left after one is done, got "' + $('#count').textContent + '"');
click($('#todo li.task .delete'));
assert($$('li.task').length === 1, 'Clicking .delete should remove the task');
assert(/0/.test($('#count').textContent), '#count should update after deleting, got "' + $('#count').textContent + '"');`,
    hints: ['Keep an array of {text, column} objects as your state and write one render() function that rebuilds the lists.', "const next = { todo: 'doing', doing: 'done' };"],
    solution: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Kanban</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 1rem; }
    .board { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
    .column { background: #f2f2f7; border-radius: 10px; padding: 0.5rem; }
    ul { list-style: none; padding: 0; }
    .task { background: white; margin: 0.4rem 0; padding: 0.5rem; border-radius: 8px; display: flex; gap: 0.4rem; align-items: center; }
    .task span { flex: 1; }
  </style>
</head>
<body>
  <h1>My board</h1>
  <input id="new-task" placeholder="New task"> <button id="add-task">Add</button>
  <p id="count"></p>
  <div class="board">
    <section class="column" id="todo"><h2>To do</h2><ul></ul></section>
    <section class="column" id="doing"><h2>Doing</h2><ul></ul></section>
    <section class="column" id="done"><h2>Done</h2><ul></ul></section>
  </div>
  <script>
    const next = { todo: 'doing', doing: 'done' };
    let tasks = [];
    let nextId = 1;

    function render() {
      for (const col of ['todo', 'doing', 'done']) {
        const ul = document.querySelector('#' + col + ' ul');
        ul.innerHTML = '';
        for (const t of tasks.filter((t) => t.column === col)) {
          const li = document.createElement('li');
          li.className = 'task';
          const label = document.createElement('span');
          label.textContent = t.text;
          li.append(label);
          if (next[col]) {
            const move = document.createElement('button');
            move.className = 'move';
            move.textContent = '→';
            move.onclick = () => { t.column = next[col]; render(); };
            li.append(move);
          }
          const del = document.createElement('button');
          del.className = 'delete';
          del.textContent = '✕';
          del.onclick = () => { tasks = tasks.filter((x) => x.id !== t.id); render(); };
          li.append(del);
          ul.append(li);
        }
      }
      const left = tasks.filter((t) => t.column !== 'done').length;
      document.getElementById('count').textContent = left + ' task' + (left === 1 ? '' : 's') + ' left';
    }

    document.getElementById('add-task').addEventListener('click', () => {
      const input = document.getElementById('new-task');
      const text = input.value.trim();
      input.value = '';
      if (!text) return;
      tasks.push({ id: nextId++, text, column: 'todo' });
      render();
    });
    render();
  </script>
</body>
</html>
`,
  },

  // ---------- Advanced ----------
  {
    id: 'maze-solver',
    title: 'Maze Solver',
    emoji: '🧭',
    level: 'Advanced',
    lang: 'python',
    tracks: ['dsa'],
    xp: 350,
    brief: `Solve mazes with **breadth-first search** and draw the shortest path. The same algorithm is used for routing in games, robots and network packets.`,
    requirements: [
      'A maze is a list of strings: `#` wall, `.` open, `S` start, `E` end. Moves are up/down/left/right.',
      '`parse(maze)` returns `(grid, start, end)` where start/end are `(row, col)`; raise `ValueError` if there isn\'t exactly one `S` and one `E`.',
      '`shortest_path(maze)` returns the list of `(row, col)` cells from S to E inclusive, or `None` if unreachable.',
      '`draw(maze, path)` returns the maze as a list of strings with path cells (except S and E) replaced by `*`.',
      'Must handle mazes up to 60×60 quickly (no exponential search).',
    ],
    rubric: rubric('Paths are shortest, unreachable mazes return None, invalid mazes raise.', [['Algorithm & efficiency', 15, 'Uses BFS with a visited set and parent pointers (or similar) in O(rows × cols).']]),
    starter: `from collections import deque

MAZE = [
    "S.#.......",
    ".##.#####.",
    "....#...#.",
    "##.##.#.#.",
    "...#..#...",
    ".#...##.#E",
]


def parse(maze):
    pass


def shortest_path(maze):
    pass


def draw(maze, path):
    pass


path = shortest_path(MAZE)
print(len(path) - 1 if path else "no path", "steps")
for row in draw(MAZE, path or []):
    print(row)
`,
    tests: `path = shortest_path(MAZE)
assert path[0] == (0, 0) and path[-1] == (5, 9), (path[0], path[-1])
assert len(path) - 1 == 18, f"shortest path should take 18 steps, got {len(path) - 1}"
for (r1, c1), (r2, c2) in zip(path, path[1:]):
    assert abs(r1 - r2) + abs(c1 - c2) == 1, "path must move one cell at a time"
    assert MAZE[r2][c2] != "#", "path goes through a wall"
assert shortest_path(["S#E"]) is None
assert shortest_path(["SE"]) == [(0, 0), (0, 1)]
for bad in [["..E"], ["S.S", "..E"]]:
    try:
        parse(bad); assert False, "expected ValueError"
    except ValueError:
        pass
d = draw(["S..", "##.", "E.."], shortest_path(["S..", "##.", "E.."]))
assert d == ["S**", "##*", "E**"], d
big = ["S" + "." * 59] + ["." * 60] * 58 + ["." * 59 + "E"]
assert len(shortest_path(big)) - 1 == 118
`,
    hints: ['Queue of cells, a parent dict {cell: previous_cell}, stop when you pop E.', 'Rebuild the path by walking parent pointers back from E, then reverse it.'],
    solution: `from collections import deque

MAZE = [
    "S.#.......",
    ".##.#####.",
    "....#...#.",
    "##.##.#.#.",
    "...#..#...",
    ".#...##.#E",
]


def parse(maze):
    grid = [list(row) for row in maze]
    starts = [(r, c) for r, row in enumerate(grid) for c, ch in enumerate(row) if ch == "S"]
    ends = [(r, c) for r, row in enumerate(grid) for c, ch in enumerate(row) if ch == "E"]
    if len(starts) != 1 or len(ends) != 1:
        raise ValueError("maze needs exactly one S and one E")
    return grid, starts[0], ends[0]


def shortest_path(maze):
    grid, start, end = parse(maze)
    parent = {start: None}
    queue = deque([start])
    while queue:
        cell = queue.popleft()
        if cell == end:
            path = []
            while cell is not None:
                path.append(cell)
                cell = parent[cell]
            return path[::-1]
        r, c = cell
        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= nr < len(grid) and 0 <= nc < len(grid[nr]) and grid[nr][nc] != "#" and (nr, nc) not in parent:
                parent[(nr, nc)] = cell
                queue.append((nr, nc))
    return None


def draw(maze, path):
    grid = [list(row) for row in maze]
    for r, c in path:
        if grid[r][c] == ".":
            grid[r][c] = "*"
    return ["".join(row) for row in grid]


path = shortest_path(MAZE)
print(len(path) - 1 if path else "no path", "steps")
for row in draw(MAZE, path or []):
    print(row)
`,
  },
  {
    id: 'calculator',
    title: 'Expression Calculator (no eval!)',
    emoji: '🧮',
    level: 'Advanced',
    lang: 'python',
    tracks: ['dsa', 'systems'],
    xp: 380,
    brief: `How does a programming language understand \`2 + 3 * (4 - 1)\`? Build the first two stages of a compiler: a **tokenizer** and a **recursive-descent parser** that evaluates arithmetic with correct precedence. Using \`eval\` is not allowed!`,
    requirements: [
      '`tokenize(text)` returns tokens: numbers as `float`, and the strings `"+" "-" "*" "/" "(" ")"`. Whitespace is ignored; any other character raises `ValueError`.',
      '`calculate(text)` evaluates the expression with standard precedence (`*` `/` before `+` `-`), left-to-right associativity, parentheses and unary minus (`-3`, `-(2+1)`).',
      'Division by zero raises `ZeroDivisionError`; malformed expressions (`"2 +"`, `"(1"`, `"1 2"`) raise `ValueError`.',
      'Do not use `eval`, `exec` or `compile`.',
    ],
    rubric: rubric('All expressions evaluate correctly and invalid input raises the right errors.', [['Parser design', 15, 'Grammar is clear (expr → term → factor), with no eval/exec.']]),
    starter: `def tokenize(text):
    pass


def calculate(text):
    pass


for expr in ["2 + 3 * 4", "(2 + 3) * 4", "-3 + 10 / 4", "2 * (3 + (4 - 1)) / 3"]:
    print(expr, "=", calculate(expr))
`,
    tests: `assert tokenize("12+ 3.5*(2)") == [12.0, "+", 3.5, "*", "(", 2.0, ")"], tokenize("12+ 3.5*(2)")
cases = {"2 + 3 * 4": 14, "(2 + 3) * 4": 20, "10 - 4 - 3": 3, "8 / 4 / 2": 1, "-3 + 10 / 4": -0.5, "-(2 + 1) * 2": -6, "2 * (3 + (4 - 1)) / 3": 4, "  7 ": 7, "2*-3": -6}
for expr, want in cases.items():
    got = calculate(expr)
    assert abs(got - want) < 1e-9, f"calculate({expr!r}) = {got}, expected {want}"
for bad in ["2 +", "(1", "1 2", "", "3 $ 4", ")"]:
    try:
        calculate(bad); assert False, f"calculate({bad!r}) should raise ValueError"
    except ValueError:
        pass
try:
    calculate("1 / (2 - 2)"); assert False, "expected ZeroDivisionError"
except ZeroDivisionError:
    pass
`,
    hints: ['Grammar: expr := term (("+"|"-") term)*, term := factor (("*"|"/") factor)*, factor := NUMBER | "(" expr ")" | "-" factor', 'Keep a position index into the token list; after parsing expr, the index must be at the end or the input was malformed.'],
    solution: `def tokenize(text):
    tokens, i = [], 0
    while i < len(text):
        ch = text[i]
        if ch.isspace():
            i += 1
        elif ch.isdigit() or ch == ".":
            j = i
            while j < len(text) and (text[j].isdigit() or text[j] == "."):
                j += 1
            tokens.append(float(text[i:j]))
            i = j
        elif ch in "+-*/()":
            tokens.append(ch)
            i += 1
        else:
            raise ValueError(f"unexpected character {ch!r}")
    return tokens


class Parser:
    def __init__(self, tokens):
        self.tokens = tokens
        self.pos = 0

    def peek(self):
        return self.tokens[self.pos] if self.pos < len(self.tokens) else None

    def take(self):
        tok = self.peek()
        if tok is None:
            raise ValueError("unexpected end of expression")
        self.pos += 1
        return tok

    def expr(self):
        value = self.term()
        while self.peek() in ("+", "-"):
            op = self.take()
            value = value + self.term() if op == "+" else value - self.term()
        return value

    def term(self):
        value = self.factor()
        while self.peek() in ("*", "/"):
            op = self.take()
            right = self.factor()
            if op == "*":
                value *= right
            else:
                if right == 0:
                    raise ZeroDivisionError("division by zero")
                value /= right
        return value

    def factor(self):
        tok = self.take()
        if isinstance(tok, float):
            return tok
        if tok == "-":
            return -self.factor()
        if tok == "(":
            value = self.expr()
            if self.take() != ")":
                raise ValueError("expected )")
            return value
        raise ValueError(f"unexpected token {tok!r}")


def calculate(text):
    parser = Parser(tokenize(text))
    value = parser.expr()
    if parser.peek() is not None:
        raise ValueError(f"unexpected token {parser.peek()!r}")
    return value


for expr in ["2 + 3 * 4", "(2 + 3) * 4", "-3 + 10 / 4", "2 * (3 + (4 - 1)) / 3"]:
    print(expr, "=", calculate(expr))
`,
  },
  {
    id: 'search-engine',
    title: 'Mini Search Engine',
    emoji: '🔎',
    level: 'Advanced',
    lang: 'python',
    tracks: ['dsa', 'ai'],
    xp: 400,
    brief: `Build the core of a search engine: an **inverted index** and **TF-IDF ranking**. Search engines, log tools and even the retrieval step of RAG pipelines use these ideas.

TF-IDF scores a word higher when it appears often in a document (**term frequency**) but rarely across all documents (**inverse document frequency**).`,
    requirements: [
      '`tokenize(text)` lowercases, splits on anything that isn\'t a letter or digit, and drops words in `STOPWORDS`.',
      '`SearchEngine.add(doc_id, text)` indexes a document; `index` maps word → set of doc ids.',
      '`tf(word, doc_id)` = count of word in doc / number of tokens in doc. `idf(word)` = `log(N / df)` where N is the number of docs and df the number containing the word (0 if df is 0).',
      '`search(query, k=3)` scores each document as the sum of tf·idf over query words, returns up to `k` `(doc_id, score)` pairs with score > 0, highest first (ties broken by doc_id).',
      'Searching must only score documents that contain at least one query word (use the index, don\'t scan everything).',
    ],
    rubric: rubric('Tokenizing, index, tf, idf and ranking are all correct.', [['Data structures', 15, 'Uses an inverted index and Counters/dicts effectively; no repeated full scans.']]),
    starter: `import math
import re
from collections import Counter

STOPWORDS = {"the", "a", "an", "and", "or", "of", "to", "in", "is", "it", "for", "on", "with"}


def tokenize(text):
    pass


class SearchEngine:
    def __init__(self):
        self.index = {}      # word -> set(doc_id)
        self.docs = {}       # doc_id -> Counter of words
        self.lengths = {}    # doc_id -> number of tokens

    def add(self, doc_id, text):
        pass

    def tf(self, word, doc_id):
        pass

    def idf(self, word):
        pass

    def search(self, query, k=3):
        pass


engine = SearchEngine()
engine.add("py", "Python is a programming language. Python is great for data.")
engine.add("js", "JavaScript runs in the browser and on servers.")
engine.add("sql", "SQL queries data in relational databases.")
print(engine.search("python data"))
`,
    tests: `assert tokenize("The Quick, brown fox!! and 42 cats") == ["quick", "brown", "fox", "42", "cats"], tokenize("The Quick, brown fox!! and 42 cats")
e = SearchEngine()
e.add("a", "apple banana apple")
e.add("b", "banana cherry")
e.add("c", "cherry cherry cherry date")
assert e.index["banana"] == {"a", "b"}, e.index.get("banana")
assert abs(e.tf("apple", "a") - 2 / 3) < 1e-9
assert e.tf("apple", "b") == 0
assert abs(e.idf("banana") - math.log(3 / 2)) < 1e-9
assert e.idf("zebra") == 0
res = e.search("cherry")
assert [d for d, _ in res] == ["c", "b"], res
assert all(s > 0 for _, s in res)
assert e.search("zebra") == []
res = e.search("apple date", k=1)
assert len(res) == 1 and res[0][0] in ("a", "c"), res
e2 = SearchEngine()
e2.add("x", "same words"); e2.add("y", "same words"); e2.add("z", "other")
assert [d for d, _ in e2.search("same")] == ["x", "y"], "ties should be broken by doc_id"
`,
    hints: ['re.split(r"[^a-z0-9]+", text.lower()) then filter empty strings and stopwords.', 'candidates = set().union(*(self.index.get(w, set()) for w in words))', 'Sort with key=lambda x: (-x[1], x[0]).'],
    solution: `import math
import re
from collections import Counter

STOPWORDS = {"the", "a", "an", "and", "or", "of", "to", "in", "is", "it", "for", "on", "with"}


def tokenize(text):
    return [w for w in re.split(r"[^a-z0-9]+", text.lower()) if w and w not in STOPWORDS]


class SearchEngine:
    def __init__(self):
        self.index = {}
        self.docs = {}
        self.lengths = {}

    def add(self, doc_id, text):
        words = tokenize(text)
        self.docs[doc_id] = Counter(words)
        self.lengths[doc_id] = len(words)
        for w in set(words):
            self.index.setdefault(w, set()).add(doc_id)

    def tf(self, word, doc_id):
        n = self.lengths.get(doc_id, 0)
        return self.docs[doc_id][word] / n if n else 0

    def idf(self, word):
        df = len(self.index.get(word, ()))
        return math.log(len(self.docs) / df) if df else 0

    def search(self, query, k=3):
        words = tokenize(query)
        candidates = set().union(*(self.index.get(w, set()) for w in words)) if words else set()
        scored = []
        for doc_id in candidates:
            score = sum(self.tf(w, doc_id) * self.idf(w) for w in words)
            if score > 0:
                scored.append((doc_id, score))
        scored.sort(key=lambda x: (-x[1], x[0]))
        return scored[:k]


engine = SearchEngine()
engine.add("py", "Python is a programming language. Python is great for data.")
engine.add("js", "JavaScript runs in the browser and on servers.")
engine.add("sql", "SQL queries data in relational databases.")
print(engine.search("python data"))
`,
  },
];

export const projectById = (id: string, custom: Project[] = []) => PROJECTS.find((p) => p.id === id) ?? custom.find((p) => p.id === id);

/** Cover art generated with Solframe Studio, falling back to a generic image for custom projects. */
export const projectArt = (p: Project) => `./art/proj-${p.custom ? 'custom' : p.id}.webp`;
