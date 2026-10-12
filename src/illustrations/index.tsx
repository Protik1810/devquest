import { useState, type ReactElement } from 'react';
import { Arrow, Box, C, Packet, Svg, T } from './kit';

// ---------- Foundations ----------
function Computer() {
  return (
    <Svg w={640} h={260} caption="Instructions and data flow from storage into RAM, then into the CPU, which talks to the outside world through I/O.">
      <Box x={20} y={90} w={130} h={80} label="💾 Storage" sub="permanent, slow" color={C.slate} />
      <Box x={230} y={90} w={130} h={80} label="🧠 RAM" sub="temporary, fast" color={C.blue} />
      <Box x={440} y={70} w={170} h={120} label="⚡ CPU" sub="fetch → decode → execute" color={C.purple} />
      <Box x={455} y={154} w={65} h={28} label="ALU" fs={11} color={C.pink} />
      <Box x={530} y={154} w={65} h={28} label="cache" fs={11} color={C.amber} />
      <Arrow x1={150} y1={130} x2={228} y2={130} label="load" />
      <Arrow x1={360} y1={120} x2={438} y2={120} label="read" />
      <Arrow x1={438} y1={150} x2={362} y2={150} label="write" />
      <Box x={230} y={210} w={380} h={40} label="⌨️ 🖱️ 🖥️ 🌐  I/O devices" color={C.green} fs={13} />
      <Arrow x1={525} y1={190} x2={525} y2={208} />
      <Packet path="M150,130 L228,130 M360,120 L438,120" dur={2.5} />
    </Svg>
  );
}

function Binary() {
  const [bits, setBits] = useState([0, 0, 1, 0, 1, 0, 1, 0]);
  const value = bits.reduce((a, b) => a * 2 + b, 0);
  const ch = value >= 32 && value < 127 ? String.fromCharCode(value) : '·';
  return (
    <figure className="ill">
      <div className="bits">
        {bits.map((b, i) => (
          <button key={i} className={`bit ${b ? 'on' : ''}`} onClick={() => setBits(bits.map((x, j) => (j === i ? 1 - x : x)))}>
            <span className="bit-val">{b}</span>
            <span className="bit-weight">{2 ** (7 - i)}</span>
          </button>
        ))}
      </div>
      <div className="bits-result">
        <span>
          Decimal: <b>{value}</b>
        </span>
        <span>
          Hex: <b>0x{value.toString(16).toUpperCase().padStart(2, '0')}</b>
        </span>
        <span>
          ASCII: <b>{ch}</b>
        </span>
        <span>
          Sum: <code>{bits.map((b, i) => (b ? 2 ** (7 - i) : null)).filter((x) => x !== null).join(' + ') || '0'}</code>
        </span>
      </div>
      <figcaption>Each bit doubles in value from right to left. Click to toggle.</figcaption>
    </figure>
  );
}

function Compile() {
  return (
    <Svg w={660} h={250} caption="Compiled languages translate ahead of time; interpreted ones translate while running.">
      <T x={20} y={30} anchor="start" bold color={C.purple}>Compiled (C, Rust, Go)</T>
      <Box x={20} y={45} w={120} h={55} label="main.c" sub="source" color={C.slate} />
      <Box x={200} y={45} w={120} h={55} label="Compiler" sub="gcc / rustc" color={C.purple} />
      <Box x={380} y={45} w={120} h={55} label="app.exe" sub="machine code" color={C.green} />
      <Box x={540} y={45} w={100} h={55} label="CPU ⚡" color={C.amber} />
      <Arrow x1={140} y1={72} x2={198} y2={72} />
      <Arrow x1={320} y1={72} x2={378} y2={72} label="once" />
      <Arrow x1={500} y1={72} x2={538} y2={72} />
      <T x={20} y={150} anchor="start" bold color={C.blue}>Interpreted (Python, Ruby)</T>
      <Box x={20} y={165} w={120} h={55} label="main.py" sub="source" color={C.slate} />
      <Box x={200} y={165} w={300} h={55} label="Interpreter" sub="reads & runs line by line, every time" color={C.blue} />
      <Box x={540} y={165} w={100} h={55} label="CPU ⚡" color={C.amber} />
      <Arrow x1={140} y1={192} x2={198} y2={192} />
      <Arrow x1={500} y1={192} x2={538} y2={192} label="each run" />
      <Packet path="M140,72 L540,72" dur={3} color={C.purple} />
      <Packet path="M140,192 L540,192" dur={5} color={C.blue} />
    </Svg>
  );
}

function OsLayers() {
  const layers = [
    ['👩‍💻 You', C.pink],
    ['Apps: browser, editor, games, your programs', C.blue],
    ['Shell & system libraries', C.cyan],
    ['Kernel: processes · memory · files · drivers', C.purple],
    ['Hardware: CPU · RAM · disk · network', C.slate],
  ] as const;
  return (
    <Svg w={600} h={280} caption="Each layer only talks to the layer directly below it. Apps reach hardware via system calls into the kernel.">
      {layers.map(([label, color], i) => (
        <Box key={i} x={40 + i * 18} y={10 + i * 53} w={520 - i * 36} h={44} label={label} color={color} fs={14} />
      ))}
      <T x={575} y={175} size={11} color="var(--ill-muted)" anchor="end">system calls ↕</T>
    </Svg>
  );
}

