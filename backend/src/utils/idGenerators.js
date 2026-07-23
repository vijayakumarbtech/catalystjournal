import Submission from '../models/Submission.js';
import Article from '../models/Article.js';

// Generates a human-readable, sequential-looking tracking ID for a new
// submission, e.g. TC-SUB-2026-000123. Falls back gracefully under
// concurrent writes since MongoDB's unique index on trackingId is the
// real safety net — a collision here just means retrying the count.
export async function generateTrackingId() {
  const year = new Date().getFullYear();
  const count = await Submission.countDocuments({
    trackingId: { $regex: `^TC-SUB-${year}-` },
  });
  const seq = String(count + 1).padStart(6, '0');
  return `TC-SUB-${year}-${seq}`;
}

// Generates a paper reference number for published articles, e.g. TC-2026-0042.
export async function generatePaperId() {
  const year = new Date().getFullYear();
  const count = await Article.countDocuments({
    paperId: { $regex: `^TC-${year}-` },
  });
  const seq = String(count + 1).padStart(4, '0');
  return `TC-${year}-${seq}`;
}

export function slugify(text) {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') +
    '-' +
    Math.random().toString(36).slice(2, 7)
  );
}
