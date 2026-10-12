import type { Lesson } from './types';

/** Hands-on labs added to the illustrated tracks. `after` is the lesson id each lab follows. */
export const LABS: { track: string; after: string; lesson: Lesson }[] = [
  // ---------------- Web: live HTML/CSS/JS ----------------
  {
    track: 'web',
    after: 'web-html',
    lesson: {
      id: 'web-lab-html',
      title: '🛠️ Lab: Your first web page',
      xp: 50,
      body: `
Time to write real HTML. The editor shows a **live preview** that updates as you type.

HTML is a tree of **elements**: \`<tag attribute="value">content</tag>\`. Semantic tags describe *meaning*, which helps screen readers, search engines and other developers:

| Tag | Meaning |
|---|---|
| \`<header>\`, \`<main>\`, \`<footer>\` | page regions |
| \`<h1>\`…\`<h6>\` | headings (one \`<h1>\` per page) |
| \`<p>\` | paragraph |
| \`<ul>\` / \`<ol>\` + \`<li>\` | lists |
| \`<a href="…">\` | link |
| \`<img src="…" alt="…">\` | image (always add \`alt\` text) |
`,
      exercise: {
        kind: 'code',
        lang: 'web',
        prompt: 'Build a page with a `<header>` containing an `<h1>`, a `<main>` with a paragraph and an unordered list of **at least 3** favourite things, and a `<footer>` containing a link (`<a href="...">`).',
        starter: '<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <title>About me</title>\n</head>\n<body>\n  <!-- your page here -->\n</body>\n</html>\n',
        solution: '<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <title>About me</title>\n</head>\n<body>\n  <header><h1>Hi, I\'m Ada</h1></header>\n  <main>\n    <p>I am learning to code with DevQuest.</p>\n    <ul>\n      <li>Python</li>\n      <li>Algorithms</li>\n      <li>Tea</li>\n    </ul>\n  </main>\n  <footer><a href="https://example.com">My blog</a></footer>\n</body>\n</html>\n',
        hints: ['Nest tags: <header><h1>Title</h1></header>', 'A list: <ul><li>one</li><li>two</li><li>three</li></ul>'],
        check: {
          type: 'web',
          tests: "assert($('header h1'), 'Put an <h1> inside a <header>');\nassert($('main p'), 'Add a <p> inside <main>');\nassert($$('main ul li').length >= 3, 'Your <ul> in <main> needs at least 3 <li> items');\nassert($('footer a[href]'), 'Add a link <a href=\"...\"> inside <footer>');",
        },
      },
      cards: [{ front: 'Semantic HTML', back: 'Tags that describe meaning (header, main, nav, article, footer), not just looks.' }],
    },
  },
  {
    track: 'web',
    after: 'web-lab-html',
    lesson: {
      id: 'web-lab-css',
      title: '🛠️ Lab: Style cards with Flexbox',
      xp: 60,
      body: `
CSS rules have a **selector** and **declarations**: \`selector { property: value; }\`

**The box model:** every element is a box with **content → padding → border → margin**.

**Flexbox** lays children out in a row (or column):

~~~css
.row {
  display: flex;          /* children sit side by side */
  gap: 16px;              /* space between them */
  justify-content: center;/* horizontal alignment */
  align-items: center;    /* vertical alignment */
  flex-wrap: wrap;        /* wrap onto new lines on small screens */
}
~~~

Selectors: \`.class\`, \`#id\`, \`tag\`, \`.parent .child\`, \`:hover\`.
`,
      exercise: {
        kind: 'code',
        lang: 'web',
        prompt: 'Make `.cards` a **flex** container with a `gap` of at least 10px. Give each `.card` a `padding` of at least 12px, a `border-radius` of at least 8px, and change its background on `:hover` (any colour).',
        starter: '<!doctype html>\n<html>\n<head>\n<style>\n  body { font-family: system-ui; }\n  /* style .cards and .card here */\n</style>\n</head>\n<body>\n  <div class="cards">\n    <div class="card">🐍 Python</div>\n    <div class="card">🟨 JavaScript</div>\n    <div class="card">🗄️ SQL</div>\n  </div>\n</body>\n</html>\n',
        solution: '<!doctype html>\n<html>\n<head>\n<style>\n  body { font-family: system-ui; }\n  .cards { display: flex; gap: 16px; flex-wrap: wrap; }\n  .card { padding: 16px; border-radius: 12px; background: #eef; }\n  .card:hover { background: #ccf; }\n</style>\n</head>\n<body>\n  <div class="cards">\n    <div class="card">🐍 Python</div>\n    <div class="card">🟨 JavaScript</div>\n    <div class="card">🗄️ SQL</div>\n  </div>\n</body>\n</html>\n',
        hints: ['.cards { display: flex; gap: 16px; }', '.card:hover { background: lightblue; }'],
        check: {
          type: 'web',
          tests: "const box = $('.cards'), card = $('.card');\nassert(css(box, 'display') === 'flex', '.cards should have display: flex');\nassert(parseFloat(css(box, 'column-gap')) >= 10, '.cards needs a gap of at least 10px');\nassert(parseFloat(css(card, 'padding-top')) >= 12, '.card needs padding of at least 12px');\nassert(parseFloat(css(card, 'border-top-left-radius')) >= 8, '.card needs border-radius of at least 8px');\nconst rules = [...document.styleSheets].flatMap(s => [...s.cssRules]).map(r => r.cssText).join(' ');\nassert(/\\.card:hover[^{]*\\{[^}]*background/.test(rules), 'Add a .card:hover rule that changes the background');",
        },
      },
      cards: [{ front: 'CSS box model (inside → out)', back: 'content → padding → border → margin' }],
    },
  },
  {
    track: 'web',
    after: 'web-lab-css',
    lesson: {
      id: 'web-lab-dom',
      title: '🛠️ Lab: Make it interactive (DOM & events)',
      xp: 70,
      body: `
JavaScript changes the page through the **DOM** (Document Object Model).

~~~js
const btn = document.querySelector('#plus');      // find an element
const out = document.getElementById('count');
let count = 0;
btn.addEventListener('click', () => {              // react to events
  count++;
  out.textContent = count;                         // update the page
});
~~~

Common events: \`click\`, \`input\`, \`submit\`, \`keydown\`, \`mouseover\`. Use \`textContent\` (not \`innerHTML\`) for user-provided text to avoid XSS.
`,
      exercise: {
        kind: 'code',
        lang: 'web',
        prompt: 'Make a counter: `#plus` adds 1, `#minus` subtracts 1 (never below 0), `#reset` sets it to 0. Show the value in `#count`. When the count is 10 or more, add the class `high` to `#count`.',
        starter: '<!doctype html>\n<html>\n<head>\n<style>\n  #count { font-size: 3rem; }\n  #count.high { color: crimson; }\n</style>\n</head>\n<body>\n  <div id="count">0</div>\n  <button id="minus">−</button>\n  <button id="plus">+</button>\n  <button id="reset">Reset</button>\n  <script>\n    // your code\n  </script>\n</body>\n</html>\n',
        solution: '<!doctype html>\n<html>\n<head>\n<style>\n  #count { font-size: 3rem; }\n  #count.high { color: crimson; }\n</style>\n</head>\n<body>\n  <div id="count">0</div>\n  <button id="minus">−</button>\n  <button id="plus">+</button>\n  <button id="reset">Reset</button>\n  <script>\n    let count = 0;\n    const out = document.getElementById("count");\n    function render() {\n      out.textContent = count;\n      out.classList.toggle("high", count >= 10);\n    }\n    document.getElementById("plus").addEventListener("click", () => { count++; render(); });\n    document.getElementById("minus").addEventListener("click", () => { count = Math.max(0, count - 1); render(); });\n    document.getElementById("reset").addEventListener("click", () => { count = 0; render(); });\n  </script>\n</body>\n</html>\n',
        hints: ['Keep a `let count = 0` and a render() function that writes it to #count.', "out.classList.toggle('high', count >= 10)"],
        check: {
          type: 'web',
          tests: "const n = () => $('#count').textContent.trim();\nclick($('#plus')); click($('#plus')); click($('#plus'));\nassert(n() === '3', 'After 3 clicks on + the count should be 3, got ' + n());\nclick($('#minus'));\nassert(n() === '2', '− should subtract 1, got ' + n());\nclick($('#reset')); click($('#minus'));\nassert(n() === '0', 'Reset should set 0, and − must not go below 0. Got ' + n());\nfor (let i = 0; i < 10; i++) click($('#plus'));\nassert($('#count').classList.contains('high'), '#count needs the class high at 10 or more');\nclick($('#reset'));\nassert(!$('#count').classList.contains('high'), 'Remove the high class when the count drops below 10');",
        },
      },
      cards: [{ front: 'textContent vs innerHTML', back: 'textContent inserts plain text (safe). innerHTML parses HTML (XSS risk with user input).' }],
    },
  },

  // ---------------- Networking ----------------
  {
    track: 'networking',
    after: 'net-layers',
    lesson: {
      id: 'net-lab-ip',
      title: '🛠️ Lab: IP addresses & subnets',
      xp: 60,
      body: `
An IPv4 address is just a **32-bit number** written as four bytes: \`192.168.1.10\` = 192·2²⁴ + 168·2¹⁶ + 1·2⁸ + 10.

A **subnet** like \`192.168.1.0/24\` means "the first 24 bits are the network". Two addresses are on the same network when their first 24 bits match. The **mask** for /24 is \`255.255.255.0\`.

| CIDR | Mask | Addresses |
|---|---|---|
| /8 | 255.0.0.0 | 16,777,216 |
| /16 | 255.255.0.0 | 65,536 |
| /24 | 255.255.255.0 | 256 |
| /32 | 255.255.255.255 | 1 |

Routers make this exact calculation for every packet: *is the destination on my network, or do I forward it?*
`,
      exercise: {
        kind: 'code',
        lang: 'python',
        prompt: 'Write `ip_to_int(ip)`, `int_to_ip(n)`, and `in_subnet(ip, cidr)` (e.g. `in_subnet("10.0.5.7", "10.0.0.0/16")` → True). Use bit shifting, not the `ipaddress` module.',
        starter: 'def ip_to_int(ip):\n    pass\n\ndef int_to_ip(n):\n    pass\n\ndef in_subnet(ip, cidr):\n    pass\n',
        solution: 'def ip_to_int(ip):\n    a, b, c, d = (int(x) for x in ip.split("."))\n    return (a << 24) | (b << 16) | (c << 8) | d\n\ndef int_to_ip(n):\n    return ".".join(str((n >> s) & 255) for s in (24, 16, 8, 0))\n\ndef in_subnet(ip, cidr):\n    net, bits = cidr.split("/")\n    bits = int(bits)\n    mask = (0xFFFFFFFF << (32 - bits)) & 0xFFFFFFFF if bits else 0\n    return ip_to_int(ip) & mask == ip_to_int(net) & mask\n',
        hints: ['a << 24 shifts the first byte into the top 8 bits.', 'mask = (0xFFFFFFFF << (32 - bits)) & 0xFFFFFFFF', '(n >> 8) & 255 extracts the third byte.'],
        check: {
          type: 'tests',
          code: 'assert ip_to_int("192.168.1.10") == 3232235786\nassert ip_to_int("0.0.0.0") == 0 and ip_to_int("255.255.255.255") == 4294967295\nassert int_to_ip(3232235786) == "192.168.1.10"\nassert in_subnet("10.0.5.7", "10.0.0.0/16")\nassert not in_subnet("10.1.5.7", "10.0.0.0/16")\nassert in_subnet("192.168.1.200", "192.168.1.0/24")\nassert not in_subnet("192.168.2.1", "192.168.1.0/24")\nassert in_subnet("8.8.8.8", "0.0.0.0/0")\nassert in_subnet("1.2.3.4", "1.2.3.4/32") and not in_subnet("1.2.3.5", "1.2.3.4/32")\n',
        },
      },
      cards: [{ front: 'What does /24 mean?', back: 'The first 24 bits are the network part; 256 addresses (mask 255.255.255.0).' }],
    },
  },
  {
    track: 'networking',
    after: 'net-dns-tls',
    lesson: {
      id: 'net-lab-http',
      title: '🛠️ Lab: Parse a raw HTTP request',
      xp: 70,
      body: `
Under the hood, HTTP/1.1 is **just text** sent over TCP. A web server reads bytes like these:

~~~
POST /api/login?next=%2Fhome HTTP/1.1
Host: devquest.dev
Content-Type: application/json
Content-Length: 27

{"user":"ada","pw":"hunter2"}
~~~

- **Request line:** method, path (with optional query string), version
- **Headers:** \`Name: value\` lines (names are case-insensitive)
- A **blank line**, then the optional **body**

Lines end with \`\\r\\n\`. Writing a parser is a rite of passage: it's exactly what frameworks like Flask and Express do for you.
`,
      exercise: {
        kind: 'code',
        lang: 'python',
        prompt: 'Write `parse_request(raw)` returning a dict with `method`, `path` (without the query string), `query` (dict, URL-decoded), `headers` (dict with **lower-cased** names) and `body` (string). Raise `ValueError` for a malformed request line.',
        starter: 'from urllib.parse import parse_qsl\n\ndef parse_request(raw):\n    pass\n',
        solution: 'from urllib.parse import parse_qsl\n\ndef parse_request(raw):\n    head, _, body = raw.partition("\\r\\n\\r\\n")\n    lines = head.split("\\r\\n")\n    parts = lines[0].split(" ")\n    if len(parts) != 3 or not parts[2].startswith("HTTP/"):\n        raise ValueError("bad request line")\n    method, target, _version = parts\n    path, _, qs = target.partition("?")\n    headers = {}\n    for line in lines[1:]:\n        name, _, value = line.partition(":")\n        headers[name.strip().lower()] = value.strip()\n    return {"method": method, "path": path, "query": dict(parse_qsl(qs)), "headers": headers, "body": body}\n',
        hints: ['raw.partition("\\r\\n\\r\\n") splits the head from the body.', 'target.partition("?") splits path and query string; parse_qsl decodes the query.'],
        check: {
          type: 'tests',
          code: 'raw = "POST /api/login?next=%2Fhome&x=1 HTTP/1.1\\r\\nHost: devquest.dev\\r\\nContent-Type: application/json\\r\\n\\r\\n{\\"user\\":\\"ada\\"}"\nr = parse_request(raw)\nassert r["method"] == "POST" and r["path"] == "/api/login", r\nassert r["query"] == {"next": "/home", "x": "1"}, r["query"]\nassert r["headers"]["content-type"] == "application/json" and r["headers"]["host"] == "devquest.dev", r["headers"]\nassert r["body"] == \'{"user":"ada"}\', r["body"]\nr = parse_request("GET / HTTP/1.1\\r\\n\\r\\n")\nassert r["path"] == "/" and r["query"] == {} and r["body"] == ""\ntry:\n    parse_request("NONSENSE\\r\\n\\r\\n"); assert False, "expected ValueError"\nexcept ValueError:\n    pass\n',
        },
      },
      cards: [{ front: 'Parts of an HTTP request', back: 'Request line (method, path, version), headers, blank line, optional body.' }],
    },
  },

  // ---------------- Systems ----------------
  {
    track: 'systems',
    after: 'sys-os',
    lesson: {
      id: 'sys-lab-scheduler',
      title: '🛠️ Lab: Simulate a CPU scheduler',
      xp: 80,
      body: `
Operating systems share one CPU between many processes by giving each a short **time slice** (quantum) in turn: **round-robin scheduling**.

{{ill:threads}}

Example with quantum = 2:

| Process | Arrives | Needs |
|---|---|---|
| A | 0 | 5 |
| B | 1 | 3 |
| C | 2 | 1 |

Timeline: \`A A B B C A A B A\`. A runs 2 units, then goes to the back of the queue. Processes that **arrive** during a slice join the queue *before* the preempted process.

**Turnaround time** = finish time − arrival time. Schedulers trade fairness, responsiveness and throughput.
`,
      exercise: {
        kind: 'code',
        lang: 'python',
        prompt: 'Write `round_robin(procs, quantum)` where `procs` is a list of `(name, arrival, burst)`. Return `(timeline, finish)`: `timeline` is a string with one letter per time unit (`"."` when the CPU is idle), and `finish` maps name → finish time.',
        starter: 'from collections import deque\n\ndef round_robin(procs, quantum):\n    timeline = []\n    finish = {}\n    # your simulation\n    return "".join(timeline), finish\n',
        solution: 'from collections import deque\n\ndef round_robin(procs, quantum):\n    pending = sorted(procs, key=lambda p: p[1])\n    remaining = {n: b for n, _, b in procs}\n    queue, timeline, finish = deque(), [], {}\n    t, i = 0, 0\n\n    def admit(now):\n        nonlocal i\n        while i < len(pending) and pending[i][1] <= now:\n            queue.append(pending[i][0])\n            i += 1\n\n    admit(t)\n    while queue or i < len(pending):\n        if not queue:\n            timeline.append(".")\n            t += 1\n            admit(t)\n            continue\n        name = queue.popleft()\n        for _ in range(min(quantum, remaining[name])):\n            timeline.append(name)\n            remaining[name] -= 1\n            t += 1\n            admit(t)\n        if remaining[name]:\n            queue.append(name)\n        else:\n            finish[name] = t\n    return "".join(timeline), finish\n',
        hints: ['Keep a deque of ready process names and a dict of remaining time.', 'After each time unit, admit newly arrived processes BEFORE re-queueing the one that just ran.', 'If nothing is ready, record "." and advance time.'],
        check: {
          type: 'tests',
          code: 'tl, fin = round_robin([("A", 0, 5), ("B", 1, 3), ("C", 2, 1)], 2)\nassert tl == "AABBCAABA", tl\nassert fin == {"C": 5, "B": 8, "A": 9}, fin\ntl, fin = round_robin([("A", 2, 2)], 3)\nassert tl == "..AA" and fin == {"A": 4}, (tl, fin)\ntl, _ = round_robin([("X", 0, 3), ("Y", 0, 3)], 1)\nassert tl == "XYXYXY", tl\n',
        },
      },
      cards: [{ front: 'Round-robin scheduling', back: 'Each ready process runs for one quantum, then goes to the back of the queue.' }],
    },
  },

  // ---------------- DevOps ----------------
  {
    track: 'devops',
    after: 'ops-cicd',
    lesson: {
      id: 'ops-lab-logs',
      title: '🛠️ Lab: Monitor a service from its logs',
      xp: 80,
      body: `
On-call engineers answer questions like *"is the error rate spiking?"* and *"how slow are the slowest requests?"* from logs and metrics.

**Percentiles** matter more than averages: if p50 latency is 80 ms but **p95** is 2 s, one in twenty users has a terrible experience. Service Level Objectives (SLOs) are usually written as percentiles: *"95% of requests under 300 ms"*.

The **nearest-rank** p-th percentile of a sorted list of n values is the value at position ⌈p/100 · n⌉ (1-based).

Structured logs make this easy:

~~~
2026-10-12T10:00:01Z GET /api/users 200 84ms
2026-10-12T10:00:02Z POST /api/orders 500 1203ms
~~~
`,
      exercise: {
        kind: 'code',
        lang: 'python',
        prompt: 'Write `analyze(log_text)` returning a dict: `requests` (count of valid lines), `error_rate` (share of 5xx statuses, rounded to 3 decimals), `p95` (nearest-rank 95th percentile latency in ms, int), and `slowest_path` (path with the highest **average** latency). Ignore malformed lines.',
        starter: 'import math\n\ndef analyze(log_text):\n    pass\n',
        solution: 'import math\n\ndef analyze(log_text):\n    rows = []\n    for line in log_text.splitlines():\n        parts = line.split()\n        if len(parts) != 5 or not parts[4].endswith("ms"):\n            continue\n        try:\n            status, ms = int(parts[3]), int(parts[4][:-2])\n        except ValueError:\n            continue\n        rows.append((parts[2], status, ms))\n    if not rows:\n        return {"requests": 0, "error_rate": 0.0, "p95": 0, "slowest_path": None}\n    lat = sorted(ms for _, _, ms in rows)\n    p95 = lat[math.ceil(0.95 * len(lat)) - 1]\n    by_path = {}\n    for path, _, ms in rows:\n        by_path.setdefault(path, []).append(ms)\n    slowest = max(by_path, key=lambda p: sum(by_path[p]) / len(by_path[p]))\n    errors = sum(1 for _, s, _ in rows if 500 <= s <= 599)\n    return {"requests": len(rows), "error_rate": round(errors / len(rows), 3), "p95": p95, "slowest_path": slowest}\n',
        hints: ['line.split() gives [timestamp, method, path, status, "123ms"].', 'p95 index: math.ceil(0.95 * n) - 1 in the sorted latencies.'],
        check: {
          type: 'tests',
          code: 'lines = [f"2026-10-12T10:00:{i:02d}Z GET /api/users 200 {50 + i}ms" for i in range(18)]\nlines += ["2026-10-12T10:01:00Z POST /api/orders 500 1200ms", "2026-10-12T10:01:01Z POST /api/orders 503 900ms", "garbage line", "x y z 200 fastms"]\nr = analyze("\\n".join(lines))\nassert r["requests"] == 20, r\nassert r["error_rate"] == 0.1, r\nassert r["p95"] == 900, r\nassert r["slowest_path"] == "/api/orders", r\nassert analyze("")["requests"] == 0\n',
        },
      },
      cards: [{ front: 'Why use p95/p99 latency instead of the average?', back: 'Averages hide the slow tail; percentiles show what the unluckiest users experience.' }],
    },
  },

  // ---------------- Architecture ----------------
  {
    track: 'architecture',
    after: 'arch-scaling',
    lesson: {
      id: 'arch-lab-ratelimit',
      title: '🛠️ Lab: Build a rate limiter',
      xp: 80,
      body: `
APIs protect themselves with **rate limiting**. The classic algorithm is the **token bucket**:

- A bucket holds up to \`capacity\` tokens and starts full.
- Tokens refill continuously at \`rate\` tokens per second (never above capacity).
- Each request takes one token. No token → reject with **HTTP 429 Too Many Requests**.

This allows short **bursts** (up to capacity) while enforcing an average rate. Stripe, GitHub and AWS all use variants of it, usually storing buckets in Redis so every app server shares them.
`,
      exercise: {
        kind: 'code',
        lang: 'python',
        prompt: 'Implement `TokenBucket(capacity, rate)` with `allow(now)` that returns True/False. `now` is the current time in seconds (passed in so it\'s testable). Refill lazily based on time elapsed since the last call.',
        starter: 'class TokenBucket:\n    def __init__(self, capacity, rate):\n        pass\n\n    def allow(self, now):\n        pass\n',
        solution: 'class TokenBucket:\n    def __init__(self, capacity, rate):\n        self.capacity = capacity\n        self.rate = rate\n        self.tokens = capacity\n        self.last = None\n\n    def allow(self, now):\n        if self.last is not None:\n            self.tokens = min(self.capacity, self.tokens + (now - self.last) * self.rate)\n        self.last = now\n        if self.tokens >= 1:\n            self.tokens -= 1\n            return True\n        return False\n',
        hints: ['Store tokens (a float) and the time of the last call.', 'tokens = min(capacity, tokens + elapsed * rate), then spend one if tokens >= 1.'],
        check: {
          type: 'tests',
          code: 'b = TokenBucket(3, 1)\nassert [b.allow(0) for _ in range(4)] == [True, True, True, False], "burst of 3 then reject"\nassert b.allow(0.5) is False, "only half a token refilled"\nassert b.allow(1.0) is True, "one token refilled after 1 second"\nassert b.allow(1.0) is False\nassert [b.allow(100) for _ in range(4)] == [True, True, True, False], "refill never exceeds capacity"\n',
        },
      },
      cards: [{ front: 'Token bucket', back: 'Bucket of up to N tokens refilling at rate r; each request spends one. Allows bursts, enforces an average rate.' }],
    },
  },
  {
    track: 'architecture',
    after: 'arch-interview',
    lesson: {
      id: 'arch-lab-shortener',
      title: '🛠️ Lab: The URL shortener core',
      xp: 80,
      body: `
Let's build the heart of the URL shortener you designed: turning numeric IDs into short codes with **base62** (\`0-9a-zA-Z\`), and a store that maps codes to URLs.

Base62 works like base 10, but with 62 digits: id 125 = 2·62 + 1 → \`"21"\`. Seven characters cover 62⁷ ≈ 3.5 trillion URLs.

Because codes come from an incrementing ID, they're unique without collisions. Real systems hand out ID ranges to each server so they don't need to coordinate per request.
`,
      exercise: {
        kind: 'code',
        lang: 'python',
        prompt: 'Write `encode(n)` / `decode(code)` for base62 using `ALPHABET`, and a `Shortener` class with `shorten(url)` (same URL → same code; invalid URLs not starting with http:// or https:// raise `ValueError`) and `resolve(code)` (unknown → `None`) and `clicks(code)` (how many times `resolve` succeeded).',
        starter: 'ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"\n\ndef encode(n):\n    pass\n\ndef decode(code):\n    pass\n\nclass Shortener:\n    def __init__(self):\n        pass\n',
        solution: 'ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"\n\ndef encode(n):\n    if n == 0:\n        return ALPHABET[0]\n    out = []\n    while n:\n        n, r = divmod(n, 62)\n        out.append(ALPHABET[r])\n    return "".join(reversed(out))\n\ndef decode(code):\n    n = 0\n    for ch in code:\n        n = n * 62 + ALPHABET.index(ch)\n    return n\n\nclass Shortener:\n    def __init__(self):\n        self.next_id = 1000\n        self.by_code = {}\n        self.by_url = {}\n        self.hits = {}\n\n    def shorten(self, url):\n        if not url.startswith(("http://", "https://")):\n            raise ValueError("invalid URL")\n        if url in self.by_url:\n            return self.by_url[url]\n        code = encode(self.next_id)\n        self.next_id += 1\n        self.by_code[code] = url\n        self.by_url[url] = code\n        self.hits[code] = 0\n        return code\n\n    def resolve(self, code):\n        url = self.by_code.get(code)\n        if url:\n            self.hits[code] += 1\n        return url\n\n    def clicks(self, code):\n        return self.hits.get(code, 0)\n',
        hints: ['encode: repeatedly divmod(n, 62) and collect remainders, then reverse.', 'decode: n = n * 62 + ALPHABET.index(ch)'],
        check: {
          type: 'tests',
          code: 'assert encode(0) == "0" and encode(61) == "Z" and encode(62) == "10" and encode(125) == "21"\nfor n in [1, 99, 3843, 10**12]:\n    assert decode(encode(n)) == n\ns = Shortener()\na = s.shorten("https://devquest.dev/lessons/python")\nassert s.shorten("https://devquest.dev/lessons/python") == a, "same URL should give the same code"\nb = s.shorten("http://example.com")\nassert a != b\nassert s.resolve(a) == "https://devquest.dev/lessons/python" and s.resolve("nope") is None\ns.resolve(a)\nassert s.clicks(a) == 2 and s.clicks(b) == 0\ntry:\n    s.shorten("javascript:alert(1)"); assert False, "expected ValueError"\nexcept ValueError:\n    pass\n',
        },
      },
      cards: [{ front: 'Why base62 for short URLs?', back: 'URL-safe characters only, and 7 chars give ~3.5 trillion unique codes.' }],
    },
  },

  // ---------------- AI ----------------
  {
    track: 'ai',
    after: 'ai-ml',
    lesson: {
      id: 'ai-lab-regression',
      title: '🛠️ Lab: Train a model with gradient descent',
      xp: 90,
      body: `
Let's train the simplest machine-learning model from scratch: a straight line **y = w·x + b**.

1. Start with w = 0, b = 0.
2. **Loss** = mean squared error: average of (prediction − y)².
3. Compute the **gradients** (how the loss changes when w or b change):
   - ∂L/∂w = (2/n) Σ (pred − y)·x
   - ∂L/∂b = (2/n) Σ (pred − y)
4. Step downhill: w -= lr · ∂L/∂w, b -= lr · ∂L/∂b
5. Repeat for many **epochs**.

Neural networks with billions of parameters train with this exact loop, just with more parameters and automatic differentiation.
`,
      exercise: {
        kind: 'code',
        lang: 'python',
        prompt: 'Write `train(xs, ys, lr=0.01, epochs=2000)` returning `(w, b)` learned by gradient descent, and `mse(xs, ys, w, b)`. No numpy needed.',
        starter: 'def mse(xs, ys, w, b):\n    pass\n\ndef train(xs, ys, lr=0.01, epochs=2000):\n    w, b = 0.0, 0.0\n    # your loop\n    return w, b\n\nxs = [1, 2, 3, 4, 5]\nys = [3.1, 4.9, 7.2, 8.8, 11.1]   # roughly y = 2x + 1\nw, b = train(xs, ys)\nprint(f"y = {w:.2f}x + {b:.2f}  (loss {mse(xs, ys, w, b):.4f})")\n',
        solution: 'def mse(xs, ys, w, b):\n    return sum((w * x + b - y) ** 2 for x, y in zip(xs, ys)) / len(xs)\n\ndef train(xs, ys, lr=0.01, epochs=2000):\n    w, b = 0.0, 0.0\n    n = len(xs)\n    for _ in range(epochs):\n        errs = [w * x + b - y for x, y in zip(xs, ys)]\n        dw = 2 / n * sum(e * x for e, x in zip(errs, xs))\n        db = 2 / n * sum(errs)\n        w -= lr * dw\n        b -= lr * db\n    return w, b\n\nxs = [1, 2, 3, 4, 5]\nys = [3.1, 4.9, 7.2, 8.8, 11.1]\nw, b = train(xs, ys)\nprint(f"y = {w:.2f}x + {b:.2f}  (loss {mse(xs, ys, w, b):.4f})")\n',
        hints: ['Each epoch: compute errors = pred - y for every point, then the two gradients, then update w and b.'],
        check: {
          type: 'tests',
          code: 'assert abs(mse([1, 2], [2, 4], 2, 0)) < 1e-12\nassert abs(mse([1, 2], [0, 0], 1, 0) - 2.5) < 1e-12\nw, b = train([0, 1, 2, 3, 4], [1, 3, 5, 7, 9], lr=0.02, epochs=3000)\nassert abs(w - 2) < 0.05 and abs(b - 1) < 0.1, (w, b)\nw2, b2 = train([1, 2, 3], [-1, -2, -3], lr=0.05, epochs=3000)\nassert abs(w2 + 1) < 0.05 and abs(b2) < 0.1, (w2, b2)\n',
        },
      },
      cards: [{ front: 'Gradient descent update rule', back: 'parameter -= learning_rate × gradient_of_loss' }],
    },
  },
  {
    track: 'ai',
    after: 'ai-llm',
    lesson: {
      id: 'ai-lab-semantic',
      title: '🛠️ Lab: Semantic search with embeddings',
      xp: 90,
      body: `
RAG systems find relevant documents by comparing **embedding vectors**. The standard measure is **cosine similarity**, the cosine of the angle between two vectors:

**cos(a, b) = (a · b) / (‖a‖ · ‖b‖)**

1 = same direction (same meaning), 0 = unrelated, −1 = opposite.

Real embeddings have hundreds of dimensions and come from a model. Here we use tiny hand-made 4-dimensional vectors so you can see the mechanics: *[programming, cooking, sports, music]*.
`,
      exercise: {
        kind: 'code',
        lang: 'python',
        prompt: 'Write `cosine(a, b)` (return 0 if either vector is all zeros) and `top_k(query_vec, docs, k)` where `docs` maps title → vector; return the `k` most similar titles, best first.',
        starter: 'import math\n\ndef cosine(a, b):\n    pass\n\ndef top_k(query_vec, docs, k=2):\n    pass\n\nDOCS = {\n    "Learn Python": [0.9, 0.0, 0.1, 0.0],\n    "Pasta recipes": [0.0, 0.95, 0.0, 0.1],\n    "Football tactics": [0.05, 0.0, 0.9, 0.1],\n    "Coding playlists": [0.6, 0.0, 0.0, 0.7],\n}\nprint(top_k([1, 0, 0, 0.2], DOCS))\n',
        solution: 'import math\n\ndef cosine(a, b):\n    dot = sum(x * y for x, y in zip(a, b))\n    na = math.sqrt(sum(x * x for x in a))\n    nb = math.sqrt(sum(y * y for y in b))\n    return dot / (na * nb) if na and nb else 0.0\n\ndef top_k(query_vec, docs, k=2):\n    ranked = sorted(docs, key=lambda t: cosine(query_vec, docs[t]), reverse=True)\n    return ranked[:k]\n\nDOCS = {\n    "Learn Python": [0.9, 0.0, 0.1, 0.0],\n    "Pasta recipes": [0.0, 0.95, 0.0, 0.1],\n    "Football tactics": [0.05, 0.0, 0.9, 0.1],\n    "Coding playlists": [0.6, 0.0, 0.0, 0.7],\n}\nprint(top_k([1, 0, 0, 0.2], DOCS))\n',
        hints: ['Dot product: sum(x * y for x, y in zip(a, b))', 'Length: math.sqrt(sum(x * x for x in a))'],
        check: {
          type: 'tests',
          code: 'assert abs(cosine([1, 0], [1, 0]) - 1) < 1e-9\nassert abs(cosine([1, 0], [0, 1])) < 1e-9\nassert abs(cosine([1, 2], [-1, -2]) + 1) < 1e-9\nassert cosine([0, 0], [1, 1]) == 0\nassert top_k([1, 0, 0, 0.2], DOCS) == ["Learn Python", "Coding playlists"], top_k([1, 0, 0, 0.2], DOCS)\nassert top_k([0, 0, 0, 1], DOCS, 1) == ["Coding playlists"]\n',
        },
      },
      cards: [{ front: 'Cosine similarity', back: '(a·b) / (|a| |b|): 1 means same direction (similar meaning), 0 unrelated.' }],
    },
  },
];
