import rateLimit from 'express-rate-limit';

// General API rate limit — generous, mostly to blunt scraping/abuse.
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limit on paper submissions to prevent spam/flooding of uploads.
export const submissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  message: { success: false, message: 'Too many submissions from this IP. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limit on payment endpoints.
export const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: { success: false, message: 'Too many payment attempts. Please try again shortly.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Very strict limit on the admin login endpoint to slow brute-force attempts.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { success: false, message: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
