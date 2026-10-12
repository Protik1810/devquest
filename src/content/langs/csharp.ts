import { lesson, langTrack } from './helpers';

export const csharp = langTrack({
  id: 'csharp',
  title: 'C#',
  icon: '🟪',
  color: '#9b4f96',
  lang: 'csharp',
  blurb: "Microsoft's versatile language: Unity games, .NET web APIs, Windows apps and enterprise backends.",
  fields: ['Game dev (Unity)', 'Backend (.NET)', 'Desktop apps'],
  lessons: [
    lesson(
      'cs-basics',
      'Hello, C#',
      `
Modern C# allows **top-level statements**: no class or Main boilerplate for small programs.

~~~csharp
string name = "Ada";
int level = 7;
double xp = 1250.5;
var langs = new[] { "C#", "F#" };    // var = inferred type
bool online = true;

Console.WriteLine($"Hi {name}, level {level}");        // interpolated string
Console.WriteLine($"XP: {xp:F1}, langs: {langs.Length}");
~~~

C# is **statically typed**, **garbage collected**, and runs on **.NET** (Windows, Linux, macOS). Unity uses C# for gameplay scripts.
`,
      {
        prompt: 'Declare `string game = "Space Quest"` and `int lives = 3`. Print `Space Quest: 3 lives left`, then on the next line the number of characters in `game`.',
        starter: '// your code\n',
        solution: 'string game = "Space Quest";\nint lives = 3;\nConsole.WriteLine($"{game}: {lives} lives left");\nConsole.WriteLine(game.Length);\n',
        expected: 'Space Quest: 3 lives left\n11',
        hints: ['Console.WriteLine($"{game}: {lives} lives left");', 'game.Length'],
      },
      [['C# string interpolation', '$"Hello {name}" embeds expressions; {x:F2} formats with 2 decimals.']],
    ),
    lesson(
      'cs-control',
      'Control flow & methods',
      `
~~~csharp
static int Factorial(int n) => n <= 1 ? 1 : n * Factorial(n - 1);   // expression-bodied

for (int i = 0; i < 3; i++) { }
foreach (var s in names) { }

string kind = day switch {        // switch expression
    "Sat" or "Sun" => "weekend",
    _ => "weekday",
};
~~~

In top-level programs, local functions can be declared after use. In classes, methods have access modifiers (\`public\`, \`private\`) and can be \`static\`.
`,
      {
        prompt: 'Write a local function `string Grade(int score)` using a switch expression with relational patterns (`>= 90 => "A"`, `>= 80 => "B"`, `>= 70 => "C"`, `_ => "F"`). Print the grade for 95, 83, 71 and 40 on one line separated by spaces.',
        starter: 'string Grade(int score)\n{\n    return "";\n}\n\nvar scores = new[] { 95, 83, 71, 40 };\n// print grades on one line\n',
        solution: 'string Grade(int score) => score switch\n{\n    >= 90 => "A",\n    >= 80 => "B",\n    >= 70 => "C",\n    _ => "F",\n};\n\nvar scores = new[] { 95, 83, 71, 40 };\nConsole.WriteLine(string.Join(" ", scores.Select(Grade)));\n',
        expected: 'A B C F',
        hints: ['score switch { >= 90 => "A", ... _ => "F" }', 'string.Join(" ", scores.Select(Grade))'],
      },
      [['C# switch expression', 'value switch { pattern => result, _ => default } returns a value; supports relational patterns like >= 90.']],
    ),
    lesson(
      'cs-classes',
      'Classes, properties & interfaces',
      `
~~~csharp
interface IDamageable { void TakeDamage(int amount); }

class Player : IDamageable
{
    public string Name { get; }                 // read-only auto-property
    public int Health { get; private set; } = 100;

    public Player(string name) => Name = name;

    public void TakeDamage(int amount) => Health = Math.Max(0, Health - amount);
    public bool IsAlive => Health > 0;          // computed property
}

record Point(int X, int Y);                     // immutable data type
~~~

**Properties** replace getters/setters. In Unity, components follow this exact style.
`,
      {
        prompt: 'Implement `class Enemy` with `Name`, `Health` (starts at the constructor value) and `Hit(int damage)` which lowers health but never below 0. Run the script.',
        starter: 'var orc = new Enemy("Orc", 50);\norc.Hit(20);\nConsole.WriteLine($"{orc.Name}: {orc.Health}");\norc.Hit(100);\nConsole.WriteLine($"{orc.Name}: {orc.Health} alive={orc.IsAlive}");\n\nclass Enemy\n{\n    // your code\n}\n',
        solution: 'var orc = new Enemy("Orc", 50);\norc.Hit(20);\nConsole.WriteLine($"{orc.Name}: {orc.Health}");\norc.Hit(100);\nConsole.WriteLine($"{orc.Name}: {orc.Health} alive={orc.IsAlive}");\n\nclass Enemy\n{\n    public string Name { get; }\n    public int Health { get; private set; }\n    public bool IsAlive => Health > 0;\n\n    public Enemy(string name, int health)\n    {\n        Name = name;\n        Health = health;\n    }\n\n    public void Hit(int damage) => Health = Math.Max(0, Health - damage);\n}\n',
        expected: 'Orc: 30\nOrc: 0 alive=False',
        hints: ['public int Health { get; private set; }', 'Hit: Health = Math.Max(0, Health - damage);', 'IsAlive => Health > 0'],
      },
      [['C# auto-property', 'public int X { get; private set; } is a field with a public getter and private setter.']],
    ),
    lesson(
      'cs-linq',
      'Collections & LINQ',
      `
**LINQ** (Language Integrated Query) queries any collection with a SQL-like, chainable API:

~~~csharp
var nums = new List<int> { 5, 2, 8, 1, 9 };
var bigSquares = nums.Where(n => n > 3).Select(n => n * n).ToList();   // [25, 64, 81]
var total = nums.Sum();
var byParity = nums.GroupBy(n => n % 2 == 0 ? "even" : "odd");

var ages = new Dictionary<string, int> { ["ada"] = 36, ["linus"] = 28 };
foreach (var (name, age) in ages.OrderBy(kv => kv.Key)) Console.WriteLine($"{name} {age}");
~~~
`,
      {
        prompt: 'Given the list of `(Name, Team, Score)` tuples, print each team and its total score as `Team: total`, highest total first.',
        starter: 'var players = new List<(string Name, string Team, int Score)>\n{\n    ("Ada", "Red", 30), ("Bob", "Blue", 25), ("Cy", "Red", 15), ("Dee", "Blue", 40), ("Eve", "Green", 20),\n};\n// group by team, sum scores, order by total descending\n',
        solution: 'var players = new List<(string Name, string Team, int Score)>\n{\n    ("Ada", "Red", 30), ("Bob", "Blue", 25), ("Cy", "Red", 15), ("Dee", "Blue", 40), ("Eve", "Green", 20),\n};\nvar totals = players\n    .GroupBy(p => p.Team)\n    .Select(g => (Team: g.Key, Total: g.Sum(p => p.Score)))\n    .OrderByDescending(t => t.Total);\nforeach (var t in totals) Console.WriteLine($"{t.Team}: {t.Total}");\n',
        expected: 'Blue: 65\nRed: 45\nGreen: 20',
        hints: ['players.GroupBy(p => p.Team)', '.Select(g => (Team: g.Key, Total: g.Sum(p => p.Score))).OrderByDescending(t => t.Total)'],
      },
      [['LINQ', 'Query operators (Where, Select, GroupBy, OrderBy, Sum…) for collections, databases and more.']],
    ),
    lesson(
      'cs-async',
      'Async/await & exceptions',
      `
C# invented **async/await** (2012), later adopted by JavaScript, Python, Rust and Swift:

~~~csharp
async Task<string> FetchAsync(int id)
{
    await Task.Delay(100);            // pretend network call: doesn't block the thread
    return $"item {id}";
}

var results = await Task.WhenAll(FetchAsync(1), FetchAsync(2));   // run concurrently

try { int.Parse("abc"); }
catch (FormatException e) { Console.WriteLine($"bad input: {e.Message}"); }
~~~
`,
      {
        prompt: 'Write `async Task<int> LoadScoreAsync(string name)` that awaits `Task.Delay(10)` and returns the name\'s length × 10. Load `"ada"`, `"linus"`, `"grace"` concurrently with `Task.WhenAll` and print each score on its own line, then the total.',
        starter: 'async Task<int> LoadScoreAsync(string name)\n{\n    return 0;\n}\n\nvar names = new[] { "ada", "linus", "grace" };\n// load all concurrently and print\n',
        solution: 'async Task<int> LoadScoreAsync(string name)\n{\n    await Task.Delay(10);\n    return name.Length * 10;\n}\n\nvar names = new[] { "ada", "linus", "grace" };\nvar scores = await Task.WhenAll(names.Select(LoadScoreAsync));\nforeach (var s in scores) Console.WriteLine(s);\nConsole.WriteLine(scores.Sum());\n',
        expected: '30\n50\n50\n130',
        hints: ['await Task.Delay(10); return name.Length * 10;', 'var scores = await Task.WhenAll(names.Select(LoadScoreAsync));'],
      },
      [['async/await', 'await pauses the method without blocking the thread until the Task completes.']],
    ),
    lesson(
      'cs-project',
      '🛠️ Mini project: Unity-style inventory',
      `
Game inventories are a classic C# exercise: dictionaries, classes, validation and events.
`,
      {
        prompt: 'Implement `Inventory` with `Add(string item, int qty)`, `Remove(string item, int qty)` (returns `false` if not enough) and `Report()` returning items sorted by name like `arrow x40, potion x2`. Run the script.',
        starter: 'var inv = new Inventory();\ninv.Add("potion", 3);\ninv.Add("arrow", 50);\nConsole.WriteLine(inv.Remove("potion", 1));\nConsole.WriteLine(inv.Remove("arrow", 99));\ninv.Remove("arrow", 10);\nConsole.WriteLine(inv.Report());\n\nclass Inventory\n{\n    // your code\n}\n',
        solution: 'var inv = new Inventory();\ninv.Add("potion", 3);\ninv.Add("arrow", 50);\nConsole.WriteLine(inv.Remove("potion", 1));\nConsole.WriteLine(inv.Remove("arrow", 99));\ninv.Remove("arrow", 10);\nConsole.WriteLine(inv.Report());\n\nclass Inventory\n{\n    private readonly Dictionary<string, int> items = new();\n\n    public void Add(string item, int qty) => items[item] = items.GetValueOrDefault(item) + qty;\n\n    public bool Remove(string item, int qty)\n    {\n        if (items.GetValueOrDefault(item) < qty) return false;\n        items[item] -= qty;\n        if (items[item] == 0) items.Remove(item);\n        return true;\n    }\n\n    public string Report() => string.Join(", ", items.OrderBy(kv => kv.Key).Select(kv => $"{kv.Key} x{kv.Value}"));\n}\n',
        expected: 'True\nFalse\narrow x40, potion x2',
        hints: ['items.GetValueOrDefault(item) returns 0 for missing keys.', 'Report: items.OrderBy(kv => kv.Key).Select(kv => $"{kv.Key} x{kv.Value}")'],
      },
      [],
      80,
    ),
  ],
});
