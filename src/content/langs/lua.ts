import { lesson, langTrack } from './helpers';

export const lua = langTrack({
  id: 'lua',
  title: 'Lua',
  icon: '🌙',
  color: '#2c2d72',
  lang: 'lua',
  blurb: 'A tiny, fast scripting language embedded in games and apps: Roblox (Luau), World of Warcraft, LÖVE, Neovim.',
  fields: ['Game scripting', 'Embedded scripting', 'Modding'],
  lessons: [
    lesson(
      'lua-basics',
      'Hello, Lua',
      `
~~~lua
local name = "Lua"           -- local variables (always use local)
local version = 5.4
local isFun = true
print("Hello from " .. name)  -- .. concatenates strings
print(name, version)          -- print separates values with tabs
print(#name)                  -- # = length → 3
print(10 / 4, 10 // 4)        -- 2.5  2  (// = floor division)
~~~

Lua is **dynamically typed** and tiny (the whole interpreter is ~250 KB), so it's easy to embed. Games expose their engine to Lua so designers can script behaviour without recompiling.

> ⚡ Lua runs right here in DevQuest.
`,
      {
        prompt: 'Create `local player = "Hero"` and `local hp = 100`. Subtract 35 from `hp`, then print `Hero has 65 HP` using `..`, and on the next line print the length of `player`.',
        starter: '-- your code\n',
        solution: 'local player = "Hero"\nlocal hp = 100\nhp = hp - 35\nprint(player .. " has " .. hp .. " HP")\nprint(#player)\n',
        expected: 'Hero has 65 HP\n4',
        hints: ['hp = hp - 35 (Lua has no -= operator)', 'print(player .. " has " .. hp .. " HP")'],
      },
      [['Lua string concatenation', 'Use .. to join strings: "a" .. "b".']],
    ),
    lesson(
      'lua-control',
      'Conditions & loops',
      `
~~~lua
local score = 72
if score >= 90 then
  print("A")
elseif score >= 70 then
  print("B")
else
  print("C")
end

for i = 1, 5 do print(i) end          -- 1..5 inclusive
for i = 10, 1, -3 do print(i) end     -- step
while score > 0 do score = score - 50 end
repeat score = score + 1 until score >= 0
~~~

Only \`nil\` and \`false\` are falsy. **\`0\` and \`""\` are true** in Lua! Not-equal is \`~=\`.
`,
      {
        prompt: 'Print the numbers 1 to 15 with `Fizz`, `Buzz` and `FizzBuzz` substitutions, one per line.',
        starter: 'for i = 1, 15 do\n  -- your code\nend\n',
        solution: 'for i = 1, 15 do\n  if i % 15 == 0 then\n    print("FizzBuzz")\n  elseif i % 3 == 0 then\n    print("Fizz")\n  elseif i % 5 == 0 then\n    print("Buzz")\n  else\n    print(i)\n  end\nend\n',
        expected: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz',
        hints: ['if i % 15 == 0 then … elseif … else … end'],
      },
      [['Lua truthiness', 'Only nil and false are falsy; 0 and "" are truthy.']],
    ),
    lesson(
      'lua-tables',
      'Tables: arrays & dictionaries',
      `
Lua has exactly **one** data structure, the **table**. It works as an array, a dictionary, an object and a module:

~~~lua
local items = {"sword", "shield", "potion"}   -- array part (1-indexed!)
print(items[1], #items)                        -- sword  3
table.insert(items, "bow")
for i, item in ipairs(items) do print(i, item) end   -- ordered

local stats = {hp = 100, mana = 40}            -- dictionary part
stats.speed = 5
for key, value in pairs(stats) do print(key, value) end   -- unordered!
~~~
`,
      {
        prompt: 'Given the `loot` array, count each item into a table `counts`, then print each item and its count sorted alphabetically as `gold: 3`.',
        starter: 'local loot = {"gold", "gem", "gold", "potion", "gold", "gem"}\nlocal counts = {}\n-- count, then print sorted\n',
        solution: 'local loot = {"gold", "gem", "gold", "potion", "gold", "gem"}\nlocal counts = {}\nfor _, item in ipairs(loot) do\n  counts[item] = (counts[item] or 0) + 1\nend\nlocal names = {}\nfor name in pairs(counts) do table.insert(names, name) end\ntable.sort(names)\nfor _, name in ipairs(names) do\n  print(name .. ": " .. counts[name])\nend\n',
        expected: 'gem: 2\ngold: 3\npotion: 1',
        hints: ['counts[item] = (counts[item] or 0) + 1', 'pairs order is random: collect keys, table.sort, then print.'],
      },
      [['ipairs vs pairs', 'ipairs walks the array part 1..n in order; pairs walks all keys in no particular order.']],
    ),
    lesson(
      'lua-functions',
      'Functions & closures',
      `
Functions are first-class values and can return **multiple values**:

~~~lua
local function minmax(t)
  local lo, hi = math.huge, -math.huge
  for _, v in ipairs(t) do lo = math.min(lo, v); hi = math.max(hi, v) end
  return lo, hi
end
local a, b = minmax({4, 9, 1})

local function counter()           -- closure: remembers n
  local n = 0
  return function() n = n + 1; return n end
end
local next = counter()
print(next(), next())              -- 1  2
~~~
`,
      {
        prompt: 'Write `makeCooldown(seconds)` that returns a function `ready(now)` which returns `true` (and starts the cooldown) if at least `seconds` have passed since it last returned true, else `false`. Print the results for the calls in the script.',
        starter: 'local function makeCooldown(seconds)\n  -- return a function(now) ... end\nend\n\nlocal fireball = makeCooldown(3)\nfor _, t in ipairs({0, 1, 3, 4, 7}) do\n  print(t, fireball(t))\nend\n',
        solution: 'local function makeCooldown(seconds)\n  local last = nil\n  return function(now)\n    if last == nil or now - last >= seconds then\n      last = now\n      return true\n    end\n    return false\n  end\nend\n\nlocal fireball = makeCooldown(3)\nfor _, t in ipairs({0, 1, 3, 4, 7}) do\n  print(t, fireball(t))\nend\n',
        expected: '0\ttrue\n1\tfalse\n3\ttrue\n4\tfalse\n7\ttrue',
        hints: ['Keep local last = nil inside makeCooldown.', 'Return true and set last = now when last == nil or now - last >= seconds.'],
      },
      [['Lua closure', 'A function that captures local variables from where it was created, keeping them alive.']],
    ),
    lesson(
      'lua-oop',
      'Objects with metatables',
      `
Lua builds objects from tables plus **metatables**. \`__index\` makes missing fields fall back to a "class" table:

~~~lua
local Enemy = {}
Enemy.__index = Enemy

function Enemy.new(name, hp)
  local self = setmetatable({}, Enemy)
  self.name, self.hp = name, hp
  return self
end

function Enemy:hit(dmg)            -- : passes self automatically
  self.hp = math.max(0, self.hp - dmg)
end

local orc = Enemy.new("Orc", 30)
orc:hit(12)                        -- same as Enemy.hit(orc, 12)
~~~
`,
      {
        prompt: 'Create a `Player` "class" with `Player.new(name)` (starting `xp = 0`, `level = 1`) and a method `Player:gain(xp)` that levels up every 100 xp (keep the remainder). Run the script.',
        starter: 'local Player = {}\nPlayer.__index = Player\n\n-- Player.new and Player:gain\n\nlocal p = Player.new("Ada")\np:gain(70)\np:gain(80)\nprint(p.name, p.level, p.xp)\np:gain(250)\nprint(p.name, p.level, p.xp)\n',
        solution: 'local Player = {}\nPlayer.__index = Player\n\nfunction Player.new(name)\n  return setmetatable({ name = name, xp = 0, level = 1 }, Player)\nend\n\nfunction Player:gain(xp)\n  self.xp = self.xp + xp\n  while self.xp >= 100 do\n    self.xp = self.xp - 100\n    self.level = self.level + 1\n  end\nend\n\nlocal p = Player.new("Ada")\np:gain(70)\np:gain(80)\nprint(p.name, p.level, p.xp)\np:gain(250)\nprint(p.name, p.level, p.xp)\n',
        expected: 'Ada\t2\t50\nAda\t5\t0',
        hints: ['return setmetatable({ name = name, xp = 0, level = 1 }, Player)', 'In gain, loop while self.xp >= 100.'],
      },
      [['Lua metatable __index', 'When a field is missing, Lua looks it up in the __index table: the basis of Lua classes.']],
    ),
    lesson(
      'lua-project',
      '🛠️ Mini project: Game event system',
      `
Games coordinate many systems with **events**: "player died" triggers sound, UI and achievements. Build a tiny event bus in Lua.
`,
      {
        prompt: 'Implement `Events.on(name, fn)` and `Events.emit(name, ...)` (calls handlers in the order they were registered, passing the arguments). Run the script.',
        starter: 'local Events = { handlers = {} }\n\nfunction Events.on(name, fn)\nend\n\nfunction Events.emit(name, ...)\nend\n\nlocal score = 0\nEvents.on("coin", function(value) score = score + value end)\nEvents.on("coin", function(value) print("ding +" .. value) end)\nEvents.on("die", function(who) print(who .. " was defeated") end)\nEvents.emit("coin", 10)\nEvents.emit("coin", 5)\nEvents.emit("die", "Hero")\nEvents.emit("unknown")\nprint("score", score)\n',
        solution: 'local Events = { handlers = {} }\n\nfunction Events.on(name, fn)\n  Events.handlers[name] = Events.handlers[name] or {}\n  table.insert(Events.handlers[name], fn)\nend\n\nfunction Events.emit(name, ...)\n  for _, fn in ipairs(Events.handlers[name] or {}) do\n    fn(...)\n  end\nend\n\nlocal score = 0\nEvents.on("coin", function(value) score = score + value end)\nEvents.on("coin", function(value) print("ding +" .. value) end)\nEvents.on("die", function(who) print(who .. " was defeated") end)\nEvents.emit("coin", 10)\nEvents.emit("coin", 5)\nEvents.emit("die", "Hero")\nEvents.emit("unknown")\nprint("score", score)\n',
        expected: 'ding +10\nding +5\nHero was defeated\nscore\t15',
        hints: ['Store a list of functions per event name.', 'emit: for _, fn in ipairs(Events.handlers[name] or {}) do fn(...) end'],
      },
      [],
      80,
    ),
  ],
});
