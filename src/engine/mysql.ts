import type { Database } from 'sql.js';

/**
 * DevQuest's MySQL practice engine: MySQL statements are translated to SQLite (which already understands much of
 * MySQL: backticks, LIMIT a, b, window functions, CTEs, JSON ->>, upserts) and run in the in-app SQLite database,
 * with MySQL functions added where SQLite lacks them. It's a teaching engine for MySQL syntax, not a MySQL server:
 * results match MySQL for the lessons' queries; storage engines, users and server variables aren't simulated.
 */

const STR = '\u0000';

/** Replace string literals with placeholders so rewrites never touch text inside quotes. */
function protectStrings(sql: string) {
  const strings: string[] = [];
  const code = sql.replace(/'(?:[^'\\]|\\.|'')*'|"(?:[^"\\]|\\.|"")*"/g, (lit) => {
    const q = lit[0];
    let body = lit.slice(1, -1);
    // MySQL escapes (\' \" \\ \n \t) and "double-quoted" strings → SQLite single-quoted literals
    body = body.replace(/\\(.)/g, (_m, c: string) => (c === 'n' ? '\n' : c === 't' ? '\t' : c === '0' ? '' : c));
    if (q === '"') body = body.replace(/""/g, '"');
    else body = body.replace(/''/g, "'");
    strings.push(`'${body.replace(/'/g, "''")}'`);
    return `${STR}${strings.length - 1}${STR}`;
  });
  return { code, restore: (s: string) => s.replace(new RegExp(`${STR}(\\d+)${STR}`, 'g'), (_m, i: string) => strings[Number(i)]) };
}

/** Index of the parenthesis closing the one at `open`. */
function closingParen(s: string, open: number) {
  let depth = 0;
  for (let i = open; i < s.length; i++) {
    if (s[i] === '(') depth++;
    else if (s[i] === ')' && --depth === 0) return i;
  }
  return -1;
}

/** Split on commas at nesting depth 0. */
function splitTop(s: string) {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') depth++;
    else if (s[i] === ')') depth--;
    else if (s[i] === ',' && depth === 0) {
      parts.push(s.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(s.slice(start));
  return parts;
}

/** CREATE TABLE: MySQL column types/options → SQLite; inline INDEX/KEY definitions → separate CREATE INDEX. */
function rewriteCreateTables(code: string) {
  const re = /CREATE\s+TABLE\s+(IF\s+NOT\s+EXISTS\s+)?(`?\w+`?)\s*\(/gi;
  let out = '';
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code))) {
    const open = m.index + m[0].length - 1;
    const close = closingParen(code, open);
    if (close < 0) break;
    const table = m[2].replace(/`/g, '');
    const indexes: string[] = [];
    const defs = splitTop(code.slice(open + 1, close))
      .map((d) => d.trim())
      .filter((d) => {
        const ix = d.match(/^(UNIQUE\s+)?(?:INDEX|KEY)\s+(`?\w+`?)?\s*\(([^)]*)\)/i);
        const fulltext = /^FULLTEXT\s/i.test(d);
        if (ix && !/^PRIMARY/i.test(d)) {
          const name = (ix[2] ?? `${table}_${ix[3].replace(/[^\w]+/g, '_')}_idx`).replace(/`/g, '');
          indexes.push(`CREATE ${ix[1] ? 'UNIQUE ' : ''}INDEX ${name} ON ${table} (${ix[3]})`);
          return false;
        }
        return !fulltext;
      })
      .map((d) =>
        d
          .replace(/\b(?:BIG|SMALL|MEDIUM|TINY)?INT(?:EGER)?(?:\(\d+\))?(\s+UNSIGNED)?(\s+NOT\s+NULL)?\s+AUTO_INCREMENT\b/i, (_x, _u, nn) => `INTEGER${nn ?? ''}`)
          .replace(/\b(?:BIG|SMALL|MEDIUM|TINY)?INT(?:EGER)?(?:\(\d+\))?(\s+UNSIGNED)?\s+PRIMARY\s+KEY\s+AUTO_INCREMENT\b/i, 'INTEGER PRIMARY KEY')
          .replace(/\bAUTO_INCREMENT\b/gi, '')
          .replace(/\bUNSIGNED\b/gi, '')
          .replace(/\bENUM\s*\([^)]*\)/gi, 'TEXT')
          .replace(/\bON\s+UPDATE\s+CURRENT_TIMESTAMP(\(\))?/gi, '')
          .replace(/\b(CHARACTER\s+SET|CHARSET|COLLATE)\s+\w+/gi, '')
          .replace(/\bCOMMENT\s+\u0000\d+\u0000/gi, ''),
      );
    // Table options after the closing paren: ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 AUTO_INCREMENT=100 …
    const rest = code.slice(close + 1);
    const opts = rest.match(/^(\s*(?:ENGINE|DEFAULT\s+CHARSET|DEFAULT\s+CHARACTER\s+SET|CHARSET|CHARACTER\s+SET|COLLATE|AUTO_INCREMENT|COMMENT|ROW_FORMAT)\s*=?\s*[\w\u0000]+)*/i);
    const skip = opts ? opts[0].length : 0;
    out += code.slice(last, m.index) + `${m[0].slice(0, -1)}(${defs.join(', ')})` + (indexes.length ? `;\n${indexes.join(';\n')}` : '');
    last = close + 1 + skip;
    re.lastIndex = last;
  }
  return out + code.slice(last);
}

