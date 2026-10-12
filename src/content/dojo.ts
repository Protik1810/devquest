import type { Challenge, CodeExercise } from './types';
import { LANG_CHALLENGES } from './dojoLangs';

const XP = { Easy: 30, Medium: 60, Hard: 100 } as const;

function py(id: string, title: string, difficulty: Challenge['difficulty'], tags: string[], prompt: string, starter: string, solution: string, tests: string, hints: string[]): Challenge {
  const exercise: CodeExercise = { kind: 'code', lang: 'python', prompt, starter, solution, hints, check: { type: 'tests', code: tests } };
  return { id: `dojo-${id}`, title, difficulty, tags, xp: XP[difficulty], exercise };
}

function js(id: string, title: string, difficulty: Challenge['difficulty'], tags: string[], prompt: string, starter: string, solution: string, tests: string, hints: string[]): Challenge {
  const exercise: CodeExercise = { kind: 'code', lang: 'javascript', prompt, starter, solution, hints, check: { type: 'tests', code: tests } };
  return { id: `dojo-${id}`, title, difficulty, tags, xp: XP[difficulty], exercise };
}

const STORE_DB = `
CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, category TEXT, price REAL);
CREATE TABLE sales (id INTEGER PRIMARY KEY, product_id INTEGER, qty INTEGER, day TEXT);
INSERT INTO products VALUES (1,'Laptop','tech',1200),(2,'Mouse','tech',25),(3,'Desk','furniture',300),(4,'Chair','furniture',150),(5,'Lamp','furniture',40),(6,'Monitor','tech',250);
INSERT INTO sales VALUES (1,1,2,'2026-03-01'),(2,2,10,'2026-03-01'),(3,3,1,'2026-03-02'),(4,2,5,'2026-03-02'),(5,6,3,'2026-03-03'),(6,4,4,'2026-03-03'),(7,1,1,'2026-03-04');
`;
const STORE_NOTE = '\n\nTables: `products(id, name, category, price)` and `sales(id, product_id, qty, day)`. The Lamp has never been sold.';

function sqlc(id: string, title: string, difficulty: Challenge['difficulty'], prompt: string, solution: string, hints: string[], ordered = false): Challenge {
  const exercise: CodeExercise = { kind: 'code', lang: 'sql', prompt: prompt + STORE_NOTE, starter: 'SELECT\n', solution, hints, check: { type: 'sql', setup: STORE_DB, expected: solution, ordered } };
  return { id: `dojo-${id}`, title, difficulty, tags: ['sql'], xp: XP[difficulty], exercise };
}

