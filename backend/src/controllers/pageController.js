import CmsPage from '../models/CmsPage.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

export const getPageBySlug = asyncHandler(async (req, res) => {
  const page = await CmsPage.findOne({ slug: req.params.slug });
  if (!page) throw new ApiError(404, 'Page not found.');
  res.json({ success: true, data: page });
});

// --- Admin ---

export const adminGetPageBySlug = asyncHandler(async (req, res) => {
  const page = await CmsPage.findOne({ slug: req.params.slug });
  res.json({ success: true, data: page || null });
});

export const upsertPage = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { title, contentHtml, metaDescription } = req.body;

  const page = await CmsPage.findOneAndUpdate(
    { slug },
    { slug, title, contentHtml, metaDescription },
    { new: true, upsert: true, runValidators: true }
  );

  res.json({ success: true, data: page });
});
