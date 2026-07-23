import Faq from '../models/Faq.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

export const listFaqs = asyncHandler(async (req, res) => {
  const faqs = await Faq.find().sort({ order: 1 });
  res.json({ success: true, data: faqs });
});

export const createFaq = asyncHandler(async (req, res) => {
  const faq = await Faq.create(req.body);
  res.status(201).json({ success: true, data: faq });
});

export const updateFaq = asyncHandler(async (req, res) => {
  const faq = await Faq.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!faq) throw new ApiError(404, 'FAQ not found.');
  res.json({ success: true, data: faq });
});

export const deleteFaq = asyncHandler(async (req, res) => {
  const faq = await Faq.findByIdAndDelete(req.params.id);
  if (!faq) throw new ApiError(404, 'FAQ not found.');
  res.json({ success: true, data: null });
});
