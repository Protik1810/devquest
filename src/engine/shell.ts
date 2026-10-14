/**
 * A tiny simulated Bash shell with an in-memory filesystem.
 * It supports the commands taught in the Shell track; nothing touches the real disk.
 */
type FileNode = { type: 'file'; content: string };
type DirNode = { type: 'dir'; children: Record<string, Node> };
type Node = FileNode | DirNode;

export const HOME = '/home/dev';

const MAN: Record<string, string> = {
  pwd: 'pwd: print the current working directory',
  ls: 'ls [-a] [-l] [path]: list directory contents',
  cd: 'cd [dir]: change directory (.. = up, ~ = home, - = previous)',
  mkdir: 'mkdir [-p] dir...: create directories',
  touch: 'touch file...: create empty files',
  cat: 'cat file...: print file contents',
  echo: 'echo text [> file | >> file]: print text, or write/append it to a file',
  rm: 'rm [-r] path...: remove files (and directories with -r)',
  cp: 'cp [-r] src dest: copy files',
  mv: 'mv src dest: move or rename',
  grep: 'grep [-i] [-n] [-c] pattern file...: search text in files',
  find: 'find [path] -name pattern [-type f|d]: search for files by name',
  wc: 'wc [-l] file: count lines, words, characters',
  head: 'head [-n N] file: first lines of a file',
  tail: 'tail [-n N] file: last lines of a file',
  sort: 'sort [-r] file: sort lines',
  uniq: 'uniq file: drop repeated adjacent lines',
  tree: 'tree [path]: show a directory tree',
  chmod: 'chmod mode file: change permissions (simulated)',
  whoami: 'whoami: print the current user',
  date: 'date: print the date and time',
  history: 'history: show commands you ran',
  clear: 'clear: clear the screen',
  man: 'man cmd: show help for a command',
  help: 'help: list available commands',
};

export class Shell {
  root: DirNode = { type: 'dir', children: {} };
  cwd = HOME;
  prevDir = HOME;
  history: string[] = [];
  perms: Record<string, string> = {};

  constructor() {
    this.mkdirp(HOME);
    this.write(`${HOME}/readme.txt`, 'Welcome to the DevQuest terminal!\nType `help` to see commands.\n');
  }

  // ---------- path helpers ----------
  resolve(p: string): string {
    if (!p || p === '~') return HOME;
    if (p.startsWith('~/')) p = HOME + p.slice(1);
    const parts = (p.startsWith('/') ? p : `${this.cwd}/${p}`).split('/');
    const out: string[] = [];
    for (const part of parts) {
      if (!part || part === '.') continue;
      if (part === '..') out.pop();
      else out.push(part);
    }
    return '/' + out.join('/');
  }

  get(path: string): Node | null {
    let node: Node = this.root;
    for (const part of path.split('/').filter(Boolean)) {
      if (node.type !== 'dir' || !node.children[part]) return null;
      node = node.children[part];
    }
    return node;
  }

  private parentOf(path: string): [DirNode | null, string] {
    const i = path.lastIndexOf('/');
    const parent = this.get(path.slice(0, i) || '/');
    return [parent && parent.type === 'dir' ? parent : null, path.slice(i + 1)];
  }

  mkdirp(path: string) {
    let node = this.root;
    for (const part of path.split('/').filter(Boolean)) {
      if (!node.children[part]) node.children[part] = { type: 'dir', children: {} };
      const next = node.children[part];
      if (next.type !== 'dir') throw new Error(`${part}: Not a directory`);
      node = next;
    }
  }

  write(path: string, content: string, append = false) {
    const abs = this.resolve(path);
    const [parent, name] = this.parentOf(abs);
    if (!parent) throw new Error(`${path}: No such file or directory`);
    const existing = parent.children[name];
    if (existing?.type === 'dir') throw new Error(`${path}: Is a directory`);
    parent.children[name] = { type: 'file', content: append && existing ? existing.content + content : content };
  }

  read(path: string): string {
    const n = this.get(this.resolve(path));
    if (!n) throw new Error(`${path}: No such file or directory`);
    if (n.type === 'dir') throw new Error(`${path}: Is a directory`);
    return n.content;
  }

  exists = (path: string) => !!this.get(this.resolve(path));
  isDir = (path: string) => this.get(this.resolve(path))?.type === 'dir';
  isFile = (path: string) => this.get(this.resolve(path))?.type === 'file';

  // ---------- execution ----------
  /** Run one line. Supports `a | b`, `a && b`, `a ; b`, and `>`/`>>` redirection at the end. */
  exec(line: string): string {
    const trimmed = line.trim();
    if (!trimmed) return '';
    this.history.push(trimmed);
    const outputs: string[] = [];
    for (const seq of trimmed.split(/\s*;\s*/)) {
      for (const andPart of seq.split(/\s*&&\s*/)) {
        try {
          const out = this.pipeline(andPart);
          if (out) outputs.push(out.replace(/\n$/, ''));
        } catch (e) {
          outputs.push(`bash: ${(e as Error).message}`);
          break;
        }
      }
    }
    return outputs.join('\n');
  }

