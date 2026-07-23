import Article from '../models/Article.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { slugify, generatePaperId } from '../utils/idGenerators.js';

const PAGE_SIZE = 12;

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

  // Fall back to most recent published articles if none are flagged featured.
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

// --- Admin ---

export const adminListArticles = asyncHandler(async (req, res) => {
  const articles = await Article.find().sort({ createdAt: -1 });
  res.json({ success: true, data: articles, page: 1, totalPages: 1, totalCount: articles.length });
});

function parseAuthors(authorsInput) {
  if (Array.isArray(authorsInput)) return authorsInput;
  return String(authorsInput || '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({ name }));
}

function parseKeywords(keywordsInput) {
  if (Array.isArray(keywordsInput)) return keywordsInput;
  return String(keywordsInput || '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
}

export const createArticle = asyncHandler(async (req, res) => {
  const paperId = await generatePaperId();
  const article = await Article.create({
    ...req.body,
    authors: parseAuthors(req.body.authors),
    keywords: parseKeywords(req.body.keywords),
    slug: slugify(req.body.title),
    paperId,
  });
  res.status(201).json({ success: true, data: article });
});

export const updateArticle = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  if (updates.authors) updates.authors = parseAuthors(updates.authors);
  if (updates.keywords) updates.keywords = parseKeywords(updates.keywords);

  const article = await Article.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!article) throw new ApiError(404, 'Article not found.');
  res.json({ success: true, data: article });
});

export const deleteArticle = asyncHandler(async (req, res) => {
  const article = await Article.findByIdAndDelete(req.params.id);
  if (!article) throw new ApiError(404, 'Article not found.');
  res.json({ success: true, data: null });
});
