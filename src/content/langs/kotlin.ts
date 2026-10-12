import { lesson, langTrack } from './helpers';

export const kotlin = langTrack({
  id: 'kotlin',
  title: 'Kotlin',
  icon: '🟧',
  color: '#7f52ff',
  lang: 'kotlin',
  blurb: "Google's preferred language for Android: concise, null-safe and 100% interoperable with Java.",
  fields: ['Android', 'Mobile', 'Backend (Ktor, Spring)'],
  lessons: [
    lesson(
      'kt-basics',
      'Hello, Kotlin',
      `
~~~kotlin
fun main() {
    val name = "Kotlin"        // val = read-only (prefer it)
    var count = 1              // var = mutable
    count += 1
    val pi: Double = 3.14      // explicit type
    println("Hello, $name! count=$count, 2*pi=\${2 * pi}")   // string templates
}
~~~

- \`val\` is like \`final\` in Java or \`const\` in JS. Use it by default.
- Types are inferred but **static**: \`count = "two"\` won't compile.
- String templates: \`$name\` or \`\${expression}\`.

**Coming from Java?** No semicolons, no \`new\`, no \`public static void main\` boilerplate. Kotlin compiles to the same JVM bytecode.
`,
      {
        prompt: 'Declare `val app = "DevQuest"` and `var users = 100`. Double `users`, then print `DevQuest has 200 users` and on the next line the app name in upper case.',
        starter: 'fun main() {\n    // your code\n}\n',
        solution: 'fun main() {\n    val app = "DevQuest"\n    var users = 100\n    users *= 2\n    println("$app has $users users")\n    println(app.uppercase())\n}\n',
        expected: 'DevQuest has 200 users\nDEVQUEST',
        hints: ['users *= 2', 'println("$app has $users users")', 'app.uppercase()'],
      },
      [['val vs var (Kotlin)', 'val = read-only reference; var = can be reassigned.']],
    ),
    lesson(
      'kt-control',
      'Expressions: if, when & ranges',
      `
In Kotlin, \`if\` and \`when\` are **expressions** that return values:

~~~kotlin
val max = if (a > b) a else b

val label = when {
    score >= 90 -> "A"
    score in 80..89 -> "B"     // ranges!
    else -> "C"
}

for (i in 1..5) print(i)          // 12345
for (i in 10 downTo 0 step 5) print("$i ")
for ((i, v) in listOf("a", "b").withIndex()) println("$i $v")
~~~
`,
      {
        prompt: 'Write `fun classify(n: Int): String` using `when`: negative → `negative`, 0 → `zero`, 1..9 → `small`, otherwise `large`. Print the result for each of `-5, 0, 7, 42`.',
        starter: 'fun classify(n: Int): String {\n    return ""\n}\n\nfun main() {\n    for (n in listOf(-5, 0, 7, 42)) println(classify(n))\n}\n',
        solution: 'fun classify(n: Int): String = when {\n    n < 0 -> "negative"\n    n == 0 -> "zero"\n    n in 1..9 -> "small"\n    else -> "large"\n}\n\nfun main() {\n    for (n in listOf(-5, 0, 7, 42)) println(classify(n))\n}\n',
        expected: 'negative\nzero\nsmall\nlarge',
        hints: ['when { n < 0 -> "negative" ... }', 'n in 1..9 checks a range.'],
      },
      [['Kotlin when', 'Expression-based switch: when (x) { 1 -> ...; in 2..5 -> ...; else -> ... }']],
    ),
    lesson(
      'kt-null',
      'Null safety',
      `
Kotlin's headline feature: **NullPointerExceptions are (almost) impossible**. Types are non-null by default:

~~~kotlin
var name: String = "Ada"
name = null              // ❌ compile error
var nick: String? = null // ✅ nullable type

nick.length              // ❌ compile error: nick might be null
nick?.length             // safe call → Int? (null if nick is null)
nick?.length ?: 0        // Elvis operator: default when null
nick!!.length            // "I promise it's not null" → crashes if it is (avoid)

if (nick != null) println(nick.length)   // smart cast: nick is String here
~~~
`,
      {
        prompt: 'Complete `fun initials(full: String?): String` returning the upper-case initials (e.g. `ada lovelace` → `AL`), or `??` when `full` is null or blank. Print the result for each input.',
        starter: 'fun initials(full: String?): String {\n    return ""\n}\n\nfun main() {\n    for (n in listOf("ada lovelace", null, "  ", "grace brewster hopper")) {\n        println(initials(n))\n    }\n}\n',
        solution: 'fun initials(full: String?): String {\n    if (full.isNullOrBlank()) return "??"\n    return full.trim().split(Regex("\\\\s+")).joinToString("") { it.first().uppercase() }\n}\n\nfun main() {\n    for (n in listOf("ada lovelace", null, "  ", "grace brewster hopper")) {\n        println(initials(n))\n    }\n}\n',
        expected: 'AL\n??\n??\nGBH',
        hints: ['full.isNullOrBlank() handles both null and "  ". After that check, full is smart-cast to String.', 'split(Regex("\\\\s+")).joinToString("") { it.first().uppercase() }'],
      },
      [['Elvis operator ?:', 'a ?: b returns a if it is not null, otherwise b.']],
    ),
    lesson(
      'kt-collections',
      'Collections & lambdas',
      `
Kotlin's collection API is rich and functional:

~~~kotlin
val nums = listOf(5, 2, 8, 1)            // read-only list
val mutable = mutableListOf(1, 2)        // mutable
val ages = mapOf("ada" to 36, "linus" to 28)

nums.filter { it > 2 }                   // [5, 8]  (it = the single parameter)
    .map { it * 10 }                     // [50, 80]
nums.sorted().first()                    // 1
nums.sumOf { it }                        // 16
listOf("a", "bb", "cc").groupBy { it.length }   // {1=[a], 2=[bb, cc]}
~~~
`,
      {
        prompt: 'Given the `scores` map, print the names of students with a score ≥ 80 sorted by score descending (joined by `, `), then the average score with one decimal (`avg=78.8`).',
        starter: 'fun main() {\n    val scores = mapOf("ada" to 95, "bob" to 72, "cy" to 88, "dee" to 60)\n    // your code\n}\n',
        solution: 'fun main() {\n    val scores = mapOf("ada" to 95, "bob" to 72, "cy" to 88, "dee" to 60)\n    val top = scores.filter { it.value >= 80 }.entries.sortedByDescending { it.value }.map { it.key }\n    println(top.joinToString(", "))\n    println("avg=" + String.format("%.1f", scores.values.average()))\n}\n',
        expected: 'ada, cy\navg=78.8',
        hints: ['scores.filter { it.value >= 80 }.entries.sortedByDescending { it.value }.map { it.key }', 'scores.values.average() then String.format("%.1f", …)'],
      },
      [['Kotlin `it`', 'The implicit name of a lambda\'s single parameter: list.map { it * 2 }.']],
    ),
    lesson(
      'kt-classes',
      'Classes & data classes',
      `
~~~kotlin
class Counter(private var count: Int = 0) {   // primary constructor + property
    fun increment() { count++ }
    val value get() = count                    // computed property
}

data class User(val name: String, val age: Int)  // equals/hashCode/toString/copy for free
val u = User("Ada", 36)
val older = u.copy(age = 37)
println(u)                                        // User(name=Ada, age=36)

sealed class Result {                             // closed hierarchy: great with when
    data class Ok(val value: Int) : Result()
    data class Err(val message: String) : Result()
}
~~~
`,
      {
        prompt: 'Create `data class Item(val name: String, val price: Double, val qty: Int)` and a `class Cart` with `add(item)` and `total()`. Print the total with two decimals and then the most expensive item\'s `toString()`.',
        starter: '// define Item and Cart\n\nfun main() {\n    val cart = Cart()\n    cart.add(Item("Pen", 1.5, 4))\n    cart.add(Item("Book", 12.0, 1))\n    cart.add(Item("Bag", 25.0, 1))\n    println(String.format("%.2f", cart.total()))\n    println(cart.mostExpensive())\n}\n',
        solution: 'data class Item(val name: String, val price: Double, val qty: Int)\n\nclass Cart {\n    private val items = mutableListOf<Item>()\n\n    fun add(item: Item) {\n        items.add(item)\n    }\n\n    fun total(): Double = items.sumOf { it.price * it.qty }\n\n    fun mostExpensive(): Item? = items.maxByOrNull { it.price }\n}\n\nfun main() {\n    val cart = Cart()\n    cart.add(Item("Pen", 1.5, 4))\n    cart.add(Item("Book", 12.0, 1))\n    cart.add(Item("Bag", 25.0, 1))\n    println(String.format("%.2f", cart.total()))\n    println(cart.mostExpensive())\n}\n',
        expected: '43.00\nItem(name=Bag, price=25.0, qty=1)',
        hints: ['total = items.sumOf { it.price * it.qty }', 'mostExpensive = items.maxByOrNull { it.price }'],
      },
      [['Kotlin data class', 'Auto-generates equals, hashCode, toString and copy() from the constructor properties.']],
    ),
    lesson(
      'kt-project',
      '🛠️ Mini project: Todo app logic',
      `
Android apps keep their logic in plain Kotlin classes (a *ViewModel*), separate from the UI. Build that logic here. Jetpack Compose would render it on screen.
`,
      {
        prompt: 'Implement `TodoViewModel` with `add(title)`, `toggle(id)` and `visible(filter)` where filter is `"all"`, `"active"` or `"done"`. Run the script; each line prints the visible titles.',
        starter: 'data class Todo(val id: Int, val title: String, val done: Boolean = false)\n\nclass TodoViewModel {\n    private val todos = mutableListOf<Todo>()\n\n    fun add(title: String) {}\n    fun toggle(id: Int) {}\n    fun visible(filter: String): List<String> = emptyList()\n}\n\nfun main() {\n    val vm = TodoViewModel()\n    vm.add("Design UI")\n    vm.add("Write ViewModel")\n    vm.add("Publish app")\n    vm.toggle(2)\n    println(vm.visible("all"))\n    println(vm.visible("active"))\n    println(vm.visible("done"))\n}\n',
        solution: 'data class Todo(val id: Int, val title: String, val done: Boolean = false)\n\nclass TodoViewModel {\n    private val todos = mutableListOf<Todo>()\n\n    fun add(title: String) {\n        todos.add(Todo(todos.size + 1, title))\n    }\n\n    fun toggle(id: Int) {\n        val i = todos.indexOfFirst { it.id == id }\n        if (i >= 0) todos[i] = todos[i].copy(done = !todos[i].done)\n    }\n\n    fun visible(filter: String): List<String> = todos.filter {\n        when (filter) {\n            "active" -> !it.done\n            "done" -> it.done\n            else -> true\n        }\n    }.map { it.title }\n}\n\nfun main() {\n    val vm = TodoViewModel()\n    vm.add("Design UI")\n    vm.add("Write ViewModel")\n    vm.add("Publish app")\n    vm.toggle(2)\n    println(vm.visible("all"))\n    println(vm.visible("active"))\n    println(vm.visible("done"))\n}\n',
        expected: '[Design UI, Write ViewModel, Publish app]\n[Design UI, Publish app]\n[Write ViewModel]',
        hints: ['Data classes are immutable: replace the item with todos[i].copy(done = !todos[i].done).', 'visible: todos.filter { when (filter) { ... } }.map { it.title }'],
      },
      [],
      80,
    ),
  ],
});
