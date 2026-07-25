/**
 * Mongoose-compatibility layer over Supabase Postgres.
 *
 * WHY THIS EXISTS
 * ----------------
 * The migration mandate is: change ONLY the database, touch nothing else.
 * Every controller in src/controllers/*.js was written against Mongoose's
 * API — Model.find(filter).sort().skip().limit(), Model.findById(id),
 * Model.findByIdAndUpdate(id, { $inc: {...} }), instance.save(), etc.
 *
 * Rather than rewriting 14 controllers (and risking behavior drift in
 * business logic that has nothing to do with the database), this module
 * gives each Postgres table a small object that implements the *same
 * method names and semantics* the controllers already call. Controllers
 * and routes are byte-for-byte unchanged; only src/models/*.js (which
 * controllers import) now builds on this instead of `mongoose.model(...)`.
 *
 * SCOPE
 * -----
 * This is intentionally NOT a general ORM. It supports exactly the
 * Mongoose surface actually used in this codebase (audited across every
 * controller/route/util):
 *   find, findOne, findById, create, insertMany,
 *   findByIdAndUpdate, findOneAndUpdate, findByIdAndDelete, deleteOne,
 *   countDocuments, updateMany,
 *   .sort() .skip() .limit() .select() .populate() .lean()
 *   document.save()
 * and the query operators: $ne, $lt, $gt, $gte, $lte, $in, $regex,
 * $text/$search, plus update operators $set (implicit), $inc, $push, $pull.
 *
 * FIELD NAMING
 * ------------
 * Postgres columns are snake_case; the app (frontend + controllers) works
 * in Mongoose-style camelCase with `_id`. This module converts at the
 * boundary in both directions, so controller code that does
 * `article.viewCount` or `{ _id, title }` keeps working unmodified.
 */

import { supabase } from '../config/supabase.js';

// ── case conversion helpers ────────────────────────────────────────────────

const toSnake = (str) => str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const toCamel = (str) => str.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());

// Payment.submission was a Mongoose ref field named plainly `submission`
// (holding a Submission ObjectId), unlike every other ref field in this
// codebase which already ends in `...Id` (orderId, verifiedBy, etc. map to
// snake_case naturally). The Postgres column is `submission_id` for
// consistency with the FK naming convention, so this is the one field that
// needs an explicit rename at the JS <-> SQL boundary in both directions.
const FIELD_RENAME_TO_SQL = { submission: 'submission_id' };
const FIELD_RENAME_FROM_SQL = { submission_id: 'submission' };

function keysToSnake(obj) {
  if (Array.isArray(obj)) return obj.map(keysToSnake);
  if (obj === null || typeof obj !== 'object' || obj instanceof Date) return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k === '_id') {
      out.id = v;
    } else if (FIELD_RENAME_TO_SQL[k]) {
      out[FIELD_RENAME_TO_SQL[k]] = v;
    } else {
      // Only the top-level key is renamed. Nested object/array VALUES
      // (authors: [{name, email}], hero: {primaryButtonUrl}, heroImages:
      // [{url, alt}], etc.) are passed through completely unchanged —
      // their inner keys stay camelCase, matching what the frontend
      // types (types/index.ts) and JSONB columns both expect.
      out[toSnake(k)] = v;
    }
  }
  return out;
}

function rowToDoc(row) {
  if (row === null || row === undefined) return null;
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    if (k === 'fts') continue; // internal full-text search column, not part of the original Mongoose shape
    if (k === 'id') {
      out._id = v;
    } else if (FIELD_RENAME_FROM_SQL[k]) {
      out[FIELD_RENAME_FROM_SQL[k]] = v;
    } else {
      out[toCamel(k)] = v;
    }
  }
  return out;
}

// ── operator translation ($ne, $gt, $regex, $text, ...) ────────────────────

/**
 * Applies a Mongoose-style filter object to a PostgREST query builder.
 * Supports the exact operator set used across this codebase.
 */
// PostgREST filter methods (.eq/.gt/.lt/...) build query-string values from
// whatever is passed in; a raw JS Date serializes via .toString() (e.g.
// "Thu Jul 23 2026 00:00:00 GMT+0000...") which Postgres cannot parse as a
// timestamp. Mongoose accepted raw Date objects transparently in filters
// (e.g. `{ createdAt: { $gte: startOfToday } }` in dashboardController.js),
// so every Date operand is normalized to an ISO string here to preserve
// that behavior exactly.
function normalizeFilterValue(v) {
  return v instanceof Date ? v.toISOString() : v;
}

