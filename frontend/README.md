# The Catalyst — Frontend

React + Vite + TypeScript + Tailwind CSS SPA. See the repo root `README.md`
for full project setup, and `docs/DEPLOYMENT.md` for deploying to Vercel.

## Development

```bash
npm install
npm run dev
```

Runs on http://localhost:5173 and proxies `/api` requests to a backend
running on http://localhost:5000 (see `vite.config.ts`).

## Build

```bash
npm run build   # outputs to dist/
npm run preview # preview the production build locally
```

## Environment Variables

Copy `.env.example` to `.env` and set `VITE_API_URL` if deploying the
backend somewhere other than the local dev proxy.
