import { createModel } from '../lib/queryModel.js';

function generateSlug(title) {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') +
    '-' +
    Date.now().toString(36)
  );
}

const base = createModel('news', { fullTextColumns: 'fts' });

const News = {
  ...base,
  async create(data) {
    const payload = { ...data };
    if (!payload.slug && payload.title) {
      payload.slug = generateSlug(payload.title);
    }
    return base.create(payload);
  },
};

export default News;
