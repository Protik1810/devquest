import { lesson, langTrack } from './helpers';

export const c = langTrack({
  id: 'c',
  title: 'C',
  icon: '🔧',
  color: '#5c6bc0',
  lang: 'c',
  blurb: 'The language under everything: operating systems, embedded devices, databases and other languages.',
  fields: ['Systems', 'Embedded & IoT', 'Operating systems'],
  lessons: [
    lesson(
      'c-basics',
      'Hello, C',
      `
~~~c
#include <stdio.h>

int main(void) {
    int age = 50;
    double pi = 3.14159;
    char grade = 'A';
    const char *name = "C";          // a pointer to characters
    printf("%s is %d years old\\n", name, age);
    printf("pi=%.2f grade=%c\\n", pi, grade);
    return 0;                         // 0 = success
}
~~~

| Format | Type |
|---|---|
| \`%d\` | int |
| \`%ld\` | long |
| \`%f\`, \`%.2f\` | double |
| \`%c\` | char |
| \`%s\` | string (char *) |

C compiles straight to machine code. There's no garbage collector and little safety net, so you control (and must manage) everything.
`,
      {
        prompt: 'Declare `int width = 7` and `int height = 6`. Print `area = 42` and then `ratio = 1.17` (width/height as a double with 2 decimals).',
        starter: '#include <stdio.h>\n\nint main(void) {\n    // your code\n    return 0;\n}\n',
        solution: '#include <stdio.h>\n\nint main(void) {\n    int width = 7;\n    int height = 6;\n    printf("area = %d\\n", width * height);\n    printf("ratio = %.2f\\n", (double)width / height);\n    return 0;\n}\n',
        expected: 'area = 42\nratio = 1.17',
        hints: ['printf("area = %d\\n", width * height);', 'Cast before dividing: (double)width / height, otherwise integer division gives 1.'],
      },
      [['Integer division in C', '7 / 6 == 1 for ints; cast one side to double to get 1.1666…']],
    ),
    lesson(
      'c-arrays',
      'Arrays, loops & functions',
      `
~~~c
int sum(const int *arr, int n) {     // arrays decay to pointers when passed
    int total = 0;
    for (int i = 0; i < n; i++) total += arr[i];
    return total;
}

int main(void) {
    int nums[] = {4, 8, 15, 16, 23, 42};
    int n = sizeof(nums) / sizeof(nums[0]);   // number of elements
    printf("%d\\n", sum(nums, n));
}
~~~

⚠️ C does **not** check array bounds. Reading \`nums[100]\` is *undefined behavior*: it might print garbage, crash, or seem to work. This is the root of many security bugs (buffer overflows).
`,
      {
        prompt: 'Write `int max_of(const int *arr, int n)` and `double average(const int *arr, int n)`. For the array `{3, 9, 2, 7, 4}` print `max=9` and `avg=5.00`.',
        starter: '#include <stdio.h>\n\nint max_of(const int *arr, int n) {\n    return 0;\n}\n\ndouble average(const int *arr, int n) {\n    return 0.0;\n}\n\nint main(void) {\n    int nums[] = {3, 9, 2, 7, 4};\n    int n = sizeof(nums) / sizeof(nums[0]);\n    printf("max=%d\\n", max_of(nums, n));\n    printf("avg=%.2f\\n", average(nums, n));\n    return 0;\n}\n',
        solution: '#include <stdio.h>\n\nint max_of(const int *arr, int n) {\n    int best = arr[0];\n    for (int i = 1; i < n; i++) {\n        if (arr[i] > best) best = arr[i];\n    }\n    return best;\n}\n\ndouble average(const int *arr, int n) {\n    int total = 0;\n    for (int i = 0; i < n; i++) total += arr[i];\n    return (double)total / n;\n}\n\nint main(void) {\n    int nums[] = {3, 9, 2, 7, 4};\n    int n = sizeof(nums) / sizeof(nums[0]);\n    printf("max=%d\\n", max_of(nums, n));\n    printf("avg=%.2f\\n", average(nums, n));\n    return 0;\n}\n',
        expected: 'max=9\navg=5.00',
        hints: ['Start best = arr[0] and compare the rest.', 'Average: (double)total / n'],
      },
      [['sizeof(arr)/sizeof(arr[0])', 'Number of elements in an array (only works where the array is declared, not on a pointer).']],
    ),
    lesson(
      'c-pointers',
      'Pointers',
      `
A **pointer** holds a memory **address**.

~~~c
int x = 10;
int *p = &x;      // & = address of x
*p = 20;          // * = dereference: write through the pointer
printf("%d\\n", x);   // 20

void swap(int *a, int *b) {      // pass addresses to modify the caller's variables
    int tmp = *a;
    *a = *b;
    *b = tmp;
}
swap(&x, &y);
~~~

Pointer arithmetic: \`p + 1\` points to the **next element** (it moves by \`sizeof(*p)\` bytes). That's how \`arr[i]\` works: it's \`*(arr + i)\`.
`,
      {
        prompt: 'Write `void swap(int *a, int *b)` and `void reverse(int *arr, int n)` (in place, using swap). Reverse `{1, 2, 3, 4, 5}` and print it as `5 4 3 2 1`.',
        starter: '#include <stdio.h>\n\nvoid swap(int *a, int *b) {\n}\n\nvoid reverse(int *arr, int n) {\n}\n\nint main(void) {\n    int nums[] = {1, 2, 3, 4, 5};\n    reverse(nums, 5);\n    for (int i = 0; i < 5; i++) printf("%d%s", nums[i], i < 4 ? " " : "\\n");\n    return 0;\n}\n',
        solution: '#include <stdio.h>\n\nvoid swap(int *a, int *b) {\n    int tmp = *a;\n    *a = *b;\n    *b = tmp;\n}\n\nvoid reverse(int *arr, int n) {\n    for (int i = 0; i < n / 2; i++) {\n        swap(&arr[i], &arr[n - 1 - i]);\n    }\n}\n\nint main(void) {\n    int nums[] = {1, 2, 3, 4, 5};\n    reverse(nums, 5);\n    for (int i = 0; i < 5; i++) printf("%d%s", nums[i], i < 4 ? " " : "\\n");\n    return 0;\n}\n',
        expected: '5 4 3 2 1',
        hints: ['swap: int tmp = *a; *a = *b; *b = tmp;', 'reverse: swap(&arr[i], &arr[n - 1 - i]) for i < n / 2'],
      },
      [['&x vs *p', '&x gives the address of x; *p reads/writes the value at the address p holds.']],
    ),
    lesson(
      'c-strings',
      'Strings & characters',
      `
C strings are **arrays of \`char\` ending with \`'\\0'\`** (the null terminator). The standard library (\`<string.h>\`, \`<ctype.h>\`) helps:

~~~c
char name[16] = "Ada";
size_t len = strlen(name);            // 3 (doesn't count '\\0')
strncpy(dest, src, sizeof dest - 1);  // bounded copy
if (strcmp(a, b) == 0) { }            // compare (== compares addresses!)
toupper(c); isdigit(c); isalpha(c);   // <ctype.h>
~~~

⚠️ Forgetting space for \`'\\0'\` or writing past the end are classic bugs. Modern C code uses bounded functions (\`snprintf\`, \`strncpy\`).
`,
      {
        prompt: 'Write `int count_vowels(const char *s)` and `void to_upper(char *s)` (in place). For `char text[] = "Hello World"` print `vowels=3`, then the upper-cased text.',
        starter: '#include <stdio.h>\n#include <ctype.h>\n#include <string.h>\n\nint count_vowels(const char *s) {\n    return 0;\n}\n\nvoid to_upper(char *s) {\n}\n\nint main(void) {\n    char text[] = "Hello World";\n    printf("vowels=%d\\n", count_vowels(text));\n    to_upper(text);\n    printf("%s\\n", text);\n    return 0;\n}\n',
        solution: '#include <stdio.h>\n#include <ctype.h>\n#include <string.h>\n\nint count_vowels(const char *s) {\n    int n = 0;\n    for (; *s; s++) {\n        if (strchr("aeiouAEIOU", *s)) n++;\n    }\n    return n;\n}\n\nvoid to_upper(char *s) {\n    for (; *s; s++) *s = (char)toupper((unsigned char)*s);\n}\n\nint main(void) {\n    char text[] = "Hello World";\n    printf("vowels=%d\\n", count_vowels(text));\n    to_upper(text);\n    printf("%s\\n", text);\n    return 0;\n}\n',
        expected: 'vowels=3\nHELLO WORLD',
        hints: ['Loop with a pointer until *s == \'\\0\': for (; *s; s++)', 'strchr("aeiouAEIOU", *s) is non-NULL for vowels.', '*s = toupper((unsigned char)*s)'],
      },
      [['C string terminator', "Strings end with '\\0'; strlen counts characters before it."]],
    ),
    lesson(
      'c-memory',
      'Structs & dynamic memory',
      `
**Structs** group data; **malloc/free** manage heap memory manually:

~~~c
#include <stdlib.h>

typedef struct {
    char name[32];
    int score;
} Player;

Player *players = malloc(3 * sizeof(Player));   // heap allocation
if (players == NULL) return 1;                   // always check!
players[0].score = 10;
Player *p = &players[0];
p->score += 5;                                   // -> accesses fields through a pointer
free(players);                                   // release, exactly once
players = NULL;
~~~

Every \`malloc\` needs exactly one \`free\`. Forgetting it leaks memory; freeing twice or using memory after \`free\` corrupts the program.
`,
      {
        prompt: 'Allocate an array of `n = 4` `Player` structs with `malloc`, fill scores with `i * 10 + 5` and names `P0`…`P3` (use `snprintf`), print the player with the highest score as `P3: 35`, then `free` the memory.',
        starter: '#include <stdio.h>\n#include <stdlib.h>\n\ntypedef struct {\n    char name[16];\n    int score;\n} Player;\n\nint main(void) {\n    int n = 4;\n    // malloc, fill, find best, print, free\n    (void)n;\n    return 0;\n}\n',
        solution: '#include <stdio.h>\n#include <stdlib.h>\n\ntypedef struct {\n    char name[16];\n    int score;\n} Player;\n\nint main(void) {\n    int n = 4;\n    Player *players = malloc(n * sizeof(Player));\n    if (players == NULL) return 1;\n    for (int i = 0; i < n; i++) {\n        snprintf(players[i].name, sizeof players[i].name, "P%d", i);\n        players[i].score = i * 10 + 5;\n    }\n    Player *best = &players[0];\n    for (int i = 1; i < n; i++) {\n        if (players[i].score > best->score) best = &players[i];\n    }\n    printf("%s: %d\\n", best->name, best->score);\n    free(players);\n    return 0;\n}\n',
        expected: 'P3: 35',
        hints: ['Player *players = malloc(n * sizeof(Player));', 'snprintf(players[i].name, sizeof players[i].name, "P%d", i);', 'Track a pointer to the best player; print with best->name.'],
      },
      [['malloc/free rule', 'Every successful malloc needs exactly one free; never use memory after freeing it.']],
    ),
    lesson(
      'c-project',
      '🛠️ Mini project: Stack data structure',
      `
Implement a classic **dynamic stack** that grows with \`realloc\`. This is how many language runtimes implement their call stacks and dynamic arrays.
`,
      {
        prompt: 'Complete `push`, `pop` and `stack_free` for a growable int stack (double the capacity when full). Run the script.',
        starter: '#include <stdio.h>\n#include <stdlib.h>\n\ntypedef struct {\n    int *data;\n    int size;\n    int capacity;\n} Stack;\n\nvoid push(Stack *s, int value) {\n}\n\nint pop(Stack *s) {\n    return -1;\n}\n\nvoid stack_free(Stack *s) {\n}\n\nint main(void) {\n    Stack s = {NULL, 0, 0};\n    for (int i = 1; i <= 10; i++) push(&s, i * i);\n    printf("size=%d capacity=%d\\n", s.size, s.capacity);\n    int a = pop(&s);\n    int b = pop(&s);\n    int c = pop(&s);\n    printf("%d %d %d\\n", a, b, c);\n    printf("size=%d\\n", s.size);\n    stack_free(&s);\n    return 0;\n}\n',
        solution: '#include <stdio.h>\n#include <stdlib.h>\n\ntypedef struct {\n    int *data;\n    int size;\n    int capacity;\n} Stack;\n\nvoid push(Stack *s, int value) {\n    if (s->size == s->capacity) {\n        int cap = s->capacity ? s->capacity * 2 : 4;\n        int *grown = realloc(s->data, cap * sizeof(int));\n        if (grown == NULL) exit(1);\n        s->data = grown;\n        s->capacity = cap;\n    }\n    s->data[s->size++] = value;\n}\n\nint pop(Stack *s) {\n    if (s->size == 0) return -1;\n    return s->data[--s->size];\n}\n\nvoid stack_free(Stack *s) {\n    free(s->data);\n    s->data = NULL;\n    s->size = s->capacity = 0;\n}\n\nint main(void) {\n    Stack s = {NULL, 0, 0};\n    for (int i = 1; i <= 10; i++) push(&s, i * i);\n    printf("size=%d capacity=%d\\n", s.size, s.capacity);\n    int a = pop(&s);\n    int b = pop(&s);\n    int c = pop(&s);\n    printf("%d %d %d\\n", a, b, c);\n    printf("size=%d\\n", s.size);\n    stack_free(&s);\n    return 0;\n}\n',
        expected: 'size=10 capacity=16\n100 81 64\nsize=7',
        hints: ['When size == capacity, realloc to double (start at 4).', 'pop returns s->data[--s->size].', 'Growing by doubling makes push O(1) on average (amortized).'],
      },
      [['realloc', 'Resizes a heap block, possibly moving it; always assign the result to a temporary and check for NULL.']],
      80,
    ),
  ],
});
