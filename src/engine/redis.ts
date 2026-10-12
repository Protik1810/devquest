/**
 * DevQuest's Redis practice engine: an in-memory Redis that runs redis-cli style scripts (one command per line)
 * and prints replies the way redis-cli does: OK, (integer) 3, "value", (nil), 1) "a" … Lines starting with #
 * are comments (a DevQuest convenience). Time is simulated: keys expire against a virtual clock that
 * `DEBUG SLEEP <seconds>` moves forward (on a real server that command blocks it for that long).
 * Sets are printed sorted so lesson output is deterministic (real Redis returns set members in any order).
 */

type Value =
  | { t: 'string'; v: string }
  | { t: 'list'; v: string[] }
  | { t: 'hash'; v: Map<string, string> }
  | { t: 'set'; v: Set<string> }
  | { t: 'zset'; v: Map<string, number> }
  | { t: 'stream'; v: { id: string; fields: string[] }[] };

type Reply = { k: 'status'; v: string } | { k: 'int'; v: number } | { k: 'bulk'; v: string | null } | { k: 'array'; v: Reply[] } | { k: 'error'; v: string };

const ok: Reply = { k: 'status', v: 'OK' };
const int = (v: number): Reply => ({ k: 'int', v });
const bulk = (v: string | null): Reply => ({ k: 'bulk', v });
const arr = (v: (string | null)[]): Reply => ({ k: 'array', v: v.map(bulk) });
class RedisError extends Error {}
const WRONGTYPE = 'WRONGTYPE Operation against a key holding the wrong kind of value';

/** Redis formats doubles without a trailing ".0" (e.g. 100, 1.5). */
const fmtNum = (n: number) => (Number.isInteger(n) ? String(n) : String(Number(n.toPrecision(17))));

export class RedisEngine {
  private data = new Map<string, Value>();
  private expires = new Map<string, number>();
  private queue: string[][] | null = null;
  /** Virtual clock (ms), starting 2026-01-01T00:00:00Z. */
  now = Date.UTC(2026, 0, 1);
  private streamSeq = 0;
  private lastStreamMs = 0;

  private alive(key: string) {
    const exp = this.expires.get(key);
    if (exp !== undefined && exp <= this.now) {
      this.data.delete(key);
      this.expires.delete(key);
    }
    return this.data.get(key);
  }

  private get<T extends Value['t']>(key: string, t: T): Extract<Value, { t: T }> | undefined {
    const v = this.alive(key);
    if (v && v.t !== t) throw new RedisError(WRONGTYPE);
    return v as Extract<Value, { t: T }> | undefined;
  }

  private getOrCreate<T extends Value['t']>(key: string, t: T, make: () => Extract<Value, { t: T }>['v']) {
    const v = this.get(key, t);
    if (v) return v;
    const created = { t, v: make() } as unknown as Extract<Value, { t: T }>;
    this.data.set(key, created);
    return created;
  }

  private cleanup(key: string) {
    const v = this.data.get(key);
    if (!v) return;
    const size = v.t === 'string' ? 1 : v.t === 'list' || v.t === 'stream' ? v.v.length : v.v.size;
    if (size === 0) {
      this.data.delete(key);
      this.expires.delete(key);
    }
  }

  private intArg(s: string | undefined) {
    if (s === undefined || !/^-?\d+$/.test(s)) throw new RedisError('ERR value is not an integer or out of range');
    return Number(s);
  }

  private floatArg(s: string | undefined) {
    const n = s === '+inf' ? Infinity : s === '-inf' ? -Infinity : Number(s);
    if (s === undefined || Number.isNaN(n)) throw new RedisError('ERR value is not a valid float');
    return n;
  }

  private range<T>(items: T[], start: number, stop: number) {
    const n = items.length;
    let a = start < 0 ? n + start : start;
    let b = stop < 0 ? n + stop : stop;
    a = Math.max(0, a);
    b = Math.min(n - 1, b);
    return a > b ? [] : items.slice(a, b + 1);
  }

