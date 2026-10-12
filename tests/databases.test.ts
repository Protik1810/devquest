import { beforeAll, describe, expect, it } from 'vitest';
import initSqlJs, { type SqlJsStatic } from 'sql.js';
import { dateFormat, registerMysql, translateMysql } from '../src/engine/mysql';
import { RedisEngine, tokenize } from '../src/engine/redis';

let SQL: SqlJsStatic;
beforeAll(async () => {
  SQL = await initSqlJs();
});

function mysql(script: string) {
  const db = new SQL.Database();
  registerMysql(db);
  const res = db.exec(translateMysql(script));
  db.close();
  const last = res[res.length - 1];
  return last ? last.values : [];
}

describe('MySQL practice engine', () => {
  it('creates tables with MySQL types, options and inline indexes', () => {
    const rows = mysql(`
      CREATE DATABASE shop; USE shop;
      CREATE TABLE users (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        email VARCHAR(255) NOT NULL,
        plan ENUM('free','pro') NOT NULL DEFAULT 'free',
        created DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_email (email),
        INDEX idx_plan (plan)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      INSERT INTO users (email, plan) VALUES ("ada@x.dev", 'pro'); INSERT INTO users (email) VALUES ('linus@x.dev');
      SELECT id, email, plan FROM users ORDER BY id;`);
    expect(rows).toEqual([[1, 'ada@x.dev', 'pro'], [2, 'linus@x.dev', 'free']]);
    expect(mysql("CREATE TABLE t (id INT PRIMARY KEY AUTO_INCREMENT, n INT, KEY k_n (n)); SHOW INDEX FROM t;").map((r) => r[2])).toEqual(['PRIMARY', 'k_n']);
    expect(mysql('CREATE TABLE b (x INT); CREATE TABLE a (y INT); SHOW TABLES;')).toEqual([['a'], ['b']]);
    expect(mysql('CREATE TABLE a (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(20) NOT NULL); DESCRIBE a;').map((r) => r.slice(0, 4))).toEqual([['id', 'integer', 'NO', 'PRI'], ['name', 'varchar(20)', 'NO', '']]);
  });

  it('translates upserts, IGNORE, transactions and string escapes', () => {
    expect(mysql(`
      CREATE TABLE stock (sku VARCHAR(10) PRIMARY KEY, qty INT NOT NULL);
      INSERT INTO stock VALUES ('a', 1), ('b', 2);
      INSERT INTO stock (sku, qty) VALUES ('a', 5), ('c', 1) ON DUPLICATE KEY UPDATE qty = qty + VALUES(qty);
      INSERT IGNORE INTO stock VALUES ('b', 99);
      START TRANSACTION; UPDATE stock SET qty = 0 WHERE sku = 'c'; ROLLBACK;
      SELECT sku, qty FROM stock ORDER BY sku;`)).toEqual([['a', 6], ['b', 2], ['c', 1]]);
    expect(mysql("SELECT 'It\\'s', \"say \"\"hi\"\"\"")).toEqual([["It's", 'say "hi"']]);
  });

  it('supports GROUP_CONCAT with ORDER BY and SEPARATOR, IF, LEFT/RIGHT, GREATEST', () => {
    expect(mysql(`
      CREATE TABLE t (g INT, name TEXT);
      INSERT INTO t VALUES (1, 'b'), (1, 'a'), (2, 'c');
      SELECT g, GROUP_CONCAT(name ORDER BY name DESC SEPARATOR ' | '), IF(g = 1, 'one', 'other'), LEFT('MySQL', 2), RIGHT('MySQL', 3), GREATEST(1, 5, 3) FROM t GROUP BY g ORDER BY g;`)).toEqual([
      [1, 'b | a', 'one', 'My', 'SQL', 5],
      [2, 'c', 'other', 'My', 'SQL', 5],
    ]);
  });

  it('has MySQL date functions', () => {
    expect(dateFormat('2026-03-07 14:05:09', '%Y-%m-%d %H:%i:%s %M %b %W %e')).toBe('2026-03-07 14:05:09 March Mar Saturday 7');
    expect(mysql("SELECT YEAR('2026-03-07'), MONTH('2026-03-07'), DATEDIFF('2026-03-07', '2026-02-27'), DATE_ADD('2026-01-31', INTERVAL 1 DAY), DATE_FORMAT('2026-03-07', '%Y-%m')")).toEqual([[2026, 3, 8, '2026-02-01', '2026-03']]);
  });
});

