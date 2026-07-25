import Article from '../models/Article.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { slugify, generatePaperId } from '../utils/idGenerators.js';
import { supabase } from '../lib/queryModel.js';

const PAGE_SIZE = 12;

// ── Public ────────────────────────────────────────────────────────────────

export const listArticles = asyncHandler(async (req, res) => {
  const { search, subject, year, volume, issue, page = 1 } = req.query;
  const filter = { status: 'published' };
  if (subject) filter.subject = subject;
  if (year) filter.year = Number(year);
  if (volume) filter.volume = Number(volume);
  if (issue) filter.issue = Number(issue);
  if (search) filter.$text = { $search: search };

  const skip = (Number(page) - 1) * PAGE_SIZE;
  const [items, totalCount] = await Promise.all([
    Article.find(filter).sort({ publishedAt: -1 }).skip(skip).limit(PAGE_SIZE),
    Article.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    page: Number(page),
    totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    totalCount,
  });
});

export const getFeaturedArticles = asyncHandler(async (req, res) => {
  let articles = await Article.find({ status: 'published', isFeatured: true })
    .sort({ publishedAt: -1 })
    .limit(6);

  if (articles.length === 0) {
    articles = await Article.find({ status: 'published' }).sort({ publishedAt: -1 }).limit(6);
  }

  res.json({ success: true, data: articles });
});

export const getArticleBySlug = asyncHandler(async (req, res) => {
  const article = await Article.findOneAndUpdate(
    { slug: req.params.slug, status: 'published' },
    { $inc: { viewCount: 1 } },
    { new: true }
  );
  if (!article) throw new ApiError(404, 'Article not found.');
  res.json({ success: true, data: article });
});

export const incrementDownloadCount = asyncHandler(async (req, res) => {
  const article = await Article.findByIdAndUpdate(
    req.params.id,
    { $inc: { downloadCount: 1 } },
    { new: true }
  );
  if (!article) throw new ApiError(404, 'Article not found.');
  res.json({ success: true, data: { downloadCount: article.downloadCount } });
});

export const searchArticles = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || !String(q).trim()) {
    return res.json({ success: true, data: [] });
  }
  // Search by title, DOI, keywords (via full-text search or ilike on title+doi)
  const searchTerm = `%${String(q).trim()}%`;
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .or(`title.ilike.${searchTerm},doi.ilike.${searchTerm}`)
    .limit(20);
  if (error) throw new Error(error.message);

  const { rowToDoc } = await import('../lib/queryModel.js');
  const results = (data || []).map(rowToDoc);
  res.json({ success: true, data: results });
});

// ── Admin ────────────────────────────────────────────────────────────────

export const adminListArticles = asyncHandler(async (req, res) => {
  const articles = await Article.find().sort({ createdAt: -1 });
  res.json({ success: true, data: articles, page: 1, totalPages: 1, totalCount: articles.length });
});

function parseAuthors(authorsInput) {
  // Already an array of objects - return as is
  if (Array.isArray(authorsInput) && authorsInput.length > 0 && typeof authorsInput[0] === 'object') {
    return authorsInput;
  }
  // Array of strings
  if (Array.isArray(authorsInput)) {
    return authorsInput.map((name) => (typeof name === 'string' ? { name } : name));
  }
  // JSON string (from multipart/form-data)
  if (typeof authorsInput === 'string') {
    try {
      const parsed = JSON.parse(authorsInput);
      return parseAuthors(parsed);
    } catch {
      // Fall back to comma-separated names
      return String(authorsInput)
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean)
        .map((name) => ({ name }));
    }
  }
  return [];
}

function parseKeywords(keywordsInput) {
  if (Array.isArray(keywordsInput)) return keywordsInput.map(String).filter(Boolean);
  if (typeof keywordsInput === 'string') {
    try {
      const parsed = JSON.parse(keywordsInput);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      // comma separated
    }
    return keywordsInput.split(',').map((k) => k.trim()).filter(Boolean);
  }
  return [];
}

/**
 * Link an article to an issue (via issue_articles join table).
 * If issueId is provided and valid, insert/upsert the record.
 * The article's volume/issue/year are also synced from the issue record.
 */
