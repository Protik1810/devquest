import type { Track } from './types';

export const systems: Track = {
  id: 'systems',
  title: 'Systems: C, Memory & Concurrency',
  icon: '⚙️',
  tier: 4,
  color: '#ef4444',
  blurb: 'Pointers, the stack and heap, processes vs threads, race conditions and OS internals.',
  depth: 'overview',
  lessons: [
    {
      id: 'sys-memory',
      title: 'Memory: stack, heap & pointers',
      xp: 45,
      body: `
Every running program gets memory split into regions:

{{ill:memory}}

- **Stack**: function call frames and local variables. Super fast; memory is freed automatically when a function returns. Limited size (a few MB), which is why deep recursion → **stack overflow**.
- **Heap**: memory you request at run time for data whose size or lifetime isn't known in advance. Must be freed, either **manually** (C/C++) or by a **garbage collector** (Python, Java, Go, JS).

**C** gives you direct control via **pointers**: variables that hold a memory **address**.

~~~c
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int x = 42;          // on the stack
    int *p = &x;         // p holds the ADDRESS of x
    printf("%d\\n", *p); // *p dereferences: 42

    int *arr = malloc(5 * sizeof(int));   // on the heap
    if (!arr) return 1;
    arr[0] = 7;
    free(arr);           // you MUST free it, or it leaks
    return 0;
}
~~~

**Classic C bugs:** memory **leaks** (forgot \`free\`), **use-after-free**, **buffer overflows** (writing past an array's end, the root of many security exploits), **null pointer** dereference. Memory-safe languages like **Rust** prevent these at compile time with **ownership and borrowing**; garbage-collected languages trade some speed for safety.
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'Where do local variables of a function usually live?', options: ['Heap', 'Stack', 'Disk', 'CPU register file only'], answer: 1 },
          { q: 'In C, what does `&x` give you?', options: ['The value of x', 'The address of x', 'A copy of x', 'x squared'], answer: 1 },
          { q: 'Memory from `malloc` that is never freed causes…', options: ['A stack overflow', 'A memory leak', 'A syntax error', 'Faster code'], answer: 1 },
          { q: 'How does Rust prevent use-after-free?', options: ['A garbage collector', 'Ownership & borrowing rules checked at compile time', 'It does not', 'Runtime sandboxing'], answer: 1 },
        ],
      },
      cards: [
        { front: 'Stack vs heap', back: 'Stack: automatic, fast, function-scoped. Heap: dynamic, manual or GC-managed, larger.' },
        { front: 'Pointer', back: 'A variable holding a memory address. *p dereferences it; &x takes an address.' },
      ],
    },
    {
      id: 'sys-concurrency',
      title: 'Processes, threads & concurrency',
      xp: 50,
      body: `
- A **process** is a running program with its **own memory space**. Processes are isolated; a crash in one doesn't corrupt another.
- A **thread** is a unit of execution *inside* a process. Threads **share** the process's memory, which makes them cheap to communicate but dangerous.

{{ill:threads}}

**Concurrency** = dealing with many things at once (interleaving). **Parallelism** = doing many things at the same instant (multiple CPU cores).

**Race condition:** two threads read-modify-write the same variable and updates get lost:

~~~
Thread A: read count (5)        Thread B: read count (5)
Thread A: write count = 6       Thread B: write count = 6   ← should be 7!
~~~

**Tools to stay safe:**
- **Mutex/lock**: only one thread enters a critical section at a time
- **Atomic operations**: indivisible updates
- **Message passing / channels**: share memory by communicating (Go's motto)
- **Immutability**: data that never changes can't race

⚠️ **Deadlock:** thread A holds lock 1 and waits for lock 2, while thread B holds lock 2 and waits for lock 1. Both wait forever. Fix: always acquire locks in the same order.

| Language | Concurrency model |
|---|---|
| Go | goroutines + channels |
| JavaScript | single thread + event loop (+ workers) |
| Python | threads (limited by the GIL for CPU work), asyncio, multiprocessing |
| Rust | threads + compile-time data-race prevention, async |
| Java/C# | threads, thread pools, virtual threads / async-await |
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'Threads within one process…', options: ['Have separate memory', 'Share the same memory', 'Cannot run in parallel', 'Are the same as processes'], answer: 1 },
          { q: 'Two threads each wait for a lock the other holds. This is…', options: ['A race condition', 'A deadlock', 'A memory leak', 'Parallelism'], answer: 1 },
          { q: 'Which prevents two threads entering a critical section at once?', options: ['A mutex', 'A comment', 'A loop', 'A pointer'], answer: 0 },
          { q: 'Go\'s main concurrency primitives are…', options: ['Promises', 'Goroutines and channels', 'Actors only', 'Callbacks'], answer: 1 },
        ],
      },
      cards: [
        { front: 'Concurrency vs parallelism', back: 'Concurrency: structuring many tasks that overlap in time. Parallelism: literally running at the same time on multiple cores.' },
        { front: 'Race condition', back: 'Result depends on unpredictable timing of threads accessing shared data.' },
      ],
    },
    {
      id: 'sys-os',
      title: 'OS internals: scheduling, virtual memory, file systems',
      xp: 45,
      body: `
**CPU scheduling:** the kernel gives each runnable thread a short **time slice** (a few ms), then performs a **context switch** (saving registers, loading the next thread). Schedulers balance fairness, responsiveness and throughput (Linux uses **EEVDF/CFS**).

**Virtual memory:** each process sees its own private address space. The CPU's **MMU** translates virtual addresses to physical RAM in **pages** (usually 4 KB) via **page tables**. Benefits: isolation, and the illusion of more memory than you have (unused pages can be swapped to disk). A **page fault** happens when a page isn't in RAM yet.

**File systems** (ext4, NTFS, APFS, btrfs) organize disk blocks into files and directories using **inodes**/metadata, **journaling** for crash safety, and caching.

**Memory hierarchy** (approximate latencies):

| Level | Latency | Size |
|---|---|---|
| CPU register | < 1 ns | bytes |
| L1 cache | ~1 ns | 32–64 KB |
| L2 / L3 cache | 4–40 ns | MBs |
| RAM | ~100 ns | GBs |
| SSD | ~100 µs | TBs |
| Network (same region) | ~0.5 ms | ∞ |
| Network (across the world) | ~150 ms | ∞ |

Knowing these numbers helps you guess where a program spends its time.
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'What translates virtual addresses to physical ones?', options: ['The GPU', 'The MMU using page tables', 'The compiler', 'The shell'], answer: 1 },
          { q: 'Saving one thread\'s state and loading another\'s is called…', options: ['Paging', 'A context switch', 'Forking', 'Linking'], answer: 1 },
          { q: 'Which is fastest?', options: ['RAM', 'SSD', 'L1 cache', 'Network'], answer: 2 },
        ],
      },
      cards: [{ front: 'Page fault', back: 'Accessing a virtual page not currently in RAM; the OS loads it (or errors if invalid).' }],
    },
  ],
};

export const networking: Track = {
  id: 'networking',
  title: 'Networking',
  icon: '🌐',
  tier: 4,
  color: '#14b8a6',
  blurb: 'The OSI/TCP-IP layers, IP, TCP vs UDP, DNS, TLS and how packets find their way.',
  depth: 'overview',
  lessons: [
    {
      id: 'net-layers',
      title: 'The network layers',
      xp: 45,
      body: `
Networking is built in **layers**. Each layer only talks to the one above and below it, and wraps the data in its own **header** (**encapsulation**).

{{ill:osi}}

| TCP/IP layer | OSI layers | Job | Examples |
|---|---|---|---|
| Application | 7, 6, 5 | what apps say | HTTP, DNS, SSH, SMTP |
| Transport | 4 | process-to-process delivery | **TCP**, **UDP** |
| Internet | 3 | host-to-host routing | **IP**, ICMP (ping) |
| Link | 2, 1 | the local wire/radio | Ethernet, Wi-Fi, MAC addresses |

**IP addresses:** IPv4 like \`192.168.1.10\` (4.3 billion addresses, running out); IPv6 like \`2001:db8::1\` (practically unlimited). **Private ranges** (\`10.x\`, \`192.168.x\`) are used at home and behind **NAT**, which lets many devices share one public IP.

**Ports** (0–65535) identify the program on a host: 22 SSH, 53 DNS, 80 HTTP, 443 HTTPS, 5432 PostgreSQL.
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'Which layer does IP belong to?', options: ['Application', 'Transport', 'Internet/Network', 'Link'], answer: 2 },
          { q: 'Which is a private IPv4 address?', options: ['8.8.8.8', '192.168.0.12', '142.250.1.1', '1.1.1.1'], answer: 1 },
          { q: 'Default SSH port?', options: ['21', '22', '80', '3306'], answer: 1 },
        ],
      },
      cards: [{ front: 'Encapsulation', back: 'Each layer wraps the data from the layer above with its own header.' }],
    },
    {
      id: 'net-tcp',
      title: 'TCP vs UDP',
      xp: 45,
      body: `
**TCP** (Transmission Control Protocol) gives you a **reliable, ordered byte stream**. It opens a connection with a **three-way handshake**:

{{ill:tcp}}

TCP numbers every byte, **acknowledges** what arrives, **retransmits** what's lost, and controls speed (**flow & congestion control**). The cost is extra round trips and latency.

**UDP** (User Datagram Protocol) just fires packets ("datagrams"): no handshake, no guarantees, no ordering. That makes it fast and lightweight.

| | TCP | UDP |
|---|---|---|
| Connection | yes (handshake) | no |
| Reliable & ordered | ✅ | ❌ |
| Speed / overhead | slower | faster |
| Used by | web (HTTP/1, 2), SSH, email, databases | video calls, games, DNS, streaming, **QUIC/HTTP-3** |

**HTTP/3** runs on **QUIC**, which builds reliability on top of UDP to avoid TCP's head-of-line blocking.
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'The TCP handshake is…', options: ['SYN, SYN-ACK, ACK', 'HELLO, OK', 'GET, 200', 'PING, PONG'], answer: 0 },
          { q: 'Best protocol for a fast-paced online game\'s position updates?', options: ['TCP', 'UDP', 'FTP', 'SMTP'], answer: 1 },
          { q: 'HTTP/3 runs on top of…', options: ['TCP', 'QUIC over UDP', 'ICMP', 'Ethernet directly'], answer: 1 },
        ],
      },
      cards: [{ front: 'TCP three-way handshake', back: 'SYN → SYN-ACK → ACK' }],
    },
    {
      id: 'net-dns-tls',
      title: 'DNS & TLS',
      xp: 45,
      body: `
**DNS** (Domain Name System) is the internet's phone book: it turns \`devquest.dev\` into an IP address.

{{ill:dns}}

Your OS asks a **recursive resolver** (from your ISP, or 1.1.1.1 / 8.8.8.8). It asks a **root server** → the **TLD server** (\`.dev\`) → the domain's **authoritative server**, then caches the answer for its **TTL**.

Common record types: **A** (IPv4), **AAAA** (IPv6), **CNAME** (alias), **MX** (mail), **TXT** (verification, SPF), **NS** (name servers).

**TLS** (the S in HTTPS) provides **encryption**, **integrity** and **authentication**:
1. The server presents a **certificate** signed by a trusted **Certificate Authority** proving it owns the domain.
2. Client and server use **asymmetric crypto** (public/private keys, e.g. ECDHE) to agree on a shared secret.
3. All further data is encrypted with fast **symmetric crypto** (AES-GCM, ChaCha20).

Try it: \`nslookup example.com\` (any OS), \`dig example.com\` (Linux/macOS), \`curl -v https://example.com\` shows the TLS handshake.
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'Which DNS record maps a name to an IPv4 address?', options: ['MX', 'A', 'CNAME', 'TXT'], answer: 1 },
          { q: 'What proves a website really is who it claims?', options: ['Its logo', 'A TLS certificate signed by a CA', 'Its IP address', 'The port number'], answer: 1 },
          { q: 'Bulk HTTPS data is encrypted with…', options: ['Asymmetric crypto only', 'Symmetric crypto (e.g. AES) after the key exchange', 'Base64', 'No encryption'], answer: 1 },
        ],
      },
      cards: [{ front: 'Symmetric vs asymmetric encryption', back: 'Symmetric: same key both ways, fast. Asymmetric: public/private key pair, used for key exchange & signatures.' }],
    },
  ],
};

export const web: Track = {
  id: 'web',
  title: 'Web Development',
  icon: '🕸️',
  tier: 5,
  color: '#ec4899',
  blurb: 'HTML, CSS, HTTP, REST APIs, frontend frameworks, backends and web security.',
  depth: 'overview',
  lessons: [
    {
      id: 'web-html',
      title: 'HTML, CSS & the browser',
      xp: 40,
      body: `
A web page is built from three languages:
- **HTML**: structure & meaning (headings, paragraphs, buttons, forms)
- **CSS**: presentation (colors, layout, fonts, animations)
- **JavaScript**: behavior (interactivity, fetching data)

~~~html
<!doctype html>
<html>
  <head>
    <title>My page</title>
    <link rel="stylesheet" href="style.css">
  </head>
  <body>
    <h1 class="title">Hello</h1>
    <button id="btn">Click me</button>
    <script src="app.js"></script>
  </body>
</html>
~~~

~~~css
.title { color: rebeccapurple; font-size: 2rem; }
.grid  { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
.row   { display: flex; justify-content: space-between; align-items: center; }
@media (max-width: 600px) { .grid { grid-template-columns: 1fr; } }  /* responsive */
~~~

**How the browser renders:** parse HTML → **DOM** tree; parse CSS → **CSSOM**; combine into a **render tree**; **layout** (compute positions) → **paint** → **composite**. JavaScript can change the DOM, which may trigger re-layout. That's why heavy DOM manipulation is slow and frameworks batch updates.

**Accessibility** matters: use semantic tags (\`<button>\`, \`<nav>\`, \`<main>\`), \`alt\` text on images, labels on inputs, and enough color contrast.
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'Which language defines page structure?', options: ['CSS', 'HTML', 'SQL', 'JSON'], answer: 1 },
          { q: 'The browser\'s tree representation of HTML is the…', options: ['DOM', 'API', 'CDN', 'JVM'], answer: 0 },
          { q: 'Which CSS feature lays out items in a single row or column?', options: ['Flexbox', 'Tables', 'float only', 'z-index'], answer: 0 },
        ],
      },
      cards: [{ front: 'DOM', back: 'Document Object Model: the tree of nodes the browser builds from HTML, editable by JavaScript.' }],
    },
    {
      id: 'web-http',
      title: 'HTTP & REST APIs',
      xp: 50,
      body: `
**HTTP** is a request/response protocol between a client and a server.

{{ill:http}}

**Methods** (verbs): \`GET\` read, \`POST\` create, \`PUT\` replace, \`PATCH\` update part, \`DELETE\` remove.

**Status codes:**
| Range | Meaning | Examples |
|---|---|---|
| 2xx | success | 200 OK, 201 Created, 204 No Content |
| 3xx | redirect | 301 Moved Permanently, 304 Not Modified |
| 4xx | **client** error | 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 429 Too Many Requests |
| 5xx | **server** error | 500 Internal Server Error, 502 Bad Gateway, 503 Unavailable |

**Headers** carry metadata: \`Content-Type: application/json\`, \`Authorization: Bearer <token>\`, \`Cache-Control\`. HTTP is **stateless**: each request stands alone, so state lives in **cookies**, **tokens** or the database.

**REST** is a style for designing APIs around **resources** and HTTP verbs:

~~~
GET    /users          list users
POST   /users          create a user
GET    /users/42       get user 42
PATCH  /users/42       update user 42
DELETE /users/42       delete user 42
GET    /users/42/orders  nested resource
~~~

Alternatives: **GraphQL** (client asks for exactly the fields it needs), **gRPC** (fast binary RPC between services), **WebSockets** (two-way real-time).
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'Which status means "you are not logged in"?', options: ['200', '401', '404', '500'], answer: 1 },
          { q: 'Which method should create a new resource?', options: ['GET', 'POST', 'DELETE', 'HEAD'], answer: 1 },
          { q: 'A 5xx status means…', options: ['Client error', 'Server error', 'Success', 'Redirect'], answer: 1 },
          { q: 'HTTP is stateless. This means…', options: ['It cannot send data', 'Each request is independent', 'It has no headers', 'It only works once'], answer: 1 },
        ],
      },
      cards: [
        { front: '401 vs 403', back: '401 Unauthorized = not authenticated. 403 Forbidden = authenticated but not allowed.' },
        { front: 'REST', back: 'API style: resources at URLs, manipulated with HTTP verbs, stateless requests.' },
      ],
    },
    {
      id: 'web-stack',
      title: 'Frontend frameworks & backends',
      xp: 45,
      body: `
**Frontend frameworks** turn UI into **components** that re-render when **state** changes:

~~~jsx
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>Clicked {count} times</button>;
}
~~~

| Framework | Notes |
|---|---|
| **React** | most popular; huge ecosystem (Next.js for full-stack) |
| **Vue** | approachable, great docs (Nuxt) |
| **Svelte** | compiles away the framework, very fast (SvelteKit) |
| **Angular** | batteries-included, enterprise |

**Rendering strategies:** CSR (client renders), SSR (server renders HTML per request), SSG (pre-built HTML at deploy time), and hybrids/islands.

**Backends** receive HTTP requests, apply business logic, talk to databases and return responses:

| Language | Popular frameworks |
|---|---|
| Python | FastAPI, Django, Flask |
| JavaScript/TS | Express, Fastify, NestJS, Hono |
| Go | net/http (std lib), Gin, Echo |
| Java/Kotlin | Spring Boot, Ktor |
| C# | ASP.NET Core |
| Rust | Axum, Actix |
| Ruby / PHP | Rails / Laravel |

**Auth basics:** never store plain passwords; hash them with **bcrypt/argon2**. Sessions use cookies; APIs often use **JWTs** or OAuth 2.0 / OpenID Connect ("Sign in with Google").
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'In React, what triggers a component to re-render?', options: ['A state change', 'A CSS change', 'A comment', 'A console.log'], answer: 0 },
          { q: 'How should passwords be stored?', options: ['Plain text', 'Base64', 'Hashed with bcrypt/argon2', 'Encrypted with a key in the code'], answer: 2 },
          { q: 'SSG means…', options: ['HTML generated at build time', 'Server sends JSON only', 'Single server gateway', 'Secure socket gate'], answer: 0 },
        ],
      },
      cards: [{ front: 'Password storage', back: 'Use a slow, salted hash: argon2id or bcrypt. Never plain text or reversible encryption.' }],
    },
    {
      id: 'web-security',
      title: 'Web security essentials (OWASP)',
      xp: 50,
      body: `
The most common ways web apps get hacked, and how to prevent them:

| Attack | What happens | Defense |
|---|---|---|
| **SQL injection** | user input becomes part of an SQL query | parameterized queries / ORM |
| **XSS** (cross-site scripting) | attacker's JS runs in other users' browsers | escape output, frameworks auto-escape, Content-Security-Policy |
| **CSRF** | another site makes the user's browser send authenticated requests | SameSite cookies, CSRF tokens |
| **Broken access control** | user changes \`/orders/41\` → \`/orders/42\` and sees someone else's data | check authorization on *every* request, server-side |
| **Secrets leaks** | API keys committed to Git | env vars, secret managers, \`.gitignore\`, rotate keys |
| **Vulnerable dependencies** | old library with a known CVE | \`npm audit\`, Dependabot, keep updated |
| **SSRF** | server is tricked into fetching internal URLs | allow-list outbound destinations |

**Principles:** never trust client input; least privilege; defense in depth; use HTTPS everywhere; log and monitor; keep dependencies updated.
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'User input ends up executed as JavaScript in other users\' browsers. This is…', options: ['SQLi', 'XSS', 'CSRF', 'DDoS'], answer: 1 },
          { q: 'Best defense against SQL injection?', options: ['Hiding error messages', 'Parameterized queries', 'Using POST instead of GET', 'Longer passwords'], answer: 1 },
          { q: 'Where should authorization checks happen?', options: ['Only in the frontend', 'On the server, for every request', 'In CSS', 'Nowhere if using HTTPS'], answer: 1 },
        ],
      },
      cards: [{ front: 'XSS defense', back: 'Escape/encode output, avoid innerHTML with user data, use a Content-Security-Policy.' }],
    },
  ],
};

export const devops: Track = {
  id: 'devops',
  title: 'DevOps & Cloud',
  icon: '🚀',
  tier: 7,
  color: '#0ea5e9',
  blurb: 'Docker, Kubernetes, CI/CD, cloud providers, infrastructure as code and observability.',
  depth: 'overview',
  lessons: [
    {
      id: 'ops-docker',
      title: 'Containers & Docker',
      xp: 50,
      body: `
"It works on my machine" 🤷. **Containers** package an app *with* its exact dependencies so it runs the same everywhere.

{{ill:docker}}

A **VM** virtualizes hardware and runs a full guest OS (heavy, GBs, minutes to boot). A **container** shares the host's kernel and isolates processes with namespaces and cgroups (light, MBs, starts in milliseconds).

~~~dockerfile
# Dockerfile: the recipe for an image
FROM python:3.13-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0"]
~~~

~~~bash
docker build -t myapp .            # image = the frozen template
docker run -p 8000:8000 myapp      # container = a running instance
docker ps                          # running containers
docker logs <id>                   # view output
docker exec -it <id> sh            # shell inside a container
docker compose up                  # run multi-container apps from compose.yaml
~~~

**Images** are built in cached **layers**, so order your Dockerfile from least to most frequently changing. Images are shared via **registries** (Docker Hub, GHCR, ECR).
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'Containers share the host\'s…', options: ['Kernel', 'Hard drive serial number', 'Monitor', 'Nothing'], answer: 0 },
          { q: 'An image vs a container:', options: ['Same thing', 'Image is a template; container is a running instance', 'Container is the template', 'Images run, containers don\'t'], answer: 1 },
          { q: 'Map host port 8080 to container port 80:', options: ['-p 80:8080', '-p 8080:80', '--port 8080', '-e 8080'], answer: 1 },
        ],
      },
      cards: [{ front: 'Docker image vs container', back: 'Image: read-only layered template. Container: a running (or stopped) instance of an image.' }],
    },
    {
      id: 'ops-k8s',
      title: 'Kubernetes',
      xp: 50,
      body: `
When you run hundreds of containers across many machines, you need an **orchestrator**. **Kubernetes (k8s)** keeps your system in the **desired state** you declare.

{{ill:k8s}}

| Concept | What it is |
|---|---|
| **Cluster** | a set of machines (**nodes**) managed together |
| **Pod** | smallest unit: one or more containers sharing network/storage |
| **Deployment** | "keep 3 replicas of this pod running", with rolling updates |
| **Service** | stable network name + load balancing across pods |
| **Ingress** | routes outside HTTP traffic to services |
| **ConfigMap / Secret** | configuration and credentials |

~~~yaml
apiVersion: apps/v1
kind: Deployment
metadata: { name: web }
spec:
  replicas: 3
  selector: { matchLabels: { app: web } }
  template:
    metadata: { labels: { app: web } }
    spec:
      containers:
        - name: web
          image: ghcr.io/me/web:1.4
          ports: [{ containerPort: 8000 }]
~~~

\`kubectl apply -f web.yaml\`, \`kubectl get pods\`, \`kubectl logs\`, \`kubectl rollout undo\`. If a pod crashes, k8s **self-heals** by starting a new one.
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'Smallest deployable unit in Kubernetes?', options: ['Node', 'Pod', 'Cluster', 'Image'], answer: 1 },
          { q: 'What keeps N replicas running and handles rolling updates?', options: ['Service', 'Deployment', 'ConfigMap', 'Ingress'], answer: 1 },
          { q: 'Kubernetes configuration is mostly…', options: ['Imperative scripts', 'Declarative YAML of desired state', 'GUI clicks only', 'SQL'], answer: 1 },
        ],
      },
      cards: [{ front: 'Kubernetes Service', back: 'Stable virtual IP/DNS name that load-balances to matching pods.' }],
    },
    {
      id: 'ops-cicd',
      title: 'CI/CD, cloud & observability',
      xp: 50,
      body: `
**CI (Continuous Integration):** every push automatically builds and tests the code. **CD (Continuous Delivery/Deployment):** passing builds are automatically released.

{{ill:pipeline}}

~~~yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.13" }
      - run: pip install -r requirements.txt
      - run: pytest
~~~

**Cloud providers** (AWS, Azure, Google Cloud) rent you computing:
| Category | AWS | Azure | GCP |
|---|---|---|---|
| VMs | EC2 | Virtual Machines | Compute Engine |
| Serverless functions | Lambda | Functions | Cloud Run Functions |
| Object storage | S3 | Blob Storage | Cloud Storage |
| Managed SQL | RDS | Azure SQL | Cloud SQL |
| Kubernetes | EKS | AKS | GKE |

**Infrastructure as Code** (Terraform/OpenTofu, Pulumi, CloudFormation) defines servers, networks and databases in version-controlled files.

**Observability**, the three pillars:
- **Logs**: what happened (structured JSON logs)
- **Metrics**: numbers over time (latency, error rate, CPU) via Prometheus/Grafana
- **Traces**: one request's journey across services (OpenTelemetry)
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'CI stands for…', options: ['Code Inspection', 'Continuous Integration', 'Cloud Infrastructure', 'Container Image'], answer: 1 },
          { q: 'AWS\'s object storage service is…', options: ['EC2', 'S3', 'Lambda', 'RDS'], answer: 1 },
          { q: 'Three pillars of observability?', options: ['Logs, metrics, traces', 'CPU, RAM, disk', 'Dev, test, prod', 'HTML, CSS, JS'], answer: 0 },
          { q: 'Terraform is used for…', options: ['Infrastructure as code', 'Frontend styling', 'Unit testing', 'Image editing'], answer: 0 },
        ],
      },
      cards: [{ front: 'Infrastructure as Code', back: 'Managing infrastructure through versioned, declarative config files (Terraform, Pulumi).' }],
    },
  ],
};

