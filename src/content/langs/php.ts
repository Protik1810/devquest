import { lesson, langTrack } from './helpers';

export const php = langTrack({
  id: 'php',
  title: 'PHP',
  icon: '🐘',
  color: '#777bb4',
  lang: 'php',
  blurb: 'Powers a huge part of the web: WordPress, Wikipedia, Laravel apps and e-commerce sites.',
  fields: ['Web backend (Laravel)', 'CMS (WordPress)', 'E-commerce'],
  lessons: [
    lesson(
      'php-basics',
      'Hello, PHP',
      `
PHP code lives between \`<?php\` tags. Variables start with \`$\`:

~~~php
<?php
$name = "PHP";
$year = 1995;
$version = 8.5;
echo "Hello from $name!\\n";                 // variables interpolate in double quotes
echo "{$name} is " . (2026 - $year) . " years old\\n";   // . concatenates
printf("Version %.1f\\n", $version);
~~~

PHP was built for the web: a request comes in, PHP builds an HTML (or JSON) response and the process ends. Modern PHP (8.x) is fast and typed, with frameworks like **Laravel** and **Symfony**.
`,
      {
        prompt: 'Set `$site = "Blog"` and `$posts = 12`. Print `Blog has 12 posts`, then on the next line `Average views: 37.5` given `$views = 450` (views / posts).',
        starter: '<?php\n// your code\n',
        solution: '<?php\n$site = "Blog";\n$posts = 12;\n$views = 450;\necho "$site has $posts posts\\n";\necho "Average views: " . ($views / $posts) . "\\n";\n',
        expected: 'Blog has 12 posts\nAverage views: 37.5',
        hints: ['echo "$site has $posts posts\\n";', 'Concatenate with . and wrap the division in parentheses.'],
      },
      [['PHP concatenation', 'The . operator joins strings: "a" . "b". Double quotes also interpolate $variables.']],
    ),
    lesson(
      'php-arrays',
      'Arrays (lists & maps)',
      `
PHP has one flexible **array** type that works as a list *and* as an ordered map:

~~~php
$langs = ["PHP", "JS", "SQL"];
$langs[] = "CSS";                                // append
$user = ["name" => "Ada", "age" => 36];          // associative array
$user["email"] = "ada@example.com";

foreach ($user as $key => $value) {
    echo "$key: $value\\n";
}
count($langs);                                   // 4
in_array("JS", $langs);                          // true
array_key_exists("name", $user);                 // true
~~~
`,
      {
        prompt: 'Given `$stock = ["apples" => 12, "pears" => 0, "plums" => 7]`, print the names of items in stock (quantity > 0) joined by `, `, then the total quantity.',
        starter: '<?php\n$stock = ["apples" => 12, "pears" => 0, "plums" => 7];\n// your code\n',
        solution: '<?php\n$stock = ["apples" => 12, "pears" => 0, "plums" => 7];\n$inStock = [];\nforeach ($stock as $item => $qty) {\n    if ($qty > 0) {\n        $inStock[] = $item;\n    }\n}\necho implode(", ", $inStock) . "\\n";\necho array_sum($stock) . "\\n";\n',
        expected: 'apples, plums\n19',
        hints: ['foreach ($stock as $item => $qty)', 'implode(", ", $array) joins; array_sum($stock) adds the values.'],
      },
      [['PHP associative array', 'An ordered map: ["key" => value]; iterate with foreach ($a as $k => $v).']],
    ),
    lesson(
      'php-functions',
      'Functions & array functions',
      `
~~~php
function greet(string $name, string $greeting = "Hi"): string {   // typed params & return
    return "$greeting, $name!";
}

$nums = [5, 2, 8, 1];
$doubled = array_map(fn($n) => $n * 2, $nums);                     // arrow function
$evens   = array_filter($nums, fn($n) => $n % 2 === 0);
sort($nums);                                                        // in place
usort($users, fn($a, $b) => $a["age"] <=> $b["age"]);              // spaceship operator
~~~

Use \`===\` (strict comparison). \`"1" == 1\` is \`true\` in PHP, but \`"1" === 1\` is \`false\`.
`,
      {
        prompt: 'Write `function slugify(string $title): string` that lower-cases, replaces runs of non-alphanumeric characters with `-`, and trims dashes. Print the slug for each title.',
        starter: '<?php\nfunction slugify(string $title): string {\n    return "";\n}\n\nforeach (["Hello World!", "  PHP 8.5 is out  ", "Laravel & Symfony"] as $t) {\n    echo slugify($t) . "\\n";\n}\n',
        solution: '<?php\nfunction slugify(string $title): string {\n    $slug = preg_replace("/[^a-z0-9]+/", "-", strtolower($title));\n    return trim($slug, "-");\n}\n\nforeach (["Hello World!", "  PHP 8.5 is out  ", "Laravel & Symfony"] as $t) {\n    echo slugify($t) . "\\n";\n}\n',
        expected: 'hello-world\nphp-8-5-is-out\nlaravel-symfony',
        hints: ['preg_replace("/[^a-z0-9]+/", "-", strtolower($title))', 'trim($slug, "-") removes dashes at both ends.'],
      },
      [['PHP == vs ===', '== compares after type juggling; === requires same type and value. Prefer ===.']],
    ),
    lesson(
      'php-oop',
      'Classes & interfaces',
      `
~~~php
interface Shape { public function area(): float; }

class Rect implements Shape {
    public function __construct(private float $w, private float $h) {}   // constructor promotion (PHP 8)
    public function area(): float { return $this->w * $this->h; }
}

final class Circle implements Shape {
    public function __construct(private float $r) {}
    public function area(): float { return M_PI * $this->r ** 2; }
}

$shapes = [new Rect(2, 3), new Circle(1)];
~~~

\`$this->\` accesses members; \`static::\` / \`self::\` access class-level members. Laravel models, controllers and jobs are all classes like these.
`,
      {
        prompt: 'Create class `Product` with promoted constructor properties `name` and `price` (public readonly), and a method `withDiscount(int $percent): Product` returning a **new** product. Print the original and discounted price for a `Laptop` at 1200 with 15% off, as `Laptop: 1200` and `Laptop: 1020`.',
        starter: '<?php\nclass Product {\n    // your code\n}\n\n$p = new Product("Laptop", 1200);\n// print original and discounted\n',
        solution: '<?php\nclass Product {\n    public function __construct(public readonly string $name, public readonly float $price) {}\n\n    public function withDiscount(int $percent): Product {\n        return new Product($this->name, $this->price * (100 - $percent) / 100);\n    }\n}\n\n$p = new Product("Laptop", 1200);\n$d = $p->withDiscount(15);\necho "{$p->name}: {$p->price}\\n";\necho "{$d->name}: {$d->price}\\n";\n',
        expected: 'Laptop: 1200\nLaptop: 1020',
        hints: ['public function __construct(public readonly string $name, public readonly float $price) {}', 'return new Product($this->name, $this->price * (100 - $percent) / 100);'],
      },
      [['PHP constructor promotion', 'function __construct(private string $x) {} declares and assigns the property in one step.']],
    ),
    lesson(
      'php-json',
      'JSON & building an API response',
      `
PHP backends mostly speak **JSON**:

~~~php
$data = ["id" => 7, "tags" => ["php", "api"], "active" => true];
$json = json_encode($data);                       // {"id":7,"tags":["php","api"],"active":true}
$back = json_decode($json, true);                 // true → associative arrays
echo $back["tags"][0];
echo json_encode($data, JSON_PRETTY_PRINT);
~~~

In Laravel a controller just returns an array, and the framework encodes it as a JSON response.
`,
      {
        prompt: 'Decode the `$payload` JSON, keep users with `"active": true`, and print a JSON response `{"count":2,"names":["Ada","Linus"]}` with `json_encode`.',
        starter: '<?php\n$payload = \'[{"name":"Ada","active":true},{"name":"Bob","active":false},{"name":"Linus","active":true}]\';\n// your code\n',
        solution: '<?php\n$payload = \'[{"name":"Ada","active":true},{"name":"Bob","active":false},{"name":"Linus","active":true}]\';\n$users = json_decode($payload, true);\n$active = array_values(array_filter($users, fn($u) => $u["active"]));\n$names = array_map(fn($u) => $u["name"], $active);\necho json_encode(["count" => count($names), "names" => $names]) . "\\n";\n',
        expected: '{"count":2,"names":["Ada","Linus"]}',
        hints: ['json_decode($payload, true) gives associative arrays.', 'array_filter keeps keys; wrap in array_values to reindex before encoding.'],
      },
      [['json_decode($s, true)', 'Decodes JSON into associative arrays instead of stdClass objects.']],
    ),
    lesson(
      'php-project',
      '🛠️ Mini project: Router',
      `
Every PHP framework starts with a **router** that maps a URL path to a handler. Build a tiny one with closures and regex.
`,
      {
        prompt: 'Implement `Router::get($pattern, $handler)` and `dispatch($path)`. Patterns like `/users/{id}` become a regex capturing `id`; call the handler with the captured values, or return `404 Not Found`. Run the script.',
        starter: '<?php\nclass Router {\n    private array $routes = [];\n\n    public function get(string $pattern, callable $handler): void {}\n\n    public function dispatch(string $path): string {\n        return "404 Not Found";\n    }\n}\n\n$r = new Router();\n$r->get("/", fn() => "home");\n$r->get("/users/{id}", fn($id) => "user $id");\n$r->get("/posts/{slug}/comments", fn($slug) => "comments on $slug");\nforeach (["/", "/users/42", "/posts/hello-php/comments", "/nope"] as $p) {\n    echo $r->dispatch($p) . "\\n";\n}\n',
        solution: '<?php\nclass Router {\n    private array $routes = [];\n\n    public function get(string $pattern, callable $handler): void {\n        $regex = "#^" . preg_replace("#\\\\{\\\\w+\\\\}#", "([^/]+)", $pattern) . "$#";\n        $this->routes[] = [$regex, $handler];\n    }\n\n    public function dispatch(string $path): string {\n        foreach ($this->routes as [$regex, $handler]) {\n            if (preg_match($regex, $path, $m)) {\n                return $handler(...array_slice($m, 1));\n            }\n        }\n        return "404 Not Found";\n    }\n}\n\n$r = new Router();\n$r->get("/", fn() => "home");\n$r->get("/users/{id}", fn($id) => "user $id");\n$r->get("/posts/{slug}/comments", fn($slug) => "comments on $slug");\nforeach (["/", "/users/42", "/posts/hello-php/comments", "/nope"] as $p) {\n    echo $r->dispatch($p) . "\\n";\n}\n',
        expected: 'home\nuser 42\ncomments on hello-php\n404 Not Found',
        hints: ['Turn {name} into ([^/]+) with preg_replace, then wrap in #^…$#.', 'preg_match($regex, $path, $m) fills $m; pass array_slice($m, 1) to the handler with the spread operator.'],
      },
      [],
      80,
    ),
  ],
});