function applyFilter(query, filter, fullTextColumns) {
  if (!filter) return query;
  for (const [key, value] of Object.entries(filter)) {
    if (key === '$text') {
      // { $text: { $search: "..." } } -> websearch_to_tsquery over the
      // table's full-text index (see idx_*_fts in 001_schema.sql).
      const term = value.$search;
      if (term && fullTextColumns) {
        query = query.textSearch(fullTextColumns, term, {
          type: 'websearch',
          config: 'english',
        });
      }
      continue;
    }

    const column = key === '_id' ? 'id' : (FIELD_RENAME_TO_SQL[key] || toSnake(key));

    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      for (const [op, opVal] of Object.entries(value)) {
        switch (op) {
          case '$ne':
            query = query.neq(column, normalizeFilterValue(opVal instanceof Object && opVal._id ? opVal._id : opVal));
            break;
          case '$lt':
            query = query.lt(column, normalizeFilterValue(opVal));
            break;
          case '$lte':
            query = query.lte(column, normalizeFilterValue(opVal));
            break;
          case '$gt':
            query = query.gt(column, normalizeFilterValue(opVal));
            break;
          case '$gte':
            query = query.gte(column, normalizeFilterValue(opVal));
            break;
          case '$in':
            query = query.in(column, opVal.map(normalizeFilterValue));
            break;
          case '$regex': {
            // Mongoose $regex on these fields is always used for prefix
            // matching (e.g. `^TC-SUB-2026-`), so ILIKE with the anchors
            // stripped + a trailing wildcard is an exact behavioral match.
            const pattern = String(opVal).replace(/^\^/, '').replace(/\$$/, '');
            query = query.ilike(column, `${pattern}%`);
            break;
          }
          default:
            break;
        }
      }
    } else {
      query = query.eq(column, normalizeFilterValue(value instanceof Object && value._id ? value._id : value));
    }
  }
  return query;
}

// Maps a Postgres unique-constraint violation's constraint name to the
// human field name it protects, so errorHandler.js can produce the same
// "That {field} is already in use." message Mongoose's duplicate-key
// (code 11000) error used to. Falls back to a generic label if unknown.
const UNIQUE_CONSTRAINT_FIELD = {
  admins_email_key: 'email',
  articles_slug_key: 'slug',
  articles_paper_id_key: 'paper_id',
  issues_volume_issue_key: 'volume/issue combination',
  news_slug_key: 'slug',
  newsletters_email_key: 'email',
  submissions_tracking_id_key: 'tracking id',
  settings_singleton_key_key: 'singleton key',
  uq_issues_volume_issue: 'volume/issue combination',
};

function throwIfError(error, context) {
  if (error) {
    const err = new Error(`[Supabase] ${context}: ${error.message}`);
    err.cause = error;
    // Postgres SQLSTATE codes, surfaced the same way MongoDB's `err.code`
    // was: 23505 = unique_violation (was Mongo code 11000), 23502 =
    // not_null_violation, 23514 = check_violation (was Mongoose
    // ValidationError). See middleware/errorHandler.js for how these
    // are translated into user-facing responses.
    err.pgCode = error.code;
    if (error.code === '23505') {
      const field = UNIQUE_CONSTRAINT_FIELD[error.details?.match(/^Key \((\w+)\)/)?.[1]]
        || UNIQUE_CONSTRAINT_FIELD[Object.keys(UNIQUE_CONSTRAINT_FIELD).find((k) => error.message?.includes(k))]
        || (error.details?.match(/^Key \((\w+)\)/)?.[1]?.replace(/_/g, ' '))
        || 'field';
      err.duplicateField = field;
    }
    throw err;
  }
}

/**
 * A thenable, chainable query builder mimicking a Mongoose Query.
 * `await` it directly, or chain .sort()/.skip()/.limit()/.select() first —
 * exactly like `Model.find(filter).sort({ createdAt: -1 }).limit(10)`.
 */
class ChainableQuery {
  constructor(table, mode, filter, { single = false, fullTextColumns, populateConfig, afterFind } = {}) {
    this.table = table;
    this.mode = mode; // 'find' | 'findOne'
    this.filter = filter || {};
    this.single = single;
    this.fullTextColumns = fullTextColumns;
    this.populateConfig = populateConfig || {};
    this.afterFind = afterFind;
    this._sort = null;
    this._skip = 0;
    this._limit = null;
    this._selectCols = '*';
    this._populatePaths = [];
  }

  sort(spec) {
    // Accepts Mongoose-style { field: 1 | -1 } or '-field' shorthand.
    this._sort = spec;
    return this;
  }

  skip(n) {
    this._skip = n;
    return this;
  }

  limit(n) {
    this._limit = n;
    return this;
  }

  select(_cols) {
    // Controllers in this codebase never restrict fields on read (only use
    // .select('-password') style once, handled in the Admin model directly),
    // so this is a documented no-op that preserves chainability.
    return this;
  }

  populate(path) {
    this._populatePaths.push(path);
    return this;
  }