function Flowchart() {
  return (
    <Svg w={560} h={330} caption="An algorithm as a flowchart: deciding whether to bring an umbrella.">
      <Box x={200} y={10} w={160} h={40} label="Start" color={C.green} r={20} />
      <Arrow x1={280} y1={50} x2={280} y2={78} />
      <polygon points="280,80 380,125 280,170 180,125" fill={C.amber} fillOpacity={0.18} stroke={C.amber} strokeWidth={2} />
      <T x={280} y={130} bold>Raining?</T>
      <Arrow x1={380} y1={125} x2={430} y2={125} label="yes" />
      <Box x={432} y={105} w={120} h={40} label="Take ☂️" color={C.blue} />
      <Arrow x1={180} y1={125} x2={130} y2={125} label="no" />
      <Box x={8} y={105} w={120} h={40} label="Sunglasses 😎" color={C.blue} fs={13} />
      <Arrow x1={492} y1={145} x2={330} y2={258} />
      <Arrow x1={68} y1={145} x2={230} y2={258} />
      <Box x={200} y={260} w={160} h={40} label="Go outside" color={C.green} r={20} />
    </Svg>
  );
}

function Internet() {
  return (
    <Svg w={680} h={260} caption="Your request hops through routers to reach a server; DNS first tells you where to go.">
      <Box x={10} y={100} w={110} h={60} label="💻 You" sub="client" color={C.blue} />
      <Box x={180} y={20} w={120} h={50} label="📖 DNS" sub="name → IP" color={C.amber} />
      <Box x={190} y={115} w={70} h={34} label="router" fs={11} color={C.slate} />
      <Box x={310} y={170} w={70} h={34} label="router" fs={11} color={C.slate} />
      <Box x={420} y={95} w={70} h={34} label="router" fs={11} color={C.slate} />
      <Box x={540} y={90} w={130} h={70} label="🖥️ Server" sub="93.184.216.34" color={C.green} />
      <Arrow x1={110} y1={100} x2={185} y2={65} label="1. where?" dashed />
      <Arrow x1={120} y1={132} x2={188} y2={132} />
      <Arrow x1={260} y1={140} x2={310} y2={180} />
      <Arrow x1={380} y1={180} x2={420} y2={125} />
      <Arrow x1={490} y1={115} x2={538} y2={118} />
      <Packet path="M120,132 L225,132 L345,187 L455,112 L540,118" dur={3} />
      <Packet path="M540,135 L455,125 L345,195 L225,145 L120,145" dur={3} delay={1.5} color={C.green} />
    </Svg>
  );
}

// ---------- Python ----------
function Variables() {
  const vars: [string, string, string, string][] = [
    ['name', '"Ada"', 'str', C.pink],
    ['age', '36', 'int', C.blue],
    ['height', '1.65', 'float', C.cyan],
    ['is_admin', 'True', 'bool', C.green],
  ];
  return (
    <Svg w={620} h={190} caption="A variable is a name (label) pointing to a value in memory. Each value has a type.">
      {vars.map(([n, v, t, col], i) => (
        <g key={n}>
          <T x={75 + i * 150} y={30} bold mono>{n}</T>
          <Arrow x1={75 + i * 150} y1={38} x2={75 + i * 150} y2={78} />
          <Box x={15 + i * 150} y={80} w={120} h={60} label={v} color={col} fs={18} />
          <T x={75 + i * 150} y={165} size={12} color="var(--ill-muted)">{t}</T>
        </g>
      ))}
    </Svg>
  );
}

function Branch() {
  return (
    <Svg w={600} h={250} caption="if/elif/else: Python checks each condition top to bottom and runs the first match only.">
      <Box x={230} y={10} w={140} h={40} label="hp = 35" color={C.slate} />
      <Arrow x1={300} y1={50} x2={300} y2={70} />
      <Box x={210} y={72} w={180} h={38} label="hp <= 0 ?" color={C.amber} />
      <Arrow x1={210} y1={91} x2={120} y2={91} label="True" />
      <Box x={10} y={74} w={108} h={36} label="Game over" fs={13} color={C.red} />
      <Arrow x1={300} y1={110} x2={300} y2={130} label="False" />
      <Box x={210} y={132} w={180} h={38} label="hp < 50 ?" color={C.amber} />
      <Arrow x1={390} y1={151} x2={470} y2={151} label="True ✔" color={C.green} />
      <Box x={472} y={133} w={118} h={36} label="Low health!" fs={13} color={C.green} />
      <Arrow x1={300} y1={170} x2={300} y2={192} label="False" />
      <Box x={230} y={194} w={140} h={36} label="else: Healthy" fs={13} color={C.blue} />
      <Packet path="M300,50 L300,91 L300,151 L520,151" dur={3} color={C.green} />
    </Svg>
  );
}

function Loop() {
  return (
    <Svg w={560} h={230} caption="A for loop takes each item in turn, runs the body, and repeats until the items run out.">
      <Box x={20} y={90} w={130} h={50} label="next item?" color={C.amber} />
      <Box x={230} y={90} w={130} h={50} label="run body" sub="i = 0, 1, 2…" color={C.blue} />
      <Box x={430} y={90} w={110} h={50} label="done ✔" color={C.green} />
      <Arrow x1={150} y1={108} x2={228} y2={108} label="yes" />
      <Arrow x1={295} y1={140} x2={85} y2={140} curve={-70} label="repeat" />
      <Arrow x1={85} y1={90} x2={485} y2={90} curve={70} label="no more items" dashed />
      <Packet path="M150,108 L230,108 M295,140 Q190,210 85,140" dur={2} />
    </Svg>
  );
}