describe('Redis practice engine', () => {
  const run = (script: string) => new RedisEngine().run(script);

  it('formats replies like redis-cli', () => {
    expect(run('SET name "Ada Lovelace"\nGET name\nGET nope\nINCR n\nINCRBY n 10\nDEL name nope\nEXISTS name')).toBe('OK\n"Ada Lovelace"\n(nil)\n(integer) 1\n(integer) 11\n(integer) 1\n(integer) 0');
    expect(run('RPUSH l a b c\nLRANGE l 0 -1\nLRANGE empty 0 -1')).toBe('(integer) 3\n1) "a"\n2) "b"\n3) "c"\n(empty array)');
    expect(run('GET')).toBe("(error) ERR wrong number of arguments for 'get' command");
    expect(run('LPUSH k x\nGET k')).toBe('(integer) 1\n(error) WRONGTYPE Operation against a key holding the wrong kind of value');
  });

  it('expires keys against the simulated clock', () => {
    expect(run('SET s v EX 10\nTTL s\nDEBUG SLEEP 4\nTTL s\nDEBUG SLEEP 6\nGET s\nTTL s\nSET p v\nTTL p')).toBe('OK\n(integer) 10\nOK\n(integer) 6\nOK\n(nil)\n(integer) -2\nOK\n(integer) -1');
    expect(run('SET lock me NX PX 3000\nSET lock you NX PX 3000\nGET lock')).toBe('OK\n(nil)\n"me"');
  });

  it('handles hashes, sets and sorted sets', () => {
    expect(run('HSET user:1 name Ada level 7\nHINCRBY user:1 level 2\nHGETALL user:1')).toBe('(integer) 2\n(integer) 9\n1) "name"\n2) "Ada"\n3) "level"\n4) "9"');
    expect(run('SADD a x y z\nSADD b y z w\nSINTER a b\nSCARD a')).toBe('(integer) 3\n(integer) 3\n1) "y"\n2) "z"\n(integer) 3');
    expect(run('ZADD lb 10 ada 30 linus 20 grace\nZINCRBY lb 25 ada\nZREVRANGE lb 0 -1 WITHSCORES\nZRANK lb linus\nZSCORE lb ada')).toBe(
      '(integer) 3\n"35"\n1) "ada"\n2) "35"\n3) "linus"\n4) "30"\n5) "grace"\n6) "20"\n(integer) 1\n"35"',
    );
  });

  it('runs MULTI/EXEC transactions', () => {
    expect(run('MULTI\nINCR c\nSET k v\nEXEC')).toBe('OK\nQUEUED\nQUEUED\n1) (integer) 1\n2) OK');
  });

  it('tokenizes quoted arguments', () => {
    expect(tokenize(`SET msg "hello \\"world\\"" EX 5`)).toEqual(['SET', 'msg', 'hello "world"', 'EX', '5']);
  });
});

describe('Redis practice engine: more commands', () => {
  const run = (script: string) => new RedisEngine().run(script);
  it('moves list items and stores set operations', () => {
    expect(run('RPUSH q a b\nLMOVE q done LEFT RIGHT\nLRANGE done 0 -1\nSADD x 1 2 3\nSADD y 2 3 4\nSINTERSTORE z x y\nSMEMBERS z')).toBe('(integer) 2\n"a"\n1) "a"\n(integer) 3\n(integer) 3\n(integer) 2\n1) "2"\n2) "3"');
  });
});
