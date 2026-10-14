/** Plain-English explanations for common errors, so beginners get help even without an AI provider. */
type Explainer = { match: RegExp; title: string; explain: string; fix: string };

const PY: Explainer[] = [
  { match: /NameError: name '(\w+)' is not defined/, title: 'NameError', explain: 'Python doesn\'t know the name `$1`. It was never created, or it is spelled differently (names are case-sensitive).', fix: 'Check the spelling, and make sure you assign `$1 = ...` before you use it. Strings need quotes: `"text"`.' },
  { match: /IndentationError|TabError/, title: 'IndentationError', explain: 'Python uses indentation to know which lines belong to a block (after `if`, `for`, `def`…). The spaces are inconsistent here.', fix: 'Indent the body of each block by exactly 4 spaces, and don\'t mix tabs with spaces.' },
  { match: /SyntaxError: (?:invalid syntax|expected ':')/, title: 'SyntaxError', explain: 'The code breaks Python\'s grammar rules, so it can\'t even start running.', fix: 'Look at the line shown (and the one above it): a missing `:` after `if/for/def`, an unclosed bracket or quote, or `=` where `==` was meant.' },
  { match: /SyntaxError: unterminated string|EOL while scanning/, title: 'Unclosed string', explain: 'A string was opened with a quote but never closed.', fix: 'Add the matching closing quote on the same line.' },
  { match: /SyntaxError: '\(' was never closed|unexpected EOF/, title: 'Unclosed bracket', explain: 'A `(`, `[` or `{` was opened but never closed.', fix: 'Count your brackets on the reported line; every opener needs a closer.' },
  { match: /TypeError: can only concatenate str \(not "(\w+)"\) to str/, title: 'TypeError: mixing text and numbers', explain: 'You tried to `+` a string and a $1. Python won\'t guess how to combine them.', fix: 'Convert first: `"Score: " + str(n)`, or better, use an f-string: `f"Score: {n}"`.' },
  { match: /TypeError: unsupported operand type/, title: 'TypeError: wrong types for an operator', explain: 'An operator like `+`, `-` or `*` got values of types that don\'t work together (for example a number and `None`).', fix: 'Print the values and their `type()` just before that line to see which one is unexpected.' },
  { match: /TypeError: .*takes (\d+) positional arguments? but (\d+) (?:were|was) given/, title: 'TypeError: wrong number of arguments', explain: 'The function expects $1 argument(s) but got $2.', fix: 'Compare the call with the `def` line. In a class method, remember `self` is passed automatically.' },
  { match: /TypeError: '(\w+)' object is not (subscriptable|callable|iterable)/, title: 'TypeError: not $2', explain: 'You used a `$1` value as if it were something else (indexing with `[]`, calling with `()`, or looping over it).', fix: 'Check that the variable holds what you think; a function that forgets to `return` gives `None`.' },
  { match: /IndexError: (?:list|string|tuple) index out of range/, title: 'IndexError', explain: 'You asked for a position that doesn\'t exist. Indexes start at 0, so the last item is at `len(x) - 1`.', fix: 'Check loop bounds and empty lists; `range(len(items))` never goes past the end.' },
  { match: /KeyError: (.+)/, title: 'KeyError', explain: 'The dictionary has no key $1.', fix: 'Use `d.get(key, default)` or check `if key in d:` first.' },
  { match: /ValueError: invalid literal for int\(\)/, title: 'ValueError', explain: '`int()` was given text that isn\'t a whole number.', fix: 'Strip spaces, check the input, or wrap the conversion in `try/except ValueError`.' },
  { match: /ZeroDivisionError/, title: 'ZeroDivisionError', explain: 'Something was divided by zero.', fix: 'Check the divisor before dividing (for example, an empty list has `len() == 0`).' },
  { match: /AttributeError: '(\w+)' object has no attribute '(\w+)'/, title: 'AttributeError', explain: 'Values of type `$1` don\'t have `.$2`.', fix: 'Check spelling, and check the variable really holds the type you expect (it may be `None`).' },
  { match: /RecursionError/, title: 'RecursionError', explain: 'A function kept calling itself and never stopped, so the call stack overflowed.', fix: 'Make sure there\'s a base case, and that each call moves closer to it.' },
  { match: /AssertionError/, title: 'A test failed', explain: 'Your code ran, but produced a result the test didn\'t expect.', fix: 'The result panel shows which check failed (and, for comparisons, the expected and actual values). Trace your code by hand with that input to see where it goes a different way.' },
];

const JS: Explainer[] = [
  { match: /ReferenceError: (\w+) is not defined/, title: 'ReferenceError', explain: '`$1` was never declared, or it is spelled differently (names are case-sensitive).', fix: 'Declare it with `const` or `let` before use, and check the spelling.' },
  { match: /TypeError: Cannot read propert(?:y|ies) of (undefined|null)/, title: 'TypeError: reading from $1', explain: 'You used `.something` on a value that is `$1`.', fix: 'Log the variable before that line; use optional chaining `obj?.prop` when it may be missing.' },
  { match: /TypeError: (\S+) is not a function/, title: 'TypeError: not a function', explain: '`$1` isn\'t a function, so it can\'t be called with `()`.', fix: 'Check the spelling and that the value really is a function (methods like `.map` only exist on arrays).' },
  { match: /SyntaxError/, title: 'SyntaxError', explain: 'The code breaks JavaScript\'s grammar rules.', fix: 'Look for a missing bracket, brace, quote or comma near the reported position.' },
  { match: /Assignment to constant variable/, title: 'Reassigning a const', explain: 'A `const` variable can\'t be given a new value.', fix: 'Use `let` if the value needs to change.' },
];

const SQL: Explainer[] = [
  { match: /no such table: (\w+)/, title: 'Unknown table', explain: 'There is no table called `$1`.', fix: 'Check the spelling against the tables listed in the lesson.' },
  { match: /no such column: ([\w.]+)/, title: 'Unknown column', explain: 'There is no column called `$1` in the tables you selected from.', fix: 'Check the spelling, and use `table.column` when you JOIN tables that share column names.' },
  { match: /syntax error/, title: 'SQL syntax error', explain: 'The query breaks SQL grammar.', fix: 'Check clause order: SELECT … FROM … WHERE … GROUP BY … HAVING … ORDER BY … LIMIT. Strings use single quotes.' },
  { match: /misuse of aggregate/, title: 'Aggregate misuse', explain: 'Aggregates like `COUNT` or `SUM` can\'t be used in `WHERE`.', fix: 'Filter groups with `HAVING` instead.' },
];

export function explainLocally(lang: string, error: string): { title: string; explain: string; fix: string } | null {
  const list = lang === 'python' ? PY : lang === 'sql' ? SQL : JS;
  for (const e of list) {
    const m = error.match(e.match);
    if (m) {
      const fill = (s: string) => s.replace(/\$(\d)/g, (_, i) => m[+i] ?? '');
      return { title: fill(e.title), explain: fill(e.explain), fix: fill(e.fix) };
    }
  }
  return null;
}