const CORE_CHALLENGES: Challenge[] = [
  // ---------------- Python: Easy ----------------
  py('reverse-words', 'Reverse the Words', 'Easy', ['strings'],
    'Write `reverse_words(s)` that reverses the **order of words** in a sentence, collapsing extra spaces. `"  hello   brave new world "` → `"world new brave hello"`.',
    'def reverse_words(s):\n    pass\n',
    'def reverse_words(s):\n    return " ".join(reversed(s.split()))\n',
    'assert reverse_words("  hello   brave new world ") == "world new brave hello"\nassert reverse_words("") == ""\nassert reverse_words("one") == "one"\n',
    ['s.split() with no argument splits on any whitespace and drops empties.']),
  py('palindrome', 'Palindrome Checker', 'Easy', ['strings'],
    'Write `is_palindrome(s)` that ignores case, spaces and punctuation. `"A man, a plan, a canal: Panama"` → `True`.',
    'def is_palindrome(s):\n    pass\n',
    'def is_palindrome(s):\n    clean = [c.lower() for c in s if c.isalnum()]\n    return clean == clean[::-1]\n',
    'assert is_palindrome("A man, a plan, a canal: Panama")\nassert not is_palindrome("DevQuest")\nassert is_palindrome("")\nassert is_palindrome("No lemon, no melon")\n',
    ['Keep only characters where c.isalnum(), lower-cased.', 'Compare with its reverse: x == x[::-1]']),
  py('vowels', 'Count the Vowels', 'Easy', ['strings', 'dicts'],
    'Write `vowel_counts(s)` returning a dict with the count of each vowel `a e i o u` (case-insensitive), including zeros.',
    'def vowel_counts(s):\n    pass\n',
    'def vowel_counts(s):\n    s = s.lower()\n    return {v: s.count(v) for v in "aeiou"}\n',
    'assert vowel_counts("Education is fun") == {"a": 1, "e": 1, "i": 2, "o": 1, "u": 2}, vowel_counts("Education is fun")\nassert vowel_counts("") == {"a": 0, "e": 0, "i": 0, "o": 0, "u": 0}\n',
    ['A dict comprehension: {v: ... for v in "aeiou"}']),
  py('second-largest', 'Second Largest', 'Easy', ['lists'],
    'Write `second_largest(nums)` returning the second-largest **distinct** value, or `None` if there isn\'t one.',
    'def second_largest(nums):\n    pass\n',
    'def second_largest(nums):\n    unique = sorted(set(nums))\n    return unique[-2] if len(unique) >= 2 else None\n',
    'assert second_largest([4, 1, 7, 7, 3]) == 4\nassert second_largest([5, 5]) is None\nassert second_largest([]) is None\nassert second_largest([-2, -9]) == -9\n',
    ['set() removes duplicates.']),
  py('temperature', 'Temperature Table', 'Easy', ['loops', 'math'],
    'Write `c_to_f_table(start, stop, step)` that returns a list of strings like `"20°C = 68.0°F"` for each Celsius value in `range(start, stop + 1, step)`. Formula: F = C × 9/5 + 32.',
    'def c_to_f_table(start, stop, step):\n    pass\n',
    'def c_to_f_table(start, stop, step):\n    return [f"{c}°C = {c * 9 / 5 + 32:.1f}°F" for c in range(start, stop + 1, step)]\n',
    'assert c_to_f_table(0, 20, 10) == ["0°C = 32.0°F", "10°C = 50.0°F", "20°C = 68.0°F"], c_to_f_table(0, 20, 10)\nassert c_to_f_table(-40, -40, 1) == ["-40°C = -40.0°F"]\n',
    ['Use an f-string with :.1f for one decimal place.']),
  py('anagram', 'Anagram Detector', 'Easy', ['strings', 'sorting'],
    'Write `are_anagrams(a, b)`: True when the words use exactly the same letters, ignoring case and spaces. `"Listen"`/`"Silent"` → True.',
    'def are_anagrams(a, b):\n    pass\n',
    'def are_anagrams(a, b):\n    norm = lambda s: sorted(s.lower().replace(" ", ""))\n    return norm(a) == norm(b)\n',
    'assert are_anagrams("Listen", "Silent")\nassert are_anagrams("Dormitory", "dirty room")\nassert not are_anagrams("abc", "abd")\nassert not are_anagrams("aab", "ab")\n',
    ['sorted("silent") gives a list of letters in order.']),
  py('flatten', 'Flatten a List', 'Easy', ['lists', 'recursion'],
    'Write `flatten(items)` that turns arbitrarily nested lists into a flat list: `[1, [2, [3, [4]]], 5]` → `[1, 2, 3, 4, 5]`.',
    'def flatten(items):\n    pass\n',
    'def flatten(items):\n    out = []\n    for x in items:\n        if isinstance(x, list):\n            out.extend(flatten(x))\n        else:\n            out.append(x)\n    return out\n',
    'assert flatten([1, [2, [3, [4]]], 5]) == [1, 2, 3, 4, 5]\nassert flatten([]) == []\nassert flatten([[[]], "a"]) == ["a"]\n',
    ['Recursion: when an item is a list, extend with flatten(item).']),

  // ---------------- Python: Medium ----------------
  py('roman', 'Roman Numerals', 'Medium', ['strings', 'math'],
    'Write `to_roman(n)` for 1 ≤ n ≤ 3999 (e.g. 1994 → `"MCMXCIV"`) and `from_roman(s)` for the reverse.',
    'def to_roman(n):\n    pass\n\ndef from_roman(s):\n    pass\n',
    'VALUES = [(1000, "M"), (900, "CM"), (500, "D"), (400, "CD"), (100, "C"), (90, "XC"), (50, "L"), (40, "XL"), (10, "X"), (9, "IX"), (5, "V"), (4, "IV"), (1, "I")]\n\ndef to_roman(n):\n    out = ""\n    for value, sym in VALUES:\n        while n >= value:\n            out += sym\n            n -= value\n    return out\n\ndef from_roman(s):\n    single = {"I": 1, "V": 5, "X": 10, "L": 50, "C": 100, "D": 500, "M": 1000}\n    total = 0\n    for i, ch in enumerate(s):\n        v = single[ch]\n        if i + 1 < len(s) and single[s[i + 1]] > v:\n            total -= v\n        else:\n            total += v\n    return total\n',
    'for n, r in [(1, "I"), (4, "IV"), (9, "IX"), (14, "XIV"), (40, "XL"), (1994, "MCMXCIV"), (3999, "MMMCMXCIX")]:\n    assert to_roman(n) == r, f"to_roman({n}) = {to_roman(n)}"\n    assert from_roman(r) == n, f"from_roman({r}) = {from_roman(r)}"\nfor n in range(1, 400):\n    assert from_roman(to_roman(n)) == n\n',
    ['Greedy: walk a table of (value, symbol) from largest to smallest, including 900 "CM", 4 "IV" etc.', 'from_roman: if a symbol is smaller than the next one, subtract it.']),
  py('caesar', 'Caesar Cipher', 'Medium', ['strings', 'security'],
    'Write `encrypt(text, shift)` shifting letters by `shift` (wrap around, keep case, leave other characters) and `decrypt(text, shift)`.',
    'def encrypt(text, shift):\n    pass\n\ndef decrypt(text, shift):\n    pass\n',
    'def encrypt(text, shift):\n    out = []\n    for ch in text:\n        if ch.isalpha() and ch.isascii():\n            base = ord("A") if ch.isupper() else ord("a")\n            out.append(chr((ord(ch) - base + shift) % 26 + base))\n        else:\n            out.append(ch)\n    return "".join(out)\n\ndef decrypt(text, shift):\n    return encrypt(text, -shift)\n',
    'assert encrypt("Hello, World!", 3) == "Khoor, Zruog!"\nassert encrypt("xyz", 2) == "zab"\nassert decrypt(encrypt("DevQuest 2026", 13), 13) == "DevQuest 2026"\nassert encrypt("abc", 52) == "abc"\n',
    ['(ord(ch) - base + shift) % 26 + base wraps around the alphabet.', 'Decrypting is encrypting with the negative shift.']),
  py('group-anagrams', 'Group Anagrams', 'Medium', ['dicts', 'sorting'],
    'Write `group_anagrams(words)` returning a list of groups (lists) of words that are anagrams of each other. Sort words inside each group, and sort groups by their first word.',
    'def group_anagrams(words):\n    pass\n',
    'def group_anagrams(words):\n    groups = {}\n    for w in words:\n        groups.setdefault("".join(sorted(w)), []).append(w)\n    return sorted((sorted(g) for g in groups.values()), key=lambda g: g[0])\n',
    'assert group_anagrams(["eat", "tea", "tan", "ate", "nat", "bat"]) == [["ate", "eat", "tea"], ["bat"], ["nat", "tan"]], group_anagrams(["eat", "tea", "tan", "ate", "nat", "bat"])\nassert group_anagrams([]) == []\n',
    ['Use the sorted letters as a dict key: "".join(sorted(word)).']),
  py('rle', 'Run-Length Encoding', 'Medium', ['strings', 'compression'],
    'Write `encode(s)` (`"aaabccdddd"` → `"3a1b2c4d"`) and `decode(s)` that reverses it (counts may have several digits).',
    'def encode(s):\n    pass\n\ndef decode(s):\n    pass\n',
    'import re\n\ndef encode(s):\n    out, i = [], 0\n    while i < len(s):\n        j = i\n        while j < len(s) and s[j] == s[i]:\n            j += 1\n        out.append(f"{j - i}{s[i]}")\n        i = j\n    return "".join(out)\n\ndef decode(s):\n    return "".join(ch * int(n) for n, ch in re.findall(r"(\\d+)(\\D)", s))\n',
    'assert encode("aaabccdddd") == "3a1b2c4d"\nassert encode("") == ""\nassert decode("3a1b2c4d") == "aaabccdddd"\nassert decode(encode("x" * 12 + "yz")) == "x" * 12 + "yz"\nassert encode("x" * 12) == "12x"\n',
    ['Count how far the same character repeats, then jump ahead.', 'decode: re.findall(r"(\\d+)(\\D)", s)']),
  py('matrix', 'Rotate a Matrix', 'Medium', ['lists', 'math'],
    'Write `rotate(m)` that returns a square matrix (list of lists) rotated 90° clockwise, without modifying the input.',
    'def rotate(m):\n    pass\n',
    'def rotate(m):\n    return [list(row) for row in zip(*m[::-1])]\n',
    'm = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]\nassert rotate(m) == [[7, 4, 1], [8, 5, 2], [9, 6, 3]], rotate(m)\nassert m == [[1, 2, 3], [4, 5, 6], [7, 8, 9]], "do not modify the input"\nassert rotate([[1]]) == [[1]]\nassert rotate([]) == []\n',
    ['Reverse the rows, then transpose with zip(*rows).']),
  py('brackets-score', 'Valid Parentheses Depth', 'Medium', ['stacks'],
    'Write `max_depth(s)` that returns the maximum nesting depth of `()[]{}` brackets, or `-1` if they are not balanced.',
    'def max_depth(s):\n    pass\n',
    'def max_depth(s):\n    pairs = {")": "(", "]": "[", "}": "{"}\n    stack, best = [], 0\n    for ch in s:\n        if ch in "([{":\n            stack.append(ch)\n            best = max(best, len(stack))\n        elif ch in pairs:\n            if not stack or stack.pop() != pairs[ch]:\n                return -1\n    return best if not stack else -1\n',
    'assert max_depth("a(b[c]{d})") == 2\nassert max_depth("((()))") == 3\nassert max_depth("") == 0\nassert max_depth("(]") == -1\nassert max_depth("((") == -1\n',
    ['A stack; its length when you push is the current depth.']),
  py('lru', 'LRU Cache', 'Medium', ['design', 'dicts'],
    'Implement `LRUCache(capacity)` with `get(key)` (returns `-1` if missing) and `put(key, value)`. When full, evict the **least recently used** key. Both must be O(1).',
    'class LRUCache:\n    def __init__(self, capacity):\n        pass\n\n    def get(self, key):\n        pass\n\n    def put(self, key, value):\n        pass\n',
    'from collections import OrderedDict\n\nclass LRUCache:\n    def __init__(self, capacity):\n        self.capacity = capacity\n        self.data = OrderedDict()\n\n    def get(self, key):\n        if key not in self.data:\n            return -1\n        self.data.move_to_end(key)\n        return self.data[key]\n\n    def put(self, key, value):\n        self.data[key] = value\n        self.data.move_to_end(key)\n        if len(self.data) > self.capacity:\n            self.data.popitem(last=False)\n',
    'c = LRUCache(2)\nc.put(1, "a"); c.put(2, "b")\nassert c.get(1) == "a"\nc.put(3, "c")\nassert c.get(2) == -1, "2 was least recently used and should be evicted"\nassert c.get(3) == "c" and c.get(1) == "a"\nc.put(1, "A")\nc.put(4, "d")\nassert c.get(3) == -1 and c.get(1) == "A" and c.get(4) == "d"\n',
    ['collections.OrderedDict has move_to_end(key) and popitem(last=False).']),
  py('merge-intervals', 'Merge Intervals', 'Medium', ['sorting', 'intervals'],
    'Write `merge(intervals)` that merges overlapping `[start, end]` intervals and returns them sorted. `[[1,3],[2,6],[8,10],[9,12]]` → `[[1,6],[8,12]]`. Touching intervals (`[1,2],[2,3]`) merge too.',
    'def merge(intervals):\n    pass\n',
    'def merge(intervals):\n    out = []\n    for start, end in sorted(intervals):\n        if out and start <= out[-1][1]:\n            out[-1][1] = max(out[-1][1], end)\n        else:\n            out.append([start, end])\n    return out\n',
    'assert merge([[1, 3], [2, 6], [8, 10], [9, 12]]) == [[1, 6], [8, 12]]\nassert merge([[5, 7], [1, 2], [2, 3]]) == [[1, 3], [5, 7]]\nassert merge([]) == []\nassert merge([[1, 10], [2, 3]]) == [[1, 10]]\n',
    ['Sort by start, then extend the last merged interval when the next one overlaps.']),
  py('word-wrap', 'Word Wrap', 'Medium', ['strings'],
    'Write `wrap(text, width)` returning a list of lines no longer than `width`, breaking only between words (a single word longer than `width` gets its own line).',
    'def wrap(text, width):\n    pass\n',
    'def wrap(text, width):\n    lines, cur = [], ""\n    for word in text.split():\n        if not cur:\n            cur = word\n        elif len(cur) + 1 + len(word) <= width:\n            cur += " " + word\n        else:\n            lines.append(cur)\n            cur = word\n    if cur:\n        lines.append(cur)\n    return lines\n',
    'assert wrap("the quick brown fox jumps over the lazy dog", 10) == ["the quick", "brown fox", "jumps over", "the lazy", "dog"], wrap("the quick brown fox jumps over the lazy dog", 10)\nassert wrap("", 5) == []\nassert wrap("supercalifragilistic is long", 6) == ["supercalifragilistic", "is", "long"]\n',
    ['Build the current line word by word; start a new line when adding the next word (plus a space) would exceed width.']),

  // ---------------- Python: Hard ----------------
  py('coins', 'Coin Change (Dynamic Programming)', 'Hard', ['dynamic programming'],
    'Write `min_coins(coins, amount)` returning the fewest coins that make `amount`, or `-1` if impossible. Greedy doesn\'t always work: with coins `[1, 3, 4]`, 6 = 3 + 3 (2 coins), not 4 + 1 + 1.',
    'def min_coins(coins, amount):\n    pass\n',
    'def min_coins(coins, amount):\n    INF = float("inf")\n    best = [0] + [INF] * amount\n    for a in range(1, amount + 1):\n        for c in coins:\n            if c <= a and best[a - c] + 1 < best[a]:\n                best[a] = best[a - c] + 1\n    return best[amount] if best[amount] != INF else -1\n',
    'assert min_coins([1, 3, 4], 6) == 2\nassert min_coins([2], 3) == -1\nassert min_coins([1, 5, 10, 25], 63) == 6\nassert min_coins([7], 0) == 0\nassert min_coins([186, 419, 83, 408], 6249) == 20\n',
    ['best[a] = fewest coins for amount a. best[0] = 0.', 'best[a] = min(best[a - c] + 1) over coins c ≤ a.']),
  py('lcs', 'Longest Common Subsequence', 'Hard', ['dynamic programming', 'strings'],
    'Write `lcs(a, b)` returning the **length** of the longest common subsequence of two strings (characters in order, not necessarily adjacent). This is the heart of `diff` tools like Git\'s.',
    'def lcs(a, b):\n    pass\n',
    'def lcs(a, b):\n    prev = [0] * (len(b) + 1)\n    for ca in a:\n        cur = [0]\n        for j, cb in enumerate(b, 1):\n            cur.append(prev[j - 1] + 1 if ca == cb else max(prev[j], cur[j - 1]))\n        prev = cur\n    return prev[-1]\n',
    'assert lcs("ABCBDAB", "BDCABA") == 4\nassert lcs("", "abc") == 0\nassert lcs("kitten", "sitting") == 4\nassert lcs("a" * 300, "a" * 300) == 300\n',
    ['Table dp[i][j] = LCS of a[:i] and b[:j].', 'If a[i-1] == b[j-1]: dp[i-1][j-1] + 1, else max(dp[i-1][j], dp[i][j-1]).']),
  py('islands', 'Number of Islands', 'Hard', ['graphs', 'bfs'],
    'Given a grid of strings with `"#"` for land and `"."` for water, write `islands(grid)` that counts groups of land connected up/down/left/right.',
    'def islands(grid):\n    pass\n',
    'def islands(grid):\n    seen = set()\n    count = 0\n    for r, row in enumerate(grid):\n        for c, ch in enumerate(row):\n            if ch == "#" and (r, c) not in seen:\n                count += 1\n                stack = [(r, c)]\n                seen.add((r, c))\n                while stack:\n                    y, x = stack.pop()\n                    for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):\n                        if 0 <= ny < len(grid) and 0 <= nx < len(grid[ny]) and grid[ny][nx] == "#" and (ny, nx) not in seen:\n                            seen.add((ny, nx))\n                            stack.append((ny, nx))\n    return count\n',
    'assert islands(["##..#", "#...#", "..#..", "....#"]) == 4\nassert islands([]) == 0\nassert islands(["....."]) == 0\nassert islands(["#" * 50] * 50) == 1\n',
    ['Every time you find unvisited land, count an island and flood-fill (BFS/DFS) all land connected to it.']),
  py('topo', 'Build Order (Topological Sort)', 'Hard', ['graphs'],
    'Given `deps` like `{"app": ["lib", "utils"], "lib": ["utils"], "utils": []}` (each key depends on its list), write `build_order(deps)` returning an order where every dependency comes before what needs it. Break ties alphabetically. Raise `ValueError` on a cycle.',
    'def build_order(deps):\n    pass\n',
    'import heapq\n\ndef build_order(deps):\n    nodes = set(deps) | {d for ds in deps.values() for d in ds}\n    remaining = {n: len(set(deps.get(n, []))) for n in nodes}\n    users = {n: [] for n in nodes}\n    for n, ds in deps.items():\n        for d in set(ds):\n            users[d].append(n)\n    ready = [n for n, k in remaining.items() if k == 0]\n    heapq.heapify(ready)\n    order = []\n    while ready:\n        n = heapq.heappop(ready)\n        order.append(n)\n        for u in users[n]:\n            remaining[u] -= 1\n            if remaining[u] == 0:\n                heapq.heappush(ready, u)\n    if len(order) != len(nodes):\n        raise ValueError("dependency cycle")\n    return order\n',
    'assert build_order({"app": ["lib", "utils"], "lib": ["utils"], "utils": []}) == ["utils", "lib", "app"]\nassert build_order({"b": [], "a": [], "c": ["a", "b"]}) == ["a", "b", "c"]\nassert build_order({"x": ["y"]}) == ["y", "x"]\ntry:\n    build_order({"a": ["b"], "b": ["a"]}); assert False, "expected ValueError"\nexcept ValueError:\n    pass\n',
    ['Kahn\'s algorithm: repeatedly take a node with no remaining dependencies.', 'Use a heap (heapq) of ready nodes to break ties alphabetically.']),

  // ---------------- JavaScript ----------------
  js('js-fizzbuzz', 'FizzBuzz Array', 'Easy', ['javascript', 'loops'],
    'Write `fizzbuzz(n)` returning an array of strings for 1..n: "Fizz", "Buzz", "FizzBuzz" or the number.',
    'function fizzbuzz(n) {\n  // your code\n}\n',
    'function fizzbuzz(n) {\n  return Array.from({ length: n }, (_, i) => {\n    const k = i + 1;\n    return k % 15 === 0 ? "FizzBuzz" : k % 3 === 0 ? "Fizz" : k % 5 === 0 ? "Buzz" : String(k);\n  });\n}\n',
    'const r = fizzbuzz(15);\nif (r.length !== 15 || r[2] !== "Fizz" || r[4] !== "Buzz" || r[14] !== "FizzBuzz" || r[0] !== "1") throw new Error("got " + JSON.stringify(r));\nif (fizzbuzz(0).length !== 0) throw new Error("fizzbuzz(0) should be []");',
    ['Array.from({ length: n }, (_, i) => ...) builds an array of n items.']),
  js('js-chunk', 'Chunk an Array', 'Easy', ['javascript', 'arrays'],
    'Write `chunk(arr, size)` that splits an array into groups of `size`: `chunk([1,2,3,4,5], 2)` → `[[1,2],[3,4],[5]]`.',
    'function chunk(arr, size) {\n}\n',
    'function chunk(arr, size) {\n  const out = [];\n  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));\n  return out;\n}\n',
    'const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);\nif (!eq(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]])) throw new Error("got " + JSON.stringify(chunk([1, 2, 3, 4, 5], 2)));\nif (!eq(chunk([], 3), [])) throw new Error("chunk([], 3) should be []");',
    ['Loop with i += size and use arr.slice(i, i + size).']),
  js('js-debounce', 'Debounce', 'Medium', ['javascript', 'async', 'closures'],
    'Write `debounce(fn, ms)` returning a function that delays calling `fn` until `ms` milliseconds have passed **without another call**, then calls it with the latest arguments. Used for search boxes!',
    'function debounce(fn, ms) {\n}\n',
    'function debounce(fn, ms) {\n  let timer;\n  return (...args) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), ms);\n  };\n}\n',
    'const calls = [];\nconst d = debounce((x) => calls.push(x), 40);\nd(1); d(2); d(3);\nawait new Promise((r) => setTimeout(r, 80));\nif (JSON.stringify(calls) !== "[3]") throw new Error("expected only the last call [3], got " + JSON.stringify(calls));\nd(4);\nawait new Promise((r) => setTimeout(r, 80));\nif (JSON.stringify(calls) !== "[3,4]") throw new Error("got " + JSON.stringify(calls));',
    ['Keep the timer in a closure; clearTimeout it on every call, then set a new one.']),
  js('js-deep-equal', 'Deep Equal', 'Medium', ['javascript', 'recursion'],
    'Write `deepEqual(a, b)` that compares numbers, strings, booleans, null, arrays and plain objects recursively (key order doesn\'t matter).',
    'function deepEqual(a, b) {\n}\n',
    'function deepEqual(a, b) {\n  if (a === b) return true;\n  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;\n  if (Array.isArray(a) !== Array.isArray(b)) return false;\n  const ka = Object.keys(a), kb = Object.keys(b);\n  if (ka.length !== kb.length) return false;\n  return ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && deepEqual(a[k], b[k]));\n}\n',
    'const ok = [[{ a: 1, b: [1, 2] }, { b: [1, 2], a: 1 }], [null, null], [[], []], ["x", "x"]];\nconst bad = [[{ a: 1 }, { a: 2 }], [[1], { 0: 1 }], [null, {}], [{ a: undefined }, {}], [[1, 2], [1, 2, 3]]];\nfor (const [x, y] of ok) if (!deepEqual(x, y)) throw new Error("should be equal: " + JSON.stringify([x, y]));\nfor (const [x, y] of bad) if (deepEqual(x, y)) throw new Error("should NOT be equal: " + JSON.stringify([x, y]));',
    ['Handle primitives and null first, then compare key counts and recurse on each key.']),
  js('js-event-emitter', 'Event Emitter', 'Medium', ['javascript', 'design patterns'],
    'Build `class EventEmitter` with `on(event, fn)` (returns an unsubscribe function), `once(event, fn)` and `emit(event, ...args)` (returns how many listeners ran). This is the Observer pattern behind Node.js and the DOM.',
    'class EventEmitter {\n}\n',
    'class EventEmitter {\n  constructor() {\n    this.listeners = new Map();\n  }\n  on(event, fn) {\n    if (!this.listeners.has(event)) this.listeners.set(event, []);\n    this.listeners.get(event).push(fn);\n    return () => this.listeners.set(event, (this.listeners.get(event) || []).filter((f) => f !== fn));\n  }\n  once(event, fn) {\n    const off = this.on(event, (...args) => {\n      off();\n      fn(...args);\n    });\n    return off;\n  }\n  emit(event, ...args) {\n    const fns = [...(this.listeners.get(event) || [])];\n    fns.forEach((f) => f(...args));\n    return fns.length;\n  }\n}\n',
    'const e = new EventEmitter(); const log = [];\nconst off = e.on("msg", (x) => log.push("a" + x));\ne.once("msg", (x) => log.push("b" + x));\nif (e.emit("msg", 1) !== 2) throw new Error("emit should return 2 listeners");\nif (e.emit("msg", 2) !== 1) throw new Error("once listener should run only once");\noff();\nif (e.emit("msg", 3) !== 0) throw new Error("unsubscribe should remove the listener");\nif (log.join() !== "a1,b1,a2") throw new Error("got " + log.join());\nif (e.emit("nothing") !== 0) throw new Error("unknown events run 0 listeners");',
    ['Store a Map of event → array of functions.', 'once can be built from on: wrap fn so it unsubscribes itself first.']),
  js('js-retry', 'Retry with Backoff', 'Hard', ['javascript', 'async', 'reliability'],
    'Write `async retry(fn, attempts, baseMs)` that calls the async `fn` until it succeeds, up to `attempts` times, waiting `baseMs * 2^i` between tries (exponential backoff). Re-throw the last error if all fail. Real APIs need this!',
    'async function retry(fn, attempts, baseMs) {\n}\n',
    'async function retry(fn, attempts, baseMs) {\n  let lastError;\n  for (let i = 0; i < attempts; i++) {\n    try {\n      return await fn();\n    } catch (e) {\n      lastError = e;\n      if (i < attempts - 1) await new Promise((r) => setTimeout(r, baseMs * 2 ** i));\n    }\n  }\n  throw lastError;\n}\n',
    'let n = 0;\nconst flaky = async () => { n++; if (n < 3) throw new Error("fail " + n); return "ok"; };\nconst t0 = Date.now();\nconst r = await retry(flaky, 5, 10);\nif (r !== "ok" || n !== 3) throw new Error("should succeed on the 3rd try, got " + r + " after " + n);\nif (Date.now() - t0 < 25) throw new Error("should wait 10ms then 20ms between tries");\nlet threw = false;\ntry { await retry(async () => { throw new Error("nope"); }, 2, 1); } catch (e) { threw = e.message === "nope"; }\nif (!threw) throw new Error("should rethrow the last error");',
    ['A for loop with try { return await fn() } catch (e) { remember e, then sleep }', 'Sleep: await new Promise(r => setTimeout(r, ms))']),

  // ---------------- SQL ----------------
  sqlc('sql-cheap', 'Affordable Furniture', 'Easy', 'Select `name` and `price` of **furniture** under 200, cheapest first.', "SELECT name, price FROM products WHERE category = 'furniture' AND price < 200 ORDER BY price;", ["WHERE category = 'furniture' AND price < 200", 'ORDER BY price'], true),
  sqlc('sql-count-cat', 'Products per Category', 'Easy', 'Return each `category` and its number of products as `n`.', 'SELECT category, COUNT(*) AS n FROM products GROUP BY category;', ['GROUP BY category']),
  sqlc('sql-revenue', 'Revenue by Product', 'Medium', 'Return each sold product\'s `name` and total `revenue` (qty × price), highest first.', 'SELECT p.name, SUM(s.qty * p.price) AS revenue FROM sales s JOIN products p ON p.id = s.product_id GROUP BY p.id ORDER BY revenue DESC;', ['JOIN products p ON p.id = s.product_id', 'SUM(s.qty * p.price) ... GROUP BY p.id'], true),
  sqlc('sql-never-sold', 'Never Sold', 'Medium', 'Return the `name` of products that have **never** been sold.', 'SELECT p.name FROM products p LEFT JOIN sales s ON s.product_id = p.id WHERE s.id IS NULL;', ['LEFT JOIN sales, then keep rows where the sales side IS NULL', 'Or: WHERE id NOT IN (SELECT product_id FROM sales)']),
  sqlc('sql-best-day', 'Best Sales Day', 'Hard', 'Return the `day` with the highest total revenue and that `revenue`. (Only one row.)', 'SELECT s.day, SUM(s.qty * p.price) AS revenue FROM sales s JOIN products p ON p.id = s.product_id GROUP BY s.day ORDER BY revenue DESC LIMIT 1;', ['Group sales by day after joining products', 'ORDER BY revenue DESC LIMIT 1']),
  sqlc('sql-above-avg', 'Above Category Average', 'Hard', 'Return `name`, `category` and `price` of products priced **above the average price of their own category**.', 'SELECT name, category, price FROM products p WHERE price > (SELECT AVG(price) FROM products WHERE category = p.category);', ['A correlated subquery: (SELECT AVG(price) FROM products WHERE category = p.category)']),
];

/** Python, JavaScript and SQL first, then the same classic problems in 16 more languages. */
export const CHALLENGES: Challenge[] = [...CORE_CHALLENGES, ...LANG_CHALLENGES];
