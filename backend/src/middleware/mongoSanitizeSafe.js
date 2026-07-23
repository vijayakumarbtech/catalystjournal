// Strips `$`-prefixed operator keys (e.g. `$ne`, `$gt`) from request bodies
// and params before they reach any controller. This project has migrated
// from MongoDB to Supabase Postgres, where these keys have no special
// meaning to the database driver — but this stays in place as a harmless,
// defense-in-depth input sanitizer, and because no controller in this
// codebase ever merges raw req.body/req.query keys into a query filter
// (filters are always built field-by-field from named, destructured
// values — see e.g. articleController.js), there is nothing to migrate
// here; keeping this unchanged also avoids touching unrelated security
// middleware, per the migration's "don't touch anything not required"
// mandate.
//
// express-mongo-sanitize's default middleware reassigns req.query, which
// Express 5 exposes as a getter-only property (no setter) — that throws
// a TypeError on every request. Express 5 also defaults to the 'simple'
// query parser (no qs-style bracket nesting), which already closes off
// most of the classic `?field[$ne]=` injection vector for query strings.
// So here we sanitize req.body and req.params in place (safe, since those
// are plain mutable objects) and leave req.query alone.
import { sanitize } from 'express-mongo-sanitize';

export function mongoSanitizeSafe(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    sanitize(req.body);
  }
  if (req.params && typeof req.params === 'object') {
    sanitize(req.params);
  }
  next();
}
