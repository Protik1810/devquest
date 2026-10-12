import type { Lesson, Track } from './types';

type Lang = { id: string; name: string; emoji: string; year: string; by: string; kind: string; good: string; uses: string; code: string; codeLang: string; notes: string; q: { q: string; options: string[]; answer: number } };

const LANGS: Lang[] = [
  {
    id: 'go', name: 'Go', emoji: '🐹', year: '2009', by: 'Google', kind: 'compiled, statically typed, garbage collected',
    good: 'Simplicity, fast compiles, single static binaries, first-class concurrency (goroutines & channels).',
    uses: 'Cloud infrastructure (Docker, Kubernetes, Terraform), backend APIs, CLIs, networking.',
    codeLang: 'go',
    code: `package main

import "fmt"

type Hero struct {
    Name string
    HP   int
}

func (h *Hero) Hit(dmg int) { h.HP -= dmg }

func main() {
    h := &Hero{Name: "Ada", HP: 100}
    h.Hit(30)
    fmt.Printf("%s has %d HP\\n", h.Name, h.HP)

    results := make(chan int)
    for i := 1; i <= 3; i++ {
        go func(n int) { results <- n * n }(i) // goroutine
    }
    for i := 0; i < 3; i++ { fmt.Println(<-results) }
}`,
    notes: 'No classes or exceptions: Go uses structs, interfaces and explicit `if err != nil` error returns.',
    q: { q: 'How does Go usually handle errors?', options: ['try/catch', 'Returning an error value', 'Exceptions only', 'It ignores them'], answer: 1 },
  },
  {
    id: 'rust', name: 'Rust', emoji: '🦀', year: '2015', by: 'Mozilla → Rust Foundation', kind: 'compiled, statically typed, no garbage collector',
    good: 'C/C++-level speed with **memory safety** guaranteed at compile time via ownership & borrowing. Fearless concurrency.',
    uses: 'Systems programming, CLIs, game engines, WebAssembly, browsers, OS kernels (Linux drivers), high-performance backends.',
    codeLang: 'rust',
    code: `fn longest<'a>(a: &'a str, b: &'a str) -> &'a str {
    if a.len() > b.len() { a } else { b }
}

fn main() {
    let name = String::from("Ferris");
    let borrowed = &name;           // borrow, don't move
    println!("Hello {borrowed}");

    let nums = vec![1, 2, 3, 4];
    let evens: Vec<i32> = nums.iter().filter(|n| *n % 2 == 0).cloned().collect();
    println!("{:?} {}", evens, longest("hi", "hello"));

    match "42".parse::<i32>() {
        Ok(n) => println!("number {n}"),
        Err(e) => println!("error: {e}"),
    }
}`,
    notes: 'Each value has one **owner**; when it goes out of scope it\'s freed. You can have many immutable borrows OR one mutable borrow. The compiler (the "borrow checker") enforces it.',
    q: { q: 'How does Rust achieve memory safety without a GC?', options: ['Reference counting only', 'Ownership & borrowing checked at compile time', 'Manual free()', 'It runs in a VM'], answer: 1 },
  },
  {
    id: 'java', name: 'Java', emoji: '☕', year: '1995', by: 'Sun → Oracle', kind: 'compiled to JVM bytecode, statically typed, GC',
    good: '"Write once, run anywhere" on the JVM, a massive ecosystem, excellent tooling, and huge enterprise adoption.',
    uses: 'Enterprise backends (Spring Boot), Android (legacy), big data (Kafka, Hadoop, Spark), banking systems.',
    codeLang: 'java',
    code: `import java.util.*;

public class Main {
    record Hero(String name, int hp) {}

    interface Greeter { String greet(String name); }

    public static void main(String[] args) {
        var heroes = List.of(new Hero("Ada", 90), new Hero("Linus", 70));
        var strong = heroes.stream()
            .filter(h -> h.hp() > 80)
            .map(Hero::name)
            .toList();
        System.out.println(strong);   // [Ada]

        Greeter g = n -> "Hello " + n;  // lambda implementing an interface
        System.out.println(g.greet("World"));
    }
}`,
    notes: 'Everything lives in classes. Modern Java has records, lambdas, streams, `var`, pattern matching and virtual threads.',
    q: { q: 'Java source is compiled to…', options: ['Machine code for each OS', 'Bytecode run by the JVM', 'JavaScript', 'Python'], answer: 1 },
  },
  {
    id: 'csharp', name: 'C#', emoji: '🟪', year: '2000', by: 'Microsoft', kind: 'compiled to .NET IL, statically typed, GC',
    good: 'Productive, modern language features (LINQ, async/await, pattern matching), cross-platform with .NET.',
    uses: 'Windows & cross-platform apps, ASP.NET Core backends, **Unity** game development, enterprise software.',
    codeLang: 'csharp',
    code: `using System;
using System.Linq;

record Hero(string Name, int Hp);

class Program {
    static async Task Main() {
        var heroes = new[] { new Hero("Ada", 90), new Hero("Grace", 60) };
        var names = heroes.Where(h => h.Hp > 50)
                          .OrderBy(h => h.Name)
                          .Select(h => h.Name);
        Console.WriteLine(string.Join(", ", names));

        await Task.Delay(100);   // async/await
        Console.WriteLine($"Done at {DateTime.Now:t}");
    }
}`,
    notes: 'C# pioneered async/await, later copied by JavaScript, Python, Rust and others. LINQ gives SQL-like queries over collections.',
    q: { q: 'Which game engine primarily uses C#?', options: ['Unreal', 'Unity', 'Godot only', 'Source'], answer: 1 },
  },
  {
    id: 'cpp', name: 'C & C++', emoji: '🔧', year: '1972 / 1985', by: 'Dennis Ritchie / Bjarne Stroustrup', kind: 'compiled, statically typed, manual memory',
    good: 'Maximum performance and hardware control. C is small and universal; C++ adds classes, templates and RAII.',
    uses: 'Operating systems, embedded devices, game engines (Unreal), browsers, databases, trading systems, compilers.',
    codeLang: 'cpp',
    code: `#include <iostream>
#include <vector>
#include <memory>
#include <algorithm>

struct Hero {
    std::string name;
    int hp;
};

int main() {
    std::vector<Hero> heroes{{"Ada", 90}, {"Linus", 70}};
    std::sort(heroes.begin(), heroes.end(),
              [](const Hero& a, const Hero& b) { return a.hp < b.hp; });

    auto boss = std::make_unique<Hero>(Hero{"Dragon", 500}); // freed automatically (RAII)
    for (const auto& h : heroes) std::cout << h.name << " " << h.hp << "\\n";
    std::cout << boss->name << "\\n";
}`,
    notes: 'Modern C++ avoids raw `new`/`delete` in favor of smart pointers (`unique_ptr`, `shared_ptr`) and **RAII**: resources are released in destructors.',
    q: { q: 'What does RAII mean in C++?', options: ['Resources tied to object lifetime', 'Random access integer index', 'A garbage collector', 'A build tool'], answer: 0 },
  },
  {
    id: 'kotlin', name: 'Kotlin', emoji: '🟧', year: '2016', by: 'JetBrains', kind: 'JVM (also native & JS), statically typed',
    good: 'Concise, null-safe, fully interoperable with Java. Coroutines for async.',
    uses: '**Android** (Google\'s preferred language), Spring/Ktor backends, Kotlin Multiplatform.',
    codeLang: 'kotlin',
    code: `data class Hero(val name: String, val hp: Int)

fun main() {
    val heroes = listOf(Hero("Ada", 90), Hero("Linus", 70))
    val names = heroes.filter { it.hp > 75 }.map { it.name }
    println(names)

    val maybe: String? = null       // nullable type
    println(maybe?.length ?: 0)     // safe call + elvis operator
}`,
    notes: 'Types are non-null by default; `String?` must be checked before use, eliminating most NullPointerExceptions.',
    q: { q: 'What does `String?` mean in Kotlin?', options: ['An optional/nullable String', 'A regex', 'A char', 'A list of strings'], answer: 0 },
  },
  {
    id: 'swift', name: 'Swift', emoji: '🐦', year: '2014', by: 'Apple', kind: 'compiled, statically typed, ARC memory',
    good: 'Safe, fast, expressive; optionals, value types, protocols. SwiftUI for declarative UIs.',
    uses: 'iOS, macOS, watchOS, visionOS apps; increasingly server-side.',
    codeLang: 'swift',
    code: `struct Hero {
    let name: String
    var hp: Int
    mutating func hit(_ dmg: Int) { hp = max(0, hp - dmg) }
}

var ada = Hero(name: "Ada", hp: 100)
ada.hit(30)
print("\\(ada.name) has \\(ada.hp) HP")

let input = "42"
if let n = Int(input) {        // unwrap the optional safely
    print("Parsed \\(n)")
}`,
    notes: 'Memory is managed by **ARC** (automatic reference counting) rather than a tracing garbage collector.',
    q: { q: 'Swift manages memory using…', options: ['Manual malloc/free', 'ARC (automatic reference counting)', 'A tracing GC', 'It has no memory'], answer: 1 },
  },
  {
    id: 'php-ruby', name: 'PHP & Ruby', emoji: '💎', year: '1995', by: 'Rasmus Lerdorf / Yukihiro Matsumoto', kind: 'interpreted, dynamically typed',
    good: 'PHP: runs a huge share of the web (WordPress), easy hosting, modern Laravel. Ruby: developer happiness, elegant syntax, Rails conventions.',
    uses: 'Web backends, CMSs, e-commerce (Shopify is Rails), rapid prototyping.',
    codeLang: 'ruby',
    code: `# Ruby
heroes = [{ name: "Ada", hp: 90 }, { name: "Linus", hp: 70 }]
strong = heroes.select { |h| h[:hp] > 80 }.map { |h| h[:name] }
puts strong.inspect
3.times { |i| puts "Round #{i + 1}" }

# PHP equivalent:
# <?php
# $heroes = [["name" => "Ada", "hp" => 90], ["name" => "Linus", "hp" => 70]];
# $strong = array_filter($heroes, fn($h) => $h["hp"] > 80);
# echo json_encode(array_column($strong, "name"));`,
    notes: 'Both are mature, productive web languages with strong frameworks: **Laravel** (PHP) and **Ruby on Rails**.',
    q: { q: 'Which framework is Ruby best known for?', options: ['Django', 'Rails', 'Laravel', 'Spring'], answer: 1 },
  },
];

