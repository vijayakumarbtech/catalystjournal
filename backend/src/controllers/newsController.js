import News from '../models/News.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const PAGE_SIZE = 10;

// Public: paginated news list with optional text search and sort order.
export const listNews = asyncHandler(async (req, res) => {
  const { search, page = 1, sort = 'newest' } = req.query;
  const filter = {};
  if (search) filter.$text = { $search: search };

  const skip = (Number(page) - 1) * PAGE_SIZE;
  const sortOrder = sort === 'oldest' ? 1 : -1;

  const [items, totalCount] = await Promise.all([
    News.find(filter).sort({ publishedAt: sortOrder }).skip(skip).limit(PAGE_SIZE),
    News.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    page: Number(page),
    totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    totalCount,
  });
});

// Admin: same list (no pagination limit, for table view).
export const adminListNews = asyncHandler(async (req, res) => {
  const news = await News.find().sort({ publishedAt: -1 });
  res.json({ success: true, data: news });
});

export const createNews = asyncHandler(async (req, res) => {
  // Clear the cached slug if the title changed so pre('validate') regenerates it.
  const body = { ...req.body };
  delete body.slug; // always auto-generate slug to avoid duplicates
  const news = await News.create(body);
  res.status(201).json({ success: true, data: news });
});

export const updateNews = asyncHandler(async (req, res) => {
  const news = await News.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!news) throw new ApiError(404, 'News post not found.');
  res.json({ success: true, data: news });
});

export const deleteNews = asyncHandler(async (req, res) => {
  const news = await News.findByIdAndDelete(req.params.id);
  if (!news) throw new ApiError(404, 'News post not found.');
  res.json({ success: true, data: null });
});

// Public: fetch a single news post by slug.
export const getNewsBySlug = asyncHandler(async (req, res) => {
  const news = await News.findOne({ slug: req.params.slug });
  if (!news) throw new ApiError(404, 'News post not found.');
  res.json({ success: true, data: news });
});
