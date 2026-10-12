import { Link } from 'react-router-dom';
import { Markdown } from '../components/Markdown';

const SECTIONS: { icon: string; title: string; body: string; link?: [string, string] }[] = [
  {
    icon: '🧭',
    title: 'How learning works here',
    body: `Every lesson follows the same loop: **read a short explanation → look at the illustration → practise right away**.

1. **Lessons** explain one idea with diagrams and examples.
2. **Exercises** check you really got it: quizzes, code that's tested automatically, or terminal missions.
3. **Flashcards** from each lesson come back in **Review** just before you'd forget them.
4. **Dojo challenges** and **Projects** make you use several ideas together, like real work.

New to programming? Choose a **career path** and press *Continue* each day. Already know some? Use the **Placement test** on a track page to skip ahead.`,
    link: ['/map', 'Open the Skill Map'],
  },
  {
    icon: '🎯',
    title: 'Career paths & language focus',
    body: `You don't need to learn everything. Pick one of **11 career paths** (Frontend, Backend, Full-Stack, Mobile, Data, AI/ML, DevOps, Systems, Game Dev, Security, Blockchain) and DevQuest builds a roadmap with only what that job needs:

- **Core engineering** every developer uses: how computers work, the terminal, Git, data structures & algorithms, operating systems, networking, **database systems**, **architecture & design patterns**, and **software engineering practice** (testing, debugging, code review, Agile).
- **The right languages**, such as TypeScript for frontend, or Kotlin / Swift / Dart for mobile. Where a path offers a choice, pick the language from the dropdown on the roadmap.
- **Specializations and portfolio projects** for the role, plus a printable certificate when you finish.

Prefer one language? Choose **Learn just one language** to focus only on it. Your choice decides what *Continue* opens next, but every other track stays open in the Skill Map. Change it at any time.`,
    link: ['/paths', 'Choose a path'],
  },
  {
    icon: '🧪',
    title: 'Agent Lab: learn with an AI agent',
    body: `In the **Agent Lab**, Owl is an AI *agent*: it doesn't just chat, it uses tools in a workspace you share. It can create and edit files, run programs, use the terminal, open files in your editor and ask you quiz questions. Pick a mode:

- **🎓 Teach me**: Owl plans a mini-lesson, writes an exercise with tests, and coaches you while you solve it. It never writes your solution.
- **🤝 Build with me**: pair-program a small project step by step.
- **🐞 Debug coach**: learn to reproduce, read errors, form hypotheses and fix bugs yourself.
- **🐚 Terminal coach**: shell missions in the sandbox terminal.

**It's sandboxed.** Files exist only inside DevQuest on your device, the terminal is simulated, and programs run in isolated workers with **no network** and a time limit. Files you wrote are protected: in Teach and Debug modes Owl must ask before changing them. In the desktop app, compiled languages can run on your real compilers, but only after you click **Allow**. Owl stops after 24 steps per message, and **■ Stop** halts it at any time.

Works with any provider in Settings. Models without native tool calling (many small local models) automatically switch to a text-based tool protocol.`,
    link: ['/agent', 'Open the Agent Lab'],
  },
  {
    icon: '🔤',
    title: '20 languages: how your code is checked',
    body: `Each language has hands-on lessons that end in a mini project. How your program runs depends on the language:

- **⚡ Runs in DevQuest**: Python, JavaScript, TypeScript, SQL, HTML/CSS and Lua run inside the app, on every platform and offline.
- **⚙️ Local compiler (desktop app)**: Go, Rust, C, C++, Java, Kotlin, Swift, C#, Dart, Ruby, PHP, R, Bash, PowerShell and Solidity run on the toolchains installed on your PC. **Settings → Local compilers** shows which ones were found and links to installers.
- **🤖 AI-checked**: on the web, on Android, or when a compiler is missing, a connected AI provider reads your program, traces what it would print, and compares that with the expected output.
- **📝 Self-check**: with neither available, compare your output with the expected output yourself for half the XP.
- **🗄️ Databases**: SQLite and **PostgreSQL** (the real engine, compiled to WebAssembly), plus practice engines for **MySQL** syntax, the **MongoDB** shell and **Redis** commands, all run inside the app, offline.

**Fair play:** printing the expected output instead of computing it is detected, and Code Dojo programs are re-run with hidden inputs.`,
    link: ['/languages', 'Browse languages'],
  },
  {
    icon: '💻',
    title: 'Coding exercises',
    body: `- **▶ Run** (or **Ctrl+Enter**) runs your code and shows the output, without grading it.
- **✔ Submit** runs the hidden tests. Pass them to complete the exercise and earn XP.
- When something breaks, the console explains the error in plain English 🩺. With an AI provider you can also ask the AI to explain it 🦉.
- **💡 Hints** get more specific each time, but each one costs 15% of the XP. **👁 Solution** shows the answer, but you earn no XP.
- **🤖 Get AI code review** scores your code from 0 to 10 and suggests improvements to readability, edge cases and style, even when your tests pass.
- Your code is saved automatically.`,
  },
  {
    icon: '🏗️',
    title: 'Projects & AI grading',
    body: `Projects are bigger programs built from a **brief, requirements and a rubric**, like a real ticket at work.

When you **Submit for grading**:
1. Automated tests run first (if the project has them). If they fail, your score is capped at 70.
2. The AI reviewer grades every rubric criterion (functionality, code quality, edge cases, design…) and writes specific feedback.
3. You get a score out of 100, a letter grade, strengths, and concrete next steps.

You earn XP for **improving your best score**, so iterate on the feedback and resubmit. You can also describe your own idea and **✨ Generate a project** with AI. Without an AI provider, projects with tests are graded by tests only (max 70).`,
    link: ['/projects', 'Open Projects'],
  },
  {
    icon: '⭐',
    title: 'XP, levels, gems & streaks',
    body: `- **XP** comes from lessons, challenges, projects, quests and reviews. XP raises your **level** and **rank** (Novice → Apprentice → Coder → Engineer → Senior → Architect → Archmage).
- **Gems 💎** come from flawless exercises, daily quests, level-ups and good project grades. Spend them in the **Shop** on a 🧊 Streak Freeze (it protects your streak if you miss a day) or a 🧪 XP Potion (+50% XP for 30 minutes).
- **Streak 🔥**: do anything that earns XP each day. Small daily practice beats long weekly sessions.
- **Daily quests** (on Home) give bonus gems. **Achievements** reward milestones.`,
  },
  {
    icon: '🦉',
    title: 'AI tutor & providers',
    body: `The **🦉 Owl** button (in lessons, projects and the Playground) opens a tutor that knows what you're working on. It guides you with questions instead of giving away answers.

AI also powers code reviews, error explanations, project grading and project generation. Choose a provider in **Settings → AI tutor**:
- **Cloud** (your own API key): Anthropic Claude, OpenAI, Google Gemini, OpenRouter, Groq, Mistral, DeepSeek.
- **Local & free**: Ollama, LM Studio, **Solframe Studio**, or any OpenAI-compatible server. Your code never leaves your computer.

Bigger models give better grades and explanations. For local use, a 7–14B coding model (e.g. Qwen Coder) works well.`,
    link: ['/settings', 'Set up AI'],
  },
  {
    icon: '🐚',
    title: 'Terminal, Command Atlas & Playground',
    body: `- Terminal lessons use a **safe simulated Linux shell**. Nothing touches your real files. **↑/↓** recalls history, **Tab** completes names.
- The **Command Atlas** lists everyday tasks side by side for Linux, macOS, PowerShell and cmd. Click any command to copy it.
- The **Playground** is a free editor for Python, JavaScript, SQL and the terminal. Nothing is graded.`,
    link: ['/atlas', 'Open the Command Atlas'],
  },
  {
    icon: '🎨',
    title: 'Themes, saving & desktop app',
    body: `- Pick a look in **Settings → Appearance**: classic Dark/Light or illustrated wallpaper themes (Void, Neon, Cinema, Synthwave, Anime, Matrix).
- Your profile, progress and Agent Lab workspace are saved **on this device** automatically; nothing is uploaded. The desktop and Android apps also keep a save file in the app's private data folder and restore it if app storage is ever cleared; the desktop app also keeps a daily backup for a week (**Settings → Your progress**).
- Use **Export save** in Settings to make your own backup or to move between the web, desktop and Android apps.
- The desktop app (Windows/Linux) works offline. Python needs internet once to download its runtime.`,
  },
];

export function Guide() {
  return (
    <div className="guide">
      <div className="page-hero" style={{ backgroundImage: 'url(./art/hero-guide.webp)' }}>
        <div>
          <h1>📘 How DevQuest works</h1>
          <p>Everything you need to know in 3 minutes: how lessons, exercises, AI feedback, projects and rewards fit together.</p>
        </div>
      </div>
      {SECTIONS.map((s) => (
        <section key={s.title} className="card guide-sec">
          <h2>{s.icon} {s.title}</h2>
          <Markdown source={s.body} />
          {s.link && <Link to={s.link[0]} className="primary-btn">{s.link[1]} →</Link>}
        </section>
      ))}
      <p className="muted small center">DevQuest is created and developed by <b>Protik</b>. Happy coding! 🚀</p>
    </div>
  );
}
