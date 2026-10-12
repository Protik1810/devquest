import { lesson, langTrack } from './helpers';

export const go = langTrack({
  id: 'go',
  title: 'Go',
  icon: '🐹',
  color: '#00add8',
  lang: 'go',
  blurb: "Google's simple, fast language for backends and cloud tools. Docker and Kubernetes are written in Go.",
  fields: ['Backend', 'DevOps & Cloud', 'CLI tools'],
  lessons: [
    lesson(
      'go-basics',
      'Hello, Go',
      `
Go programs start in \`package main\` at \`func main()\`. It's **compiled** and **statically typed**, but feels light thanks to type inference.

~~~go
package main

import "fmt"

func main() {
    var name string = "Gopher"
    age := 15                 // := declares and infers the type
    const pi = 3.14159
    fmt.Println("Hi", name, age)
    fmt.Printf("%s is %d years old, pi≈%.2f\\n", name, age, pi)
}
~~~

**Coming from Python?** No semicolons or parentheses around \`if\`. Braces are required, and unused variables or imports are **compile errors**, which keeps code clean. Format code with \`gofmt\`; nobody argues about style in Go.
`,
      {
        prompt: 'Declare `lang := "Go"` and `year := 2009`. Print `Go was released in 2009` using `fmt.Printf`, then on the next line print the number of years until 2030.',
        starter: 'package main\n\nimport "fmt"\n\nfunc main() {\n\t// your code\n\tfmt.Println()\n}\n',
        solution: 'package main\n\nimport "fmt"\n\nfunc main() {\n\tlang := "Go"\n\tyear := 2009\n\tfmt.Printf("%s was released in %d\\n", lang, year)\n\tfmt.Println(2030 - year)\n}\n',
        expected: 'Go was released in 2009\n21',
        hints: ['fmt.Printf("%s was released in %d\\n", lang, year)', 'fmt.Println(2030 - year)'],
      },
      [['Go short variable declaration', 'x := value declares and infers the type (only inside functions).']],
    ),
    lesson(
      'go-control',
      'Loops & conditions',
      `
Go has **one loop keyword**: \`for\`.

~~~go
for i := 0; i < 5; i++ { }        // classic
for n < 100 { n *= 2 }            // like while
for { break }                     // infinite
for i, v := range []string{"a", "b"} { fmt.Println(i, v) }   // index + value

if x := compute(); x > 10 {       // init statement scoped to the if
    fmt.Println("big")
} else if x > 5 {
    fmt.Println("medium")
}

switch day {                      // no fallthrough by default
case "sat", "sun":
    fmt.Println("weekend")
default:
    fmt.Println("weekday")
}
~~~
`,
      {
        prompt: 'Print the numbers 1 to 15, but `Fizz` for multiples of 3, `Buzz` for multiples of 5 and `FizzBuzz` for both. Use a `switch` with no expression (`switch { case ...: }`).',
        starter: 'package main\n\nimport "fmt"\n\nfunc main() {\n\tfor i := 1; i <= 15; i++ {\n\t\t// your code\n\t\t_ = i\n\t}\n\tfmt.Println()\n}\n',
        solution: 'package main\n\nimport "fmt"\n\nfunc main() {\n\tfor i := 1; i <= 15; i++ {\n\t\tswitch {\n\t\tcase i%15 == 0:\n\t\t\tfmt.Println("FizzBuzz")\n\t\tcase i%3 == 0:\n\t\t\tfmt.Println("Fizz")\n\t\tcase i%5 == 0:\n\t\t\tfmt.Println("Buzz")\n\t\tdefault:\n\t\t\tfmt.Println(i)\n\t\t}\n\t}\n}\n',
        expected: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz',
        hints: ['switch { case i%15 == 0: ... }', 'Check the 15 case first.'],
      },
      [['Go loops', 'Only `for`: classic for, for-condition (while), bare for (infinite), and for-range.']],
    ),
    lesson(
      'go-functions',
      'Functions, multiple returns & errors',
      `
Go functions can return **multiple values**. Errors are just values: there are no exceptions. You check them explicitly:

~~~go
func divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, errors.New("division by zero")
    }
    return a / b, nil
}

result, err := divide(10, 2)
if err != nil {
    fmt.Println("error:", err)
    return
}
~~~

\`if err != nil\` appears everywhere in Go code. It's verbose, but every failure path is visible. Use \`fmt.Errorf("parse %q: %w", s, err)\` to add context while wrapping the original error.
`,
      {
        prompt: 'Write `func parseAge(s string) (int, error)` using `strconv.Atoi`. Return an error `age must be between 0 and 150` if out of range. For each input in the slice, print either `age: N` or `error: <message>`.',
        starter: 'package main\n\nimport (\n\t"errors"\n\t"fmt"\n\t"strconv"\n)\n\nfunc parseAge(s string) (int, error) {\n\t// use strconv.Atoi, then check the range\n\t_ = strconv.Atoi\n\treturn 0, errors.New("not implemented")\n}\n\nfunc main() {\n\tfor _, in := range []string{"42", "abc", "200"} {\n\t\t// print age: N or error: ...\n\t\t_ = in\n\t}\n\tfmt.Println()\n}\n',
        solution: 'package main\n\nimport (\n\t"errors"\n\t"fmt"\n\t"strconv"\n)\n\nfunc parseAge(s string) (int, error) {\n\tn, err := strconv.Atoi(s)\n\tif err != nil {\n\t\treturn 0, err\n\t}\n\tif n < 0 || n > 150 {\n\t\treturn 0, errors.New("age must be between 0 and 150")\n\t}\n\treturn n, nil\n}\n\nfunc main() {\n\tfor _, in := range []string{"42", "abc", "200"} {\n\t\tage, err := parseAge(in)\n\t\tif err != nil {\n\t\t\tfmt.Println("error:", err)\n\t\t\tcontinue\n\t\t}\n\t\tfmt.Println("age:", age)\n\t}\n}\n',
        expected: 'age: 42\nerror: strconv.Atoi: parsing "abc": invalid syntax\nerror: age must be between 0 and 150',
        hints: ['n, err := strconv.Atoi(s); if err != nil { return 0, err }', 'In main: age, err := parseAge(in); if err != nil { fmt.Println("error:", err); continue }'],
      },
      [['Go error handling', 'Functions return (value, error); callers check `if err != nil`. No exceptions.']],
    ),
    lesson(
      'go-collections',
      'Slices & maps',
      `
**Slices** are Go's dynamic arrays; **maps** are hash maps.

~~~go
nums := []int{3, 1, 2}
nums = append(nums, 4)          // append returns the (possibly new) slice
sort.Ints(nums)                 // [1 2 3 4]
part := nums[1:3]               // [2 3] (shares memory with nums!)

ages := map[string]int{"ada": 36}
ages["linus"] = 28
if age, ok := ages["grace"]; !ok {   // "comma ok" idiom
    fmt.Println("grace not found", age)
}
delete(ages, "ada")
for k, v := range ages { }      // map order is random!
~~~

⚠️ Map iteration order is **randomized** in Go. Sort the keys if you need stable output.
`,
      {
        prompt: 'Count how many times each word appears in `text` (lower-cased). Print each word and its count as `word: n`, **sorted alphabetically**.',
        starter: 'package main\n\nimport (\n\t"fmt"\n\t"sort"\n\t"strings"\n)\n\nfunc main() {\n\ttext := "Go is fun and go is fast"\n\t// count words, then print sorted\n\t_, _, _ = sort.Strings, strings.Fields, text\n\tfmt.Println()\n}\n',
        solution: 'package main\n\nimport (\n\t"fmt"\n\t"sort"\n\t"strings"\n)\n\nfunc main() {\n\ttext := "Go is fun and go is fast"\n\tcounts := map[string]int{}\n\tfor _, w := range strings.Fields(strings.ToLower(text)) {\n\t\tcounts[w]++\n\t}\n\tkeys := make([]string, 0, len(counts))\n\tfor k := range counts {\n\t\tkeys = append(keys, k)\n\t}\n\tsort.Strings(keys)\n\tfor _, k := range keys {\n\t\tfmt.Printf("%s: %d\\n", k, counts[k])\n\t}\n}\n',
        expected: 'and: 1\nfast: 1\nfun: 1\ngo: 2\nis: 2',
        hints: ['strings.Fields(strings.ToLower(text)) splits on whitespace.', 'counts[w]++ works even when the key is new (zero value 0).', 'Collect keys into a slice and sort.Strings(keys).'],
      },
      [['Go map iteration order', 'Random on purpose; sort the keys for deterministic output.']],
    ),
    lesson(
      'go-structs',
      'Structs, methods & interfaces',
      `
Go has no classes. Instead it uses **structs** with **methods**, and **interfaces** that are satisfied *implicitly*:

~~~go
type Rect struct{ W, H float64 }
type Circle struct{ R float64 }

func (r Rect) Area() float64   { return r.W * r.H }
func (c Circle) Area() float64 { return math.Pi * c.R * c.R }

type Shape interface{ Area() float64 }   // any type with Area() is a Shape

shapes := []Shape{Rect{3, 4}, Circle{1}}
~~~

Use a **pointer receiver** \`func (a *Account) Deposit(x int)\` when the method must modify the struct.

**Composition over inheritance:** embed one struct in another to reuse its fields and methods.
`,
      {
        prompt: 'Define `type Account struct { Owner string; Balance int }` with pointer-receiver methods `Deposit(amount int)` and `Withdraw(amount int) error` (error `insufficient funds` if too large). Run the script in main.',
        starter: 'package main\n\nimport (\n\t"errors"\n\t"fmt"\n)\n\n// define Account and its methods\nvar _ = errors.New\n\nfunc main() {\n\tacc := &Account{Owner: "Ada"}\n\tacc.Deposit(100)\n\tif err := acc.Withdraw(30); err != nil {\n\t\tfmt.Println(err)\n\t}\n\tif err := acc.Withdraw(500); err != nil {\n\t\tfmt.Println(err)\n\t}\n\tfmt.Printf("%s has %d\\n", acc.Owner, acc.Balance)\n}\n',
        solution: 'package main\n\nimport (\n\t"errors"\n\t"fmt"\n)\n\ntype Account struct {\n\tOwner   string\n\tBalance int\n}\n\nfunc (a *Account) Deposit(amount int) {\n\ta.Balance += amount\n}\n\nfunc (a *Account) Withdraw(amount int) error {\n\tif amount > a.Balance {\n\t\treturn errors.New("insufficient funds")\n\t}\n\ta.Balance -= amount\n\treturn nil\n}\n\nfunc main() {\n\tacc := &Account{Owner: "Ada"}\n\tacc.Deposit(100)\n\tif err := acc.Withdraw(30); err != nil {\n\t\tfmt.Println(err)\n\t}\n\tif err := acc.Withdraw(500); err != nil {\n\t\tfmt.Println(err)\n\t}\n\tfmt.Printf("%s has %d\\n", acc.Owner, acc.Balance)\n}\n',
        expected: 'insufficient funds\nAda has 70',
        hints: ['func (a *Account) Deposit(amount int) { a.Balance += amount }', 'Withdraw returns errors.New("insufficient funds") when amount > a.Balance.'],
      },
      [['Go interfaces', 'Satisfied implicitly: any type with the right methods implements the interface, with no "implements" keyword.']],
    ),
    lesson(
      'go-concurrency',
      '🛠️ Goroutines & channels',
      `
Go's superpower is **cheap concurrency**:
- A **goroutine** (\`go f()\`) is a lightweight thread. You can run thousands.
- A **channel** passes values between goroutines safely: *"share memory by communicating"*.
- \`sync.WaitGroup\` waits for a group of goroutines to finish.

~~~go
results := make(chan int)
for _, n := range []int{1, 2, 3} {
    go func(x int) { results <- x * x }(n)   // send
}
for i := 0; i < 3; i++ {
    fmt.Println(<-results)                    // receive (order not guaranteed!)
}
~~~

This is why Go dominates cloud infrastructure: web servers handle each request in its own goroutine.
`,
      {
        prompt: 'Start one goroutine per URL that sends `len(url)` into a channel (simulating "fetch the page size"). Collect all results, sort them, print them on one line separated by spaces, then print the total.',
        starter: 'package main\n\nimport (\n\t"fmt"\n\t"sort"\n\t"strings"\n\t"strconv"\n)\n\nfunc main() {\n\turls := []string{"go.dev", "kubernetes.io", "docker.com"}\n\tsizes := make(chan int)\n\t// start goroutines, collect, sort, print\n\t_, _, _ = sizes, sort.Ints, strconv.Itoa\n\tfmt.Println(strings.Join(urls[:0], ""))\n}\n',
        solution: 'package main\n\nimport (\n\t"fmt"\n\t"sort"\n\t"strconv"\n\t"strings"\n)\n\nfunc main() {\n\turls := []string{"go.dev", "kubernetes.io", "docker.com"}\n\tsizes := make(chan int)\n\tfor _, u := range urls {\n\t\tgo func(url string) { sizes <- len(url) }(u)\n\t}\n\tvar got []int\n\ttotal := 0\n\tfor range urls {\n\t\tn := <-sizes\n\t\tgot = append(got, n)\n\t\ttotal += n\n\t}\n\tsort.Ints(got)\n\tparts := make([]string, len(got))\n\tfor i, n := range got {\n\t\tparts[i] = strconv.Itoa(n)\n\t}\n\tfmt.Println(strings.Join(parts, " "))\n\tfmt.Println("total:", total)\n}\n',
        expected: '6 10 13\ntotal: 29',
        hints: ['go func(url string) { sizes <- len(url) }(u)', 'Receive exactly len(urls) values with for range urls { n := <-sizes }', 'sort.Ints, then convert with strconv.Itoa and strings.Join.'],
      },
      [['Goroutine vs channel', 'Goroutine: lightweight concurrent function. Channel: typed pipe to send values between goroutines.']],
      80,
    ),
  ],
});