function HashMap() {
  const keys: [string, number, string][] = [
    ['"ada"', 1, '7'],
    ['"linus"', 4, '12'],
    ['"grace"', 6, '9'],
  ];
  return (
    <Svg w={640} h={300} caption='hash(key) % buckets picks a slot, so lookups jump straight to the right place.'>
      {keys.map(([k, b], i) => (
        <g key={k}>
          <Box x={10} y={40 + i * 80} w={100} h={40} label={k} color={C.pink} fs={14} />
          <Arrow x1={110} y1={60 + i * 80} x2={168} y2={60 + i * 80} />
          <Box x={170} y={40 + i * 80} w={130} h={40} label={`hash % 8 = ${b}`} color={C.purple} fs={13} />
          <Arrow x1={300} y1={60 + i * 80} x2={418} y2={20 + b * 34 + 14} />
        </g>
      ))}
      {Array.from({ length: 8 }, (_, i) => {
        const hit = keys.find((k) => k[1] === i);
        return (
          <g key={i}>
            <T x={405} y={20 + i * 34 + 19} anchor="end" size={12} color="var(--ill-muted)">{i}</T>
            <Box x={420} y={20 + i * 34} w={200} h={28} r={4} label={hit ? `${hit[0]} → ${hit[2]}` : ''} color={hit ? C.green : C.slate} fs={13} />
          </g>
        );
      })}
    </Svg>
  );
}

function CallStack() {
  const frames = [
    ['main()', C.slate],
    ['checkout(cart)', C.blue],
    ['total(items)', C.purple],
    ['tax(amount)', C.pink],
  ] as const;
  return (
    <Svg w={560} h={260} caption="Each call pushes a frame with its local variables; returning pops it. The top frame is running now.">
      {frames.map(([f, col], i) => (
        <g key={f} style={{ animation: `stackIn 6s ${i * 0.6}s infinite both` }}>
          <Box x={150} y={210 - i * 52} w={260} h={44} label={f} color={col} />
        </g>
      ))}
      <T x={60} y={30} bold>call ↑ push</T>
      <T x={500} y={30} bold>return ↓ pop</T>
      <Arrow x1={60} y1={240} x2={60} y2={45} />
      <Arrow x1={500} y1={45} x2={500} y2={240} />
    </Svg>
  );
}

function Oop() {
  return (
    <Svg w={640} h={260} caption="One class (blueprint), many objects (instances), each with its own data. A subclass inherits and specializes.">
      <Box x={20} y={20} w={200} h={110} color={C.purple} />
      <T x={120} y={45} bold>class Hero</T>
      <T x={120} y={72} size={12} mono>name, hp</T>
      <T x={120} y={92} size={12} mono>take_damage()</T>
      <T x={120} y={112} size={12} mono>is_alive()</T>
      <Box x={20} y={180} w={200} h={60} label="class Mage(Hero)" sub="overrides take_damage()" color={C.pink} />
      <Arrow x1={120} y1={178} x2={120} y2={132} label="inherits" />
      {['Ada · hp 70', 'Linus · hp 100', 'Grace · hp 45'].map((o, i) => (
        <g key={o}>
          <Box x={380} y={20 + i * 75} w={240} h={55} label={`🦸 ${o}`} color={C.blue} />
          <Arrow x1={220} y1={75} x2={378} y2={47 + i * 75} dashed />
        </g>
      ))}
      <T x={300} y={250} size={12} color="var(--ill-muted)">objects = instances</T>
    </Svg>
  );
}

function Recursion() {
  const rows = ['factorial(4)', '4 * factorial(3)', '3 * factorial(2)', '2 * factorial(1)', '→ 1 (base case)'];
  const back = ['= 24', '= 24', '= 6', '= 2', '1'];
  return (
    <Svg w={600} h={270} caption="Calls go down until the base case, then results unwind back up the stack.">
      {rows.map((r, i) => (
        <g key={i}>
          <Box x={40 + i * 40} y={10 + i * 50} w={250} h={40} label={r} color={i === 4 ? C.green : C.blue} fs={14} />
          <T x={330 + i * 40} y={36 + i * 50} bold color={C.amber} anchor="start">{back[i]}</T>
        </g>
      ))}
      <Arrow x1={20} y1={20} x2={20} y2={250} label="" />
      <T x={14} y={140} size={11} anchor="end">call</T>
      <Arrow x1={580} y1={250} x2={580} y2={20} />
      <T x={590} y={140} size={11} anchor="start">return</T>
    </Svg>
  );
}

function EventLoop() {
  return (
    <Svg w={680} h={270} caption="Slow work goes to the runtime; finished callbacks wait in queues; the event loop feeds them to the stack when it's empty.">
      <Box x={20} y={30} w={170} h={200} color={C.blue} />
      <T x={105} y={55} bold>Call stack</T>
      <Box x={40} y={170} w={130} h={40} label="main()" fs={13} color={C.blue} />
      <Box x={40} y={125} w={130} h={40} label="fetch(...)" fs={13} color={C.purple} />
      <Box x={260} y={30} w={200} h={90} label="Web APIs / runtime" sub="timers · network · disk" color={C.purple} />
      <Box x={260} y={160} w={400} h={34} label="Microtasks: promise callbacks" fs={12} color={C.green} />
      <Box x={260} y={205} w={400} h={34} label="Macrotasks: setTimeout, I/O events" fs={12} color={C.amber} />
      <Box x={520} y={40} w={140} h={70} label="🔁 Event loop" sub="stack empty? take next" color={C.pink} />
      <Arrow x1={170} y1={145} x2={258} y2={90} label="hand off" />
      <Arrow x1={400} y1={120} x2={400} y2={158} />
      <Arrow x1={590} y1={110} x2={590} y2={158} />
      <Arrow x1={258} y1={177} x2={172} y2={190} label="run" />
      <Packet path="M170,145 L258,90 M400,120 L400,177 L172,190" dur={4} />
    </Svg>
  );
}

