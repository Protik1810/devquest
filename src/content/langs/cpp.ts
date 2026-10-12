import { lesson, langTrack } from './helpers';

export const cpp = langTrack({
  id: 'cpp',
  title: 'C++',
  icon: '➕',
  color: '#00599c',
  lang: 'cpp',
  blurb: 'High-performance C with classes, templates and a huge standard library. Game engines, browsers, trading systems.',
  fields: ['Game engines (Unreal)', 'Systems', 'High-performance computing'],
  lessons: [
    lesson(
      'cpp-basics',
      'Hello, C++',
      `
~~~cpp
#include <iostream>
#include <string>

int main() {
    std::string name = "Bjarne";
    int year = 1985;
    auto version = 17;                         // auto = inferred type
    std::cout << name << " released C++ in " << year << '\\n';
    std::cout << "We use C++" << version << std::endl;
}
~~~

- \`std::\` is the **standard library namespace**. \`std::cout <<\` prints.
- \`std::string\` manages its own memory, unlike C's \`char*\`.
- \`main\` returns 0 automatically.
`,
      {
        prompt: 'Declare `std::string word = "engine"` and print `engine has 6 letters`, then print the word repeated twice as `engineengine`.',
        starter: '#include <iostream>\n#include <string>\n\nint main() {\n    // your code\n}\n',
        solution: '#include <iostream>\n#include <string>\n\nint main() {\n    std::string word = "engine";\n    std::cout << word << " has " << word.size() << " letters\\n";\n    std::cout << word + word << "\\n";\n}\n',
        expected: 'engine has 6 letters\nengineengine',
        hints: ['word.size() gives the length.', 'Strings concatenate with +.'],
      },
      [['std::cout', 'Standard output stream; chain values with <<.']],
    ),
    lesson(
      'cpp-stl',
      'Vectors, maps & algorithms (STL)',
      `
The **Standard Template Library** provides containers and algorithms:

~~~cpp
#include <vector>
#include <map>
#include <algorithm>
#include <numeric>

std::vector<int> v{5, 2, 8, 1};
v.push_back(9);
std::sort(v.begin(), v.end());                        // 1 2 5 8 9
int total = std::accumulate(v.begin(), v.end(), 0);   // 25
auto it = std::find(v.begin(), v.end(), 8);

std::map<std::string, int> ages{{"ada", 36}};          // sorted by key
ages["linus"] = 28;
for (const auto& [name, age] : ages) std::cout << name << ' ' << age << '\\n';   // structured binding
~~~
`,
      {
        prompt: 'Given `std::vector<int> v{7, 3, 9, 3, 1, 9, 4}`: sort it, remove duplicates (`std::unique` + `erase`), print the values separated by spaces, then print the sum.',
        starter: '#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <numeric>\n\nint main() {\n    std::vector<int> v{7, 3, 9, 3, 1, 9, 4};\n    // sort, dedupe, print, sum\n}\n',
        solution: '#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <numeric>\n\nint main() {\n    std::vector<int> v{7, 3, 9, 3, 1, 9, 4};\n    std::sort(v.begin(), v.end());\n    v.erase(std::unique(v.begin(), v.end()), v.end());\n    for (size_t i = 0; i < v.size(); i++) std::cout << v[i] << (i + 1 < v.size() ? " " : "\\n");\n    std::cout << std::accumulate(v.begin(), v.end(), 0) << "\\n";\n}\n',
        expected: '1 3 4 7 9\n24',
        hints: ['std::sort(v.begin(), v.end());', 'v.erase(std::unique(v.begin(), v.end()), v.end());', 'std::accumulate(v.begin(), v.end(), 0)'],
      },
      [['Erase-remove idiom', 'v.erase(std::unique(...), v.end()) or std::remove: algorithms shift elements, erase removes the tail.']],
    ),
    lesson(
      'cpp-classes',
      'Classes & RAII',
      `
~~~cpp
class Timer {
public:
    explicit Timer(std::string name) : name_(std::move(name)) {}   // constructor + initializer list
    ~Timer() { std::cout << name_ << " done\\n"; }                   // destructor runs automatically
    void tick() { ++ticks_; }
    int ticks() const { return ticks_; }                            // const: doesn't modify the object
private:
    std::string name_;
    int ticks_ = 0;
};
~~~

**RAII** (*Resource Acquisition Is Initialization*): tie a resource (memory, file, lock) to an object's lifetime. The destructor frees it automatically when the object goes out of scope, even if an exception is thrown. It's C++'s answer to garbage collection.
`,
      {
        prompt: 'Write a class `Logger` whose constructor prints `open <name>`, has `void log(const std::string& msg)` printing `[<name>] <msg>`, and whose destructor prints `close <name>`. Create one in an inner scope `{ }`, log twice, then after the scope print `end`.',
        starter: '#include <iostream>\n#include <string>\n\n// class Logger\n\nint main() {\n    {\n        // Logger log("app"); ...\n    }\n    std::cout << "end\\n";\n}\n',
        solution: '#include <iostream>\n#include <string>\n\nclass Logger {\npublic:\n    explicit Logger(std::string name) : name_(std::move(name)) { std::cout << "open " << name_ << "\\n"; }\n    ~Logger() { std::cout << "close " << name_ << "\\n"; }\n    void log(const std::string& msg) const { std::cout << "[" << name_ << "] " << msg << "\\n"; }\n\nprivate:\n    std::string name_;\n};\n\nint main() {\n    {\n        Logger log("app");\n        log.log("starting");\n        log.log("ready");\n    }\n    std::cout << "end\\n";\n}\n',
        expected: 'open app\n[app] starting\n[app] ready\nclose app\nend',
        hints: ['The destructor ~Logger() runs at the closing } of the scope.', 'Constructor: Logger(std::string name) : name_(std::move(name)) { … }'],
      },
      [['RAII', 'Resources are acquired in a constructor and released in the destructor, so scope exit cleans up automatically.']],
    ),
    lesson(
      'cpp-smart',
      'Smart pointers & move semantics',
      `
Modern C++ almost never uses raw \`new\`/\`delete\`:

~~~cpp
#include <memory>
auto p = std::make_unique<Player>("Ada");     // sole owner; freed automatically
auto shared = std::make_shared<Texture>();    // reference-counted shared owner
std::unique_ptr<Player> q = std::move(p);     // transfer ownership (p becomes null)

std::vector<std::unique_ptr<Shape>> shapes;   // polymorphism without leaks
shapes.push_back(std::make_unique<Circle>(2.0));
~~~

**Move semantics** (\`std::move\`) transfer resources instead of copying them, which is key to C++ performance.
`,
      {
        prompt: 'Create an abstract `struct Shape { virtual double area() const = 0; virtual ~Shape() = default; }` with `Rect(w,h)` and `Circle(r)`. Store them in `std::vector<std::unique_ptr<Shape>>` and print the total area with 2 decimals (`std::fixed << std::setprecision(2)`).',
        starter: '#include <iostream>\n#include <iomanip>\n#include <memory>\n#include <vector>\n\n// Shape, Rect, Circle\n\nint main() {\n    // vector of unique_ptr<Shape>: Rect(2, 3), Circle(1), Rect(1, 1)\n}\n',
        solution: '#include <iostream>\n#include <iomanip>\n#include <memory>\n#include <vector>\n\nstruct Shape {\n    virtual double area() const = 0;\n    virtual ~Shape() = default;\n};\n\nstruct Rect : Shape {\n    double w, h;\n    Rect(double w, double h) : w(w), h(h) {}\n    double area() const override { return w * h; }\n};\n\nstruct Circle : Shape {\n    double r;\n    explicit Circle(double r) : r(r) {}\n    double area() const override { return 3.141592653589793 * r * r; }\n};\n\nint main() {\n    std::vector<std::unique_ptr<Shape>> shapes;\n    shapes.push_back(std::make_unique<Rect>(2, 3));\n    shapes.push_back(std::make_unique<Circle>(1));\n    shapes.push_back(std::make_unique<Rect>(1, 1));\n    double total = 0;\n    for (const auto& s : shapes) total += s->area();\n    std::cout << std::fixed << std::setprecision(2) << total << "\\n";\n}\n',
        expected: '10.14',
        hints: ['struct Rect : Shape { … double area() const override { return w * h; } };', 'shapes.push_back(std::make_unique<Rect>(2, 3));'],
      },
      [['unique_ptr vs shared_ptr', 'unique_ptr: single owner, zero overhead. shared_ptr: shared ownership via reference counting.']],
    ),
    lesson(
      'cpp-templates',
      'Templates & lambdas',
      `
**Templates** write code once for many types (the STL is built on them). **Lambdas** are inline functions:

~~~cpp
template <typename T>
T clamp(T value, T lo, T hi) { return value < lo ? lo : (value > hi ? hi : value); }

clamp(15, 0, 10);        // T = int
clamp(2.5, 0.0, 1.0);    // T = double

int threshold = 3;
auto big = [threshold](int x) { return x > threshold; };   // captures threshold
std::count_if(v.begin(), v.end(), big);
~~~
`,
      {
        prompt: 'Write a template `T max_of(const std::vector<T>& v)`. Print `max_of` of `{3, 8, 2}` and of `{"pear", "apple", "zebra"}` (as `std::string`). Then use `std::count_if` with a lambda to print how many numbers in `{1, 5, 8, 10, 3}` are greater than 4.',
        starter: '#include <iostream>\n#include <string>\n#include <vector>\n#include <algorithm>\n\n// template max_of\n\nint main() {\n}\n',
        solution: '#include <iostream>\n#include <string>\n#include <vector>\n#include <algorithm>\n\ntemplate <typename T>\nT max_of(const std::vector<T>& v) {\n    T best = v[0];\n    for (const auto& x : v) if (best < x) best = x;\n    return best;\n}\n\nint main() {\n    std::cout << max_of(std::vector<int>{3, 8, 2}) << "\\n";\n    std::cout << max_of(std::vector<std::string>{"pear", "apple", "zebra"}) << "\\n";\n    std::vector<int> nums{1, 5, 8, 10, 3};\n    int limit = 4;\n    std::cout << std::count_if(nums.begin(), nums.end(), [limit](int x) { return x > limit; }) << "\\n";\n}\n',
        expected: '8\nzebra\n3',
        hints: ['template <typename T> T max_of(const std::vector<T>& v) { … }', 'std::count_if(nums.begin(), nums.end(), [limit](int x) { return x > limit; })'],
      },
      [['C++ lambda capture', '[x] captures by value, [&x] by reference, [=] / [&] capture everything used.']],
    ),
    lesson(
      'cpp-project',
      '🛠️ Mini project: Particle system',
      `
Games update thousands of particles every frame. Write the core update loop with a struct, a vector and an algorithm, the way a game engine would.
`,
      {
        prompt: 'Each `Particle` has `x, vx, life`. Implement `update(std::vector<Particle>& ps, double dt)`: move (`x += vx * dt`), age (`life -= dt`), and remove dead particles (`life <= 0`) with the erase-remove idiom. After two updates of `dt = 0.5`, print the count and each `x` with 1 decimal.',
        starter: '#include <iostream>\n#include <iomanip>\n#include <vector>\n#include <algorithm>\n\nstruct Particle {\n    double x, vx, life;\n};\n\nvoid update(std::vector<Particle>& ps, double dt) {\n}\n\nint main() {\n    std::vector<Particle> ps{{0, 2, 1.5}, {10, -4, 0.8}, {5, 1, 3.0}};\n    update(ps, 0.5);\n    update(ps, 0.5);\n    std::cout << ps.size() << "\\n";\n    for (const auto& p : ps) std::cout << std::fixed << std::setprecision(1) << p.x << "\\n";\n}\n',
        solution: '#include <iostream>\n#include <iomanip>\n#include <vector>\n#include <algorithm>\n\nstruct Particle {\n    double x, vx, life;\n};\n\nvoid update(std::vector<Particle>& ps, double dt) {\n    for (auto& p : ps) {\n        p.x += p.vx * dt;\n        p.life -= dt;\n    }\n    ps.erase(std::remove_if(ps.begin(), ps.end(), [](const Particle& p) { return p.life <= 0; }), ps.end());\n}\n\nint main() {\n    std::vector<Particle> ps{{0, 2, 1.5}, {10, -4, 0.8}, {5, 1, 3.0}};\n    update(ps, 0.5);\n    update(ps, 0.5);\n    std::cout << ps.size() << "\\n";\n    for (const auto& p : ps) std::cout << std::fixed << std::setprecision(1) << p.x << "\\n";\n}\n',
        expected: '2\n2.0\n6.0',
        hints: ['for (auto& p : ps) { p.x += p.vx * dt; p.life -= dt; }', 'ps.erase(std::remove_if(…, [](const Particle& p) { return p.life <= 0; }), ps.end());'],
      },
      [],
      80,
    ),
  ],
});
