// A small, in-memory MongoDB shell (mongosh-style API) for the MongoDB lessons. It runs inside the sandboxed
// JavaScript worker before the learner's code. Supported: insert/find/update/delete/count/distinct, cursors
// (sort/skip/limit/projection), query operators, update operators, indexes and an aggregation pipeline.
// Output uses mongosh's style: { name: 'Ada', age: 36 }.
/* eslint-disable */
var __mongo = (function () {
  var oidSeq = 0;
  function ObjectId(hex) {
    if (!(this instanceof ObjectId)) return new ObjectId(hex);
    this.$oid = hex || (++oidSeq).toString(16).padStart(24, '0');
  }
  ObjectId.prototype.toString = function () { return this.$oid; };
  ObjectId.prototype.equals = function (o) { return o instanceof ObjectId && o.$oid === this.$oid; };

  var isObj = function (v) { return v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date) && !(v instanceof ObjectId) && !(v instanceof RegExp); };
  var clone = function (v) {
    if (Array.isArray(v)) return v.map(clone);
    if (v instanceof Date) return new Date(v.getTime());
    if (isObj(v)) { var o = {}; for (var k in v) o[k] = clone(v[k]); return o; }
    return v;
  };

  // ---------- printing (mongosh style) ----------
  function fmt(v, ind) {
    ind = ind || '';
    if (v === undefined) return 'undefined';
    if (v === null) return 'null';
    if (v instanceof ObjectId) return "ObjectId('" + v.$oid + "')";
    if (v instanceof Date) return 'ISODate(\'' + v.toISOString() + '\')';
    if (typeof v === 'string') return "'" + v.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
    if (typeof v !== 'object') return String(v);
    var inner = ind + '  ';
    if (Array.isArray(v)) {
      if (!v.length) return '[]';
      var parts = v.map(function (x) { return fmt(x, inner); });
      var line = '[ ' + parts.join(', ') + ' ]';
      return line.length <= 72 && line.indexOf('\n') < 0 ? line : '[\n' + parts.map(function (p) { return inner + p; }).join(',\n') + '\n' + ind + ']';
    }
    var keys = Object.keys(v);
    if (!keys.length) return '{}';
    var items = keys.map(function (k) { return (/^[A-Za-z_$][\w$]*$/.test(k) ? k : "'" + k + "'") + ': ' + fmt(v[k], inner); });
    var one = '{ ' + items.join(', ') + ' }';
    return one.length <= 72 && one.indexOf('\n') < 0 ? one : '{\n' + items.map(function (p) { return inner + p; }).join(',\n') + '\n' + ind + '}';
  }

  // ---------- paths & comparison ----------
  function getPath(doc, path) {
    var parts = path.split('.');
    var vals = [doc];
    for (var i = 0; i < parts.length; i++) {
      var next = [];
      for (var j = 0; j < vals.length; j++) {
        var cur = vals[j];
        if (Array.isArray(cur) && !/^\d+$/.test(parts[i])) {
          for (var a = 0; a < cur.length; a++) if (isObj(cur[a]) && parts[i] in cur[a]) next.push(cur[a][parts[i]]);
        } else if (cur !== null && cur !== undefined && typeof cur === 'object' && parts[i] in cur) next.push(cur[parts[i]]);
      }
      vals = next;
    }
    return vals; // every value the path reaches (arrays of subdocuments fan out)
  }
  function getOne(doc, path) { var v = getPath(doc, path); return v.length ? v[0] : undefined; }
  function setPath(doc, path, val) {
    var parts = path.split('.'), cur = doc;
    for (var i = 0; i < parts.length - 1; i++) { if (!isObj(cur[parts[i]]) && !Array.isArray(cur[parts[i]])) cur[parts[i]] = {}; cur = cur[parts[i]]; }
    cur[parts[parts.length - 1]] = val;
  }
  function unsetPath(doc, path) {
    var parts = path.split('.'), cur = doc;
    for (var i = 0; i < parts.length - 1; i++) { cur = cur && cur[parts[i]]; }
    if (cur && typeof cur === 'object') delete cur[parts[parts.length - 1]];
  }
  var TYPE_ORDER = function (v) { return v === null || v === undefined ? 0 : typeof v === 'number' ? 1 : typeof v === 'string' ? 2 : isObj(v) ? 3 : Array.isArray(v) ? 4 : v instanceof ObjectId ? 5 : typeof v === 'boolean' ? 6 : v instanceof Date ? 7 : 8; };
  function cmp(a, b) {
    var ta = TYPE_ORDER(a), tb = TYPE_ORDER(b);
    if (ta !== tb) return ta - tb;
    if (a instanceof Date) return a - b;
    if (a instanceof ObjectId) return a.$oid < b.$oid ? -1 : a.$oid > b.$oid ? 1 : 0;
    if (typeof a === 'object' && a !== null) { var sa = JSON.stringify(a), sb = JSON.stringify(b); return sa < sb ? -1 : sa > sb ? 1 : 0; }
    return a < b ? -1 : a > b ? 1 : 0;
  }
  function eq(a, b) {
    if (a instanceof ObjectId || b instanceof ObjectId) return a instanceof ObjectId && b instanceof ObjectId && a.$oid === b.$oid;
    if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
    if (typeof a === 'object' && a !== null && typeof b === 'object' && b !== null) return JSON.stringify(a) === JSON.stringify(b);
    return a === b;
  }

  // ---------- query matching ----------
  function matchValue(vals, cond) {
    // `vals`: values reached by the path; arrays also match element-wise
    var expanded = [];
    vals.forEach(function (v) { expanded.push(v); if (Array.isArray(v)) v.forEach(function (x) { expanded.push(x); }); });
    if (cond instanceof RegExp) return expanded.some(function (v) { return typeof v === 'string' && cond.test(v); });
    if (isObj(cond) && Object.keys(cond).length && Object.keys(cond).every(function (k) { return k[0] === '$'; })) {
      return Object.keys(cond).every(function (op) {
        var arg = cond[op];
        switch (op) {
          case '$eq': return expanded.some(function (v) { return eq(v, arg); }) || (arg === null && !vals.length);
          case '$ne': return !expanded.some(function (v) { return eq(v, arg); }) && !(arg === null && !vals.length);
          case '$gt': return expanded.some(function (v) { return TYPE_ORDER(v) === TYPE_ORDER(arg) && cmp(v, arg) > 0; });
          case '$gte': return expanded.some(function (v) { return TYPE_ORDER(v) === TYPE_ORDER(arg) && cmp(v, arg) >= 0; });
          case '$lt': return expanded.some(function (v) { return TYPE_ORDER(v) === TYPE_ORDER(arg) && cmp(v, arg) < 0; });
          case '$lte': return expanded.some(function (v) { return TYPE_ORDER(v) === TYPE_ORDER(arg) && cmp(v, arg) <= 0; });
          case '$in': return arg.some(function (a) { return a instanceof RegExp ? matchValue(vals, a) : expanded.some(function (v) { return eq(v, a); }) || (a === null && !vals.length); });
          case '$nin': return !arg.some(function (a) { return expanded.some(function (v) { return eq(v, a); }); });
          case '$exists': return arg ? vals.length > 0 : vals.length === 0;
          case '$regex': return matchValue(vals, new RegExp(arg, cond.$options || ''));
          case '$options': return true;
          case '$not': return !matchValue(vals, arg);
          case '$size': return vals.some(function (v) { return Array.isArray(v) && v.length === arg; });
          case '$all': return vals.some(function (v) { return Array.isArray(v) && arg.every(function (a) { return v.some(function (x) { return eq(x, a); }); }); });
          case '$elemMatch': return vals.some(function (v) { return Array.isArray(v) && v.some(function (x) { return isObj(x) && !Object.keys(arg).every(function (k) { return k[0] === '$'; }) ? matches(x, arg) : matchValue([x], arg); }); });
          case '$type': return expanded.some(function (v) { var t = v === null ? 'null' : Array.isArray(v) ? 'array' : v instanceof Date ? 'date' : v instanceof ObjectId ? 'objectId' : typeof v === 'number' ? 'number' : typeof v === 'string' ? 'string' : typeof v === 'boolean' ? 'bool' : 'object'; return t === arg; });
          default: throw new Error('Unsupported query operator ' + op);
        }
      });
    }
    if (cond === null) return !vals.length || expanded.some(function (v) { return v === null; });
    return expanded.some(function (v) { return eq(v, cond); });
  }
  function matches(doc, query) {
    query = query || {};
    return Object.keys(query).every(function (k) {
      var c = query[k];
      if (k === '$and') return c.every(function (q) { return matches(doc, q); });
      if (k === '$or') return c.some(function (q) { return matches(doc, q); });
      if (k === '$nor') return !c.some(function (q) { return matches(doc, q); });
      if (k === '$expr') return !!evalExpr(c, doc);
      return matchValue(getPath(doc, k), c);
    });
  }

  // ---------- projection ----------
  function project(doc, proj) {
    if (!proj || !Object.keys(proj).length) return clone(doc);
    var keys = Object.keys(proj).filter(function (k) { return k !== '_id'; });
    var inclusive = keys.some(function (k) { return proj[k] && proj[k] !== 0; });
    var out;
    if (inclusive) {
      out = {};
      if (proj._id !== 0 && proj._id !== false && '_id' in doc) out._id = clone(doc._id);
      keys.forEach(function (k) {
        var v = proj[k];
        if (typeof v === 'string' && v[0] === '$' || isObj(v)) setPath(out, k, clone(evalExpr(v, doc)));
        else { var got = getOne(doc, k); if (got !== undefined) setPath(out, k, clone(got)); }
      });
    } else {
      out = clone(doc);
      Object.keys(proj).forEach(function (k) { if (!proj[k]) unsetPath(out, k); });
    }
    return out;
  }

  // ---------- aggregation expressions ----------
  function evalExpr(e, doc) {
    if (typeof e === 'string' && e.indexOf('$$ROOT') === 0) return doc;
    if (typeof e === 'string' && e[0] === '$') return getOne(doc, e.slice(1));
    if (Array.isArray(e)) return e.map(function (x) { return evalExpr(x, doc); });
    if (!isObj(e)) return e;
    var ks = Object.keys(e);
    if (ks.length === 1 && ks[0][0] === '$') {
      var op = ks[0], raw = e[op];
      var args = Array.isArray(raw) ? raw.map(function (x) { return evalExpr(x, doc); }) : [evalExpr(raw, doc)];
      var num = function (x) { return typeof x === 'number' ? x : 0; };
      switch (op) {
        case '$add': return args.reduce(function (a, b) { return a + num(b); }, 0);
        case '$subtract': return num(args[0]) - num(args[1]);
        case '$multiply': return args.reduce(function (a, b) { return a * num(b); }, 1);
        case '$divide': return num(args[0]) / num(args[1]);
        case '$mod': return num(args[0]) % num(args[1]);
        case '$round': var p = Math.pow(10, args[1] || 0); return Math.round(num(args[0]) * p) / p;
        case '$concat': return args.some(function (a) { return a === null || a === undefined; }) ? null : args.join('');
        case '$toUpper': return String(args[0] == null ? '' : args[0]).toUpperCase();
        case '$toLower': return String(args[0] == null ? '' : args[0]).toLowerCase();
        case '$size': return Array.isArray(args[0]) ? args[0].length : 0;
        case '$gt': return cmp(args[0], args[1]) > 0;
        case '$gte': return cmp(args[0], args[1]) >= 0;
        case '$lt': return cmp(args[0], args[1]) < 0;
        case '$lte': return cmp(args[0], args[1]) <= 0;
        case '$eq': return eq(args[0], args[1]);
        case '$ne': return !eq(args[0], args[1]);
        case '$and': return args.every(Boolean);
        case '$or': return args.some(Boolean);
        case '$not': return !args[0];
        case '$cond': return Array.isArray(raw) ? (args[0] ? args[1] : args[2]) : (evalExpr(raw.if, doc) ? evalExpr(raw.then, doc) : evalExpr(raw.else, doc));
        case '$ifNull': return args[0] === null || args[0] === undefined ? args[1] : args[0];
        case '$sum': return Array.isArray(args[0]) && args.length === 1 ? args[0].reduce(function (a, b) { return a + num(b); }, 0) : args.reduce(function (a, b) { return a + num(b); }, 0);
        case '$avg': var arr = Array.isArray(args[0]) && args.length === 1 ? args[0] : args; var ns = arr.filter(function (x) { return typeof x === 'number'; }); return ns.length ? ns.reduce(function (a, b) { return a + b; }, 0) / ns.length : null;
        case '$year': return args[0] instanceof Date ? args[0].getUTCFullYear() : null;
        case '$month': return args[0] instanceof Date ? args[0].getUTCMonth() + 1 : null;
        case '$literal': return raw;
        default: throw new Error('Unsupported expression operator ' + op);
      }
    }
    var out = {};
    ks.forEach(function (k) { out[k] = evalExpr(e[k], doc); });
    return out;
  }

  function sortDocs(docs, spec) {
    var keys = Object.keys(spec);
    return docs.slice().sort(function (a, b) {
      for (var i = 0; i < keys.length; i++) {
        var c = cmp(getOne(a, keys[i]), getOne(b, keys[i]));
        if (c) return spec[keys[i]] < 0 ? -c : c;
      }
      return 0;
    });
  }

  var ACC = {
    $sum: function (vals) { return vals.reduce(function (a, v) { return a + (typeof v === 'number' ? v : 0); }, 0); },
    $avg: function (vals) { var ns = vals.filter(function (v) { return typeof v === 'number'; }); return ns.length ? ns.reduce(function (a, b) { return a + b; }, 0) / ns.length : null; },
    $min: function (vals) { var v = vals.filter(function (x) { return x !== undefined && x !== null; }); return v.length ? v.reduce(function (a, b) { return cmp(a, b) <= 0 ? a : b; }) : null; },
    $max: function (vals) { var v = vals.filter(function (x) { return x !== undefined && x !== null; }); return v.length ? v.reduce(function (a, b) { return cmp(a, b) >= 0 ? a : b; }) : null; },
    $push: function (vals) { return vals; },
    $addToSet: function (vals) { var out = []; vals.forEach(function (v) { if (!out.some(function (o) { return eq(o, v); })) out.push(v); }); return out; },
    $first: function (vals) { return vals.length ? vals[0] : null; },
    $last: function (vals) { return vals.length ? vals[vals.length - 1] : null; },
    $count: function (vals) { return vals.length; },
  };

  function aggregate(docs, pipeline, dbRef) {
    var cur = docs.map(clone);
    pipeline.forEach(function (stage) {
      var name = Object.keys(stage)[0], arg = stage[name];
      switch (name) {
        case '$match': cur = cur.filter(function (d) { return matches(d, arg); }); break;
        case '$project': cur = cur.map(function (d) { return project(d, arg); }); break;
        case '$addFields': case '$set': cur = cur.map(function (d) { var o = clone(d); Object.keys(arg).forEach(function (k) { setPath(o, k, evalExpr(arg[k], d)); }); return o; }); break;
        case '$unset': cur = cur.map(function (d) { var o = clone(d); [].concat(arg).forEach(function (k) { unsetPath(o, k); }); return o; }); break;
        case '$sort': cur = sortDocs(cur, arg); break;
        case '$limit': cur = cur.slice(0, arg); break;
        case '$skip': cur = cur.slice(arg); break;
        case '$count': cur = [(function () { var o = {}; o[arg] = cur.length; return o; })()]; break;
        case '$unwind':
          var path = (typeof arg === 'string' ? arg : arg.path).slice(1), keepEmpty = isObj(arg) && arg.preserveNullAndEmptyArrays;
          var out = [];
          cur.forEach(function (d) {
            var v = getOne(d, path);
            if (Array.isArray(v) && v.length) v.forEach(function (x) { var o = clone(d); setPath(o, path, x); out.push(o); });
            else if (keepEmpty) out.push(clone(d));
            else if (v !== undefined && v !== null && !Array.isArray(v)) out.push(clone(d));
          });
          cur = out; break;
        case '$group':
          var groups = [], index = {};
          cur.forEach(function (d) {
            var id = evalExpr(arg._id, d), k = JSON.stringify(id === undefined ? null : id);
            if (!(k in index)) { index[k] = groups.length; groups.push({ id: id === undefined ? null : id, docs: [] }); }
            groups[index[k]].docs.push(d);
          });
          cur = groups.map(function (g) {
            var o = { _id: g.id };
            Object.keys(arg).forEach(function (f) {
              if (f === '_id') return;
              var spec = arg[f], op = Object.keys(spec)[0];
              if (!ACC[op]) throw new Error('Unsupported accumulator ' + op);
              o[f] = ACC[op](op === '$count' ? g.docs : g.docs.map(function (d) { return evalExpr(spec[op], d); }));
            });
            return o;
          });
          break;
        case '$lookup':
          var other = dbRef.getCollection(arg.from)._docs;
          cur = cur.map(function (d) {
            var o = clone(d), local = getOne(d, arg.localField);
            o[arg.as] = other.filter(function (x) { var f = getOne(x, arg.foreignField); return Array.isArray(local) ? local.some(function (l) { return eq(l, f); }) : eq(local, f); }).map(clone);
            return o;
          });
          break;
        case '$replaceRoot': cur = cur.map(function (d) { return clone(evalExpr(arg.newRoot, d)); }); break;
        default: throw new Error('Unsupported pipeline stage ' + name);
      }
    });
    return cur;
  }

  // ---------- updates ----------
  function applyUpdate(doc, upd, isInsert) {
    if (!Object.keys(upd).some(function (k) { return k[0] === '$'; })) {
      var id = doc._id; Object.keys(doc).forEach(function (k) { delete doc[k]; }); Object.assign(doc, clone(upd)); doc._id = id; return;
    }
    Object.keys(upd).forEach(function (op) {
      var fields = upd[op];
      Object.keys(fields).forEach(function (path) {
        var v = fields[path], cur = getOne(doc, path);
        switch (op) {
          case '$set': setPath(doc, path, clone(v)); break;
          case '$setOnInsert': if (isInsert) setPath(doc, path, clone(v)); break;
          case '$unset': unsetPath(doc, path); break;
          case '$inc': setPath(doc, path, (typeof cur === 'number' ? cur : 0) + v); break;
          case '$mul': setPath(doc, path, (typeof cur === 'number' ? cur : 0) * v); break;
          case '$min': if (cur === undefined || cmp(v, cur) < 0) setPath(doc, path, v); break;
          case '$max': if (cur === undefined || cmp(v, cur) > 0) setPath(doc, path, v); break;
          case '$rename': if (cur !== undefined) { unsetPath(doc, path); setPath(doc, v, cur); } break;
          case '$push':
            var arr = Array.isArray(cur) ? cur : [];
            if (isObj(v) && '$each' in v) v.$each.forEach(function (x) { arr.push(clone(x)); }); else arr.push(clone(v));
            setPath(doc, path, arr); break;
          case '$addToSet':
            var set = Array.isArray(cur) ? cur : [];
            (isObj(v) && '$each' in v ? v.$each : [v]).forEach(function (x) { if (!set.some(function (s) { return eq(s, x); })) set.push(clone(x)); });
            setPath(doc, path, set); break;
          case '$pull':
            if (Array.isArray(cur)) setPath(doc, path, cur.filter(function (x) { return isObj(v) && !Object.keys(v).every(function (k) { return k[0] === '$'; }) ? !(isObj(x) && matches(x, v)) : !matchValue([x], v); }));
            break;
          case '$pop': if (Array.isArray(cur)) { if (v < 0) cur.shift(); else cur.pop(); } break;
          default: throw new Error('Unsupported update operator ' + op);
        }
      });
    });
  }

  // ---------- cursor & collection ----------
  function Cursor(coll, query, proj) { this._coll = coll; this._query = query || {}; this._proj = proj; this._sort = null; this._skip = 0; this._limit = 0; }
  Cursor.prototype.sort = function (s) { this._sort = s; return this; };
  Cursor.prototype.skip = function (n) { this._skip = n; return this; };
  Cursor.prototype.limit = function (n) { this._limit = n; return this; };
  Cursor.prototype.project = function (p) { this._proj = p; return this; };
  Cursor.prototype.toArray = function () {
    var self = this, docs = this._coll._docs.filter(function (d) { return matches(d, self._query); });
    if (this._sort) docs = sortDocs(docs, this._sort);
    docs = docs.slice(this._skip, this._limit ? this._skip + this._limit : undefined);
    return docs.map(function (d) { return project(d, self._proj); });
  };
  Cursor.prototype.forEach = function (fn) { this.toArray().forEach(function (d) { fn(d); }); };
  Cursor.prototype.map = function (fn) { return this.toArray().map(fn); };
  Cursor.prototype.count = function () { return this.toArray().length; };
  Cursor.prototype.next = function () { return this.toArray()[0] || null; };
  Cursor.prototype.hasNext = function () { return this.toArray().length > 0; };
  Cursor.prototype.pretty = function () { return this; };
  Cursor.prototype.explain = function () { return { queryPlanner: { winningPlan: this._coll._planFor(this._query) } }; };

  function Collection(name, db) { this._name = name; this._db = db; this._docs = []; this._indexes = [{ key: { _id: 1 }, name: '_id_', unique: true }]; }
  Collection.prototype._prep = function (doc) {
    var d = clone(doc);
    if (!('_id' in d)) d = Object.assign({ _id: new ObjectId() }, d);
    var self = this;
    this._indexes.forEach(function (ix) {
      if (!ix.unique) return;
      var ks = Object.keys(ix.key);
      if (self._docs.some(function (o) { return ks.every(function (k) { return eq(getOne(o, k), getOne(d, k)); }); }))
        throw new Error('E11000 duplicate key error collection: test.' + self._name + ' index: ' + ix.name + ' dup key: ' + fmt(ks.reduce(function (a, k) { a[k] = getOne(d, k); return a; }, {})));
    });
    return d;
  };
  Collection.prototype.insertOne = function (doc) { var d = this._prep(doc); this._docs.push(d); return { acknowledged: true, insertedId: d._id }; };
  Collection.prototype.insertMany = function (docs) { var self = this, ids = {}; docs.forEach(function (doc, i) { ids[i] = self.insertOne(doc).insertedId; }); return { acknowledged: true, insertedIds: ids }; };
  Collection.prototype.find = function (q, p) { return new Cursor(this, q, p); };
  Collection.prototype.findOne = function (q, p) { return this.find(q, p).limit(1).toArray()[0] || null; };
  Collection.prototype.countDocuments = function (q) { return this.find(q).toArray().length; };
  Collection.prototype.estimatedDocumentCount = function () { return this._docs.length; };
  Collection.prototype.distinct = function (field, q) {
    var out = [];
    this.find(q).toArray().forEach(function (d) { getPath(d, field).forEach(function (v) { (Array.isArray(v) ? v : [v]).forEach(function (x) { if (!out.some(function (o) { return eq(o, x); })) out.push(x); }); }); });
    return out.sort(cmp);
  };
  Collection.prototype._update = function (q, upd, opts, many) {
    opts = opts || {};
    var hits = this._docs.filter(function (d) { return matches(d, q); });
    if (!many) hits = hits.slice(0, 1);
    if (!hits.length && opts.upsert) {
      var base = {};
      Object.keys(q || {}).forEach(function (k) { if (k[0] !== '$' && !isObj(q[k])) setPath(base, k, clone(q[k])); });
      applyUpdate(base, upd, true);
      var ins = this.insertOne(base);
      return { acknowledged: true, matchedCount: 0, modifiedCount: 0, upsertedId: ins.insertedId };
    }
    var modified = 0;
    hits.forEach(function (d) { var before = JSON.stringify(d); applyUpdate(d, upd, false); if (JSON.stringify(d) !== before) modified++; });
    return { acknowledged: true, matchedCount: hits.length, modifiedCount: modified };
  };
  Collection.prototype.updateOne = function (q, u, o) { return this._update(q, u, o, false); };
  Collection.prototype.updateMany = function (q, u, o) { return this._update(q, u, o, true); };
  Collection.prototype.replaceOne = function (q, doc, o) { return this._update(q, doc, o, false); };
  Collection.prototype.deleteOne = function (q) { var i = this._docs.findIndex(function (d) { return matches(d, q); }); if (i >= 0) this._docs.splice(i, 1); return { acknowledged: true, deletedCount: i >= 0 ? 1 : 0 }; };
  Collection.prototype.deleteMany = function (q) { var before = this._docs.length; this._docs = this._docs.filter(function (d) { return !matches(d, q); }); return { acknowledged: true, deletedCount: before - this._docs.length }; };
  Collection.prototype.aggregate = function (pipeline) { var res = aggregate(this._docs, pipeline || [], this._db); return { toArray: function () { return res; }, forEach: function (f) { res.forEach(function (d) { f(d); }); } }; };
  Collection.prototype.createIndex = function (key, opts) {
    opts = opts || {};
    var name = opts.name || Object.keys(key).map(function (k) { return k + '_' + key[k]; }).join('_');
    if (!this._indexes.some(function (i) { return i.name === name; })) {
      if (opts.unique) {
        var ks = Object.keys(key), seen = {};
        this._docs.forEach(function (d) { var s = JSON.stringify(ks.map(function (k) { return getOne(d, k); })); if (seen[s]) throw new Error('E11000 duplicate key error: cannot build unique index ' + name); seen[s] = 1; });
      }
      this._indexes.push({ key: key, name: name, unique: !!opts.unique });
    }
    return name;
  };
  Collection.prototype.getIndexes = function () { return this._indexes.map(function (i) { var o = { v: 2, key: i.key, name: i.name }; if (i.unique && i.name !== '_id_') o.unique = true; return o; }); };
  Collection.prototype.dropIndex = function (name) { this._indexes = this._indexes.filter(function (i) { return i.name !== name || name === '_id_'; }); return { ok: 1 }; };
  Collection.prototype._planFor = function (q) {
    var fields = Object.keys(q || {});
    var ix = this._indexes.find(function (i) { return Object.keys(i.key)[0] && fields.indexOf(Object.keys(i.key)[0]) >= 0; });
    return ix ? { stage: 'FETCH', inputStage: { stage: 'IXSCAN', indexName: ix.name } } : { stage: 'COLLSCAN' };
  };
  Collection.prototype.drop = function () { delete this._db._colls[this._name]; return true; };

  function Database(name) { this._name = name; this._colls = {}; }
  Database.prototype.getCollection = function (n) { if (!this._colls[n]) this._colls[n] = new Collection(n, this); return this._colls[n]; };
  Database.prototype.getCollectionNames = function () { return Object.keys(this._colls).sort(); };
  Database.prototype.createCollection = function (n) { this.getCollection(n); return { ok: 1 }; };
  Database.prototype.dropDatabase = function () { this._colls = {}; return { ok: 1 }; };

  var db = new Proxy(new Database('test'), {
    get: function (t, k) { if (typeof k !== 'string' || k in t || k[0] === '_' || k === 'then') return t[k]; return t.getCollection(k); },
  });
  return { db: db, ObjectId: ObjectId, fmt: fmt };
})();
var db = __mongo.db;
var ObjectId = __mongo.ObjectId;
var ISODate = function (s) { return new Date(s); };
var print = function () { console.log([].map.call(arguments, function (a) { return typeof a === 'string' ? a : __mongo.fmt(a); }).join(' ')); };
var printjson = function (v) { console.log(__mongo.fmt(v && typeof v.toArray === 'function' ? v.toArray() : v)); };