// ---------- Shell ----------
function ShellIll() {
  return (
    <Svg w={620} h={200} caption="The shell's loop: read what you type, run it via the OS, print the result, and repeat.">
      <Box x={20} y={70} w={120} h={60} label="⌨️ You type" sub="ls -l" color={C.blue} />
      <Box x={180} y={70} w={120} h={60} label="🐚 Shell" sub="parse command" color={C.amber} />
      <Box x={340} y={70} w={120} h={60} label="⚙️ Kernel" sub="run program" color={C.purple} />
      <Box x={500} y={70} w={110} h={60} label="🖥️ Output" sub="printed text" color={C.green} />
      <Arrow x1={140} y1={100} x2={178} y2={100} />
      <Arrow x1={300} y1={100} x2={338} y2={100} />
      <Arrow x1={460} y1={100} x2={498} y2={100} />
      <Arrow x1={555} y1={130} x2={80} y2={130} curve={-70} label="loop: prompt again $" dashed />
    </Svg>
  );
}

function FileTree() {
  const rows: [number, string, boolean][] = [
    [0, '/', true], [1, 'bin', true], [1, 'etc', true], [1, 'home', true], [2, 'dev   ← ~ (home)', true], [3, 'projects', true], [4, 'game', true], [5, 'main.py', false], [3, 'readme.txt', false], [1, 'tmp', true], [1, 'var', true], [2, 'log', true],
  ];
  return (
    <Svg w={520} h={300} caption="The Linux filesystem is a tree rooted at /. Your home directory is /home/<you>.">
      {rows.map(([d, n, dir], i) => (
        <g key={i}>
          {d > 0 && <path d={`M${20 + (d - 1) * 34 + 8},${i * 24 + 4} v10 h18`} stroke="var(--ill-line)" fill="none" />}
          <T x={20 + d * 34} y={i * 24 + 20} anchor="start" mono bold={dir} color={dir ? C.blue : 'var(--ill-text)'}>
            {dir ? '📁 ' : '📄 '}
            {n}
          </T>
        </g>
      ))}
    </Svg>
  );
}

function Pipes() {
  const stages = [
    ['cat server.log', '500 lines'],
    ['grep ERROR', '12 lines'],
    ['sort', 'sorted'],
    ['wc -l', '12'],
  ];
  return (
    <Svg w={680} h={180} caption="Each | connects one program's stdout to the next program's stdin.">
      {stages.map(([c, out], i) => (
        <g key={c}>
          <Box x={10 + i * 170} y={60} w={140} h={50} label={c} color={[C.blue, C.amber, C.purple, C.green][i]} fs={13} />
          {i < 3 && (
            <>
              <Arrow x1={150 + i * 170} y1={85} x2={178 + i * 170} y2={85} />
              <T x={164 + i * 170} y={60} bold size={18}>|</T>
            </>
          )}
          <T x={80 + i * 170} y={135} size={11} color="var(--ill-muted)">{out}</T>
        </g>
      ))}
      <Packet path="M150,85 L180,85 M320,85 L350,85 M490,85 L520,85" dur={1.5} r={5} />
    </Svg>
  );
}

function Permissions() {
  const groups: [string, string, string][] = [
    ['user (owner)', 'rwx', C.blue],
    ['group', 'r-x', C.purple],
    ['others', 'r-x', C.slate],
  ];
  return (
    <Svg w={600} h={220} caption="-rwxr-xr-x = 755: the owner can do everything, everyone else can read and execute.">
      <T x={300} y={30} size={22} bold mono>- rwx r-x r-x</T>
      {groups.map(([g, p, col], i) => {
        const val = [...p].reduce((a, c, j) => a + (c !== '-' ? [4, 2, 1][j] : 0), 0);
        return (
          <g key={g}>
            <Box x={40 + i * 180} y={60} w={160} h={70} label={p} sub={g} color={col} fs={20} />
            <T x={120 + i * 180} y={160} size={13}>{[...p].map((c, j) => (c !== '-' ? [4, 2, 1][j] : 0)).join(' + ')} = <tspan fontWeight={700}>{val}</tspan></T>
          </g>
        );
      })}
      <T x={300} y={205} size={13} color="var(--ill-muted)">r = 4 · w = 2 · x = 1</T>
    </Svg>
  );
}

