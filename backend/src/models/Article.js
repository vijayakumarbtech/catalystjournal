import { createModel } from '../lib/queryModel.js';

function generateSlug(title) {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') +
    '-' +
    Math.random().toString(36).slice(2, 7)
  );
}

const base = createModel('articles', {
  fullTextColumns: 'fts', // see idx_articles_fts in 001_schema.sql
});

// Mongoose auto-generated `slug` from `title` in a pre('validate') hook
// whenever slug was omitted. articleController.js relies on this (it never
// sets slug itself on create) — reproduced here at the create() boundary.
const Article = {
  ...base,
  async create(data) {
    const payload = { ...data };
    if (!payload.slug && payload.title) {
      payload.slug = generateSlug(payload.title);
    }
    return base.create(payload);
  },
};

export default Article;
