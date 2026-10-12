import type { Track } from './types';

export const dsa: Track = {
  id: 'dsa',
  title: 'Data Structures & Algorithms',
  icon: '🧮',
  tier: 3,
  color: '#a855f7',
  blurb: 'Big-O, arrays, linked lists, stacks, queues, hash maps, trees, graphs, sorting and searching, all animated.',
  depth: 'full',
  lessons: [
    {
      id: 'dsa-bigo',
      title: 'Big-O: measuring speed',
      xp: 50,
      body: `
**Big-O notation** describes how an algorithm's work **grows** as the input size *n* grows. It ignores constants and focuses on the shape of the curve.

**Play with n and watch the curves race:**

{{viz:bigo}}

| Big-O | Name | Example |
|---|---|---|
| O(1) | constant | read \`list[5]\`, dict lookup |
| O(log n) | logarithmic | binary search |
| O(n) | linear | loop over a list once |
| O(n log n) | linearithmic | good sorting (merge sort) |
| O(n²) | quadratic | nested loops over the same list |
| O(2ⁿ) | exponential | naive recursive Fibonacci, brute-forcing subsets |

**Rules of thumb:** drop constants (O(2n) → O(n)); keep the dominant term (O(n² + n) → O(n²)); sequential steps add, nested steps multiply.

~~~python
def has_duplicate(nums):          # O(n²): compares every pair
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] == nums[j]: return True
    return False

def has_duplicate_fast(nums):     # O(n): set lookups are O(1)
    seen = set()
    for n in nums:
        if n in seen: return True
        seen.add(n)
    return False
~~~

We also measure **space complexity**: the second version uses O(n) extra memory to save time. That **time–space trade-off** is everywhere in engineering.
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'Two nested loops, each over n items. Complexity?', options: ['O(n)', 'O(2n)', 'O(n²)', 'O(log n)'], answer: 2 },
          { q: 'Simplify O(3n + 500)', options: ['O(3n)', 'O(n)', 'O(500)', 'O(1)'], answer: 1 },
          { q: 'Binary search on a sorted list is…', options: ['O(n)', 'O(1)', 'O(log n)', 'O(n log n)'], answer: 2 },
          { q: 'Which grows fastest?', options: ['O(n²)', 'O(n log n)', 'O(2ⁿ)', 'O(n)'], answer: 2 },
        ],
      },
      cards: [
        { front: 'Big-O of dict/set lookup', back: 'O(1) average' },
        { front: 'O(n log n)', back: 'Typical of efficient comparison sorts (merge sort, heap sort, average quicksort).' },
      ],
    },
    {
      id: 'dsa-arrays',
      title: 'Arrays vs linked lists',
      xp: 50,
      body: `
An **array** stores elements **side by side** in memory. Because every slot has the same size, the computer can jump straight to index *i*: address = start + i × size. That makes **reads O(1)**, but inserting at the front means shifting everything (**O(n)**).

A **linked list** stores each element in a separate **node** that points to the next one. Inserting at the front is **O(1)** (just re-point), but reaching index *i* means walking *i* nodes (**O(n)**).

{{ill:linkedlist}}

| Operation | Array / Python list | Linked list |
|---|---|---|
| Read by index | **O(1)** | O(n) |
| Append at end | O(1) amortized | O(1) with tail pointer |
| Insert at front | O(n) | **O(1)** |
| Search | O(n) | O(n) |
| Memory | compact, cache-friendly | extra pointer per node |

~~~python
class Node:
    def __init__(self, value, next=None):
        self.value = value
        self.next = next

head = Node(1, Node(2, Node(3)))   # 1 → 2 → 3
~~~

In practice arrays win most of the time thanks to CPU caches, but linked structures are the foundation for trees and graphs.
`,
      exercise: {
        kind: 'code',
        lang: 'python',
        prompt: 'Given the `Node` class, write `to_list(head)` that walks a linked list and returns a Python list of its values, and `reverse(head)` that reverses the linked list and returns the new head.',
        starter: 'class Node:\n    def __init__(self, value, next=None):\n        self.value = value\n        self.next = next\n\ndef to_list(head):\n    pass\n\ndef reverse(head):\n    pass\n',
        solution: 'class Node:\n    def __init__(self, value, next=None):\n        self.value = value\n        self.next = next\n\ndef to_list(head):\n    out = []\n    while head:\n        out.append(head.value)\n        head = head.next\n    return out\n\ndef reverse(head):\n    prev = None\n    while head:\n        nxt = head.next\n        head.next = prev\n        prev = head\n        head = nxt\n    return prev\n',
        hints: ['to_list: while head: append head.value, then head = head.next', 'reverse: keep a prev = None. For each node, save next, point node.next to prev, move prev and head forward.'],
        check: {
          type: 'tests',
          code: 'h = Node(1, Node(2, Node(3)))\nassert to_list(h) == [1, 2, 3]\nassert to_list(reverse(h)) == [3, 2, 1]\nassert reverse(None) is None\n',
        },
      },
      cards: [{ front: 'Why is array index access O(1)?', back: 'Elements are contiguous and equal-sized: address = base + index × size.' }],
    },
    {
      id: 'dsa-stackqueue',
      title: 'Stacks & queues',
      xp: 45,
      body: `
Two of the most useful restricted lists:

- **Stack**: **LIFO** (last in, first out), like a stack of plates. Operations: \`push\`, \`pop\`, \`peek\`.
  *Used for:* the call stack, undo/redo, browser back button, matching brackets, DFS.
- **Queue**: **FIFO** (first in, first out), like a line at a shop. Operations: \`enqueue\`, \`dequeue\`.
  *Used for:* task queues, print jobs, BFS, message brokers.

**Try them:**

{{viz:stackqueue}}

~~~python
stack = []
stack.append(1); stack.append(2)
stack.pop()        # 2

from collections import deque
queue = deque()
queue.append("a"); queue.append("b")
queue.popleft()    # 'a'  (O(1), unlike list.pop(0) which is O(n))
~~~
`,
      exercise: {
        kind: 'code',
        lang: 'python',
        prompt: 'Write `balanced(s)` that returns True if every bracket in `s` (`()[]{}`) is properly closed and nested. Use a stack!',
        starter: 'def balanced(s):\n    pairs = {")": "(", "]": "[", "}": "{"}\n    stack = []\n    # your code\n',
        solution: 'def balanced(s):\n    pairs = {")": "(", "]": "[", "}": "{"}\n    stack = []\n    for ch in s:\n        if ch in "([{":\n            stack.append(ch)\n        elif ch in pairs:\n            if not stack or stack.pop() != pairs[ch]:\n                return False\n    return not stack\n',
        hints: ['Push every opening bracket onto the stack.', 'On a closing bracket, the top of the stack must be its matching opener: pop and compare.', 'At the end the stack must be empty.'],
        check: {
          type: 'tests',
          code: 'for s, want in [("()", True), ("([]{})", True), ("(]", False), ("((", False), ("", True), ("a(b)c", True), ("}{", False)]:\n    assert balanced(s) == want, f"balanced({s!r}) should be {want}"\n',
        },
      },
      cards: [
        { front: 'LIFO vs FIFO', back: 'Stack = Last In First Out. Queue = First In First Out.' },
        { front: 'Python O(1) queue', back: 'collections.deque with append() / popleft()' },
      ],
    },
    {
      id: 'dsa-hash',
      title: 'Hash maps',
      xp: 45,
      body: `
A **hash map** (Python \`dict\`, JS \`Map\`/object, Java \`HashMap\`, Go \`map\`) stores key → value pairs with **O(1) average** lookup.

{{ill:hashmap}}

**How it works:**
1. A **hash function** turns the key into a big number: \`hash("ada") → 8274...\`
2. Take it modulo the number of **buckets** to pick a slot: \`8274... % 8 = 3\`
3. Store the pair in bucket 3. To look it up later, repeat the same math and go straight there.

**Collisions:** two keys may land in the same bucket. Common fixes are **chaining** (each bucket holds a small list) or **open addressing** (probe the next free slot). When the table gets too full (**load factor** > ~0.7), it **resizes** and re-hashes everything. That occasional O(n) step is why it's O(1) *amortized*.

**Keys must be immutable/hashable**, which is why Python lets you use a tuple but not a list as a dict key.

Hash maps solve a huge share of interview problems: counting, deduplication, "have I seen this before?", grouping, caching.
`,
      exercise: {
        kind: 'code',
        lang: 'python',
        prompt: 'Classic interview problem **Two Sum**: return the indices `[i, j]` of the two numbers in `nums` that add up to `target`. Do it in O(n) using a dict.',
        starter: 'def two_sum(nums, target):\n    seen = {}  # value -> index\n    # your code\n',
        solution: 'def two_sum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return [seen[target - n], i]\n        seen[n] = i\n    return None\n',
        hints: ['For each number n, the partner you need is target - n.', 'Check if the partner is already in seen; if not, store seen[n] = i.'],
        check: { type: 'tests', code: 'assert two_sum([2, 7, 11, 15], 9) == [0, 1]\nassert two_sum([3, 2, 4], 6) == [1, 2]\nassert two_sum([3, 3], 6) == [0, 1]\n' },
      },
      cards: [
        { front: 'Hash collision', back: 'Two keys map to the same bucket. Resolved by chaining or open addressing.' },
        { front: 'Load factor', back: 'items / buckets. When too high, the table resizes and rehashes.' },
      ],
    },
    {
      id: 'dsa-search',
      title: 'Binary search',
      xp: 50,
      body: `
Searching an unsorted list means checking every item: **O(n)**. But if the list is **sorted**, you can do much better: look at the middle, and throw away the half that can't contain the target. Repeat.

{{viz:binarysearch}}

Each step halves the search space, so 1,000,000 items take at most **20 steps** (2²⁰ ≈ 1M). That's **O(log n)**.

~~~python
def binary_search(items, target):
    lo, hi = 0, len(items) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if items[mid] == target:
            return mid
        if items[mid] < target:
            lo = mid + 1      # discard left half
        else:
            hi = mid - 1      # discard right half
    return -1
~~~

Binary search is everywhere: database indexes, \`git bisect\` (finding the commit that introduced a bug), and finding the answer to "the smallest x such that…" problems.
`,
      exercise: {
        kind: 'code',
        lang: 'python',
        prompt: 'Implement `first_at_least(items, x)`: given a sorted list, return the index of the first element `>= x`, or `len(items)` if none. Must be O(log n).',
        starter: 'def first_at_least(items, x):\n    lo, hi = 0, len(items)\n    # your code\n',
        solution: 'def first_at_least(items, x):\n    lo, hi = 0, len(items)\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if items[mid] < x:\n            lo = mid + 1\n        else:\n            hi = mid\n    return lo\n',
        hints: ['Keep the invariant: the answer is always in [lo, hi].', 'If items[mid] < x the answer is right of mid (lo = mid + 1); otherwise mid might be the answer (hi = mid).'],
        check: {
          type: 'tests',
          code: 'a = [1, 3, 3, 5, 8]\nfor x, want in [(0,0),(1,0),(2,1),(3,1),(4,3),(8,4),(9,5)]:\n    assert first_at_least(a, x) == want, f"first_at_least(a, {x}) should be {want}, got {first_at_least(a, x)}"\nassert first_at_least([], 5) == 0\n',
        },
      },
      cards: [{ front: 'Binary search precondition', back: 'The data must be sorted.' }],
    },
    {
      id: 'dsa-sorting',
      title: 'Sorting algorithms',
      xp: 55,
      body: `
Sorting is one of the most studied problems in CS. Pick an algorithm and watch it work:

{{viz:sorting}}

| Algorithm | Idea | Time (avg) | Stable? |
|---|---|---|---|
| Bubble sort | swap neighbors until no swaps | O(n²) | ✅ |
| Selection sort | repeatedly select the minimum | O(n²) | ❌ |
| Insertion sort | insert each item into the sorted prefix | O(n²), great for nearly-sorted data | ✅ |
| Merge sort | split in half, sort each, **merge** | **O(n log n)** always | ✅ |
| Quicksort | pick a **pivot**, partition smaller/larger, recurse | O(n log n) avg, O(n²) worst | ❌ |

**Stable** = equal items keep their original order (matters when sorting by multiple keys).

Real languages use hybrids: Python's \`sorted()\` uses **Timsort** (merge + insertion), and C++/Rust use **introsort/pdqsort** (quick + heap + insertion).
`,
      exercise: {
        kind: 'code',
        lang: 'python',
        prompt: 'Implement `merge_sort(items)` that returns a new sorted list. (Don\'t use `sorted()` or `.sort()`!)',
        starter: 'def merge(left, right):\n    out = []\n    # merge two sorted lists\n    return out\n\ndef merge_sort(items):\n    if len(items) <= 1:\n        return items\n    # split, sort halves, merge\n',
        solution: 'def merge(left, right):\n    out = []\n    i = j = 0\n    while i < len(left) and j < len(right):\n        if left[i] <= right[j]:\n            out.append(left[i]); i += 1\n        else:\n            out.append(right[j]); j += 1\n    return out + left[i:] + right[j:]\n\ndef merge_sort(items):\n    if len(items) <= 1:\n        return items\n    mid = len(items) // 2\n    return merge(merge_sort(items[:mid]), merge_sort(items[mid:]))\n',
        hints: ['merge: walk both lists with two indices, always appending the smaller head.', 'After the loop, add whatever is left: out + left[i:] + right[j:]', 'merge_sort: mid = len(items) // 2, then merge(merge_sort(left half), merge_sort(right half))'],
        check: {
          type: 'tests',
          code: 'import random\nfor _ in range(20):\n    data = [random.randint(-50, 50) for _ in range(random.randint(0, 30))]\n    assert merge_sort(list(data)) == sorted(data), f"failed on {data}"\n',
        },
      },
      cards: [
        { front: 'Merge sort complexity', back: 'O(n log n) time always, O(n) extra space, stable.' },
        { front: 'Stable sort', back: 'Equal elements keep their original relative order.' },
      ],
    },
    {
      id: 'dsa-trees',
      title: 'Trees & binary search trees',
      xp: 55,
      body: `
A **tree** is a hierarchy of nodes: one **root**, each node has **children**, nodes without children are **leaves**. Your filesystem, the HTML DOM, JSON and org charts are all trees.

A **binary search tree (BST)** keeps the rule: *left subtree < node < right subtree*. That makes search, insert and delete **O(log n)** when the tree is balanced.

**Insert numbers and watch the tree grow:**

{{viz:bst}}

**Traversals** (ways to visit every node):
- **In-order** (left, node, right): visits a BST in **sorted order**
- **Pre-order** (node, left, right): copying/serializing a tree
- **Post-order** (left, right, node): deleting, computing folder sizes
- **Level-order** (BFS with a queue): level by level

⚠️ Insert already-sorted data into a plain BST and it degenerates into a linked list (O(n)). **Self-balancing trees** (AVL, Red-Black) fix this; databases use **B-trees**, which are wide balanced trees designed for disks.

~~~python
def height(node):
    if node is None:
        return 0
    return 1 + max(height(node.left), height(node.right))
~~~
`,
      exercise: {
        kind: 'code',
        lang: 'python',
        prompt: 'Implement `insert(root, value)` (returns the root) and `in_order(root)` (returns a list of values in sorted order) for a BST.',
        starter: 'class TreeNode:\n    def __init__(self, value):\n        self.value = value\n        self.left = None\n        self.right = None\n\ndef insert(root, value):\n    pass\n\ndef in_order(root):\n    pass\n',
        solution: 'class TreeNode:\n    def __init__(self, value):\n        self.value = value\n        self.left = None\n        self.right = None\n\ndef insert(root, value):\n    if root is None:\n        return TreeNode(value)\n    if value < root.value:\n        root.left = insert(root.left, value)\n    else:\n        root.right = insert(root.right, value)\n    return root\n\ndef in_order(root):\n    if root is None:\n        return []\n    return in_order(root.left) + [root.value] + in_order(root.right)\n',
        hints: ['insert: if root is None, return a new TreeNode(value).', 'Otherwise recurse left or right and re-attach: root.left = insert(root.left, value)', 'in_order: in_order(left) + [value] + in_order(right)'],
        check: {
          type: 'tests',
          code: 'r = None\nfor v in [50, 30, 70, 20, 40, 60, 80, 35]:\n    r = insert(r, v)\nassert r.value == 50 and r.left.value == 30 and r.right.value == 70\nassert in_order(r) == [20, 30, 35, 40, 50, 60, 70, 80], in_order(r)\nassert in_order(None) == []\n',
        },
      },
      cards: [
        { front: 'BST property', back: 'Every node: all values in left subtree < node < all values in right subtree.' },
        { front: 'In-order traversal of a BST', back: 'Produces values in sorted order.' },
      ],
    },
    {
      id: 'dsa-graphs',
      title: 'Graphs, BFS & DFS',
      xp: 60,
      body: `
A **graph** is a set of **nodes** (vertices) connected by **edges**. Social networks, maps, the internet, package dependencies and state machines are all graphs.

- **Directed** (one-way, like Twitter follows) vs **undirected** (two-way, like Facebook friends)
- **Weighted** edges carry a cost (road distance)
- Stored as an **adjacency list**: \`{"A": ["B", "C"], "B": ["D"], ...}\`

**Watch the two classic traversals explore the same graph:**

{{viz:graph}}

- **BFS (breadth-first)** uses a **queue** and explores in rings: all neighbors first, then their neighbors. It finds the **shortest path** in unweighted graphs.
- **DFS (depth-first)** uses a **stack** (or recursion) and goes as deep as possible before backtracking. Used for cycle detection, topological sort, mazes.

Other famous graph algorithms: **Dijkstra** (shortest weighted path: GPS), **A\\*** (Dijkstra plus a heuristic: games), **topological sort** (build order: npm, make), **union-find** (connected components).
`,
      exercise: {
        kind: 'code',
        lang: 'python',
        prompt: 'Write `shortest_path_len(graph, start, goal)` using BFS. `graph` is an adjacency-list dict. Return the number of edges on the shortest path, or -1 if unreachable.',
        starter: 'from collections import deque\n\ndef shortest_path_len(graph, start, goal):\n    queue = deque([(start, 0)])\n    seen = {start}\n    # your code\n',
        solution: 'from collections import deque\n\ndef shortest_path_len(graph, start, goal):\n    queue = deque([(start, 0)])\n    seen = {start}\n    while queue:\n        node, dist = queue.popleft()\n        if node == goal:\n            return dist\n        for nb in graph.get(node, []):\n            if nb not in seen:\n                seen.add(nb)\n                queue.append((nb, dist + 1))\n    return -1\n',
        hints: ['Loop while the queue is not empty; popleft() gives (node, dist).', 'If node == goal return dist. Otherwise enqueue unseen neighbors with dist + 1.'],
        check: {
          type: 'tests',
          code: 'g = {"A": ["B", "C"], "B": ["D"], "C": ["D", "E"], "D": ["F"], "E": ["F"], "F": [], "Z": []}\nassert shortest_path_len(g, "A", "F") == 3\nassert shortest_path_len(g, "A", "A") == 0\nassert shortest_path_len(g, "A", "Z") == -1\n',
        },
      },
      cards: [
        { front: 'BFS uses a… / DFS uses a…', back: 'BFS: queue. DFS: stack (or recursion).' },
        { front: 'Shortest path in an unweighted graph', back: 'BFS' },
      ],
    },
  ],
};
