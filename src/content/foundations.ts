import type { Track } from './types';

export const foundations: Track = {
  id: 'foundations',
  title: 'How Computers Work',
  icon: '🧩',
  tier: 0,
  color: '#22c55e',
  blurb: 'Bits, CPUs, memory, operating systems and how code actually runs.',
  depth: 'full',
  lessons: [
    {
      id: 'f-computer',
      title: 'What is a computer?',
      xp: 30,
      body: `
A computer is a machine that **follows instructions very, very fast**. Every computer (phone, laptop, server, game console) has the same four parts:

{{ill:computer}}

| Part | Job | Analogy |
|---|---|---|
| **CPU** (processor) | Executes instructions, billions per second | The chef |
| **RAM** (memory) | Holds what's being worked on *right now*. Fast, but wiped when power goes off | The kitchen counter |
| **Storage** (SSD/HDD) | Keeps files permanently. Slower than RAM | The pantry |
| **I/O** (input/output) | Keyboard, screen, network, mouse | The waiter |

When you open an app, its code is copied from **storage → RAM**, then the **CPU** reads instructions from RAM one by one: *fetch → decode → execute*. That loop is called the **instruction cycle**.

> 💡 **Why this matters for programmers:** reading from RAM is ~100× faster than SSD, and the CPU's own cache is ~100× faster than RAM. Much of "performance engineering" is keeping data close to the CPU.
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'Where does a program live while it is running?', options: ['Storage (SSD)', 'RAM', 'The monitor', 'The network card'], answer: 1, explain: 'Programs are loaded from storage into RAM so the CPU can read their instructions quickly.' },
          { q: 'What happens to RAM contents when power is lost?', options: ['They are saved automatically', 'They are erased', 'They move to the CPU', 'Nothing'], answer: 1, explain: 'RAM is volatile: it needs power to keep its data.' },
          { q: 'What are the three steps of the instruction cycle?', options: ['Load, save, quit', 'Fetch, decode, execute', 'Input, process, print', 'Compile, link, run'], answer: 1 },
        ],
      },
      cards: [
        { front: 'CPU', back: 'Central Processing Unit: executes instructions (fetch → decode → execute).' },
        { front: 'RAM vs storage', back: 'RAM is fast and temporary (volatile). Storage is slower and permanent.' },
      ],
    },
    {
      id: 'f-binary',
      title: 'Binary: the language of 0 and 1',
      xp: 35,
      body: `
Computers are built from billions of tiny switches called **transistors**. A switch is either **off (0)** or **on (1)**. One switch = one **bit**.

To count higher than 1, we put bits side by side. Each position is worth double the one to its right: 1, 2, 4, 8, 16…

**Try it: click the bits to flip them and watch the number change.**

{{ill:binary}}

- 8 bits = 1 **byte** → can store 0–255 (2⁸ = 256 values)
- 1 KB ≈ 1,000 bytes · 1 MB ≈ 1 million · 1 GB ≈ 1 billion

**Hexadecimal** (base 16) is a shorthand programmers use: one hex digit = 4 bits. Digits go 0–9 then A–F. So \`1111 1111\` = \`FF\` = 255. You'll see hex in colors (\`#FF8800\`), memory addresses and error codes.

Everything is binary underneath: numbers, text (each letter has a number, e.g. \`A\` = 65), images (each pixel = numbers for red/green/blue), and even the program's instructions.
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'What is binary 1010 in decimal?', options: ['8', '10', '12', '1010'], answer: 1, explain: '8 + 0 + 2 + 0 = 10' },
          { q: 'How many different values can one byte hold?', options: ['8', '128', '255', '256'], answer: 3, explain: '2⁸ = 256 values (0 through 255).' },
          { q: 'What is hex FF in decimal?', options: ['255', '16', '100', '1515'], answer: 0 },
          { q: 'Which is the smallest unit of data?', options: ['Byte', 'Bit', 'Kilobyte', 'Word'], answer: 1 },
        ],
      },
      cards: [
        { front: 'Bit vs byte', back: 'A bit is one 0/1. A byte is 8 bits (values 0–255).' },
        { front: 'Hexadecimal', back: 'Base 16 (0–9, A–F). One hex digit = 4 bits. FF = 255.' },
      ],
    },
    {
      id: 'f-run',
      title: 'How code runs: compilers & interpreters',
      xp: 35,
      body: `
CPUs only understand **machine code**: raw binary instructions. Humans write **source code** in languages like Python or C. Something has to translate.

{{ill:compile}}

**Compiled languages** (C, C++, Rust, Go): a **compiler** translates the whole program to machine code *ahead of time*, producing an executable file. Fast to run, but you must rebuild for each OS/CPU.

**Interpreted languages** (Python, Ruby, classic JavaScript): an **interpreter** reads your code and runs it line by line *at run time*. Easy to start, more portable, usually slower.

**Hybrid / VM languages** (Java, C#, Kotlin): compile to **bytecode** for a virtual machine (JVM, .NET CLR), which then runs it, often using a **JIT** (just-in-time) compiler to make hot code fast. Modern JavaScript engines (V8) also JIT-compile.

| | Compiled | Interpreted | Bytecode + VM |
|---|---|---|---|
| Examples | C, Rust, Go | Python, Ruby | Java, C# |
| Speed | ⚡⚡⚡ | ⚡ | ⚡⚡ |
| Errors found | Many at compile time | At run time | Mixed |
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'What does a compiler produce?', options: ['A web page', 'Machine code / an executable', 'Comments', 'A database'], answer: 1 },
          { q: 'Java source code is first compiled to…', options: ['Python', 'Bytecode for the JVM', 'HTML', 'Assembly for every CPU'], answer: 1 },
          { q: 'Which is typically interpreted?', options: ['C', 'Rust', 'Python', 'Go'], answer: 2 },
        ],
      },
      cards: [
        { front: 'Compiler', back: 'Translates the whole program to machine code before it runs.' },
        { front: 'Interpreter', back: 'Reads and executes source code at run time, statement by statement.' },
        { front: 'JIT', back: 'Just-In-Time compilation: compiles hot code to machine code while the program runs.' },
      ],
    },
    {
      id: 'f-os',
      title: 'Operating systems',
      xp: 35,
      body: `
An **operating system (OS)** is the program that manages the hardware and lets other programs share it safely. Windows, Linux, macOS, Android and iOS are all operating systems.

{{ill:os-layers}}

The **kernel** is the core of the OS. It:
- **schedules processes**: decides which program gets the CPU, switching thousands of times per second so everything *seems* to run at once
- **manages memory**: gives each process its own private address space
- **handles files**: turns raw disk blocks into folders and files
- **talks to devices** through **drivers**

Programs can't touch hardware directly. They ask the kernel through **system calls** (e.g. "open this file", "send this network packet").

**The shell** is a program that lets *you* talk to the OS by typing commands. Bash and Zsh are shells on Linux/macOS; PowerShell and cmd on Windows. You'll master these in the *Terminal & Shell* track.

| | Linux | Windows | macOS |
|---|---|---|---|
| Kernel | Linux | NT | XNU (Unix-like) |
| Path style | \`/home/me/file\` | \`C:\\Users\\me\\file\` | \`/Users/me/file\` |
| Default shell | Bash | PowerShell | Zsh |
| Servers | ~95% of the web | Enterprise | Rare |
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'What is the kernel?', options: ['A type of CPU', 'The core of the OS that manages hardware', 'A text editor', 'A programming language'], answer: 1 },
          { q: 'How does a program ask the OS to open a file?', options: ['A system call', 'An email', 'Writing to the screen', 'Restarting'], answer: 0 },
          { q: 'Which OS runs most web servers?', options: ['Windows', 'macOS', 'Linux', 'iOS'], answer: 2 },
        ],
      },
      cards: [
        { front: 'Kernel', back: 'Core of the OS: schedules processes, manages memory, files and devices.' },
        { front: 'System call', back: 'How a program requests a service from the kernel (open, read, write, fork…).' },
      ],
    },
    {
      id: 'f-think',
      title: 'Thinking like a programmer',
      xp: 35,
      body: `
Programming is less about typing and more about **breaking problems into tiny, exact steps**. A step-by-step recipe that a computer can follow is an **algorithm**.

{{ill:flowchart}}

**The 4 core moves of computational thinking:**
1. **Decomposition**: split a big problem into small ones. *"Build a game" → draw screen, read input, move player, check collisions…*
2. **Pattern recognition**: notice what repeats, so you can use a **loop** or a **function**.
3. **Abstraction**: hide details you don't need. You drive a car without knowing how the engine works.
4. **Algorithms**: write exact steps, including the edge cases (*what if the list is empty?*).

**How to solve any coding exercise:**
1. Restate the problem in your own words.
2. Work 2–3 examples by hand, including a weird one.
3. Write the steps in plain English (pseudocode).
4. Translate to code, one small step at a time, running it often.
5. When it breaks, **read the error message**. It usually says exactly what's wrong and on which line.

> 🦆 **Rubber duck debugging:** explain your code line by line to a rubber duck (or the AI tutor). You'll often spot the bug mid-sentence.
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'What is an algorithm?', options: ['A math formula only', 'A precise sequence of steps to solve a problem', 'A programming language', 'A computer part'], answer: 1 },
          { q: 'Splitting a big problem into smaller ones is called…', options: ['Abstraction', 'Decomposition', 'Compilation', 'Iteration'], answer: 1 },
          { q: 'Your program crashes. What should you do first?', options: ['Rewrite everything', 'Read the error message carefully', 'Restart the computer', 'Give up'], answer: 1 },
        ],
      },
      cards: [{ front: 'Four pillars of computational thinking', back: 'Decomposition, pattern recognition, abstraction, algorithms.' }],
    },
    {
      id: 'f-data',
      title: 'Text, files and encodings',
      xp: 30,
      body: `
Since everything is numbers, text needs a mapping from characters to numbers: an **encoding**.

- **ASCII** (1960s): 128 characters (English letters, digits, punctuation). \`A\` = 65, \`a\` = 97, \`0\` = 48.
- **Unicode**: one giant table of 150,000+ characters, covering every language plus emoji (😀 = U+1F600).
- **UTF-8**: the most common way to store Unicode as bytes. ASCII characters take 1 byte, others take 2–4. It's the default for the web and for almost all code.

**Files** are just sequences of bytes plus a name. The **extension** (\`.txt\`, \`.png\`, \`.py\`) is a hint about how to interpret them:
- **Text files** (\`.txt .py .json .csv .html\`): bytes are characters, so any editor can open them.
- **Binary files** (\`.png .exe .zip\`): bytes have a special structure only certain programs understand.

**Common data formats you'll meet everywhere:**

~~~json
{ "name": "Ada", "languages": ["Python", "C"], "level": 7 }
~~~
☝️ **JSON**: the universal format for APIs and config.

~~~csv
name,level
Ada,7
Linus,9
~~~
☝️ **CSV**: rows and columns, for spreadsheets and data science.
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'Which encoding is the default on the web?', options: ['ASCII', 'UTF-8', 'Morse', 'Base64'], answer: 1 },
          { q: 'Which of these is a text format?', options: ['.png', '.exe', '.json', '.zip'], answer: 2 },
          { q: 'Unicode is…', options: ['A font', 'A universal table of characters', 'A compression format', 'A programming language'], answer: 1 },
        ],
      },
      cards: [
        { front: 'UTF-8', back: 'Variable-width (1–4 bytes) encoding of Unicode; ASCII-compatible; web default.' },
        { front: 'JSON', back: 'JavaScript Object Notation: text format of objects {}, arrays [], strings, numbers, booleans, null.' },
      ],
    },
    {
      id: 'f-internet',
      title: 'How the internet works (the big picture)',
      xp: 35,
      body: `
The internet is a **network of networks**: millions of computers connected by cables, Wi-Fi and fiber, all agreeing on the same **protocols** (rules for talking).

{{ill:internet}}

**What happens when you visit a website:**
1. **DNS**: your computer asks "what's the IP address of \`example.com\`?" (like a phone book), and gets \`93.184.216.34\`.
2. **TCP connection**: your computer and the server do a handshake to open a reliable channel.
3. **TLS**: they agree on encryption keys (that's the 🔒 in **HTTPS**).
4. **HTTP request**: your browser sends \`GET /index.html\`.
5. **HTTP response**: the server replies \`200 OK\` plus the HTML.
6. **Rendering**: the browser parses the HTML, downloads CSS/JS/images, and paints the page.

Data travels in small chunks called **packets**, each with a source and destination **IP address**. Routers pass packets hop by hop toward their destination. Different packets may take different paths!

- **Client**: the one asking (your browser, your app)
- **Server**: the one answering (a computer running 24/7 in a data center)
- **Port**: which program on the computer gets the data (HTTP = 80, HTTPS = 443)

You'll go much deeper in the *Networking* and *Web* tracks.
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'What does DNS do?', options: ['Encrypts data', 'Turns domain names into IP addresses', 'Renders HTML', 'Stores files'], answer: 1 },
          { q: 'What does the S in HTTPS mean?', options: ['Speed', 'Secure (encrypted with TLS)', 'Server', 'Static'], answer: 1 },
          { q: 'Data on the internet travels in small chunks called…', options: ['Packets', 'Bytes only', 'Files', 'Threads'], answer: 0 },
          { q: 'Default port for HTTPS?', options: ['21', '80', '443', '8080'], answer: 2 },
        ],
      },
      cards: [
        { front: 'IP address', back: 'Numeric address of a device on a network, e.g. 93.184.216.34 (IPv4).' },
        { front: 'Client vs server', back: 'Client sends requests; server listens and sends responses.' },
      ],
    },
  ],
};