const langLesson = (l: Lang): Lesson => ({
  id: `lang-${l.id}`,
  title: `${l.emoji} ${l.name}`,
  xp: 35,
  body: `
| | |
|---|---|
| **Created** | ${l.year} by ${l.by} |
| **Type** | ${l.kind} |
| **Strengths** | ${l.good} |
| **Used for** | ${l.uses} |

~~~${l.codeLang}
${l.code}
~~~

${l.notes}
`,
  exercise: { kind: 'quiz', questions: [l.q] },
  cards: [{ front: `${l.name}: main strengths`, back: l.good.replace(/\*\*/g, '') }],
});

export const polyglot: Track = {
  id: 'polyglot',
  title: 'Polyglot Tour: Other Languages',
  icon: '🗺️',
  tier: 9,
  color: '#64748b',
  blurb: 'Go, Rust, Java, C#, C/C++, Kotlin, Swift, PHP and Ruby: what each is for, with side-by-side code.',
  depth: 'overview',
  lessons: [
    {
      id: 'lang-compare',
      title: 'Choosing a language',
      xp: 40,
      body: `
There's no "best" language, only the best fit for a job. Once you know one language well, the next ones are much easier: the **concepts** (variables, loops, functions, data structures, types) transfer.

{{ill:langmap}}

**Paradigms:**
- **Imperative / procedural**: step-by-step instructions (C, Go)
- **Object-oriented**: objects with state & behavior (Java, C#, Python)
- **Functional**: pure functions, immutability (Haskell, Elixir, F#, Clojure; FP style in JS/Python/Rust)
- **Declarative**: describe *what*, not *how* (SQL, HTML, Terraform)

**Typing:**
| | Static (checked at compile time) | Dynamic (checked at run time) |
|---|---|---|
| **Strong** | Rust, Java, Go, C#, TypeScript | Python, Ruby |
| **Weak** (implicit conversions) | C | JavaScript, PHP |

**Quick guide:**
| Goal | Good choices |
|---|---|
| First language | Python, JavaScript |
| Web frontend | JavaScript/TypeScript |
| Backend APIs | Go, Python, TypeScript, Java, C# |
| Cloud/DevOps tools | Go, Python |
| Mobile | Kotlin (Android), Swift (iOS), Dart/Flutter, React Native |
| Games | C# (Unity), C++ (Unreal), GDScript (Godot) |
| Systems/embedded | C, C++, Rust |
| Data/AI | Python (+ SQL) |
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'Which is statically typed?', options: ['Python', 'Ruby', 'Go', 'JavaScript'], answer: 2 },
          { q: 'Best fit for an iOS app?', options: ['Swift', 'PHP', 'Bash', 'SQL'], answer: 0 },
          { q: 'SQL is an example of which paradigm?', options: ['Object-oriented', 'Declarative', 'Assembly', 'Procedural'], answer: 1 },
        ],
      },
    },
    ...LANGS.map(langLesson),
  ],
};

export const ai: Track = {
  id: 'ai',
  title: 'AI & Machine Learning',
  icon: '🤖',
  tier: 9,
  color: '#d946ef',
  blurb: 'How ML learns from data, neural networks, LLMs, embeddings, RAG and building AI agents.',
  depth: 'overview',
  lessons: [
    {
      id: 'ai-ml',
      title: 'Machine learning basics',
      xp: 45,
      body: `
Traditional programming: **rules + data → answers**. Machine learning: **data + answers → rules** (a **model**).

**Types of ML:**
- **Supervised**: learn from labelled examples (spam / not spam, house price prediction). *Classification* predicts categories; *regression* predicts numbers.
- **Unsupervised**: find structure without labels (clustering customers, anomaly detection).
- **Reinforcement learning**: an agent learns by trial and reward (game AI, robotics).

**The workflow:**
1. Collect & clean data (most of the work!)
2. Split into **training**, **validation** and **test** sets
3. Train a model (minimize a **loss function**)
4. Evaluate on unseen data: accuracy, precision/recall, error
5. Watch out for **overfitting**: memorizing training data instead of generalizing

~~~python
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
model = RandomForestClassifier().fit(X_train, y_train)
print("accuracy:", model.score(X_test, y_test))
~~~

Toolbox: **NumPy**, **pandas**, **scikit-learn**, **PyTorch**, Jupyter notebooks.
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'Predicting a house price from features is…', options: ['Classification', 'Regression', 'Clustering', 'Reinforcement learning'], answer: 1 },
          { q: 'A model scores 99% on training data but 60% on new data. This is…', options: ['Underfitting', 'Overfitting', 'Perfect', 'Data leakage only'], answer: 1 },
          { q: 'Why keep a separate test set?', options: ['To train faster', 'To measure performance on unseen data', 'It is required by Python', 'To store backups'], answer: 1 },
        ],
      },
      cards: [{ front: 'Overfitting', back: 'Model fits training data too closely and fails to generalize to new data.' }],
    },
    {
      id: 'ai-nn',
      title: 'Neural networks & deep learning',
      xp: 45,
      body: `
A **neural network** is layers of simple units ("neurons"). Each computes a weighted sum of its inputs, adds a bias, and applies an **activation function** (like ReLU).

{{ill:neural}}

**Training** = adjusting millions/billions of weights:
1. **Forward pass**: compute a prediction
2. **Loss**: how wrong was it?
3. **Backpropagation**: compute how each weight contributed to the error (calculus: the chain rule)
4. **Gradient descent**: nudge every weight slightly in the direction that reduces the loss
5. Repeat over the data many times (**epochs**)

**Architectures:**
- **CNNs**: images (detect edges → shapes → objects)
- **RNNs/LSTMs**: older sequence models
- **Transformers**: use **attention** to relate every token to every other. They power modern LLMs, image generators and more
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'Which algorithm computes how each weight affects the error?', options: ['Backpropagation', 'Binary search', 'Bubble sort', 'DNS'], answer: 0 },
          { q: 'Modern LLMs are based on…', options: ['CNNs', 'Transformers', 'Decision trees', 'Linked lists'], answer: 1 },
          { q: 'Gradient descent…', options: ['Randomly changes code', 'Nudges weights to reduce the loss', 'Sorts data', 'Compresses images'], answer: 1 },
        ],
      },
      cards: [{ front: 'Gradient descent', back: 'Iteratively move parameters opposite to the gradient of the loss to minimize it.' }],
    },
    {
      id: 'ai-llm',
      title: 'LLMs, embeddings, RAG & agents',
      xp: 50,
      body: `
**Large Language Models** (like Claude) are transformers trained on huge amounts of text to predict the next **token** (a chunk of a word). Fine-tuning and human feedback make them helpful assistants.

**Key concepts for developers:**
- **Prompt**: the instructions + context you send. Clear, specific prompts with examples work best.
- **Context window**: how many tokens the model can consider at once.
- **Embeddings**: vectors of numbers representing meaning. Similar texts have nearby vectors, which enables **semantic search**.
- **RAG** (Retrieval-Augmented Generation): retrieve relevant documents (via embeddings in a vector DB), put them in the prompt, then generate a grounded answer.
- **Tool use / function calling**: the model can request your code to run functions (search, database queries, APIs).
- **Agents**: an LLM in a loop that plans, calls tools, observes results and continues until the task is done.

~~~python
import anthropic
client = anthropic.Anthropic()          # reads ANTHROPIC_API_KEY
msg = client.messages.create(
    model="claude-opus-5-5",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Explain recursion with a pizza analogy"}],
)
print(msg.content[0].text)
~~~

⚠️ LLMs can **hallucinate** (confidently state false things). Verify facts, ground answers with RAG, and keep humans in the loop for important decisions. *This app's Owl tutor is an LLM!*
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'What does RAG add to an LLM?', options: ['Faster GPUs', 'Retrieved documents as context', 'A new tokenizer', 'Image output'], answer: 1 },
          { q: 'Embeddings let you…', options: ['Compress video', 'Compare meaning numerically for semantic search', 'Encrypt data', 'Draw charts'], answer: 1 },
          { q: 'An agent is…', options: ['A single prompt', 'An LLM looping over planning, tool calls and observations', 'A database', 'A CSS framework'], answer: 1 },
        ],
      },
      cards: [
        { front: 'RAG', back: 'Retrieval-Augmented Generation: fetch relevant docs, add them to the prompt, generate a grounded answer.' },
        { front: 'Hallucination', back: 'When a model produces plausible-sounding but false information.' },
      ],
    },
  ],
};

