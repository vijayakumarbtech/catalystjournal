# CHANGELOG

## Modified Files

### `frontend/src/lib/api.ts`
- **Reason:** The `VITE_API_URL` environment variable was incorrectly forming requests when users deployed to Vercel without explicitly appending `/api`. This caused all API calls to fail with 404s, which in turn resulted in missing CORS headers and browser errors. The logic was updated to automatically append `/api` if it is missing, ensuring the frontend always correctly addresses the backend API routes.

### `backend/src/app.js`
- **Reason:** The CORS configuration used exact string matching `allowedOrigins.includes(origin)`. If the `CORS_ORIGINS` environment variable included a trailing slash (e.g., `https://frontend.vercel.app/`), it would reject the request. Additionally, when a request was rejected by CORS, the backend threw an Error (`new Error('Not allowed by CORS')`), which triggered a 500 Internal Server Error without CORS headers, causing an ambiguous browser error. The CORS middleware was updated to handle trailing slashes robustly and return `false` gracefully, allowing proper CORS preflight failures when intended, and ensuring seamless communication otherwise.

## Required Environment Variables

### Render (Backend)
- `CORS_ORIGINS`: Comma-separated list of allowed frontend URLs (e.g., `https://your-frontend.vercel.app`).
- `PORT`: (Optional) Automatically provided by Render.
- `NODE_ENV`: Should be set to `production`.
- `SUPABASE_URL`: Your Supabase project URL.
- `SUPABASE_SERVICE_KEY`: Your Supabase service role key (for backend admin operations).
- `JWT_SECRET`: A secure random string for signing admin JSON Web Tokens.

### Vercel (Frontend)
- `VITE_API_URL`: The URL of your Render backend API (e.g., `https://your-backend.onrender.com/api` or `https://your-backend.onrender.com`).
- `VITE_SUPABASE_URL`: Your Supabase project URL.
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key (public safe).

## Deployment Steps
1. Deploy the backend to Render, ensuring all environment variables above are configured.
2. Deploy the frontend to Vercel, ensuring the `VITE_API_URL` points to the Render backend domain.
3. The changes applied will automatically resolve any path mismatch or CORS errors even if the trailing slashes or `/api` suffix were accidentally omitted during configuration.
