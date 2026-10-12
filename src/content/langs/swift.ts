import { lesson, langTrack } from './helpers';

export const swift = langTrack({
  id: 'swift',
  title: 'Swift',
  icon: '🐦',
  color: '#f05138',
  lang: 'swift',
  blurb: "Apple's modern language for iPhone, iPad, Mac, Watch and Vision Pro apps. Fast, safe and expressive.",
  fields: ['iOS & macOS apps', 'Mobile'],
  lessons: [
    lesson(
      'sw-basics',
      'Hello, Swift',
      `
~~~swift
let name = "Swift"          // let = constant (prefer it)
var downloads = 1_000       // var = variable
downloads += 500
let pi: Double = 3.14159
print("Hello, \\(name)! \\(downloads) downloads")   // string interpolation
~~~

Swift is **type-safe** and **type-inferred**. Integers and doubles never mix implicitly: \`Double(intValue)\` converts.

**Coming from Python or JS?** Code at the top level of a file runs directly, with no \`main\` needed for scripts.
`,
      {
        prompt: 'Declare `let appName = "Notes"` and `var users = 40`. Increase `users` by 10%, as an `Int`. Print `Notes has 44 users`, then the app name in upper case.',
        starter: '// your code\n',
        solution: 'let appName = "Notes"\nvar users = 40\nusers += users / 10\nprint("\\(appName) has \\(users) users")\nprint(appName.uppercased())\n',
        expected: 'Notes has 44 users\nNOTES',
        hints: ['users += users / 10 (integer math)', 'appName.uppercased()'],
      },
      [['let vs var (Swift)', 'let declares a constant; var a variable. Swift prefers let.']],
    ),
    lesson(
      'sw-optionals',
      'Optionals',
      `
A value that might be missing has an **optional type** \`T?\`. You must unwrap it safely:

~~~swift
let input = "42"
let number: Int? = Int(input)         // nil if the string isn't a number

if let n = number { print(n * 2) }   // optional binding
guard let n = number else { return } // early exit (common in functions)
let value = number ?? 0               // nil-coalescing default
number!                               // force unwrap: crashes if nil (avoid)
let len = user?.name?.count           // optional chaining
~~~

Optionals eliminate a whole class of "null" crashes at compile time.
`,
      {
        prompt: 'Write `func parseScore(_ s: String) -> Int?` returning `nil` for non-numbers or values outside 0...100. Print each input\'s result, using `??` to print `invalid` for `nil`.',
        starter: 'func parseScore(_ s: String) -> Int? {\n    return nil\n}\n\nfor s in ["85", "abc", "150", "0"] {\n    // print the score or "invalid"\n}\n',
        solution: 'func parseScore(_ s: String) -> Int? {\n    guard let n = Int(s), (0...100).contains(n) else { return nil }\n    return n\n}\n\nfor s in ["85", "abc", "150", "0"] {\n    print(parseScore(s).map { String($0) } ?? "invalid")\n}\n',
        expected: '85\ninvalid\ninvalid\n0',
        hints: ['guard let n = Int(s), (0...100).contains(n) else { return nil }', 'parseScore(s).map { String($0) } ?? "invalid"'],
      },
      [['Swift optional binding', 'if let x = optional { … } runs only when the value exists, with x unwrapped.']],
    ),
    lesson(
      'sw-collections',
      'Arrays, dictionaries & closures',
      `
~~~swift
var langs = ["Swift", "Kotlin", "Dart"]
langs.append("C#")
let long = langs.filter { $0.count > 4 }          // $0 = first closure parameter
let upper = langs.map { $0.uppercased() }
let total = [1, 2, 3].reduce(0, +)

var ages: [String: Int] = ["ada": 36]
ages["linus"] = 28
for (name, age) in ages.sorted(by: { $0.key < $1.key }) { print(name, age) }
~~~
`,
      {
        prompt: 'Given `let prices = ["apple": 1.2, "bread": 2.5, "cheese": 7.0, "dates": 4.0]`, print the names of items costing more than 2 sorted alphabetically (joined by `, `), then the total of those items formatted with 2 decimals.',
        starter: 'import Foundation\n\nlet prices = ["apple": 1.2, "bread": 2.5, "cheese": 7.0, "dates": 4.0]\n// your code\n',
        solution: 'import Foundation\n\nlet prices = ["apple": 1.2, "bread": 2.5, "cheese": 7.0, "dates": 4.0]\nlet pricey = prices.filter { $0.value > 2 }\nprint(pricey.keys.sorted().joined(separator: ", "))\nprint(String(format: "%.2f", pricey.values.reduce(0, +)))\n',
        expected: 'bread, cheese, dates\n13.50',
        hints: ['prices.filter { $0.value > 2 }', 'keys.sorted().joined(separator: ", ")', 'String(format: "%.2f", …) needs import Foundation.'],
      },
      [['Swift $0', 'Shorthand name for the first closure argument: array.map { $0 * 2 }.']],
    ),
    lesson(
      'sw-structs',
      'Structs, classes & protocols',
      `
Swift prefers **structs** (value types, copied on assignment) over classes (reference types):

~~~swift
protocol Shape { func area() -> Double }      // like an interface

struct Rect: Shape {
    var w: Double, h: Double                   // memberwise init generated for free
    func area() -> Double { w * h }
}

struct Counter {
    private(set) var count = 0
    mutating func increment() { count += 1 }  // structs need 'mutating' to change self
}

class Player {                                 // reference type: shared when assigned
    let name: String
    init(name: String) { self.name = name }
}
~~~

SwiftUI views are structs conforming to the \`View\` protocol.
`,
      {
        prompt: 'Define `protocol Describable { var description: String { get } }` and a struct `Book: Describable` with `title` and `pages`. `description` returns `"<title> (<pages> pages)"`. Print the description of the longest book in the array.',
        starter: '// protocol and struct\n\nlet books = [\n    // Book(title: "Dune", pages: 412), Book(title: "SICP", pages: 657), Book(title: "Clean Code", pages: 464)\n]\n',
        solution: 'protocol Describable {\n    var description: String { get }\n}\n\nstruct Book: Describable {\n    let title: String\n    let pages: Int\n    var description: String { "\\(title) (\\(pages) pages)" }\n}\n\nlet books = [\n    Book(title: "Dune", pages: 412), Book(title: "SICP", pages: 657), Book(title: "Clean Code", pages: 464),\n]\nif let longest = books.max(by: { $0.pages < $1.pages }) {\n    print(longest.description)\n}\n',
        expected: 'SICP (657 pages)',
        hints: ['var description: String { "\\(title) (\\(pages) pages)" } is a computed property.', 'books.max(by: { $0.pages < $1.pages })'],
      },
      [['Struct vs class (Swift)', 'Structs are value types (copied); classes are reference types (shared). Prefer structs.']],
    ),
    lesson(
      'sw-enums',
      'Enums & error handling',
      `
Swift enums can carry **associated values**, which makes them perfect for states and results:

~~~swift
enum LoadState {
    case loading
    case loaded(items: [String])
    case failed(message: String)
}

switch state {                       // must be exhaustive
case .loading: print("…")
case .loaded(let items): print(items.count)
case .failed(let msg): print("error: \\(msg)")
}

enum LoginError: Error { case wrongPassword, locked }
func login(_ pw: String) throws -> String {
    guard pw == "secret" else { throw LoginError.wrongPassword }
    return "token"
}
do { let t = try login("x") } catch { print(error) }
~~~
`,
      {
        prompt: 'Define `enum BankError: Error { case insufficientFunds, invalidAmount }` and `func withdraw(_ amount: Int, from balance: Int) throws -> Int`. For each amount in `[30, -5, 500]` (balance 100) print the new balance or `error: <case name>` (just print the caught error).',
        starter: 'enum BankError: Error {\n    case insufficientFunds, invalidAmount\n}\n\nfunc withdraw(_ amount: Int, from balance: Int) throws -> Int {\n    return balance\n}\n\nfor amount in [30, -5, 500] {\n    // do / try / catch\n}\n',
        solution: 'enum BankError: Error {\n    case insufficientFunds, invalidAmount\n}\n\nfunc withdraw(_ amount: Int, from balance: Int) throws -> Int {\n    guard amount > 0 else { throw BankError.invalidAmount }\n    guard amount <= balance else { throw BankError.insufficientFunds }\n    return balance - amount\n}\n\nfor amount in [30, -5, 500] {\n    do {\n        print(try withdraw(amount, from: 100))\n    } catch {\n        print("error: \\(error)")\n    }\n}\n',
        expected: '70\nerror: invalidAmount\nerror: insufficientFunds',
        hints: ['guard amount > 0 else { throw BankError.invalidAmount }', 'do { print(try withdraw(amount, from: 100)) } catch { print("error: \\(error)") }'],
      },
      [['Swift throws', 'Functions marked throws must be called with try inside do/catch (or try?/try!).']],
    ),
    lesson(
      'sw-project',
      '🛠️ Mini project: Habit tracker model',
      `
iOS apps keep their data in model types like this; SwiftUI then renders them. Build the model and its logic.
`,
      {
        prompt: 'Implement `struct Habit { let name: String; var days: Set<Int> }` with `mutating func check(day: Int)` and `func streak(upTo day: Int) -> Int` (consecutive checked days ending at `day`). Run the script.',
        starter: 'struct Habit {\n    let name: String\n    var days: Set<Int> = []\n\n    mutating func check(day: Int) {}\n\n    func streak(upTo day: Int) -> Int {\n        return 0\n    }\n}\n\nvar run = Habit(name: "Run")\nfor d in [1, 2, 4, 5, 6] { run.check(day: d) }\nprint(run.streak(upTo: 6))\nprint(run.streak(upTo: 2))\nprint(run.streak(upTo: 3))\n',
        solution: 'struct Habit {\n    let name: String\n    var days: Set<Int> = []\n\n    mutating func check(day: Int) {\n        days.insert(day)\n    }\n\n    func streak(upTo day: Int) -> Int {\n        var count = 0\n        var d = day\n        while days.contains(d) {\n            count += 1\n            d -= 1\n        }\n        return count\n    }\n}\n\nvar run = Habit(name: "Run")\nfor d in [1, 2, 4, 5, 6] { run.check(day: d) }\nprint(run.streak(upTo: 6))\nprint(run.streak(upTo: 2))\nprint(run.streak(upTo: 3))\n',
        expected: '3\n2\n0',
        hints: ['check: days.insert(day)', 'streak: count backwards while days.contains(d).'],
      },
      [],
      80,
    ),
  ],
});
