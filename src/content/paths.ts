import type { CareerPath, PathStep } from './types';

/**
 * Career paths: a curated, ordered route through tracks.
 * Every path includes the shared engineering core (foundations, programming basics, tools, CS, databases, methodology, career);
 * `choose` steps let the learner pick their main language.
 */
export const PATHS: CareerPath[] = [
  {
    id: 'frontend',
    title: 'Frontend Developer',
    icon: '🎨',
    color: '#ec4899',
    blurb: 'Build the interfaces people use: fast, accessible, beautiful web apps.',
    roles: ['Frontend Developer', 'UI Engineer', 'Web Developer'],
    outcomes: ['Build responsive pages with HTML & CSS', 'Write typed, interactive apps in TypeScript and React', 'Understand browsers, HTTP and web security', 'Ship and test production frontends'],
    stages: [
      { name: 'Foundations', steps: ['foundations', 'programming', 'shell', 'git'] },
      { name: 'Languages', steps: ['javascript', 'typescript'] },
      { name: 'The web platform', steps: ['web', 'react', 'networking'] },
      { name: 'Computer science', steps: ['dsa'] },
      { name: 'Engineering practice', steps: ['methodology', 'architecture', 'security'] },
      { name: 'Get hired', steps: ['career'] },
    ],
    projects: ['web-portfolio', 'web-kanban', 'markdown-converter', 'library-system'],
  },
  {
    id: 'backend',
    title: 'Backend Developer',
    icon: '⚙️',
    color: '#3b82f6',
    blurb: 'Design APIs, databases and services that power apps at scale.',
    roles: ['Backend Developer', 'API Engineer', 'Software Engineer'],
    outcomes: ['Build REST APIs in your chosen language', 'Model data and write efficient SQL', 'Understand transactions, caching and queues', 'Containerise and deploy services'],
    stages: [
      { name: 'Foundations', steps: ['foundations', 'programming', 'python', 'shell', 'git'] },
      { name: 'Your backend language', steps: [{ choose: 'lang', label: 'Main backend language', options: ['python', 'go', 'java', 'csharp', 'typescript', 'php', 'ruby'] }] },
      { name: 'Data', steps: ['sql', { choose: 'rdbms', label: 'Relational database', options: ['postgresql', 'mysql'] }, 'databases', 'redis', 'mongodb'] },
      { name: 'Computer science', steps: ['dsa', 'networking', 'systems'] },
      { name: 'Web & ops', steps: ['web', 'devops', 'security'] },
      { name: 'Engineering practice', steps: ['methodology', 'architecture'] },
      { name: 'Get hired', steps: ['career'] },
    ],
    projects: ['bank-system', 'expense-report', 'search-engine', 'calculator'],
  },
  {
    id: 'fullstack',
    title: 'Full-Stack Developer',
    icon: '🧩',
    color: '#8b5cf6',
    blurb: 'Own features end to end: UI, API, database and deployment, in one language.',
    roles: ['Full-Stack Developer', 'Product Engineer', 'Startup Engineer'],
    outcomes: ['Build React frontends and Node-style backends in TypeScript', 'Design databases and APIs', 'Deploy with containers and CI/CD', 'Make sound architecture trade-offs'],
    stages: [
      { name: 'Foundations', steps: ['foundations', 'programming', 'shell', 'git'] },
      { name: 'Languages', steps: ['javascript', 'typescript'] },
      { name: 'Frontend', steps: ['web', 'react'] },
      { name: 'Backend & data', steps: ['sql', { choose: 'rdbms', label: 'Relational database', options: ['postgresql', 'mysql'] }, 'mongodb', 'redis', 'databases', 'networking'] },
      { name: 'Computer science', steps: ['dsa'] },
      { name: 'Ops & quality', steps: ['devops', 'security', 'methodology', 'architecture'] },
      { name: 'Get hired', steps: ['career'] },
    ],
    projects: ['web-kanban', 'web-portfolio', 'library-system', 'bank-system'],
  },
  {
    id: 'mobile',
    title: 'Mobile App Developer',
    icon: '📱',
    color: '#22c55e',
    blurb: 'Build apps for Android and iOS, natively or with one cross-platform codebase.',
    roles: ['Android Developer', 'iOS Developer', 'Flutter Developer'],
    outcomes: ['Write apps in Kotlin, Swift or Dart', 'Structure apps with MVVM and unidirectional data flow', 'Work with APIs and offline storage', 'Publish to Google Play and the App Store'],
    stages: [
      { name: 'Foundations', steps: ['foundations', 'programming', 'git'] },
      { name: 'Your platform language', steps: [{ choose: 'lang', label: 'Platform', options: ['kotlin', 'swift', 'dart'] }] },
      { name: 'Mobile engineering', steps: ['mobile', 'networking', 'sql', 'databases', 'mongodb'] },
      { name: 'Computer science', steps: ['dsa'] },
      { name: 'Engineering practice', steps: ['methodology', 'architecture', 'security'] },
      { name: 'Get hired', steps: ['career'] },
    ],
    projects: ['todo-manager', 'guess-game', 'expense-report'],
  },
  {
    id: 'data',
    title: 'Data Analyst / Scientist',
    icon: '📊',
    color: '#0ea5e9',
    blurb: 'Turn raw data into decisions with SQL, Python, statistics and clear reports.',
    roles: ['Data Analyst', 'Data Scientist', 'BI Analyst'],
    outcomes: ['Query and model data with SQL', 'Clean and analyse data with pandas', 'Run statistics and regressions in R', 'Communicate findings clearly'],
    stages: [
      { name: 'Foundations', steps: ['foundations', 'programming', 'python'] },
      { name: 'Data skills', steps: ['sql', { choose: 'rdbms', label: 'Relational database', options: ['postgresql', 'mysql'] }, 'data-analysis', 'r', 'databases'] },
      { name: 'Machine learning', steps: ['ai'] },
      { name: 'Computer science', steps: ['dsa'] },
      { name: 'Engineering practice', steps: ['git', 'methodology'] },
      { name: 'Get hired', steps: ['career'] },
    ],
    projects: ['expense-report', 'search-engine'],
  },
  {
    id: 'ai',
    title: 'AI / ML Engineer',
    icon: '🤖',
    color: '#d946ef',
    blurb: 'Build machine-learning systems and LLM-powered products: from data to deployed models.',
    roles: ['ML Engineer', 'AI Engineer', 'Applied Scientist'],
    outcomes: ['Train models from scratch and with libraries', 'Prepare data with pandas', 'Build RAG and LLM applications', 'Deploy and scale AI systems'],
    stages: [
      { name: 'Foundations', steps: ['foundations', 'programming', 'python', 'shell', 'git'] },
      { name: 'Data & math', steps: ['data-analysis', 'sql', 'dsa'] },
      { name: 'AI', steps: ['ai'] },
      { name: 'Systems for AI', steps: ['databases', 'devops', 'architecture'] },
      { name: 'Engineering practice', steps: ['methodology', 'security'] },
      { name: 'Get hired', steps: ['career'] },
    ],
    projects: ['search-engine', 'tic-tac-toe', 'expense-report'],
  },
  {
    id: 'devops',
    title: 'DevOps / Cloud Engineer',
    icon: '☁️',
    color: '#0891b2',
    blurb: 'Automate infrastructure, CI/CD and reliability for systems that never sleep.',
    roles: ['DevOps Engineer', 'Cloud Engineer', 'Site Reliability Engineer'],
    outcomes: ['Master Linux, Bash and PowerShell automation', 'Containerise and orchestrate with Docker & Kubernetes', 'Build CI/CD pipelines and infrastructure as code', 'Monitor and keep systems reliable'],
    stages: [
      { name: 'Foundations', steps: ['foundations', 'programming', 'shell', 'git'] },
      { name: 'Scripting', steps: ['bash', 'python', { choose: 'lang', label: 'Second language', options: ['go', 'powershell'] }] },
      { name: 'Systems & networks', steps: ['systems', 'networking'] },
      { name: 'Operations', steps: ['devops', { choose: 'rdbms', label: 'Relational database', options: ['postgresql', 'mysql'] }, 'redis', 'databases', 'security'] },
      { name: 'Engineering practice', steps: ['architecture', 'methodology'] },
      { name: 'Get hired', steps: ['career'] },
    ],
    projects: ['expense-report', 'calculator'],
  },
  {
    id: 'systems',
    title: 'Systems & Embedded Engineer',
    icon: '🔧',
    color: '#ef4444',
    blurb: 'Work close to the metal: operating systems, embedded devices, compilers and performance.',
    roles: ['Systems Programmer', 'Embedded Engineer', 'Firmware Engineer'],
    outcomes: ['Write safe, fast code in C, C++ and Rust', 'Understand memory, OS internals and concurrency', 'Build data structures from scratch', 'Profile and optimise performance'],
    stages: [
      { name: 'Foundations', steps: ['foundations', 'programming', 'shell', 'git'] },
      { name: 'Systems languages', steps: ['c', 'cpp', 'rust'] },
      { name: 'Computer science', steps: ['dsa', 'systems', 'networking'] },
      { name: 'Engineering practice', steps: ['methodology', 'architecture'] },
      { name: 'Get hired', steps: ['career'] },
    ],
    projects: ['calculator', 'maze-solver', 'search-engine'],
  },
  {
    id: 'gamedev',
    title: 'Game Developer',
    icon: '🎮',
    color: '#f97316',
    blurb: 'Build games and interactive worlds with engines like Unity, Unreal and Godot.',
    roles: ['Gameplay Programmer', 'Game Developer', 'Tools Programmer'],
    outcomes: ['Program gameplay in C# (Unity) or C++ (Unreal)', 'Use vectors, physics and collision maths', 'Script with Lua', 'Design game AI and systems'],
    stages: [
      { name: 'Foundations', steps: ['foundations', 'programming', 'git', 'javascript'] },
      { name: 'Engine language', steps: [{ choose: 'lang', label: 'Engine language', options: ['csharp', 'cpp'] }, 'lua'] },
      { name: 'Game programming', steps: ['gamedev', 'dsa'] },
      { name: 'Engineering practice', steps: ['methodology', 'architecture'] },
      { name: 'Get hired', steps: ['career'] },
    ],
    projects: ['tic-tac-toe', 'maze-solver', 'guess-game'],
  },
  {
    id: 'security',
    title: 'Cybersecurity Engineer',
    icon: '🛡️',
    color: '#dc2626',
    blurb: 'Defend systems and find vulnerabilities before attackers do.',
    roles: ['Security Analyst (SOC)', 'Penetration Tester', 'Application Security Engineer'],
    outcomes: ['Understand networks, OS internals and the web deeply', 'Find and fix injection, XSS and auth flaws', 'Automate investigations with Python, Bash and PowerShell', 'Threat-model and harden systems'],
    stages: [
      { name: 'Foundations', steps: ['foundations', 'programming', 'shell', 'git'] },
      { name: 'Scripting', steps: ['python', 'bash', 'powershell'] },
      { name: 'How systems work', steps: ['networking', 'systems', 'web', 'sql', 'databases'] },
      { name: 'Security', steps: ['security', 'c'] },
      { name: 'Engineering practice', steps: ['methodology', 'architecture'] },
      { name: 'Get hired', steps: ['career'] },
    ],
    projects: ['password-checker', 'web-portfolio', 'expense-report'],
  },
  {
    id: 'blockchain',
    title: 'Blockchain Developer',
    icon: '⛓️',
    color: '#6366f1',
    blurb: 'Build smart contracts and decentralised applications, securely.',
    roles: ['Smart Contract Developer', 'Web3 Developer', 'Protocol Engineer'],
    outcomes: ['Understand hashes, consensus and wallets', 'Write and secure Solidity smart contracts', 'Build dApp frontends in TypeScript', 'Use Rust for high-performance chains'],
    stages: [
      { name: 'Foundations', steps: ['foundations', 'programming', 'git', 'javascript', 'typescript'] },
      { name: 'Blockchain', steps: ['blockchain', 'solidity'] },
      { name: 'Going deeper', steps: ['rust', 'networking', 'security', 'dsa'] },
      { name: 'Engineering practice', steps: ['methodology', 'architecture'] },
      { name: 'Get hired', steps: ['career'] },
    ],
    projects: ['bank-system', 'search-engine'],
  },
];

export const pathById = (id: string) => PATHS.find((p) => p.id === id);

/** Resolve a path's steps to concrete track ids using the learner's choices (first option by default). */
export function resolveSteps(steps: PathStep[], choices: Record<string, string>): string[] {
  return steps.map((s) => (typeof s === 'string' ? s : choices[s.choose] && s.options.includes(choices[s.choose]) ? choices[s.choose] : s.options[0]));
}

export function pathTrackIds(path: CareerPath, choices: Record<string, string>): string[] {
  const ids = path.stages.flatMap((st) => resolveSteps(st.steps, choices));
  return [...new Set(ids)];
}

/** Recommend a path from the onboarding quiz answers. */
export function recommendPath(goal: string): string {
  const map: Record<string, string> = {
    websites: 'frontend',
    apis: 'backend',
    everything: 'fullstack',
    apps: 'mobile',
    data: 'data',
    ai: 'ai',
    infra: 'devops',
    lowlevel: 'systems',
    games: 'gamedev',
    hacking: 'security',
    crypto: 'blockchain',
  };
  return map[goal] ?? 'fullstack';
}