async function linkArticleToIssue(articleId, issueId) {
  if (!issueId) return null;

  // Fetch the issue to get volume/issue/year
  const { data: issueRows } = await supabase
    .from('issues')
    .select('id, volume, issue, year')
    .eq('id', issueId)
    .limit(1);

  const issueRow = issueRows?.[0];
  if (!issueRow) return null;

  // Remove old links for this article (article can only belong to one issue at a time)
  await supabase.from('issue_articles').delete().eq('article_id', articleId);

  // Get next position for this issue
  const { data: posRows } = await supabase
    .from('issue_articles')
    .select('position')
    .eq('issue_id', issueId)
    .order('position', { ascending: false })
    .limit(1);
  const nextPos = (posRows?.[0]?.position ?? -1) + 1;

  // Insert new link
  const { error } = await supabase.from('issue_articles').insert({
    issue_id: issueId,
    article_id: articleId,
    position: nextPos,
  });
  if (error) throw new Error(`[Supabase] linking article to issue: ${error.message}`);

  return issueRow;
}

export const createArticle = asyncHandler(async (req, res) => {
  const paperId = await generatePaperId();

  // Handle PDF file upload (from multipart) or plain URL
  let pdfUrl = req.body.pdfUrl || '';
  if (req.files) {
    const filesArray = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
    const pdfFile = filesArray.find((f) => f.fieldname === 'pdf');
    const thumbFile = filesArray.find((f) => f.fieldname === 'thumbnail');
    if (pdfFile) pdfUrl = pdfFile.publicUrl || pdfFile.path;
    if (thumbFile) req.body.thumbnail = thumbFile.publicUrl || thumbFile.path;
  }

  const { issueId, ...rest } = req.body;

  const article = await Article.create({
    ...rest,
    pdfUrl,
    authors: parseAuthors(rest.authors),
    keywords: parseKeywords(rest.keywords),
    slug: slugify(rest.title),
    paperId,
    volume: rest.volume ? Number(rest.volume) : 1,
    issue: rest.issue ? Number(rest.issue) : 1,
    year: rest.year ? Number(rest.year) : new Date().getFullYear(),
  });

  // Automatically link article to selected issue
  if (issueId) {
    const issueRow = await linkArticleToIssue(article._id, issueId);
    if (issueRow) {
      // Sync volume/issue/year from the actual issue
      await supabase
        .from('articles')
        .update({ volume: issueRow.volume, issue: issueRow.issue, year: issueRow.year })
        .eq('id', article._id);
      article.volume = issueRow.volume;
      article.issue = issueRow.issue;
      article.year = issueRow.year;
    }
  }

  res.status(201).json({ success: true, data: article });
});

export const updateArticle = asyncHandler(async (req, res) => {
  // Handle PDF file upload
  let pdfUrl = req.body.pdfUrl;
  if (req.files) {
    const filesArray = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
    const pdfFile = filesArray.find((f) => f.fieldname === 'pdf');
    const thumbFile = filesArray.find((f) => f.fieldname === 'thumbnail');
    if (pdfFile) pdfUrl = pdfFile.publicUrl || pdfFile.path;
    if (thumbFile) req.body.thumbnail = thumbFile.publicUrl || thumbFile.path;
  }

  const { issueId, ...rest } = req.body;
  const updates = { ...rest };
  if (pdfUrl) updates.pdfUrl = pdfUrl;
  if (updates.authors) updates.authors = parseAuthors(updates.authors);
  if (updates.keywords) updates.keywords = parseKeywords(updates.keywords);
  if (updates.volume) updates.volume = Number(updates.volume);
  if (updates.issue) updates.issue = Number(updates.issue);
  if (updates.year) updates.year = Number(updates.year);

  const article = await Article.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!article) throw new ApiError(404, 'Article not found.');

  // Re-link article to issue if issueId was provided
  if (issueId) {
    const issueRow = await linkArticleToIssue(article._id, issueId);
    if (issueRow) {
      await supabase
        .from('articles')
        .update({ volume: issueRow.volume, issue: issueRow.issue, year: issueRow.year })
        .eq('id', article._id);
    }
  }

  res.json({ success: true, data: article });
});

export const deleteArticle = asyncHandler(async (req, res) => {
  // Remove issue link first (cascade should handle it, but explicit is safer)
  await supabase.from('issue_articles').delete().eq('article_id', req.params.id);
  const article = await Article.findByIdAndDelete(req.params.id);
  if (!article) throw new ApiError(404, 'Article not found.');
  res.json({ success: true, data: null });
});
