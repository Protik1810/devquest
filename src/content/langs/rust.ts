import { lesson, langTrack } from './helpers';

export const rust = langTrack({
  id: 'rust',
  title: 'Rust',
  icon: '🦀',
  color: '#ce422b',
  lang: 'rust',
  blurb: 'C-level speed with guaranteed memory safety. Loved for systems, CLIs, WebAssembly and blockchain.',
  fields: ['Systems', 'Embedded', 'Blockchain', 'High-performance backends'],
  lessons: [
    lesson(
      'rs-basics',
      'Hello, Rust',
      `
~~~rust
fn main() {
    let name = "Ferris";          // immutable by default
    let mut lives = 3;            // mut = mutable
    lives -= 1;
    let pi: f64 = 3.14159;        // explicit type
    println!("{} has {} lives", name, lives);
    println!("{name} has {lives} lives, pi≈{pi:.2}");   // inline args
}
~~~

- Variables are **immutable unless \`mut\`**.
- Integer types say their size: \`i32\`, \`u64\`, \`usize\`… Floats: \`f32\`, \`f64\`.
- \`println!\` is a **macro** (the \`!\`), checked at compile time.

**Coming from C/C++?** Rust gives the same speed but the compiler refuses programs with dangling pointers, data races or use-after-free.
`,
      {
        prompt: 'Declare `let crate_name = "devquest"` and a mutable `downloads` starting at 10. Add 5 to `downloads` three times in a loop, then print `devquest has 25 downloads`.',
        starter: 'fn main() {\n    // your code\n}\n',
        solution: 'fn main() {\n    let crate_name = "devquest";\n    let mut downloads = 10;\n    for _ in 0..3 {\n        downloads += 5;\n    }\n    println!("{crate_name} has {downloads} downloads");\n}\n',
        expected: 'devquest has 25 downloads',
        hints: ['let mut downloads = 10;', 'for _ in 0..3 { downloads += 5; }'],
      },
      [['Rust mutability', 'Variables are immutable by default; add mut to allow reassignment.']],
    ),
    lesson(
      'rs-ownership',
      'Ownership & borrowing',
      `
Rust's core idea: **every value has one owner**. When the owner goes out of scope, the value is freed: no garbage collector, no manual \`free\`.

~~~rust
let a = String::from("hi");
let b = a;              // ownership MOVES to b
println!("{a}");        // ❌ compile error: a was moved

fn len(s: &String) -> usize { s.len() }   // & = borrow (read-only reference)
let s = String::from("hello");
println!("{}", len(&s));                    // s is still usable

fn shout(s: &mut String) { s.push('!'); }   // mutable borrow
~~~

**Rules:** many immutable borrows (\`&T\`) **or** exactly one mutable borrow (\`&mut T\`) at a time. This rule is what makes data races impossible.
`,
      {
        prompt: 'Write `fn longest<\'a>(a: &\'a str, b: &\'a str) -> &\'a str` and `fn add_suffix(s: &mut String)` that appends `"_v2"`. Print `longest("rust", "ferris")`, then call `add_suffix` on a `String` "api" and print it.',
        starter: 'fn longest<\'a>(a: &\'a str, b: &\'a str) -> &\'a str {\n    a\n}\n\nfn add_suffix(s: &mut String) {}\n\nfn main() {\n    println!("{}", longest("rust", "ferris"));\n    let mut name = String::from("api");\n    add_suffix(&mut name);\n    println!("{}", name);\n}\n',
        solution: 'fn longest<\'a>(a: &\'a str, b: &\'a str) -> &\'a str {\n    if a.len() >= b.len() { a } else { b }\n}\n\nfn add_suffix(s: &mut String) {\n    s.push_str("_v2");\n}\n\nfn main() {\n    println!("{}", longest("rust", "ferris"));\n    let mut name = String::from("api");\n    add_suffix(&mut name);\n    println!("{}", name);\n}\n',
        expected: 'ferris\napi_v2',
        hints: ["Compare lengths: if a.len() >= b.len() { a } else { b }", 's.push_str("_v2")'],
      },
      [['Borrowing rule', 'At any time: any number of &T OR exactly one &mut T, never both.']],
    ),
    lesson(
      'rs-enums',
      'Enums, match, Option & Result',
      `
Rust has **no null and no exceptions**. Instead:

~~~rust
enum Option<T> { Some(T), None }          // maybe a value
enum Result<T, E> { Ok(T), Err(E) }      // success or error

fn divide(a: f64, b: f64) -> Result<f64, String> {
    if b == 0.0 { return Err("division by zero".to_string()); }
    Ok(a / b)
}

match divide(10.0, 2.0) {
    Ok(v) => println!("{v}"),
    Err(e) => println!("error: {e}"),
}

let n: i32 = "42".parse().unwrap_or(0);   // default on error
let x = "7".parse::<i32>()?;              // ? propagates the error to the caller
~~~

\`match\` must handle **every** case, so the compiler catches forgotten error paths.
`,
      {
        prompt: 'Write `fn parse_temp(s: &str) -> Result<i32, String>` that parses an integer and returns `Err("too cold")` below -50. For each input print `ok: N` or `error: <message>`. Invalid numbers should print `error: invalid number`.',
        starter: 'fn parse_temp(s: &str) -> Result<i32, String> {\n    Ok(0)\n}\n\nfn main() {\n    for input in ["21", "abc", "-80"] {\n        // match on parse_temp(input)\n    }\n}\n',
        solution: 'fn parse_temp(s: &str) -> Result<i32, String> {\n    let n: i32 = s.parse().map_err(|_| "invalid number".to_string())?;\n    if n < -50 {\n        return Err("too cold".to_string());\n    }\n    Ok(n)\n}\n\nfn main() {\n    for input in ["21", "abc", "-80"] {\n        match parse_temp(input) {\n            Ok(n) => println!("ok: {n}"),\n            Err(e) => println!("error: {e}"),\n        }\n    }\n}\n',
        expected: 'ok: 21\nerror: invalid number\nerror: too cold',
        hints: ['s.parse().map_err(|_| "invalid number".to_string())? converts and propagates the error.', 'match parse_temp(input) { Ok(n) => …, Err(e) => … }'],
      },
      [['Option vs Result', 'Option<T>: Some(value) or None. Result<T, E>: Ok(value) or Err(error).']],
    ),
    lesson(
      'rs-collections',
      'Vectors, HashMaps & iterators',
      `
~~~rust
let mut v = vec![3, 1, 2];
v.push(4);
v.sort();
let doubled: Vec<i32> = v.iter().map(|x| x * 2).collect();
let evens = v.iter().filter(|&&x| x % 2 == 0).count();

use std::collections::HashMap;
let mut counts: HashMap<&str, i32> = HashMap::new();
*counts.entry("rust").or_insert(0) += 1;
~~~

Iterators are **lazy and zero-cost**: chains like \`.filter().map().sum()\` compile to the same machine code as a hand-written loop.
`,
      {
        prompt: 'Count word lengths in `text`: build a `BTreeMap<usize, Vec<&str>>` mapping length → words (BTreeMap keeps keys sorted) and print each entry as `3: [the, cat]`.',
        starter: 'use std::collections::BTreeMap;\n\nfn main() {\n    let text = "the quick brown fox jumps over the lazy cat";\n    let mut by_len: BTreeMap<usize, Vec<&str>> = BTreeMap::new();\n    // fill and print\n    let _ = text;\n    let _ = &mut by_len;\n}\n',
        solution: 'use std::collections::BTreeMap;\n\nfn main() {\n    let text = "the quick brown fox jumps over the lazy cat";\n    let mut by_len: BTreeMap<usize, Vec<&str>> = BTreeMap::new();\n    for w in text.split_whitespace() {\n        by_len.entry(w.len()).or_default().push(w);\n    }\n    for (len, words) in &by_len {\n        println!("{}: [{}]", len, words.join(", "));\n    }\n}\n',
        expected: '3: [the, fox, the, cat]\n4: [over, lazy]\n5: [quick, brown, jumps]',
        hints: ['text.split_whitespace()', 'by_len.entry(w.len()).or_default().push(w);', 'words.join(", ") builds the list text.'],
      },
      [['Rust iterators', 'Lazy adapters (map, filter…) consumed by collect/sum/count; compile to tight loops.']],
    ),
    lesson(
      'rs-structs',
      'Structs, impl & traits',
      `
~~~rust
struct Rect { w: f64, h: f64 }

impl Rect {
    fn new(w: f64, h: f64) -> Self { Rect { w, h } }   // associated function
    fn area(&self) -> f64 { self.w * self.h }         // method
}

trait Describe { fn describe(&self) -> String; }      // like an interface

impl Describe for Rect {
    fn describe(&self) -> String { format!("{}x{} rect", self.w, self.h) }
}

#[derive(Debug, Clone, PartialEq)]                    // auto-implement common traits
struct Point { x: i32, y: i32 }
~~~
`,
      {
        prompt: 'Define a trait `Shape` with `fn area(&self) -> f64` and `fn name(&self) -> String`, implement it for `Circle { r: f64 }` and `Square { s: f64 }`. Print each shape as `circle: 3.14` / `square: 4.00` (2 decimals) by iterating a `Vec<Box<dyn Shape>>`.',
        starter: '// define Shape, Circle and Square\n\nfn main() {\n    // let shapes: Vec<Box<dyn Shape>> = vec![Box::new(Circle { r: 1.0 }), Box::new(Square { s: 2.0 })];\n}\n',
        solution: 'trait Shape {\n    fn area(&self) -> f64;\n    fn name(&self) -> String;\n}\n\nstruct Circle {\n    r: f64,\n}\n\nstruct Square {\n    s: f64,\n}\n\nimpl Shape for Circle {\n    fn area(&self) -> f64 {\n        std::f64::consts::PI * self.r * self.r\n    }\n    fn name(&self) -> String {\n        "circle".to_string()\n    }\n}\n\nimpl Shape for Square {\n    fn area(&self) -> f64 {\n        self.s * self.s\n    }\n    fn name(&self) -> String {\n        "square".to_string()\n    }\n}\n\nfn main() {\n    let shapes: Vec<Box<dyn Shape>> = vec![Box::new(Circle { r: 1.0 }), Box::new(Square { s: 2.0 })];\n    for s in &shapes {\n        println!("{}: {:.2}", s.name(), s.area());\n    }\n}\n',
        expected: 'circle: 3.14\nsquare: 4.00',
        hints: ['impl Shape for Circle { fn area(&self) -> f64 { std::f64::consts::PI * self.r * self.r } ... }', 'Box<dyn Shape> stores different types behind the same trait.'],
      },
      [['Trait', "Rust's interface: a set of methods a type can implement; used for polymorphism and generics."]],
    ),
    lesson(
      'rs-project',
      '🛠️ Mini project: Bank ledger',
      `
Combine structs, enums, \`Result\` and \`HashMap\` into a safe ledger. Rust's type system makes invalid states hard to represent.
`,
      {
        prompt: 'Implement `Bank` with `deposit(name, amount)`, `withdraw(name, amount) -> Result<(), String>` (errors: `no account` / `insufficient funds`) and `balance(name) -> u64`. Run the script.',
        starter: 'use std::collections::HashMap;\n\nstruct Bank {\n    accounts: HashMap<String, u64>,\n}\n\nimpl Bank {\n    fn new() -> Self {\n        Bank { accounts: HashMap::new() }\n    }\n    fn deposit(&mut self, name: &str, amount: u64) {}\n    fn withdraw(&mut self, name: &str, amount: u64) -> Result<(), String> {\n        Ok(())\n    }\n    fn balance(&self, name: &str) -> u64 {\n        0\n    }\n}\n\nfn main() {\n    let mut bank = Bank::new();\n    bank.deposit("ada", 100);\n    println!("{:?}", bank.withdraw("ada", 30));\n    println!("{:?}", bank.withdraw("ada", 500));\n    println!("{:?}", bank.withdraw("bob", 1));\n    println!("{}", bank.balance("ada"));\n}\n',
        solution: 'use std::collections::HashMap;\n\nstruct Bank {\n    accounts: HashMap<String, u64>,\n}\n\nimpl Bank {\n    fn new() -> Self {\n        Bank { accounts: HashMap::new() }\n    }\n    fn deposit(&mut self, name: &str, amount: u64) {\n        *self.accounts.entry(name.to_string()).or_insert(0) += amount;\n    }\n    fn withdraw(&mut self, name: &str, amount: u64) -> Result<(), String> {\n        let bal = self.accounts.get_mut(name).ok_or("no account")?;\n        if *bal < amount {\n            return Err("insufficient funds".to_string());\n        }\n        *bal -= amount;\n        Ok(())\n    }\n    fn balance(&self, name: &str) -> u64 {\n        *self.accounts.get(name).unwrap_or(&0)\n    }\n}\n\nfn main() {\n    let mut bank = Bank::new();\n    bank.deposit("ada", 100);\n    println!("{:?}", bank.withdraw("ada", 30));\n    println!("{:?}", bank.withdraw("ada", 500));\n    println!("{:?}", bank.withdraw("bob", 1));\n    println!("{}", bank.balance("ada"));\n}\n',
        expected: 'Ok(())\nErr("insufficient funds")\nErr("no account")\n70',
        hints: ['*self.accounts.entry(name.to_string()).or_insert(0) += amount;', 'self.accounts.get_mut(name).ok_or("no account")? returns early when missing.'],
      },
      [],
      80,
    ),
  ],
});
