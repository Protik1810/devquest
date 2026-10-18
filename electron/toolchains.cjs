// Finds language toolchains on the learner's PC and runs single-file programs with them.
// Used by the desktop app for languages that can't run in the browser (Go, Rust, C/C++, Java, C#, …).
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const isWin = process.platform === 'win32';
const MAX_OUTPUT = 64 * 1024;

// ---------- environment: include PATH/vars from the registry so freshly installed tools are found ----------
function registryEnv() {
  if (!isWin) return {};
  const out = {};
  for (const key of ['HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Environment', 'HKCU\\Environment']) {
    try {
      const text = execFileSync('reg', ['query', key], { encoding: 'utf8', windowsHide: true });
      for (const line of text.split(/\r?\n/)) {
        const m = line.match(/^\s+(\S+)\s+REG_(?:EXPAND_)?SZ\s+(.*)$/);
        if (!m) continue;
        const [, name, value] = m;
        if (name.toLowerCase() === 'path') out.Path = out.Path ? `${out.Path};${value}` : value;
        else out[name] = value;
      }
    } catch {
      /* registry not readable: fall back to process env */
    }
  }
  const expand = (v) => v.replace(/%([^%]+)%/g, (_, n) => process.env[n] ?? out[n] ?? `%${n}%`);
  for (const k of Object.keys(out)) out[k] = expand(out[k]);
  return out;
}

let cachedEnv = null;
function toolEnv() {
  if (cachedEnv) return cachedEnv;
  const reg = registryEnv();
  const env = { ...reg, ...process.env };
  const sep = isWin ? ';' : ':';
  const pathKey = Object.keys(process.env).find((k) => k.toLowerCase() === 'path') ?? 'PATH';
  const dirs = [...(process.env[pathKey] ?? '').split(sep), ...(reg.Path ?? '').split(sep)].filter(Boolean);
  env[pathKey] = [...new Set(dirs)].join(sep);
  // Tool-specific variables (e.g. RUSTUP_HOME, SDKROOT) set by installers after the app started
  for (const k of Object.keys(reg)) if (k.toLowerCase() !== 'path' && !process.env[k]) env[k] = reg[k];
  // vcvars64.bat looks for vswhere.exe on PATH
  if (isWin) env[pathKey] += `;${path.join(process.env['ProgramFiles(x86)'] ?? 'C:\Program Files (x86)', 'Microsoft Visual Studio', 'Installer')}`;
  Object.assign(env, { DOTNET_CLI_TELEMETRY_OPTOUT: '1', DOTNET_NOLOGO: '1', DOTNET_SKIP_FIRST_TIME_EXPERIENCE: '1' });
  cachedEnv = env;
  return env;
}

function which(name, extraDirs = []) {
  const env = toolEnv();
  const pathKey = Object.keys(env).find((k) => k.toLowerCase() === 'path');
  const dirs = [...extraDirs, ...(env[pathKey] ?? '').split(isWin ? ';' : ':')].filter(Boolean);
  const exts = isWin ? ['.exe', '.cmd', '.bat', ''] : [''];
  for (const d of dirs) {
    // Skip the WSL launcher and Store app stubs; prefer a real bash (e.g. Git Bash)
    if (isWin && name === 'bash' && /\\(windows\\system32|windowsapps)/i.test(d)) continue;
    for (const e of exts) {
      const p = path.join(d, name + e);
      try {
        if (fs.statSync(p).isFile()) return p;
      } catch {
        /* not here */
      }
    }
  }
  return null;
}

// ---------- process helpers ----------
function run(cmd, args, { cwd, timeoutMs = 30000, verbatim = false, stdin } = {}) {
  return new Promise((resolve) => {
    // .bat/.cmd launchers (kotlinc, some SDK shims) must go through cmd.exe; quote everything ourselves
    const batch = isWin && /\.(bat|cmd)$/i.test(cmd);
    const child = batch
      ? spawn('cmd.exe', ['/d', '/s', '/c', `"${[cmd, ...args].map((a) => `"${a}"`).join(' ')}"`], { cwd, env: toolEnv(), windowsHide: true, windowsVerbatimArguments: true })
      : spawn(cmd, args, { cwd, env: toolEnv(), windowsHide: true, windowsVerbatimArguments: verbatim });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    // Typed input for the program (Scanner, input(), readLine...); without it, reading hits end of input at once
    child.stdin.on('error', () => {});
    child.stdin.end(stdin ? (stdin.endsWith('\n') ? stdin : stdin + '\n') : '');
    const cap = (s, d) => (s.length < MAX_OUTPUT ? s + d.toString() : s);
    child.stdout.on('data', (d) => (stdout = cap(stdout, d)));
    child.stderr.on('data', (d) => (stderr = cap(stderr, d)));
    const timer = setTimeout(() => {
      timedOut = true;
      if (isWin) spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], { windowsHide: true });
      else child.kill('SIGKILL');
    }, timeoutMs);
    child.on('error', (e) => {
      clearTimeout(timer);
      resolve({ code: -1, stdout, stderr: String(e.message), timedOut });
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, stdout: stdout.replace(/\r\n/g, '\n'), stderr: stderr.replace(/\r\n/g, '\n'), timedOut });
    });
  });
}

