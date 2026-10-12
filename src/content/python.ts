import type { Track } from './types';

export const python: Track = {
  id: 'python',
  title: 'Python',
  icon: '🐍',
  tier: 1,
  color: '#3b82f6',
  blurb: 'Your first real language: variables, logic, loops, functions, data structures and OOP.',
  depth: 'full',
  lessons: [
    {
      id: 'py-hello',
      title: 'Hello, World!',
      xp: 30,
      body: `
Python is one of the most popular languages in the world: it powers web backends, data science, AI, automation and scripting. Its syntax reads almost like English.

The \`print()\` **function** displays text. Text in quotes is called a **string**.

~~~python
print("Hello, World!")
print('Single quotes work too')
print("Multiple", "values", 42)   # separated by spaces
~~~

Lines starting with \`#\` are **comments**: Python ignores them. Use them to explain *why* code exists.

Python runs your file **top to bottom**, one line at a time.
`,
      exercise: {
        kind: 'code',
        lang: 'python',
        prompt: 'Print exactly two lines: `Hello, DevQuest!` and then `I am learning Python`.',
        starter: '# Write your code below\n',
        solution: 'print("Hello, DevQuest!")\nprint("I am learning Python")\n',
        hints: ['Use print() twice, once per line.', 'Text must be inside quotes: print("Hello, DevQuest!")'],
        check: { type: 'stdout', expected: 'Hello, DevQuest!\nI am learning Python' },
      },
      cards: [{ front: 'Python: print to the screen', back: 'print("text")' }],
    },
    {
      id: 'py-vars',
      title: 'Variables & types',
      xp: 40,
      body: `
A **variable** is a name that points to a value stored in memory. Think of it as a labelled box.

{{ill:variables}}

~~~python
name = "Ada"        # str   (text)
age = 36            # int   (whole number)
height = 1.65       # float (decimal number)
is_admin = True     # bool  (True / False)
nothing = None      # NoneType (no value)

age = age + 1       # variables can change ("vary")
print(type(age))    # <class 'int'>
~~~

**Rules:** names use \`snake_case\`, can't start with a digit, and are case-sensitive (\`Age\` ≠ \`age\`).

Python is **dynamically typed**: a variable's type is decided by the value it holds right now. You can convert between types:

~~~python
int("42")     # 42
str(3.5)      # "3.5"
float("2")    # 2.0
~~~
`,
      exercise: {
        kind: 'code',
        lang: 'python',
        prompt: 'Create variables `hero` = `"Linus"`, `level` = `5`, and `hp` = `92.5`. Then increase `level` by 1. Do not print anything.',
        starter: '# create hero, level and hp here\n',
        solution: 'hero = "Linus"\nlevel = 5\nhp = 92.5\nlevel = level + 1\n',
        hints: ['Assignment uses a single = sign: hero = "Linus"', 'To increase level: level = level + 1 (or level += 1)'],
        check: {
          type: 'tests',
          code: 'assert hero == "Linus", "hero should be \'Linus\'"\nassert level == 6, f"level should be 6, got {level}"\nassert hp == 92.5 and isinstance(hp, float), "hp should be the float 92.5"\n',
        },
      },
      cards: [
        { front: 'Python primitive types', back: 'int, float, str, bool, None' },
        { front: 'Dynamic typing', back: "A variable's type comes from its current value and can change at run time." },
      ],
    },
    {
      id: 'py-math',
      title: 'Math & operators',
      xp: 35,
      body: `
~~~python
7 + 2    # 9    addition
7 - 2    # 5    subtraction
7 * 2    # 14   multiplication
7 / 2    # 3.5  division (always a float)
7 // 2   # 3    floor division (drops the remainder)
7 % 2    # 1    modulo (the remainder)
7 ** 2   # 49   exponent
~~~

**Modulo \`%\`** is surprisingly useful: \`n % 2 == 0\` tests if a number is even, and \`i % 3\` cycles 0,1,2,0,1,2…

**Comparison operators** produce booleans: \`==  !=  <  >  <=  >=\`

**Logical operators** combine booleans: \`and\`, \`or\`, \`not\`

~~~python
x += 5      # same as x = x + 5  (also -=, *=, /=)
round(3.14159, 2)  # 3.14
abs(-4)            # 4
~~~
`,
      exercise: {
        kind: 'code',
        lang: 'python',
        prompt: 'A player has `total_seconds = 3725`. Compute `hours`, `minutes` and `seconds` (whole numbers) using `//` and `%`.',
        starter: 'total_seconds = 3725\n\nhours = 0\nminutes = 0\nseconds = 0\n',
        solution: 'total_seconds = 3725\n\nhours = total_seconds // 3600\nminutes = (total_seconds % 3600) // 60\nseconds = total_seconds % 60\n',
        hints: ['There are 3600 seconds in an hour: hours = total_seconds // 3600', 'The leftover after hours is total_seconds % 3600; divide that by 60 for minutes.'],
        check: { type: 'tests', code: 'assert (hours, minutes, seconds) == (1, 2, 5), f"expected (1, 2, 5), got {(hours, minutes, seconds)}"\n' },
      },
      cards: [
        { front: 'Python // vs /', back: '/ is true division (float). // is floor division (drops remainder).' },
        { front: 'Modulo %', back: 'Remainder of division. n % 2 == 0 → even.' },
      ],
    },
    {
      id: 'py-strings',
      title: 'Strings & f-strings',
      xp: 40,
      body: `
Strings are sequences of characters. Each character has an **index** starting at **0**.

~~~python
word = "Python"
word[0]      # 'P'
word[-1]     # 'n'   (negative = from the end)
word[0:3]    # 'Pyt' (slice: start included, end excluded)
len(word)    # 6
~~~

**Useful methods** (strings are *immutable*: methods return new strings):

~~~python
"hello".upper()            # 'HELLO'
"  hi  ".strip()           # 'hi'
"a,b,c".split(",")         # ['a', 'b', 'c']
"-".join(["a", "b"])       # 'a-b'
"cat".replace("c", "b")    # 'bat'
"py" in "python"           # True
~~~

**f-strings** are the modern way to build text from values:

~~~python
name, xp = "Ada", 1200
print(f"{name} has {xp} XP")           # Ada has 1200 XP
print(f"Pi is about {3.14159:.2f}")    # Pi is about 3.14
~~~
`,
      exercise: {
        kind: 'code',
        lang: 'python',
        prompt: 'Write a function `badge(name, level)` that returns a string like `"[LV 7] ADA"`: the level, then the name in UPPERCASE with surrounding spaces stripped.',
        starter: 'def badge(name, level):\n    # return the formatted badge text\n    pass\n',
        solution: 'def badge(name, level):\n    return f"[LV {level}] {name.strip().upper()}"\n',
        hints: ['Use an f-string: f"[LV {level}] ..."', 'Chain methods: name.strip().upper()'],
        check: {
          type: 'tests',
          code: 'assert badge("ada", 7) == "[LV 7] ADA", badge("ada", 7)\nassert badge("  linus ", 12) == "[LV 12] LINUS", repr(badge("  linus ", 12))\n',
        },
      },
      cards: [
        { front: 'Python slice s[1:4]', back: 'Characters at index 1, 2, 3 (end is excluded).' },
        { front: 'f-string', back: 'f"Hello {name}": embeds expressions in a string. {x:.2f} = 2 decimals.' },
      ],
    },
    {
      id: 'py-if',
      title: 'Conditionals: if / elif / else',
      xp: 40,
      body: `
Programs make decisions with \`if\`. Python uses **indentation** (4 spaces) to mark which lines belong to a block.

{{ill:branch}}

~~~python
hp = 35
if hp <= 0:
    print("Game over")
elif hp < 50:
    print("Low health!")     # this one runs
else:
    print("Healthy")
~~~

- Python checks conditions **top to bottom** and runs only the **first** matching block.
- \`elif\` and \`else\` are optional.
- Combine conditions with \`and\` / \`or\` / \`not\`.

**Truthiness:** empty values count as \`False\`: \`0\`, \`""\`, \`[]\`, \`{}\`, \`None\`. Everything else is \`True\`.

~~~python
items = []
if not items:
    print("Inventory empty")
~~~
`,
      exercise: {
        kind: 'code',
        lang: 'python',
        prompt: 'Write `grade(score)` that returns `"A"` for 90+, `"B"` for 80–89, `"C"` for 70–79, otherwise `"F"`.',
        starter: 'def grade(score):\n    pass\n',
        solution: 'def grade(score):\n    if score >= 90:\n        return "A"\n    elif score >= 80:\n        return "B"\n    elif score >= 70:\n        return "C"\n    return "F"\n',
        hints: ['Check the highest range first: if score >= 90', 'Because elif only runs when earlier checks failed, you only need >= comparisons.'],
        check: {
          type: 'tests',
          code: 'for s, g in [(95,"A"),(90,"A"),(89,"B"),(80,"B"),(75,"C"),(70,"C"),(69,"F"),(0,"F")]:\n    assert grade(s) == g, f"grade({s}) should be {g}, got {grade(s)}"\n',
        },
      },
      cards: [{ front: 'Falsy values in Python', back: '0, 0.0, "", [], {}, set(), None, False' }],
    },
    {
      id: 'py-loops',
      title: 'Loops: for & while',
      xp: 45,
      body: `
Loops repeat code. Use **for** when you know what you're iterating over, **while** when you repeat *until* something happens.

{{ill:loop}}

~~~python
for i in range(5):        # 0, 1, 2, 3, 4
    print(i)

for i in range(2, 10, 2): # 2, 4, 6, 8  (start, stop, step)
    print(i)

for ch in "abc":          # loop over any sequence
    print(ch)

n = 10
while n > 0:
    n -= 3
~~~

- \`break\` exits the loop immediately.
- \`continue\` skips to the next iteration.
- ⚠️ A \`while\` loop whose condition never becomes false runs **forever** (an *infinite loop*). DevQuest stops your code after a few seconds if that happens.

**Accumulator pattern:** start with an empty/zero value and build it up inside the loop:

~~~python
total = 0
for n in [4, 8, 15]:
    total += n
~~~
`,
      exercise: {
        kind: 'code',
        lang: 'python',
        prompt: 'Classic FizzBuzz! Print the numbers 1 to 15, but print `Fizz` for multiples of 3, `Buzz` for multiples of 5, and `FizzBuzz` for multiples of both.',
        starter: 'for i in range(1, 16):\n    pass\n',
        solution: 'for i in range(1, 16):\n    if i % 15 == 0:\n        print("FizzBuzz")\n    elif i % 3 == 0:\n        print("Fizz")\n    elif i % 5 == 0:\n        print("Buzz")\n    else:\n        print(i)\n',
        hints: ['Use % to test divisibility: i % 3 == 0', 'Check the "both" case (i % 15 == 0) FIRST, otherwise Fizz will win.'],
        check: { type: 'stdout', expected: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz' },
      },
      cards: [
        { front: 'range(2, 10, 3)', back: '2, 5, 8 (start, stop-exclusive, step)' },
        { front: 'break vs continue', back: 'break exits the loop; continue skips to the next iteration.' },
      ],
    },
    {
      id: 'py-lists',
      title: 'Lists',
      xp: 45,
      body: `
A **list** is an ordered, changeable collection.

~~~python
langs = ["Python", "Go", "Rust"]
langs[0]              # 'Python'
langs.append("C")     # add to the end
langs.insert(1, "JS") # insert at index 1
langs.pop()           # remove & return the last item
langs.remove("Go")    # remove by value
len(langs)            # number of items
"Rust" in langs       # True
sorted([3, 1, 2])     # [1, 2, 3]  (new list)
nums = [5, 2, 9]
nums.sort()           # sorts in place
~~~

Slicing works like strings: \`nums[1:]\`, \`nums[::-1]\` (reversed).

**Built-ins that love lists:** \`sum()\`, \`min()\`, \`max()\`, \`len()\`, \`enumerate()\` (gives index + value), \`zip()\` (pairs two lists).

~~~python
for i, lang in enumerate(langs):
    print(i, lang)
~~~

> 🧠 Under the hood a Python list is a **dynamic array**: fast to read by index (O(1)), but inserting at the front shifts every element (O(n)). See the *Data Structures* track.
`,
      exercise: {
        kind: 'code',
        lang: 'python',
        prompt: 'Write `top_scores(scores, n)` that returns the `n` highest scores, largest first, without changing the original list.',
        starter: 'def top_scores(scores, n):\n    pass\n',
        solution: 'def top_scores(scores, n):\n    return sorted(scores, reverse=True)[:n]\n',
        hints: ['sorted() returns a NEW list, so the original stays intact.', 'sorted(scores, reverse=True) gives largest first; then slice [:n].'],
        check: {
          type: 'tests',
          code: 'data = [40, 90, 10, 75, 60]\nassert top_scores(data, 3) == [90, 75, 60], top_scores(data, 3)\nassert data == [40, 90, 10, 75, 60], "you modified the original list!"\nassert top_scores([1], 5) == [1]\n',
        },
      },
      cards: [{ front: 'Python list: add / remove at end', back: 'append(x) / pop()' }],
    },
    {
      id: 'py-dicts',
      title: 'Dictionaries & sets',
      xp: 45,
      body: `
A **dictionary** maps **keys** to **values**. Lookups by key are extremely fast thanks to a **hash table**.

{{ill:hashmap}}

~~~python
player = {"name": "Ada", "level": 7}
player["level"]            # 7
player["xp"] = 1200        # add / update
player.get("guild", "none")# safe lookup with a default
del player["xp"]
"name" in player           # True (checks keys)

for key, value in player.items():
    print(key, value)
~~~

**Counting pattern**, used constantly:

~~~python
counts = {}
for word in ["a", "b", "a"]:
    counts[word] = counts.get(word, 0) + 1
# {'a': 2, 'b': 1}
~~~

A **set** is an unordered collection of **unique** values, great for removing duplicates and fast membership tests:

~~~python
tags = {"python", "go", "python"}   # {'python', 'go'}
a & b   # intersection     a | b   # union     a - b   # difference
~~~
`,
      exercise: {
        kind: 'code',
        lang: 'python',
        prompt: 'Write `word_freq(text)` that returns a dict counting each word (lower-cased, split on spaces). Example: `"Go go Python"` → `{"go": 2, "python": 1}`.',
        starter: 'def word_freq(text):\n    counts = {}\n    # your code\n    return counts\n',
        solution: 'def word_freq(text):\n    counts = {}\n    for w in text.lower().split():\n        counts[w] = counts.get(w, 0) + 1\n    return counts\n',
        hints: ['text.lower().split() gives you a list of lowercase words.', 'counts[w] = counts.get(w, 0) + 1'],
        check: {
          type: 'tests',
          code: 'assert word_freq("Go go Python") == {"go": 2, "python": 1}, word_freq("Go go Python")\nassert word_freq("") == {}\n',
        },
      },
      cards: [
        { front: 'dict.get(k, default)', back: 'Returns the value for k, or default if missing (no KeyError).' },
        { front: 'Set', back: 'Unordered collection of unique items; O(1) average membership test.' },
      ],
    },
    {
      id: 'py-functions',
      title: 'Functions & the call stack',
      xp: 50,
      body: `
A **function** is a named, reusable block of code. It takes **parameters** and can **return** a value.

~~~python
def area(width, height=1):      # height has a default value
    """Return the area of a rectangle."""
    return width * height

area(3, 4)            # 12
area(5)               # 5
area(height=2, width=3)  # keyword arguments
~~~

- A function without \`return\` returns \`None\`.
- Variables created inside a function are **local**: they vanish when it returns. That's called **scope**.

**The call stack:** each time a function is called, Python pushes a **frame** (its local variables) onto a stack. When it returns, the frame is popped.

{{ill:callstack}}

**Functions are values** too: you can pass them around.

~~~python
def shout(s): return s.upper() + "!"
def apply(fn, value): return fn(value)
apply(shout, "hi")      # 'HI!'
square = lambda x: x * x  # tiny anonymous function
~~~
`,
      exercise: {
        kind: 'code',
        lang: 'python',
        prompt: 'Write `clamp(value, low=0, high=100)` that returns `value` limited to the range `[low, high]`.',
        starter: 'def clamp(value, low=0, high=100):\n    pass\n',
        solution: 'def clamp(value, low=0, high=100):\n    return max(low, min(value, high))\n',
        hints: ['If value < low return low; if value > high return high; else value.', 'One-liner: max(low, min(value, high))'],
        check: {
          type: 'tests',
          code: 'assert clamp(50) == 50\nassert clamp(-5) == 0\nassert clamp(150) == 100\nassert clamp(5, 10, 20) == 10\nassert clamp(25, high=20) == 20\n',
        },
      },
      cards: [
        { front: 'Scope', back: 'Where a variable is visible. Locals exist only inside their function call.' },
        { front: 'Call stack', back: 'Stack of frames: each call pushes one, each return pops one.' },
      ],
    },
    {
      id: 'py-errors',
      title: 'Errors & exceptions',
      xp: 40,
      body: `
When something goes wrong at run time, Python **raises an exception**. If nothing catches it, the program stops and prints a **traceback**: read it **bottom-up**; the last line says what happened.

~~~
Traceback (most recent call last):
  File "main.py", line 3, in <module>
    print(10 / count)
ZeroDivisionError: division by zero
~~~

Common ones: \`NameError\` (typo in a name), \`TypeError\` (wrong type, e.g. \`"a" + 1\`), \`IndexError\`, \`KeyError\`, \`ValueError\` (\`int("abc")\`), \`ZeroDivisionError\`.

**Handle** errors you expect with \`try / except\`:

~~~python
try:
    age = int(input_text)
except ValueError:
    age = 0
finally:
    print("always runs")
~~~

**Raise** your own when inputs are invalid:

~~~python
def withdraw(balance, amount):
    if amount > balance:
        raise ValueError("insufficient funds")
    return balance - amount
~~~
`,
      exercise: {
        kind: 'code',
        lang: 'python',
        prompt: 'Write `safe_int(text, default=0)` that converts text to an int, returning `default` if it can\'t be converted.',
        starter: 'def safe_int(text, default=0):\n    pass\n',
        solution: 'def safe_int(text, default=0):\n    try:\n        return int(text)\n    except (ValueError, TypeError):\n        return default\n',
        hints: ['Wrap int(text) in try: ... except ValueError: ...', 'None would raise TypeError; you can catch a tuple: except (ValueError, TypeError):'],
        check: { type: 'tests', code: 'assert safe_int("42") == 42\nassert safe_int("abc") == 0\nassert safe_int("x", -1) == -1\nassert safe_int(None) == 0\n' },
      },
      cards: [{ front: 'Read a traceback…', back: 'Bottom-up: last line = error type & message; lines above = where it happened.' }],
    },
    {
      id: 'py-oop',
      title: 'Classes & objects (OOP)',
      xp: 55,
      body: `
**Object-oriented programming** bundles **data** (attributes) and **behavior** (methods) together. A **class** is a blueprint; an **object** is a thing built from it.

{{ill:oop}}

~~~python
class Hero:
    def __init__(self, name, hp=100):   # constructor
        self.name = name                 # attributes
        self.hp = hp

    def take_damage(self, amount):      # method
        self.hp = max(0, self.hp - amount)

    def is_alive(self):
        return self.hp > 0

ada = Hero("Ada")
ada.take_damage(30)
print(ada.hp)    # 70
~~~

\`self\` is the specific object the method was called on.

**The four pillars of OOP:**
- **Encapsulation**: keep data and the methods that change it together; hide internals.
- **Abstraction**: expose a simple interface (\`take_damage\`), hide the complexity.
- **Inheritance**: a class can extend another: \`class Mage(Hero):\`
- **Polymorphism**: different classes respond to the same method in their own way.

~~~python
class Mage(Hero):
    def take_damage(self, amount):
        super().take_damage(amount // 2)   # magic shield!
~~~
`,
      exercise: {
        kind: 'code',
        lang: 'python',
        prompt: 'Create a class `BankAccount` with `balance` starting at 0, a `deposit(amount)` method, and a `withdraw(amount)` method that raises `ValueError` if there isn\'t enough money.',
        starter: 'class BankAccount:\n    def __init__(self):\n        pass\n',
        solution: 'class BankAccount:\n    def __init__(self):\n        self.balance = 0\n\n    def deposit(self, amount):\n        self.balance += amount\n\n    def withdraw(self, amount):\n        if amount > self.balance:\n            raise ValueError("insufficient funds")\n        self.balance -= amount\n',
        hints: ['In __init__, set self.balance = 0', 'withdraw: if amount > self.balance: raise ValueError("...")'],
        check: {
          type: 'tests',
          code: 'a = BankAccount()\nassert a.balance == 0\na.deposit(50)\na.withdraw(20)\nassert a.balance == 30, a.balance\ntry:\n    a.withdraw(100)\n    assert False, "withdraw should raise ValueError"\nexcept ValueError:\n    pass\nassert a.balance == 30\n',
        },
      },
      cards: [
        { front: 'Four pillars of OOP', back: 'Encapsulation, Abstraction, Inheritance, Polymorphism' },
        { front: 'Python __init__', back: 'Constructor method that runs when an object is created; sets up self.attributes.' },
      ],
    },
    {
      id: 'py-recursion',
      title: 'Recursion',
      xp: 55,
      body: `
A **recursive** function calls itself on a smaller version of the problem. Every recursion needs:
1. a **base case**: when to stop
2. a **recursive case**: shrink the problem and call yourself

{{ill:recursion}}

~~~python
def factorial(n):
    if n <= 1:          # base case
        return 1
    return n * factorial(n - 1)   # recursive case

factorial(4)  # 4 * 3 * 2 * 1 = 24
~~~

Each call waits on the call stack until the one below it returns, then the results "unwind" back up.

⚠️ Forget the base case and you get infinite recursion → \`RecursionError: maximum recursion depth exceeded\` (a **stack overflow**).

Recursion shines for naturally recursive structures: **trees** (folders, HTML, JSON), **divide-and-conquer** algorithms (merge sort, quicksort), and backtracking (sudoku, mazes).
`,
      exercise: {
        kind: 'code',
        lang: 'python',
        prompt: 'Write a recursive `sum_nested(items)` that sums all numbers in a list that may contain nested lists, e.g. `[1, [2, [3, 4]], 5]` → `15`.',
        starter: 'def sum_nested(items):\n    total = 0\n    for item in items:\n        pass\n    return total\n',
        solution: 'def sum_nested(items):\n    total = 0\n    for item in items:\n        if isinstance(item, list):\n            total += sum_nested(item)\n        else:\n            total += item\n    return total\n',
        hints: ['Check isinstance(item, list) to see whether an item is a nested list.', 'If it is a list, add sum_nested(item); otherwise add the number itself.'],
        check: { type: 'tests', code: 'assert sum_nested([1, [2, [3, 4]], 5]) == 15\nassert sum_nested([]) == 0\nassert sum_nested([[[[7]]]]) == 7\n' },
      },
      cards: [{ front: 'Two parts of every recursive function', back: 'Base case (stop) + recursive case (smaller subproblem).' }],
    },
    {
      id: 'py-functional',
      title: 'Comprehensions & functional style',
      xp: 45,
      body: `
**List comprehensions** build lists in one readable line:

~~~python
squares = [n * n for n in range(5)]            # [0, 1, 4, 9, 16]
evens   = [n for n in range(10) if n % 2 == 0] # [0, 2, 4, 6, 8]
names   = {u["id"]: u["name"] for u in users}  # dict comprehension
~~~

**Functional programming** avoids changing state and builds programs from **pure functions** (same input → same output, no side effects).

~~~python
nums = [1, 2, 3, 4]
list(map(lambda n: n * 10, nums))        # [10, 20, 30, 40]
list(filter(lambda n: n > 2, nums))      # [3, 4]
from functools import reduce
reduce(lambda a, b: a + b, nums)         # 10
sorted(users, key=lambda u: u["age"])    # sort by a field
~~~

Why it matters: pure functions are easier to **test**, **reason about**, and **run in parallel**.
`,
      exercise: {
        kind: 'code',
        lang: 'python',
        prompt: 'Given a list of dicts like `{"name": "Ada", "xp": 1200}`, write `leaders(players)` that returns the **names** of players with more than 1000 XP, sorted by XP descending. Use a comprehension.',
        starter: 'def leaders(players):\n    pass\n',
        solution: 'def leaders(players):\n    ranked = sorted(players, key=lambda p: p["xp"], reverse=True)\n    return [p["name"] for p in ranked if p["xp"] > 1000]\n',
        hints: ['First sort: sorted(players, key=lambda p: p["xp"], reverse=True)', 'Then: [p["name"] for p in ranked if p["xp"] > 1000]'],
        check: {
          type: 'tests',
          code: 'ps = [{"name":"A","xp":500},{"name":"B","xp":3000},{"name":"C","xp":1500},{"name":"D","xp":1000}]\nassert leaders(ps) == ["B", "C"], leaders(ps)\n',
        },
      },
      cards: [{ front: 'Pure function', back: 'Same inputs always give the same output, and it has no side effects.' }],
    },
    {
      id: 'py-boss',
      title: '⚔️ Boss Battle: Inventory Manager',
      xp: 120,
      body: `
Time to combine everything: dicts, loops, functions, errors and classes.

You're building the inventory system for an RPG. Implement a class \`Inventory\`:

| Method | Behavior |
|---|---|
| \`add(item, qty=1)\` | Adds quantity of an item |
| \`remove(item, qty=1)\` | Removes quantity; raises \`KeyError\` if the item isn't there, \`ValueError\` if not enough. When an item reaches 0 it disappears |
| \`count(item)\` | Quantity owned (0 if none) |
| \`most_common()\` | Name of the item with the highest quantity, or \`None\` if empty |
| \`total()\` | Total number of items |

Boss battles are worth extra XP. Take your time, test as you go, and ask the Owl tutor for a nudge if you're stuck.
`,
      exercise: {
        kind: 'code',
        lang: 'python',
        prompt: 'Implement the `Inventory` class described above.',
        starter: 'class Inventory:\n    def __init__(self):\n        self.items = {}\n\n    def add(self, item, qty=1):\n        pass\n\n    def remove(self, item, qty=1):\n        pass\n\n    def count(self, item):\n        pass\n\n    def most_common(self):\n        pass\n\n    def total(self):\n        pass\n',
        solution: 'class Inventory:\n    def __init__(self):\n        self.items = {}\n\n    def add(self, item, qty=1):\n        self.items[item] = self.items.get(item, 0) + qty\n\n    def remove(self, item, qty=1):\n        if item not in self.items:\n            raise KeyError(item)\n        if self.items[item] < qty:\n            raise ValueError("not enough")\n        self.items[item] -= qty\n        if self.items[item] == 0:\n            del self.items[item]\n\n    def count(self, item):\n        return self.items.get(item, 0)\n\n    def most_common(self):\n        if not self.items:\n            return None\n        return max(self.items, key=self.items.get)\n\n    def total(self):\n        return sum(self.items.values())\n',
        hints: ['add: self.items[item] = self.items.get(item, 0) + qty', 'most_common: max(self.items, key=self.items.get) returns the key with the biggest value.', 'remove: check membership first, then quantity, then delete the key if it hits 0.'],
        check: {
          type: 'tests',
          code: 'inv = Inventory()\nassert inv.most_common() is None and inv.total() == 0\ninv.add("potion", 3)\ninv.add("sword")\ninv.add("potion")\nassert inv.count("potion") == 4\nassert inv.most_common() == "potion"\nassert inv.total() == 5\ninv.remove("sword")\nassert inv.count("sword") == 0 and "sword" not in inv.items, "items at 0 should disappear"\ntry:\n    inv.remove("shield"); assert False, "expected KeyError"\nexcept KeyError: pass\ntry:\n    inv.remove("potion", 99); assert False, "expected ValueError"\nexcept ValueError: pass\nassert inv.count("potion") == 4\n',
        },
      },
    },
  ],
};
