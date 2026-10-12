import type { Track } from './types';
import { HOME } from '../engine/shell';

const usedCmd = (last: string, cmd: string) => last.trim().split(/\s+/)[0] === cmd || last.includes(`| ${cmd}`) || last.includes(`|${cmd}`);

export const shell: Track = {
  id: 'shell',
  title: 'Terminal & Shell',
  icon: '🐚',
  tier: 2,
  color: '#f59e0b',
  blurb: 'Master the command line: navigate, manipulate files, search, pipe and script, on any OS.',
  depth: 'full',
  lessons: [
    {
      id: 'sh-intro',
      title: 'What is a shell?',
      xp: 30,
      body: `
A **terminal** is the window; a **shell** is the program inside it that reads your commands, runs them, and prints results. This loop is called a **REPL**: *Read → Evaluate → Print → Loop*.

{{ill:shell}}

| OS | Common shells |
|---|---|
| Linux | **bash** (default on most), zsh, fish |
| macOS | **zsh** (default since 2019), bash |
| Windows | **PowerShell**, cmd.exe, plus bash via WSL or Git Bash |

**Why developers live in the terminal:** it's faster than clicking for repetitive work, it's scriptable (automate anything), and servers usually have *no* graphical interface, only SSH + a shell.

**Anatomy of a command:**

~~~bash
ls  -l  -a  /home/dev
│   └─flags─┘  └argument┘
command
~~~

- **Flags/options** change behavior (\`-l\` = long format). Short flags can combine: \`-la\`.
- **Arguments** tell the command what to act on.
- Need help? \`man ls\` (manual), \`ls --help\`, or on Windows \`Get-Help Get-ChildItem\`.

In the next lessons you'll practise in a **safe simulated Linux terminal**. Nothing you type can hurt your real computer.
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'What is the default shell on modern macOS?', options: ['bash', 'zsh', 'PowerShell', 'fish'], answer: 1 },
          { q: 'In `ls -la /tmp`, what is `-la`?', options: ['The command', 'Flags (options)', 'The argument', 'A file'], answer: 1 },
          { q: 'How do you read the manual for a command on Linux?', options: ['help me', 'man <command>', 'docs <command>', '?<command>'], answer: 1 },
        ],
      },
      cards: [{ front: 'Terminal vs shell', back: 'Terminal = the window/emulator. Shell = the program that interprets commands (bash, zsh, PowerShell).' }],
    },
    {
      id: 'sh-nav',
      title: 'Navigating: pwd, ls, cd',
      xp: 45,
      body: `
The filesystem is a **tree** of directories (folders). On Linux/macOS it starts at the **root** \`/\`. Windows has a tree per drive (\`C:\\\`).

{{ill:filetree}}

| Command | Meaning |
|---|---|
| \`pwd\` | **p**rint **w**orking **d**irectory: where am I? |
| \`ls\` | list files. \`ls -l\` details, \`ls -a\` include hidden (dot) files |
| \`cd dir\` | change directory |
| \`cd ..\` | go up one level |
| \`cd ~\` or \`cd\` | go home |
| \`cd -\` | go back to the previous directory |

**Absolute paths** start from root: \`/home/dev/projects\`. **Relative paths** start from where you are: \`projects/app\`. \`.\` means "here", \`..\` means "parent".

💡 Press **Tab** to auto-complete names and **↑** to recall previous commands (works in this terminal too!).
`,
      exercise: {
        kind: 'terminal',
        prompt: 'Explore the filesystem. Complete each mission in order.',
        setup: (sh) => {
          sh.mkdirp(`${HOME}/projects/game/assets`);
          sh.mkdirp(`${HOME}/projects/website`);
          sh.write(`${HOME}/projects/game/main.py`, 'print("game")\n');
          sh.write(`${HOME}/.secret`, 'you found the hidden file!\n');
        },
        missions: [
          { task: 'Print your current directory', hint: 'pwd', check: (_, l) => usedCmd(l, 'pwd') },
          { task: 'List all files, including hidden ones', hint: 'ls -a', check: (_, l) => usedCmd(l, 'ls') && /-\w*a/.test(l) },
          { task: 'Move into projects/game', hint: 'cd projects/game', check: (sh) => sh.cwd === `${HOME}/projects/game` },
          { task: 'Go up one level (to projects)', hint: 'cd ..', check: (sh) => sh.cwd === `${HOME}/projects` },
          { task: 'Jump straight to /home/dev/projects/game/assets using an absolute path', hint: 'cd /home/dev/projects/game/assets', check: (sh, l) => sh.cwd === `${HOME}/projects/game/assets` && l.includes('/home/dev') },
          { task: 'Go back home', hint: 'cd ~   (or just cd)', check: (sh) => sh.cwd === HOME },
        ],
      },
      cards: [
        { front: 'pwd', back: 'Print working directory (where am I?)' },
        { front: 'cd - ', back: 'Go back to the previous directory.' },
        { front: 'Absolute vs relative path', back: 'Absolute starts at / (root). Relative starts at the current directory.' },
      ],
    },
    {
      id: 'sh-files',
      title: 'Files & folders: mkdir, touch, cp, mv, rm',
      xp: 50,
      body: `
| Command | Does |
|---|---|
| \`mkdir name\` | make a directory (\`-p\` creates parents too: \`mkdir -p a/b/c\`) |
| \`touch file\` | create an empty file (or update its timestamp) |
| \`cp src dest\` | copy (\`-r\` for directories) |
| \`mv src dest\` | move **or rename** |
| \`rm file\` | remove a file (\`-r\` for directories) |
| \`echo "hi" > f.txt\` | write text to a file (overwrite) |
| \`echo "more" >> f.txt\` | append |

⚠️ **There is no recycle bin in the shell.** \`rm\` deletes immediately. The infamous \`rm -rf /\` would erase an entire system. Always double-check paths before \`rm -r\`.

**Windows PowerShell equivalents:** \`New-Item\`, \`Copy-Item\` (\`cp\`), \`Move-Item\` (\`mv\`), \`Remove-Item\` (\`rm\`). PowerShell defines Unix-style aliases, so \`ls\`, \`cp\`, \`mv\`, \`rm\` mostly work there too!
`,
      exercise: {
        kind: 'terminal',
        prompt: 'Set up a new project folder structure.',
        missions: [
          { task: 'Create the directory structure app/src (one command)', hint: 'mkdir -p app/src', check: (sh) => sh.isDir(`${HOME}/app/src`) },
          { task: 'Create an empty file app/src/main.py', hint: 'touch app/src/main.py', check: (sh) => sh.isFile(`${HOME}/app/src/main.py`) },
          { task: 'Write the text "# My App" into app/README.md', hint: 'echo "# My App" > app/README.md', check: (sh) => sh.isFile(`${HOME}/app/README.md`) && sh.read(`${HOME}/app/README.md`).includes('# My App') },
          { task: 'Copy app/README.md to app/README.bak', hint: 'cp app/README.md app/README.bak', check: (sh) => sh.isFile(`${HOME}/app/README.bak`) },
          { task: 'Rename app/src/main.py to app/src/app.py', hint: 'mv app/src/main.py app/src/app.py', check: (sh) => sh.isFile(`${HOME}/app/src/app.py`) && !sh.exists(`${HOME}/app/src/main.py`) },
          { task: 'Delete the backup file app/README.bak', hint: 'rm app/README.bak', check: (sh) => !sh.exists(`${HOME}/app/README.bak`) && sh.isFile(`${HOME}/app/README.md`) },
        ],
      },
      cards: [
        { front: 'mkdir -p a/b/c', back: 'Create nested directories, including missing parents.' },
        { front: '> vs >>', back: '> overwrites a file; >> appends to it.' },
      ],
    },
    {
      id: 'sh-read',
      title: 'Reading files: cat, head, tail, wc',
      xp: 45,
      body: `
| Command | Does |
|---|---|
| \`cat file\` | print the whole file (con**cat**enate: \`cat a b\` joins files) |
| \`head -n 5 file\` | first 5 lines |
| \`tail -n 5 file\` | last 5 lines. \`tail -f log\` **follows** a growing log live |
| \`wc -l file\` | count lines (\`wc\` alone: lines, words, chars) |
| \`less file\` | scroll through big files (q to quit) |
| \`sort\`, \`uniq\` | sort lines, remove adjacent duplicates |

On Windows PowerShell: \`Get-Content file\` (alias \`cat\`/\`type\`), \`Get-Content file -Head 5\` / \`-Tail 5\`, \`(Get-Content file).Count\`.

These are the tools you use to inspect **log files** on servers, which is half of debugging production issues.
`,
      exercise: {
        kind: 'terminal',
        prompt: 'A server log needs investigating.',
        setup: (sh) => {
          const lines = [];
          for (let i = 1; i <= 30; i++) lines.push(`2026-10-11 12:${String(i).padStart(2, '0')} ${i % 7 === 0 ? 'ERROR' : 'INFO'} request #${i} ${i % 7 === 0 ? 'failed: timeout' : 'ok'}`);
          sh.write(`${HOME}/server.log`, lines.join('\n') + '\n');
        },
        missions: [
          { task: 'Show the first 5 lines of server.log', hint: 'head -n 5 server.log', check: (_, l) => usedCmd(l, 'head') && l.includes('5') },
          { task: 'Show the last 3 lines of server.log', hint: 'tail -n 3 server.log', check: (_, l) => usedCmd(l, 'tail') && l.includes('3') },
          { task: 'Count how many lines server.log has', hint: 'wc -l server.log', check: (_, l) => usedCmd(l, 'wc') },
          { task: 'Print the whole file with cat', hint: 'cat server.log', check: (_, l) => usedCmd(l, 'cat') && l.includes('server.log') },
        ],
      },
      cards: [{ front: 'tail -f', back: 'Follow a file: keep printing new lines as they are written (live logs).' }],
    },
    {
      id: 'sh-search',
      title: 'Searching: grep & find',
      xp: 50,
      body: `
**grep** searches *inside* files for lines matching a pattern (a **regular expression**):

~~~bash
grep ERROR server.log         # lines containing ERROR
grep -i error server.log      # case-insensitive
grep -n TODO main.py          # show line numbers
grep -c ERROR server.log      # count matching lines
grep -r "api_key" .           # search recursively in a folder
~~~

**find** searches for *files* by name, type, size, date…

~~~bash
find . -name "*.py"           # all Python files below here
find . -type d                # only directories
find /var/log -size +10M      # files bigger than 10 MB
~~~

| Linux/macOS | Windows PowerShell | Windows cmd |
|---|---|---|
| \`grep ERROR f\` | \`Select-String ERROR f\` (alias \`sls\`) | \`findstr ERROR f\` |
| \`find . -name "*.py"\` | \`Get-ChildItem -Recurse -Filter *.py\` | \`dir /s *.py\` |

💡 Modern faster alternatives: **ripgrep** (\`rg\`) and **fd**.
`,
      exercise: {
        kind: 'terminal',
        prompt: 'Find what you need in a messy codebase.',
        setup: (sh) => {
          sh.mkdirp(`${HOME}/code/api`);
          sh.mkdirp(`${HOME}/code/web`);
          sh.write(`${HOME}/code/api/server.py`, 'import os\n# TODO: add auth\ndef handler():\n    return 200\n# TODO: logging\n');
          sh.write(`${HOME}/code/api/db.py`, 'def connect():\n    pass\n');
          sh.write(`${HOME}/code/web/app.js`, '// TODO: dark mode\nconsole.log("hi")\n');
          sh.write(`${HOME}/code/notes.txt`, 'remember the TODOs\n');
        },
        missions: [
          { task: 'Find all .py files inside code/', hint: 'find code -name "*.py"', check: (_, l) => usedCmd(l, 'find') && l.includes('*.py') },
          { task: 'Show lines containing TODO in code/api/server.py, with line numbers', hint: 'grep -n TODO code/api/server.py', check: (_, l) => usedCmd(l, 'grep') && /-\w*n/.test(l) && l.includes('TODO') },
          { task: 'Count the TODO lines in code/api/server.py', hint: 'grep -c TODO code/api/server.py', check: (_, l) => usedCmd(l, 'grep') && /-\w*c/.test(l) },
          { task: 'List only directories under code/', hint: 'find code -type d', check: (_, l) => usedCmd(l, 'find') && l.includes('-type d') },
        ],
      },
      cards: [
        { front: 'grep -rn "x" .', back: 'Recursively search for "x" in all files below here, showing line numbers.' },
        { front: 'PowerShell equivalent of grep', back: 'Select-String (alias sls)' },
      ],
    },
    {
      id: 'sh-pipes',
      title: 'Pipes & redirection',
      xp: 55,
      body: `
The Unix philosophy: **small tools that do one thing well, combined together**. The pipe \`|\` sends one command's output into the next command's input.

{{ill:pipes}}

~~~bash
cat server.log | grep ERROR | wc -l       # how many errors?
history | grep git                        # which git commands did I run?
cat names.txt | sort | uniq               # unique sorted names
ls -l | sort -r | head -n 3
~~~

**Redirection** sends output to files:

| Syntax | Meaning |
|---|---|
| \`cmd > file\` | stdout to file (overwrite) |
| \`cmd >> file\` | stdout appended to file |
| \`cmd < file\` | read stdin from file |
| \`cmd 2> err.txt\` | stderr (errors) to file |
| \`cmd > out.txt 2>&1\` | both stdout and stderr to file |
| \`cmd1 && cmd2\` | run cmd2 only if cmd1 succeeded |
| \`cmd1 ; cmd2\` | run both, regardless |

Every process has 3 standard streams: **stdin (0)**, **stdout (1)**, **stderr (2)**.

PowerShell pipes **objects**, not text: \`Get-Process | Sort-Object CPU -Descending | Select-Object -First 5\`.
`,
      exercise: {
        kind: 'terminal',
        prompt: 'Analyse a log using pipelines.',
        setup: (sh) => {
          sh.write(`${HOME}/access.log`, ['alice GET /home', 'bob GET /login', 'alice POST /buy', 'carol GET /home', 'bob GET /home', 'alice GET /logout', 'dave ERROR /buy', 'carol ERROR /home'].join('\n') + '\n');
          sh.write(`${HOME}/users.txt`, 'carol\nalice\nbob\nalice\nbob\ndave\n');
        },
        missions: [
          { task: 'Use a pipe to count the ERROR lines in access.log', hint: 'cat access.log | grep ERROR | wc -l   (or grep ERROR access.log | wc -l)', check: (_, l) => l.includes('|') && l.includes('ERROR') && l.includes('wc') },
          { task: 'Print the sorted, unique list of users from users.txt', hint: 'sort users.txt | uniq', check: (_, l) => l.includes('sort') && l.includes('uniq') && l.includes('|') },
          { task: 'Save all lines with "alice" from access.log into alice.txt', hint: 'grep alice access.log > alice.txt', check: (sh) => sh.isFile(`${HOME}/alice.txt`) && sh.read(`${HOME}/alice.txt`).split('\n').filter(Boolean).length === 3 },
          { task: 'Append the line "reviewed" to alice.txt', hint: 'echo reviewed >> alice.txt', check: (sh) => sh.isFile(`${HOME}/alice.txt`) && sh.read(`${HOME}/alice.txt`).includes('reviewed') && sh.read(`${HOME}/alice.txt`).includes('alice') },
        ],
      },
      cards: [
        { front: 'The three standard streams', back: 'stdin (0), stdout (1), stderr (2)' },
        { front: '2>&1', back: 'Redirect stderr to wherever stdout currently goes.' },
      ],
    },
    {
      id: 'sh-perms',
      title: 'Permissions & users',
      xp: 50,
      body: `
Linux is multi-user. Every file has an **owner**, a **group**, and permission bits for three audiences: **user (u)**, **group (g)**, **others (o)**.

{{ill:permissions}}

Each audience gets **r** (read = 4), **w** (write = 2), **x** (execute = 1). Add them up for **octal** notation:

| Octal | Symbolic | Typical use |
|---|---|---|
| \`755\` | rwxr-xr-x | scripts, programs, directories |
| \`644\` | rw-r--r-- | normal files |
| \`600\` | rw------- | private keys, secrets |
| \`777\` | rwxrwxrwx | ⚠️ almost never: anyone can modify |

~~~bash
chmod +x deploy.sh     # make executable
chmod 600 id_rsa       # private key: owner only
chown alice file       # change owner
sudo apt update        # run as administrator (root)
~~~

**sudo** = "superuser do": run one command as root. Be careful with it. On Windows the equivalent is *Run as Administrator* and permissions are managed with ACLs (\`icacls\`, \`Get-Acl\`).
`,
      exercise: {
        kind: 'terminal',
        prompt: 'Fix the permissions on a deployment folder.',
        setup: (sh) => {
          sh.mkdirp(`${HOME}/deploy`);
          sh.write(`${HOME}/deploy/run.sh`, '#!/bin/bash\necho deploying\n');
          sh.write(`${HOME}/deploy/secret.key`, 'TOPSECRET\n');
        },
        missions: [
          { task: 'View the long listing of deploy/ to see permissions', hint: 'ls -l deploy', check: (_, l) => usedCmd(l, 'ls') && /-\w*l/.test(l) },
          { task: 'Make deploy/run.sh executable', hint: 'chmod +x deploy/run.sh   (or chmod 755 deploy/run.sh)', check: (sh) => (sh.perms[`${HOME}/deploy/run.sh`] ?? '').includes('x') },
          { task: 'Make deploy/secret.key readable and writable only by you (600)', hint: 'chmod 600 deploy/secret.key', check: (sh) => sh.perms[`${HOME}/deploy/secret.key`] === '-rw-------' },
        ],
      },
      cards: [
        { front: 'chmod 755', back: 'rwxr-xr-x: owner full, group & others read+execute.' },
        { front: 'r / w / x values', back: 'r = 4, w = 2, x = 1' },
      ],
    },
    {
      id: 'sh-system',
      title: 'Processes, networking & system commands',
      xp: 45,
      body: `
A running program is a **process**, with a unique **PID**. These commands are essential for day-to-day dev and ops work. Open the **Command Atlas** (sidebar) for the full cross-platform reference.

**Processes**

| Task | Linux / macOS | Windows PowerShell |
|---|---|---|
| List processes | \`ps aux\` | \`Get-Process\` |
| Live monitor | \`top\` / \`htop\` | Task Manager / \`Get-Process \\| Sort CPU\` |
| Kill by PID | \`kill 1234\` (\`-9\` to force) | \`Stop-Process -Id 1234\` |
| Kill by name | \`pkill node\` | \`Stop-Process -Name node\` |
| Run in background | \`cmd &\` | \`Start-Job { cmd }\` |

**Networking**

| Task | Linux / macOS | Windows |
|---|---|---|
| IP addresses | \`ip a\` / \`ifconfig\` | \`ipconfig\` |
| Reachable? | \`ping host\` | \`ping host\` / \`Test-Connection\` |
| HTTP request | \`curl https://...\` | \`curl.exe\` / \`Invoke-WebRequest\` |
| Open ports | \`ss -tulpn\` | \`netstat -ano\` |
| DNS lookup | \`dig\` / \`nslookup\` | \`nslookup\` / \`Resolve-DnsName\` |
| Remote shell | \`ssh user@host\` | \`ssh user@host\` |

**System**

| Task | Linux / macOS | Windows |
|---|---|---|
| Disk space | \`df -h\` | \`Get-PSDrive\` |
| Folder size | \`du -sh dir\` | \`(gci dir -r \\| measure Length -s).Sum\` |
| Env variable | \`echo $PATH\`, \`export X=1\` | \`$env:PATH\`, \`$env:X=1\` |
| Install software | \`apt\`, \`dnf\`, \`pacman\`, \`brew\` | \`winget\`, \`choco\`, \`scoop\` |
| Services | \`systemctl status nginx\` | \`Get-Service\` |
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'Which command lists running processes on Linux?', options: ['ls -p', 'ps aux', 'proc list', 'top -k'], answer: 1 },
          { q: 'How do you force-kill PID 4242 on Linux?', options: ['stop 4242', 'kill -9 4242', 'rm 4242', 'exit 4242'], answer: 1 },
          { q: 'Windows equivalent of `ip a` / `ifconfig`?', options: ['ipconfig', 'netcfg', 'ifup', 'Get-IP'], answer: 0 },
          { q: 'How do you read the PATH environment variable in PowerShell?', options: ['echo %PATH%', '$env:PATH', 'get PATH', 'export PATH'], answer: 1 },
          { q: 'Package manager built into modern Windows?', options: ['apt', 'brew', 'winget', 'yum'], answer: 2 },
        ],
      },
      cards: [
        { front: 'PID', back: 'Process ID: a unique number for each running process.' },
        { front: 'df -h vs du -sh', back: 'df = free space per disk; du = size used by a directory.' },
      ],
    },
    {
      id: 'sh-scripting',
      title: 'Shell scripting basics',
      xp: 50,
      body: `
A shell script is a text file of commands that runs top to bottom, letting you automate repetitive tasks.

~~~bash
#!/usr/bin/env bash
# backup.sh: copy a folder into a dated backup
set -euo pipefail                   # stop on errors (best practice)

SRC="\${1:-$HOME/projects}"          # first argument, with a default
DEST="$HOME/backups/$(date +%F)"    # $( ) = command substitution

mkdir -p "$DEST"
for f in "$SRC"/*; do
  if [ -f "$f" ]; then
    cp "$f" "$DEST/"
    echo "Backed up $f"
  fi
done
echo "Done! $(ls "$DEST" | wc -l) files saved."
~~~

Run it: \`chmod +x backup.sh && ./backup.sh ~/notes\`

**Key ideas:** the shebang \`#!\` picks the interpreter; variables are \`NAME=value\` (no spaces!) and read with \`$NAME\`; **always quote** \`"$VAR"\` to handle spaces; \`$1 $2\` are arguments; \`$?\` is the last exit code (0 = success).

**PowerShell version** of the same loop:

~~~powershell
$dest = "$HOME\\backups\\$(Get-Date -Format yyyy-MM-dd)"
New-Item -ItemType Directory -Force $dest | Out-Null
Get-ChildItem $src -File | ForEach-Object {
  Copy-Item $_.FullName $dest
  Write-Host "Backed up $($_.Name)"
}
~~~
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'What does `#!/usr/bin/env bash` on the first line do?', options: ['It is a comment only', 'Tells the OS which interpreter runs the script', 'Imports bash', 'Makes the file executable'], answer: 1 },
          { q: 'Which assignment is valid in bash?', options: ['NAME = "x"', 'NAME="x"', '$NAME="x"', 'set NAME x'], answer: 1 },
          { q: 'What exit code means success?', options: ['1', '-1', '0', '200'], answer: 2 },
          { q: 'Why write "$VAR" with quotes?', options: ['It is faster', 'So values with spaces stay one argument', 'Required for numbers', 'To make it uppercase'], answer: 1 },
        ],
      },
      cards: [
        { front: 'set -euo pipefail', back: 'Bash strict mode: exit on error, on unset variables, and on failures inside pipes.' },
        { front: '$? in bash', back: 'Exit code of the last command (0 = success).' },
      ],
    },
    {
      id: 'sh-boss',
      title: '⚔️ Boss Battle: Clean up the downloads folder',
      xp: 100,
      body: `
Your downloads folder is chaos. Use everything you've learned to organize it.

Look around first with \`ls\`, \`tree\` and \`find\`. Then complete the missions. You can use pipes, \`&&\`, and multiple files per command (\`mv a.jpg b.jpg images/\` is not supported here, so move one at a time or use \`;\`).
`,
      exercise: {
        kind: 'terminal',
        prompt: 'Organize ~/downloads.',
        setup: (sh) => {
          sh.mkdirp(`${HOME}/downloads`);
          for (const f of ['cat.jpg', 'dog.jpg', 'report.pdf', 'notes.txt', 'song.mp3', 'invoice.pdf', 'temp.tmp', 'cache.tmp'])
            sh.write(`${HOME}/downloads/${f}`, f.endsWith('.txt') ? 'buy milk\nfix bug #42\nTODO learn rust\n' : 'binary\n');
        },
        missions: [
          { task: 'Create folders downloads/images and downloads/docs', hint: 'mkdir downloads/images downloads/docs', check: (sh) => sh.isDir(`${HOME}/downloads/images`) && sh.isDir(`${HOME}/downloads/docs`) },
          { task: 'Move both .jpg files into downloads/images', hint: 'mv downloads/cat.jpg downloads/images ; mv downloads/dog.jpg downloads/images', check: (sh) => sh.isFile(`${HOME}/downloads/images/cat.jpg`) && sh.isFile(`${HOME}/downloads/images/dog.jpg`) },
          { task: 'Move both .pdf files into downloads/docs', hint: 'mv downloads/report.pdf downloads/docs ; mv downloads/invoice.pdf downloads/docs', check: (sh) => sh.isFile(`${HOME}/downloads/docs/report.pdf`) && sh.isFile(`${HOME}/downloads/docs/invoice.pdf`) },
          { task: 'Delete every .tmp file', hint: 'rm downloads/temp.tmp downloads/cache.tmp', check: (sh) => !sh.exists(`${HOME}/downloads/temp.tmp`) && !sh.exists(`${HOME}/downloads/cache.tmp`) },
          { task: 'Save the TODO lines of notes.txt into downloads/docs/todo.txt', hint: 'grep TODO downloads/notes.txt > downloads/docs/todo.txt', check: (sh) => sh.isFile(`${HOME}/downloads/docs/todo.txt`) && sh.read(`${HOME}/downloads/docs/todo.txt`).includes('learn rust') },
          { task: 'Show the final structure with tree', hint: 'tree downloads', check: (_, l) => usedCmd(l, 'tree') },
        ],
      },
    },
  ],
};