  private sortedZ(key: string) {
    const z = this.get(key, 'zset');
    return z ? [...z.v.entries()].sort((x, y) => x[1] - y[1] || (x[0] < y[0] ? -1 : x[0] > y[0] ? 1 : 0)) : [];
  }

  private scoreBound(s: string) {
    const excl = s.startsWith('(');
    const n = this.floatArg(excl ? s.slice(1) : s);
    return { n, excl };
  }

  private globToRe(p: string) {
    return new RegExp('^' + p.replace(/[.+^${}()|\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.').replace(/\[!/g, '[^') + '$');
  }

  /** Execute one parsed command and return its reply. */
  exec(argv: string[]): Reply {
    const cmd = argv[0]?.toUpperCase() ?? '';
    const a = argv.slice(1);
    if (this.queue && !['EXEC', 'DISCARD', 'MULTI'].includes(cmd)) {
      this.queue.push(argv);
      return { k: 'status', v: 'QUEUED' };
    }
    const need = (n: number, max = Infinity) => {
      if (a.length < n || a.length > max) throw new RedisError(`ERR wrong number of arguments for '${argv[0].toLowerCase()}' command`);
    };
    switch (cmd) {
      case 'PING': return { k: 'status', v: a[0] ?? 'PONG' };
      case 'ECHO': need(1, 1); return bulk(a[0]);
      case 'DBSIZE': [...this.data.keys()].forEach((k) => this.alive(k)); return int(this.data.size);
      case 'FLUSHALL': case 'FLUSHDB': this.data.clear(); this.expires.clear(); return ok;
      case 'DEBUG':
        if (a[0]?.toUpperCase() === 'SLEEP') { need(2, 2); this.now += Math.round(this.floatArg(a[1]) * 1000); return ok; }
        throw new RedisError('ERR DEBUG subcommand not supported here (only DEBUG SLEEP)');

      // ---------- keys ----------
      case 'DEL': case 'UNLINK': need(1); return int(a.filter((k) => this.alive(k) && this.data.delete(k) && (this.expires.delete(k) || true)).length);
      case 'EXISTS': need(1); return int(a.filter((k) => this.alive(k)).length);
      case 'TYPE': need(1, 1); return { k: 'status', v: this.alive(a[0])?.t ?? 'none' };
      case 'KEYS': {
        need(1, 1);
        const re = this.globToRe(a[0]);
        return arr([...this.data.keys()].filter((k) => this.alive(k) && re.test(k)).sort());
      }
      case 'RENAME': {
        need(2, 2);
        const v = this.alive(a[0]);
        if (!v) throw new RedisError('ERR no such key');
        const exp = this.expires.get(a[0]);
        this.data.delete(a[0]); this.expires.delete(a[0]);
        this.data.set(a[1], v); this.expires.delete(a[1]);
        if (exp !== undefined) this.expires.set(a[1], exp);
        return ok;
      }
      case 'EXPIRE': case 'PEXPIRE': {
        need(2, 3);
        if (!this.alive(a[0])) return int(0);
        const ms = this.intArg(a[1]) * (cmd === 'EXPIRE' ? 1000 : 1);
        const opt = a[2]?.toUpperCase();
        const has = this.expires.has(a[0]);
        if ((opt === 'NX' && has) || (opt === 'XX' && !has)) return int(0);
        this.expires.set(a[0], this.now + ms);
        this.alive(a[0]);
        return int(1);
      }
      case 'TTL': case 'PTTL': {
        need(1, 1);
        if (!this.alive(a[0])) return int(-2);
        const exp = this.expires.get(a[0]);
        if (exp === undefined) return int(-1);
        // Like Redis: TTL rounds the remaining milliseconds to the nearest second
        return int(cmd === 'TTL' ? Math.floor((exp - this.now + 500) / 1000) : exp - this.now);
      }
      case 'PERSIST': need(1, 1); return int(this.alive(a[0]) && this.expires.delete(a[0]) ? 1 : 0);

      // ---------- strings ----------
      case 'SET': {
        need(2);
        let px: number | null = null;
        let nx = false, xx = false, keepttl = false, get = false;
        for (let i = 2; i < a.length; i++) {
          const o = a[i].toUpperCase();
          if (o === 'EX') px = this.intArg(a[++i]) * 1000;
          else if (o === 'PX') px = this.intArg(a[++i]);
          else if (o === 'NX') nx = true;
          else if (o === 'XX') xx = true;
          else if (o === 'KEEPTTL') keepttl = true;
          else if (o === 'GET') get = true;
          else throw new RedisError('ERR syntax error');
        }
        const prev = this.alive(a[0]);
        if (get && prev && prev.t !== 'string') throw new RedisError(WRONGTYPE);
        const old = prev?.t === 'string' ? prev.v : null;
        if ((nx && prev) || (xx && !prev)) return get ? bulk(old) : bulk(null);
        this.data.set(a[0], { t: 'string', v: a[1] });
        if (px !== null) this.expires.set(a[0], this.now + px);
        else if (!keepttl) this.expires.delete(a[0]);
        return get ? bulk(old) : ok;
      }
      case 'SETNX': need(2, 2); return this.alive(a[0]) ? int(0) : (this.exec(['SET', a[0], a[1]]), int(1));
      case 'SETEX': need(3, 3); return this.exec(['SET', a[0], a[2], 'EX', a[1]]);
      case 'GET': need(1, 1); return bulk(this.get(a[0], 'string')?.v ?? null);
      case 'GETDEL': { need(1, 1); const v = this.get(a[0], 'string')?.v ?? null; if (v !== null) this.exec(['DEL', a[0]]); return bulk(v); }
      case 'MSET': need(2); for (let i = 0; i + 1 < a.length; i += 2) this.exec(['SET', a[i], a[i + 1]]); return ok;
      case 'MGET': need(1); return arr(a.map((k) => { const v = this.alive(k); return v?.t === 'string' ? v.v : null; }));
      case 'APPEND': { need(2, 2); const s = this.getOrCreate(a[0], 'string', () => ''); s.v += a[1]; return int(s.v.length); }
      case 'STRLEN': need(1, 1); return int(this.get(a[0], 'string')?.v.length ?? 0);
      case 'INCR': case 'DECR': case 'INCRBY': case 'DECRBY': {
        need(cmd.endsWith('BY') ? 2 : 1, cmd.endsWith('BY') ? 2 : 1);
        const s = this.get(a[0], 'string');
        const cur = s ? s.v : '0';
        if (!/^-?\d+$/.test(cur)) throw new RedisError('ERR value is not an integer or out of range');
        const by = cmd === 'INCR' ? 1 : cmd === 'DECR' ? -1 : cmd === 'INCRBY' ? this.intArg(a[1]) : -this.intArg(a[1]);
        const next = Number(cur) + by;
        if (s) s.v = String(next);
        else this.data.set(a[0], { t: 'string', v: String(next) });
        return int(next);
      }
      case 'INCRBYFLOAT': {
        need(2, 2);
        const s = this.get(a[0], 'string');
        const next = Number(s?.v ?? 0) + this.floatArg(a[1]);
        if (s) s.v = fmtNum(next);
        else this.data.set(a[0], { t: 'string', v: fmtNum(next) });
        return bulk(fmtNum(next));
      }

      // ---------- lists ----------
      case 'LPUSH': case 'RPUSH': {
        need(2);
        const l = this.getOrCreate(a[0], 'list', () => []);
        for (const x of a.slice(1)) if (cmd === 'LPUSH') l.v.unshift(x); else l.v.push(x);
        return int(l.v.length);
      }
      case 'LPOP': case 'RPOP': {
        need(1, 2);
        const l = this.get(a[0], 'list');
        if (!l) return a[1] ? { k: 'array', v: [] } : bulk(null);
        if (a[1] !== undefined) {
          const n = this.intArg(a[1]);
          const out = cmd === 'LPOP' ? l.v.splice(0, n) : l.v.splice(Math.max(0, l.v.length - n)).reverse();
          this.cleanup(a[0]);
          return arr(out);
        }
        const v = cmd === 'LPOP' ? l.v.shift()! : l.v.pop()!;
        this.cleanup(a[0]);
        return bulk(v);
      }
      case 'BLPOP': case 'BRPOP': {
        need(2);
        for (const k of a.slice(0, -1)) {
          const l = this.get(k, 'list');
          if (l?.v.length) {
            const v = cmd === 'BLPOP' ? l.v.shift()! : l.v.pop()!;
            this.cleanup(k);
            return arr([k, v]);
          }
        }
        return { k: 'bulk', v: null };
      }
      case 'LMOVE': {
        need(4, 4);
        const from = a[2].toUpperCase();
        const to = a[3].toUpperCase();
        const src = this.get(a[0], 'list');
        if (!src?.v.length) return bulk(null);
        const v = from === 'LEFT' ? src.v.shift()! : src.v.pop()!;
        this.cleanup(a[0]);
        const dst = this.getOrCreate(a[1], 'list', () => []);
        if (to === 'LEFT') dst.v.unshift(v);
        else dst.v.push(v);
        return bulk(v);
      }
      case 'LRANGE': need(3, 3); return arr(this.range(this.get(a[0], 'list')?.v ?? [], this.intArg(a[1]), this.intArg(a[2])));
      case 'LLEN': need(1, 1); return int(this.get(a[0], 'list')?.v.length ?? 0);
      case 'LINDEX': { need(2, 2); const l = this.get(a[0], 'list')?.v ?? []; const i = this.intArg(a[1]); return bulk(l[i < 0 ? l.length + i : i] ?? null); }
      case 'LTRIM': { need(3, 3); const l = this.get(a[0], 'list'); if (l) { l.v = this.range(l.v, this.intArg(a[1]), this.intArg(a[2])); this.cleanup(a[0]); } return ok; }
      case 'LREM': {
        need(3, 3);
        const l = this.get(a[0], 'list');
        if (!l) return int(0);
        let count = this.intArg(a[1]);
        let removed = 0;
        const order = count < 0 ? [...l.v.keys()].reverse() : [...l.v.keys()];
        const drop = new Set<number>();
        for (const i of order) if (l.v[i] === a[2] && (count === 0 || removed < Math.abs(count))) { drop.add(i); removed++; }
        l.v = l.v.filter((_, i) => !drop.has(i));
        count = removed;
        this.cleanup(a[0]);
        return int(count);
      }
      case 'LSET': {
        need(3, 3);
        const l = this.get(a[0], 'list');
        if (!l) throw new RedisError('ERR no such key');
        const i = this.intArg(a[1]);
        const idx = i < 0 ? l.v.length + i : i;
        if (idx < 0 || idx >= l.v.length) throw new RedisError('ERR index out of range');
        l.v[idx] = a[2];
        return ok;
      }

      // ---------- hashes ----------
      case 'HSET': case 'HMSET': {
        need(3);
        if ((a.length - 1) % 2) throw new RedisError(`ERR wrong number of arguments for '${argv[0].toLowerCase()}' command`);
        const h = this.getOrCreate(a[0], 'hash', () => new Map());
        let added = 0;
        for (let i = 1; i < a.length; i += 2) { if (!h.v.has(a[i])) added++; h.v.set(a[i], a[i + 1]); }
        return cmd === 'HMSET' ? ok : int(added);
      }
      case 'HSETNX': { need(3, 3); const h = this.getOrCreate(a[0], 'hash', () => new Map()); if (h.v.has(a[1])) return int(0); h.v.set(a[1], a[2]); return int(1); }
      case 'HGET': need(2, 2); return bulk(this.get(a[0], 'hash')?.v.get(a[1]) ?? null);
      case 'HMGET': { need(2); const h = this.get(a[0], 'hash'); return arr(a.slice(1).map((f) => h?.v.get(f) ?? null)); }
      case 'HGETALL': { need(1, 1); const h = this.get(a[0], 'hash'); return arr(h ? [...h.v.entries()].flat() : []); }
      case 'HKEYS': need(1, 1); return arr([...(this.get(a[0], 'hash')?.v.keys() ?? [])]);
      case 'HVALS': need(1, 1); return arr([...(this.get(a[0], 'hash')?.v.values() ?? [])]);
      case 'HLEN': need(1, 1); return int(this.get(a[0], 'hash')?.v.size ?? 0);
      case 'HEXISTS': need(2, 2); return int(this.get(a[0], 'hash')?.v.has(a[1]) ? 1 : 0);
      case 'HDEL': { need(2); const h = this.get(a[0], 'hash'); if (!h) return int(0); const n = a.slice(1).filter((f) => h.v.delete(f)).length; this.cleanup(a[0]); return int(n); }
      case 'HINCRBY': {
        need(3, 3);
        const h = this.getOrCreate(a[0], 'hash', () => new Map());
        const cur = h.v.get(a[1]) ?? '0';
        if (!/^-?\d+$/.test(cur)) throw new RedisError('ERR hash value is not an integer');
        const next = Number(cur) + this.intArg(a[2]);
        h.v.set(a[1], String(next));
        return int(next);
      }

      // ---------- sets ----------
      case 'SADD': { need(2); const s = this.getOrCreate(a[0], 'set', () => new Set()); let n = 0; for (const m of a.slice(1)) if (!s.v.has(m)) { s.v.add(m); n++; } return int(n); }
      case 'SREM': { need(2); const s = this.get(a[0], 'set'); if (!s) return int(0); const n = a.slice(1).filter((m) => s.v.delete(m)).length; this.cleanup(a[0]); return int(n); }
      case 'SMEMBERS': need(1, 1); return arr([...(this.get(a[0], 'set')?.v ?? [])].sort());
      case 'SISMEMBER': need(2, 2); return int(this.get(a[0], 'set')?.v.has(a[1]) ? 1 : 0);
      case 'SMISMEMBER': { need(2); const s = this.get(a[0], 'set'); return { k: 'array', v: a.slice(1).map((m) => int(s?.v.has(m) ? 1 : 0)) }; }
      case 'SCARD': need(1, 1); return int(this.get(a[0], 'set')?.v.size ?? 0);
      case 'SINTER': case 'SUNION': case 'SDIFF': {
        need(1);
        const sets = a.map((k) => this.get(k, 'set')?.v ?? new Set<string>());
        let res: Set<string>;
        if (cmd === 'SUNION') res = new Set(sets.flatMap((s) => [...s]));
        else if (cmd === 'SINTER') res = new Set([...sets[0]].filter((m) => sets.every((s) => s.has(m))));
        else res = new Set([...sets[0]].filter((m) => !sets.slice(1).some((s) => s.has(m))));
        return arr([...res].sort());
      }
      case 'SINTERSTORE': case 'SUNIONSTORE': case 'SDIFFSTORE': {
        need(2);
        const res = this.exec([cmd.replace('STORE', ''), ...a.slice(1)]);
        const members = res.k === 'array' ? res.v.map((r) => (r.k === 'bulk' ? r.v ?? '' : '')) : [];
        this.data.delete(a[0]);
        this.expires.delete(a[0]);
        if (members.length) this.data.set(a[0], { t: 'set', v: new Set(members) });
        return int(members.length);
      }
      case 'SINTERCARD': {
        need(2);
        const n = this.intArg(a[0]);
        const sets = a.slice(1, 1 + n).map((k) => this.get(k, 'set')?.v ?? new Set<string>());
        return int([...sets[0]].filter((m) => sets.every((s) => s.has(m))).length);
      }

      // ---------- sorted sets ----------
      case 'ZADD': {
        need(3);
        let i = 1;
        const flags = new Set<string>();
        while (['NX', 'XX', 'GT', 'LT', 'CH', 'INCR'].includes(a[i]?.toUpperCase())) flags.add(a[i++].toUpperCase());
        if ((a.length - i) % 2 || a.length - i === 0) throw new RedisError('ERR syntax error');
        const z = this.getOrCreate(a[0], 'zset', () => new Map());
        let added = 0, changed = 0;
        let last: number | null = null;
        for (; i < a.length; i += 2) {
          const score = this.floatArg(a[i]);
          const m = a[i + 1];
          const cur = z.v.get(m);
          if ((flags.has('NX') && cur !== undefined) || (flags.has('XX') && cur === undefined)) continue;
          const next = flags.has('INCR') ? (cur ?? 0) + score : score;
          if (cur !== undefined && ((flags.has('GT') && next <= cur) || (flags.has('LT') && next >= cur))) continue;
          if (cur === undefined) added++;
          else if (cur !== next) changed++;
          z.v.set(m, next);
          last = next;
        }
        this.cleanup(a[0]);
        if (flags.has('INCR')) return bulk(last === null ? null : fmtNum(last));
        return int(flags.has('CH') ? added + changed : added);
      }
      case 'ZINCRBY': { need(3, 3); const z = this.getOrCreate(a[0], 'zset', () => new Map()); const next = (z.v.get(a[2]) ?? 0) + this.floatArg(a[1]); z.v.set(a[2], next); return bulk(fmtNum(next)); }
      case 'ZSCORE': { need(2, 2); const s = this.get(a[0], 'zset')?.v.get(a[1]); return bulk(s === undefined ? null : fmtNum(s)); }
      case 'ZCARD': need(1, 1); return int(this.get(a[0], 'zset')?.v.size ?? 0);
      case 'ZREM': { need(2); const z = this.get(a[0], 'zset'); if (!z) return int(0); const n = a.slice(1).filter((m) => z.v.delete(m)).length; this.cleanup(a[0]); return int(n); }
      case 'ZRANK': case 'ZREVRANK': {
        need(2, 2);
        const items = this.sortedZ(a[0]);
        if (cmd === 'ZREVRANK') items.reverse();
        const i = items.findIndex(([m]) => m === a[1]);
        return i < 0 ? bulk(null) : int(i);
      }
      case 'ZCOUNT': {
        need(3, 3);
        const lo = this.scoreBound(a[1]); const hi = this.scoreBound(a[2]);
        return int(this.sortedZ(a[0]).filter(([, s]) => (lo.excl ? s > lo.n : s >= lo.n) && (hi.excl ? s < hi.n : s <= hi.n)).length);
      }
      case 'ZRANGE': case 'ZREVRANGE': case 'ZRANGEBYSCORE': case 'ZREVRANGEBYSCORE': {
        need(3);
        const opts = a.slice(3).map((x) => x.toUpperCase());
        const withScores = opts.includes('WITHSCORES');
        const byScore = cmd.includes('BYSCORE') || opts.includes('BYSCORE');
        const rev = cmd.startsWith('ZREV') || opts.includes('REV');
        let items = this.sortedZ(a[0]);
        if (byScore) {
          // ZREVRANGEBYSCORE takes max then min
          const [lo, hi] = cmd === 'ZREVRANGEBYSCORE' || (rev && cmd === 'ZRANGE') ? [this.scoreBound(a[2]), this.scoreBound(a[1])] : [this.scoreBound(a[1]), this.scoreBound(a[2])];
          items = items.filter(([, s]) => (lo.excl ? s > lo.n : s >= lo.n) && (hi.excl ? s < hi.n : s <= hi.n));
          if (rev) items.reverse();
          const li = opts.indexOf('LIMIT');
          if (li >= 0) items = items.slice(Number(a[3 + li + 1]), Number(a[3 + li + 1]) + Number(a[3 + li + 2]));
        } else {
          if (rev) items.reverse();
          items = this.range(items, this.intArg(a[1]), this.intArg(a[2]));
        }
        return arr(withScores ? items.flatMap(([m, s]) => [m, fmtNum(s)]) : items.map(([m]) => m));
      }

      // ---------- streams (the basics) ----------
      case 'XADD': {
        need(4);
        let i = 1;
        let id = a[i++];
        if (id === '*') {
          const ms = this.now;
          this.streamSeq = ms === this.lastStreamMs ? this.streamSeq + 1 : 0;
          this.lastStreamMs = ms;
          id = `${ms}-${this.streamSeq}`;
        }
        const s = this.getOrCreate(a[0], 'stream', () => []);
        s.v.push({ id, fields: a.slice(i) });
        return bulk(id);
      }
      case 'XLEN': need(1, 1); return int(this.get(a[0], 'stream')?.v.length ?? 0);
      case 'XRANGE': {
        need(3);
        const s = this.get(a[0], 'stream')?.v ?? [];
        const ci = a.findIndex((x) => x.toUpperCase() === 'COUNT');
        const entries = ci > 0 ? s.slice(0, Number(a[ci + 1])) : s;
        return { k: 'array', v: entries.map((e) => ({ k: 'array', v: [bulk(e.id), arr(e.fields)] })) };
      }

      // ---------- transactions & pub/sub ----------
      case 'MULTI':
        if (this.queue) throw new RedisError('ERR MULTI calls can not be nested');
        this.queue = [];
        return ok;
      case 'DISCARD':
        if (!this.queue) throw new RedisError('ERR DISCARD without MULTI');
        this.queue = null;
        return ok;
      case 'EXEC': {
        if (!this.queue) throw new RedisError('ERR EXEC without MULTI');
        const q = this.queue;
        this.queue = null;
        return { k: 'array', v: q.map((c) => this.safe(c)) };
      }
      case 'PUBLISH': need(2, 2); return int(0);
      default:
        throw new RedisError(`ERR unknown command '${argv[0]}', with args beginning with: ${a.slice(0, 3).map((x) => `'${x}' `).join('')}`);
    }
  }

  private safe(argv: string[]): Reply {
    try {
      return this.exec(argv);
    } catch (e) {
      return { k: 'error', v: (e as Error).message };
    }
  }

  /** Run a whole script; returns the redis-cli style output (one reply per command). */
  run(script: string): string {
    const out: string[] = [];
    for (const raw of script.replace(/\r\n/g, '\n').split('\n')) {
      const line = raw.trim();
      if (!line || line.startsWith('#') || line.startsWith('//')) continue;
      const argv = tokenize(line);
      if (!argv.length) continue;
      out.push(format(this.safe(argv)));
    }
    return out.join('\n');
  }
}

/** Split a redis-cli line into arguments, honouring "double" and 'single' quotes. */
export function tokenize(line: string): string[] {
  const out: string[] = [];
  const re = /"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    if (m[1] !== undefined) out.push(m[1].replace(/\\(.)/g, (_x, c: string) => (c === 'n' ? '\n' : c === 't' ? '\t' : c)));
    else if (m[2] !== undefined) out.push(m[2].replace(/\\'/g, "'"));
    else out.push(m[3]);
  }
  return out;
}

const quote = (s: string) => `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;

/** redis-cli's human-readable reply format. */
export function format(r: Reply, indent = ''): string {
  switch (r.k) {
    case 'status': return r.v;
    case 'error': return `(error) ${r.v}`;
    case 'int': return `(integer) ${r.v}`;
    case 'bulk': return r.v === null ? '(nil)' : quote(r.v);
    case 'array': {
      if (!r.v.length) return '(empty array)';
      const w = String(r.v.length).length;
      return r.v
        .map((x, i) => {
          const label = `${String(i + 1).padStart(w)}) `;
          const body = format(x, indent + ' '.repeat(label.length));
          return (i === 0 ? '' : indent) + label + body;
        })
        .join('\n');
    }
  }
}
