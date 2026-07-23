import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';

import publicRoutes from './routes/publicRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiters.js';
import { mongoSanitizeSafe } from './middleware/mongoSanitizeSafe.js';

export function createApp() {
  const app = express();

  // Render/Vercel sit behind a proxy; trust it so req.protocol and rate
  // limiting see the real client IP/scheme.
  app.set('trust proxy', 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  const allowedOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin(origin, callback) {
        // Allow non-browser requests (no origin header) and any configured origin.
        if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    })
  );

  app.use(compression());
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(mongoSanitizeSafe);
  app.use(generalLimiter);

  // Uploaded files (PDFs/images) are now stored in Supabase Storage and
  // served directly from its public CDN URLs — the old local
  // `/uploads` static file route is no longer needed. Every URL saved to
  // the database (Article.pdfUrl, Settings.logoUrl, etc.) is now already
  // an absolute Supabase Storage URL; the frontend's getImageUrl() helper
  // already passes absolute URLs through unchanged, so nothing else here
  // needed to change for this.

  app.get('/health', (req, res) => res.json({ success: true, status: 'ok' }));

  app.use('/api', publicRoutes);
  app.use('/api/admin', adminRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
