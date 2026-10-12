import { lesson, langTrack } from './helpers';

export const bash = langTrack({
  id: 'bash',
  title: 'Bash Scripting',
  icon: '🐚',
  color: '#4eaa25',
  lang: 'bash',
  blurb: 'Automate Linux servers, CI pipelines and everyday tasks. Every DevOps and security engineer writes Bash.',
  fields: ['DevOps & Cloud', 'Cybersecurity', 'Linux administration'],
  lessons: [
    lesson(
      'sh-vars',
      'Variables, quoting & arithmetic',
      `
~~~bash
#!/usr/bin/env bash
name="DevQuest"            # no spaces around =
count=3
echo "Hello, $name"         # double quotes expand variables
echo 'Hello, $name'         # single quotes are literal
echo "Next: $((count + 1))" # arithmetic expansion
files=$(ls | wc -l)         # command substitution
readonly MAX=10
echo "\${name,,}"            # lowercase (bash 4+); \${#name} = length
~~~

**Always quote variables** (\`"$file"\`) so values with spaces don't break into several arguments.

> ⚙️ Desktop app: runs with Bash on your computer (Git Bash on Windows). Elsewhere it's AI-checked.
`,
      {
        prompt: 'Set `app="backup"` and `days=7`. Print `backup runs every 7 days`, then the number of hours in those days (`168`), then the length of `app`.',
        starter: '#!/usr/bin/env bash\n# your code\n',
        solution: '#!/usr/bin/env bash\napp="backup"\ndays=7\necho "$app runs every $days days"\necho "$((days * 24))"\necho "\${#app}"\n',
        expected: 'backup runs every 7 days\n168\n6',
        hints: ['echo "$((days * 24))"', '\${#app} is the string length.'],
      },
      [['Bash quoting', '"double" quotes expand $vars; \'single\' quotes are literal. Quote variables to keep spaces intact.']],
    ),
    lesson(
      'sh-control',
      'Conditions & loops',
      `
~~~bash
if [[ -f "config.yml" ]]; then
  echo "found"
elif [[ $count -gt 5 ]]; then     # -eq -ne -lt -le -gt -ge for numbers
  echo "many"
else
  echo "none"
fi

for i in {1..3}; do echo "$i"; done
for f in *.log; do echo "processing $f"; done
while read -r line; do echo "$line"; done < input.txt

[[ "$name" == "admin" ]] && echo "hi admin"    # && / || chain on success / failure
~~~

\`[[ … ]]\` is Bash's safer test syntax. File tests: \`-f\` file, \`-d\` directory, \`-e\` exists, \`-z\` empty string.
`,
      {
        prompt: 'Loop over the numbers 1 to 10 and print only the even ones on one line separated by spaces (no trailing space), then print `sum=30`.',
        starter: '#!/usr/bin/env bash\nsum=0\n# your loop\n',
        solution: '#!/usr/bin/env bash\nsum=0\nevens=()\nfor i in {1..10}; do\n  if (( i % 2 == 0 )); then\n    evens+=("$i")\n    sum=$((sum + i))\n  fi\ndone\necho "\${evens[*]}"\necho "sum=$sum"\n',
        expected: '2 4 6 8 10\nsum=30',
        hints: ['(( i % 2 == 0 )) is an arithmetic test.', 'Collect into an array evens+=("$i") and print "\${evens[*]}".'],
      },
      [['[[ ]] vs (( ))', '[[ ]] tests strings/files; (( )) evaluates arithmetic expressions.']],
    ),
    lesson(
      'sh-functions',
      'Functions, arguments & exit codes',
      `
~~~bash
greet() {
  local name="\${1:-world}"     # $1 = first argument, with a default
  echo "Hello, $name"
}
greet Ada                       # Hello, Ada

is_even() {
  (( $1 % 2 == 0 ))             # return status = result of the last command
}
if is_even 4; then echo "even"; fi

echo "$#"    # number of script arguments;  "$@" = all arguments
exit 1       # non-zero = failure (CI pipelines stop on it)
~~~

Functions **return exit codes** (0 = success), not values. To "return" text, \`echo\` it and capture with \`$(...)\`.
`,
      {
        prompt: 'Write `max()` that echoes the largest of its arguments (any count), and `is_port_valid()` that succeeds for 1–65535. Print `max 4 19 7`, then `valid` or `invalid` for 8080 and 70000.',
        starter: '#!/usr/bin/env bash\nmax() {\n  :\n}\n\nis_port_valid() {\n  return 1\n}\n\nmax 4 19 7\nfor p in 8080 70000; do\n  # print valid or invalid\n  :\ndone\n',
        solution: '#!/usr/bin/env bash\nmax() {\n  local best=$1\n  for n in "$@"; do\n    (( n > best )) && best=$n\n  done\n  echo "$best"\n}\n\nis_port_valid() {\n  (( $1 >= 1 && $1 <= 65535 ))\n}\n\nmax 4 19 7\nfor p in 8080 70000; do\n  if is_port_valid "$p"; then echo valid; else echo invalid; fi\ndone\n',
        expected: '19\nvalid\ninvalid',
        hints: ['Loop over "$@" and keep the largest.', 'is_port_valid can be just (( $1 >= 1 && $1 <= 65535 )).'],
      },
      [['$@ vs $*', '"$@" expands to each argument as a separate word (use this); "$*" joins them into one string.']],
    ),
    lesson(
      'sh-text',
      'Text processing pipelines',
      `
Bash shines when combined with Unix tools:

~~~bash
grep -c "ERROR" app.log                     # count matching lines
cut -d',' -f2 data.csv                      # second column
sort | uniq -c | sort -rn                   # frequency count, most common first
awk -F',' '{ sum += $3 } END { print sum }' sales.csv
sed 's/foo/bar/g' file.txt                  # find and replace
tr '[:lower:]' '[:upper:]'                  # change case
~~~

A "here document" feeds multi-line text into a command:

~~~bash
cat <<'EOF' | grep -v '^#'
# comment
real line
EOF
~~~
`,
      {
        prompt: 'Using a pipeline on the heredoc log, print how many lines contain `ERROR`, then print the unique services that had errors (the 2nd field), sorted, one per line.',
        starter: '#!/usr/bin/env bash\nlog=$(cat <<\'EOF\'\n10:00 api INFO started\n10:01 db ERROR timeout\n10:02 api ERROR 500\n10:03 web INFO ok\n10:04 db ERROR timeout\nEOF\n)\n# your pipelines (use: echo "$log" | ...)\n',
        solution: '#!/usr/bin/env bash\nlog=$(cat <<\'EOF\'\n10:00 api INFO started\n10:01 db ERROR timeout\n10:02 api ERROR 500\n10:03 web INFO ok\n10:04 db ERROR timeout\nEOF\n)\necho "$log" | grep -c "ERROR"\necho "$log" | grep "ERROR" | awk \'{ print $2 }\' | sort -u\n',
        expected: '3\napi\ndb',
        hints: ['echo "$log" | grep -c "ERROR"', 'grep "ERROR" | awk \'{ print $2 }\' | sort -u'],
      },
      [['sort | uniq -c', 'Classic pipeline to count occurrences of each line; add sort -rn to rank them.']],
    ),
    lesson(
      'sh-arrays',
      'Arrays & associative arrays',
      `
~~~bash
servers=("web1" "web2" "db1")
servers+=("cache1")
echo "\${servers[0]}"        # web1
echo "\${#servers[@]}"       # 4 items
for s in "\${servers[@]}"; do echo "$s"; done

declare -A owner            # associative array (bash 4+)
owner[web]="alice"
owner[db]="bob"
for k in "\${!owner[@]}"; do echo "$k -> \${owner[$k]}"; done   # keys (unordered)
~~~
`,
      {
        prompt: 'Build an associative array `ports` with `web=80`, `ssh=22`, `db=5432`. Print each `service:port` sorted by service name, then the total number of services.',
        starter: '#!/usr/bin/env bash\ndeclare -A ports\n# fill and print sorted\n',
        solution: '#!/usr/bin/env bash\ndeclare -A ports\nports[web]=80\nports[ssh]=22\nports[db]=5432\nfor svc in $(printf \'%s\\n\' "\${!ports[@]}" | sort); do\n  echo "$svc:\${ports[$svc]}"\ndone\necho "\${#ports[@]}"\n',
        expected: 'db:5432\nssh:22\nweb:80\n3',
        hints: ['Keys: "\${!ports[@]}" (unordered) → pipe through sort.', '\${#ports[@]} is the number of entries.'],
      },
      [['Bash array syntax', '"\${arr[@]}" all items, \${#arr[@]} count, \${!arr[@]} keys/indexes.']],
    ),
    lesson(
      'sh-project',
      '🛠️ Mini project: Disk report script',
      `
A typical ops script: parse command output, apply thresholds and report. Here the "df" output is simulated so it's reproducible anywhere.
`,
      {
        prompt: 'Parse the simulated `df` output (skip the header). For each filesystem whose use% is ≥ 80, print `WARN /path 91%`. Finally print `checked 4, warnings 2`.',
        starter: '#!/usr/bin/env bash\ndf_output=$(cat <<\'EOF\'\nFilesystem Size Used Use% Mounted\n/dev/sda1 50G 45G 91% /\n/dev/sdb1 200G 60G 30% /data\n/dev/sdc1 100G 80G 80% /var\n/dev/sdd1 20G 2G 10% /boot\nEOF\n)\n# your code\n',
        solution: '#!/usr/bin/env bash\ndf_output=$(cat <<\'EOF\'\nFilesystem Size Used Use% Mounted\n/dev/sda1 50G 45G 91% /\n/dev/sdb1 200G 60G 30% /data\n/dev/sdc1 100G 80G 80% /var\n/dev/sdd1 20G 2G 10% /boot\nEOF\n)\nchecked=0\nwarnings=0\nwhile read -r fs size used pct mount; do\n  checked=$((checked + 1))\n  if (( \${pct%\\%} >= 80 )); then\n    echo "WARN $mount $pct"\n    warnings=$((warnings + 1))\n  fi\ndone < <(echo "$df_output" | tail -n +2)\necho "checked $checked, warnings $warnings"\n',
        expected: 'WARN / 91%\nWARN /var 80%\nchecked 4, warnings 2',
        hints: ['while read -r fs size used pct mount; do … done < <(echo "$df_output" | tail -n +2)', '\${pct%\\%} strips the trailing %.'],
      },
      [['Process substitution <( )', 'Feeds a command\'s output as a file, e.g. while read …; done < <(cmd) keeps variables in the current shell.']],
      80,
    ),
  ],
});