export const architecture: Track = {
  id: 'architecture',
  title: 'Software Architecture & System Design',
  icon: '🏛️',
  tier: 8,
  color: '#8b5cf6',
  blurb: 'Design patterns, clean architecture, scaling, caching, queues, CAP and designing real systems.',
  depth: 'overview',
  lessons: [
    {
      id: 'arch-principles',
      title: 'Design principles & patterns',
      xp: 50,
      body: `
Good architecture makes code **easy to change**. Core principles:

- **DRY**: Don't Repeat Yourself (but don't over-abstract too early)
- **KISS**: Keep It Simple; **YAGNI**: You Aren't Gonna Need It
- **Separation of concerns**: UI, business logic and data access in different places
- **SOLID**:
  - **S**ingle responsibility: one reason to change
  - **O**pen/closed: extend without modifying
  - **L**iskov substitution: subclasses usable wherever the parent is
  - **I**nterface segregation: small, focused interfaces
  - **D**ependency inversion: depend on abstractions, not concrete classes

**Classic design patterns** (Gang of Four):

| Pattern | Problem it solves | Example |
|---|---|---|
| **Factory** | create objects without hard-coding classes | \`createShape("circle")\` |
| **Singleton** | exactly one instance (use sparingly!) | config, logger |
| **Observer** | notify subscribers of changes | event listeners, React state |
| **Strategy** | swap algorithms at run time | payment methods |
| **Adapter** | make incompatible interfaces work together | wrapping a 3rd-party API |
| **Decorator** | add behavior without subclassing | Python \`@cache\`, middleware |
| **Repository** | hide data-storage details | \`UserRepository.find(id)\` |

**Layered / clean / hexagonal architecture:** keep your **domain logic** at the center with no knowledge of frameworks or databases; outer layers (web, DB, UI) depend inward. This makes the core testable and swappable.
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'Which principle says a class should have only one reason to change?', options: ['Open/closed', 'Single responsibility', 'Liskov substitution', 'DRY'], answer: 1 },
          { q: 'Event listeners are an example of which pattern?', options: ['Factory', 'Observer', 'Singleton', 'Adapter'], answer: 1 },
          { q: 'Wrapping a third-party API to match your interface is…', options: ['Adapter', 'Strategy', 'Decorator', 'Facade only'], answer: 0 },
        ],
      },
      cards: [
        { front: 'SOLID', back: 'Single responsibility, Open/closed, Liskov substitution, Interface segregation, Dependency inversion' },
        { front: 'Strategy pattern', back: 'Encapsulate interchangeable algorithms behind one interface; choose at run time.' },
      ],
    },
    {
      id: 'arch-scaling',
      title: 'Scaling systems',
      xp: 55,
      body: `
A typical scalable web architecture:

{{ill:sysdesign}}

**Vertical scaling** = bigger machine (easy, has a ceiling). **Horizontal scaling** = more machines (needs **stateless** app servers behind a **load balancer**).

**Building blocks:**
- **Load balancer**: spreads traffic (round-robin, least-connections), does health checks
- **Cache** (Redis, Memcached, CDN): store hot results close to users. *"There are only two hard things in CS: cache invalidation and naming things."*
- **CDN**: serves static files from edge servers near users
- **Database replication**: one primary for writes, read **replicas** for reads
- **Sharding / partitioning**: split data across databases by key (e.g. user_id)
- **Message queue** (RabbitMQ, Kafka, SQS): decouple services; do slow work **asynchronously** (emails, video encoding)
- **Rate limiting**: protect services from abuse (token bucket)

**CAP theorem:** when a network **P**artition happens, a distributed system must choose **C**onsistency (refuse/ delay answers) or **A**vailability (answer with possibly stale data).

**Monolith vs microservices:** start with a well-structured **monolith**. Split into microservices only when team size or scaling needs justify the operational complexity (network failures, distributed tracing, data consistency).
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'Adding more servers behind a load balancer is…', options: ['Vertical scaling', 'Horizontal scaling', 'Sharding', 'Caching'], answer: 1 },
          { q: 'Sending welcome emails without slowing sign-up is best done with…', options: ['A bigger CPU', 'A message queue + background worker', 'A CDN', 'More indexes'], answer: 1 },
          { q: 'During a network partition, CAP says you must choose between…', options: ['Speed and cost', 'Consistency and availability', 'SQL and NoSQL', 'Cache and CDN'], answer: 1 },
          { q: 'For a new product with a small team, the sensible default is…', options: ['50 microservices', 'A well-structured monolith', 'No database', 'Serverless everything mandatory'], answer: 1 },
        ],
      },
      cards: [
        { front: 'CAP theorem', back: 'Under a network partition, choose Consistency or Availability.' },
        { front: 'Why stateless app servers?', back: 'Any server can handle any request, so you can add/remove servers freely behind a load balancer.' },
      ],
    },
    {
      id: 'arch-interview',
      title: 'How to approach a system design problem',
      xp: 55,
      body: `
Whether in an interview or at work, use a repeatable framework. Example: **"Design a URL shortener"** (like bit.ly).

**1. Clarify requirements**
- Functional: shorten a URL; redirect; optional custom alias and expiry; click analytics
- Non-functional: 100M new URLs/month, reads ≫ writes (100:1), redirects < 50 ms, highly available

**2. Estimate scale** (back-of-the-envelope)
- Writes: 100M / month ≈ 40/sec · Reads ≈ 4,000/sec
- Storage: 100M × 12 months × 5 yrs × ~500 bytes ≈ 3 TB

**3. API design**
~~~
POST /api/urls   { "url": "https://..." }  → { "code": "x7Kp2" }
GET  /x7Kp2      → 301 redirect
~~~

**4. Data model**: \`urls(code PK, long_url, created_at, expires_at, user_id)\`

**5. High-level design**: load balancer → stateless API servers → cache (Redis) → database. Generate codes with base62 of a unique ID (7 chars = 62⁷ ≈ 3.5 trillion).

**6. Deep dives & trade-offs**: cache hot links (read-heavy!), 301 vs 302 (cacheable vs trackable), analytics via a queue, sharding by code, abuse prevention with rate limits.

**7. Bottlenecks & failure modes**: what if the cache dies? The DB primary? A celebrity link goes viral?

📚 Practice designs: chat app, news feed, rate limiter, video streaming, ride sharing, web crawler, notification system.
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'What should you do FIRST in a system design discussion?', options: ['Draw microservices', 'Clarify requirements', 'Pick a database', 'Write code'], answer: 1 },
          { q: 'A URL shortener is read-heavy. The biggest win is…', options: ['A cache for hot codes', 'More write replicas', 'Bigger CSS', 'Using UDP'], answer: 0 },
          { q: 'How many codes can 7 base62 characters represent?', options: ['~62 million', '~3.5 trillion', '~7 billion', '~1 million'], answer: 1 },
        ],
      },
      cards: [{ front: 'System design steps', back: 'Requirements → estimates → API → data model → high-level design → deep dives → bottlenecks' }],
    },
  ],
};