// ---------- Git ----------
function GitAreas() {
  return (
    <Svg w={680} h={200} caption="git add moves changes to staging; git commit snapshots them into history; git push uploads them.">
      <Box x={10} y={60} w={140} h={70} label="Working dir" sub="your edits" color={C.red} />
      <Box x={190} y={60} w={140} h={70} label="Staging area" sub="next commit" color={C.amber} />
      <Box x={370} y={60} w={140} h={70} label="Local repo" sub=".git history" color={C.green} />
      <Box x={550} y={60} w={120} h={70} label="Remote" sub="GitHub" color={C.blue} />
      <Arrow x1={150} y1={85} x2={188} y2={85} label="add" />
      <Arrow x1={330} y1={85} x2={368} y2={85} label="commit" />
      <Arrow x1={510} y1={85} x2={548} y2={85} label="push" />
      <Arrow x1={548} y1={115} x2={152} y2={115} curve={-60} label="pull / clone" dashed />
    </Svg>
  );
}

function GitGraph() {
  const main = [60, 160, 260, 460, 560];
  return (
    <Svg w={640} h={200} caption="A feature branch splits from main, gets its own commits, and is merged back.">
      <line x1={60} y1={60} x2={560} y2={60} stroke={C.blue} strokeWidth={4} />
      <path d="M160,60 C200,140 230,140 300,140 L380,140 C420,140 440,80 460,60" stroke={C.pink} strokeWidth={4} fill="none" />
      {main.map((x, i) => (
        <circle key={x} cx={x} cy={60} r={13} fill={i === 3 ? C.purple : C.blue} stroke="var(--bg)" strokeWidth={3} />
      ))}
      {[300, 380].map((x) => (
        <circle key={x} cx={x} cy={140} r={13} fill={C.pink} stroke="var(--bg)" strokeWidth={3} />
      ))}
      <T x={60} y={35} bold color={C.blue}>main</T>
      <T x={340} y={180} bold color={C.pink}>feature/login</T>
      <T x={460} y={35} size={12}>merge commit</T>
      <T x={580} y={64} anchor="start" size={12} bold>← HEAD</T>
    </Svg>
  );
}

// ---------- DSA ----------
function LinkedList() {
  return (
    <Svg w={680} h={230} caption="Array: contiguous boxes, so jumping to index i is instant. Linked list: nodes scattered in memory, chained by pointers.">
      <T x={20} y={25} anchor="start" bold>Array</T>
      {[12, 7, 31, 4, 19].map((v, i) => (
        <g key={i}>
          <Box x={20 + i * 70} y={35} w={70} h={45} r={0} label={v} color={C.blue} />
          <T x={55 + i * 70} y={98} size={11} color="var(--ill-muted)">[{i}] 0x{(100 + i * 4).toString(16)}</T>
        </g>
      ))}
      <T x={20} y={140} anchor="start" bold>Linked list</T>
      {[12, 7, 31, 4].map((v, i) => (
        <g key={i}>
          <Box x={20 + i * 160} y={155 + (i % 2) * 20} w={60} h={40} r={4} label={v} color={C.purple} />
          <Box x={80 + i * 160} y={155 + (i % 2) * 20} w={36} h={40} r={4} label="•" color={C.pink} />
          {i < 3 ? <Arrow x1={98 + i * 160} y1={175 + (i % 2) * 20} x2={178 + i * 160} y2={175 + ((i + 1) % 2) * 20} /> : <T x={140 + i * 160} y={200} size={12}>None</T>}
        </g>
      ))}
    </Svg>
  );
}

// ---------- Systems ----------
function Memory() {
  return (
    <Svg w={600} h={320} caption="A process's memory: code and globals at the bottom; the heap grows up; the stack grows down.">
      <Box x={150} y={10} w={260} h={70} label="Stack ↓" sub="frames, local variables" color={C.blue} r={2} />
      <Box x={150} y={80} w={260} h={60} label="⋮ free space ⋮" color={C.slate} r={2} />
      <Box x={150} y={140} w={260} h={70} label="Heap ↑" sub="malloc / new / objects" color={C.purple} r={2} />
      <Box x={150} y={210} w={260} h={45} label="Globals / static data" color={C.amber} r={2} fs={13} />
      <Box x={150} y={255} w={260} h={45} label="Code (text)" color={C.green} r={2} fs={13} />
      <T x={140} y={20} anchor="end" size={11} color="var(--ill-muted)">high address</T>
      <T x={140} y={300} anchor="end" size={11} color="var(--ill-muted)">low address</T>
      <Box x={440} y={25} w={140} h={40} label="int *p" fs={13} color={C.blue} />
      <Arrow x1={440} y1={50} x2={412} y2={170} label="points to" />
    </Svg>
  );
}

function Threads() {
  return (
    <Svg w={640} h={250} caption="Processes are isolated from each other; threads inside one process share its memory.">
      {[0, 1].map((p) => (
        <g key={p}>
          <Box x={20 + p * 320} y={20} w={290} h={210} color={p ? C.purple : C.blue} />
          <T x={165 + p * 320} y={45} bold>Process {p + 1} (PID {4200 + p})</T>
          <Box x={40 + p * 320} y={60} w={250} h={50} label="shared heap & globals" color={C.amber} fs={13} />
          {[0, 1, 2].map((t) => (
            <g key={t}>
              <Box x={45 + t * 82 + p * 320} y={140} w={72} h={70} label={`T${t + 1}`} sub="own stack" color={C.green} fs={14} />
              <Arrow x1={81 + t * 82 + p * 320} y1={138} x2={120 + t * 40 + p * 320} y2={112} />
            </g>
          ))}
        </g>
      ))}
    </Svg>
  );
}