  private pipeline(src: string): string {
    let redirect: { file: string; append: boolean } | null = null;
    const m = src.match(/^(.*?)\s*(>>|>)\s*(\S+)\s*$/);
    if (m) {
      src = m[1];
      redirect = { file: m[3], append: m[2] === '>>' };
    }
    let input: string | null = null;
    for (const stage of src.split(/\s*\|\s*/)) input = this.run(tokenize(stage), input);
    if (redirect) {
      this.write(redirect.file, input ? (input.endsWith('\n') ? input : input + '\n') : '', redirect.append);
      return '';
    }
    return input ?? '';
  }

  private run(argv: string[], stdin: string | null): string {
    const [cmd, ...rest] = argv;
    const flags = new Set(rest.filter((a) => /^-[a-zA-Z]+$/.test(a)).flatMap((a) => [...a.slice(1)]));
    const args = rest.filter((a) => !/^-[a-zA-Z]+$/.test(a));
    const textOf = (files: string[]) => (files.length ? files.map((f) => this.read(f)).join('') : stdin ?? '');

    switch (cmd) {
      case 'pwd':
        return this.cwd;
      case 'whoami':
        return 'dev';
      case 'date':
        return new Date().toString();
      case 'echo':
        return rest.join(' ');
      case 'help':
        return 'Available commands:\n' + Object.keys(MAN).join('  ');
      case 'man':
        if (!args[0]) return 'What manual page do you want?';
        return MAN[args[0]] ?? `No manual entry for ${args[0]}`;
      case 'history':
        return this.history.map((h, i) => `${String(i + 1).padStart(4)}  ${h}`).join('\n');
      case 'clear':
        return '\x1bclear';
      case 'cd': {
        const target = args[0] === '-' ? this.prevDir : this.resolve(args[0] ?? '~');
        if (!this.get(target)) throw new Error(`cd: ${args[0]}: No such file or directory`);
        if (!this.isDir(target)) throw new Error(`cd: ${args[0]}: Not a directory`);
        this.prevDir = this.cwd;
        this.cwd = target;
        return '';
      }
      case 'ls': {
        const target = this.resolve(args[0] ?? '.');
        const n = this.get(target);
        if (!n) throw new Error(`ls: cannot access '${args[0]}': No such file or directory`);
        if (n.type === 'file') return args[0];
        let names = Object.keys(n.children).sort();
        if (!flags.has('a')) names = names.filter((x) => !x.startsWith('.'));
        else names = ['.', '..', ...names];
        if (flags.has('l'))
          return names
            .map((name) => {
              const c = n.children[name];
              const dir = !c || c.type === 'dir';
              const size = c && c.type === 'file' ? c.content.length : 4096;
              const perm = this.perms[`${target}/${name}`] ?? (dir ? 'drwxr-xr-x' : '-rw-r--r--');
              return `${perm} 1 dev dev ${String(size).padStart(5)} ${name}${dir ? '/' : ''}`;
            })
            .join('\n');
        return names.map((x) => (n.children[x]?.type === 'dir' ? x + '/' : x)).join('  ');
      }
      case 'mkdir':
        if (!args.length) throw new Error('mkdir: missing operand');
        for (const a of args) {
          const abs = this.resolve(a);
          if (this.get(abs)) throw new Error(`mkdir: cannot create directory '${a}': File exists`);
          if (!flags.has('p') && !this.parentOf(abs)[0]) throw new Error(`mkdir: cannot create directory '${a}': No such file or directory`);
          this.mkdirp(abs);
        }
        return '';
      case 'touch':
        if (!args.length) throw new Error('touch: missing file operand');
        for (const a of args) if (!this.exists(a)) this.write(a, '');
        return '';
      case 'cat':
        return textOf(args);
      case 'rm':
        if (!args.length) throw new Error('rm: missing operand');
        for (const a of args) {
          const abs = this.resolve(a);
          if (abs === '/') throw new Error("rm: it is dangerous to operate recursively on '/'\nrm: use --no-preserve-root to override this failsafe");
          const n = this.get(abs);
          if (!n) throw new Error(`rm: cannot remove '${a}': No such file or directory`);
          if (n.type === 'dir' && !flags.has('r')) throw new Error(`rm: cannot remove '${a}': Is a directory`);
          const [parent, name] = this.parentOf(abs);
          delete parent!.children[name];
        }
        return '';
      case 'cp':
      case 'mv': {
        if (args.length < 2) throw new Error(`${cmd}: missing destination file operand`);
        const src = this.resolve(args[0]);
        let dest = this.resolve(args[1]);
        const n = this.get(src);
        if (!n) throw new Error(`${cmd}: cannot stat '${args[0]}': No such file or directory`);
        if (n.type === 'dir' && cmd === 'cp' && !flags.has('r')) throw new Error(`cp: -r not specified; omitting directory '${args[0]}'`);
        if (this.isDir(dest)) dest = `${dest}/${src.split('/').pop()}`;
        const [parent, name] = this.parentOf(dest);
        if (!parent) throw new Error(`${cmd}: cannot create '${args[1]}': No such file or directory`);
        parent.children[name] = structuredClone(n);
        if (cmd === 'mv') {
          const [sp, sn] = this.parentOf(src);
          delete sp!.children[sn];
        }
        return '';
      }
      case 'grep': {
        const [pattern, ...files] = args;
        if (!pattern) throw new Error('grep: missing pattern');
        const re = new RegExp(pattern, flags.has('i') ? 'i' : '');
        const lines = textOf(files).split('\n');
        const hits = lines.map((l, i) => [l, i + 1] as const).filter(([l]) => l && re.test(l));
        if (flags.has('c')) return String(hits.length);
        return hits.map(([l, i]) => (flags.has('n') ? `${i}:${l}` : l)).join('\n');
      }
      case 'find': {
        const start = rest[0] && !rest[0].startsWith('-') ? rest[0] : '.';
        const nameIdx = rest.indexOf('-name');
        const typeIdx = rest.indexOf('-type');
        const pat = nameIdx >= 0 ? globToRe(rest[nameIdx + 1] ?? '*') : null;
        const type = typeIdx >= 0 ? rest[typeIdx + 1] : null;
        const out: string[] = [];
        const walk = (node: Node, display: string, name: string) => {
          const typeOk = !type || (type === 'd' ? node.type === 'dir' : node.type === 'file');
          if (typeOk && (!pat || pat.test(name))) out.push(display);
          if (node.type === 'dir') for (const [k, v] of Object.entries(node.children)) walk(v, `${display}/${k}`, k);
        };
        const n = this.get(this.resolve(start));
        if (!n) throw new Error(`find: '${start}': No such file or directory`);
        walk(n, start, start.split('/').pop()!);
        return out.join('\n');
      }
      case 'wc': {
        let t = textOf(args);
        // Command output arrives here without its final newline; a real terminal pipe includes it
        if (!args.length && t && !t.endsWith('\n')) t += '\n';
        const lines = t ? t.split('\n').length - (t.endsWith('\n') ? 1 : 0) : 0;
        const words = t.split(/\s+/).filter(Boolean).length;
        const bytes = new TextEncoder().encode(t).length;
        const picked = [flags.has('l') && lines, flags.has('w') && words, flags.has('c') && bytes, flags.has('m') && [...t].length].filter((x) => x !== false);
        return (picked.length ? picked : [lines, words, bytes]).join(' ');
      }
      case 'head':
      case 'tail': {
        const nIdx = rest.indexOf('-n');
        const count = nIdx >= 0 ? parseInt(rest[nIdx + 1], 10) : 10;
        const files = args.filter((a) => a !== String(count));
        const lines = textOf(files).replace(/\n$/, '').split('\n');
        return (cmd === 'head' ? lines.slice(0, count) : lines.slice(-count)).join('\n');
      }
      case 'sort': {
        const lines = textOf(args).replace(/\n$/, '').split('\n').sort();
        return (flags.has('r') ? lines.reverse() : lines).join('\n');
      }
      case 'uniq':
        return textOf(args)
          .replace(/\n$/, '')
          .split('\n')
          .filter((l, i, a) => i === 0 || l !== a[i - 1])
          .join('\n');
      case 'tree': {
        const start = this.resolve(args[0] ?? '.');
        const n = this.get(start);
        if (!n || n.type !== 'dir') throw new Error(`tree: ${args[0] ?? '.'}: not a directory`);
        const out = [args[0] ?? '.'];
        const walk = (d: DirNode, prefix: string) => {
          const keys = Object.keys(d.children).sort();
          keys.forEach((k, i) => {
            const last = i === keys.length - 1;
            const c = d.children[k];
            out.push(`${prefix}${last ? '└── ' : '├── '}${k}${c.type === 'dir' ? '/' : ''}`);
            if (c.type === 'dir') walk(c, prefix + (last ? '    ' : '│   '));
          });
        };
        walk(n, '');
        return out.join('\n');
      }
      case 'chmod': {
        const [mode, file] = args;
        if (!file || !this.exists(file)) throw new Error(`chmod: cannot access '${file}': No such file or directory`);
        this.perms[this.resolve(file)] = modeToString(mode, this.isDir(file));
        return '';
      }
      default:
        if (/^(dir|cls|Get-ChildItem|Set-Location|copy|del|type)$/i.test(cmd))
          throw new Error(`${cmd}: command not found. That's a Windows command! This terminal is Linux Bash. Check the Command Atlas for the Bash equivalent.`);
        throw new Error(`${cmd}: command not found (type 'help')`);
    }
  }
}

function tokenize(s: string): string[] {
  const out: string[] = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m;
  while ((m = re.exec(s))) out.push(m[1] ?? m[2] ?? m[3]);
  return out;
}

function globToRe(glob: string) {
  return new RegExp('^' + glob.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
}

function modeToString(mode: string, dir: boolean) {
  if (/^[0-7]{3}$/.test(mode)) {
    const bits = (d: string) => ['---', '--x', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx'][+d];
    return (dir ? 'd' : '-') + [...mode].map(bits).join('');
  }
  if (mode.includes('+x')) return dir ? 'drwxr-xr-x' : '-rwxr-xr-x';
  return dir ? 'drwxr-xr-x' : '-rw-r--r--';
}