const firstLine = (s) => (s || '').split('\n').map((l) => l.trim()).find(Boolean) ?? '';

// ---------- toolchain discovery ----------
function findMsvc() {
  if (!isWin) return null;
  const vswhere = path.join(process.env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)', 'Microsoft Visual Studio', 'Installer', 'vswhere.exe');
  if (!fs.existsSync(vswhere)) return null;
  try {
    const inst = execFileSync(vswhere, ['-latest', '-products', '*', '-requires', 'Microsoft.VisualStudio.Component.VC.Tools.x86.x64', '-property', 'installationPath'], { encoding: 'utf8', windowsHide: true }).trim();
    const vcvars = path.join(inst, 'VC', 'Auxiliary', 'Build', 'vcvars64.bat');
    return inst && fs.existsSync(vcvars) ? vcvars : null;
  } catch {
    return null;
  }
}

function findDotnet() {
  const onPath = which('dotnet');
  if (onPath) return onPath;
  const candidates = [path.join(process.env.ProgramFiles ?? 'C:\\Program Files', 'dotnet', 'dotnet.exe')];
  // Unity editors bundle a .NET SDK
  const hub = path.join(process.env.ProgramFiles ?? 'C:\\Program Files', 'Unity', 'Hub', 'Editor');
  try {
    for (const v of fs.readdirSync(hub)) candidates.push(path.join(hub, v, 'Editor', 'Data', 'DotNetSdk', 'dotnet.exe'));
  } catch {
    /* no Unity */
  }
  return candidates.find((c) => fs.existsSync(c)) ?? null;
}

function findBash() {
  if (!isWin) return which('bash');
  // Git for Windows ships bash; find it relative to git.exe wherever Git is installed (…\cmd\git.exe or …\mingw64\bin\git.exe)
  const git = which('git');
  const roots = git ? [path.resolve(path.dirname(git), '..'), path.resolve(path.dirname(git), '..', '..')] : [];
  roots.push(path.join(process.env.ProgramFiles ?? 'C:\\Program Files', 'Git'), path.join(process.env.LOCALAPPDATA ?? '', 'Programs', 'Git'));
  const found = roots.map((r) => path.join(r, 'bin', 'bash.exe')).find((b) => fs.existsSync(b));
  return found ?? which('bash');
}

let detected = null;