function Osi() {
  const layers: [string, string, string][] = [
    ['Application', 'HTTP: GET /index.html', C.pink],
    ['Transport', 'TCP header: ports 51000 → 443', C.purple],
    ['Internet', 'IP header: 10.0.0.5 → 93.184.216.34', C.blue],
    ['Link', 'Ethernet/Wi-Fi frame: MAC addresses', C.slate],
  ];
  return (
    <Svg w={640} h={260} caption="Going down the stack each layer wraps the data in its own header (encapsulation); the receiver unwraps in reverse.">
      {layers.map(([n, d, col], i) => (
        <g key={n}>
          <Box x={20 + i * 25} y={15 + i * 60} w={600 - i * 50} h={48} color={col} />
          <T x={40 + i * 25} y={44 + i * 60} anchor="start" bold>{n}</T>
          <T x={600 - i * 25} y={44 + i * 60} anchor="end" size={12} mono>{d}</T>
        </g>
      ))}
    </Svg>
  );
}

function Tcp() {
  const steps: [string, number, number][] = [
    ['SYN', 0, 1],
    ['SYN-ACK', 1, 0],
    ['ACK', 0, 1],
    ['data ↔', 0, 1],
  ];
  return (
    <Svg w={560} h={280} caption="TCP's three-way handshake sets up a reliable connection before any data flows.">
      <Box x={30} y={10} w={120} h={40} label="💻 Client" color={C.blue} />
      <Box x={410} y={10} w={120} h={40} label="🖥️ Server" color={C.green} />
      <line x1={90} y1={50} x2={90} y2={270} stroke="var(--ill-line)" strokeDasharray="4 4" />
      <line x1={470} y1={50} x2={470} y2={270} stroke="var(--ill-line)" strokeDasharray="4 4" />
      {steps.map(([l, from, to], i) => (
        <Arrow key={l} x1={from ? 470 : 90} y1={75 + i * 50} x2={to ? 468 : 92} y2={105 + i * 50} label={`${i + 1}. ${l}`} color={i === 3 ? C.green : undefined} />
      ))}
    </Svg>
  );
}

function Dns() {
  return (
    <Svg w={660} h={280} caption="The resolver walks the DNS hierarchy (root → TLD → authoritative), then caches the answer.">
      <Box x={10} y={110} w={110} h={50} label="💻 You" color={C.blue} />
      <Box x={180} y={110} w={130} h={50} label="Resolver" sub="1.1.1.1 · caches" color={C.amber} />
      <Box x={420} y={10} w={220} h={50} label="Root ( . )" sub="ask .dev servers" color={C.slate} />
      <Box x={420} y={110} w={220} h={50} label="TLD ( .dev )" sub="ask devquest.dev's NS" color={C.purple} />
      <Box x={420} y={210} w={220} h={50} label="Authoritative" sub="A 203.0.113.7" color={C.green} />
      <Arrow x1={120} y1={128} x2={178} y2={128} label="1" />
      <Arrow x1={310} y1={115} x2={418} y2={40} label="2" />
      <Arrow x1={310} y1={135} x2={418} y2={135} label="3" />
      <Arrow x1={310} y1={155} x2={418} y2={230} label="4" />
      <Arrow x1={178} y1={150} x2={122} y2={150} label="5. IP" color={C.green} />
    </Svg>
  );
}

function Http() {
  return (
    <Svg w={680} h={260} caption="An HTTP exchange: a request with method, path and headers; a response with status, headers and body.">
      <Box x={10} y={20} w={290} h={220} color={C.blue} />
      <T x={25} y={45} anchor="start" bold>Request →</T>
      {['GET /api/users/42 HTTP/1.1', 'Host: api.example.com', 'Accept: application/json', 'Authorization: Bearer eyJ…'].map((l, i) => (
        <T key={l} x={25} y={75 + i * 24} anchor="start" size={12} mono>{l}</T>
      ))}
      <Box x={380} y={20} w={290} h={220} color={C.green} />
      <T x={395} y={45} anchor="start" bold>← Response</T>
      {['HTTP/1.1 200 OK', 'Content-Type: application/json', 'Cache-Control: max-age=60', '', '{ "id": 42, "name": "Ada" }'].map((l, i) => (
        <T key={i} x={395} y={75 + i * 24} anchor="start" size={12} mono>{l}</T>
      ))}
      <Arrow x1={300} y1={90} x2={378} y2={90} />
      <Arrow x1={378} y1={170} x2={302} y2={170} />
      <Packet path="M300,90 L380,90 M380,170 L300,170" dur={2} />
    </Svg>
  );
}

function Join() {
  return (
    <Svg w={680} h={240} caption="JOIN matches rows where orders.user_id = users.id. LEFT JOIN also keeps users with no orders (NULL).">
      <Box x={10} y={20} w={190} h={190} color={C.blue} />
      <T x={105} y={42} bold>users</T>
      {['1 Ada', '2 Linus', '3 Grace', '4 Alan'].map((r, i) => (
        <T key={r} x={30} y={75 + i * 32} anchor="start" mono size={13}>{r}</T>
      ))}
      <Box x={250} y={20} w={190} h={190} color={C.purple} />
      <T x={345} y={42} bold>orders</T>
      {['user 1 Keyboard', 'user 1 Monitor', 'user 2 Mouse', 'user 3 Laptop'].map((r, i) => (
        <T key={r} x={268} y={75 + i * 32} anchor="start" mono size={12}>{r}</T>
      ))}
      <Arrow x1={110} y1={72} x2={265} y2={72} color={C.green} />
      <Arrow x1={110} y1={72} x2={265} y2={104} color={C.green} />
      <Arrow x1={125} y1={104} x2={265} y2={136} color={C.green} />
      <Arrow x1={125} y1={136} x2={265} y2={168} color={C.green} />
      <Box x={480} y={20} w={190} h={190} color={C.green} />
      <T x={575} y={42} bold>LEFT JOIN result</T>
      {['Ada Keyboard', 'Ada Monitor', 'Linus Mouse', 'Grace Laptop', 'Alan NULL'].map((r, i) => (
        <T key={r} x={495} y={72 + i * 28} anchor="start" mono size={12} color={i === 4 ? C.red : undefined}>{r}</T>
      ))}
    </Svg>
  );
}