  lean() {
    // Rows returned here are already plain objects, not Mongoose documents.
    return this;
  }

  async _run() {
    let query = supabase.from(this.table).select('*');
    query = applyFilter(query, this.filter, this.fullTextColumns);

    if (this._sort) {
      for (const [field, dir] of Object.entries(this._sort)) {
        const column = field === '_id' ? 'id' : toSnake(field);
        query = query.order(column, { ascending: dir === 1 || dir === 'asc' });
      }
    }

    if (this._limit !== null && this._skip) {
      query = query.range(this._skip, this._skip + this._limit - 1);
    } else if (this._limit !== null) {
      query = query.range(0, this._limit - 1);
    } else if (this._skip) {
      query = query.range(this._skip, this._skip + 100000);
    }

    if (this.mode === 'findOne' || this.single) {
      const { data, error } = await query.maybeSingle();
      throwIfError(error, `${this.mode} on ${this.table}`);
      let doc = rowToDoc(data);
      if (doc && this.afterFind) doc = await this.afterFind(doc);
      if (doc) doc = await this._applyPopulate(doc);
      return doc;
    }

    const { data, error } = await query;
    throwIfError(error, `find on ${this.table}`);
    let docs = (data || []).map(rowToDoc);
    if (this.afterFind) {
      docs = await Promise.all(docs.map((d) => this.afterFind(d)));
    }
    if (this._populatePaths.length) {
      docs = await Promise.all(docs.map((d) => this._applyPopulate(d)));
    }
    return docs;
  }

  async _applyPopulate(doc) {
    for (const path of this._populatePaths) {
      const config = this.populateConfig[path];
      if (!config) continue;
      doc = await config(doc);
    }
    return doc;
  }

  then(resolve, reject) {
    return this._run().then(resolve, reject);
  }

  catch(reject) {
    return this._run().catch(reject);
  }
}

/**
 * A live "document" object mimicking a Mongoose document instance, so that
 * controller code like:
 *   const admin = await Admin.findOne({ email });
 *   admin.lastLoginAt = new Date();
 *   await admin.save();
 * keeps working unmodified.
 */
function attachSave(doc, table) {
  if (!doc) return doc;
  Object.defineProperty(doc, 'save', {
    enumerable: false,
    value: async function save() {
      const { _id, createdAt, ...rest } = this;
      const payload = keysToSnake(rest);
      const { data, error } = await supabase
        .from(table)
        .update(payload)
        .eq('id', _id)
        .select()
        .single();
      throwIfError(error, `save on ${table}`);
      const fresh = rowToDoc(data);
      Object.assign(this, fresh);
      return this;
    },
  });
  return doc;
}

/**
 * Builds a Mongoose-model-like object for a given Postgres table.
 *
 * @param {string} table - Postgres table name (snake_case, plural)
 * @param {object} opts
 * @param {string} [opts.fullTextColumns] - name of the tsvector expression
 *   index to use for `$text` search (matches an idx_*_fts index in the
 *   schema); pass the same generated-column style string used in
 *   001_schema.sql via a Postgres function, OR omit and $text becomes a
 *   graceful no-op filter (see articleController usage — always paired
 *   with other filters).
 * @param {object} [opts.populateConfig] - map of path -> async (doc) => doc
 *   used to emulate `.populate('field')`.
 * @param {function} [opts.afterFind] - async (doc) => doc, applied to every
 *   row returned by find/findOne/findById (e.g. to hydrate nested data
 *   that isn't a real FK populate, like NavItem.children).
 */
