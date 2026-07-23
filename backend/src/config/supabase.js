import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  // Fail fast and loud, same spirit as the old Mongo connection guard in
  // config/db.js — better than a cryptic failure on the first query.
  // eslint-disable-next-line no-console
  console.error(
    'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.'
  );
}

// The backend always talks to Postgres with the SERVICE ROLE key. It runs
// its own JWT-based admin auth (see middleware/auth.js, unchanged) and
// enforces authorization at the Express route layer — exactly like the old
// Mongoose-based backend did. The service role key bypasses Row Level
// Security, which is expected: RLS (sql/003_rls.sql) is a defense-in-depth
// safety net for the anon key, not the access-control mechanism for this API.
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const connectDB = async () => {
  // Kept as an async function named connectDB so server.js's startup
  // sequence (await connectDB()) needs no changes. Supabase's client is
  // stateless/HTTP-based (no persistent connection to open), so this just
  // verifies credentials work before the server starts accepting traffic.
  const { error } = await supabase.from('settings').select('id').limit(1);
  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows found, which is fine (settings singleton may not
    // exist yet). Any other error means something is actually wrong.
    throw new Error(`Supabase connection check failed: ${error.message}`);
  }
  // eslint-disable-next-line no-console
  console.log('Supabase Postgres connected');
};

export { supabase, connectDB };