// ---------- Ops ----------
function Docker() {
  return (
    <Svg w={680} h={270} caption="VMs each carry a full guest OS. Containers share the host kernel, so they're far lighter.">
      <T x={170} y={20} bold>Virtual machines</T>
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <Box x={20 + i * 100} y={30} w={90} h={34} label={`App ${i + 1}`} fs={12} color={C.blue} r={4} />
          <Box x={20 + i * 100} y={66} w={90} h={34} label="Guest OS" fs={11} color={C.red} r={4} />
        </g>
      ))}
      <Box x={20} y={104} w={290} h={34} label="Hypervisor" fs={12} color={C.purple} r={4} />
      <Box x={20} y={142} w={290} h={34} label="Host OS / hardware" fs={12} color={C.slate} r={4} />
      <T x={510} y={20} bold>Containers</T>
      {[0, 1, 2, 3].map((i) => (
        <Box key={i} x={370 + i * 75} y={30} w={68} h={70} label={`App ${i + 1}`} sub="+ libs" fs={12} color={C.cyan} r={4} />
      ))}
      <Box x={370} y={104} w={293} h={34} label="Container runtime (Docker)" fs={12} color={C.blue} r={4} />
      <Box x={370} y={142} w={293} h={34} label="Host OS kernel / hardware" fs={12} color={C.slate} r={4} />
      <T x={165} y={210} size={12} color="var(--ill-muted)">GBs each · boots in minutes</T>
      <T x={515} y={210} size={12} color="var(--ill-muted)">MBs each · starts in ms</T>
    </Svg>
  );
}

function K8s() {
  return (
    <Svg w={680} h={270} caption="Traffic enters through a Service that load-balances across pods; the control plane keeps replicas running.">
      <Box x={250} y={10} w={180} h={50} label="Control plane" sub="desired state: 3 replicas" color={C.purple} />
      <Box x={10} y={120} w={120} h={50} label="🌍 Users" color={C.blue} />
      <Box x={170} y={120} w={120} h={50} label="Service" sub="load balancer" color={C.amber} />
      {[0, 1].map((n) => (
        <g key={n}>
          <Box x={340 + n * 170} y={80} w={160} h={170} color={C.slate} />
          <T x={420 + n * 170} y={100} bold size={12}>Node {n + 1}</T>
        </g>
      ))}
      {[[350, 115], [350, 180], [520, 115]].map(([x, y], i) => (
        <Box key={i} x={x} y={y} w={140} h={50} label={`📦 Pod ${i + 1}`} sub="web:1.4" color={C.green} fs={13} />
      ))}
      <Arrow x1={130} y1={145} x2={168} y2={145} />
      <Arrow x1={290} y1={140} x2={348} y2={140} />
      <Arrow x1={290} y1={150} x2={348} y2={200} />
      <Arrow x1={290} y1={130} x2={518} y2={135} curve={40} />
      <Arrow x1={340} y1={60} x2={400} y2={80} dashed />
      <Packet path="M130,145 L290,145 L350,200" dur={2.5} />
      <Packet path="M130,145 L290,145 L350,140" dur={2.5} delay={0.8} color={C.cyan} />
    </Svg>
  );
}

function Pipeline() {
  const steps: [string, string][] = [
    ['git push', '👩‍💻'],
    ['Build', '🔨'],
    ['Test', '🧪'],
    ['Security scan', '🛡️'],
    ['Deploy staging', '🚦'],
    ['Deploy prod', '🚀'],
  ];
  return (
    <Svg w={680} h={150} caption="A CI/CD pipeline: every push flows through automated stages. A failure stops it before production.">
      {steps.map(([s, e], i) => (
        <g key={s}>
          <Box x={5 + i * 113} y={45} w={100} h={60} label={e} sub={s} color={[C.slate, C.blue, C.green, C.amber, C.purple, C.pink][i]} fs={20} />
          {i < steps.length - 1 && <Arrow x1={105 + i * 113} y1={75} x2={116 + i * 113} y2={75} />}
        </g>
      ))}
      <Packet path="M55,75 L620,75" dur={4} />
    </Svg>
  );
}

