import { lesson, langTrack } from './helpers';

export const java = langTrack({
  id: 'java',
  title: 'Java',
  icon: '☕',
  color: '#e76f00',
  lang: 'java',
  blurb: 'The enterprise workhorse: banks, big companies, Android and big-data systems run on the JVM.',
  fields: ['Backend (enterprise)', 'Android', 'Big data'],
  lessons: [
    lesson(
      'java-basics',
      'Hello, Java',
      `
Java code lives in **classes**. Execution starts at \`public static void main(String[] args)\`. It's **statically typed** and compiled to **bytecode** that runs on the JVM, on any OS.

~~~java
public class Main {
    public static void main(String[] args) {
        String name = "Duke";
        int year = 1995;
        double version = 21.0;
        var langs = 3;                     // local type inference (Java 10+)
        System.out.println("Hi " + name);
        System.out.printf("%s was born in %d%n", name, year);
    }
}
~~~

**Primitive types:** \`int\`, \`long\`, \`double\`, \`boolean\`, \`char\`. **Reference types:** \`String\`, arrays, objects.

**Coming from Python?** Statements end with \`;\`, blocks use \`{}\`, and every variable has a fixed type.
`,
      {
        prompt: 'In `main`, declare `String lang = "Java"` and `int year = 1995`. Print `Java is 31 years old in 2026` (compute the age), then print the length of `lang`.',
        starter: 'public class Main {\n    public static void main(String[] args) {\n        // your code\n    }\n}\n',
        solution: 'public class Main {\n    public static void main(String[] args) {\n        String lang = "Java";\n        int year = 1995;\n        System.out.println(lang + " is " + (2026 - year) + " years old in 2026");\n        System.out.println(lang.length());\n    }\n}\n',
        expected: 'Java is 31 years old in 2026\n4',
        hints: ['Use parentheses: "..." + (2026 - year) + "..."', 'lang.length()'],
      },
      [['JVM', 'Java Virtual Machine: runs Java bytecode, so the same .class/.jar runs on any OS.']],
    ),
    lesson(
      'java-control',
      'Control flow & methods',
      `
~~~java
static String grade(int score) {        // static method: belongs to the class
    if (score >= 90) return "A";
    else if (score >= 80) return "B";
    return "C";
}

for (int i = 0; i < 3; i++) { }
for (String s : list) { }               // enhanced for
while (n > 0) { n--; }

String kind = switch (day) {            // switch expression (Java 14+)
    case "SAT", "SUN" -> "weekend";
    default -> "weekday";
};
~~~

Methods declare a return type (\`void\` for none) and the types of their parameters. Java checks every call at compile time.
`,
      {
        prompt: 'Write `static int sumOfDigits(int n)` (e.g. 4096 → 19) and `static boolean isPrime(int n)`. In main print `sumOfDigits(4096)`, then all primes below 20 separated by spaces.',
        starter: 'public class Main {\n    static int sumOfDigits(int n) {\n        return 0;\n    }\n\n    static boolean isPrime(int n) {\n        return false;\n    }\n\n    public static void main(String[] args) {\n        System.out.println(sumOfDigits(4096));\n        StringBuilder sb = new StringBuilder();\n        // append primes below 20 separated by spaces\n        System.out.println(sb.toString().trim());\n    }\n}\n',
        solution: 'public class Main {\n    static int sumOfDigits(int n) {\n        int sum = 0;\n        while (n > 0) {\n            sum += n % 10;\n            n /= 10;\n        }\n        return sum;\n    }\n\n    static boolean isPrime(int n) {\n        if (n < 2) return false;\n        for (int d = 2; d * d <= n; d++) {\n            if (n % d == 0) return false;\n        }\n        return true;\n    }\n\n    public static void main(String[] args) {\n        System.out.println(sumOfDigits(4096));\n        StringBuilder sb = new StringBuilder();\n        for (int i = 2; i < 20; i++) {\n            if (isPrime(i)) sb.append(i).append(" ");\n        }\n        System.out.println(sb.toString().trim());\n    }\n}\n',
        expected: '19\n2 3 5 7 11 13 17 19',
        hints: ['Digits: sum += n % 10; n /= 10; in a while loop.', 'Prime: try divisors d from 2 while d * d <= n.'],
      },
      [['StringBuilder', 'Mutable string buffer: efficient for building strings in loops (String is immutable).']],
    ),
    lesson(
      'java-oop',
      'Classes, objects & interfaces',
      `
Java is built around **object-oriented programming**:

~~~java
interface Shape { double area(); }

class Circle implements Shape {
    private final double r;                  // encapsulated field
    Circle(double r) { this.r = r; }         // constructor
    public double area() { return Math.PI * r * r; }
}

record Point(int x, int y) {}                // immutable data class (Java 16+)
~~~

- \`private\` hides fields; \`public\` methods form the API.
- \`extends\` for inheritance (one parent), \`implements\` for interfaces (many).
- **Records** generate the constructor, getters, \`equals\`, \`hashCode\` and \`toString\` for you.
`,
      {
        prompt: 'Create `interface Animal { String name(); String sound(); }` and two records `Dog` and `Cat` implementing it (records automatically provide `name()`). Print `Rex says Woof` and `Tom says Meow` by looping over a list of animals.',
        starter: 'import java.util.List;\n\npublic class Main {\n    // define Animal, Dog and Cat here\n\n    public static void main(String[] args) {\n        // List<Animal> animals = List.of(new Dog("Rex"), new Cat("Tom"));\n    }\n}\n',
        solution: 'import java.util.List;\n\npublic class Main {\n    interface Animal {\n        String name();\n        String sound();\n    }\n\n    record Dog(String name) implements Animal {\n        public String sound() { return "Woof"; }\n    }\n\n    record Cat(String name) implements Animal {\n        public String sound() { return "Meow"; }\n    }\n\n    public static void main(String[] args) {\n        List<Animal> animals = List.of(new Dog("Rex"), new Cat("Tom"));\n        for (Animal a : animals) {\n            System.out.println(a.name() + " says " + a.sound());\n        }\n    }\n}\n',
        expected: 'Rex says Woof\nTom says Meow',
        hints: ['record Dog(String name) implements Animal { public String sound() { return "Woof"; } }', 'Nested types can live inside Main.'],
      },
      [['Java record', 'Concise immutable data class: record Point(int x, int y) {} generates constructor, accessors, equals, hashCode, toString.']],
    ),
    lesson(
      'java-collections',
      'Collections & generics',
      `
The **Collections Framework** is used in every Java program:

| Interface | Common class | Use for |
|---|---|---|
| \`List<T>\` | \`ArrayList\` | ordered items |
| \`Set<T>\` | \`HashSet\`, \`TreeSet\` (sorted) | unique items |
| \`Map<K,V>\` | \`HashMap\`, \`TreeMap\` (sorted keys) | key → value |
| \`Deque<T>\` | \`ArrayDeque\` | stack/queue |

~~~java
List<String> names = new ArrayList<>(List.of("ada", "linus"));
Map<String, Integer> counts = new TreeMap<>();
counts.merge("go", 1, Integer::sum);       // increment or insert
for (var e : counts.entrySet()) System.out.println(e.getKey() + "=" + e.getValue());
~~~

Generics (\`<String>\`) make collections type-safe. Collections can't hold primitives, so Java auto-boxes \`int\` ↔ \`Integer\`.
`,
      {
        prompt: 'Count word frequencies in `text` (lower-case) using a `TreeMap` so keys are sorted, and print each as `word=count`.',
        starter: 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        String text = "the cat and the hat and the bat";\n        // count with a TreeMap and print word=count\n    }\n}\n',
        solution: 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        String text = "the cat and the hat and the bat";\n        Map<String, Integer> counts = new TreeMap<>();\n        for (String w : text.toLowerCase().split("\\\\s+")) {\n            counts.merge(w, 1, Integer::sum);\n        }\n        for (var e : counts.entrySet()) {\n            System.out.println(e.getKey() + "=" + e.getValue());\n        }\n    }\n}\n',
        expected: 'and=2\nbat=1\ncat=1\nhat=1\nthe=3',
        hints: ['text.split("\\\\s+") splits on whitespace.', 'counts.merge(w, 1, Integer::sum)'],
      },
      [['TreeMap vs HashMap', 'TreeMap keeps keys sorted (O(log n)); HashMap is unordered but O(1) average.']],
    ),
    lesson(
      'java-streams',
      'Streams, lambdas & exceptions',
      `
**Streams** process collections declaratively, like a pipeline:

~~~java
List<Integer> nums = List.of(5, 2, 8, 1, 9);
int sumOfBigSquares = nums.stream()
    .filter(n -> n > 3)          // lambda
    .map(n -> n * n)
    .reduce(0, Integer::sum);    // method reference
List<String> sorted = names.stream().sorted().toList();
~~~

**Exceptions** handle errors. *Checked* exceptions must be declared or caught:

~~~java
try {
    int n = Integer.parseInt("abc");
} catch (NumberFormatException e) {
    System.out.println("bad number: " + e.getMessage());
} finally {
    System.out.println("done");
}
~~~
`,
      {
        prompt: 'Given `prices` (strings, some invalid), parse each with `Integer.parseInt`, skip invalid ones by catching `NumberFormatException` (print `skipping X`), then use a stream to print the sum of prices over 10.',
        starter: 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        List<String> prices = List.of("12", "abc", "5", "30", "7x");\n        List<Integer> valid = new ArrayList<>();\n        // parse, skip invalid, then sum prices > 10 with a stream\n    }\n}\n',
        solution: 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        List<String> prices = List.of("12", "abc", "5", "30", "7x");\n        List<Integer> valid = new ArrayList<>();\n        for (String p : prices) {\n            try {\n                valid.add(Integer.parseInt(p));\n            } catch (NumberFormatException e) {\n                System.out.println("skipping " + p);\n            }\n        }\n        int total = valid.stream().filter(n -> n > 10).mapToInt(Integer::intValue).sum();\n        System.out.println(total);\n    }\n}\n',
        expected: 'skipping abc\nskipping 7x\n42',
        hints: ['Wrap Integer.parseInt(p) in try/catch (NumberFormatException e).', 'valid.stream().filter(n -> n > 10).mapToInt(Integer::intValue).sum()'],
      },
      [['Checked vs unchecked exceptions', 'Checked (IOException) must be caught or declared with throws; unchecked (RuntimeException) need not be.']],
    ),
    lesson(
      'java-project',
      '🛠️ Mini project: Library system',
      `
Model a tiny **library** with classes and collections, the bread and butter of enterprise Java (in real life, this becomes a Spring Boot service with a database).
`,
      {
        prompt: 'Implement `Library` with `addBook(String title)`, `borrow(String title)` (returns `true` if available, marking it borrowed) and `available()` (sorted list of titles not borrowed). Run the script in main.',
        starter: 'import java.util.*;\n\npublic class Main {\n    static class Library {\n        // fields\n\n        void addBook(String title) {}\n\n        boolean borrow(String title) {\n            return false;\n        }\n\n        List<String> available() {\n            return new ArrayList<>();\n        }\n    }\n\n    public static void main(String[] args) {\n        Library lib = new Library();\n        lib.addBook("Dune");\n        lib.addBook("Clean Code");\n        lib.addBook("SICP");\n        System.out.println(lib.borrow("Dune"));\n        System.out.println(lib.borrow("Dune"));\n        System.out.println(lib.borrow("Missing"));\n        System.out.println(lib.available());\n    }\n}\n',
        solution: 'import java.util.*;\n\npublic class Main {\n    static class Library {\n        private final Set<String> books = new TreeSet<>();\n        private final Set<String> borrowed = new HashSet<>();\n\n        void addBook(String title) {\n            books.add(title);\n        }\n\n        boolean borrow(String title) {\n            if (!books.contains(title) || borrowed.contains(title)) return false;\n            borrowed.add(title);\n            return true;\n        }\n\n        List<String> available() {\n            List<String> out = new ArrayList<>();\n            for (String b : books) if (!borrowed.contains(b)) out.add(b);\n            return out;\n        }\n    }\n\n    public static void main(String[] args) {\n        Library lib = new Library();\n        lib.addBook("Dune");\n        lib.addBook("Clean Code");\n        lib.addBook("SICP");\n        System.out.println(lib.borrow("Dune"));\n        System.out.println(lib.borrow("Dune"));\n        System.out.println(lib.borrow("Missing"));\n        System.out.println(lib.available());\n    }\n}\n',
        expected: 'true\nfalse\nfalse\n[Clean Code, SICP]',
        hints: ['A TreeSet keeps titles sorted; a second Set tracks borrowed titles.', 'borrow: fail if the title is unknown or already borrowed.'],
      },
      [],
      80,
    ),
  ],
});