/** GROUP_CONCAT([DISTINCT] expr [ORDER BY …] [SEPARATOR 's']) → group_concat([DISTINCT] expr, 's' [ORDER BY …]) */
function rewriteGroupConcat(code: string) {
  let i = 0;
  let out = '';
  const re = /\bGROUP_CONCAT\s*\(/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code))) {
    const open = m.index + m[0].length - 1;
    const close = closingParen(code, open);
    if (close < 0) break;
    const inner = code.slice(open + 1, close);
    const sep = inner.match(/\s+SEPARATOR\s+(\u0000\d+\u0000)\s*$/i);
    // Without SEPARATOR, MySQL and SQLite already agree (comma default, ORDER BY inside the call)
    if (!sep) continue;
    let body = inner.slice(0, sep.index);
    const ord = body.match(/\s+ORDER\s+BY\s+([\s\S]*)$/i);
    if (ord) body = body.slice(0, ord.index);
    const distinct = /^\s*DISTINCT\s+/i.test(body);
    const args = distinct && !sep ? body : `${body}, ${sep ? sep[1] : "','"}`;
    out += code.slice(i, m.index) + `group_concat(${args}${ord ? ` ORDER BY ${ord[1]}` : ''})`;
    i = close + 1;
    re.lastIndex = i;
  }
  return out + code.slice(i);
}

