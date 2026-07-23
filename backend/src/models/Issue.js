import { createModel, supabase, rowToDoc } from '../lib/queryModel.js';
import Article from './Article.js';

const base = createModel('issues', {
  populateConfig: {
    // .populate('articles') -> replace the array of article _id strings
    // (already attached by afterFind, see below) with full Article docs,
    // in issue_articles.position order — matching what the frontend's
    // Issue.articles: Article[] type expects.
    articles: async (doc) => {
      const ids = doc.articles || [];
      if (ids.length === 0) return doc;
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .in('id', ids);
      if (error) throw new Error(`[Supabase] populate articles on issues: ${error.message}`);
      const byId = new Map((data || []).map((row) => [row.id, rowToDoc(row)]));
      doc.articles = ids.map((id) => byId.get(id)).filter(Boolean);
      return doc;
    },
  },
  // Every issue read (populated or not) needs `articles` set to the
  // ordered array of article IDs, since Mongoose always stored that array
  // directly on the document (populate just swapped IDs for full docs on
  // top of it). Without this, non-populated reads would be missing the
  // field entirely.
  afterFind: async (doc) => {
    const { data, error } = await supabase
      .from('issue_articles')
      .select('article_id, position')
      .eq('issue_id', doc._id)
      .order('position', { ascending: true });
    if (error) throw new Error(`[Supabase] loading issue_articles: ${error.message}`);
    doc.articles = (data || []).map((row) => row.article_id);
    return doc;
  },
});

async function syncArticles(issueId, articleIds) {
  if (!Array.isArray(articleIds)) return;
  await supabase.from('issue_articles').delete().eq('issue_id', issueId);
  if (articleIds.length === 0) return;
  const rows = articleIds.map((articleId, position) => ({
    issue_id: issueId,
    article_id: articleId,
    position,
  }));
  const { error } = await supabase.from('issue_articles').insert(rows);
  if (error) throw new Error(`[Supabase] syncing issue_articles: ${error.message}`);
}

const Issue = {
  ...base,

  async create(data) {
    const { articles, ...rest } = data;
    const issue = await base.create(rest);
    if (articles) {
      await syncArticles(issue._id, articles);
      issue.articles = articles;
    }
    return issue;
  },

  async findByIdAndUpdate(id, update, options) {
    const { articles, ...rest } = update;
    const issue = await base.findByIdAndUpdate(id, rest, options);
    if (!issue) return issue;
    if (articles) {
      await syncArticles(id, articles);
      issue.articles = articles;
    }
    return issue;
  },
};

export default Issue;