export const career: Track = {
  id: 'career',
  title: 'Becoming a Software Engineer',
  icon: '🎓',
  tier: 10,
  color: '#facc15',
  blurb: 'Testing, clean code, building a portfolio, interviews and growing as an engineer.',
  depth: 'overview',
  lessons: [
    {
      id: 'car-quality',
      title: 'Testing & clean code',
      xp: 45,
      body: `
Professional code is **read** far more than it's written. Optimize for the next person (often future you).

**Clean code habits:**
- Meaningful names: \`days_until_expiry\`, not \`d\`
- Small functions that do one thing
- Avoid deep nesting: return early
- Comments explain **why**, code explains **what**
- Consistent formatting via tools (Prettier, Black, gofmt)
- Delete dead code; Git remembers it

**The testing pyramid:**
- **Unit tests** (many, fast): test one function in isolation
- **Integration tests** (some): components working together (API + DB)
- **End-to-end tests** (few, slow): click through the real app (Playwright, Cypress)

~~~python
# test_cart.py (run with: pytest)
from cart import total

def test_total_applies_discount():
    assert total([10, 20], discount=0.1) == 27

def test_total_empty_cart_is_zero():
    assert total([]) == 0
~~~

**TDD** (test-driven development): write a failing test → make it pass → refactor. Every bug you fix should get a test so it never returns.

**Code review**: be kind, be specific, ask questions, and review the code, not the person.
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'Which tests should you have the most of?', options: ['End-to-end', 'Unit', 'Manual', 'Load tests'], answer: 1 },
          { q: 'Comments should mainly explain…', options: ['What each line does', 'Why the code does something', 'Your name', 'Nothing ever'], answer: 1 },
          { q: 'TDD order?', options: ['Code, test, deploy', 'Failing test, make it pass, refactor', 'Refactor, test, code', 'Deploy, then test'], answer: 1 },
        ],
      },
      cards: [{ front: 'Testing pyramid', back: 'Many unit tests, fewer integration tests, few end-to-end tests.' }],
    },
    {
      id: 'car-portfolio',
      title: 'Projects & portfolio',
      xp: 40,
      body: `
**Tutorials teach syntax; projects make you an engineer.** Once you've finished a track, build something *without* step-by-step instructions.

**Project ideas by level:**
| Level | Ideas |
|---|---|
| Beginner | CLI to-do app, quiz game, unit converter, password generator |
| Intermediate | REST API + database, web scraper, Discord bot, personal blog with a static site generator |
| Advanced | Real-time chat (WebSockets), URL shortener at scale, your own shell / HTTP server / database / Git |
| Expert | Contribute to open source, build a compiler or interpreter, distributed key-value store |

**"Build your own X"** projects are the fastest way to deeply understand tools you use daily.

**A great portfolio project has:**
- a clear **README**: what it does, a screenshot/GIF, how to run it, what you learned
- clean commit history, tests, and CI
- a **live demo** when possible
- a real problem it solves (ideally your own)

Put 2–4 strong projects on GitHub rather than 20 half-finished ones.
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'The best way to escape "tutorial hell"?', options: ['Watch more tutorials', 'Build projects on your own', 'Memorize syntax', 'Switch languages often'], answer: 1 },
          { q: 'A portfolio README should include…', options: ['Only the license', 'What it does, how to run it, screenshots', 'Your salary', 'Nothing'], answer: 1 },
        ],
      },
    },
    {
      id: 'car-interviews',
      title: 'Interviews & career growth',
      xp: 45,
      body: `
**Typical interview loop:**
1. **Recruiter screen**: motivation, logistics
2. **Coding interview**: data structures & algorithms (the *DSA* track!)
3. **System design** (mid-level+): the *Architecture* track
4. **Behavioral**: past experiences, teamwork, conflict

**Coding interview method:** clarify → examples & edge cases → talk through a brute-force idea → optimize → code → test with examples → state Big-O. **Think out loud**: interviewers grade your process.

**Common patterns:** two pointers, sliding window, hash map counting, BFS/DFS, binary search, recursion/backtracking, dynamic programming, heaps (top-k), intervals.

**Behavioral answers: use STAR.** **S**ituation, **T**ask, **A**ction (what *you* did), **R**esult (with numbers if possible).

**Growing as an engineer:**
- Junior → solves well-defined tasks · Mid → owns features end-to-end · Senior → owns systems, mentors, makes trade-offs · Staff+ → shapes technical direction across teams
- Read code from great open-source projects
- Write: docs, design docs, blog posts. Clear writing = clear thinking
- Learn the business: the best engineers solve the *right* problems
- Keep learning daily. Your DevQuest streak is a great start 🔥
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'STAR stands for…', options: ['Start, Try, Act, Repeat', 'Situation, Task, Action, Result', 'Skills, Talent, Attitude, Results', 'Stack, Tree, Array, Recursion'], answer: 1 },
          { q: 'During a coding interview you should…', options: ['Stay silent until done', 'Think out loud and clarify requirements', 'Start coding immediately', 'Refuse brute force'], answer: 1 },
          { q: '"Find the longest substring without repeating characters" suggests which pattern?', options: ['Sliding window', 'Binary tree', 'Sorting', 'Recursion only'], answer: 0 },
        ],
      },
      cards: [{ front: 'STAR method', back: 'Situation, Task, Action, Result: structure for behavioral answers.' }],
    },
  ],
};