function SysDesign() {
  return (
    <Svg w={680} h={330} caption="A classic scalable web architecture.">
      <Box x={10} y={135} w={100} h={50} label="👥 Clients" color={C.blue} />
      <Box x={140} y={30} w={110} h={46} label="CDN" sub="static files" color={C.cyan} />
      <Box x={140} y={135} w={110} h={50} label="Load balancer" fs={13} color={C.amber} />
      {[0, 1, 2].map((i) => (
        <Box key={i} x={290} y={80 + i * 60} w={110} h={44} label={`App server ${i + 1}`} fs={12} color={C.green} />
      ))}
      <Box x={450} y={30} w={100} h={46} label="Cache" sub="Redis" color={C.red} />
      <Box x={450} y={135} w={100} h={50} label="DB primary" fs={13} color={C.purple} />
      <Box x={580} y={110} w={90} h={36} label="replica" fs={12} color={C.purple} />
      <Box x={580} y={155} w={90} h={36} label="replica" fs={12} color={C.purple} />
      <Box x={450} y={250} w={100} h={46} label="Queue" sub="Kafka/SQS" color={C.pink} />
      <Box x={580} y={250} w={90} h={46} label="Workers" fs={12} color={C.slate} />
      <Arrow x1={110} y1={150} x2={140} y2={70} />
      <Arrow x1={110} y1={160} x2={138} y2={160} />
      <Arrow x1={250} y1={160} x2={288} y2={102} />
      <Arrow x1={250} y1={160} x2={288} y2={162} />
      <Arrow x1={250} y1={160} x2={288} y2={222} />
      <Arrow x1={400} y1={102} x2={448} y2={60} />
      <Arrow x1={400} y1={162} x2={448} y2={160} />
      <Arrow x1={400} y1={222} x2={448} y2={268} />
      <Arrow x1={550} y1={160} x2={578} y2={130} dashed />
      <Arrow x1={550} y1={160} x2={578} y2={172} dashed />
      <Arrow x1={550} y1={273} x2={578} y2={273} />
      <Packet path="M110,160 L250,160 L290,162 L450,160" dur={3} />
    </Svg>
  );
}

function LangMap() {
  const langs: [string, number, number, string][] = [
    ['C', 60, 260, C.slate], ['Rust', 130, 230, C.red], ['C++', 70, 200, C.blue], ['Go', 250, 190, C.cyan], ['Java', 330, 170, C.amber], ['C#', 380, 200, C.purple],
    ['Kotlin', 420, 150, C.pink], ['Swift', 300, 120, C.amber], ['TypeScript', 480, 110, C.blue], ['Python', 560, 60, C.green], ['JavaScript', 580, 140, C.amber], ['Ruby', 610, 90, C.red], ['PHP', 520, 175, C.purple],
  ];
  return (
    <Svg w={680} h={300} caption="Rough map: closer to the hardware (left/bottom) vs. higher-level and faster to write (right/top).">
      <Arrow x1={30} y1={285} x2={670} y2={285} />
      <Arrow x1={30} y1={285} x2={30} y2={15} />
      <T x={660} y={278} anchor="end" size={11} color="var(--ill-muted)">higher-level, more productive →</T>
      <T x={38} y={22} anchor="start" size={11} color="var(--ill-muted)">↑ easier to learn</T>
      {langs.map(([n, x, y, col]) => (
        <g key={n}>
          <circle cx={x} cy={y} r={30} fill={col} fillOpacity={0.2} stroke={col} strokeWidth={2} />
          <T x={x} y={y + 4} size={12} bold>{n}</T>
        </g>
      ))}
    </Svg>
  );
}

function Neural() {
  const layers = [3, 4, 4, 2];
  const pos = (l: number, n: number) => [80 + l * 170, 150 + (n - (layers[l] - 1) / 2) * 60] as const;
  return (
    <Svg w={680} h={300} caption="Inputs flow forward through weighted connections; training adjusts the weights via backpropagation.">
      {layers.slice(0, -1).flatMap((count, l) =>
        Array.from({ length: count }, (_, a) =>
          Array.from({ length: layers[l + 1] }, (_, b) => {
            const [x1, y1] = pos(l, a);
            const [x2, y2] = pos(l + 1, b);
            return <line key={`${l}-${a}-${b}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--ill-line)" strokeOpacity={0.4} />;
          }),
        ),
      )}
      {layers.flatMap((count, l) =>
        Array.from({ length: count }, (_, n) => {
          const [x, y] = pos(l, n);
          const col = [C.blue, C.purple, C.purple, C.green][l];
          return <circle key={`${l}-${n}`} cx={x} cy={y} r={18} fill={col} fillOpacity={0.3} stroke={col} strokeWidth={2} style={{ animation: `pulse 2s ${l * 0.4}s infinite` }} />;
        }),
      )}
      {['input', 'hidden', 'hidden', 'output'].map((n, l) => (
        <T key={l} x={80 + l * 170} y={290} size={12} color="var(--ill-muted)">{n}</T>
      ))}
    </Svg>
  );
}

export const ILLUSTRATIONS: Record<string, () => ReactElement> = {
  computer: Computer,
  binary: Binary,
  compile: Compile,
  'os-layers': OsLayers,
  flowchart: Flowchart,
  internet: Internet,
  variables: Variables,
  branch: Branch,
  loop: Loop,
  hashmap: HashMap,
  callstack: CallStack,
  oop: Oop,
  recursion: Recursion,
  eventloop: EventLoop,
  shell: ShellIll,
  filetree: FileTree,
  pipes: Pipes,
  permissions: Permissions,
  gitareas: GitAreas,
  gitgraph: GitGraph,
  linkedlist: LinkedList,
  memory: Memory,
  threads: Threads,
  osi: Osi,
  tcp: Tcp,
  dns: Dns,
  http: Http,
  join: Join,
  docker: Docker,
  k8s: K8s,
  pipeline: Pipeline,
  sysdesign: SysDesign,
  langmap: LangMap,
  neural: Neural,
};
