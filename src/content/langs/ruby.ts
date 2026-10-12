import { lesson, langTrack } from './helpers';

export const ruby = langTrack({
  id: 'ruby',
  title: 'Ruby',
  icon: '💎',
  color: '#cc342d',
  lang: 'ruby',
  blurb: 'A language designed for programmer happiness. Ruby on Rails powers GitHub, Shopify and countless startups.',
  fields: ['Web backend (Rails)', 'Scripting', 'Startups'],
  lessons: [
    lesson(
      'rb-basics',
      'Hello, Ruby',
      `
~~~ruby
name = "Ruby"
year = 1995
langs = ["Ruby", "Rails"]
puts "Hello from #{name}!"            # string interpolation
puts "#{name} is #{2026 - year} years old"
puts langs.length
p langs                               # p shows the inspect form: ["Ruby", "Rails"]
~~~

Everything in Ruby is an **object**, even numbers: \`5.times { puts "hi" }\`, \`-3.abs\`. Parentheses on method calls are optional: \`puts("x")\` = \`puts "x"\`.
`,
      {
        prompt: 'Set `framework = "Rails"` and `stars = 56000`. Print `Rails has 56000 stars`, then the framework name reversed and in upper case (`SLIAR`).',
        starter: '# your code\n',
        solution: 'framework = "Rails"\nstars = 56000\nputs "#{framework} has #{stars} stars"\nputs framework.reverse.upcase\n',
        expected: 'Rails has 56000 stars\nSLIAR',
        hints: ['puts "#{framework} has #{stars} stars"', 'Methods chain: framework.reverse.upcase'],
      },
      [['Ruby interpolation', 'Inside double quotes, #{expr} inserts the value of any expression.']],
    ),
    lesson(
      'rb-blocks',
      'Blocks & iterators',
      `
**Blocks** (\`{ }\` or \`do … end\`) are Ruby's signature feature:

~~~ruby
[1, 2, 3].each { |n| puts n }
squares = [1, 2, 3].map { |n| n * n }          # [1, 4, 9]
evens = (1..10).select(&:even?)                # &:method shorthand
total = [1, 2, 3].sum
words.each_with_index do |w, i|
  puts "#{i}: #{w}"
end
3.times { print "*" }
~~~

Methods that take blocks (\`each\`, \`map\`, \`select\`, \`reduce\`) replace most explicit loops.
`,
      {
        prompt: 'Given `words = %w[apple Banana cherry date Elderberry fig]`, print the words longer than 4 letters, downcased and sorted, joined by `, `. Then print the total number of characters in all words.',
        starter: 'words = %w[apple Banana cherry date Elderberry fig]\n# your code\n',
        solution: 'words = %w[apple Banana cherry date Elderberry fig]\nputs words.select { |w| w.length > 4 }.map(&:downcase).sort.join(", ")\nputs words.sum(&:length)\n',
        expected: 'apple, banana, cherry, elderberry\n34',
        hints: ['words.select { |w| w.length > 4 }.map(&:downcase).sort.join(", ")', 'words.sum(&:length)'],
      },
      [['Ruby &:method', 'map(&:upcase) is shorthand for map { |x| x.upcase }.']],
    ),
    lesson(
      'rb-hashes',
      'Hashes & symbols',
      `
**Hashes** map keys to values. Keys are usually **symbols** (\`:name\`), lightweight immutable identifiers:

~~~ruby
user = { name: "Ada", age: 36 }       # same as { :name => "Ada", :age => 36 }
user[:email] = "ada@example.com"
user.each { |key, value| puts "#{key}: #{value}" }
user.fetch(:phone, "n/a")             # default if missing
counts = Hash.new(0)                  # default value 0
"hello".each_char { |c| counts[c] += 1 }
~~~
`,
      {
        prompt: 'Count the letters in `"mississippi"` with `Hash.new(0)` and print each letter and count as `i: 4`, sorted by count descending, then by letter.',
        starter: 'word = "mississippi"\n# your code\n',
        solution: 'word = "mississippi"\ncounts = Hash.new(0)\nword.each_char { |c| counts[c] += 1 }\ncounts.sort_by { |c, n| [-n, c] }.each { |c, n| puts "#{c}: #{n}" }\n',
        expected: 'i: 4\ns: 4\np: 2\nm: 1',
        hints: ['counts = Hash.new(0) gives 0 for missing keys.', 'sort_by { |c, n| [-n, c] } sorts by count desc, then letter.'],
      },
      [['Ruby symbol', 'An immutable, interned name like :status; commonly used as hash keys.']],
    ),
    lesson(
      'rb-classes',
      'Classes & modules',
      `
~~~ruby
class Account
  attr_reader :owner, :balance          # generates getter methods

  def initialize(owner, balance = 0)
    @owner = owner                      # @ = instance variable
    @balance = balance
  end

  def deposit(amount)
    raise ArgumentError, "amount must be positive" unless amount.positive?
    @balance += amount
    self                                # return self to allow chaining
  end

  def to_s = "#{owner}: #{balance}"     # endless method (Ruby 3)
end

module Greet                            # mixin: shared behaviour
  def greet = "Hi, I'm #{name}"
end
~~~
`,
      {
        prompt: 'Create class `Book` with `title`, `author`, `pages`, and a `to_s` returning `"Title by Author (N pages)"`. Add a class method `self.longest(books)`. Print the longest book.',
        starter: 'class Book\n  # your code\nend\n\nbooks = [\n  Book.new("Dune", "Herbert", 412),\n  Book.new("SICP", "Abelson", 657),\n  Book.new("Refactoring", "Fowler", 448),\n]\nputs Book.longest(books)\n',
        solution: 'class Book\n  attr_reader :title, :author, :pages\n\n  def initialize(title, author, pages)\n    @title = title\n    @author = author\n    @pages = pages\n  end\n\n  def to_s\n    "#{title} by #{author} (#{pages} pages)"\n  end\n\n  def self.longest(books)\n    books.max_by(&:pages)\n  end\nend\n\nbooks = [\n  Book.new("Dune", "Herbert", 412),\n  Book.new("SICP", "Abelson", 657),\n  Book.new("Refactoring", "Fowler", 448),\n]\nputs Book.longest(books)\n',
        expected: 'SICP by Abelson (657 pages)',
        hints: ['attr_reader :title, :author, :pages', 'def self.longest(books) = books.max_by(&:pages)'],
      },
      [['Ruby @variable', 'An instance variable, private to the object; expose with attr_reader/attr_accessor.']],
    ),
    lesson(
      'rb-errors',
      'Exceptions & Rails-style conventions',
      `
~~~ruby
begin
  Integer("abc")
rescue ArgumentError => e
  puts "bad number: #{e.message}"
ensure
  puts "always runs"
end

def find_user!(id)          # convention: ! = dangerous / raises
  raise "not found" unless id == 1
  "Ada"
end
def admin? = true           # convention: ? = returns boolean
~~~

**Rails** builds on these conventions: *convention over configuration*. Name things the expected way and the framework wires them up for you (models ↔ tables, routes ↔ controllers).
`,
      {
        prompt: 'Write `def safe_divide(a, b)` that returns `a / b` as a float, rescues `ZeroDivisionError` and returns `nil`. For each pair print the result, or `undefined` when nil (use `||`).',
        starter: 'def safe_divide(a, b)\n  nil\nend\n\n[[10, 4], [5, 0], [9, 3]].each do |a, b|\n  # print result or "undefined"\nend\n',
        solution: 'def safe_divide(a, b)\n  Rational(a, b).to_f\nrescue ZeroDivisionError\n  nil\nend\n\n[[10, 4], [5, 0], [9, 3]].each do |a, b|\n  puts safe_divide(a, b) || "undefined"\nend\n',
        expected: '2.5\nundefined\n3.0',
        hints: ['A method body can have its own rescue clause.', 'Integer division by zero raises ZeroDivisionError; Rational(a, b) does too, then .to_f gives a float.'],
      },
      [['Ruby ! and ? methods', 'Convention: name? returns a boolean; name! is the "dangerous" version (mutates or raises).']],
    ),
    lesson(
      'rb-project',
      '🛠️ Mini project: Expense report',
      `
Ruby shines for quick data scripts. Parse a CSV-like string and produce a summary, the kind of task Rails apps do in background jobs.
`,
      {
        prompt: 'Parse the `data` lines (`category,amount`), sum amounts by category, and print each category sorted by total descending as `food: 42.50` (2 decimals). Finally print `total: X`.',
        starter: 'data = <<~CSV\n  food,12.50\n  rent,800\n  food,30.00\n  fun,25\nCSV\n\n# your code\n',
        solution: 'data = <<~CSV\n  food,12.50\n  rent,800\n  food,30.00\n  fun,25\nCSV\n\ntotals = Hash.new(0)\ndata.each_line do |line|\n  category, amount = line.strip.split(",")\n  totals[category] += amount.to_f\nend\ntotals.sort_by { |_, v| -v }.each { |c, v| puts format("%s: %.2f", c, v) }\nputs format("total: %.2f", totals.values.sum)\n',
        expected: 'rent: 800.00\nfood: 42.50\nfun: 25.00\ntotal: 867.50',
        hints: ['data.each_line, then line.strip.split(",")', 'totals[category] += amount.to_f', 'format("%s: %.2f", c, v)'],
      },
      [],
      80,
    ),
  ],
});
