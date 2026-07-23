// Vercel serverless entrypoint. Vercel's Node.js runtime treats any default
// export from a file under /api as a request handler — an Express app
// instance satisfies that signature directly (it's just a function of
// (req, res)), so no adapter library is needed.
//
// This file does NOT change any API behavior, routes, or business logic —
// it only wraps the same createApp() used by src/server.js for local/
// traditional hosting, so `/api/*` and `/api/admin/*` behave identically
// in both environments.
import dotenv from 'dotenv';
dotenv.config({ quiet: true });

import { createApp } from '../src/app.js';

const app = createApp();

export default app;