/** Translate one MySQL script to SQLite. */
export function translateMysql(sql: string): string {
  const { code: protectedCode, restore } = protectStrings(sql.replace(/^\s*#.*$/gm, ''));
  let code = protectedCode;

  // Statements MySQL needs but a single in-app database doesn't
  code = code.replace(/(^|;)\s*(CREATE\s+DATABASE|DROP\s+DATABASE|CREATE\s+SCHEMA|USE)\b[^;]*(?=;|$)/gi, '$1');
  code = code.replace(/(^|;)\s*SET\s+(NAMES|FOREIGN_KEY_CHECKS|SQL_MODE|autocommit)\b[^;]*(?=;|$)/gi, '$1');

  // Introspection
  code = code.replace(/\bSHOW\s+(FULL\s+)?TABLES\b/gi, "SELECT name AS Tables FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
  code = code.replace(/(^|;)(\s*)(?:DESCRIBE|DESC|SHOW\s+COLUMNS\s+FROM)\s+`?(\w+)`?/gi, (_m, a, ws, t) =>
    `${a}${ws}SELECT name AS Field, lower(type) AS Type, CASE WHEN "notnull" = 1 OR pk > 0 THEN 'NO' ELSE 'YES' END AS "Null", CASE WHEN pk > 0 THEN 'PRI' ELSE '' END AS "Key", dflt_value AS "Default" FROM pragma_table_info('${t}')`,
  );
  code = code.replace(/\bSHOW\s+(?:INDEX|INDEXES|KEYS)\s+FROM\s+`?(\w+)`?/gi, (_m, t) =>
    `SELECT * FROM (SELECT '${t}' AS "Table", CASE il."unique" WHEN 1 THEN 0 ELSE 1 END AS Non_unique, CASE il.origin WHEN 'pk' THEN 'PRIMARY' ELSE il.name END AS Key_name, ii.seqno + 1 AS Seq_in_index, ii.name AS Column_name FROM pragma_index_list('${t}') il JOIN pragma_index_info(il.name) ii UNION ALL SELECT '${t}', 0, 'PRIMARY', 1, name FROM pragma_table_info('${t}') WHERE pk = 1 AND lower(type) = 'integer' AND NOT EXISTS (SELECT 1 FROM pragma_index_list('${t}') WHERE origin = 'pk')) ORDER BY Key_name = 'PRIMARY' DESC, Key_name, Seq_in_index`,
  );

  code = rewriteCreateTables(code);
  code = code.replace(/ALTER\s+TABLE\s+`?(\w+)`?\s+ADD\s+(UNIQUE\s+)?(?:INDEX|KEY)\s+`?(\w+)`?\s*\(([^)]*)\)/gi, (_m, t, u, name, cols) => `CREATE ${u ? 'UNIQUE ' : ''}INDEX ${name} ON ${t} (${cols})`);
  code = code.replace(/\bDROP\s+INDEX\s+`?(\w+)`?\s+ON\s+`?\w+`?/gi, 'DROP INDEX $1');
  code = code.replace(/(^|;)(\s*)TRUNCATE\s+(?:TABLE\s+)?/gi, '$1$2DELETE FROM ');

  // Transactions and inserts
  code = code.replace(/\bSTART\s+TRANSACTION\b/gi, 'BEGIN');
  code = code.replace(/\bINSERT\s+IGNORE\b/gi, 'INSERT OR IGNORE');
  code = code.replace(/\bON\s+DUPLICATE\s+KEY\s+UPDATE\b([^;]*)/gi, (_m, set: string) => `ON CONFLICT DO UPDATE SET${set.replace(/\bVALUES\s*\(\s*`?(\w+)`?\s*\)/gi, 'excluded.$1')}`);

  // Functions and operators
  code = rewriteGroupConcat(code);
  code = code.replace(/\bIF\s*\(/gi, 'iif(');
  code = code.replace(/\bLEFT\s*\(/gi, 'mysql_left(').replace(/\bRIGHT\s*\(/gi, 'mysql_right(');
  code = code.replace(/\b(DATE_ADD|DATE_SUB|ADDDATE|SUBDATE)\s*\(([^,()]+(?:\([^()]*\))?),\s*INTERVAL\s+(-?\d+)\s+(DAY|MONTH|YEAR|HOUR|MINUTE|SECOND)\s*\)/gi, (_m, fn: string, d: string, n: string, unit: string) => {
    const sign = /SUB/i.test(fn) ? -1 : 1;
    const v = sign * Number(n);
    const fmt = /HOUR|MINUTE|SECOND/i.test(unit) ? 'datetime' : 'date';
    return `${fmt}(${d}, '${v >= 0 ? '+' : ''}${v} ${unit.toLowerCase()}')`;
  });
  code = code.replace(/\bNOW\s*\(\s*\)|\bCURRENT_TIMESTAMP\s*\(\s*\)/gi, "datetime('now')").replace(/\bCURDATE\s*\(\s*\)/gi, "date('now')");
  // SQLite's multi-argument max()/min() return NULL when any argument is NULL, exactly like GREATEST/LEAST
  code = code.replace(/\bGREATEST\s*\(/gi, 'max(').replace(/\bLEAST\s*\(/gi, 'min(');
  code = code.replace(/\bJSON_ARRAYAGG\s*\(/gi, 'json_group_array(').replace(/\bJSON_OBJECTAGG\s*\(/gi, 'json_group_object(');
  code = code.replace(/\b(\w+(?:\.\w+)?)\s+DIV\s+(\w+(?:\.\w+)?)/gi, 'CAST($1 / $2 AS INTEGER)');
  code = code.replace(/\bEXPLAIN\s+(?!QUERY\s+PLAN)/gi, 'EXPLAIN QUERY PLAN ');

  return restore(code);
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function parseDate(v: unknown): Date | null {
  if (v === null || v === undefined) return null;
  const s = String(v);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (!m) return null;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] ?? 0), +(m[5] ?? 0), +(m[6] ?? 0)));
}

const pad = (n: number, w = 2) => String(n).padStart(w, '0');

/** MySQL DATE_FORMAT specifiers. */
export function dateFormat(v: unknown, fmt: unknown): string | null {
  const d = parseDate(v);
  if (!d || typeof fmt !== 'string') return null;
  return fmt.replace(/%([a-zA-Z%])/g, (_m, c: string) => {
    switch (c) {
      case 'Y': return String(d.getUTCFullYear());
      case 'y': return pad(d.getUTCFullYear() % 100);
      case 'm': return pad(d.getUTCMonth() + 1);
      case 'c': return String(d.getUTCMonth() + 1);
      case 'd': return pad(d.getUTCDate());
      case 'e': return String(d.getUTCDate());
      case 'H': return pad(d.getUTCHours());
      case 'i': return pad(d.getUTCMinutes());
      case 's': case 'S': return pad(d.getUTCSeconds());
      case 'M': return MONTHS[d.getUTCMonth()];
      case 'b': return MONTHS[d.getUTCMonth()].slice(0, 3);
      case 'W': return DAYS[d.getUTCDay()];
      case 'a': return DAYS[d.getUTCDay()].slice(0, 3);
      case 'j': return pad(Math.floor((d.getTime() - Date.UTC(d.getUTCFullYear(), 0, 1)) / 86400000) + 1, 3);
      case '%': return '%';
      default: return c;
    }
  });
}

/** Register MySQL functions SQLite doesn't have (and enforce foreign keys like InnoDB). */
export function registerMysql(db: Database) {
  db.run('PRAGMA foreign_keys = ON');
  db.create_function('date_format', (v: unknown, f: unknown) => dateFormat(v, f));
  db.create_function('year', (v: unknown) => parseDate(v)?.getUTCFullYear() ?? null);
  db.create_function('month', (v: unknown) => (parseDate(v) ? parseDate(v)!.getUTCMonth() + 1 : null));
  db.create_function('day', (v: unknown) => parseDate(v)?.getUTCDate() ?? null);
  db.create_function('dayofmonth', (v: unknown) => parseDate(v)?.getUTCDate() ?? null);
  db.create_function('dayname', (v: unknown) => (parseDate(v) ? DAYS[parseDate(v)!.getUTCDay()] : null));
  db.create_function('monthname', (v: unknown) => (parseDate(v) ? MONTHS[parseDate(v)!.getUTCMonth()] : null));
  db.create_function('datediff', (a: unknown, b: unknown) => {
    const da = parseDate(a);
    const dbb = parseDate(b);
    if (!da || !dbb) return null;
    const day = (d: Date) => Math.floor(d.getTime() / 86400000);
    return day(da) - day(dbb);
  });
  db.create_function('mysql_left', (s: unknown, n: unknown) => (s === null ? null : String(s).slice(0, Number(n))));
  db.create_function('mysql_right', (s: unknown, n: unknown) => (s === null ? null : Number(n) <= 0 ? '' : String(s).slice(-Number(n))));
  db.create_function('regexp', (pattern: unknown, value: unknown) => (value === null ? null : new RegExp(String(pattern), 'i').test(String(value)) ? 1 : 0));
  db.create_function('lpad', (s: unknown, n: unknown, p: unknown) => (s === null ? null : String(s).padStart(Number(n), String(p)).slice(0, Number(n))));
  db.create_function('rpad', (s: unknown, n: unknown, p: unknown) => (s === null ? null : String(s).padEnd(Number(n), String(p)).slice(0, Number(n))));
  db.create_function('locate', (sub: unknown, s: unknown) => (s === null ? null : String(s).indexOf(String(sub)) + 1));
  db.create_function('truncate', (x: unknown, d: unknown) => {
    const f = 10 ** Number(d);
    return Math.trunc(Number(x) * f) / f;
  });
}