function createModel(table, opts = {}) {
  const { fullTextColumns, populateConfig, afterFind } = opts;

  async function maybeAfterFind(doc) {
    if (!doc || !afterFind) return doc;
    return afterFind(doc);
  }
  async function maybeAfterFindMany(docs) {
    if (!afterFind) return docs;
    return Promise.all(docs.map(afterFind));
  }

  const model = {
    find(filter = {}) {
      return new ChainableQuery(table, 'find', filter, { fullTextColumns, populateConfig, afterFind });
    },

    findOne(filter = {}) {
      const q = new ChainableQuery(table, 'findOne', filter, { fullTextColumns, populateConfig, afterFind });
      const originalRun = q._run.bind(q);
      q._run = async () => attachSave(await originalRun(), table);
      return q;
    },

    findById(id) {
      const q = new ChainableQuery(table, 'findOne', { _id: id }, { fullTextColumns, populateConfig, afterFind });
      const originalRun = q._run.bind(q);
      q._run = async () => attachSave(await originalRun(), table);
      return q;
    },

    async create(data) {
      if (Array.isArray(data)) {
        return model.insertMany(data);
      }
      const payload = keysToSnake(data);
      const { data: row, error } = await supabase.from(table).insert(payload).select().single();
      throwIfError(error, `create on ${table}`);
      return attachSave(await maybeAfterFind(rowToDoc(row)), table);
    },

    async insertMany(items) {
      const payload = items.map(keysToSnake);
      const { data, error } = await supabase.from(table).insert(payload).select();
      throwIfError(error, `insertMany on ${table}`);
      return maybeAfterFindMany((data || []).map(rowToDoc));
    },

    async countDocuments(filter = {}) {
      let query = supabase.from(table).select('id', { count: 'exact', head: true });
      query = applyFilter(query, filter, fullTextColumns);
      const { count, error } = await query;
      throwIfError(error, `countDocuments on ${table}`);
      return count || 0;
    },

    async findByIdAndUpdate(id, update, options = {}) {
      return model.findOneAndUpdate({ _id: id }, update, options);
    },

    async findOneAndUpdate(filter, update, options = {}) {
      const setOps = {};
      let target = null;

      // $inc, $push, $pull need the current row first (read-modify-write) —
      // exactly what Mongo does atomically server-side; here we do it as a
      // fetch-then-update, which is safe for this app's traffic patterns
      // (admin-driven CRUD and view/download counters, not high-concurrency
      // financial ledgers).
      const needsCurrent = update.$inc || update.$push || update.$pull;
      if (needsCurrent) {
        target = await model.findOne(filter);
        if (!target) return options.upsert ? model._upsert(filter, update) : null;
      }

      if (update.$inc) {
        for (const [field, amount] of Object.entries(update.$inc)) {
          setOps[field] = (target[field] || 0) + amount;
        }
      }
      if (update.$push) {
        for (const [field, value] of Object.entries(update.$push)) {
          const current = Array.isArray(target[field]) ? target[field] : [];
          setOps[field] = [...current, value];
        }
      }
      if (update.$pull) {
        for (const [field, condition] of Object.entries(update.$pull)) {
          const current = Array.isArray(target[field]) ? target[field] : [];
          setOps[field] = current.filter((item) => {
            if (condition && typeof condition === 'object') {
              return !Object.entries(condition).every(([k, v]) => item[k] === v);
            }
            return item !== condition;
          });
        }
      }

      // Plain field updates (the common case: findByIdAndUpdate(id, {title, ...}))
      const { $inc, $push, $pull, $set, ...plain } = update;
      Object.assign(setOps, $set || {}, plain);

      if (Object.keys(setOps).length === 0) {
        return target || model.findOne(filter);
      }

      const payload = keysToSnake(setOps);
      let query = supabase.from(table).update(payload);
      query = applyFilter(query, filter, fullTextColumns);
      const { data, error } = await query.select();
      throwIfError(error, `findOneAndUpdate on ${table}`);

      if ((!data || data.length === 0) && options.upsert) {
        return model._upsert(filter, { ...filter, ...setOps });
      }

      const row = data && data[0] ? data[0] : null;
      return attachSave(await maybeAfterFind(rowToDoc(row)), table);
    },

    async _upsert(filter, fullDoc) {
      const payload = keysToSnake({ ...filter, ...fullDoc });
      delete payload._id;
      const { data, error } = await supabase.from(table).insert(payload).select().single();
      throwIfError(error, `upsert on ${table}`);
      return attachSave(await maybeAfterFind(rowToDoc(data)), table);
    },

    async findByIdAndDelete(id) {
      const { data, error } = await supabase.from(table).delete().eq('id', id).select();
      throwIfError(error, `findByIdAndDelete on ${table}`);
      const row = data && data[0] ? data[0] : null;
      return rowToDoc(row);
    },

    async deleteOne(filter) {
      let query = supabase.from(table).delete();
      query = applyFilter(query, filter, fullTextColumns);
      const { error } = await query;
      throwIfError(error, `deleteOne on ${table}`);
      return { acknowledged: true };
    },

    async updateMany(filter, update) {
      // Guard: Supabase (PostgREST) refuses UPDATE without a WHERE clause.
      // If the caller passes an empty filter, skip the DB call entirely —
      // there is nothing to update (matches Mongoose behaviour: updateMany({}, …)
      // on an empty collection is a no-op).
      if (!filter || Object.keys(filter).length === 0) {
        return { acknowledged: true, modifiedCount: 0 };
      }

      const { $set, ...plain } = update;
      const payload = keysToSnake({ ...plain, ...($set || {}) });
      let query = supabase.from(table).update(payload);
      query = applyFilter(query, filter, fullTextColumns);
      // Use plain .select() — the count option is not valid on update() queries
      // in Supabase JS v2 and can cause the WHERE clause to be lost.
      const { data, error } = await query.select();
      throwIfError(error, `updateMany on ${table}`);
      return { acknowledged: true, modifiedCount: data?.length || 0 };
    },
  };

  return model;
}

export { createModel, rowToDoc, keysToSnake, supabase };