async function detect(force = false) {
  if (detected && !force) return detected;
  cachedEnv = null;
  const tools = {
    java: which('java'),
    go: which('go'),
    rustc: which('rustc'),
    gcc: which('gcc'),
    gpp: which('g++'),
    clang: which('clang'),
    msvc: findMsvc(),
    kotlinc: which('kotlinc'),
    swiftc: which('swiftc'),
    dotnet: findDotnet(),
    dart: which('dart'),
    ruby: which('ruby'),
    php: which('php'),
    rscript: which('Rscript'),
    lua: which('lua') ?? which('lua54'),
    bash: findBash(),
    pwsh: which('pwsh') ?? (isWin ? which('powershell') : null),
    solc: which('solc'),
  };
  const version = async (bin, args, pick = firstLine) => {
    if (!bin) return null;
    const r = await run(bin, args, { timeoutMs: 20000 });
    return pick(r.stdout + '\n' + r.stderr) || 'installed';
  };
  const [java, go, rust, kotlin, swift, dotnetSdks, dart, ruby, php, r, lua, bash, pwsh, solc] = await Promise.all([
    version(tools.java, ['-version']),
    version(tools.go, ['version']),
    version(tools.rustc, ['--version']),
    version(tools.kotlinc, ['-version']),
    version(tools.swiftc, ['--version']),
    tools.dotnet ? run(tools.dotnet, ['--list-sdks'], { timeoutMs: 20000 }) : null,
    version(tools.dart, ['--version']),
    version(tools.ruby, ['--version']),
    version(tools.php, ['--version']),
    version(tools.rscript, ['--version']),
    version(tools.lua, ['-v']),
    version(tools.bash, ['--version']),
    version(tools.pwsh, ['-NoProfile', '-Command', '"PowerShell $($PSVersionTable.PSVersion)"']),
    version(tools.solc, ['--version'], (s) => (s.match(/Version: (\S+)/) ?? [])[1] ?? firstLine(s)),
  ]);
  const sdkMajor = dotnetSdks ? Math.max(0, ...[...dotnetSdks.stdout.matchAll(/^(\d+)\./gm)].map((m) => +m[1])) : 0;
  const cc = tools.gcc ? 'GCC' : tools.clang ? 'Clang' : tools.msvc ? 'MSVC (Visual Studio Build Tools)' : null;
  const cpp = tools.gpp ? 'G++' : tools.clang ? 'Clang' : tools.msvc ? 'MSVC (Visual Studio Build Tools)' : null;
  detected = {
    tools,
    sdkMajor,
    langs: {
      java: java && { tool: java },
      go: go && { tool: go },
      rust: rust && { tool: rust },
      c: cc && { tool: cc },
      cpp: cpp && { tool: cpp },
      kotlin: kotlin && tools.java && { tool: kotlin },
      swift: swift && { tool: swift },
      csharp: sdkMajor >= 6 && { tool: `.NET SDK ${sdkMajor}` },
      dart: dart && { tool: dart },
      ruby: ruby && { tool: ruby },
      php: php && { tool: php },
      r: r && { tool: r },
      lua: lua && { tool: lua },
      bash: bash && { tool: bash },
      powershell: pwsh && { tool: pwsh },
      solidity: solc && { tool: `solc ${solc}`, compileOnly: true },
    },
  };
  return detected;
}

