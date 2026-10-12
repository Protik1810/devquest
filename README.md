# DevQuest 🧙‍♂️

**Created and developed by Protik.**

🌐 **Use it in your browser:** https://protik1810.github.io/devquest/  ·  ⬇ **Download the apps:** [latest release](https://github.com/Protik1810/devquest/releases/latest) (Windows, Linux, Android) or the in-app **Get the app** page, which picks the right build for your device.

A gamified, all-in-one software engineering academy, inspired by the game mechanics of boot.dev with original content. It runs as a **web app**, a **desktop app for Windows and Linux** (Electron) and an **Android app** (Capacitor). The layout is responsive: desktop sidebar, tablet layout, and a phone layout with a bottom tab bar, slide-in menu and safe-area support.

## What's inside

| Area | Details |
|---|---|
| **Career paths** | 11 paths (Frontend, Backend, Full-Stack, Mobile, Data, AI/ML, DevOps, Systems, Game Dev, Security, Blockchain), each a staged roadmap of core engineering + the right languages + specializations + portfolio projects, with language choices (e.g. Backend in Python / Go / Java / C# / TypeScript / PHP / Ruby) and a printable certificate. Or focus on a single language |
| **Curriculum** | 45 tracks: 17 core engineering tracks, 20 languages, 8 specializations; every exercise is verified by `npm test` / `npm run verify:native` |
| **Core engineering** | How Computers Work, **Programming Foundations** (problem solving, types, binary & hex, Unicode/UTF-8, logic, loop patterns, functions, errors, JSON/CSV, regex, files, Big-O, testing), **PostgreSQL** (real Postgres in the browser via PGlite: types, joins, CTEs & recursion, window functions, JSONB, constraints/upserts/transactions, indexes & EXPLAIN, internals), **MySQL** (InnoDB tables, MySQL's dialect, GROUP_CONCAT, dates, ON DUPLICATE KEY UPDATE, MySQL 8 window functions, clustered indexes, replication & operations; runs on an in-app MySQL-dialect engine), **MongoDB** (queries, updates, nested data, aggregation, indexes & $lookup, schema design), **Redis** (strings & counters, expiry & caching, lists/queues, hashes, sets, sorted-set leaderboards, rate limiting, locks, transactions, persistence & clustering; redis-cli commands on an in-app Redis engine), Terminal & Shell, Git, Data Structures & Algorithms, Systems (C, memory, concurrency), Networking, Web, **Database Systems** (normalization, indexes, transactions, NoSQL, build a key-value store), DevOps & Cloud, **Software Architecture & System Design**, **Software Engineering Practice** (SDLC/Agile, requirements, testing, debugging, code review, design patterns, collaboration), Career |
| **Languages** | Python, JavaScript, TypeScript, SQL, Go, Java, C#, Kotlin, Swift, Dart, Rust, C, C++, PHP, Ruby, R, Lua, Bash, PowerShell, Solidity: hands-on lessons ending in a mini project each |
| **Specializations** | React, Data Analysis with pandas, Cybersecurity, Game Development, Mobile App Development, Blockchain, AI & Machine Learning, Language Tour |
| **Illustrated primers + labs** | Systems, Networking, Web, DevOps, Architecture, AI/ML now include hands-on labs (live HTML/CSS/JS, IP subnets, HTTP parsing, CPU scheduler, log monitoring, rate limiter, URL shortener, gradient descent, semantic search); Polyglot (9 languages) and Career are illustrated lessons + quizzes |
| **Projects Studio** | 13 graded projects (Python, JavaScript, Web): brief, requirements, rubric, starter, automated tests, reference solution. Submissions get automated tests + an AI rubric grade (score, letter, per-criterion feedback). Generate your own project from an idea with AI |
| **Code Dojo** | 80 auto-graded practice programs in 19 languages: 32 for Python, JavaScript and SQL, plus classic problems (run-length encoding, brackets, Roman numerals, spiral matrix, sliding window, sieve, two-sum, merge intervals, anagram groups…) in 16 more languages with identical inputs and output, so languages can be compared |
| **Agent Lab** | An AI agent (Owl) that teaches with tools: it writes and edits files, runs programs and terminal commands, opens files in your editor and asks quiz questions, in four modes (Teach me, Build with me, Debug coach, Terminal coach). Everything happens in a sandbox: virtual files, a simulated terminal, and code runs in workers with network and storage APIs removed. Learner-written files are protected, native compiler runs need approval, 24-step limit and a Stop button. Native tool calling for Anthropic, OpenAI-compatible and Gemini, with a text-based tool protocol fallback for local models |
| **AI evaluation** | AI code review on any exercise, plain-English error explanations (built-in for common errors, AI for the rest), project grading and generation, tutor chat |
| **Code runners** | In the app on every platform: Python (Pyodide), JavaScript and TypeScript (sandboxed Web Worker), Lua (fengari), SQL (sql.js), HTML/CSS/JS with live preview and DOM tests. Desktop app: Go, Rust, C, C++, Java, Kotlin, Swift, C#, Dart, Ruby, PHP, R, Bash, PowerShell and Solidity run on the compilers installed on your PC. Elsewhere those programs are checked by AI (traced output vs. expected) or by self-check |
| **Terminal** | Simulated Linux bash with a virtual filesystem: pipes, `&&`, redirection, tab-completion, history |
| **Command Atlas** | ~90 tasks side by side for Linux, macOS, PowerShell and cmd, searchable, click to copy |
| **Visuals** | 34 animated SVG illustrations and 6 interactive visualizers (sorting, Big-O, binary search, BST, BFS/DFS, stack/queue) |
| **Rewards** | XP & levels, ranks (Novice → Archmage), daily streaks with freezes, gems, gem shop, XP potions, daily quests, 30 achievements (incl. Polyglot, Fluent, Job Ready, Lab Partner), boss battles, activity heatmap |
| **Retention** | Spaced-repetition flashcards (260 cards, SM-2 style) + placement tests to skip ahead |
| **AI tutor** | Optional Socratic "Owl" tutor. Cloud: Anthropic Claude, OpenAI, Google Gemini, OpenRouter, Groq, Mistral, DeepSeek (your own key). Local & free: Ollama, LM Studio, Solframe Studio, or any OpenAI-compatible server (llama.cpp, vLLM, Jan, LocalAI) |

Profile, progress and the Agent Lab workspace are stored on the device only: in localStorage, and in the desktop/Android apps also mirrored to a save file in the app's private data folder (restored automatically if storage is cleared; the desktop app keeps daily backups for a week). Export/import JSON in Settings.

## Security & privacy

- **Desktop (Electron):** sandboxed renderer with context isolation; the window can't navigate away from the app (links open in your browser, and only `https:`/`http:`/`mailto:`); the preload bridges are exposed only to DevQuest's own pages and every IPC call re-checks its sender; a Content Security Policy blocks remote scripts; permission requests are denied except clipboard writes.
- **API keys** are stored encrypted by the OS keychain (desktop, Electron `safeStorage`) or the Android Keystore (in-app plugin), never in progress saves, sync files, backups or exports. On the web they're kept in a separate localStorage entry.
- **Network:** plain `http://` is refused except to this device or the local network (local AI servers); everything else must be `https://`.
- **AI output** is rendered as text (no HTML, images or `javascript:` links).
- **Exercise integrity:** pasting the expected output is detected, and Code Dojo programs are re-run with hidden inputs against the reference solution.
- **Accessibility:** WCAG 2.2 AA colour contrast in every theme (axe-core clean), visible focus, labelled controls, keyboard-scrollable regions and reduced-motion support.

## Develop

```bash
npm install
npm run dev            # web app at http://localhost:5173
npm run electron:dev   # desktop app with hot reload
```

### Share the web app (optional, ngrok)

```bash
ngrok config add-authtoken <your-token>   # once; the token stays in ngrok's own config, never in this repo
npm run share                             # reuses `npm run dev` on :5173 (or starts it) and prints a public https URL
```

Optional: `NGROK_DOMAIN=<your-static-domain>` for a fixed URL, and `NGROK_BASIC_AUTH="user:password"` to require a login (recommended: a dev server exposes the source code). Ctrl+C stops the tunnel.

### Publishing

- **Web app:** every push to `main` builds the site and deploys it to GitHub Pages (`.github/workflows/pages.yml`).
- **App downloads:** builds are attached to a GitHub Release (`gh release create vX.Y.Z …`). The web app's **Get the app** page reads `deploy/downloads.json`, generated with `node scripts/downloads.mjs --release-base https://github.com/Protik1810/devquest/releases/download/vX.Y.Z/ --out deploy/downloads.json`; `node scripts/downloads.mjs --stage` copies the builds with release-ready names.
- **Self-hosting the web app with downloads:** `npm run build:web` copies the builds into `dist/downloads/`.

## Build

```bash
npm test               # unit + curriculum integrity tests (Vitest)
npm run verify:native  # run every native-language exercise with the installed compilers
npm run build          # fetches offline runtimes (Pyodide, React) into public/, then builds dist/
npm run dist:win       # Windows: NSIS installer + portable .exe → release/
npm run dist:linux     # Linux: AppImage + .deb → release/ (run on Linux/WSL or CI)
npm run android:apk    # Android: debug APK → android/app/build/outputs/apk/debug/
npm run android:release # Android: signed release APK + AAB (needs android/keystore.properties)
```

### Local compilers (desktop)

`electron/toolchains.cjs` finds toolchains on `PATH` (refreshed from the registry, so new installs work without restarting), plus MSVC via `vswhere`, Git Bash, and the .NET SDK. Settings → Local compilers shows what was found, with install links for missing ones. On the development PC they are installed under `D:\DevTools` (Go, Rust, Kotlin, Swift, Dart, Ruby, PHP, R, solc), plus Java 21, MSVC and .NET 8. Solidity is compile-only (`solc --bin`); its output is then checked by AI.

### Android

Requires the Android SDK (API 36) and JDK 21. `npm run android:sync` copies the web build into `android/`; open that folder in Android Studio to run on a device or emulator, or build an APK with `npm run android:apk`. The debug APK is signed with the standard debug key, so it is for testing. For the Play Store, create a release keystore and run `gradlew bundleRelease`.

On Android, local AI servers on your PC (Ollama, LM Studio, Solframe) are reached over Wi-Fi with Capacitor's native HTTP, so use the PC's IP instead of `localhost` and make the server listen on the network. Cloud providers work as usual.

> Building the Linux AppImage needs symlink support, so run `dist:linux` on Linux, in WSL, or via the included GitHub Actions workflow (`.github/workflows/release.yml`). On Windows you can still produce a Linux tarball:
> `npx electron-builder --linux tar.gz -c.electronDist=<unzipped electron linux-x64 dir>`

If `electron` fails to start after `npm install`, run `node node_modules/electron/install.js` (npm may have skipped its install script).

## Themes & artwork

Settings → Appearance offers Classic dark/light and six wallpaper themes (Void, Neon, Cinema, Synthwave, Anime, Matrix) modelled on Solframe Studio's themes. All artwork in `public/art/` was generated locally with Solframe Studio on an RTX 4070 Ti: theme wallpapers with SDXL (Juggernaut XL Lightning), track/project covers with FLUX 2 Klein 4B.

To regenerate or add art, enable Solframe's Agent Server, add items to `scripts/art-manifest.json`, then:

```bash
SOLFRAME_KEY=sk-solframe-... PIPELINE=flux OUT_DIR=.art-flux node scripts/gen-art.mjs --only track-python
python scripts/to-webp.py
```

## Adding content

Lessons are plain TypeScript data in `src/content/` (labs in `labs.ts`, projects in `projects.ts`, Dojo challenges in `dojo.ts`). Each lesson has a markdown `body` (embed `{{ill:name}}` or `{{viz:name}}` on its own line), an optional `exercise` (`quiz`, `code` with `stdout`/`tests`/`sql` checks, or `terminal` missions), and `cards` for spaced repetition. Register new tracks in `src/content/index.ts`.

## Notes

- Python (Pyodide with numpy, pandas, hashlib and sqlite3), React and Babel ship inside the app (`scripts/fetch-runtimes.mjs`), so every lesson works offline. PostgreSQL runs via PGlite, MongoDB via an in-app shell, MySQL via a MySQL-dialect layer on SQLite (src/engine/mysql.ts) and Redis via an in-app redis-cli engine (src/engine/redis.ts). The MySQL and Redis engines are teaching engines: results match the real servers for the lessons, but they aren't servers.
- **Sync between computers (desktop):** Settings → Your progress → choose a folder inside OneDrive/Dropbox/Google Drive/Syncthing; DevQuest merges progress from every computer using it.
- **Release signing:** Android release builds read `android/keystore.properties` (git-ignored). Windows builds are signed when `CSC_LINK`/`CSC_KEY_PASSWORD` are set (a code-signing certificate is needed to avoid SmartScreen warnings).
- The AI tutor sends requests directly from the app to the provider you pick; keys stay on your device and are not included in save exports.
- Local models: install [Ollama](https://ollama.com) and run `ollama pull qwen2.5-coder:7b` (or `llama3.2` for low-RAM machines), then pick *Ollama (local)* in Settings → AI tutor → Fetch models. LM Studio needs its server started with CORS enabled. If you host the web app on another domain, start Ollama with `OLLAMA_ORIGINS=*`.
- To add another OpenAI-compatible provider, add one entry to `src/engine/providers.ts`.
- In the desktop app, AI requests go through the Electron main process (`electron/preload.cjs`), so local servers that don't send CORS headers (Solframe Studio, LM Studio without CORS) still work.
- AI grades are advisory: models can be wrong. Automated tests cap a project's score at 70 until they pass, and learner code is passed to the grader as data with an instruction to ignore embedded instructions.

## Author

DevQuest is created and developed by **Protik**. © 2026 Protik.
