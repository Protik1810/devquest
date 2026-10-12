import { lesson, langTrack } from './helpers';

export const dart = langTrack({
  id: 'dart',
  title: 'Dart (for Flutter)',
  icon: '🎯',
  color: '#0175c2',
  lang: 'dart',
  blurb: "The language of Flutter: one codebase for Android, iOS, web and desktop apps.",
  fields: ['Cross-platform mobile (Flutter)', 'Mobile'],
  lessons: [
    lesson(
      'dart-basics',
      'Hello, Dart',
      `
~~~dart
void main() {
  var name = 'Dart';          // inferred String
  final year = 2011;          // set once at runtime
  const pi = 3.14159;         // compile-time constant
  int count = 2;
  print('Hello, $name! Since $year, pi≈\${pi.toStringAsFixed(2)}');
}
~~~

- \`final\` = can't be reassigned; \`const\` = known at compile time (Flutter uses \`const\` widgets for speed).
- String interpolation: \`$name\` or \`\${expression}\`.
- Dart is **sound null-safe**: \`String?\` may be null, \`String\` never is.
`,
      {
        prompt: 'Declare `final app = \'Weather\'` and `var temps = [18, 21, 25]`. Print `Weather: 3 readings`, then the max temperature as `max 25`.',
        starter: 'void main() {\n  // your code\n}\n',
        solution: "void main() {\n  final app = 'Weather';\n  var temps = [18, 21, 25];\n  print('$app: ${temps.length} readings');\n  print('max ${temps.reduce((a, b) => a > b ? a : b)}');\n}\n",
        expected: 'Weather: 3 readings\nmax 25',
        hints: ["print('$app: ${temps.length} readings');", 'temps.reduce((a, b) => a > b ? a : b)'],
      },
      [['final vs const (Dart)', 'final: assigned once at runtime. const: compile-time constant (deeply immutable).']],
    ),
    lesson(
      'dart-functions',
      'Functions & null safety',
      `
~~~dart
int add(int a, int b) => a + b;                       // arrow function

String greet(String name, {String greeting = 'Hi'}) => // named parameter with default
    '$greeting, $name!';
greet('Ada', greeting: 'Hello');

String? nickname;                 // nullable
print(nickname?.length);          // null-aware access → null
print(nickname ?? 'none');        // default
nickname ??= 'Ace';               // assign if null
~~~

Flutter widget constructors use **named parameters** everywhere: \`Text('Hi', style: …)\`.
`,
      {
        prompt: 'Write `String formatPrice(double amount, {String currency = \'\\$\', int decimals = 2})`. Print `formatPrice(9.5)`, `formatPrice(1234.567, currency: \'€\', decimals: 1)`, then use `??` to print a nullable `String? coupon` or `no coupon`.',
        starter: "String formatPrice(double amount, {String currency = '\\$', int decimals = 2}) {\n  return '';\n}\n\nvoid main() {\n  print(formatPrice(9.5));\n  print(formatPrice(1234.567, currency: '€', decimals: 1));\n  String? coupon;\n  // print coupon or 'no coupon'\n}\n",
        solution: "String formatPrice(double amount, {String currency = '\\$', int decimals = 2}) {\n  return '$currency${amount.toStringAsFixed(decimals)}';\n}\n\nvoid main() {\n  print(formatPrice(9.5));\n  print(formatPrice(1234.567, currency: '€', decimals: 1));\n  String? coupon;\n  print(coupon ?? 'no coupon');\n}\n",
        expected: '$9.50\n€1234.6\nno coupon',
        hints: ["'$currency${amount.toStringAsFixed(decimals)}'", "print(coupon ?? 'no coupon');"],
      },
      [['Dart named parameters', "Declared in {braces}, passed by name: f(x, label: 'hi'). Can have defaults or be required."]],
    ),
    lesson(
      'dart-collections',
      'Lists, maps & collection tricks',
      `
~~~dart
final nums = [5, 2, 8, 1];
final evens = nums.where((n) => n.isEven).toList();
final doubled = nums.map((n) => n * 2).toList();
nums.sort();

final ages = {'ada': 36, 'linus': 28};
ages['grace'] = 85;
ages.forEach((name, age) => print('$name $age'));

// collection-if / collection-for (used heavily in Flutter UIs)
final isAdmin = true;
final menu = ['Home', if (isAdmin) 'Admin', for (var i = 1; i <= 2; i++) 'Page $i'];
~~~
`,
      {
        prompt: 'Given the `orders` list of maps, print the total of orders with status `paid`, then a list (using collection-for) of the item names in upper case.',
        starter: "void main() {\n  final orders = [\n    {'item': 'tea', 'price': 3, 'status': 'paid'},\n    {'item': 'cake', 'price': 5, 'status': 'pending'},\n    {'item': 'coffee', 'price': 4, 'status': 'paid'},\n  ];\n  // your code\n}\n",
        solution: "void main() {\n  final orders = [\n    {'item': 'tea', 'price': 3, 'status': 'paid'},\n    {'item': 'cake', 'price': 5, 'status': 'pending'},\n    {'item': 'coffee', 'price': 4, 'status': 'paid'},\n  ];\n  final paid = orders.where((o) => o['status'] == 'paid').fold<int>(0, (sum, o) => sum + (o['price'] as int));\n  print(paid);\n  print([for (final o in orders) (o['item'] as String).toUpperCase()]);\n}\n",
        expected: '7\n[TEA, CAKE, COFFEE]',
        hints: ["orders.where((o) => o['status'] == 'paid').fold<int>(0, (sum, o) => sum + (o['price'] as int))", "[for (final o in orders) (o['item'] as String).toUpperCase()]"],
      },
      [['Collection-for', "[for (var x in list) f(x)] builds a list inline; Flutter uses it to build widget lists."]],
    ),
    lesson(
      'dart-classes',
      'Classes & constructors',
      `
~~~dart
class Todo {
  final String title;
  bool done;
  Todo(this.title, {this.done = false});          // initializing formal parameters

  Todo copyWith({bool? done}) => Todo(title, done: done ?? this.done);

  @override
  String toString() => '\${done ? '✓' : '○'} $title';
}

abstract class Animal { String sound(); }
class Dog extends Animal {
  @override
  String sound() => 'Woof';
}
~~~

Flutter's \`StatelessWidget\` and \`StatefulWidget\` are classes you extend in exactly this way.
`,
      {
        prompt: 'Create `class Counter` with a private `_value`, a getter `value`, methods `increment()` and `reset()`, and an optional `step` (named, default 1) in the constructor. Run the script.',
        starter: "class Counter {\n  // your code\n}\n\nvoid main() {\n  final a = Counter();\n  final b = Counter(step: 5);\n  a.increment();\n  a.increment();\n  b.increment();\n  print('${a.value} ${b.value}');\n  b.reset();\n  print(b.value);\n}\n",
        solution: "class Counter {\n  final int step;\n  int _value = 0;\n\n  Counter({this.step = 1});\n\n  int get value => _value;\n\n  void increment() => _value += step;\n\n  void reset() => _value = 0;\n}\n\nvoid main() {\n  final a = Counter();\n  final b = Counter(step: 5);\n  a.increment();\n  a.increment();\n  b.increment();\n  print('${a.value} ${b.value}');\n  b.reset();\n  print(b.value);\n}\n",
        expected: '2 5\n0',
        hints: ['Counter({this.step = 1});', 'int get value => _value;', 'Names starting with _ are private to the file.'],
      },
      [['Dart privacy', 'Identifiers starting with _ are private to their library (file).']],
    ),
    lesson(
      'dart-async',
      'Futures & async/await',
      `
Apps load data asynchronously. Dart uses \`Future<T>\` and \`async\`/\`await\`, plus \`Stream<T>\` for sequences of events:

~~~dart
Future<String> fetchUser(int id) async {
  await Future.delayed(Duration(milliseconds: 100));   // pretend network call
  return 'user$id';
}

Future<void> main() async {
  final user = await fetchUser(1);
  final many = await Future.wait([fetchUser(2), fetchUser(3)]);   // in parallel
  print('$user $many');
}
~~~

In Flutter, \`FutureBuilder\` and \`StreamBuilder\` widgets rebuild the UI when the data arrives.
`,
      {
        prompt: 'Write `Future<int> loadLikes(String post)` that waits 10 ms and returns `post.length * 3`. In `main`, load `"hello"`, `"flutter"` and `"dart"` concurrently with `Future.wait`, print the list, then the total.',
        starter: "Future<int> loadLikes(String post) async {\n  return 0;\n}\n\nFuture<void> main() async {\n  // your code\n}\n",
        solution: "Future<int> loadLikes(String post) async {\n  await Future.delayed(const Duration(milliseconds: 10));\n  return post.length * 3;\n}\n\nFuture<void> main() async {\n  final likes = await Future.wait(['hello', 'flutter', 'dart'].map(loadLikes));\n  print(likes);\n  print(likes.reduce((a, b) => a + b));\n}\n",
        expected: '[15, 21, 12]\n48',
        hints: ['await Future.delayed(const Duration(milliseconds: 10));', "await Future.wait(['hello', 'flutter', 'dart'].map(loadLikes))"],
      },
      [['Future.wait', 'Runs several futures concurrently and completes with a list of their results.']],
    ),
    lesson(
      'dart-project',
      '🛠️ Mini project: Shopping cart state',
      `
Flutter apps keep state in classes that notify the UI when they change (e.g. \`ChangeNotifier\`). Build the logic of a cart.
`,
      {
        prompt: 'Implement `Cart` with `add(String item, double price)`, `remove(String item)`, `int get count` and `double get total`. Removing an item removes one occurrence. Print the count and total (2 decimals) after the script operations.',
        starter: "class Cart {\n  // your code\n}\n\nvoid main() {\n  final cart = Cart();\n  cart.add('milk', 1.99);\n  cart.add('bread', 2.50);\n  cart.add('milk', 1.99);\n  cart.remove('milk');\n  print(cart.count);\n  print(cart.total.toStringAsFixed(2));\n}\n",
        solution: "class Cart {\n  final List<MapEntry<String, double>> _items = [];\n\n  void add(String item, double price) => _items.add(MapEntry(item, price));\n\n  void remove(String item) {\n    final i = _items.indexWhere((e) => e.key == item);\n    if (i >= 0) _items.removeAt(i);\n  }\n\n  int get count => _items.length;\n\n  double get total => _items.fold(0.0, (sum, e) => sum + e.value);\n}\n\nvoid main() {\n  final cart = Cart();\n  cart.add('milk', 1.99);\n  cart.add('bread', 2.50);\n  cart.add('milk', 1.99);\n  cart.remove('milk');\n  print(cart.count);\n  print(cart.total.toStringAsFixed(2));\n}\n",
        expected: '2\n4.49',
        hints: ['Store entries in a List<MapEntry<String, double>>.', 'remove: indexWhere then removeAt.', 'total: fold(0.0, (sum, e) => sum + e.value)'],
      },
      [],
      80,
    ),
  ],
});