// ---------- running a program ----------
async function runProgram(lang, code, stdin) {
  const d = await detect();
  const t = d.tools;
  if (!d.langs[lang]) return { ok: false, output: '', error: `No ${lang} toolchain found on this computer.`, missing: true };
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'devquest-'));
  const exe = path.join(dir, isWin ? 'main.exe' : 'main');
  const write = (name, text) => fs.writeFileSync(path.join(dir, name), text);
  const steps = []; // [cmd, args, opts, isCompileStep]
  const msvc = (src, std) => [
    'cmd.exe',
    ['/d', '/s', '/c', `"call "${t.msvc}" >nul && cl /nologo /EHsc /W3 ${std} ${src} /Fe:main.exe"`],
    { verbatim: true, timeoutMs: 60000 },
    true,
  ];

  switch (lang) {
    case 'java':
      write('Main.java', code);
      // UTF-8 output and an English locale on every OS (Windows would otherwise use its legacy code page and print ?
      // for ♠, é..., and a German PC would format 2.50 as 2,50)
      steps.push([t.java, ['-Dstdout.encoding=UTF-8', '-Dstderr.encoding=UTF-8', '-Duser.language=en', '-Duser.country=US', 'Main.java'], {}, false]);
      break;
    case 'go':
      write('main.go', code);
      steps.push([t.go, ['run', 'main.go'], { timeoutMs: 60000 }, false]);
      break;
    case 'rust':
      write('main.rs', code);
      steps.push([t.rustc, ['--edition', '2021', 'main.rs', '-o', exe], { timeoutMs: 60000 }, true], [exe, [], {}, false]);
      break;
    case 'c':
      write('main.c', code);
      if (t.gcc || t.clang) steps.push([t.gcc ?? t.clang, ['main.c', '-std=c17', '-O1', '-o', exe, ...(isWin ? [] : ['-lm'])], {}, true]);
      else steps.push(msvc('main.c', '/std:c17'));
      steps.push([exe, [], {}, false]);
      break;
    case 'cpp':
      write('main.cpp', code);
      if (t.gpp || t.clang) steps.push([t.gpp ?? t.clang, ['main.cpp', '-std=c++17', '-O1', '-o', exe], {}, true]);
      else steps.push(msvc('main.cpp', '/std:c++17'));
      steps.push([exe, [], {}, false]);
      break;
    case 'kotlin':
      write('main.kt', code);
      steps.push([t.kotlinc, ['main.kt', '-include-runtime', '-d', 'main.jar', '-nowarn'], { timeoutMs: 120000 }, true], [t.java, ['-Dstdout.encoding=UTF-8', '-Dstderr.encoding=UTF-8', '-Duser.language=en', '-Duser.country=US', '-jar', 'main.jar'], {}, false]);
      break;
    case 'swift':
      write('main.swift', code);
      steps.push([t.swiftc, ['main.swift', '-o', exe], { timeoutMs: 120000 }, true], [exe, [], {}, false]);
      break;
    case 'csharp':
      write('Program.cs', code);
      // UTF-8 console on every OS (Windows would otherwise use its OEM code page and garble ♥, é...) and the invariant
      // culture, so 2.50 prints the same on every computer (not 2,50 on a German one); a separate
      // file, so the learner's line numbers in compiler errors stay the same
      write('DevQuestConsole.cs', 'internal static class DevQuestConsole { [System.Runtime.CompilerServices.ModuleInitializer] internal static void Init() { System.Console.OutputEncoding = new System.Text.UTF8Encoding(false); System.Console.InputEncoding = new System.Text.UTF8Encoding(false); System.Globalization.CultureInfo.DefaultThreadCurrentCulture = System.Globalization.CultureInfo.InvariantCulture; System.Globalization.CultureInfo.CurrentCulture = System.Globalization.CultureInfo.InvariantCulture; } }');
      write('app.csproj', `<Project Sdk="Microsoft.NET.Sdk"><PropertyGroup><OutputType>Exe</OutputType><TargetFramework>net${d.sdkMajor}.0</TargetFramework><ImplicitUsings>enable</ImplicitUsings><Nullable>disable</Nullable><TreatWarningsAsErrors>false</TreatWarningsAsErrors></PropertyGroup></Project>`);
      steps.push([t.dotnet, ['build', 'app.csproj', '-nologo', '-v', 'q', '-o', 'out'], { timeoutMs: 120000 }, true], [t.dotnet, [path.join('out', 'app.dll')], {}, false]);
      break;
    case 'dart':
      write('main.dart', code);
      steps.push([t.dart, ['run', 'main.dart'], { timeoutMs: 60000 }, false]);
      break;
    case 'ruby':
      write('main.rb', code);
      steps.push([t.ruby, ['main.rb'], {}, false]);
      break;
    case 'php':
      write('main.php', code);
      steps.push([t.php, ['main.php'], {}, false]);
      break;
    case 'r':
      write('main.R', code);
      steps.push([t.rscript, ['--vanilla', 'main.R'], { timeoutMs: 60000 }, false]);
      break;
    case 'lua':
      write('main.lua', code);
      steps.push([t.lua, ['main.lua'], {}, false]);
      break;
    case 'bash':
      write('main.sh', code.replace(/\r\n/g, '\n'));
      steps.push([t.bash, ['main.sh'], {}, false]);
      break;
    case 'powershell':
      write('main.ps1', code);
      steps.push([t.pwsh, ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', 'main.ps1'], {}, false]);
      break;
    case 'solidity':
      write('main.sol', code);
      steps.push([t.solc, ['--bin', 'main.sol'], {}, true]);
      break;
    default:
      return { ok: false, output: '', error: `Unsupported language ${lang}` };
  }

  // Messages show file names, not the temporary folder they were compiled in
  const hideDir = (text) => text.split(dir + path.sep).join('');
  try {
    let output = '';
    for (const [cmd, args, opts, compile] of steps) {
      const r = await run(cmd, args, { cwd: dir, ...opts, ...(compile ? {} : { stdin }) });
      if (r.timedOut) return { ok: false, output, error: `⏱ Timed out after ${(opts.timeoutMs ?? 30000) / 1000}s.${compile ? '' : ' Is there an infinite loop?'}` };
      if (compile) {
        if (r.code !== 0) {
          // MSVC writes errors to stdout; drop its echo of the file name
          let lines = (r.stdout + r.stderr).split('\n').filter((l) => !/^\s*main\.(c|cpp)\s*$/.test(l));
          // dotnet build prints each error twice, with the project file appended, among build chatter
          if (lang === 'csharp') lines = [...new Set(lines.filter((l) => /: error /.test(l)).map((l) => l.replace(/\s*\[[^\]]*\.csproj\]\s*$/, '')))];
          return { ok: false, output: '', error: `Compile error:\n${hideDir(lines.join('\n').trim())}`, compileError: true };
        }
        if (lang === 'solidity') output = '✔ Compiled successfully with solc.\n';
        continue;
      }
      output += r.stdout;
      if (r.code !== 0) return { ok: false, output, error: hideDir(r.stderr.trim()) || `Program exited with code ${r.code}` };
    }
    return { ok: true, output, error: undefined };
  } finally {
    fs.rm(dir, { recursive: true, force: true }, () => {});
  }
}

module.exports = { detect, runProgram };
